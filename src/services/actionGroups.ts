import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import { ActionGroup, Task, Profile } from '../types';

export interface GroupWithDetails extends ActionGroup {
  participants: GroupParticipant[];
  tasks: TaskWithAssignee[];
  created_by_profile: Profile;
  member_contributions: MemberContribution[];
}

export interface GroupParticipant {
  id: string;
  group_id: string;
  profile_id: string;
  role: 'leader' | 'member';
  profile: Profile;
  created_at: string;
}

export interface TaskWithAssignee extends Task {
  assignee: Profile;
}

export interface MemberContribution {
  profile_id: string;
  name: string;
  avatar_url: string | null;
  role: 'leader' | 'member';
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
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
  // CRUD Operations
  async getGroups(profileId?: string): Promise<GroupWithDetails[]> {
    console.log('👥 ActionGroups: Getting groups for profile:', profileId);

    try {
      let query = supabase
        .from('action_groups')
        .select(`
          *,
          created_by_profile:profiles!created_by(id, name, avatar_url),
          participants:action_group_participants(
            id,
            role,
            profile:profiles(id, name, avatar_url, position)
          ),
          tasks:tasks(
            id,
            title,
            description,
            deadline,
            status,
            assignee:profiles!assignee_id(id, name, avatar_url)
          )
        `);

      if (profileId) {
        query = query.or(`created_by.eq.${profileId},id.in.(${await this.getUserGroupIds(profileId)})`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('👥 ActionGroups: Error fetching groups:', error);
        throw error;
      }

      // Get member contributions for each group
      const groupsWithContributions = await Promise.all(
        (data || []).map(async (group) => {
          const contributions = await this.getMemberContributions(group.id);
          return {
            ...group,
            member_contributions: contributions
          };
        })
      );

      console.log('👥 ActionGroups: Groups fetched:', groupsWithContributions.length);
      return groupsWithContributions;
    } catch (error) {
      console.error('👥 ActionGroups: Critical error fetching groups:', error);
      throw error;
    }
  },

  async createGroup(groupData: CreateGroupData, createdBy: string): Promise<ActionGroup> {
    console.log('👥 ActionGroups: Creating group:', groupData.title);

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('action_groups')
        .insert({
          title: groupData.title,
          description: groupData.description,
          deadline: groupData.deadline,
          linked_pdi_id: groupData.linked_pdi_id || null,
          created_by: createdBy,
          status: 'active'
        })
        .select()
        .single();

      if (groupError) {
        console.error('👥 ActionGroups: Error creating group:', groupError);
        throw groupError;
      }

      // Add creator as leader
      await this.addParticipant(group.id, createdBy, 'leader');

      // Add other participants as members
      for (const participantId of groupData.participants) {
        if (participantId !== createdBy) {
          await this.addParticipant(group.id, participantId, 'member');
        }
      }

      console.log('👥 ActionGroups: Group created successfully:', group.id);
      return group;
    } catch (error) {
      console.error('👥 ActionGroups: Critical error creating group:', error);
      throw error;
    }
  },

