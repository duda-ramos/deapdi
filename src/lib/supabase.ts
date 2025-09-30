import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type JWTPayload = {
  exp?: number;
  iat?: number;
  iss?: string;
  issuer?: string;
};

const decodeBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');

  if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(padded, 'base64').toString('utf-8');
  }

  throw new Error('No base64 decoder available');
};

const decodeJWTPayload = (token: string | undefined): JWTPayload | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Payload = parts[1];
    const payloadString = decodeBase64(base64Payload);
    return JSON.parse(payloadString);
  } catch {
    return null;
  }
};

// Check if credentials are placeholders or invalid
const isPlaceholder = (value: string | undefined) => {
  if (!value) return true;
  const placeholders = ['your-project-url-here', 'your-anon-key-here', 'your_supabase', 'example'];
  return placeholders.some(p => value.toLowerCase().includes(p));
};

// Validate Supabase URL format (allowing generated IDs and custom subdomains)
const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const supabaseUrlPattern = /^https:\/\/[a-z0-9-]{1,32}\.supabase\.co$/i;
  return supabaseUrlPattern.test(url);
};

// Check if JWT token is from Bolt (invalid issuer)
const isBoltToken = (token: string | undefined): boolean => {
  const payload = decodeJWTPayload(token);
  if (!payload) return false;
  return payload.iss === 'bolt' || payload.issuer === 'bolt';
};

// Validate token has reasonable lifetime
const hasValidLifetime = (token: string | undefined): boolean => {
  const payload = decodeJWTPayload(token);
  if (!payload?.iat || !payload.exp) return false;
  const lifetime = payload.exp - payload.iat;
  return lifetime > 0;
};

// Check if JWT token is expired
const isJWTExpired = (token: string): boolean => {
  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);

  if (payload.iat && payload.iat === payload.exp) {
    console.warn('⚠️ JWT token has zero lifetime (iat === exp)');
    return true;
  }

  return payload.exp <= now;
};

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.error('⚠️ Supabase credentials are missing or invalid');
} else if (!isValidSupabaseUrl(supabaseUrl)) {
  console.error('⚠️ Supabase URL format is invalid. Expected format similar to https://<project>.supabase.co');
  console.error('   Current URL:', supabaseUrl);
} else if (isBoltToken(supabaseAnonKey)) {
  console.error('⚠️ Detected Bolt-generated token. Please use a valid Supabase ANON_KEY from your Supabase Dashboard.');
  console.error('   Go to: https://supabase.com/dashboard → Your Project → Settings → API');
} else if (!hasValidLifetime(supabaseAnonKey)) {
  console.error('⚠️ Token has invalid lifetime (too short or zero). Please get a new token from Supabase Dashboard.');
} else if (isJWTExpired(supabaseAnonKey)) {
  console.error('⚠️ Supabase ANON_KEY is expired. Please update your credentials.');
}

const shouldInitializeClient = (
  supabaseUrl &&
  supabaseAnonKey &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseAnonKey) &&
  isValidSupabaseUrl(supabaseUrl) &&
  !isBoltToken(supabaseAnonKey) &&
  hasValidLifetime(supabaseAnonKey) &&
  !isJWTExpired(supabaseAnonKey)
);

export const supabase = shouldInitializeClient
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    })
  : null;
// Migration control - prevent automatic migrations
const shouldRunMigrations = () => {
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
        if (
          session.access_token &&
          (isJWTExpired(session.access_token) || !hasValidLifetime(session.access_token))
        ) {
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
    const isExpired = !!supabaseAnonKey && isJWTExpired(supabaseAnonKey);
    const hasLifetime = !!supabaseAnonKey && hasValidLifetime(supabaseAnonKey);

    let errorMsg = 'Supabase client not initialized';
    if (isPlaceholderCreds) {
      errorMsg = 'Please configure your Supabase credentials in the .env file. The current values are placeholders.';
    } else if (isBolt) {
      errorMsg = 'Detected Bolt-generated token. Please use a valid Supabase ANON_KEY from your Supabase Dashboard (Settings → API).';
    } else if (isInvalidUrl) {
      errorMsg = 'Invalid Supabase URL format. Expected something like https://your-project.supabase.co';
    } else if (isExpired) {
      errorMsg = 'Your Supabase ANON_KEY has expired. Please update your .env file with a new key from your Supabase Dashboard.';
    } else if (!hasLifetime) {
      errorMsg = 'Supabase ANON_KEY has an invalid lifetime. Generate a fresh key from your Supabase Dashboard.';
    }

    return {
      healthy: false,
      error: errorMsg,
      isExpiredToken: isExpired,
      isInvalidKey: isBolt || !hasLifetime || isPlaceholderCreds,
      isBoltToken: isBolt
    };
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
      const authUrl = `${supabaseUrl}/auth/v1/health`;
      const authResponse = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey
        },
        signal: AbortSignal.timeout(5000)
      });

      if (authResponse.status === 401 || authResponse.status === 403) {
        console.warn(
          `ℹ️ Supabase auth health endpoint returned HTTP ${authResponse.status}. This endpoint may not be public. Continuing other checks.`
        );
      } else if (authResponse.status === 400) {
        const isBolt = isBoltToken(supabaseAnonKey);
        return {
          healthy: false,
          error: isBolt
            ? 'Bolt-generated token detected (HTTP 400 on auth health). Get a real Supabase ANON_KEY from your project dashboard.'
            : 'Supabase auth health endpoint returned HTTP 400. Please verify your project configuration.',
          isExpiredToken: false,
          isInvalidKey: isBolt,
          isBoltToken: isBolt
        };
      } else if (!authResponse.ok) {
        return {
          healthy: false,
          error: `Cannot connect to Supabase auth health endpoint (HTTP ${authResponse.status}). Check your project status or network connection.`,
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