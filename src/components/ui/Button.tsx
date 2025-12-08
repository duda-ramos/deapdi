import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  /** Texto contextual para exibir durante loading (ex: "Salvando...", "Enviando...") */
  loadingText?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  children,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary: 'bg-primary text-ink hover:bg-primary-dark focus-visible:ring-primary-dark',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 focus-visible:ring-offset-slate-100',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-500',
    ghost: 'bg-transparent text-muted hover:bg-slate-100 focus-visible:ring-slate-300'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[2.5rem]',
    md: 'px-4 py-2.5 text-sm min-h-[2.75rem]',
    lg: 'px-5 py-3 text-base min-h-[3.25rem]'
  };

  // Determine loading text
  const displayLoadingText = loadingText || 'Carregando…';

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      aria-busy={loading ? 'true' : undefined}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span 
            className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" 
            aria-hidden="true" 
          />
          <span className="text-sm font-medium">{displayLoadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';