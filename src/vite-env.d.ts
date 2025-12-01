/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Application Environment
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_APP_VERSION: string;

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEBUG: string;

  // Sentry Configuration
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_DEBUG: string;

  // Google Analytics
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_ANALYTICS_ID: string;

  // Development Options
  readonly VITE_SKIP_HEALTH_CHECK: string;
  readonly VITE_RUN_MIGRATIONS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Analytics gtag global
declare global {
  interface Window {
    dataLayer: unknown[];
    testSentryError: () => void;
  }
}
