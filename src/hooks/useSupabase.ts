import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

interface UseSupabaseState<T> {
  data: T | null;
  loading: boolean;
  error: PostgrestError | null;
}

export function useSupabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UseSupabaseState<T>>({
    data: null,
    loading: true,
    error: null
  });

  // Memoize the query function to prevent unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedDeps = useMemo(() => dependencies, [...dependencies]);

  const fetchData = useCallback(async () => {
    // Check if Supabase is available
    if (!supabase) {
      setState({
        data: null,
        loading: false,
        error: { message: 'Supabase not available', details: '', hint: '', code: 'SUPABASE_UNAVAILABLE' } as PostgrestError
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await query();
      
      setState({
        data: result.data,
        loading: false,
        error: result.error
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as PostgrestError
      });
    }
  }, [query]);

  useEffect(() => {
    let mounted = true;

    const doFetch = async () => {
      if (mounted) {
        await fetchData();
      }
    };

    doFetch();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, memoizedDeps]);

  return state;
}

export function useSupabaseMutation<T, P = any>() {
  const [state, setState] = useState<UseSupabaseState<T> & { isLoading: boolean }>({
    data: null,
    loading: false,
    isLoading: false,
    error: null
  });

  const mutate = async (
    mutation: (params: P) => Promise<{ data: T | null; error: PostgrestError | null }>,
    params: P
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, loading: true, error: null }));
      const result = await mutation(params);
      
      setState({
        data: result.data,
        loading: false,
        isLoading: false,
        error: result.error
      });

      return result;
    } catch (error) {
      setState({
        data: null,
        loading: false,
        isLoading: false,
        error: error as PostgrestError
      });
      throw error;
    }
  };

  return { ...state, mutate };
}

// Real-time subscription hook
export function useSupabaseSubscription<T>(
  table: string,
  filter?: string,
  initialData: T | null = null
) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let subscription: any;

    const setupSubscription = () => {
      // Check if Supabase is available
      if (!supabase) {
        console.warn('useSupabaseSubscription: Supabase not available');
        setError(new Error('Supabase not available'));
        setLoading(false);
        return;
      }

      try {
        const channel = supabase
          .channel(`${table}_changes`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: table,
              filter: filter 
            }, 
            (payload) => {
              console.log('Real-time update:', payload);
              // Handle the real-time update based on event type
              // This is a simplified implementation
              setData(payload.new as T);
            }
          )
          .subscribe();

        subscription = channel;
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (subscription && supabase) {
        supabase.removeChannel(subscription);
      }
    };
  }, [table, filter]);

  return { data, loading, error };
}