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
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Add default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
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