import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import type { Notification } from '../types';

export interface NotificationPreferences {
  id: string;
  profile_id: string;
  pdi_approved: boolean;
  pdi_rejected: boolean;
  task_assigned: boolean;
  achievement_unlocked: boolean;
  mentorship_scheduled: boolean;
  mentorship_cancelled: boolean;
  group_invitation: boolean;
  deadline_reminder: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_notifications: number;
  unread_notifications: number;
  notifications_today: number;
  most_common_type: string;
}

export interface CreateNotificationData {
  profile_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: string;
  related_id?: string;
  action_url?: string;
  metadata?: any;
}

export const notificationService = {
  // Basic CRUD
  async getNotifications(profileId: string, unreadOnly = false): Promise<Notification[]> {
    console.log('🔔 Notifications: Getting notifications for profile:', profileId, 'unreadOnly:', unreadOnly);

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getNotifications');
  },

  async markAsRead(id: string): Promise<Notification> {
    console.log('🔔 Notifications: Marking as read:', id);

    return supabaseRequest(() => supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single(), 'markNotificationAsRead');
  },

  async markAllAsRead(profileId: string): Promise<void> {
    console.log('🔔 Notifications: Marking all as read for profile:', profileId);

    return supabaseRequest(() => supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', profileId)
      .eq('read', false), 'markAllNotificationsAsRead');
  },

  async deleteNotification(id: string): Promise<void> {
    console.log('🔔 Notifications: Deleting notification:', id);

    return supabaseRequest(() => supabase
      .from('notifications')
      .delete()
      .eq('id', id), 'deleteNotification');
  },

  async createNotification(notification: CreateNotificationData): Promise<Notification> {
    console.log('🔔 Notifications: Creating notification:', notification.title);

    return supabaseRequest(() => supabase
      .from('notifications')
      .insert({
        profile_id: notification.profile_id,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        category: notification.category || 'general',
        related_id: notification.related_id || null,
        action_url: notification.action_url || null,
        metadata: notification.metadata || {}
      })
      .select()
      .single(), 'createNotification');
  },

  // Preferences Management
  async getPreferences(profileId: string): Promise<NotificationPreferences> {
    console.log('🔔 Notifications: Getting preferences for profile:', profileId);
    // Return default preferences since notification_preferences table doesn't exist yet
    return this.getDefaultPreferences();
        } catch (createError) {
          console.error('🔔 Notifications: Error creating default preferences:', createError);
          return this.getDefaultPreferences(profileId);
        }
      }

      return data;
    } catch (error) {
      console.error('🔔 Notifications: Error getting preferences:', error);
      // Return default preferences if there's any error
      return this.getDefaultPreferences(profileId);
    }
  },

  getDefaultPreferences(profileId: string): NotificationPreferences {
    return {
      id: 'default',
      profile_id: profileId,
      pdi_approved: true,
      pdi_rejected: true,
      task_assigned: true,
      achievement_unlocked: true,
      mentorship_scheduled: true,
      mentorship_cancelled: true,
      group_invitation: true,
      deadline_reminder: true,
      email_notifications: true,
      push_notifications: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async updatePreferences(profileId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    console.log('🔔 Notifications: Updating preferences for profile:', profileId);

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: profileId,
          ...preferences
        })
        .select()
        .single();

      if (error) {
        console.error('🔔 Notifications: Error updating preferences:', error);
        // Return current preferences with updates applied
        const current = await this.getPreferences(profileId);
        return { ...current, ...preferences };
      }

      return data;
    } catch (error) {
      console.error('🔔 Notifications: Error updating preferences:', error);
      // Return current preferences with updates applied
      const current = await this.getPreferences(profileId);
      return { ...current, ...preferences };
    }
  },

  async createDefaultPreferences(profileId: string): Promise<NotificationPreferences> {
    console.log('🔔 Notifications: Creating default preferences for profile:', profileId);

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          profile_id: profileId,
          pdi_approved: true,
          pdi_rejected: true,
          task_assigned: true,
          achievement_unlocked: true,
          mentorship_scheduled: true,
          mentorship_cancelled: true,
          group_invitation: true,
          deadline_reminder: true,
          email_notifications: true,
          push_notifications: true
        })
        .select()
        .single();

      if (error) {
        console.error('🔔 Notifications: Error creating default preferences:', error);
        return this.getDefaultPreferences(profileId);
      }

      return data;
    } catch (error) {
      console.error('🔔 Notifications: Error creating default preferences:', error);
      // Return default preferences object
      return this.getDefaultPreferences(profileId);
    }
  },

  // Statistics
  async getStats(profileId: string): Promise<NotificationStats> {
    console.log('🔔 Notifications: Getting stats for profile:', profileId);

    try {
      const { data, error } = await supabase.rpc('get_notification_stats', {
        p_profile_id: profileId
      });

    console.log('🔔 Notifications: Getting stats for profile:', profileId);
    // Return default stats since get_notification_stats function doesn't exist yet
    return this.getDefaultStats();
  },

  getDefaultStats(): NotificationStats {
    return {
      total_notifications: 0,
      unread_notifications: 0,
      notifications_today: 0,
      most_common_type: 'info'
    };
  },
  // Real-time subscription with enhanced error handling
  subscribeToNotifications(
    profileId: string, 
    callback: (notification: Notification) => void,
    statusCallback?: (status: string) => void
  ) {
    console.log('🔔 Notifications: Setting up enhanced subscription for profile:', profileId);
    
    const channel = supabase
      .channel(`notifications_${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('🔔 Notifications: Received real-time notification:', payload);
          if (payload.new) {
            callback(payload.new as Notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('🔔 Notifications: Notification updated:', payload);
          // Handle notification updates if needed
        }
      )
      .subscribe((status, err) => {
        console.log('🔔 Notifications: Subscription status:', status);
        if (err) {
          console.error('🔔 Notifications: Subscription error:', err);
        }
        if (statusCallback) {
          statusCallback(status);
        }
      });
    
    return channel;
  },

  // Specific notification creators
  async notifyPDIApproved(profileId: string, pdiTitle: string, pdiId: string): Promise<void> {
    await this.createNotification({
      profile_id: profileId,
      title: '✅ PDI Aprovado!',
      message: `Seu PDI "${pdiTitle}" foi aprovado pelo gestor. Parabéns!`,
      type: 'success',
      category: 'pdi_approved',
      related_id: pdiId,
      action_url: '/pdi'
    });
  },

  async notifyPDIRejected(profileId: string, pdiTitle: string, pdiId: string, reason?: string): Promise<void> {
    await this.createNotification({
      profile_id: profileId,
      title: '⚠️ PDI Precisa de Ajustes',
      message: `Seu PDI "${pdiTitle}" precisa de alguns ajustes.${reason ? ` Motivo: ${reason}` : ''}`,
      type: 'warning',
      category: 'pdi_rejected',
      related_id: pdiId,
      action_url: '/pdi'
    });
  },

  async notifyTaskAssigned(profileId: string, taskTitle: string, taskId: string, deadline: string): Promise<void> {
    await this.createNotification({
      profile_id: profileId,
      title: '📋 Nova Tarefa Atribuída',
      message: `Você recebeu uma nova tarefa: "${taskTitle}". Prazo: ${new Date(deadline).toLocaleDateString('pt-BR')}`,
      type: 'info',
      category: 'task_assigned',
      related_id: taskId,
      action_url: '/groups'
    });
  },

  async notifyAchievementUnlocked(profileId: string, achievementTitle: string, points: number, achievementId: string): Promise<void> {
    await this.createNotification({
      profile_id: profileId,
      title: '🏆 Nova Conquista Desbloqueada!',
      message: `Parabéns! Você desbloqueou "${achievementTitle}" e ganhou ${points} pontos!`,
      type: 'success',
      category: 'achievement_unlocked',
      related_id: achievementId,
      action_url: '/achievements'
    });
  },

  async notifyMentorshipScheduled(mentorId: string, menteeId: string, sessionDate: string, sessionId: string): Promise<void> {
    const formattedDate = new Date(sessionDate).toLocaleString('pt-BR');
    
    // Get mentor and mentee names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', [mentorId, menteeId]);

    const mentor = profiles?.find(p => p.id === mentorId);
    const mentee = profiles?.find(p => p.id === menteeId);

    if (mentor && mentee) {
      // Notify mentor
      await this.createNotification({
        profile_id: mentorId,
        title: '📅 Sessão de Mentoria Agendada',
        message: `Sessão agendada com ${mentee.name} para ${formattedDate}`,
        type: 'info',
        category: 'mentorship_scheduled',
        related_id: sessionId,
        action_url: '/mentorship'
      });

      // Notify mentee
      await this.createNotification({
        profile_id: menteeId,
        title: '📅 Sessão de Mentoria Confirmada',
        message: `Sua sessão com ${mentor.name} foi confirmada para ${formattedDate}`,
        type: 'success',
        category: 'mentorship_scheduled',
        related_id: sessionId,
        action_url: '/mentorship'
      });
    }
  },

  async notifyGroupInvitation(profileId: string, groupTitle: string, groupId: string, inviterName: string): Promise<void> {
    await this.createNotification({
      profile_id: profileId,
      title: '👥 Convite para Grupo de Ação',
      message: `${inviterName} convidou você para participar do grupo "${groupTitle}"`,
      type: 'info',
      category: 'group_invitation',
      related_id: groupId,
      action_url: '/groups'
    });
  },

  async notifyDeadlineReminder(profileId: string, itemTitle: string, itemType: string, deadline: string, itemId: string): Promise<void> {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    await this.createNotification({
      profile_id: profileId,
      title: '⏰ Lembrete de Prazo',
      message: `${itemType} "${itemTitle}" vence em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`,
      type: daysUntil <= 1 ? 'warning' : 'info',
      category: 'deadline_reminder',
      related_id: itemId,
      action_url: itemType === 'PDI' ? '/pdi' : '/groups'
    });
  },

  // Cleanup and maintenance
  async cleanupOldNotifications(): Promise<void> {
    console.log('🔔 Notifications: Cleaning up old notifications');

    try {
      const { error } = await supabase.rpc('cleanup_old_notifications');
      if (error) throw error;
      console.log('🔔 Notifications: Cleanup completed successfully');
    } catch (error) {
      console.error('🔔 Notifications: Error during cleanup:', error);
      throw error;
    }
  },

  // Browser notifications
  async requestBrowserPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('🔔 Notifications: Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  showBrowserNotification(title: string, message: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new window.Notification(title, {
        body: message,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'talentflow-notification',
        requireInteraction: false,
        silent: false
      });
    }
  },

  // Test functions for development
  async createTestNotifications(profileId: string): Promise<void> {
    console.log('🔔 Notifications: Creating test notifications for profile:', profileId);

    const testNotifications = [
      {
        title: '✅ PDI Aprovado (Teste)',
        message: 'Seu PDI "Aprender React Avançado" foi aprovado pelo gestor!',
        type: 'success' as const,
        category: 'pdi_approved'
      },
      {
        title: '📋 Nova Tarefa (Teste)',
        message: 'Você recebeu uma nova tarefa: "Revisar documentação"',
        type: 'info' as const,
        category: 'task_assigned'
      },
      {
        title: '🏆 Conquista Desbloqueada (Teste)',
        message: 'Parabéns! Você desbloqueou "Primeira Conquista" e ganhou 50 pontos!',
        type: 'success' as const,
        category: 'achievement_unlocked'
      },
      {
        title: '📅 Mentoria Agendada (Teste)',
        message: 'Sua sessão de mentoria foi confirmada para amanhã às 14:00',
        type: 'info' as const,
        category: 'mentorship_scheduled'
      }
    ];

    for (const notification of testNotifications) {
      await this.createNotification({
        profile_id: profileId,
        ...notification
      });
    }

    console.log('🔔 Notifications: Test notifications created successfully');
  }
};