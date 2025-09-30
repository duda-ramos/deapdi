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
  console.warn('⚠️ Supabase credentials are missing or invalid - using fallback mode');
  console.warn('📝 Please update your .env file with valid Supabase credentials');
}

export const supabase = (supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'talentflow-web'
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

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < (now + 300);

    if (isExpired && import.meta.env.DEV) {
      const expirationDate = new Date(payload.exp * 1000);
      console.error('🔴 JWT Token Expired:', {
        expiredAt: expirationDate.toISOString(),
        now: new Date().toISOString(),
        tokenPreview: token.substring(0, 30) + '...'
      });
    }

    return isExpired;
  } catch (error) {
    console.error('🔴 Error parsing JWT token:', error);
    return true; // Treat parsing errors as expired
  }
};
// Migration control - prevent automatic migrations
export const shouldRunMigrations = () => {
  // Only run migrations if explicitly enabled
  return import.meta.env.VITE_RUN_MIGRATIONS === 'true';
};

// Health check cache and circuit breaker
let healthCheckCache: { result: any; timestamp: number } | null = null;
const HEALTH_CHECK_CACHE_TTL = 60000; // 60 seconds
let isHealthCheckRunning = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_BREAKER_COOLDOWN = 30000; // 30 seconds
let circuitBreakerOpenUntil = 0;

// Check if database is properly initialized
export const checkDatabaseHealth = async (timeoutMs: number = 8000) => {
  // Check cache first
  if (healthCheckCache) {
    const age = Date.now() - healthCheckCache.timestamp;
    if (age < HEALTH_CHECK_CACHE_TTL) {
      if (import.meta.env.DEV) {
        console.log('🔧 Health Check: Using cached result', { ageMs: age });
      }
      return healthCheckCache.result;
    }
  }

  // Check circuit breaker
  const now = Date.now();
  if (now < circuitBreakerOpenUntil) {
    const waitTime = Math.ceil((circuitBreakerOpenUntil - now) / 1000);
    console.warn(`🔴 Circuit breaker is open. Wait ${waitTime}s before retrying.`);
    return {
      healthy: false,
      error: `Too many failed attempts. Please wait ${waitTime} seconds before retrying.`,
      isExpiredToken: false
    };
  }

  // Prevent concurrent health checks
  if (isHealthCheckRunning) {
    console.warn('🔧 Health Check: Already in progress, skipping duplicate');
    return { healthy: false, error: 'Health check already in progress', isExpiredToken: false };
  }

  isHealthCheckRunning = true;

  try {
    if (!supabase) {
      const isPlaceholderCreds = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey);
      const errorMsg = isPlaceholderCreds
        ? 'Please configure your Supabase credentials in the .env file. The current values are placeholders.'
        : 'Supabase client not initialized';
      const result = { healthy: false, error: errorMsg, isExpiredToken: false };
      healthCheckCache = { result, timestamp: Date.now() };
      consecutiveFailures++;
      return result;
    }

    // Check if JWT token is expired
    if (supabaseAnonKey && isJWTExpired(supabaseAnonKey)) {
      console.error('🔴 Supabase ANON_KEY is expired');
      const result = {
        healthy: false,
        error: 'Your Supabase ANON_KEY has expired. Please update your .env file with a new key from your Supabase Dashboard.',
        isExpiredToken: true
      };
      healthCheckCache = { result, timestamp: Date.now() };
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
        console.error(`🔴 Circuit breaker opened after ${consecutiveFailures} failures`);
      }
      return result;
    }

    // Create abort controller for cleanup
    const abortController = new AbortController();

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        abortController.abort();
        reject(new Error('Health check timeout'));
      }, timeoutMs);
    });

    // Comprehensive health check - simplified to single test
    const healthCheckPromise = (async () => {
      // Test REST API endpoint reachability
      const restUrl = `${supabaseUrl}/rest/v1/`;
      try {
        const restResponse = await fetch(restUrl, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          signal: abortController.signal
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
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return {
            healthy: false,
            error: 'Connection timeout. Supabase is taking too long to respond.',
            isExpiredToken: false
          };
        }
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          return {
            healthy: false,
            error: 'Cannot connect to Supabase. Please check your internet connection and verify that VITE_SUPABASE_URL is correct in your .env file.',
            isExpiredToken: false
          };
        }
        return {
          healthy: false,
          error: `Cannot reach Supabase REST API: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`,
          isExpiredToken: false
        };
      }

      return { healthy: true, error: null, isExpiredToken: false };
    })();

    // Race between health check and timeout
    const result = await Promise.race([healthCheckPromise, timeoutPromise]);

    // Cache successful result
    healthCheckCache = { result, timestamp: Date.now() };

    // Reset failure counter on success
    if (result.healthy) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
        console.error(`🔴 Circuit breaker opened after ${consecutiveFailures} failures`);
      }
    }

    return result;

  } catch (error) {
    let result;

    if (error instanceof Error && error.message === 'Health check timeout') {
      result = {
        healthy: false,
        error: 'Connection timeout. Supabase is taking too long to respond. Please check your connection or try again later.',
        isExpiredToken: false
      };
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      result = {
        healthy: false,
        error: 'Cannot connect to Supabase. Please check your internet connection and verify that your .env file contains the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.',
        isExpiredToken: false
      };
    } else {
      result = {
        healthy: false,
        error: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isExpiredToken: false
      };
    }

    healthCheckCache = { result, timestamp: Date.now() };
    consecutiveFailures++;

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
      console.error(`🔴 Circuit breaker opened after ${consecutiveFailures} failures`);
    }

    return result;
  } finally {
    isHealthCheckRunning = false;
  }
};