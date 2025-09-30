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
  console.error('⚠️ Supabase credentials are missing or invalid - using fallback mode');
  console.error('📝 Please update your .env file with valid Supabase credentials');
  console.error('Current URL:', supabaseUrl);
  console.error('Has Key:', !!supabaseAnonKey);
} else {
  console.log('✅ Supabase client initializing...');
  console.log('URL:', supabaseUrl);
  console.log('Key present:', !!supabaseAnonKey);
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
      console.log('🌐 Supabase fetch:', url);
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }).catch(error => {
        console.error('❌ Supabase fetch error:', error);
        throw error;
      });
    }
  }
}) : null;

if (supabase) {
  console.log('✅ Supabase client created successfully');
} else {
  console.error('❌ Supabase client is NULL - check your credentials');
}

// Check if JWT token is expired
export const isJWTExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < (now + 300);
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
    console.error('🔴 Supabase ANON_KEY is expired');
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
      // 1. Test REST API endpoint reachability
      const restUrl = `${supabaseUrl}/rest/v1/`;
      try {
        const restResponse = await fetch(restUrl, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          signal: AbortSignal.timeout(5000)
        });

        // Check for 401/403 which might indicate expired token
        if (restResponse.status === 401 || restResponse.status === 403) {
          return {
            healthy: false,
            error: 'Authentication failed. Your Supabase credentials may be invalid or expired. Please check your .env file.',
            isExpiredToken: true
          };
        }

        if (!restResponse.ok && restResponse.status !== 404) {
          throw new Error(`REST API unreachable: ${restResponse.status}`);
        }
      } catch (fetchError) {
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          return {
            healthy: false,
            error: 'Cannot connect to Supabase. Please check your internet connection and verify that VITE_SUPABASE_URL is correct in your .env file.',
            isExpiredToken: false
          };
        }
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            healthy: false,
            error: 'Connection timeout. Supabase is taking too long to respond.',
            isExpiredToken: false
          };
        }
        return {
          healthy: false,
          error: `Cannot reach Supabase REST API: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`,
          isExpiredToken: false
        };
      }

      // 2. Test Auth API endpoint
      try {
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
            error: 'Authentication failed. Your Supabase ANON_KEY may be invalid or expired.',
            isExpiredToken: true
          };
        }

        if (!authResponse.ok) {
          throw new Error(`Auth API unreachable: ${authResponse.status}`);
        }
      } catch (fetchError) {
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          return {
            healthy: false,
            error: 'Cannot connect to Supabase Auth API. Please check your internet connection and verify that VITE_SUPABASE_URL is correct in your .env file.',
            isExpiredToken: false
          };
        }
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            healthy: false,
            error: 'Auth API timeout. Supabase is taking too long to respond.',
            isExpiredToken: false
          };
        }
        return {
          healthy: false,
          error: `Cannot reach Supabase Auth API: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`,
          isExpiredToken: false
        };
      }

      // 3. Test database query
      try {
        // Simple query without RLS complications
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();
        if (error) {
          // If there's still an error, it might be empty table or other issue
          console.warn('Database query warning:', error);
          // Don't fail health check for empty table
          if (error.code === 'PGRST116') {
            return { healthy: true, error: null, isExpiredToken: false };
          }
        }
      } catch (queryError) {
        if (queryError instanceof TypeError && queryError.message === 'Failed to fetch') {
          return {
            healthy: false,
            error: 'Cannot connect to Supabase database. Please check your internet connection and verify your Supabase configuration.',
            isExpiredToken: false
          };
        }
        return {
          healthy: false,
          error: `Database connection failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`,
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
        error: 'Connection timeout. Supabase is taking too long to respond. Please check your connection or try again later.',
        isExpiredToken: false
      };
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        healthy: false,
        error: 'Cannot connect to Supabase. Please check your internet connection and verify that your .env file contains the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.',
        isExpiredToken: false
      };
    }
    return {
      healthy: false,
      error: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isExpiredToken: false
    };
  }
};