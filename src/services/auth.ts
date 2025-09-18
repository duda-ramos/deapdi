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
  async signUp(data: SignUpData): Promise<AuthResponse> {
    console.log('🔐 AuthService: Starting signup process');
    console.log('🔐 AuthService: Email:', data.email);
    console.log('🔐 AuthService: Name:', data.name);
    
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

      console.log('🔐 AuthService: Signup response:', { 
        user: !!authData.user, 
        session: !!authData.session, 
        error 
      });

      if (error) {
        console.error('🔐 AuthService: Signup error:', error);
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
        console.error('🔐 AuthService: Signin error:', error);
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