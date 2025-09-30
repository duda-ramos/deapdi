import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using fallback mode');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) : null;
// Migration control - prevent automatic migrations
export const shouldRunMigrations = () => {
  // Only run migrations if explicitly enabled
  return import.meta.env.VITE_RUN_MIGRATIONS === 'true';
};

// Check if database is properly initialized
export const checkDatabaseHealth = async () => {
  if (!supabase) {
    return { healthy: false, error: 'Supabase client not initialized' };
  }

  try {
    // Comprehensive health check - test REST API, Auth API, and database query
    
    // 1. Test REST API endpoint reachability
    const restUrl = `${supabaseUrl}/rest/v1/`;
    try {
      const restResponse = await fetch(restUrl, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      if (!restResponse.ok && restResponse.status !== 404) {
        throw new Error(`REST API unreachable: ${restResponse.status}`);
      }
    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
        return { 
          healthy: false, 
          error: 'Cannot connect to Supabase. Please check your internet connection and verify that VITE_SUPABASE_URL is correct in your .env file.' 
        };
      }
      return { 
        healthy: false, 
        error: `Cannot reach Supabase REST API: ${fetchError instanceof Error ? fetchError.message : 'Network error'}` 
      };
    }

    // 2. Test Auth API endpoint
    try {
      const authUrl = `${supabaseUrl}/auth/v1/settings`;
      const authResponse = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey
        }
      });
      if (!authResponse.ok) {
        throw new Error(`Auth API unreachable: ${authResponse.status}`);
      }
    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
        return { 
          healthy: false, 
          error: 'Cannot connect to Supabase Auth API. Please check your internet connection and verify that VITE_SUPABASE_URL is correct in your .env file.' 
        };
      }
      return { 
        healthy: false, 
        error: `Cannot reach Supabase Auth API: ${fetchError instanceof Error ? fetchError.message : 'Network error'}` 
      };
    }

    // 3. Test database query
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        // Handle RLS recursion errors specifically
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          return { 
            healthy: false, 
            error: `Database RLS policy error: Infinite recursion detected in profiles table policies. Please fix the RLS policies in Supabase Dashboard.` 
          };
        }
        
        // Handle RLS recursion errors specifically
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          return { 
            healthy: false, 
            error: `Database RLS policy error: Infinite recursion detected in profiles table policies. Please fix the RLS policies in Supabase Dashboard.` 
          };
        }
        
        return { 
          healthy: false, 
          error: `Database query failed: ${error.message}` 
        };
      }
    } catch (queryError) {
      if (queryError instanceof TypeError && queryError.message === 'Failed to fetch') {
        return { 
          healthy: false, 
          error: 'Cannot connect to Supabase database. Please check your internet connection and verify your Supabase configuration.' 
        };
      }
      return { 
        healthy: false, 
        error: `Database connection failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}` 
      };
    }
    
    return { healthy: true, error: null };
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return { 
        healthy: false, 
        error: 'Cannot connect to Supabase. Please check your internet connection and verify that your .env file contains the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.' 
      };
    }
    return { 
      healthy: false, 
      error: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};