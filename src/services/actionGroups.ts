import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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
  linked_pdi_id?: string | null;
  participants: GroupParticipant[];
  tasks: GroupTask[];
  member_contributions: MemberContribution[];
  total_tasks: number;
  completed_tasks: number;
}

interface GroupParticipant {
  id: string;
  profile_id: string;
  group_id: string;
  role: 'leader' | 'member';
  created_at: string;
  profile: {
    id: string;
    name: string;
    avatar_url: string | null;
    position: string;
    email: string;
  };
}

interface GroupTask {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  group_id: string;
  deadline: string;
  status: 'todo' | 'in-progress' | 'done';
  created_at: string;
  updated_at: string;
  assignee: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface MemberContribution {
  profile_id: string;
  name: string;
  avatar_url: string | null;
  role: 'leader' | 'member';
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  pending_tasks: number;
  in_progress_tasks: number;
}

export interface CreateGroupData {
  title: string;
  description: string;
  deadline: string;
  participants: string[];
  linked_pdi_id?: string;
}

interface UpdateGroupData {
  title?: string;
  description?: string;
  deadline?: string;
  status?: 'active' | 'completed' | 'cancelled';
  linked_pdi_id?: string | null;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignee_id: string;
  deadline: string;
  group_id: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  assignee_id?: string;
  deadline?: string;
  status?: 'todo' | 'in-progress' | 'done';
}

interface GroupStatistics {
  total_groups: number;
  active_groups: number;
  completed_groups: number;
  total_tasks: number;
  completed_tasks: number;
  average_completion_rate: number;
  groups_created_this_month: number;
  tasks_completed_this_month: number;
}

interface TaskNotification {
  task_id: string;
  task_title: string;
  assignee_id: string;
  group_title: string;
  deadline: string;
  action_type: 'assigned' | 'reminder' | 'completed' | 'overdue';
}

// ============================================================================
// ACTION GROUP SERVICE
// ============================================================================

class ActionGroupService {
  // ========================================================================
  // GROUP MANAGEMENT
  // ========================================================================

  /**
   * Get all action groups with full details including participants, tasks, and progress
   */
  async getActionGroups(): Promise<GroupWithDetails[]> {
    console.log('👥 ActionGroups: Fetching all groups with details');

    try {
      const groups = await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .select(`
            *,
            participants:action_group_participants(
              id,
              profile_id,
              role,
              profile:profiles!inner(id, name, avatar_url, position, email)
            ),
            tasks:tasks(
              id,
              title,
              description,
              assignee_id,
              deadline,
              status,
              created_at,
              updated_at,
              assignee:profiles!inner(id, name, avatar_url)
            )
          `)
          .order('created_at', { ascending: false }),
        'getActionGroups'
      );

      return this.enrichGroupsWithCalculations(groups);
    } catch (error) {
      console.error('👥 ActionGroups: Error getting groups:', error);
      throw new Error('Erro ao carregar grupos de ação');
    }
  }

