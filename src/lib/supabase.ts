import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are placeholders or invalid
const isPlaceholder = (value: string | undefined) => {
  if (!value) return true;
  const placeholders = ['your-project-url-here', 'your-anon-key-here', 'your_supabase', 'example'];
  return placeholders.some(p => value.toLowerCase().includes(p));
};

// Validate Supabase URL format
const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const supabaseUrlPattern = /^https:\/\/[a-z0-9]{20}\.supabase\.co$/;
  return supabaseUrlPattern.test(url);
};

// Check if JWT token is from Bolt (invalid issuer)
const isBoltToken = (token: string | undefined): boolean => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload.iss === 'bolt' || payload.issuer === 'bolt';
  } catch {
    return false;
  }
};

// Validate token has reasonable lifetime
const hasValidLifetime = (token: string | undefined): boolean => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.iat || !payload.exp) return false;
    const lifetime = payload.exp - payload.iat;
    return lifetime > 3600; // At least 1 hour
  } catch {
    return false;
  }
};

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.error('⚠️ Supabase credentials are missing or invalid');
} else if (!isValidSupabaseUrl(supabaseUrl)) {
  console.error('⚠️ Supabase URL format is invalid. Expected format: https://[20-char-id].supabase.co');
  console.error('   Current URL:', supabaseUrl);
} else if (isBoltToken(supabaseAnonKey)) {
  console.error('⚠️ Detected Bolt-generated token. Please use a valid Supabase ANON_KEY from your Supabase Dashboard.');
  console.error('   Go to: https://supabase.com/dashboard → Your Project → Settings → API');
} else if (!hasValidLifetime(supabaseAnonKey)) {
  console.error('⚠️ Token has invalid lifetime (too short or zero). Please get a new token from Supabase Dashboard.');
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

// Clean invalid sessions from localStorage
export const cleanInvalidSessions = () => {
  try {
    const storageKey = 'supabase.auth.token';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.access_token && isJWTExpired(session.access_token)) {
          console.log('🧹 Cleaning expired session from localStorage');
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.log('🧹 Removing malformed session from localStorage');
        localStorage.removeItem(storageKey);
      }
    }
  } catch (error) {
    console.warn('Error cleaning sessions:', error);
  }
};

// Check if database is properly initialized
export const checkDatabaseHealth = async (timeoutMs: number = 10000): Promise<{ healthy: boolean; error: string | null; isExpiredToken: boolean; isInvalidKey: boolean; isBoltToken: boolean }> => {
  if (!supabase) {
    const isPlaceholderCreds = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey);
    const isBolt = isBoltToken(supabaseAnonKey);
    const isInvalidUrl = !isValidSupabaseUrl(supabaseUrl);

    let errorMsg = 'Supabase client not initialized';
    if (isPlaceholderCreds) {
      errorMsg = 'Please configure your Supabase credentials in the .env file. The current values are placeholders.';
    } else if (isBolt) {
      errorMsg = 'Detected Bolt-generated token. Please use a valid Supabase ANON_KEY from your Supabase Dashboard (Settings → API).';
    } else if (isInvalidUrl) {
      errorMsg = 'Invalid Supabase URL format. Expected: https://[20-char-id].supabase.co';
    }

    return { healthy: false, error: errorMsg, isExpiredToken: false, isInvalidKey: isBolt, isBoltToken: isBolt };
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
      isExpiredToken: true,
      isInvalidKey: false,
      isBoltToken: false
    };
  }

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
  });

  try {
    // Test connection with better error handling for 400 status
    const healthCheckPromise = (async () => {
      // First test: Basic API connectivity
      const restUrl = `${supabaseUrl}/rest/v1/`;
      const restResponse = await fetch(restUrl, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        signal: AbortSignal.timeout(5000)
      });

      if (restResponse.status === 400) {
        const isBolt = isBoltToken(supabaseAnonKey);
        return {
          healthy: false,
          error: isBolt
            ? 'Detected Bolt-generated token (HTTP 400). Please use a valid Supabase ANON_KEY from your Supabase Dashboard.'
            : 'Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY in the .env file.',
          isExpiredToken: false,
          isInvalidKey: true,
          isBoltToken: isBolt
        };
      }

      if (restResponse.status === 401 || restResponse.status === 403) {
        return {
          healthy: false,
          error: 'Unauthorized access to Supabase. Please verify your API key is correct.',
          isExpiredToken: false,
          isInvalidKey: true,
          isBoltToken: false
        };
      }

      // Second test: Auth API
      const authUrl = `${supabaseUrl}/auth/v1/settings`;
      const authResponse = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey
        },
        signal: AbortSignal.timeout(5000)
      });

      if (authResponse.status === 400) {
        const isBolt = isBoltToken(supabaseAnonKey);
        return {
          healthy: false,
          error: isBolt
            ? 'Bolt-generated token detected (HTTP 400 on auth). Get a real Supabase ANON_KEY from your project dashboard.'
            : 'Invalid API key format. Please get a new anon/public key from your Supabase Dashboard.',
          isExpiredToken: true,
          isInvalidKey: false,
          isBoltToken: isBolt
        };
      }

      if (authResponse.status === 401 || authResponse.status === 403) {
        return {
          healthy: false,
          error: 'API key expired or invalid. Please update your .env file with fresh credentials.',
          isExpiredToken: true,
          isInvalidKey: false,
          isBoltToken: false
        };
      }

      if (!authResponse.ok) {
        return {
          healthy: false,
          error: `Cannot connect to Supabase (HTTP ${authResponse.status}). Check your internet connection.`,
          isExpiredToken: false,
          isInvalidKey: false,
          isBoltToken: false
        };
      }

      // Third test: Database query (only if auth is working)
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        return {
          healthy: false,
          error: `Database error: ${error.message}. Check your RLS policies.`,
          isExpiredToken: false,
          isInvalidKey: false,
          isBoltToken: false
        };
      }

      return { healthy: true, error: null, isExpiredToken: false, isInvalidKey: false, isBoltToken: false };
    })();

    // Race between health check and timeout
    return await Promise.race([healthCheckPromise, timeoutPromise]);

  } catch (error) {
    // ... (existing error handling)
    if (error instanceof Error && error.message === 'Health check timeout') {
      return {
        healthy: false,
        error: 'Connection timeout. Please check your internet connection and try again.',
        isExpiredToken: false,
        isInvalidKey: false,
        isBoltToken: false
      };
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        healthy: false,
        error: 'Network error. Please check your internet connection.',
        isExpiredToken: false,
        isInvalidKey: false,
        isBoltToken: false
      };
    }
    return {
      healthy: false,
      error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isExpiredToken: false,
      isInvalidKey: false,
      isBoltToken: false
    };
  }
};