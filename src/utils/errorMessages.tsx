import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getSupabaseErrorMessage, ErrorMessageConfig } from '../lib/errorMessages';

// Re-export all error messages from centralized location
export * from '../lib/errorMessages';

export interface ErrorAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

/**
 * Legacy function for backward compatibility
 * Use getSupabaseErrorMessage from lib/errorMessages.ts for new code
 */
export const getErrorMessage = (error: string): { message: string; actions: ErrorAction[] } => {
  const errorConfig = getSupabaseErrorMessage(error);
  
  // Convert new format to legacy format
  const actions: ErrorAction[] = [];
  
  if (errorConfig.action) {
    actions.push({
      label: errorConfig.action.label,
      action: errorConfig.action.onClick || (() => {
        if (errorConfig.action?.href) {
          window.location.href = errorConfig.action.href;
        } else {
          window.location.reload();
        }
      }),
      variant: 'primary',
    });
  } else {
    // Default retry action
    actions.push({
      label: 'Tentar Novamente',
      action: () => window.location.reload(),
      variant: 'primary',
    });
  }
  
  // Add secondary action for navigation
  if (!error.includes('login') && !error.includes('credentials')) {
    actions.push({
      label: 'Voltar ao Dashboard',
      action: () => window.location.href = '/dashboard',
      variant: 'secondary',
    });
  }
  
  return {
    message: errorConfig.suggestion 
      ? `${errorConfig.message}. ${errorConfig.suggestion}` 
      : errorConfig.message,
    actions,
  };
};

export interface ErrorMessageProps {
  /** Error string or message to display */
  error: string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show suggestion text if available */
  showSuggestion?: boolean;
  /** Variant styling */
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  onRetry, 
  className = '',
  showSuggestion = true,
  variant = 'error',
}) => {
  const errorConfig = getSupabaseErrorMessage(error);
  
  const variantStyles = {
    error: {
      container: 'bg-rose-50 border-rose-200',
      icon: 'text-rose-500',
      title: 'text-rose-800',
      suggestion: 'text-rose-600',
      primaryBtn: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
      secondaryBtn: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-500',
      title: 'text-amber-800',
      suggestion: 'text-amber-600',
      primaryBtn: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
      secondaryBtn: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      suggestion: 'text-blue-600',
      primaryBtn: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondaryBtn: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div 
      className={`${styles.container} border rounded-lg p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <AlertCircle 
          className={`${styles.icon} flex-shrink-0 mt-0.5`} 
          size={20} 
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className={`${styles.title} font-medium`}>
            {errorConfig.message}
          </p>
          
          {showSuggestion && errorConfig.suggestion && (
            <p className={`${styles.suggestion} text-sm mt-1`}>
              {errorConfig.suggestion}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.secondaryBtn}`}
              >
                <RefreshCw size={14} className="mr-1.5" aria-hidden="true" />
                Tentar Novamente
              </button>
            )}
            
            {errorConfig.action && (
              <button
                type="button"
                onClick={() => {
                  if (errorConfig.action?.onClick) {
                    errorConfig.action.onClick();
                  } else if (errorConfig.action?.href) {
                    window.location.href = errorConfig.action.href;
                  }
                }}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.primaryBtn}`}
              >
                {errorConfig.action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};