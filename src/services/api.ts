import { apiRateLimiter } from '../utils/security';

/**
 * Enhanced fetch wrapper with rate limiting and error handling
 */
export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  rateLimitKey?: string
): Promise<Response> => {
  // Apply rate limiting if key provided
  if (rateLimitKey && !apiRateLimiter.canMakeRequest(rateLimitKey)) {
    const resetTime = apiRateLimiter.getResetTime(rateLimitKey);
    const waitTime = Math.ceil((resetTime - Date.now()) / 1000);
    throw new Error(`Rate limit exceeded. Please try again in ${waitTime} seconds.`);
  }

  // Add default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache',
    ...options.headers
  };

  // Add timeout
  const controller = new AbortController();
  const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Log failed requests in production for monitoring
      if (import.meta.env.PROD) {
        console.error(`API Request failed: ${response.status} ${response.statusText} - ${url}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    // Network error handling
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Supabase request wrapper with enhanced error handling
 */
export const supabaseRequest = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: string
): Promise<T> => {
  try {
    const { data, error } = await operation();
    
    if (error) {
      // Normalize error to prevent primitive conversion issues
      const errorMessage = error?.message || String(error);
      console.error(`Supabase error in ${context}:`, errorMessage);
      
      // Handle network connectivity issues
      if (errorMessage === 'Failed to fetch' || error?.name === 'TypeError') {
        throw new Error('Não foi possível conectar ao Supabase. Verifique se as variáveis de ambiente estão configuradas corretamente e se o projeto está online.');
      }
      
      // Handle network/connection errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
      }
      
      // Handle specific error types
      if (error?.code === '42501') {
        throw new Error('Você não tem permissão para realizar esta ação.');
      }
      
      if (error?.code === '23505') {
        throw new Error('Este registro já existe.');
      }
      
      if (errorMessage?.includes('JWT expired')) {
        throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
      }
      
      // Handle RLS recursion errors specifically
      if (error?.code === '42P17' || errorMessage?.includes('infinite recursion detected in policy')) {
        // Extract table name from error message if available
        const tableMatch = errorMessage?.match(/relation "([^"]+)"/);
        const tableName = tableMatch ? tableMatch[1] : 'unknown table';
        throw new Error(`SUPABASE_RLS_RECURSION: Infinite recursion detected in RLS policies for table "${tableName}". The security policies need to be fixed in Supabase to prevent circular dependencies.`);
      }
      
      throw new Error(errorMessage || 'Erro interno do servidor.');
    }
    
    return data as T;
  } catch (error) {
    // Normalize error to prevent primitive conversion issues
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    console.error(`Operation failed in ${context}:`, normalizedError.message);
    throw normalizedError;
  }
};