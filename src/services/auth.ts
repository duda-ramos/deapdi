import { supabase } from '../lib/supabase';
import { ProfileWithRelations } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  position: string;
  level: string;
}

export interface AuthResponse {
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
          error: this.formatError(error.message)
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
        error: this.formatError(error.message)
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
          error: this.formatError(error.message)
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
        error: this.formatError(error.message)
      };
    }
  }

  async signOut(): Promise<void> {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
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
        return null;
      }

      return data;
    } catch (error) {
      return null;
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
      throw error;
    }

    return data;
  }

  private formatError(message: string): string {
    if (message.includes('Invalid login credentials')) {
      return 'Email ou senha incorretos. Verifique suas credenciais.';
    }
    if (message.includes('User already registered')) {
      return 'Este email já está cadastrado. Tente fazer login.';
    }
    if (message.includes('Password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (message.includes('email_not_confirmed')) {
      return 'Por favor, confirme seu email antes de fazer login.';
    }
    if (message.includes('signup_disabled')) {
      return 'Cadastro de novos usuários está desabilitado.';
    }
    
    return message || 'Erro desconhecido. Tente novamente.';
  }
}

export const authService = new AuthService();