import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ProfileWithRelations } from '../types';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth';

interface AuthContextType {
  user: ProfileWithRelations | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ProfileWithRelations | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfileExists = async (authUser: SupabaseUser): Promise<ProfileWithRelations | null> => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile;
    }

    const newProfile = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: 'employee' as const,
      status: 'active' as const,
      position: authUser.user_metadata?.position || 'Colaborador',
      level: authUser.user_metadata?.level || 'Júnior',
      points: 0,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      bio: null,
      team_id: null,
      manager_id: null
    };

    const { data: createdProfile } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    return createdProfile || newProfile as any;
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted && session?.user) {
          setSupabaseUser(session.user);
          const profile = await ensureProfileExists(session.user);
          if (isMounted) {
            setUser(profile);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Refresh Token Not Found')) {
          await supabase.auth.signOut();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        const profile = await ensureProfileExists(session.user);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSupabaseUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);

    if (!result.success) {
      throw new Error(result.error);
    }

    if (result.user) {
      setSupabaseUser(result.user);
      const profile = await ensureProfileExists(result.user);
      setUser(profile);
    }
  };

  const signUp = async (userData: any) => {
    const result = await authService.signUp(userData);

    if (!result.success) {
      throw new Error(result.error);
    }

    if (result.user) {
      setSupabaseUser(result.user);
      const profile = await ensureProfileExists(result.user);
      setUser(profile);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      const profile = await ensureProfileExists(supabaseUser);
      setUser(profile);
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};