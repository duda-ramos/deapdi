import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  authUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
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
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Timeout de segurança para garantir que loading nunca fique travado
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    console.log('🔍 AuthContext: fetchUserProfile called with userId:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔍 AuthContext: fetchUserProfile result:', { data, error });

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
      
      console.log('🔍 AuthContext: fetchUserProfile returning:', data);
      return data || null;
    } catch (error) {
      console.error('Profile fetch exception:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    console.log('🔄 AuthContext: refreshUser called');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔄 AuthContext: refreshUser authUser:', authUser);
      
      if (authUser) {
        const profile = await fetchUserProfile(authUser.id);
        console.log('🔄 AuthContext: refreshUser profile:', profile);
        setUser(profile);
        setAuthUser(authUser);
      } else {
        console.log('🔄 AuthContext: refreshUser no authUser, clearing state');
        setUser(null);
        setAuthUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setAuthUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🚀 AuthContext: initializeAuth started');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🚀 AuthContext: getSession result:', { session, error });
        
        if (error) {
          console.error('Session error:', error);
          return;
        }
        
        if (session?.user && mounted) {
          console.log('🚀 AuthContext: Found session user:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          console.log('🚀 AuthContext: Fetched profile:', profile);
          if (mounted) {
            setUser(profile);
            setAuthUser(session.user);
            console.log('🚀 AuthContext: Set user state:', profile);
          }
        } else {
          console.log('🚀 AuthContext: No session or user found');
        }
      } catch (error) {
        console.error('Init auth error:', error);
      } finally {
        if (mounted) {
          console.log('🚀 AuthContext: Setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext: login called with email:', email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('🔐 AuthContext: signInWithPassword result:', { data, error });
      
      if (error) throw error;
      
      if (data.user) {
        console.log('🔐 AuthContext: Login successful, fetching profile for:', data.user.id);
        const profile = await fetchUserProfile(data.user.id);
        console.log('🔐 AuthContext: Profile fetched:', profile);
        setUser(profile);
        setAuthUser(data.user);
        console.log('🔐 AuthContext: User state updated - user:', profile, 'authUser:', data.user);
      } else {
        console.log('🔐 AuthContext: No user in login response');
      }
    } catch (error: any) {
      console.error('🔐 AuthContext: Login error:', error);
      setUser(null);
      setAuthUser(null);
      return null;
    } finally {
      console.log('🔐 AuthContext: Login process finished, setting loading to false');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authUser, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};