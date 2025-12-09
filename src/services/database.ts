import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import { 
  Profile, 
  Team, 
  CareerTrack, 
  Competency, 
  PDI, 
  Achievement, 
  ActionGroup,
  Task,
  Notification,
  SalaryEntry
} from '../types';

export const databaseService = {
  // Profiles
  async getProfiles(filters?: { role?: string; team_id?: string; status?: string }) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    let query = supabase
      .from('profiles')
      .select(`
        *,
        team:teams(name),
        manager:profiles!profiles_manager_id_fkey(name)
      `);

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.status) query = query.eq('status', filters.status);

    return supabaseRequest(() => query, 'getProfiles');
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    return supabaseRequest(() => supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateProfile');
  },

  // Teams
  async getTeams() {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        manager:profiles!teams_manager_id_fkey(name),
        members:profiles!profiles_team_id_fkey(id, name, position)
      `);

    if (error) throw error;
    return data;
  },

  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Career Tracks
  async getCareerTrack(profileId: string) {
    console.log('🗄️ Database: Getting career track for profile:', profileId);
    
    try {
      const { data, error } = await supabase
        .from('career_tracks')
        .select(`
          *,
          template:career_track_templates(name, profession, stages)
        `)
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) {
        console.error('🗄️ Database: Career track query error:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Career track result:', !!data);
      return data;
    } catch (error) {
      console.error('🗄️ Database: Career track fetch failed:', error);
      return null; // Return null instead of throwing to allow fallback handling
    }
  },

  async updateCareerTrack(profileId: string, updates: Partial<CareerTrack>) {
    console.log('🗄️ Database: Updating career track for profile:', profileId, updates);
    
    return supabaseRequest(() => supabase
      .from('career_tracks')
      .update(updates)
      .eq('profile_id', profileId)
      .select()
      .single(), 'updateCareerTrack');
  },

  async createCareerTrack(careerTrack: Omit<CareerTrack, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🗄️ Database: Creating career track:', careerTrack);
    
    return supabaseRequest(() => supabase
      .from('career_tracks')
      .insert(careerTrack)
      .select()
      .single(), 'createCareerTrack');
  },
  // Competencies
  async getCompetencies(profileId: string) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    const { data, error } = await supabase
      .from('competencies')
      .select('*')
      .eq('profile_id', profileId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async getAllCompetencies() {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    const { data, error } = await supabase
      .from('competencies')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async createCompetency(competency: Omit<Competency, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('competencies')
      .insert(competency)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCompetency(id: string, updates: Partial<Competency>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('competencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCompetency(id: string) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from('competencies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // PDIs
  async getPDIs(profileId: string) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    const { data, error } = await supabase
      .from('pdis')
      .select(`
        *,
        mentor:profiles!pdis_mentor_id_fkey(name),
        created_by_profile:profiles!pdis_created_by_fkey(name),
        validated_by_profile:profiles!pdis_validated_by_fkey(name)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createPDI(pdi: Omit<PDI, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('pdis')
      .insert(pdi)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePDI(id: string, updates: Partial<PDI>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('pdis')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Achievements
  async getAchievements(profileId: string) {
    console.log('🗄️ Database: Getting achievements for profile:', profileId);
    
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          *,
          template:achievement_templates(*)
        `)
        .eq('profile_id', profileId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('🗄️ Database: Error fetching achievements:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Achievements result:', { count: data?.length });
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error fetching achievements:', error);
      throw error;
    }
  },

  async unlockAchievement(profileId: string, achievementTemplate: string) {
    console.log('🗄️ Database: Manually unlocking achievement:', achievementTemplate, 'for profile:', profileId);
    
    try {
      // This is now handled by triggers, but keeping for manual testing
      const { data, error } = await supabase.rpc('manual_check_achievements', {
        p_profile_id: profileId
      });

      if (error) {
        console.error('🗄️ Database: Error unlocking achievement:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Achievement unlock result:', data);
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error unlocking achievement:', error);
      throw error;
    }
  },

  // Salary History
  async getSalaryHistory(profileId: string) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addSalaryEntry(entry: Omit<SalaryEntry, 'id' | 'created_at'>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('salary_history')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Notifications
  async getNotifications(profileId: string, unreadOnly = false) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      return [];
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markNotificationAsRead(id: string) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    if (!supabase) {
      console.warn('🗄️ Database: Supabase not available');
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Action Groups
  // Action Groups - Now handled by actionGroupService
  async getActionGroups(profileId?: string) {
    // Deprecated - use actionGroupService.getGroups() instead
    console.warn('🗄️ Database: getActionGroups is deprecated, use actionGroupService.getGroups()');
    const { actionGroupService } = await import('../services/actionGroups');
    return actionGroupService.getGroups(profileId);
  },

  // Enhanced PDI methods
  async getPendingPDIs(): Promise<PDI[]> {
    console.log('🗄️ Database: Getting pending PDIs for validation');
    
    try {
      const { data, error } = await supabase
        .from('pdis')
        .select(`
          *,
          mentor:profiles!pdis_mentor_id_fkey(name),
          created_by_profile:profiles!pdis_created_by_fkey(name),
          validated_by_profile:profiles!pdis_validated_by_fkey(name)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('🗄️ Database: Error getting pending PDIs:', error);
      return [];
    }
  }
};