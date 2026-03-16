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
    let query = supabase
      .from('profiles')
      .select(`
        *,
        team:teams!profiles_team_id_fkey(name),
        manager:profiles!profiles_manager_id_fkey(name)
      `);

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.status) query = query.eq('status', filters.status);

    return supabaseRequest(() => query, 'getProfiles');
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    return supabaseRequest(() => supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateProfile');
  },

  // Teams
  async getTeams() {
    return supabaseRequest(() => supabase
      .from('teams')
      .select(`
        *,
        manager:profiles!teams_manager_id_fkey(name),
        members:profiles!profiles_team_id_fkey(id, name, position)
      `), 'getTeams');
  },

  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
    return supabaseRequest(() => supabase
      .from('teams')
      .insert(team)
      .select()
      .single(), 'createTeam');
  },

  // Career Tracks
  async getCareerTrack(profileId: string) {
    console.log('🗄️ Database: Getting career track for profile:', profileId);

    try {
      const data = await supabaseRequest(() => supabase
        .from('career_tracks')
        .select(`
          *,
          template:career_track_templates(name, profession, stages)
        `)
        .eq('profile_id', profileId)
        .maybeSingle(), 'getCareerTrack');

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
    return supabaseRequest(() => supabase
      .from('competencies')
      .select('*')
      .eq('profile_id', profileId)
      .order('name'), 'getCompetencies');
  },

  async getAllCompetencies() {
    return supabaseRequest(() => supabase
      .from('competencies')
      .select('*')
      .order('name'), 'getAllCompetencies');
  },

  async createCompetency(competency: Omit<Competency, 'id' | 'created_at' | 'updated_at'>) {
    return supabaseRequest(() => supabase
      .from('competencies')
      .insert(competency)
      .select()
      .single(), 'createCompetency');
  },

  async updateCompetency(id: string, updates: Partial<Competency>) {
    return supabaseRequest(() => supabase
      .from('competencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateCompetency');
  },

  async deleteCompetency(id: string) {
    return supabaseRequest(() => supabase
      .from('competencies')
      .delete()
      .eq('id', id), 'deleteCompetency');
  },

  // PDIs
  async getPDIs(profileId: string) {
    return supabaseRequest(() => supabase
      .from('pdis')
      .select(`
        *,
        mentor:profiles!pdis_mentor_id_fkey(name),
        created_by_profile:profiles!pdis_created_by_fkey(name),
        validated_by_profile:profiles!pdis_validated_by_fkey(name)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false }), 'getPDIs');
  },

  async createPDI(pdi: Omit<PDI, 'id' | 'created_at' | 'updated_at'>) {
    return supabaseRequest(() => supabase
      .from('pdis')
      .insert(pdi)
      .select()
      .single(), 'createPDI');
  },

  async updatePDI(id: string, updates: Partial<PDI>) {
    return supabaseRequest(() => supabase
      .from('pdis')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updatePDI');
  },

  // Achievements
  async getAchievements(profileId: string) {
    console.log('🗄️ Database: Getting achievements for profile:', profileId);

    const data = await supabaseRequest(() => supabase
      .from('achievements')
      .select(`
        *,
        template:achievement_templates(*)
      `)
      .eq('profile_id', profileId)
      .order('unlocked_at', { ascending: false }), 'getAchievements');

    console.log('🗄️ Database: Achievements result:', { count: data?.length });
    return data;
  },

  async unlockAchievement(profileId: string, achievementTemplate: string) {
    console.log('🗄️ Database: Manually unlocking achievement:', achievementTemplate, 'for profile:', profileId);

    const data = await supabaseRequest(() => supabase.rpc('manual_check_achievements', {
      p_profile_id: profileId
    }), 'unlockAchievement');

    console.log('🗄️ Database: Achievement unlock result:', data);
    return data;
  },

  // Salary History
  async getSalaryHistory(profileId: string) {
    return supabaseRequest(() => supabase
      .from('salary_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('effective_date', { ascending: false }), 'getSalaryHistory');
  },

  async addSalaryEntry(entry: Omit<SalaryEntry, 'id' | 'created_at'>) {
    return supabaseRequest(() => supabase
      .from('salary_history')
      .insert(entry)
      .select()
      .single(), 'addSalaryEntry');
  },

  // Notifications
  async getNotifications(profileId: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getNotifications');
  },

  async markNotificationAsRead(id: string) {
    return supabaseRequest(() => supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single(), 'markNotificationAsRead');
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    return supabaseRequest(() => supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single(), 'createNotification');
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

    return supabaseRequest(() => supabase
      .from('pdis')
      .select(`
        *,
        mentor:profiles!pdis_mentor_id_fkey(name),
        created_by_profile:profiles!pdis_created_by_fkey(name),
        validated_by_profile:profiles!pdis_validated_by_fkey(name)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }), 'getPendingPDIs');
  }
};
