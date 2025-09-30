import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { performance, memoryMonitor } from './utils/performance';

// Initialize Sentry for error monitoring
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.NODE_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      // Browser and WebContainer environment noise
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Contextify',
      'running source code in new context',
      // Network errors that are temporary
      'Failed to fetch',
      'NetworkError',
      'Network request failed',
      // StackBlitz/WebContainer specific
      'blitz.js',
      'fetch.worker',
      'Watcher has not received',
      'open event was not received',
      // Common browser extensions
      'extensions/',
      'chrome-extension',
      'moz-extension',
      // Non-critical warnings
      'Non-Error promise rejection captured'
    ],
    beforeSend(event) {
      // Filter out development and sandbox environment errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        const errorMessage = error?.value || '';

        // Filter StackBlitz/WebContainer warnings
        if (errorMessage.includes('Contextify') ||
            errorMessage.includes('blitz.js') ||
            errorMessage.includes('preload') ||
            errorMessage.includes('X-Frame-Options')) {
          return null;
        }
      }

      // Filter out non-critical console warnings
      if (event.level === 'warning' && event.message) {
        if (event.message.includes('preload') ||
            event.message.includes('X-Frame-Options')) {
          return null;
        }
      }

      return event;
    }
  });
}

// Initialize Analytics
if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.PROD) {
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
    send_page_view: true,
    anonymize_ip: true
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
);

// Initialize performance monitoring
if (import.meta.env.PROD) {
  performance.monitorWebVitals();
  memoryMonitor.startMemoryMonitoring();
}