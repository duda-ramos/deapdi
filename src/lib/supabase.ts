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
      return { 
        healthy: false, 
        error: `Cannot reach Supabase Auth API: ${fetchError instanceof Error ? fetchError.message : 'Network error'}` 
      };
    }

    // 3. Test database query
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      return { 
        healthy: false, 
        error: `Database query failed: ${error.message}` 
      };
    }
    
    return { healthy: !error, error: error?.message };
  } catch (error) {
    return { 
      healthy: false, 
      error: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};