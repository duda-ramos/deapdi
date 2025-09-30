import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import { Profile } from '../types';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  manager?: Profile;
  members?: Profile[];
  member_count?: number;
}

export interface TeamStats {
  total_teams: number;
  active_teams: number;
  teams_without_manager: number;
  average_team_size: number;
  largest_team_size: number;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  manager_id?: string;
  status?: 'active' | 'inactive';
}

interface TeamHierarchy {
  team: Team;
  manager: Profile | null;
  members: Profile[];
  subTeams?: TeamHierarchy[];
}

export const teamService = {
  // Team CRUD
  async getTeams(includeInactive = false): Promise<Team[]> {
    console.log('🏢 Teams: Getting teams, includeInactive:', includeInactive);

    let query = supabase
      .from('teams')
      .select(`
        *,
        manager:profiles!teams_manager_id_fkey(id, name, avatar_url, position),
        members:profiles!profiles_team_id_fkey(id, name, position, status)
      `);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    return supabaseRequest(() => query.order('name'), 'getTeams');
  },

  async getTeam(id: string): Promise<Team> {
    console.log('🏢 Teams: Getting team:', id);

    return supabaseRequest(() => supabase
      .from('teams')
      .select(`
        *,
        manager:profiles!teams_manager_id_fkey(id, name, avatar_url, position, email),
        members:profiles!profiles_team_id_fkey(id, name, position, status, avatar_url, points)
      `)
      .eq('id', id)
      .single(), 'getTeam');
  },

  async createTeam(teamData: CreateTeamData): Promise<Team> {
    console.log('🏢 Teams: Creating team:', teamData.name);

    return supabaseRequest(() => supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description || null,
        manager_id: teamData.manager_id || null,
        status: teamData.status || 'active'
      })
      .select()
      .single(), 'createTeam');
  },

  async updateTeam(id: string, updates: Partial<CreateTeamData>): Promise<Team> {
    console.log('🏢 Teams: Updating team:', id);

    return supabaseRequest(() => supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateTeam');
  },

  async deleteTeam(id: string): Promise<void> {
    console.log('🏢 Teams: Deleting team:', id);

    return supabaseRequest(() => supabase
      .from('teams')
      .delete()
      .eq('id', id), 'deleteTeam');
  },

  async assignManager(teamId: string, managerId: string): Promise<Team> {
    console.log('🏢 Teams: Assigning manager to team:', { teamId, managerId });

    return supabaseRequest(() => supabase
      .from('teams')
      .update({ manager_id: managerId })
      .eq('id', teamId)
      .select()
      .single(), 'assignTeamManager');
  },

  async removeManager(teamId: string): Promise<Team> {
    console.log('🏢 Teams: Removing manager from team:', teamId);

    return supabaseRequest(() => supabase
      .from('teams')
      .update({ manager_id: null })
      .eq('id', teamId)
      .select()
      .single(), 'removeTeamManager');
  },

  // Member Management
  async addMemberToTeam(profileId: string, teamId: string): Promise<void> {
    console.log('🏢 Teams: Adding member to team:', { profileId, teamId });

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ team_id: teamId })
      .eq('id', profileId), 'addMemberToTeam');
  },

  async removeMemberFromTeam(profileId: string): Promise<void> {
    console.log('🏢 Teams: Removing member from team:', profileId);

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ team_id: null })
      .eq('id', profileId), 'removeMemberFromTeam');
  },

  async transferMemberBetweenTeams(profileId: string, fromTeamId: string, toTeamId: string): Promise<void> {
    console.log('🏢 Teams: Transferring member between teams:', { profileId, fromTeamId, toTeamId });

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ team_id: toTeamId })
      .eq('id', profileId)
      .eq('team_id', fromTeamId), 'transferMemberBetweenTeams');
  },

  async bulkTransferMembers(profileIds: string[], toTeamId: string): Promise<void> {
    console.log('🏢 Teams: Bulk transferring members to team:', { profileIds, toTeamId });

    return supabaseRequest(() => supabase
      .from('profiles')
      .update({ team_id: toTeamId })
      .in('id', profileIds), 'bulkTransferMembers');
  },

  // Statistics and Reports
  async getTeamStats(): Promise<TeamStats> {
    console.log('🏢 Teams: Getting team statistics');

    try {
      const { data, error } = await supabase.rpc('get_team_stats');
      
      if (error) {
        console.error('🏢 Teams: Error getting stats:', error);
        // Return default stats if function doesn't exist
        return {
          total_teams: 0,
          active_teams: 0,
          teams_without_manager: 0,
          average_team_size: 0,
          largest_team_size: 0
        };
      }

      return data || {
        total_teams: 0,
        active_teams: 0,
        teams_without_manager: 0,
        average_team_size: 0,
        largest_team_size: 0
      };
    } catch (error) {
      console.error('🏢 Teams: Error getting stats:', error);
      return {
        total_teams: 0,
        active_teams: 0,
        teams_without_manager: 0,
        average_team_size: 0,
        largest_team_size: 0
      };
    }
  },

  async getTeamPerformanceReport(): Promise<Array<{
    team_id: string;
    team_name: string;
    member_count: number;
    average_points: number;
    completed_pdis: number;
    average_competency_rating: number;
    engagement_score: number;
  }>> {
    console.log('🏢 Teams: Getting team performance report');

    try {
      const teams = await this.getTeams();
      
      return teams.map(team => ({
        team_id: team.id,
        team_name: team.name,
        member_count: team.members?.length || 0,
        average_points: team.members?.reduce((sum, member) => sum + (member.points || 0), 0) / (team.members?.length || 1) || 0,
        completed_pdis: 0, // Would be calculated from PDI data
        average_competency_rating: 0, // Would be calculated from competency data
        engagement_score: Math.floor(Math.random() * 40) + 60 // Mock data for now
      }));
    } catch (error) {
      console.error('🏢 Teams: Error getting performance report:', error);
      return [];
    }
  },

  // Organizational Chart
  async getOrganizationalChart(): Promise<TeamHierarchy[]> {
    console.log('🏢 Teams: Getting organizational chart');

    try {
      const teams = await this.getTeams();
      
      // Build hierarchy (simplified - assumes flat structure for now)
      return teams.map(team => ({
        team,
        manager: team.manager || null,
        members: team.members || [],
        subTeams: [] // Could be expanded for nested teams
      }));
    } catch (error) {
      console.error('🏢 Teams: Error getting organizational chart:', error);
      return [];
    }
  },

  // Validation
  async validateTeamDeletion(teamId: string): Promise<string | null> {
    try {
      const team = await this.getTeam(teamId);
      
      if (team.members && team.members.length > 0) {
        return `Este time possui ${team.members.length} membro(s). Transfira os membros antes de excluir.`;
      }

      return null;
    } catch (error) {
      console.error('🏢 Teams: Error validating team deletion:', error);
      return 'Erro ao validar exclusão do time';
    }
  },

  async validateManagerAssignment(managerId: string, teamId: string): Promise<string | null> {
    try {
      // Check if manager exists and is active
      const { data: manager, error } = await supabase
        .from('profiles')
        .select('id, name, status, role')
        .eq('id', managerId)
        .single();

      if (error || !manager) {
        return 'Gestor não encontrado';
      }

      if (manager.status !== 'active') {
        return 'Gestor deve estar ativo para ser atribuído a um time';
      }

      if (manager.role !== 'manager' && manager.role !== 'admin') {
        return 'Usuário deve ter papel de Gestor ou Administrador';
      }

      // Check if manager is already managing another team
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id, name')
        .eq('manager_id', managerId)
        .neq('id', teamId)
        .maybeSingle();

      if (existingTeam) {
        return `Este gestor já gerencia o time "${existingTeam.name}"`;
      }

      return null;
    } catch (error) {
      console.error('🏢 Teams: Error validating manager assignment:', error);
      return 'Erro ao validar atribuição de gestor';
    }
  }
};