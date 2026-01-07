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
  /**
   * Sign up a new user
   */
  async signUp(
    data: SignUpData,
    options?: {
      /**
       * When true, preserves the current session (useful for admins creating users).
       * Note: this does NOT bypass Supabase auth rules; it only restores the previous session.
       */
      preserveSession?: boolean;
    }
  ): Promise<AuthResponse> {
    console.log('🔐 AuthService: Starting signup process');
    console.log('🔐 AuthService: Email:', data.email);
    console.log('🔐 AuthService: Name:', data.name);
    
    if (!supabase) {
      console.error('🔐 AuthService: Supabase not available');
      return {
        success: false,
        error: 'Sistema não configurado. Entre em contato com o administrador.'
      };
    }

    try {
      const previousSession = options?.preserveSession
        ? (await supabase.auth.getSession()).data.session
        : null;

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

      console.log('🔐 AuthService: Signup response:', { 
        user: !!authData.user, 
        session: !!authData.session, 
        error 
      });

      if (error) {
        console.warn('🔐 AuthService: Signup error:', this.formatError(error.message));
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

      // If the caller wants to preserve the current session (admin UX),
      // restore it after the signUp call.
      if (options?.preserveSession && previousSession) {
        const { error: restoreError } = await supabase.auth.setSession({
          access_token: previousSession.access_token,
          refresh_token: previousSession.refresh_token
        });
        if (restoreError) {
          console.warn('🔐 AuthService: Failed to restore previous session:', restoreError);
        }
      }

      console.log('🔐 AuthService: Signup successful');
      return {
        success: true,
        user: authData.user,
        session: authData.session
      };

    } catch (error: any) {
      console.error('🔐 AuthService: Signup exception:', error);
      return {
        success: false,
        error: this.formatError(error.message)
      };
    }
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 AuthService: Starting signin process');
    console.log('🔐 AuthService: Email:', email);

    if (!supabase) {
      console.error('🔐 AuthService: Supabase not available');
      return {
        success: false,
        error: 'Sistema não configurado. Entre em contato com o administrador.'
      };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('🔐 AuthService: Signin response:', { 
        user: !!data.user, 
        session: !!data.session, 
        error 
      });

      if (error) {
        console.warn('🔐 AuthService: Signin error:', this.formatError(error.message));
        return {
          success: false,
          error: this.formatError(error.message)
        };
      }

      console.log('🔐 AuthService: Signin successful');
      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error: any) {
      console.error('🔐 AuthService: Signin exception:', error);
      return {
        success: false,
        error: this.formatError(error.message)
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    console.log('🔐 AuthService: Signing out');
    
    if (!supabase) {
      console.warn('🔐 AuthService: Supabase not available for signout');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('🔐 AuthService: Signout error:', error);
      throw error;
    }
    console.log('🔐 AuthService: Signout successful');
  }

  /**
   * Get current session
   */
  async getSession() {
    console.log('🔐 AuthService: Getting session');
    
    if (!supabase) {
      console.warn('🔐 AuthService: Supabase not available');
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('🔐 AuthService: Get session error:', error);
      return null;
    }

    console.log('🔐 AuthService: Session retrieved:', !!session);
    return session;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<ProfileWithRelations | null> {
    console.log('🔐 AuthService: Getting profile for user:', userId);

    if (!supabase) {
      console.warn('🔐 AuthService: Supabase not available');
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, achievements(*)')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('🔐 AuthService: Profile fetch error:', error);
        return null;
      }

      console.log('🔐 AuthService: Profile retrieved:', !!data);
      return data;

    } catch (error) {
      console.error('🔐 AuthService: Profile fetch exception:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<ProfileWithRelations>): Promise<ProfileWithRelations | null> {
    console.log('🔐 AuthService: Updating profile for user:', userId);

    if (!supabase) {
      console.error('🔐 AuthService: Supabase not available');
      throw new Error('Sistema não configurado');
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('🔐 AuthService: Profile update error:', error);
        throw error;
      }

      console.log('🔐 AuthService: Profile updated successfully');
      return data;

    } catch (error) {
      console.error('🔐 AuthService: Profile update exception:', error);
      throw error;
    }
  }

  /**
   * Format error messages for user display
   */
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