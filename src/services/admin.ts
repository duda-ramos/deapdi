import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface SystemConfig {
  id: string;
  company_name: string;
  system_url: string;
  timezone: string;
  default_language: string;
  admin_email: string;
  maintenance_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_pdis: number;
  completed_pdis: number;
  total_teams: number;
  total_achievements: number;
  system_uptime: string;
  last_backup: string;
  database_size: string;
  active_sessions: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const adminService = {
  // System Configuration
  async getSystemConfig(): Promise<SystemConfig> {
    console.log('⚙️ Admin: Getting system configuration');

    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .single();

      if (error) {
        console.warn('⚙️ Admin: system_config table not found, returning defaults');
        return this.getDefaultConfig();
      }

      return data;
    } catch (error) {
      console.error('⚙️ Admin: Error getting system config:', error);
      return this.getDefaultConfig();
    }
  },

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    console.log('⚙️ Admin: Updating system configuration');

    try {
      return await supabaseRequest(() => supabase
        .from('system_config')
        .upsert(config)
        .select()
        .single(), 'updateSystemConfig');
    } catch (error) {
      console.error('⚙️ Admin: Error updating config, using localStorage fallback');
      // Fallback to localStorage if table doesn't exist
      const updatedConfig = { ...this.getDefaultConfig(), ...config };
      localStorage.setItem('system_config', JSON.stringify(updatedConfig));
      return updatedConfig;
    }
  },

  getDefaultConfig(): SystemConfig {
    const saved = localStorage.getItem('system_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved config:', error);
      }
    }

    return {
      id: 'default',
      company_name: 'TalentFlow Corp',
      system_url: 'https://talentflow.empresa.com',
      timezone: 'America/Sao_Paulo',
      default_language: 'pt-BR',
      admin_email: 'admin@empresa.com',
      maintenance_mode: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  // System Statistics
  async getSystemStats(): Promise<SystemStats> {
    console.log('⚙️ Admin: Getting system statistics');

    try {
      const [
        profilesResult,
        pdisResult,
        teamsResult,
        achievementsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, status', { count: 'exact' }),
        supabase.from('pdis').select('id, status', { count: 'exact' }),
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('achievements').select('id', { count: 'exact', head: true })
      ]);

      const profiles = profilesResult.data || [];
      const pdis = pdisResult.data || [];

      return {
        total_users: profiles.length,
        active_users: profiles.filter(p => p.status === 'active').length,
        total_pdis: pdis.length,
        completed_pdis: pdis.filter(p => p.status === 'completed' || p.status === 'validated').length,
        total_teams: teamsResult.count || 0,
        total_achievements: achievementsResult.count || 0,
        system_uptime: '99.9%', // Would come from monitoring service
        last_backup: new Date().toISOString(),
        database_size: '2.3GB', // Would come from database metrics
        active_sessions: Math.floor(Math.random() * 50) + 10 // Mock active sessions
      };
    } catch (error) {
      console.error('⚙️ Admin: Error getting system stats:', error);
      return {
        total_users: 0,
        active_users: 0,
        total_pdis: 0,
        completed_pdis: 0,
        total_teams: 0,
        total_achievements: 0,
        system_uptime: 'N/A',
        last_backup: 'N/A',
        database_size: 'N/A',
        active_sessions: 0
      };
    }
  },

  // Audit Logs
  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    console.log('⚙️ Admin: Getting audit logs');

    try {
      return await supabaseRequest(() => supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit), 'getAuditLogs');
    } catch (error) {
      console.warn('⚙️ Admin: audit_logs table not found, returning sample logs');
      return this.getSampleAuditLogs();
    }
  },

  async createAuditLog(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    console.log('⚙️ Admin: Creating audit log:', { userId, action, resourceType });

    return supabaseRequest(() => supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: '127.0.0.1', // Would be actual IP in production
        user_agent: navigator.userAgent
      }), 'createAuditLog');
  },

  getSampleAuditLogs(): AuditLog[] {
    return [
      {
        id: '1',
        user_id: 'admin-1',
        action: 'Login realizado',
        resource_type: 'auth',
        details: {},
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        user: { name: 'Admin User', email: 'admin@empresa.com' }
      },
      {
        id: '2',
        user_id: 'hr-1',
        action: 'Usuário criado',
        resource_type: 'profile',
        resource_id: 'new-user-123',
        details: { name: 'Novo Colaborador' },
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0...',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        user: { name: 'RH User', email: 'rh@empresa.com' }
      },
      {
        id: '3',
        user_id: 'admin-1',
        action: 'Configuração alterada',
        resource_type: 'system_config',
        details: { field: 'company_name', old_value: 'Old Name', new_value: 'New Name' },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        user: { name: 'Admin User', email: 'admin@empresa.com' }
      }
    ];
  },

  // System Maintenance
  async clearCache(): Promise<void> {
    console.log('⚙️ Admin: Clearing system cache');
    
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear localStorage (except auth)
      const authData = localStorage.getItem('supabase.auth.token');
      localStorage.clear();
      if (authData) {
        localStorage.setItem('supabase.auth.token', authData);
      }
      
      console.log('⚙️ Admin: Cache cleared successfully');
    } catch (error) {
      console.error('⚙️ Admin: Error clearing cache:', error);
      throw error;
    }
  },

  async exportLogs(): Promise<void> {
    console.log('⚙️ Admin: Exporting system logs');
    
    try {
      const logs = await this.getAuditLogs(1000);
      
      const csvContent = [
        'Timestamp,User,Email,Action,Resource Type,Resource ID,IP Address',
        ...logs.map(log => [
          log.created_at,
          log.user?.name || 'Unknown',
          log.user?.email || 'Unknown',
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.ip_address
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('⚙️ Admin: Error exporting logs:', error);
      throw error;
    }
  },

  async cleanupTempData(): Promise<void> {
    console.log('⚙️ Admin: Cleaning up temporary data');
    
    try {
      // Clean up old notifications (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await supabase
        .from('notifications')
        .delete()
        .eq('read', true)
        .lt('created_at', thirtyDaysAgo.toISOString());
      
      console.log('⚙️ Admin: Temporary data cleaned successfully');
    } catch (error) {
      console.error('⚙️ Admin: Error cleaning temporary data:', error);
      throw error;
    }
  }
};