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
  const initializingRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const profileCacheRef = React.useRef<Map<string, { profile: ProfileWithRelations; timestamp: number }>>(new Map());
  const PROFILE_CACHE_TTL = 30000; // 30 seconds
  const AUTH_TIMEOUT = 5000; // 5 seconds - reduced from 8 seconds for faster feedback
  const retryAttemptsRef = React.useRef(0);
  const MAX_RETRY_ATTEMPTS = 3;

  /**
   * Create or update profile for authenticated user
   */
  const ensureProfileExists = async (authUser: SupabaseUser): Promise<ProfileWithRelations | null> => {
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
      const { data: existingProfile, error: fetchError } = await supabase
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
    // Prevent multiple initializations
    if (initializingRef.current) {
      console.log('🔐 Auth: Already initializing, skipping');
      return;
    }

    let isMounted = true;
    let authTimeout: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      // Double-check after async
      if (initializingRef.current) {
        return;
      }

      initializingRef.current = true;

      try {
        console.log('🔐 Auth: Initializing...');

        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();

        // Set a timeout for initialization
        authTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('⏱️ Auth: Initialization timeout after 5s, completing anyway');
            setLoading(false);
            initializingRef.current = false;
          }
        }, AUTH_TIMEOUT);

        // Check if Supabase is available
        if (!supabase) {
          console.warn('🔐 Auth: Supabase not available, using offline mode');
          if (isMounted) {
            setUser(null);
            setSupabaseUser(null);
            setLoading(false);
          }
          if (authTimeout) clearTimeout(authTimeout);
          initializingRef.current = false;
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('🔐 Auth: Session error:', sessionError);

          // Retry logic with exponential backoff
          if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
            retryAttemptsRef.current++;
            const backoffDelay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current - 1), 4000);
            console.log(`🔄 Auth: Retrying in ${backoffDelay}ms (attempt ${retryAttemptsRef.current}/${MAX_RETRY_ATTEMPTS})`);

            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            if (isMounted) {
              // Recursively retry initialization
              initializingRef.current = false;
              return initializeAuth();
            }
          }

          throw sessionError;
        }

        // Reset retry counter on success
        retryAttemptsRef.current = 0;

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

        // Handle specific error types with user-friendly messages
        let errorMessage = 'Unable to initialize authentication. Please try again.';

        if (error instanceof Error) {
          // Handle invalid refresh token errors by clearing session data
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            console.log('🔐 Auth: Invalid refresh token, clearing session');
            errorMessage = 'Your session has expired. Please sign in again.';
            try {
              if (supabase) {
                await supabase.auth.signOut();
              }
            } catch (signOutError) {
              console.error('Error clearing invalid session:', signOutError);
            }
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Unable to connect. Please check your internet connection.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Connection timed out. Please try again.';
          }
        }

        // Log user-friendly error for display (could be shown in UI)
        console.error('🔴 Auth Error (User-facing):', errorMessage);

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
        initializingRef.current = false;
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
        // Clear profile cache on signout
        profileCacheRef.current.clear();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setSupabaseUser(session.user);
        // Invalidate cache on token refresh
        profileCacheRef.current.delete(session.user.id);
        const profile = await ensureProfileExists(session.user);
        setUser(profile);
      }
    });

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      subscription.unsubscribe();
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