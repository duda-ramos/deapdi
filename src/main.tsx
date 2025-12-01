import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { performance } from './utils/performance';
import { memoryMonitor } from './utils/memoryMonitor';

// Sentry Configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const IS_PRODUCTION = import.meta.env.PROD;
const ENABLE_SENTRY_DEV = import.meta.env.VITE_SENTRY_DEBUG === 'true';

// Initialize Sentry for error monitoring
// Runs in production always, or in development if VITE_SENTRY_DEBUG=true
if (SENTRY_DSN && (IS_PRODUCTION || ENABLE_SENTRY_DEV)) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment configuration
    environment: APP_ENV,
    release: `talentflow@${APP_VERSION}`,
    
    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      })
    ],
    
    // Sample rates - adjust based on traffic volume
    // Production: 10% of transactions, Dev: 100%
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    
    // Session Replay sampling
    // Capture 10% of sessions, but 100% of sessions with errors
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    
    // Enable debug mode in development for testing
    debug: ENABLE_SENTRY_DEV,
    
    // Errors to ignore - common noise that doesn't need tracking
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
      'Load failed',
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
      'Non-Error promise rejection captured',
      // CORS errors (usually from third-party scripts)
      'Script error.',
      'Script error'
    ],
    
    // URLs to ignore - third-party scripts
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
      /googletagmanager\.com/i,
      /google-analytics\.com/i,
    ],
    
    beforeSend(event, hint) {
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

      // Add additional context
      event.tags = {
        ...event.tags,
        app_version: APP_VERSION,
        app_environment: APP_ENV,
      };

      return event;
    }
  });
  
  // Set user context when available (can be updated later when user logs in)
  Sentry.setTag('app.name', 'TalentFlow');
  
  // Log initialization in development
  if (ENABLE_SENTRY_DEV) {
    console.log('[Sentry] Initialized in debug mode', {
      environment: APP_ENV,
      release: `talentflow@${APP_VERSION}`,
      dsn: SENTRY_DSN.substring(0, 30) + '...'
    });
  }
}

// Export Sentry test function for development
export const testSentryError = () => {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Cannot test error capture.');
    return;
  }
  
  try {
    throw new Error('[Sentry Test] This is a test error from TalentFlow');
  } catch (error) {
    Sentry.captureException(error);
    console.log('[Sentry] Test error sent successfully. Check your Sentry dashboard.');
  }
};

// Expose to window for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testSentryError = testSentryError;
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
}

// Initialize memory monitoring in development
if (import.meta.env.DEV) {
  memoryMonitor.startMemoryMonitoring();
}