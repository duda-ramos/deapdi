import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { ProfileWithRelations } from '../types';
import { supabase, cleanInvalidSessions } from '../lib/supabase';
import { authService, translateSupabaseAuthError } from '../services/auth';

interface AuthContextType {
  user: ProfileWithRelations | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuthError: () => void;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const authStateChangeCount = useRef(0);
  const authEventWindowStart = useRef<number | null>(null);
  const lastAuthEvent = useRef<{ event: string; timestamp: number } | null>(null);

  const ensureProfileExists = useCallback(async (authUser: SupabaseUser): Promise<ProfileWithRelations> => {
    if (!supabase) {
      throw new Error('Cliente Supabase não inicializado.');
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingProfile) {
      return existingProfile as ProfileWithRelations;
    }

    const fallbackName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário';

    const newProfile: Partial<ProfileWithRelations> = {
      id: authUser.id,
      email: authUser.email || '',
      name: fallbackName,
      role: 'employee',
      status: 'active',
      position: authUser.user_metadata?.position || 'Colaborador',
      level: authUser.user_metadata?.level || 'Júnior',
      points: 0,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      bio: null,
      team_id: null,
      manager_id: null
    };

    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return (createdProfile || newProfile) as ProfileWithRelations;
  }, []);

  const syncSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setSupabaseUser(null);
      return;
    }

    setSupabaseUser(session.user);

    try {
      const profile = await ensureProfileExists(session.user);
      setUser(profile);
      setAuthError(null);
    } catch (error: any) {
      console.error('❌ Failed to synchronize user profile:', error);
      setAuthError(translateSupabaseAuthError(error?.message));
      setUser(null);
    }
  }, [ensureProfileExists]);

  const handleAuthError = useCallback((error: unknown) => {
    const rawMessage = error instanceof Error ? error.message : String(error ?? 'Erro desconhecido');
    const formattedMessage = translateSupabaseAuthError(rawMessage);

    console.error('🔴 Authentication error detected:', rawMessage);

    const credentialIssue = /invalid api key|invalid_grant|jwt expired|refresh token not found|token has invalid lifetime|invalid signature|loop de autenticação/i.test(rawMessage.toLowerCase());

    if (credentialIssue) {
      cleanInvalidSessions();
      setSupabaseUser(null);
    }

    setUser(null);
    setAuthError(formattedMessage);
    setLoading(false);
  }, []);

  const handleAuthEvent = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    const now = Date.now();
    const previous = lastAuthEvent.current;

    if (previous && previous.event === event && now - previous.timestamp < 750) {
      console.log(`🚫 Debouncing duplicate ${event} event`);
      return;
    }

    lastAuthEvent.current = { event, timestamp: now };

    if (event !== 'INITIAL_SESSION') {
      if (!authEventWindowStart.current || now - authEventWindowStart.current > 10000) {
        authEventWindowStart.current = now;
        authStateChangeCount.current = 0;
      }

      authStateChangeCount.current += 1;
      if (authStateChangeCount.current > 20) {
        handleAuthError(new Error('Loop de autenticação detectado. Revise suas credenciais Supabase.'));
        authStateChangeCount.current = 0;
        authEventWindowStart.current = now;
        return;
      }
    }

    console.log(`🔑 Auth state change: ${event} (count: ${authStateChangeCount.current})`);

    switch (event) {
      case 'INITIAL_SESSION':
        authStateChangeCount.current = 0;
        authEventWindowStart.current = now;
        await syncSession(session);
        setLoading(false);
        break;
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
      case 'MFA_CHALLENGE_VERIFIED':
        await syncSession(session);
        setLoading(false);
        if (event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED') {
          authStateChangeCount.current = 0;
          authEventWindowStart.current = now;
        }
        break;
      case 'SIGNED_OUT':
      case 'USER_DELETED':
        cleanInvalidSessions();
        setUser(null);
        setSupabaseUser(null);
        setLoading(false);
        setAuthError(null);
        authStateChangeCount.current = 0;
        authEventWindowStart.current = now;
        break;
      case 'TOKEN_REFRESH_FAILED':
        handleAuthError(new Error('Falha ao renovar a sessão. Faça login novamente.'));
        authStateChangeCount.current = 0;
        authEventWindowStart.current = now;
        break;
      case 'PASSWORD_RECOVERY':
        setLoading(false);
        break;
      default:
        setLoading(false);
        break;
    }
  }, [handleAuthError, syncSession]);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setLoading(false);
      setAuthError('Não foi possível inicializar o Supabase. Verifique as credenciais do projeto.');
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    cleanInvalidSessions();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

      try {
        await handleAuthEvent(event, session);
      } catch (error) {
        handleAuthError(error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthEvent, handleAuthError]);

  const signIn = async (email: string, password: string) => {
    cleanInvalidSessions();
    setAuthError(null);
    setLoading(true);

    let handled = false;

    try {
      const result = await authService.signIn(email, password);

      if (!result.success) {
        const message = result.error || 'Erro ao fazer login. Tente novamente.';
        throw new Error(message);
      }

      if (result.user) {
        setSupabaseUser(result.user);
        try {
          const profile = await ensureProfileExists(result.user);
          setUser(profile);
          setAuthError(null);
        } catch (error) {
          handled = true;
          handleAuthError(error);
          throw error instanceof Error ? error : new Error('Erro ao carregar perfil.');
        }
      }
    } catch (error) {
      if (!handled) {
        handleAuthError(error);
      }
      throw error instanceof Error ? error : new Error('Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    setAuthError(null);
    setLoading(true);

    let handled = false;

    try {
      const result = await authService.signUp(userData);

      if (!result.success) {
        const message = result.error || 'Erro ao criar usuário. Tente novamente.';
        throw new Error(message);
      }

      if (result.user) {
        setSupabaseUser(result.user);
        try {
          const profile = await ensureProfileExists(result.user);
          setUser(profile);
          setAuthError(null);
        } catch (error) {
          handled = true;
          handleAuthError(error);
          throw error instanceof Error ? error : new Error('Erro ao carregar perfil.');
        }
      }
    } catch (error) {
      if (!handled) {
        handleAuthError(error);
      }
      throw error instanceof Error ? error : new Error('Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setAuthError(null);

    try {
      cleanInvalidSessions();
      await authService.signOut();
    } catch (error) {
      handleAuthError(error);
      throw error instanceof Error ? error : new Error('Erro ao encerrar sessão.');
    } finally {
      setUser(null);
      setSupabaseUser(null);
      authStateChangeCount.current = 0;
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!supabaseUser) {
      return;
    }

    try {
      const profile = await ensureProfileExists(supabaseUser);
      setUser(profile);
      setAuthError(null);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const clearAuthError = () => setAuthError(null);

  const value: AuthContextType = {
    user,
    supabaseUser,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    refreshUser,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};