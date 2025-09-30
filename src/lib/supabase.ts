import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are placeholders
const isPlaceholder = (value: string | undefined) => {
  if (!value) return true;
  const placeholders = ['your-project-url-here', 'your-anon-key-here', 'your_supabase', 'example'];
  return placeholders.some(p => value.toLowerCase().includes(p));
};

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.error('⚠️ Supabase credentials are missing or invalid');
}

export const supabase = (supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'talentflow-web'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000)
      });
    }
  }
}) : null;

// Check if JWT token is expired
export const isJWTExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;

    const now = Math.floor(Date.now() / 1000);

    // If iat === exp, token has zero lifetime (invalid)
    if (payload.iat && payload.iat === payload.exp) {
      console.warn('⚠️ JWT token has zero lifetime (iat === exp)');
      return true;
    }

    // If iat === exp, token has zero lifetime (invalid)
    if (payload.iat && payload.iat === payload.exp) {
      console.warn('⚠️ JWT token has zero lifetime (iat === exp)');
      return true;
    }

    // Check if expired
    return payload.exp <= now;
  } catch {
    return false;
  }
};
// Migration control - prevent automatic migrations
export const shouldRunMigrations = () => {
  // Only run migrations if explicitly enabled
  return import.meta.env.VITE_RUN_MIGRATIONS === 'true';
};

// Check if database is properly initialized
export const checkDatabaseHealth = async (timeoutMs: number = 10000) => {
  if (!supabase) {
    const isPlaceholderCreds = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey);
    const errorMsg = isPlaceholderCreds
      ? 'Please configure your Supabase credentials in the .env file. The current values are placeholders.'
      : 'Supabase client not initialized';
    return { healthy: false, error: errorMsg, isExpiredToken: false };
  }

  // Check if JWT token is expired
  if (supabaseAnonKey && isJWTExpired(supabaseAnonKey)) {
    try {
      const parts = supabaseAnonKey.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const expDate = new Date(payload.exp * 1000).toISOString();
      console.error('🔴 Supabase ANON_KEY expired at:', expDate);
      console.error('🔴 Current time:', new Date().toISOString());
    } catch (e) {
      console.error('🔴 Supabase ANON_KEY is expired or malformed');
    }
    return {
      healthy: false,
      error: 'Your Supabase ANON_KEY has expired. Please update your .env file with a new key from your Supabase Dashboard.',
      isExpiredToken: true
    };
  }

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
  });

  try {
    // Comprehensive health check - test REST API, Auth API, and database query
    const healthCheckPromise = (async () => {
      const authUrl = `${supabaseUrl}/auth/v1/settings`;
      const authResponse = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey
        },
        signal: AbortSignal.timeout(5000)
      });

      if (authResponse.status === 401 || authResponse.status === 403) {
        return {
          healthy: false,
          error: 'Credenciais inválidas ou expiradas. Verifique seu arquivo .env',
          isExpiredToken: true
        };
      }

      if (!authResponse.ok) {
        return {
          healthy: false,
          error: 'Não foi possível conectar ao Supabase',
          isExpiredToken: false
        };
      }

      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        return {
          healthy: false,
          error: 'Erro ao conectar ao banco de dados',
          isExpiredToken: false
        };
      }

      return { healthy: true, error: null, isExpiredToken: false };
    })();

    // Race between health check and timeout
    return await Promise.race([healthCheckPromise, timeoutPromise]);

  } catch (error) {
    if (error instanceof Error && error.message === 'Health check timeout') {
      return {
        healthy: false,
        error: 'Timeout de conexão. Tente novamente.',
        isExpiredToken: false
      };
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        healthy: false,
        error: 'Não foi possível conectar. Verifique sua internet.',
        isExpiredToken: false
      };
    }
    return {
      healthy: false,
      error: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      isExpiredToken: false
    };
  }
};