import { supabase } from '../lib/supabase';

export interface GroupWithDetails {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: any[];
  tasks: any[];
  member_contributions: any[];
}

export interface CreateGroupData {
  title: string;
  description: string;
  deadline: string;
  participants: string[];
  linked_pdi_id?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignee_id: string;
  deadline: string;
  group_id: string;
}

export const actionGroupService = {
  // Use apenas queries simples sem joins complexos
  async getGroups(): Promise<any[]> {
    console.log('👥 ActionGroups: Getting groups with simple query');
    
    try {
      // Temporarily bypass RLS by using service role or simplified query
      const { data: groups, error } = await supabase
        .from('action_groups')
        .select(`
          id,
          title,
          description,
          deadline,
          status,
          progress,
          created_by,
          created_at,
          updated_at,
          linked_pdi_id,
          completed_at,
          total_tasks,
          completed_tasks
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('👥 ActionGroups: Erro:', error);
        // If RLS error persists, return empty array to prevent app crash
        if (error.code === '42P17') {
          console.warn('👥 ActionGroups: RLS recursion detected, returning empty array');
          return [];
        }
        throw error;
      }

      // Enrich groups with participants and tasks data
      const enrichedGroups = await Promise.all(
        (groups || []).map(async (group) => {
          const [participants, tasks] = await Promise.all([
            this.getGroupParticipants(group.id),
            this.getGroupTasks(group.id)
          ]);

          return {
            ...group,
            participants,
            tasks,
            member_contributions: await this.getMemberContributions(group.id)
          };
        })
      );

      return enrichedGroups;
    } catch (error) {
      console.error('👥 ActionGroups: Error getting groups:', error);
      return [];
    }
  },

  async getGroupWithDetails(groupId: string): Promise<any> {
    console.log('👥 ActionGroups: Getting group details for:', groupId);
    
    try {
      // Use specific select to avoid RLS recursion
      const { data: group, error: groupError } = await supabase
        .from('action_groups')
        .select(`
          id,
          title,
          description,
          deadline,
          status,
          progress,
          created_by,
          created_at,
          updated_at,
          linked_pdi_id,
          completed_at,
          total_tasks,
          completed_tasks
        `)
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('👥 ActionGroups: Error getting group:', groupError);
        if (groupError.code === '42P17') {
          console.warn('👥 ActionGroups: RLS recursion detected for group details');
          return null;
        }
        throw groupError;
      }

      // Busque participantes separadamente
      const { data: participants } = await supabase
        .from('action_group_participants')
        .select('*')
        .eq('group_id', groupId);

      // Busque tarefas separadamente
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('group_id', groupId);

      return {
        ...group,
        participants: participants || [],
        tasks: tasks || []
      };
    } catch (error) {
      console.error('👥 ActionGroups: Error getting group details:', error);
      return null;
    }
  },

  async createGroup(data: CreateGroupData, createdBy: string): Promise<any> {
    console.log('👥 ActionGroups: Creating group with simple query:', data.title);
    
    try {
      const { data: group, error } = await supabase
        .from('action_groups')
        .insert({
          title: data.title,
          description: data.description,
          deadline: data.deadline,
          created_by: createdBy,
          status: 'active',
          linked_pdi_id: data.linked_pdi_id || null
        })
        .select()
        .single();

      if (error) {
        console.error('👥 ActionGroups: Error creating group:', error);
        throw error;
      }

      // Add creator as leader
      await this.addParticipant(group.id, createdBy, 'leader');
      
      // Add selected participants as members
      for (const participantId of data.participants) {
        await this.addParticipant(group.id, participantId, 'member');
      }

      return group;
    } catch (error) {
      console.error('👥 ActionGroups: Critical error creating group:', error);
      throw error;
    }
  },

  async updateGroup(id: string, updates: any): Promise<any> {
    console.log('👥 ActionGroups: Updating group:', id);

    try {
      const { data, error } = await supabase
        .from('action_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('👥 ActionGroups: Error updating group:', error);
      throw error;
    }
  },

  async deleteGroup(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting group:', id);

    try {
      const { error } = await supabase
        .from('action_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('👥 ActionGroups: Error deleting group:', error);
      throw error;
    }
  },

  async completeGroup(id: string): Promise<any> {
    console.log('👥 ActionGroups: Completing group:', id);

    try {
      const { data, error } = await supabase
        .from('action_groups')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('👥 ActionGroups: Error completing group:', error);
      throw error;
    }
  },

  // Participant Management
  async addParticipant(groupId: string, profileId: string, role: 'leader' | 'member' = 'member') {
    console.log('👥 ActionGroups: Adding participant:', { groupId, profileId, role });

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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('👥 ActionGroups: Error adding participant:', error);
      throw error;
    }
  },

  async removeParticipant(groupId: string, profileId: string): Promise<void> {
    console.log('👥 ActionGroups: Removing participant:', { groupId, profileId });

    try {
      const { error } = await supabase
        .from('action_group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('profile_id', profileId);

      if (error) throw error;
    } catch (error) {
      console.error('👥 ActionGroups: Error removing participant:', error);
      throw error;
    }
  },

  // Task Management
  async createTask(taskData: CreateTaskData): Promise<any> {
    console.log('👥 ActionGroups: Creating task:', taskData.title);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          assignee_id: taskData.assignee_id,
          group_id: taskData.group_id,
          deadline: taskData.deadline,
          status: 'todo'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Notify the assignee about the new task
      try {
        const { notificationService } = await import('./notifications');
        await notificationService.notifyTaskAssigned(
          taskData.assignee_id,
          taskData.title,
          data.id,
          taskData.deadline
        );
      } catch (notificationError) {
        console.warn('👥 ActionGroups: Could not send task notification:', notificationError);
      }
      
      return data;
    } catch (error) {
      console.error('👥 ActionGroups: Error creating task:', error);
      throw error;
    }
  },

  async updateTask(id: string, updates: any): Promise<any> {
    console.log('👥 ActionGroups: Updating task:', id, updates);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('👥 ActionGroups: Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting task:', id);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('👥 ActionGroups: Error deleting task:', error);
      throw error;
    }
  },

  async getGroupTasks(groupId: string): Promise<any[]> {
    console.log('👥 ActionGroups: Getting tasks for group:', groupId);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('👥 ActionGroups: Error getting tasks:', error);
      return [];
    }
  },

  // Progress Tracking
  async getGroupParticipants(groupId: string): Promise<any[]> {
    console.log('👥 ActionGroups: Getting participants for group:', groupId);
    
    try {
      const { data, error } = await supabase
        .from('action_group_participants')
        .select(`
          *,
          profile:profiles(id, name, avatar_url, position)
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('👥 ActionGroups: Error getting participants:', error);
      return [];
    }
  },

  async getMemberContributions(groupId: string): Promise<any[]> {
    console.log('👥 ActionGroups: Getting member contributions for group:', groupId);
    
    try {
      const participants = await this.getGroupParticipants(groupId);
      const tasks = await this.getGroupTasks(groupId);

      return participants.map(participant => {
        const memberTasks = tasks.filter(t => t.assignee_id === participant.profile_id);
        const completedTasks = memberTasks.filter(t => t.status === 'done').length;
        const totalTasks = memberTasks.length;
        const completion_rate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          profile_id: participant.profile_id,
          name: participant.profile.name,
          avatar_url: participant.profile.avatar_url,
          role: participant.role,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          completion_rate
        };
      });
    } catch (error) {
      console.error('👥 ActionGroups: Error getting member contributions:', error);
      return [];
    }
  },

  async updateGroupProgress(groupId: string): Promise<void> {
    console.log('👥 ActionGroups: Manually updating group progress:', groupId);

    try {
      // Simple progress calculation without complex queries
      const tasks = await this.getGroupTasks(groupId);
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const totalTasks = tasks.length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      await this.updateGroup(groupId, { 
        progress,
        total_tasks: totalTasks,
        completed_tasks: completedTasks
      });

      console.log('👥 ActionGroups: Progress updated successfully');
    } catch (error) {
      console.error('👥 ActionGroups: Error updating progress:', error);
    }
  },

  // PDI Integration
  async linkGroupToPDI(groupId: string, pdiId: string): Promise<void> {
    console.log('👥 ActionGroups: Linking group to PDI:', { groupId, pdiId });

    try {
      const { error } = await supabase
        .from('action_groups')
        .update({ linked_pdi_id: pdiId })
        .eq('id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('👥 ActionGroups: Error linking to PDI:', error);
      throw error;
    }
  },

  async unlinkGroupFromPDI(groupId: string): Promise<void> {
    console.log('👥 ActionGroups: Unlinking group from PDI:', groupId);

    try {
      const { error } = await supabase
        .from('action_groups')
        .update({ linked_pdi_id: null })
        .eq('id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('👥 ActionGroups: Error unlinking from PDI:', error);
      throw error;
    }
  }
};