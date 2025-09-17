import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions for common operations
export const getCurrentUser = async () => {
  console.log('📡 Supabase: Getting current user');
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('📡 Supabase: getCurrentUser result', { user: !!user, error });
  if (error) throw error;
  return user;
};

export const signOut = async () => {
  console.log('📡 Supabase: Signing out');
  const { error } = await supabase.auth.signOut();
  console.log('📡 Supabase: SignOut result', { error });
  if (error) throw error;
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log('📡 Supabase: Signing in with email:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  console.log('📡 Supabase: SignIn result', { user: !!data.user, error });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  if (error) throw error;
  return data;
};