import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase, signInWithEmail, signOut } from '../lib/supabase';

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

  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    console.log('🔍 fetchUserProfile: Starting for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('❌ fetchUserProfile: Error fetching profile:', error);
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log('✅ fetchUserProfile: Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.log('💥 fetchUserProfile: Exception caught:', error);
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const profile = await fetchUserProfile(authUser.id);
        setUser(profile);
        setAuthUser(authUser);
      } else {
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
    console.log('🔄 AuthContext: useEffect triggered, mounted:', mounted);

    const initAuth = async () => {
      console.log('🚀 initializeAuth: Starting initialization');
      try {
        console.log('📡 initializeAuth: Getting session from Supabase...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📡 initializeAuth: Session received:', session ? 'Found session' : 'No session');
        
        if (session?.user && mounted) {
          console.log('👤 initializeAuth: User found, fetching profile...');
          const profile = await fetchUserProfile(session.user.id);
          console.log('👤 initializeAuth: Profile result:', profile ? 'Profile loaded' : 'No profile');
          setUser(profile);
          setAuthUser(session.user);
        } else {
          console.log('🚫 initializeAuth: No session or component unmounted');
        }
      } catch (error) {
        console.log('💥 initializeAuth: Exception during initialization:', error);
        console.error('Init auth error:', error);
      } finally {
        if (mounted) {
          console.log('✅ initializeAuth: Setting loading to false');
          setLoading(false);
        } else {
          console.log('⚠️ initializeAuth: Component unmounted, skipping setLoading');
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state changed', { event, hasSession: !!session, mounted });
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
          setAuthUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 login: Starting login process for:', email);
    setLoading(true);
    try {
      console.log('🔐 login: Calling signInWithEmail...');
      const { user: authUser } = await signInWithEmail(email, password);
      console.log('🔐 login: SignIn result:', authUser ? 'User authenticated' : 'No user');
      
      if (authUser) {
        console.log('🔐 login: Fetching user profile...');
        const profile = await fetchUserProfile(authUser.id);
        console.log('🔐 login: Profile fetch result:', profile ? 'Profile loaded' : 'No profile');
        setUser(profile);
        setAuthUser(authUser);
      }
    } catch (error: any) {
      setUser(null);
      setAuthUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 logout: Starting logout process');
    try {
      await signOut();
      setUser(null);
      setAuthUser(null);
      console.log('✅ logout: Logout successful');
    } catch (error) {
      console.log('💥 logout: Error during logout:', error);
      console.log('💥 login: Error during login:', error);
      console.log('✅ login: Setting loading to false');
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authUser, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};