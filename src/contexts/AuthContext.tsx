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

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Simple profile fetch without joins
          const { data } = await supabase
            .from('profiles')
            .select('*, achievements(*)')
            .eq('id', session.user.id)
            .maybeSingle();
          
          setUser(data || null);
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
    try {
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
    try {
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