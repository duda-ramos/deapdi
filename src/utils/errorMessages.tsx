import React from 'react';
import { AlertCircle, RefreshCw, Settings, Wifi } from 'lucide-react';

export interface ErrorAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

export const getErrorMessage = (error: string): { message: string; actions: ErrorAction[] } => {
  // Supabase specific errors
  if (error.includes('Invalid Refresh Token') || error.includes('refresh_token_not_found')) {
    return {
      message: 'Sua sessão expirou. Por favor, faça login novamente.',
      actions: [
        {
          label: 'Fazer Login',
          action: () => window.location.href = '/login',
          variant: 'primary'
        }
      ]
    };
  }

  if (error.includes('Invalid login credentials')) {
    return {
      message: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => window.location.reload(),
          variant: 'primary'
        }
      ]
    };
  }

  if (error.includes('User already registered')) {
    return {
      message: 'Este email já está cadastrado. Tente fazer login ou use outro email.',
      actions: [
        {
          label: 'Ir para Login',
          action: () => window.location.href = '/login',
          variant: 'primary'
        }
      ]
    };
  }

  if (error.includes('email_not_confirmed')) {
    return {
      message: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
      actions: [
        {
          label: 'Reenviar Email',
          action: () => console.log('Reenviar email de confirmação'),
          variant: 'secondary'
        }
      ]
    };
  }

  if (error.includes('signup_disabled')) {
    return {
      message: 'O cadastro de novos usuários está temporariamente desabilitado. Entre em contato com o administrador.',
      actions: [
        {
          label: 'Contatar Suporte',
          action: () => window.open('mailto:admin@empresa.com'),
          variant: 'primary'
        }
      ]
    };
  }

  // Permission errors
  if (error.includes('permission') || error.includes('unauthorized') || error.includes('42501')) {
    return {
      message: 'Você não tem permissão para realizar esta ação. Entre em contato com seu gestor.',
      actions: [
        {
          label: 'Voltar',
          action: () => window.history.back(),
          variant: 'secondary'
        }
      ]
    };
  }

  // Duplicate entry errors
  if (error.includes('23505') || error.includes('duplicate')) {
    return {
      message: 'Este registro já existe. Verifique os dados e tente novamente.',
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => window.location.reload(),
          variant: 'primary'
        }
      ]
    };
  }

  // Network errors
  if (error.includes('Failed to fetch') || error.includes('network') || error.includes('timeout')) {
    return {
      message: 'Problema de conexão com a internet. Verifique sua conexão e tente novamente.',
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => window.location.reload(),
          variant: 'primary'
        },
        {
          label: 'Verificar Conexão',
          action: () => window.open('https://www.google.com', '_blank'),
          variant: 'secondary'
        }
      ]
    };
  }

  // Validation errors
  if (error.includes('validation') || error.includes('invalid')) {
    return {
      message: 'Os dados fornecidos são inválidos. Verifique as informações e tente novamente.',
      actions: [
        {
          label: 'Corrigir Dados',
          action: () => window.history.back(),
          variant: 'primary'
        }
      ]
    };
  }

  // Rate limiting
  if (error.includes('rate limit') || error.includes('too many requests')) {
    return {
      message: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
      actions: [
        {
          label: 'Aguardar e Tentar',
          action: () => setTimeout(() => window.location.reload(), 60000),
          variant: 'primary'
        }
      ]
    };
  }

  // Database connection errors
  if (error.includes('connection') || error.includes('database')) {
    return {
      message: 'Problema temporário com o banco de dados. Nossa equipe foi notificada.',
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => window.location.reload(),
          variant: 'primary'
        },
        {
          label: 'Contatar Suporte',
          action: () => window.open('mailto:suporte@empresa.com'),
          variant: 'secondary'
        }
      ]
    };
  }

  // Generic fallback
  return {
    message: 'Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.',
    actions: [
      {
        label: 'Tentar Novamente',
        action: () => window.location.reload(),
        variant: 'primary'
      },
      {
        label: 'Voltar ao Dashboard',
        action: () => window.location.href = '/dashboard',
        variant: 'secondary'
      }
    ]
  };
};

export const ErrorMessage: React.FC<{ 
  error: string; 
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  const { message, actions } = getErrorMessage(error);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="text-red-800 font-medium mb-2">{message}</p>
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
              >
                <RefreshCw size={14} className="mr-1" />
                Tentar Novamente
              </button>
            )}
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`inline-flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};