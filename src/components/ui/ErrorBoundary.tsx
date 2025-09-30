import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Send to Sentry in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-gray-100 p-4 rounded-lg mb-4">
                <summary className="cursor-pointer font-medium">Detalhes do erro (desenvolvimento)</summary>
                <pre className="text-xs mt-2 overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="space-y-2">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw size={16} className="mr-2" />
                Tentar Novamente
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}