  async updateGroup(id: string, updates: Partial<ActionGroup>): Promise<ActionGroup> {
    console.log('👥 ActionGroups: Updating group:', id);

    return supabaseRequest(() => supabase
      .from('action_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateActionGroup');
  },

  async deleteGroup(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting group:', id);

    return supabaseRequest(() => supabase
      .from('action_groups')
      .delete()
      .eq('id', id), 'deleteActionGroup');
  },

  async completeGroup(id: string): Promise<any> {
    console.log('👥 ActionGroups: Completing group:', id);

    try {
      const { data, error } = await supabase.rpc('complete_action_group', {
        group_id: id
      });

      if (error) {
        console.error('👥 ActionGroups: Error completing group:', error);
        throw error;
      }

      console.log('👥 ActionGroups: Group completed successfully');
      return data;
    } catch (error) {
      console.error('👥 ActionGroups: Critical error completing group:', error);
      throw error;
    }
  },

  // Participant Management
  async addParticipant(groupId: string, profileId: string, role: 'leader' | 'member' = 'member') {
    console.log('👥 ActionGroups: Adding participant:', { groupId, profileId, role });

    return supabaseRequest(() => supabase
      .from('action_group_participants')
      .insert({
        group_id: groupId,
        profile_id: profileId,
        role: role
      })
      .select()
      .single(), 'addGroupParticipant');
  },

  async removeParticipant(groupId: string, profileId: string): Promise<void> {
    console.log('👥 ActionGroups: Removing participant:', { groupId, profileId });

    return supabaseRequest(() => supabase
      .from('action_group_participants')
      .delete()
      .eq('group_id', groupId)
      .eq('profile_id', profileId), 'removeGroupParticipant');
  },

  async updateParticipantRole(groupId: string, profileId: string, role: 'leader' | 'member') {
    console.log('👥 ActionGroups: Updating participant role:', { groupId, profileId, role });

    return supabaseRequest(() => supabase
      .from('action_group_participants')
      .update({ role })
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .select()
      .single(), 'updateParticipantRole');
  },

  // Task Management
  async createTask(taskData: CreateTaskData): Promise<Task> {
    console.log('👥 ActionGroups: Creating task:', taskData.title);

    return supabaseRequest(() => supabase
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
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    console.log('👥 ActionGroups: Updating task:', id, updates);

    return supabaseRequest(() => supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateGroupTask');
  },

  async deleteTask(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting task:', id);

    return supabaseRequest(() => supabase
      .from('tasks')
      .delete()
      .eq('id', id), 'deleteGroupTask');
  },

  async getGroupTasks(groupId: string): Promise<TaskWithAssignee[]> {
    console.log('👥 ActionGroups: Getting tasks for group:', groupId);

    return supabaseRequest(() => supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, avatar_url, position)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }), 'getGroupTasks');
  },

  // Progress Tracking
  async getMemberContributions(groupId: string): Promise<MemberContribution[]> {
    console.log('👥 ActionGroups: Getting member contributions for group:', groupId);

    try {
      const { data, error } = await supabase.rpc('get_group_member_contributions', {
        group_id: groupId
      });

      if (error) {
        console.error('👥 ActionGroups: Error getting contributions:', error);
        throw error;
      }

      console.log('👥 ActionGroups: Member contributions fetched:', data?.length);
      return data || [];
    } catch (error) {
      console.error('👥 ActionGroups: Critical error getting contributions:', error);
      return [];
    }
  },

  async updateGroupProgress(groupId: string): Promise<void> {
    console.log('👥 ActionGroups: Manually updating group progress:', groupId);

    try {
      const { error } = await supabase.rpc('update_group_progress_manual', {
        group_id: groupId
      });

      if (error) {
        console.error('👥 ActionGroups: Error updating progress:', error);
        throw error;
      }

      console.log('👥 ActionGroups: Progress updated successfully');
    } catch (error) {
      console.error('👥 ActionGroups: Critical error updating progress:', error);
      throw error;
    }
  },

  // Helper function to get user's group IDs
  async getUserGroupIds(profileId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('action_group_participants')
        .select('group_id')
        .eq('profile_id', profileId);

      if (error) {
        console.error('👥 ActionGroups: Error getting user group IDs:', error);
        return '';
      }

      const groupIds = data?.map(p => p.group_id) || [];
      return groupIds.length > 0 ? groupIds.join(',') : '';
    } catch (error) {
      console.error('👥 ActionGroups: Error in getUserGroupIds:', error);
      return '';
    }
  },

  // PDI Integration
  async linkGroupToPDI(groupId: string, pdiId: string): Promise<void> {
    console.log('👥 ActionGroups: Linking group to PDI:', { groupId, pdiId });

    return supabaseRequest(() => supabase
      .from('action_groups')
      .update({ linked_pdi_id: pdiId })
      .eq('id', groupId), 'linkGroupToPDI');
  },

  async unlinkGroupFromPDI(groupId: string): Promise<void> {
    console.log('👥 ActionGroups: Unlinking group from PDI:', groupId);

    return supabaseRequest(() => supabase
      .from('action_groups')
      .update({ linked_pdi_id: null })
      .eq('id', groupId), 'unlinkGroupFromPDI');
  }
};