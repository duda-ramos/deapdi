import { authService } from '../auth';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await authService.signIn('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('should handle sign in errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await authService.signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email ou senha incorretos. Verifique suas credenciais.');
    });
  });

  describe('signUp', () => {
    it('should sign up successfully with valid data', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        position: 'Developer',
        level: 'Júnior'
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const result = await authService.signUp(signUpData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle sign up errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      });

      const signUpData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        position: 'Developer',
        level: 'Júnior'
      };

      const result = await authService.signUp(signUpData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Este email já está cadastrado. Tente fazer login.');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(authService.signOut()).resolves.not.toThrow();
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockSupabase.auth.signOut.mockResolvedValue({ error });

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });
});