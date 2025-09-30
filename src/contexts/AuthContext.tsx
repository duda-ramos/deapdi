import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ProfileWithRelations } from '../types';
import { supabase, cleanInvalidSessions } from '../lib/supabase';
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
  const isHandlingAuthError = useRef(false);
  const authStateChangeCount = useRef(0);
  const lastAuthEvent = useRef<{ event: string; timestamp: number } | null>(null);

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

      // Clean any invalid sessions before initializing
      cleanInvalidSessions();

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
          if (!isHandlingAuthError.current) {
            isHandlingAuthError.current = true;
            cleanInvalidSessions();
            await supabase.auth.signOut();
            isHandlingAuthError.current = false;
          }
        } else if (error instanceof Error && (
          error.message.includes('Invalid API key') ||
          error.message.includes('JWT expired') ||
          error.message.includes('invalid_grant')
        )) {
          console.error('🔴 Auth initialization failed with invalid credentials:', error.message);
          cleanInvalidSessions();
          if (isMounted) {
            setUser(null);
            setSupabaseUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent rapid-fire duplicate events
      const now = Date.now();
      if (lastAuthEvent.current &&
          lastAuthEvent.current.event === event &&
          now - lastAuthEvent.current.timestamp < 1000) {
        console.log(`🚫 Debouncing duplicate ${event} event`);
        return;
      }
      lastAuthEvent.current = { event, timestamp: now };

      // Limit total auth state changes to prevent infinite loops
      authStateChangeCount.current += 1;
      if (authStateChangeCount.current > 10) {
        console.error('⚠️ Too many auth state changes detected. Stopping to prevent infinite loop.');
        console.error('   This usually indicates invalid credentials. Check your .env file.');
        cleanInvalidSessions();
        setUser(null);
        setSupabaseUser(null);
        setLoading(false);
        return;
      }

      console.log(`🔑 Auth state change: ${event} (count: ${authStateChangeCount.current})`);

      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        try {
          const profile = await ensureProfileExists(session.user);
          setUser(profile);
        } catch (error) {
          console.error('Error creating/fetching profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSupabaseUser(null);
        cleanInvalidSessions();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
      } else if (event === 'USER_UPDATED' && session?.user) {
        setSupabaseUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Clean any stale sessions before new sign in
    cleanInvalidSessions();

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
    cleanInvalidSessions();
    await authService.signOut();
    setUser(null);
    setSupabaseUser(null);
    authStateChangeCount.current = 0;
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