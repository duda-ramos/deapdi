import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '../types';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  // State
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  
  // Actions
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
  const [user, setUser] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    console.log('🔐 AuthContext: Initializing auth state');
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state changed:', event);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 AuthContext: Getting initial session');
      const session = await authService.getSession();
      
      if (session?.user) {
        console.log('🔐 AuthContext: Found existing session');
        await loadUserProfile(session.user);
      } else {
        console.log('🔐 AuthContext: No existing session');
      }
    } catch (error) {
      console.error('🔐 AuthContext: Initialize auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    console.log('🔐 AuthContext: Loading user profile');
    
    try {
      const profile = await authService.getProfile(supabaseUser.id);
      
      if (profile) {
        console.log('🔐 AuthContext: Profile loaded successfully');
        setUser(profile);
        setSupabaseUser(supabaseUser);
      } else {
        console.log('🔐 AuthContext: No profile found, user exists in auth only');
        setUser(null);
        setSupabaseUser(supabaseUser);
      }
    } catch (error) {
      console.error('🔐 AuthContext: Load profile error:', error);
      setUser(null);
      setSupabaseUser(supabaseUser);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Sign in requested');
    setLoading(true);
    
    try {
      const result = await authService.signIn(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('🔐 AuthContext: Sign in successful');
      // Auth state change will be handled by the listener
      
    } catch (error: any) {
      console.error('🔐 AuthContext: Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (data: any) => {
    console.log('🔐 AuthContext: Sign up requested');
    setLoading(true);
    
    try {
      const result = await authService.signUp(data);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('🔐 AuthContext: Sign up successful');
      // Auth state change will be handled by the listener
      
    } catch (error: any) {
      console.error('🔐 AuthContext: Sign up error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🔐 AuthContext: Sign out requested');
    
    try {
      await authService.signOut();
      setUser(null);
      setSupabaseUser(null);
      console.log('🔐 AuthContext: Sign out successful');
    } catch (error) {
      console.error('🔐 AuthContext: Sign out error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    console.log('🔐 AuthContext: Refresh user requested');
    
    if (supabaseUser) {
      await loadUserProfile(supabaseUser);
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