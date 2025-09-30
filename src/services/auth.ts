import { supabase } from '../lib/supabase';
import { ProfileWithRelations } from '../types';

export const translateSupabaseAuthError = (message: string): string => {
  if (!message) {
    return 'Erro desconhecido de autenticação. Tente novamente.';
  }

  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email ou senha incorretos. Verifique suas credenciais.';
  }

  if (normalized.includes('user already registered')) {
    return 'Este email já está cadastrado. Tente fazer login.';
  }

  if (normalized.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }

  if (normalized.includes('email_not_confirmed')) {
    return 'Por favor, confirme seu email antes de fazer login.';
  }

  if (normalized.includes('signup disabled')) {
    return 'Cadastro de novos usuários está desabilitado.';
  }

  if (normalized.includes('invalid api key') || normalized.includes('invalid_grant')) {
    return 'Credenciais Supabase inválidas. Revise sua configuração.';
  }

  if (normalized.includes('refresh token not found')) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (normalized.includes('jwt expired')) {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }

  if (normalized.includes('mfa token') || normalized.includes('mfa challenged')) {
    return 'Autenticação multifator necessária. Verifique seu email ou aplicativo autenticador.';
  }

  return message;
};

interface SignUpData {
  email: string;
  password: string;
  name: string;
  position: string;
  level: string;
}

interface AuthResponse {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}

class AuthService {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        error: 'Sistema não configurado. Entre em contato com o administrador.'
      };
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            position: data.position,
            level: data.level
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: translateSupabaseAuthError(error.message)
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Falha ao criar usuário'
        };
      }

      return {
        success: true,
        user: authData.user,
        session: authData.session
      };
    } catch (error: any) {
      return {
        success: false,
        error: translateSupabaseAuthError(error.message)
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      return {
        success: false,
        error: 'Sistema não configurado. Entre em contato com o administrador.'
      };
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 10000);
      });

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        return {
          success: false,
          error: translateSupabaseAuthError(error.message)
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error: any) {
      if (error.message === 'TIMEOUT') {
        return {
          success: false,
          error: 'Tempo limite de conexão excedido. Verifique sua internet.'
        };
      }

      return {
        success: false,
        error: translateSupabaseAuthError(error.message)
      };
    }
  }

  async signOut(): Promise<void> {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(translateSupabaseAuthError(error.message));
    }
  }

  async getSession() {
    if (!supabase) {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return null;
    }

    return session;
  }

  async getProfile(userId: string): Promise<ProfileWithRelations | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, achievements(*)')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(translateSupabaseAuthError(error.message));
      }

      return data;
    } catch (error: any) {
      throw new Error(translateSupabaseAuthError(error?.message));
    }
  }

  async updateProfile(userId: string, updates: Partial<ProfileWithRelations>): Promise<ProfileWithRelations | null> {
    if (!supabase) {
      throw new Error('Sistema não configurado');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(translateSupabaseAuthError(error.message));
    }

    return data;
  }

}

export const authService = new AuthService();
