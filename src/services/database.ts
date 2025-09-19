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
    
    try {
      if (profileId) {
        // First, get groups where user is the creator
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
          .eq('created_by', profileId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('🗄️ Database: Error fetching created groups:', error);
          throw error;
        }

        const createdGroups = data || [];
        console.log('🗄️ Database: Created groups found:', createdGroups.length);

        // Second, get group IDs where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('action_group_participants')
          .select('group_id')
          .eq('profile_id', profileId);

        if (participantError) {
          console.error('🗄️ Database: Error fetching participant groups:', participantError);
          // Don't throw, just log and continue with created groups only
          console.log('🗄️ Database: Continuing with created groups only');
          return createdGroups;
        }

        const participantGroupIds = participantData?.map(p => p.group_id) || [];
        console.log('🗄️ Database: Participant group IDs:', participantGroupIds.length);

        // Third, get groups where user is a participant (if any)
        let joinedGroups: any[] = [];
        if (participantGroupIds.length > 0) {
          const { data: joinedData, error: joinedError } = await supabase
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

          if (joinedError) {
            console.error('🗄️ Database: Error fetching joined groups:', joinedError);
            // Continue with created groups only
          } else {
            joinedGroups = joinedData || [];
            console.log('🗄️ Database: Joined groups found:', joinedGroups.length);
          }
        }

        // Combine and deduplicate results
        const allGroups = [...createdGroups, ...joinedGroups];
        const uniqueGroups = allGroups.filter((group, index, self) => 
          index === self.findIndex(g => g.id === group.id)
        );

        console.log('🗄️ Database: Final action groups result:', { count: uniqueGroups.length });
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

        if (error) {
          console.error('🗄️ Database: Error fetching all groups:', error);
          throw error;
        }
        
        console.log('🗄️ Database: All action groups result:', { count: data?.length });
        return data;
      }
    } catch (error) {
      console.error('🗄️ Database: Critical error in getActionGroups:', error);
      return []; // Return empty array as fallback
    }
  },

  async createActionGroup(group: Omit<ActionGroup, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🗄️ Database: Creating action group:', group);
    
    try {
      const { data, error } = await supabase
        .from('action_groups')
        .insert(group)
        .select()
        .single();

      if (error) {
        console.error('🗄️ Database: Error creating action group:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Action group created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error creating action group:', error);
      throw error;
    }
  },

  async updateActionGroup(id: string, updates: Partial<ActionGroup>) {
    console.log('🗄️ Database: Updating action group:', id, updates);
    
    try {
      const { data, error } = await supabase
        .from('action_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('🗄️ Database: Error updating action group:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Action group updated successfully');
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error updating action group:', error);
      throw error;
    }
  },

  // Add missing action group participants methods
  async addGroupParticipant(groupId: string, profileId: string, role: 'leader' | 'member' = 'member') {
    console.log('🗄️ Database: Adding participant to group:', { groupId, profileId, role });
    
    try {
      const { data, error } = await supabase
        .from('action_group_participants')
        .insert({
          group_id: groupId,
          profile_id: profileId,
          role: role
        })
        .select()
        .single();

      if (error) {
        console.error('🗄️ Database: Error adding group participant:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Participant added successfully');
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error adding participant:', error);
      throw error;
    }
  },

  async removeGroupParticipant(groupId: string, profileId: string) {
    console.log('🗄️ Database: Removing participant from group:', { groupId, profileId });
    
    try {
      const { error } = await supabase
        .from('action_group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('profile_id', profileId);

      if (error) {
        console.error('🗄️ Database: Error removing group participant:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Participant removed successfully');
    } catch (error) {
      console.error('🗄️ Database: Critical error removing participant:', error);
      throw error;
    }
  },

  async getGroupTasks(groupId: string) {
    console.log('🗄️ Database: Getting tasks for group:', groupId);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!assignee_id(id, name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🗄️ Database: Error fetching group tasks:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Group tasks result:', { count: data?.length });
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error fetching group tasks:', error);
      return []; // Return empty array as fallback
    }
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🗄️ Database: Creating task:', task);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) {
        console.error('🗄️ Database: Error creating task:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Task created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error creating task:', error);
      throw error;
    }
  },

  async updateTask(id: string, updates: Partial<Task>) {
    console.log('🗄️ Database: Updating task:', id, updates);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('🗄️ Database: Error updating task:', error);
        throw error;
      }
      
      console.log('🗄️ Database: Task updated successfully');
      return data;
    } catch (error) {
      console.error('🗄️ Database: Critical error updating task:', error);
      throw error;
    }
  }
};