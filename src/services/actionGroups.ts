import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

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
  // Use simple queries with proper error handling for RLS recursion
    try {
      return await supabaseRequest(
        () => supabase
          .from('action_groups')
          .select('id, title, description, deadline, status, created_by, created_at')
          .order('created_at', { ascending: false }),
        'getActionGroups'
      );
    } catch (error) {
      // If RLS recursion error, return empty array to prevent app crash
      if (error instanceof Error && error.message.includes('SUPABASE_RLS_RECURSION')) {
        console.warn('RLS recursion detected - returning empty groups array');
        return [];
      }
      throw error;
    }
        .select('id, title, description, deadline, status, created_by, created_at')
        .order('created_at', { ascending: false }), 'getActionGroups');

      // Return basic groups data without complex joins to avoid RLS recursion
      return (groups || []).map(group => ({
        ...group,
        progress: 0,
        total_tasks: 0,
        completed_tasks: 0,
        participants: [],
        tasks: [],
        member_contributions: []
      }));
    } catch (error) {
      // Handle RLS recursion specifically
      if (error instanceof Error && error.message.includes('infinite recursion')) {
        console.warn('👥 ActionGroups: RLS recursion detected, returning empty array');
        return [];
      }
      console.error('👥 ActionGroups: Critical error getting groups:', error);
      return [];
    }
  },

  async getGroupWithDetails(groupId: string): Promise<any> {
    console.log('👥 ActionGroups: Getting group details for:', groupId);
    
    try {
      // Use regular supabase client with basic query
      const group = await supabaseRequest(() => supabase!
        .from('action_groups')
        .select('id, title, description, deadline, status, created_by, created_at')
        .eq('id', groupId)
        .single(), 'getActionGroup');

      return {
        ...group,
        progress: 0,
        participants: [],
        tasks: []
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('infinite recursion')) {
        console.warn('👥 ActionGroups: RLS recursion detected, returning null');
        return null;
      }
      console.error('👥 ActionGroups: Error getting group details:', error);
      return null;
    }
  },

  async createGroup(data: CreateGroupData, createdBy: string): Promise<any> {
    console.log('👥 ActionGroups: Creating group:', data.title);
    
    try {
      const group = await supabaseRequest(() => supabase!
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
        .single(), 'createActionGroup');

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

    return supabaseRequest(() => supabase!
      .from('action_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateActionGroup');
  },

  async deleteGroup(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting group:', id);

    return supabaseRequest(() => supabase!
      .from('action_groups')
      .delete()
      .eq('id', id), 'deleteActionGroup');
  },

  async completeGroup(id: string): Promise<any> {
    console.log('👥 ActionGroups: Completing group:', id);

    return supabaseRequest(() => supabase!
      .from('action_groups')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single(), 'completeActionGroup');
  },

  // Participant Management
  async addParticipant(groupId: string, profileId: string, role: 'leader' | 'member' = 'member') {
    console.log('👥 ActionGroups: Adding participant:', { groupId, profileId, role });

    try {
      const data = await supabaseRequest(() => supabase!
        .from('action_group_participants')
        .insert({
          group_id: groupId,
          profile_id: profileId,
          role: role
        })
        .select()
        .single(), 'addGroupParticipant');
    } catch (error) {
      console.error('👥 ActionGroups: Error adding participant:', error);
      throw error;
    }
  },

  async removeParticipant(groupId: string, profileId: string): Promise<void> {
    console.log('👥 ActionGroups: Removing participant:', { groupId, profileId });

    try {
      return supabaseRequest(() => supabase!
        .from('action_group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('profile_id', profileId), 'removeGroupParticipant');
    } catch (error) {
      console.error('👥 ActionGroups: Error removing participant:', error);
      throw error;
    }
  },

  // Task Management
  async createTask(taskData: CreateTaskData): Promise<any> {
    console.log('👥 ActionGroups: Creating task:', taskData.title);

    try {
      const data = await supabaseRequest(() => supabase!
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
        .single(), 'createGroupTask');
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
      return supabaseRequest(() => supabase!
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single(), 'updateGroupTask');
    } catch (error) {
      console.error('👥 ActionGroups: Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting task:', id);

    try {
      return supabaseRequest(() => supabase!
        .from('tasks')
        .delete()
        .eq('id', id), 'deleteGroupTask');
    } catch (error) {
      console.error('👥 ActionGroups: Error deleting task:', error);
      throw error;
    }
  },

  async getGroupTasks(groupId: string): Promise<any[]> {
    console.log('👥 ActionGroups: Getting tasks for group:', groupId);

    try {
      return supabaseRequest(() => supabase!
        .from('tasks')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false }), 'getGroupTasks');
    } catch (error) {
      console.error('👥 ActionGroups: Error getting tasks:', error);
      return [];
    }
  },

  // Progress Tracking
  async getGroupParticipants(groupId: string): Promise<any[]> {
    console.log('👥 ActionGroups: Getting participants for group:', groupId);
    
    try {
      return supabaseRequest(() => supabase!
        .from('action_group_participants')
        .select(`
          *,
          profile:profiles(id, name, avatar_url, position)
        `)
        .eq('group_id', groupId), 'getGroupParticipants');
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
      return supabaseRequest(() => supabase!
        .rpc('update_group_progress_manual', { group_id: groupId }), 'updateGroupProgress');
    } catch (error) {
      console.warn('👥 ActionGroups: RPC function not available, skipping progress update:', error);
    }
  },

  // PDI Integration
  async linkGroupToPDI(groupId: string, pdiId: string): Promise<void> {
    console.log('👥 ActionGroups: Linking group to PDI:', { groupId, pdiId });

    try {
      return supabaseRequest(() => supabase!
        .from('action_groups')
        .update({ linked_pdi_id: pdiId })
        .eq('id', groupId), 'linkGroupToPDI');
    } catch (error) {
      console.error('👥 ActionGroups: Error linking to PDI:', error);
      throw error;
    }
  },

  async unlinkGroupFromPDI(groupId: string): Promise<void> {
    console.log('👥 ActionGroups: Unlinking group from PDI:', groupId);

    try {
      return supabaseRequest(() => supabase!
        .from('action_groups')
        .update({ linked_pdi_id: null })
        .eq('id', groupId), 'unlinkGroupFromPDI');
    } catch (error) {
      console.error('👥 ActionGroups: Error unlinking from PDI:', error);
      throw error;
    }
  }
};