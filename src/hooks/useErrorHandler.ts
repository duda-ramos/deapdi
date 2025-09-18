import { useCallback } from 'react';
import * as Sentry from '@sentry/react';

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error | ErrorInfo, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorContext = context || (typeof error === 'object' && 'context' in error ? error.context : 'Unknown');
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`Error in ${errorContext}:`, error);
    }
    
    // Send to Sentry in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          context: errorContext
        },
        extra: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    }
    
    // Return user-friendly message
    return getUserFriendlyMessage(errorMessage);
  }, []);

  const getUserFriendlyMessage = (errorMessage: string): string => {
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'Você não tem permissão para realizar esta ação.';
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'A operação demorou muito para responder. Tente novamente.';
    }
    
    return 'Ocorreu um erro inesperado. Nossa equipe foi notificada.';
  };

  return { handleError };
};