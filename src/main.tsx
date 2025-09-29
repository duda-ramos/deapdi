import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

// Initialize Sentry for error monitoring
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.NODE_ENV || 'production',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      })
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.05 : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    beforeSend(event) {
      // Filter out development errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        if (error?.value?.includes('Non-Error promise rejection')) {
          return null;
        }
        if (error?.value?.includes('Script error')) {
          return null;
        }
      }
      
      // Filter out non-critical errors in production
      if (import.meta.env.PROD && event.level === 'warning') {
        return null;
      }
      
      return event;
    }
  });
}

// Initialize Analytics
if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  // Google Analytics 4
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_ANALYTICS_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', import.meta.env.VITE_ANALYTICS_ID, {
    page_title: 'TalentFlow',
    page_location: window.location.href,
    custom_map: {
      custom_parameter_1: 'user_role'
    },
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </p>
          <button
            onClick={resetError}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
)