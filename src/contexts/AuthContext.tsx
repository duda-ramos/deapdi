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

  // Safety timeout - force loading to false after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if Supabase is available
        if (!supabase) {
          console.warn('🔐 Auth: Supabase not available, using offline mode');
          setUser(null);
          setSupabaseUser(null);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          try {
            // Emergency: Use service account or bypass RLS for profile fetch
            let profileData = null;
            let profileError = null;
            
            try {
              // First attempt: Simple profile fetch
              const { data, error } = await supabase
                .from('profiles')
                .select('id, email, name, role, avatar_url, level, position, points, bio, status')
                .eq('id', session.user.id)
                .single();
              
              profileData = data;
              profileError = error;
            } catch (fetchError) {
              console.warn('Profile fetch failed, trying alternative approach:', fetchError);
              
              // Fallback: Create minimal profile from session data
              profileData = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                role: 'employee' as const,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                level: 'Junior',
                position: 'Employee',
                points: 0,
                bio: null,
                status: 'active' as const
              };
              profileError = null;
            }
            
            if (profileError) {
              console.error('Profile fetch error:', profileError);
              // If it's an RLS recursion error, still set the user but without profile data
              if (profileError.code === '42P17' || profileError.message?.includes('infinite recursion')) {
                console.warn('RLS recursion detected, using basic user data only');
                // Create a basic profile from session data
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  role: 'employee' as const,
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  level: 'Junior',
                  position: 'Employee',
                  points: 0,
                  bio: null,
                  status: 'active' as const,
                  team_id: null,
                  manager_id: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as any);
              } else {
                throw profileError;
              }
            } else {
              setUser(profileData);
            }
          } catch (profileError) {
            console.error('Profile fetch error - using fallback:', profileError);
            // Always use fallback profile when there's an error
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: 'employee' as const,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              level: 'Junior',
              position: 'Employee',
              points: 0,
              bio: null,
              status: 'active' as const,
              team_id: null,
              manager_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any);
          }
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Handle invalid refresh token errors by clearing session data
        if (error instanceof Error && error.message.includes('Refresh Token Not Found')) {
          try {
            if (supabase) {
              await supabase.auth.signOut();
            }
            // Force full page reload to clear all client-side state
            window.location.href = '/login';
            return; // Exit early to prevent further execution
          } catch (signOutError) {
            console.error('Error clearing invalid session:', signOutError);
          }
        }
        
        setUser(null);
        setSupabaseUser(null);
      } finally {
        // CRITICAL: Always set loading to false
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    
    if (result.user) {
      setSupabaseUser(result.user);
      const profile = await authService.getProfile(result.user.id);
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
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      const profile = await authService.getProfile(supabaseUser.id);
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