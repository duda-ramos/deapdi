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
        manager:profiles!manager_id(name)
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
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        manager:profiles!teams_manager_id_fkey(name),
        members:profiles!team_id(id, name, position)
      `);

    if (error) throw error;
    return data;
  },

  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
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
    return supabaseRequest(() => supabase
      .from('career_tracks')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle(), 'getCareerTrack');
  },

  async updateCareerTrack(profileId: string, updates: Partial<CareerTrack>) {
    return supabaseRequest(() => supabase
      .from('career_tracks')
      .update(updates)
      .eq('profile_id', profileId)
      .select()
      .single(), 'updateCareerTrack');
  },

  async createCareerTrack(careerTrack: Omit<CareerTrack, 'id' | 'created_at' | 'updated_at'>) {
    return supabaseRequest(() => supabase
      .from('career_tracks')
      .insert(careerTrack)
      .select()
      .single(), 'createCareerTrack');
  },
  // Competencies
  async getCompetencies(profileId: string) {
    const { data, error } = await supabase
      .from('competencies')
      .select('*')
      .eq('profile_id', profileId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async updateCompetency(id: string, updates: Partial<Competency>) {
    const { data, error } = await supabase
      .from('competencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // PDIs
  async getPDIs(profileId: string) {
    const { data, error } = await supabase
      .from('pdis')
      .select(`
        *,
        mentor:profiles!mentor_id(name),
        created_by_profile:profiles!created_by(name),
        validated_by_profile:profiles!validated_by(name)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createPDI(pdi: Omit<PDI, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pdis')
      .insert(pdi)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePDI(id: string, updates: Partial<PDI>) {
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
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('profile_id', profileId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async unlockAchievement(profileId: string, achievementTemplate: string) {
    // This would typically be called by a database function or trigger
    // For now, we'll implement it as a simple insert
    const { data, error } = await supabase
      .from('achievements')
      .insert({
        profile_id: profileId,
        title: achievementTemplate, // This should be looked up from templates
        description: 'Achievement unlocked!',
        icon: '🏆',
        points: 100,
        unlocked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Salary History
  async getSalaryHistory(profileId: string) {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addSalaryEntry(entry: Omit<SalaryEntry, 'id' | 'created_at'>) {
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
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Action Groups
  async getActionGroups(profileId?: string) {
    console.log('🗄️ Database: Getting action groups for profile:', profileId);
    
    if (profileId) {
      // First, get groups where user is the creator
      const { data: createdGroups, error: createdError } = await supabase
        .from('action_groups')
        .select(`
          *,
          created_by_profile:profiles!created_by(name),
          participants:action_group_participants(
            id,
            role,
            profile:profiles(id, name, avatar_url)
          )
        `)
        .eq('created_by', profileId)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      // Second, get group IDs where user is a participant
      const { data: participantGroups, error: participantError } = await supabase
        .from('action_group_participants')
        .select('group_id')
        .eq('profile_id', profileId);

      if (participantError) throw participantError;

      const participantGroupIds = participantGroups?.map(p => p.group_id) || [];

      // Third, get groups where user is a participant (if any)
      let joinedGroups: any[] = [];
      if (participantGroupIds.length > 0) {
        const { data, error } = await supabase
          .from('action_groups')
          .select(`
            *,
            created_by_profile:profiles!created_by(name),
            participants:action_group_participants(
              id,
              role,
              profile:profiles(id, name, avatar_url)
            )
          `)
          .in('id', participantGroupIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        joinedGroups = data || [];
      }

      // Combine and deduplicate results
      const allGroups = [...(createdGroups || []), ...joinedGroups];
      const uniqueGroups = allGroups.filter((group, index, self) => 
        index === self.findIndex(g => g.id === group.id)
      );

      console.log('🗄️ Database: Action groups result:', { count: uniqueGroups.length });
      return uniqueGroups;
    } else {
      // Get all groups if no profileId specified
      const { data, error } = await supabase
        .from('action_groups')
        .select(`
          *,
          created_by_profile:profiles!created_by(name),
          participants:action_group_participants(
            id,
            role,
            profile:profiles(id, name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('🗄️ Database: Action groups result:', { count: data?.length });
      return data;
    }
  },

  async createActionGroup(group: Omit<ActionGroup, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🗄️ Database: Creating action group:', group);
    const { data, error } = await supabase
      .from('action_groups')
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateActionGroup(id: string, updates: Partial<ActionGroup>) {
    const { data, error } = await supabase
      .from('action_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};