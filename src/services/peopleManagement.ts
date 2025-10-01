import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import { Profile, UserRole } from '../types';

export interface PeopleStats {
  total_employees: number;
  active_employees: number;
  employees_by_role: Record<UserRole, number>;
  employees_by_level: Record<string, number>;
  employees_by_team: Record<string, number>;
  employees_without_manager: number;
  employees_without_team: number;
  average_points: number;
  top_performers: Profile[];
}

export interface TeamTransfer {
  profile_id: string;
  from_team_id: string | null;
  to_team_id: string | null;
  reason: string;
  transferred_by: string;
  transferred_at: string;
}

export interface PerformanceMetrics {
  profile_id: string;
  name: string;
  position: string;
  level: string;
  points: number;
  completed_pdis: number;
  average_competency_rating: number;
  achievements_count: number;
  last_activity: string;
  engagement_score: number;
}

export const peopleManagementService = {
  // Enhanced profile management
  async getProfilesWithDetails(filters?: {
    role?: UserRole;
    team_id?: string;
    manager_id?: string;
    status?: 'active' | 'inactive';
    search?: string;
  }): Promise<Profile[]> {
    console.log('👥 PeopleManagement: Getting profiles with details', filters);

    let query = supabase
      .from('profiles')
      .select(`
        *,
        team:teams(id, name, manager_id),
        manager:profiles!manager_id(id, name, position),
        direct_reports:profiles!manager_id(id, name, position, status)
      `);

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.manager_id) query = query.eq('manager_id', filters.manager_id);
    if (filters?.status) query = query.eq('status', filters.status);

    const profiles = await supabaseRequest(() => query.order('name'), 'getProfilesWithDetails');

    // Apply search filter client-side to avoid complex SQL
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      return profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm) ||
        profile.email.toLowerCase().includes(searchTerm) ||
        profile.position.toLowerCase().includes(searchTerm)
      );
    }

    return profiles;
  },

  async getProfileDetails(profileId: string): Promise<Profile & {
    team?: any;
    manager?: Profile;
    direct_reports?: Profile[];
    pdis_count?: number;
    achievements_count?: number;
    competencies_count?: number;
  }> {
    console.log('👥 PeopleManagement: Getting profile details for:', profileId);

    const profile = await supabaseRequest(() => supabase
      .from('profiles')
      .select(`
        *,
        team:teams(id, name, manager_id),
        manager:profiles!manager_id(id, name, position, email),
        direct_reports:profiles!manager_id(id, name, position, status)
      `)
      .eq('id', profileId)
      .single(), 'getProfileDetails');

    // Get additional stats
    const [pdisCount, achievementsCount, competenciesCount] = await Promise.all([
      supabase.from('pdis').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
      supabase.from('achievements').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
      supabase.from('competencies').select('id', { count: 'exact', head: true }).eq('profile_id', profileId)
    ]);

    return {
      ...profile,
      pdis_count: pdisCount.count || 0,
      achievements_count: achievementsCount.count || 0,
      competencies_count: competenciesCount.count || 0
    };
  },

  // Team management
  async transferToTeam(profileIds: string[], teamId: string | null, reason: string, transferredBy: string): Promise<void> {
    console.log('👥 PeopleManagement: Transferring profiles to team:', { profileIds, teamId, reason });

    try {
      // Update profiles
      await supabaseRequest(() => supabase
        .from('profiles')
        .update({ 
          team_id: teamId,
          updated_at: new Date().toISOString()
        })
        .in('id', profileIds), 'transferToTeam');

      // Log transfers
      const transfers = profileIds.map(profileId => ({
        profile_id: profileId,
        to_team_id: teamId,
        reason,
        transferred_by: transferredBy,
        transferred_at: new Date().toISOString()
      }));

      // In a real implementation, you might want to log these transfers
      console.log('👥 PeopleManagement: Transfers logged:', transfers);
    } catch (error) {
      console.error('👥 PeopleManagement: Error transferring to team:', error);
      throw error;
    }
  },

  async assignManager(profileIds: string[], managerId: string | null, assignedBy: string): Promise<void> {
    console.log('👥 PeopleManagement: Assigning manager:', { profileIds, managerId });

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ 
        manager_id: managerId,
        updated_at: new Date().toISOString()
      })
      .in('id', profileIds), 'assignManager');
  },

  async bulkUpdateStatus(profileIds: string[], status: 'active' | 'inactive', updatedBy: string): Promise<void> {
    console.log('👥 PeopleManagement: Bulk updating status:', { profileIds, status });

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', profileIds), 'bulkUpdateStatus');
  },

  async bulkUpdateRole(profileIds: string[], role: UserRole, updatedBy: string): Promise<void> {
    console.log('👥 PeopleManagement: Bulk updating role:', { profileIds, role });

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .in('id', profileIds), 'bulkUpdateRole');
  },

  // Statistics and analytics
  async getPeopleStats(): Promise<PeopleStats> {
    console.log('👥 PeopleManagement: Getting people statistics');

    try {
      const profiles = await this.getProfilesWithDetails();
      
      const stats: PeopleStats = {
        total_employees: profiles.length,
        active_employees: profiles.filter(p => p.status === 'active').length,
        employees_by_role: {
          admin: profiles.filter(p => p.role === 'admin').length,
          hr: profiles.filter(p => p.role === 'hr').length,
          manager: profiles.filter(p => p.role === 'manager').length,
          employee: profiles.filter(p => p.role === 'employee').length
        },
        employees_by_level: {},
        employees_by_team: {},
        employees_without_manager: profiles.filter(p => !p.manager_id).length,
        employees_without_team: profiles.filter(p => !p.team_id).length,
        average_points: profiles.length > 0 ? profiles.reduce((sum, p) => sum + p.points, 0) / profiles.length : 0,
        top_performers: profiles
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
      };

      // Calculate level distribution
      const levels = ['Estagiário', 'Assistente', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Principal'];
      levels.forEach(level => {
        stats.employees_by_level[level] = profiles.filter(p => p.level === level).length;
      });

      // Calculate team distribution
      const teamMap = new Map();
      profiles.forEach(profile => {
        const teamName = profile.team?.name || 'Sem Time';
        teamMap.set(teamName, (teamMap.get(teamName) || 0) + 1);
      });
      stats.employees_by_team = Object.fromEntries(teamMap);

      return stats;
    } catch (error) {
      console.error('👥 PeopleManagement: Error getting stats:', error);
      throw error;
    }
  },

  async getPerformanceMetrics(profileIds?: string[]): Promise<PerformanceMetrics[]> {
    console.log('👥 PeopleManagement: Getting performance metrics');

    try {
      let profiles: Profile[];
      
      if (profileIds) {
        profiles = await supabaseRequest(() => supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds), 'getSelectedProfiles');
      } else {
        profiles = await this.getProfilesWithDetails();
      }

      const metrics: PerformanceMetrics[] = await Promise.all(
        profiles.map(async (profile) => {
          // Get PDI count
          const { count: pdisCount } = await supabase
            .from('pdis')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .in('status', ['completed', 'validated']);

          // Get achievements count
          const { count: achievementsCount } = await supabase
            .from('achievements')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id);

          // Get competencies average
          const { data: competencies } = await supabase
            .from('competencies')
            .select('self_rating, manager_rating')
            .eq('profile_id', profile.id);

          const avgRating = competencies && competencies.length > 0
            ? competencies.reduce((sum, comp) => {
                const rating = Math.max(comp.self_rating || 0, comp.manager_rating || 0);
                return sum + rating;
              }, 0) / competencies.length
            : 0;

          // Calculate engagement score (simplified)
          const engagementScore = Math.min(100, 
            (profile.points / 10) + 
            ((pdisCount || 0) * 15) + 
            ((achievementsCount || 0) * 10) +
            (avgRating * 10)
          );

          return {
            profile_id: profile.id,
            name: profile.name,
            position: profile.position,
            level: profile.level,
            points: profile.points,
            completed_pdis: pdisCount || 0,
            average_competency_rating: avgRating,
            achievements_count: achievementsCount || 0,
            last_activity: profile.updated_at,
            engagement_score: Math.round(engagementScore)
          };
        })
      );

      return metrics.sort((a, b) => b.engagement_score - a.engagement_score);
    } catch (error) {
      console.error('👥 PeopleManagement: Error getting performance metrics:', error);
      throw error;
    }
  },

  // Organizational chart
  async getOrganizationalChart(): Promise<any> {
    console.log('👥 PeopleManagement: Getting organizational chart');

    try {
      const profiles = await this.getProfilesWithDetails();
      
      // Build hierarchy
      const hierarchy = {
        admins: profiles.filter(p => p.role === 'admin'),
        hr: profiles.filter(p => p.role === 'hr'),
        managers: profiles.filter(p => p.role === 'manager').map(manager => ({
          ...manager,
          team_members: profiles.filter(p => p.manager_id === manager.id)
        })),
        unassigned: profiles.filter(p => p.role === 'employee' && !p.manager_id)
      };

      return hierarchy;
    } catch (error) {
      console.error('👥 PeopleManagement: Error getting organizational chart:', error);
      throw error;
    }
  },

  // Validation functions
  async validateProfileUpdate(profileId: string, updates: Partial<Profile>, currentUser: Profile): Promise<string | null> {
    try {
      const profile = await supabaseRequest(() => supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single(), 'getProfileForValidation');

      // Role change validation
      if (updates.role && updates.role !== profile.role) {
        const roleValidation = permissionService.validateRoleChange(currentUser, profile, updates.role);
        if (roleValidation) return roleValidation;
      }

      // Manager assignment validation
      if (updates.manager_id && updates.manager_id !== profile.manager_id) {
        const manager = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', updates.manager_id)
          .single();

        if (manager.error || !manager.data) {
          return 'Gestor não encontrado';
        }

        if (manager.data.status !== 'active') {
          return 'Gestor deve estar ativo';
        }

        if (!['manager', 'admin'].includes(manager.data.role)) {
          return 'Usuário deve ter papel de Gestor ou Administrador';
        }
      }

      // Team assignment validation
      if (updates.team_id && updates.team_id !== profile.team_id) {
        const team = await supabase
          .from('teams')
          .select('status')
          .eq('id', updates.team_id)
          .single();

        if (team.error || !team.data) {
          return 'Time não encontrado';
        }

        if (team.data.status !== 'active') {
          return 'Time deve estar ativo';
        }
      }

      return null;
    } catch (error) {
      console.error('👥 PeopleManagement: Error validating profile update:', error);
      return 'Erro ao validar atualização';
    }
  },

  async validateBulkAction(
    profileIds: string[], 
    action: string, 
    value: string, 
    currentUser: Profile
  ): Promise<string | null> {
    try {
      if (profileIds.length === 0) {
        return 'Nenhum colaborador selecionado';
      }

      if (profileIds.length > 50) {
        return 'Máximo de 50 colaboradores por ação em massa';
      }

      // Check if user has permission for the action
      switch (action) {
        case 'change_role':
          if (!permissionService.canChangeRoles(currentUser.role)) {
            return 'Você não tem permissão para alterar papéis';
          }
          break;
        case 'change_team':
        case 'change_manager':
        case 'change_status':
          if (!permissionService.canManageTeam(currentUser.role)) {
            return 'Você não tem permissão para esta ação';
          }
          break;
      }

      // Validate that user isn't trying to change their own critical data
      if (profileIds.includes(currentUser.id)) {
        if (action === 'change_role' && currentUser.role === 'admin') {
          return 'Você não pode alterar seu próprio papel de administrador';
        }
        if (action === 'change_status') {
          return 'Você não pode alterar seu próprio status';
        }
      }

      return null;
    } catch (error) {
      console.error('👥 PeopleManagement: Error validating bulk action:', error);
      return 'Erro ao validar ação em massa';
    }
  },

  // Reporting and analytics
  async generatePeopleReport(filters?: any): Promise<any[]> {
    console.log('👥 PeopleManagement: Generating people report');

    try {
      const profiles = await this.getProfilesWithDetails(filters);
      const metrics = await this.getPerformanceMetrics(profiles.map(p => p.id));

      return profiles.map(profile => {
        const metric = metrics.find(m => m.profile_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          position: profile.position,
          level: profile.level,
          role: profile.role,
          team: profile.team?.name || 'Sem Time',
          manager: profile.manager?.name || 'Sem Gestor',
          status: profile.status,
          points: profile.points,
          completed_pdis: metric?.completed_pdis || 0,
          achievements_count: metric?.achievements_count || 0,
          engagement_score: metric?.engagement_score || 0,
          admission_date: profile.admission_date,
          last_update: profile.updated_at
        };
      });
    } catch (error) {
      console.error('👥 PeopleManagement: Error generating report:', error);
      throw error;
    }
  },

  async exportToCSV(data: any[], filename: string): Promise<void> {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Search and filtering
  async searchProfiles(query: string, filters?: any): Promise<Profile[]> {
    console.log('👥 PeopleManagement: Searching profiles with query:', query);

    const profiles = await this.getProfilesWithDetails(filters);
    
    if (!query.trim()) return profiles;

    const searchTerm = query.toLowerCase();
    return profiles.filter(profile =>
      profile.name.toLowerCase().includes(searchTerm) ||
      profile.email.toLowerCase().includes(searchTerm) ||
      profile.position.toLowerCase().includes(searchTerm) ||
      profile.area?.toLowerCase().includes(searchTerm) ||
      profile.bio?.toLowerCase().includes(searchTerm)
    );
  },

  // Team insights
  async getTeamInsights(teamId: string): Promise<{
    team_info: any;
    members: Profile[];
    performance_avg: number;
    engagement_avg: number;
    skill_distribution: Record<string, number>;
    level_distribution: Record<string, number>;
  }> {
    console.log('👥 PeopleManagement: Getting team insights for:', teamId);

    try {
      const [team, members] = await Promise.all([
        supabase.from('teams').select('*').eq('id', teamId).single(),
        this.getProfilesWithDetails({ team_id: teamId })
      ]);

      const metrics = await this.getPerformanceMetrics(members.map(m => m.id));

      const performance_avg = metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.engagement_score, 0) / metrics.length 
        : 0;

      const engagement_avg = members.length > 0
        ? members.reduce((sum, m) => sum + m.points, 0) / members.length
        : 0;

      // Skill distribution
      const skillMap = new Map();
      members.forEach(member => {
        member.hard_skills?.forEach(skill => {
          skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
        });
        member.soft_skills?.forEach(skill => {
          skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
        });
      });

      // Level distribution
      const levelMap = new Map();
      members.forEach(member => {
        levelMap.set(member.level, (levelMap.get(member.level) || 0) + 1);
      });

      return {
        team_info: team.data,
        members,
        performance_avg: Math.round(performance_avg),
        engagement_avg: Math.round(engagement_avg),
        skill_distribution: Object.fromEntries(skillMap),
        level_distribution: Object.fromEntries(levelMap)
      };
    } catch (error) {
      console.error('👥 PeopleManagement: Error getting team insights:', error);
      throw error;
    }
  },

  // Onboarding management
  async getOnboardingStatus(): Promise<{
    pending_onboarding: Profile[];
    completed_recently: Profile[];
    incomplete_profiles: Profile[];
  }> {
    console.log('👥 PeopleManagement: Getting onboarding status');

    try {
      const profiles = await this.getProfilesWithDetails();
      
      const now = new Date();
      const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      return {
        pending_onboarding: profiles.filter(p => !p.is_onboarded),
        completed_recently: profiles.filter(p => 
          p.is_onboarded && 
          p.onboarding_completed_at && 
          new Date(p.onboarding_completed_at) > recentThreshold
        ),
        incomplete_profiles: profiles.filter(p => 
          p.is_onboarded && 
          (!p.bio || !p.formation || !p.birth_date || !p.phone)
        )
      };
    } catch (error) {
      console.error('👥 PeopleManagement: Error getting onboarding status:', error);
      throw error;
    }
  }
};