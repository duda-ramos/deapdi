import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, type SupabaseClient } from '@supabase/supabase-js';
import { ProfileWithRelations } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { Database } from '../types/database';

type AuthSubscription = ReturnType<SupabaseClient<Database>['auth']['onAuthStateChange']>['data']['subscription'];
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
  const initializingRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const profileCacheRef = React.useRef<Map<string, { profile: ProfileWithRelations; timestamp: number }>>(new Map());
  const authSubscriptionRef = React.useRef<AuthSubscription | null>(null);
  const PROFILE_CACHE_TTL = 30000; // 30 seconds
  const AUTH_TIMEOUT = 5000; // 5 seconds - reduced from 8 seconds for faster feedback
  const retryAttemptsRef = React.useRef(0);
  const MAX_RETRY_ATTEMPTS = 3;

  /**
   * Create or update profile for authenticated user
   */
  const ensureProfileExists = async (
    authUser: SupabaseUser,
    client: SupabaseClient<Database>
  ): Promise<ProfileWithRelations | null> => {
    // Check cache first
    const cached = profileCacheRef.current.get(authUser.id);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < PROFILE_CACHE_TTL) {
        console.log('✅ Profile found in cache:', authUser.email);
        return cached.profile;
      } else {
        // Expired cache entry
        profileCacheRef.current.delete(authUser.id);
      }
    }

    try {
      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await client
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existingProfile && !fetchError) {
        console.log('✅ Profile found for user:', authUser.email);
        // Cache the profile
        profileCacheRef.current.set(authUser.id, {
          profile: existingProfile,
          timestamp: Date.now()
        });
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

      const { data: createdProfile, error: createError } = await client
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

    const cleanupSubscription = () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };

    const clearTimeoutIfNeeded = () => {
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }
    };

    const initializeAuth = async () => {
      if (initializingRef.current) {
        console.log('🔐 Auth: Initialization already in progress');
        return;
      }

      const client = getSupabaseClient();

      if (!client) {
        console.warn('🔐 Auth: Supabase not available, falling back to offline mode');
        cleanupSubscription();
        if (isMounted) {
          setUser(null);
          setSupabaseUser(null);
          setLoading(false);
        }
        return;
      }

      initializingRef.current = true;
      abortControllerRef.current = new AbortController();
      setLoading(true);

      clearTimeoutIfNeeded();
      authTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn('⏱️ Auth: Initialization timeout after 5s, completing anyway');
          setLoading(false);
          initializingRef.current = false;
        }
      }, AUTH_TIMEOUT);

      try {
        console.log('🔐 Auth: Initializing...');

        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          console.error('🔐 Auth: Session error:', sessionError);

          if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
            retryAttemptsRef.current++;
            const backoffDelay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current - 1), 4000);
            console.log(`🔄 Auth: Retrying in ${backoffDelay}ms (attempt ${retryAttemptsRef.current}/${MAX_RETRY_ATTEMPTS})`);

            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            initializingRef.current = false;
            return initializeAuth();
          }

          throw sessionError;
        }

        retryAttemptsRef.current = 0;

        if (session?.user) {
          console.log('🔐 Auth: Session found for user:', session.user.email);
          setSupabaseUser(session.user);
          const profile = await ensureProfileExists(session.user, client);
          if (isMounted) {
            setUser(profile);
          }
        } else {
          console.log('🔐 Auth: No active session');
          if (isMounted) {
            setUser(null);
            setSupabaseUser(null);
          }
        }

        cleanupSubscription();

        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, nextSession) => {
          console.log('🔐 Auth: State changed:', event);

          if (event === 'SIGNED_IN' && nextSession?.user) {
            setSupabaseUser(nextSession.user);
            const profile = await ensureProfileExists(nextSession.user, client);
            setUser(profile);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSupabaseUser(null);
            profileCacheRef.current.clear();
          } else if (event === 'TOKEN_REFRESHED' && nextSession?.user) {
            setSupabaseUser(nextSession.user);
            profileCacheRef.current.delete(nextSession.user.id);
            const profile = await ensureProfileExists(nextSession.user, client);
            setUser(profile);
          }
        });

        authSubscriptionRef.current = subscription;
      } catch (error) {
        console.error('🔐 Auth: Initialization error:', error);

        let errorMessage = 'Unable to initialize authentication. Please try again.';

        if (error instanceof Error) {
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            console.log('🔐 Auth: Invalid refresh token, clearing session');
            errorMessage = 'Your session has expired. Please sign in again.';
            try {
              await client.auth.signOut();
            } catch (signOutError) {
              console.error('Error clearing invalid session:', signOutError);
            }
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Unable to connect. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Connection timed out. Please try again.';
          }
        }

        console.error('🔴 Auth Error (User-facing):', errorMessage);

        if (isMounted) {
          setUser(null);
          setSupabaseUser(null);
        }
      } finally {
        console.log('🔐 Auth: Initialization complete');
        clearTimeoutIfNeeded();
        if (isMounted) {
          setLoading(false);
        }
        initializingRef.current = false;
      }
    };

    initializeAuth();

    const handleConfigChange = () => {
      if (!isMounted) {
        return;
      }

      console.log('🔐 Auth: Supabase configuration changed, reinitializing');
      retryAttemptsRef.current = 0;
      profileCacheRef.current.clear();
      cleanupSubscription();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      initializingRef.current = false;
      initializeAuth();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('supabase-config-changed', handleConfigChange as EventListener);
    }

    return () => {
      isMounted = false;
      clearTimeoutIfNeeded();
      cleanupSubscription();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('supabase-config-changed', handleConfigChange as EventListener);
      }
      initializingRef.current = false;
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
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase não está configurado. Atualize suas credenciais e tente novamente.');
      }
      const profile = await ensureProfileExists(result.user, client);
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
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase não está configurado. Atualize suas credenciais e tente novamente.');
      }
      const profile = await ensureProfileExists(result.user, client);
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
      const client = getSupabaseClient();
      if (!client) {
        console.warn('🔐 Auth: Cannot refresh profile without Supabase client');
        return;
      }
      const profile = await ensureProfileExists(supabaseUser, client);
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