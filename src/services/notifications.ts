import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export const notificationService = {
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

  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(profileId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', profileId)
      .eq('read', false);

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

  async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Real-time subscription for notifications
  subscribeToNotifications(
    profileId: string, 
    callback: (notification: Notification) => void,
    statusCallback?: (status: string) => void
  ) {
    console.log('🔔 Notifications: Setting up subscription for profile:', profileId);
    
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
  }
};