  /**
   * Get a single action group with full details
   */
  async getGroupWithDetails(groupId: string): Promise<GroupWithDetails> {
    console.log('👥 ActionGroups: Getting group details for:', groupId);

    try {
      const group = await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .select(`
            *,
            participants:action_group_participants(
              id,
              profile_id,
              role,
              profile:profiles!inner(id, name, avatar_url, position, email)
            ),
            tasks:tasks(
              id,
              title,
              description,
              assignee_id,
              deadline,
              status,
              created_at,
              updated_at,
              assignee:profiles!inner(id, name, avatar_url)
            )
          `)
          .eq('id', groupId)
          .single(),
        'getGroupWithDetails'
      );

      const enriched = this.enrichGroupsWithCalculations([group]);
      return enriched[0];
    } catch (error) {
      console.error('👥 ActionGroups: Error getting group details:', error);
      throw new Error('Erro ao carregar detalhes do grupo');
    }
  }

  /**
   * Create a new action group with initial participants
   */
  async createGroup(data: CreateGroupData, createdBy: string): Promise<GroupWithDetails> {
    console.log('👥 ActionGroups: Creating group:', data.title);

    // Validate data
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Título do grupo é obrigatório');
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Descrição do grupo é obrigatória');
    }
    if (!data.deadline) {
      throw new Error('Prazo do grupo é obrigatório');
    }

    const deadlineDate = new Date(data.deadline);
    if (deadlineDate < new Date()) {
      throw new Error('Prazo deve ser uma data futura');
    }

    try {
      // Create group
      const group = await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .insert({
            title: data.title.trim(),
            description: data.description.trim(),
            deadline: data.deadline,
            created_by: createdBy,
            status: 'active',
            linked_pdi_id: data.linked_pdi_id || null
          })
          .select()
          .single(),
        'createActionGroup'
      );

      console.log('👥 ActionGroups: Group created, adding participants');

      // Add creator as leader
      await this.addParticipant(group.id, createdBy, 'leader');

      // Add selected participants as members
      for (const participantId of data.participants) {
        if (participantId !== createdBy) {
          await this.addParticipant(group.id, participantId, 'member');
        }
      }

      // Send notifications to all participants
      try {
        const { notificationService } = await import('./notifications');
        for (const participantId of data.participants) {
          if (participantId !== createdBy) {
            await notificationService.createNotification({
              profile_id: participantId,
              title: 'Adicionado a um Grupo de Ação',
              message: `Você foi adicionado ao grupo "${data.title}"`,
              type: 'info',
              category: 'action_group',
              related_id: group.id,
              action_url: `/action-groups`
            });
          }
        }
      } catch (notificationError) {
        console.warn('👥 ActionGroups: Could not send participant notifications:', notificationError);
      }

      // Reload group with full details
      return this.getGroupWithDetails(group.id);
    } catch (error) {
      console.error('👥 ActionGroups: Critical error creating group:', error);
      throw new Error('Erro ao criar grupo de ação');
    }
  }

  /**
   * Update an existing action group
   */
  async updateGroup(id: string, updates: UpdateGroupData): Promise<GroupWithDetails> {
    console.log('👥 ActionGroups: Updating group:', id);

    // Validate updates
    if (updates.deadline) {
      const deadlineDate = new Date(updates.deadline);
      if (deadlineDate < new Date()) {
        throw new Error('Prazo deve ser uma data futura');
      }
    }

    try {
      await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .update(updates)
          .eq('id', id),
        'updateActionGroup'
      );

      return this.getGroupWithDetails(id);
    } catch (error) {
      console.error('👥 ActionGroups: Error updating group:', error);
      throw new Error('Erro ao atualizar grupo');
    }
  }

  /**
   * Delete an action group (soft delete by setting status to cancelled)
   */
  async deleteGroup(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting group:', id);

    try {
      await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .update({ status: 'cancelled' })
          .eq('id', id),
        'deleteActionGroup'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error deleting group:', error);
      throw new Error('Erro ao excluir grupo');
    }
  }

  /**
   * Complete an action group and trigger integrations
   */
  async completeGroup(id: string): Promise<GroupWithDetails> {
    console.log('👥 ActionGroups: Completing group:', id);

    try {
      const group = await this.getGroupWithDetails(id);

      // Validate all tasks are completed
      if (group.progress < 100) {
        throw new Error('Todas as tarefas devem estar concluídas antes de finalizar o grupo');
      }

      // Update group status
      await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', id),
        'completeActionGroup'
      );

      // If linked to PDI, update PDI status
      if (group.linked_pdi_id) {
        try {
          await supabase!
            .from('pdis')
            .update({ status: 'completed' })
            .eq('id', group.linked_pdi_id);

          console.log('👥 ActionGroups: Updated linked PDI status');
        } catch (pdiError) {
          console.warn('👥 ActionGroups: Could not update PDI:', pdiError);
        }
      }

      // Send completion notifications to all participants
      try {
        const { notificationService } = await import('./notifications');
        for (const participant of group.participants) {
          await notificationService.createNotification({
            profile_id: participant.profile_id,
            title: 'Grupo de Ação Concluído',
            message: `O grupo "${group.title}" foi concluído com sucesso!`,
            type: 'success',
            category: 'action_group',
            related_id: group.id,
            action_url: `/action-groups`
          });
        }
      } catch (notificationError) {
        console.warn('👥 ActionGroups: Could not send completion notifications:', notificationError);
      }

      return this.getGroupWithDetails(id);
    } catch (error) {
      console.error('👥 ActionGroups: Error completing group:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao concluir grupo');
    }
  }

  // ========================================================================
  // PARTICIPANT MANAGEMENT
  // ========================================================================

  /**
   * Add a participant to a group
   */
  async addParticipant(groupId: string, profileId: string, role: 'leader' | 'member' = 'member'): Promise<void> {
    console.log('👥 ActionGroups: Adding participant:', { groupId, profileId, role });

    try {
      await supabaseRequest(
        () => supabase!
          .from('action_group_participants')
          .insert({
            group_id: groupId,
            profile_id: profileId,
            role: role
          }),
        'addGroupParticipant'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error adding participant:', error);
      throw new Error('Erro ao adicionar participante');
    }
  }

  /**
   * Remove a participant from a group
   */
  async removeParticipant(groupId: string, profileId: string): Promise<void> {
    console.log('👥 ActionGroups: Removing participant:', { groupId, profileId });

    try {
      // Check if participant has pending tasks
      const tasks = await supabaseRequest(
        () => supabase!
          .from('tasks')
          .select('id, status')
          .eq('group_id', groupId)
          .eq('assignee_id', profileId)
          .in('status', ['todo', 'in-progress']),
        'checkParticipantTasks'
      );

      if (tasks && tasks.length > 0) {
        throw new Error('Participante possui tarefas pendentes. Reatribua ou conclua as tarefas antes de remover.');
      }

      await supabaseRequest(
        () => supabase!
          .from('action_group_participants')
          .delete()
          .eq('group_id', groupId)
          .eq('profile_id', profileId),
        'removeGroupParticipant'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error removing participant:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao remover participante');
    }
  }

  /**
   * Get all participants of a group
   */
  async getGroupParticipants(groupId: string): Promise<GroupParticipant[]> {
    console.log('👥 ActionGroups: Getting participants for group:', groupId);

    try {
      return await supabaseRequest(
        () => supabase!
          .from('action_group_participants')
          .select(`
            *,
            profile:profiles!inner(id, name, avatar_url, position, email)
          `)
          .eq('group_id', groupId)
          .order('role', { ascending: false }),
        'getGroupParticipants'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error getting participants:', error);
      return [];
    }
  }

  /**
   * Update participant role
   */
  async updateParticipantRole(groupId: string, profileId: string, newRole: 'leader' | 'member'): Promise<void> {
    console.log('👥 ActionGroups: Updating participant role:', { groupId, profileId, newRole });

    try {
      await supabaseRequest(
        () => supabase!
          .from('action_group_participants')
          .update({ role: newRole })
          .eq('group_id', groupId)
          .eq('profile_id', profileId),
        'updateParticipantRole'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error updating participant role:', error);
      throw new Error('Erro ao atualizar papel do participante');
    }
  }

  // ========================================================================
  // TASK MANAGEMENT
  // ========================================================================

  /**
   * Create a new task in a group
   */
  async createTask(taskData: CreateTaskData): Promise<GroupTask> {
    console.log('👥 ActionGroups: Creating task:', taskData.title);

    // Validate task data
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new Error('Título da tarefa é obrigatório');
    }
    if (!taskData.assignee_id) {
      throw new Error('Responsável pela tarefa é obrigatório');
    }
    if (!taskData.deadline) {
      throw new Error('Prazo da tarefa é obrigatório');
    }

    const deadlineDate = new Date(taskData.deadline);
    if (deadlineDate < new Date()) {
      throw new Error('Prazo deve ser uma data futura');
    }

    try {
      // Verify assignee is a participant of the group
      const participants = await this.getGroupParticipants(taskData.group_id);
      const isParticipant = participants.some(p => p.profile_id === taskData.assignee_id);

      if (!isParticipant) {
        throw new Error('Responsável deve ser um participante do grupo');
      }

      const task = await supabaseRequest(
        () => supabase!
          .from('tasks')
          .insert({
            title: taskData.title.trim(),
            description: taskData.description?.trim() || null,
            assignee_id: taskData.assignee_id,
            group_id: taskData.group_id,
            deadline: taskData.deadline,
            status: 'todo'
          })
          .select(`
            *,
            assignee:profiles!inner(id, name, avatar_url)
          `)
          .single(),
        'createGroupTask'
      );

      // Send notification to assignee
      try {
        const { notificationService } = await import('./notifications');
        const group = await this.getGroupWithDetails(taskData.group_id);

        await notificationService.createNotification({
          profile_id: taskData.assignee_id,
          title: 'Nova Tarefa Atribuída',
          message: `Você recebeu uma nova tarefa "${taskData.title}" no grupo "${group.title}"`,
          type: 'info',
          category: 'task',
          related_id: task.id,
          action_url: `/action-groups`,
          metadata: {
            task_id: task.id,
            group_id: taskData.group_id,
            deadline: taskData.deadline
          }
        });
      } catch (notificationError) {
        console.warn('👥 ActionGroups: Could not send task notification:', notificationError);
      }

      return task;
    } catch (error) {
      console.error('👥 ActionGroups: Error creating task:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao criar tarefa');
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: UpdateTaskData): Promise<GroupTask> {
    console.log('👥 ActionGroups: Updating task:', id, updates);

    // Validate updates
    if (updates.deadline) {
      const deadlineDate = new Date(updates.deadline);
      if (deadlineDate < new Date()) {
        throw new Error('Prazo deve ser uma data futura');
      }
    }

    try {
      const task = await supabaseRequest(
        () => supabase!
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .select(`
            *,
            assignee:profiles!inner(id, name, avatar_url)
          `)
          .single(),
        'updateGroupTask'
      );

      // If status changed to completed, send notification
      if (updates.status === 'done') {
        try {
          const { notificationService } = await import('./notifications');
          const group = await this.getGroupWithDetails(task.group_id);
          const participants = group.participants.filter(p => p.profile_id !== task.assignee_id);

          for (const participant of participants) {
            await notificationService.createNotification({
              profile_id: participant.profile_id,
              title: 'Tarefa Concluída',
              message: `${task.assignee.name} concluiu a tarefa "${task.title}" no grupo "${group.title}"`,
              type: 'success',
              category: 'task',
              related_id: task.id,
              action_url: `/action-groups`
            });
          }
        } catch (notificationError) {
          console.warn('👥 ActionGroups: Could not send completion notification:', notificationError);
        }
      }

      return task;
    } catch (error) {
      console.error('👥 ActionGroups: Error updating task:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao atualizar tarefa');
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    console.log('👥 ActionGroups: Deleting task:', id);

    try {
      await supabaseRequest(
        () => supabase!
          .from('tasks')
          .delete()
          .eq('id', id),
        'deleteGroupTask'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error deleting task:', error);
      throw new Error('Erro ao excluir tarefa');
    }
  }

  /**
   * Get all tasks for a specific group
   */
  async getGroupTasks(groupId: string): Promise<GroupTask[]> {
    console.log('👥 ActionGroups: Getting tasks for group:', groupId);

    try {
      return await supabaseRequest(
        () => supabase!
          .from('tasks')
          .select(`
            *,
            assignee:profiles!inner(id, name, avatar_url)
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: false }),
        'getGroupTasks'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error getting tasks:', error);
      return [];
    }
  }

  /**
   * Reassign a task to a different participant
   */
  async reassignTask(taskId: string, newAssigneeId: string): Promise<GroupTask> {
    console.log('👥 ActionGroups: Reassigning task:', { taskId, newAssigneeId });

    try {
      const task = await supabaseRequest(
        () => supabase!
          .from('tasks')
          .select('*, group_id')
          .eq('id', taskId)
          .single(),
        'getTaskForReassign'
      );

      // Verify new assignee is a participant
      const participants = await this.getGroupParticipants(task.group_id);
      const isParticipant = participants.some(p => p.profile_id === newAssigneeId);

      if (!isParticipant) {
        throw new Error('Novo responsável deve ser um participante do grupo');
      }

      return await this.updateTask(taskId, { assignee_id: newAssigneeId });
    } catch (error) {
      console.error('👥 ActionGroups: Error reassigning task:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao reatribuir tarefa');
    }
  }

  // ========================================================================
  // PROGRESS & STATISTICS
  // ========================================================================

  /**
   * Get member contributions for a specific group
   */
  async getMemberContributions(groupId: string): Promise<MemberContribution[]> {
    console.log('👥 ActionGroups: Getting member contributions for group:', groupId);

    try {
      const participants = await this.getGroupParticipants(groupId);
      const tasks = await this.getGroupTasks(groupId);

      return participants.map(participant => {
        const memberTasks = tasks.filter(t => t.assignee_id === participant.profile_id);
        const completedTasks = memberTasks.filter(t => t.status === 'done').length;
        const pendingTasks = memberTasks.filter(t => t.status === 'todo').length;
        const inProgressTasks = memberTasks.filter(t => t.status === 'in-progress').length;
        const totalTasks = memberTasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          profile_id: participant.profile_id,
          name: participant.profile.name,
          avatar_url: participant.profile.avatar_url,
          role: participant.role,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks: pendingTasks,
          in_progress_tasks: inProgressTasks,
          completion_rate: completionRate
        };
      });
    } catch (error) {
      console.error('👥 ActionGroups: Error getting member contributions:', error);
      return [];
    }
  }

  /**
   * Get overall statistics for action groups
   */
  async getGroupStatistics(userId?: string): Promise<GroupStatistics> {
    console.log('👥 ActionGroups: Getting group statistics');

    try {
      let groupsQuery = supabase!
        .from('action_groups')
        .select('*');

      // If userId provided, filter for user's groups
      if (userId) {
        groupsQuery = groupsQuery.or(`created_by.eq.${userId},participants.profile_id.eq.${userId}`);
      }

      const groups = await supabaseRequest(() => groupsQuery, 'getGroupsForStats');

      const activeGroups = groups.filter((g: any) => g.status === 'active').length;
      const completedGroups = groups.filter((g: any) => g.status === 'completed').length;

      // Get tasks
      const tasks = await supabaseRequest(
        () => supabase!
          .from('tasks')
          .select('*')
          .in('group_id', groups.map((g: any) => g.id)),
        'getTasksForStats'
      );

      const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
      const averageCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

      // Calculate this month's stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const groupsThisMonth = groups.filter((g: any) =>
        new Date(g.created_at) >= firstDayOfMonth
      ).length;

      const tasksCompletedThisMonth = tasks.filter((t: any) =>
        t.status === 'done' && new Date(t.updated_at) >= firstDayOfMonth
      ).length;

      return {
        total_groups: groups.length,
        active_groups: activeGroups,
        completed_groups: completedGroups,
        total_tasks: tasks.length,
        completed_tasks: completedTasks,
        average_completion_rate: averageCompletionRate,
        groups_created_this_month: groupsThisMonth,
        tasks_completed_this_month: tasksCompletedThisMonth
      };
    } catch (error) {
      console.error('👥 ActionGroups: Error getting statistics:', error);
      return {
        total_groups: 0,
        active_groups: 0,
        completed_groups: 0,
        total_tasks: 0,
        completed_tasks: 0,
        average_completion_rate: 0,
        groups_created_this_month: 0,
        tasks_completed_this_month: 0
      };
    }
  }

  // ========================================================================
  // PDI INTEGRATION
  // ========================================================================

  /**
   * Link a group to a PDI
   */
  async linkGroupToPDI(groupId: string, pdiId: string): Promise<void> {
    console.log('👥 ActionGroups: Linking group to PDI:', { groupId, pdiId });

    try {
      await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .update({ linked_pdi_id: pdiId })
          .eq('id', groupId),
        'linkGroupToPDI'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error linking to PDI:', error);
      throw new Error('Erro ao vincular grupo ao PDI');
    }
  }

  /**
   * Unlink a group from a PDI
   */
  async unlinkGroupFromPDI(groupId: string): Promise<void> {
    console.log('👥 ActionGroups: Unlinking group from PDI:', groupId);

    try {
      await supabaseRequest(
        () => supabase!
          .from('action_groups')
          .update({ linked_pdi_id: null })
          .eq('id', groupId),
        'unlinkGroupFromPDI'
      );
    } catch (error) {
      console.error('👥 ActionGroups: Error unlinking from PDI:', error);
      throw new Error('Erro ao desvincular grupo do PDI');
    }
  }

  // ========================================================================
  // NOTIFICATIONS & REMINDERS
  // ========================================================================

  /**
   * Send deadline reminders for upcoming tasks
   */
  async sendDeadlineReminders(): Promise<void> {
    console.log('👥 ActionGroups: Sending deadline reminders');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Get tasks due tomorrow
      const tasks = await supabaseRequest(
        () => supabase!
          .from('tasks')
          .select(`
            *,
            assignee:profiles!inner(id, name),
            action_group:action_groups!inner(id, title)
          `)
          .eq('status', 'in-progress')
          .gte('deadline', tomorrowStr)
          .lt('deadline', `${tomorrowStr}T23:59:59`),
        'getTasksForReminders'
      );

      const { notificationService } = await import('./notifications');

      for (const task of tasks) {
        await notificationService.createNotification({
          profile_id: task.assignee_id,
          title: 'Lembrete: Tarefa com Prazo Próximo',
          message: `A tarefa "${task.title}" no grupo "${task.action_group.title}" vence amanhã!`,
          type: 'warning',
          category: 'task',
          related_id: task.id,
          action_url: `/action-groups`
        });
      }

      console.log(`👥 ActionGroups: Sent ${tasks.length} deadline reminders`);
    } catch (error) {
      console.error('👥 ActionGroups: Error sending deadline reminders:', error);
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Enrich groups with calculated progress and contributions
   */
  private enrichGroupsWithCalculations(groups: any[]): GroupWithDetails[] {
    return groups.map(group => {
      const totalTasks = group.tasks?.length || 0;
      const completedTasks = group.tasks?.filter((t: any) => t.status === 'done').length || 0;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate member contributions
      const memberContributions = group.participants?.map((participant: any) => {
        const memberTasks = group.tasks?.filter((t: any) => t.assignee_id === participant.profile_id) || [];
        const memberCompletedTasks = memberTasks.filter((t: any) => t.status === 'done').length;
        const memberPendingTasks = memberTasks.filter((t: any) => t.status === 'todo').length;
        const memberInProgressTasks = memberTasks.filter((t: any) => t.status === 'in-progress').length;
        const memberTotalTasks = memberTasks.length;
        const completionRate = memberTotalTasks > 0 ? (memberCompletedTasks / memberTotalTasks) * 100 : 0;

        return {
          profile_id: participant.profile_id,
          name: participant.profile?.name,
          avatar_url: participant.profile?.avatar_url,
          role: participant.role,
          total_tasks: memberTotalTasks,
          completed_tasks: memberCompletedTasks,
          pending_tasks: memberPendingTasks,
          in_progress_tasks: memberInProgressTasks,
          completion_rate: completionRate
        };
      }) || [];

      return {
        ...group,
        progress,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        member_contributions: memberContributions
      };
    });
  }
}

// Export singleton instance
export const actionGroupService = new ActionGroupService();