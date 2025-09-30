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

  // Safety timeout - force loading to false after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('⏱️ Auth: Safety timeout reached, forcing loading to false');
      if (loading) {
        setLoading(false);
        setUser(null);
        setSupabaseUser(null);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  /**
   * Create or update profile for authenticated user
   */
  const ensureProfileExists = async (authUser: SupabaseUser): Promise<ProfileWithRelations | null> => {
    try {
      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existingProfile && !fetchError) {
        console.log('✅ Profile found for user:', authUser.email);
        return existingProfile;
      }

      // Profile doesn't exist - create it
      console.log('📝 Creating profile for user:', authUser.email);

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

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
        // Return a basic profile even if creation fails
        return {
          ...newProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any;
      }

      console.log('✅ Profile created successfully');
      return createdProfile;

    } catch (error) {
      console.error('❌ Exception in ensureProfileExists:', error);

      // Return fallback profile
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: 'employee' as const,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        level: authUser.user_metadata?.level || 'Júnior',
        position: authUser.user_metadata?.position || 'Colaborador',
        points: 0,
        bio: null,
        status: 'active' as const,
        team_id: null,
        manager_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Auth: Initializing...');

        // Set a timeout for initialization
        authTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('⏱️ Auth: Initialization timeout, completing anyway');
            setLoading(false);
          }
        }, 8000);

        // Check if Supabase is available
        if (!supabase) {
          console.warn('🔐 Auth: Supabase not available, using offline mode');
          if (isMounted) {
            setUser(null);
            setSupabaseUser(null);
            setLoading(false);
          }
          if (authTimeout) clearTimeout(authTimeout);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('🔐 Auth: Session error:', sessionError);
          throw sessionError;
        }

        if (isMounted) {
          if (session?.user) {
            console.log('🔐 Auth: Session found for user:', session.user.email);
            setSupabaseUser(session.user);

            // Ensure profile exists and set it
            const profile = await ensureProfileExists(session.user);
            if (isMounted) {
              setUser(profile);
            }
          } else {
            console.log('🔐 Auth: No active session');
            setUser(null);
            setSupabaseUser(null);
          }
        }
      } catch (error) {
        console.error('🔐 Auth: Initialization error:', error);

        // Handle invalid refresh token errors by clearing session data
        if (error instanceof Error && error.message.includes('Refresh Token Not Found')) {
          console.log('🔐 Auth: Invalid refresh token, clearing session');
          try {
            if (supabase) {
              await supabase.auth.signOut();
            }
          } catch (signOutError) {
            console.error('Error clearing invalid session:', signOutError);
          }
        }

        if (isMounted) {
          setUser(null);
          setSupabaseUser(null);
        }
      } finally {
        console.log('🔐 Auth: Initialization complete');
        if (isMounted) {
          setLoading(false);
        }
        if (authTimeout) clearTimeout(authTimeout);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth: State changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        const profile = await ensureProfileExists(session.user);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSupabaseUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setSupabaseUser(session.user);
        // Optionally refresh profile
        const profile = await ensureProfileExists(session.user);
        setUser(profile);
      }
    });

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Auth: Signing in user:', email);
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
    console.log('🔐 Auth: Signing up user:', userData.email);
    const result = await authService.signUp(userData);

    if (!result.success) {
      throw new Error(result.error);
    }

    if (result.user) {
      setSupabaseUser(result.user);
      // Profile will be created automatically by trigger or by ensureProfileExists
      const profile = await ensureProfileExists(result.user);
      setUser(profile);
    }
  };

  const signOut = async () => {
    console.log('🔐 Auth: Signing out');
    await authService.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const refreshUser = async () => {
    console.log('🔐 Auth: Refreshing user profile');
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