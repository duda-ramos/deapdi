import { supabase } from '../lib/supabase';
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

interface SubscriptionConfig<T> {
  tableName: string;
  callback: (payload: { eventType: string; new: T; old: T }) => void;
  filter?: string;
  onSubscribed?: () => void;
  onError?: (error: string) => void;
}

interface ChannelInfo {
  channel: RealtimeChannel;
  config: SubscriptionConfig<any>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export class RealtimeService {
  private channels: Map<string, ChannelInfo> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isReconnecting: boolean = false;

  subscribeToTable<T>(
    tableName: string,
    callback: (payload: { eventType: string; new: T; old: T }) => void,
    filter?: string,
    onSubscribed?: () => void,
    onError?: (error: string) => void
  ) {
    const channelName = `${tableName}_${filter || 'all'}`;

    if (this.channels.has(channelName)) {
      console.log(`🔄 Realtime: Channel ${channelName} already exists, returning existing channel`);
      return this.channels.get(channelName)!.channel;
    }

    const config: SubscriptionConfig<T> = {
      tableName,
      callback,
      filter,
      onSubscribed,
      onError
    };

    console.log(`🔄 Realtime: Creating new channel ${channelName}`);
    this.createChannel(channelName, config);

    return this.channels.get(channelName)?.channel;
  }

  private createChannel<T>(channelName: string, config: SubscriptionConfig<T>) {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.tableName,
          filter: config.filter
        },
        (payload) => {
          console.log(`🔄 Realtime: Received event on ${channelName}:`, payload.eventType);
          config.callback({
            eventType: payload.eventType,
            new: payload.new as T,
            old: payload.old as T
          });
        }
      )
      .subscribe((status) => {
        console.log(`🔄 Realtime: Channel ${channelName} status:`, status);

        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log(`✅ Realtime: Successfully subscribed to ${channelName}`);
          const channelInfo = this.channels.get(channelName);
          if (channelInfo) {
            channelInfo.reconnectAttempts = 0;
          }
          config.onSubscribed?.();
        } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          console.error(`❌ Realtime: Channel error on ${channelName}`);
          config.onError?.('Erro na conexão em tempo real');
          this.handleChannelError(channelName, config);
        } else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
          console.error(`⏱️ Realtime: Channel timeout on ${channelName}`);
          config.onError?.('Timeout na conexão em tempo real');
          this.handleChannelError(channelName, config);
        } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
          console.warn(`🔌 Realtime: Channel closed on ${channelName}`);
          this.handleChannelError(channelName, config);
        }
      });

    this.channels.set(channelName, {
      channel,
      config,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5
    });
  }

  private handleChannelError<T>(channelName: string, config: SubscriptionConfig<T>) {
    const channelInfo = this.channels.get(channelName);
    if (!channelInfo) return;

    if (channelInfo.reconnectAttempts >= channelInfo.maxReconnectAttempts) {
      console.error(`❌ Realtime: Max reconnection attempts reached for ${channelName}`);
      config.onError?.('Não foi possível reconectar. Por favor, recarregue a página.');
      return;
    }

    channelInfo.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, channelInfo.reconnectAttempts), 30000);

    console.log(`🔄 Realtime: Attempting to reconnect ${channelName} in ${delay}ms (attempt ${channelInfo.reconnectAttempts}/${channelInfo.maxReconnectAttempts})`);

    const timeout = setTimeout(() => {
      console.log(`🔄 Realtime: Reconnecting ${channelName}...`);
      this.unsubscribe(channelName);
      this.createChannel(channelName, config);
      this.reconnectTimeouts.delete(channelName);
    }, delay);

    this.reconnectTimeouts.set(channelName, timeout);
  }

  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  async reconnectAll() {
    if (this.isReconnecting) {
      console.log('🔄 Realtime: Reconnection already in progress');
      return;
    }

    console.log('🔄 Realtime: Reconnecting all channels...');
    this.isReconnecting = true;

    const isConnected = await this.checkConnection();
    if (!isConnected) {
      console.error('❌ Realtime: No connection to database');
      this.isReconnecting = false;
      return;
    }

    const channelEntries = Array.from(this.channels.entries());

    for (const [channelName, channelInfo] of channelEntries) {
      console.log(`🔄 Realtime: Recreating channel ${channelName}`);
      this.unsubscribe(channelName);
      this.createChannel(channelName, channelInfo.config);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isReconnecting = false;
    console.log('✅ Realtime: All channels reconnected');
  }

  unsubscribe(channelName: string) {
    const channelInfo = this.channels.get(channelName);
    if (channelInfo) {
      console.log(`🔌 Realtime: Unsubscribing from ${channelName}`);
      supabase.removeChannel(channelInfo.channel);
      this.channels.delete(channelName);
    }

    const timeout = this.reconnectTimeouts.get(channelName);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(channelName);
    }
  }

  unsubscribeAll() {
    console.log('🔌 Realtime: Unsubscribing from all channels');
    this.channels.forEach((channelInfo, name) => {
      supabase.removeChannel(channelInfo.channel);
    });
    this.channels.clear();

    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
  }

  getChannelStatus(channelName: string): string | undefined {
    const channelInfo = this.channels.get(channelName);
    return channelInfo?.channel.state;
  }

  getAllChannelStatuses(): Record<string, string> {
    const statuses: Record<string, string> = {};
    this.channels.forEach((channelInfo, name) => {
      statuses[name] = channelInfo.channel.state;
    });
    return statuses;
  }
}

export const realtimeService = new RealtimeService();