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

// Test function for isolated signup testing
export const testSignUp = async (email: string, password: string) => {
  console.log('🧪 TEST SIGNUP - Starting isolated test');
  console.log('🧪 TEST SIGNUP - Email:', email);
  console.log('🧪 TEST SIGNUP - Password length:', password.length);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });
    
    console.log('🧪 TEST SIGNUP - Raw response:', { data, error });
    console.log('🧪 TEST SIGNUP - User created:', !!data.user);
    console.log('🧪 TEST SIGNUP - Session created:', !!data.session);
    
    if (error) {
      console.error('🧪 TEST SIGNUP - Error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    console.error('🧪 TEST SIGNUP - Exception:', err);
    return { success: false, error: err };
  }
};

export const authService = {
  async signUp(data: SignUpData) {
    console.log('🔐 AuthService: ========== SIGNUP PROCESS START ==========');
    console.log('🔐 AuthService: Email:', data.email);
    console.log('🔐 AuthService: Name:', data.name);
    console.log('🔐 AuthService: Position:', data.position);
    console.log('🔐 AuthService: Level:', data.level);
    console.log('🔐 AuthService: Role:', data.role);
    console.log('🔐 AuthService: Password length:', data.password.length);
    
    console.log('🔐 AuthService: Step 1 - Creating user in Supabase Auth...');
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

    console.log('🔐 AuthService: Step 1 - Auth response received');
    console.log('🔐 AuthService: Auth data:', authData);
    console.log('🔐 AuthService: Auth error:', authError);
    console.log('🔐 AuthService: User created:', !!authData?.user);
    console.log('🔐 AuthService: Session created:', !!authData?.session);
    console.log('🔐 AuthService: User ID:', authData?.user?.id);
    console.log('🔐 AuthService: User email confirmed:', authData?.user?.email_confirmed_at);

    if (authError) {
      console.error('🔐 AuthService: ❌ Auth signup failed:', authError);
      console.error('🔐 AuthService: Error code:', authError.status);
      console.error('🔐 AuthService: Error message:', authError.message);
      throw authError;
    }

    if (!authData.user) {
      console.error('🔐 AuthService: ❌ No user returned from signup');
      throw new Error('Falha ao criar usuário');
    }

    console.log('🔐 AuthService: ✅ User created successfully in auth.users');
    console.log('🔐 AuthService: User ID:', authData.user.id);
    console.log('🔐 AuthService: User email:', authData.user.email);
    console.log('🔐 AuthService: ========== SIGNUP PROCESS END ==========');

    return { 
      user: authData.user, 
      session: authData.session,
      profileCreated: false // We're not creating profile here anymore
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