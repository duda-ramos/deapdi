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
    console.log('🔐 AuthService: Starting signup process for:', data.email);
    
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          position: data.position,
          level: data.level,
          role: data.role || 'employee',
          team_id: data.team_id || null,
          manager_id: data.manager_id || null
        }
      }
    });

    if (authError) {
      console.error('🔐 AuthService: Signup error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Falha ao criar usuário');
    }

    console.log('🔐 AuthService: User created successfully:', authData.user.id);

    // Step 2: Sign in the user immediately (trigger will create profile)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (loginError) {
      console.error('🔐 AuthService: Auto-login error:', loginError);
      // Don't throw here, user can login manually
    }

    console.log('🔐 AuthService: Signup completed successfully');

    return { 
      user: authData.user, 
      session: loginData?.session || authData.session,
      profileCreated: true 
    };
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
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    return data || null;
  }
};