import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  level: string;
  position: string;
  team_id?: string;
  manager_id?: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role || 'employee',
          level: data.level,
          position: data.position,
          team_id: data.team_id,
          manager_id: data.manager_id
        }
      }
    });

    if (authError) throw authError;

    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async updateProfile(updates: Partial<Profile>) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProfile(userId?: string) {
    const targetUserId = userId || (await this.getCurrentUser())?.id;
    if (!targetUserId) throw new Error('No user ID provided');

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        team:teams(name),
        manager:profiles!manager_id(name)
      `)
      .eq('id', targetUserId)
      .single();

    if (error) throw error;
    return data;
  }
};