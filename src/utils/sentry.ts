/**
 * Sentry Utility Functions
 * 
 * Provides helper functions for Sentry integration including:
 * - User context management
 * - Custom error capturing
 * - Breadcrumb tracking
 * - Performance monitoring
 */

import * as Sentry from '@sentry/react';

// Types
interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

interface CustomErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: Sentry.SeverityLevel;
}

/**
 * Set user context for Sentry error tracking
 * Call this when user logs in
 */
export function setSentryUser(user: SentryUser): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  if (user.role) {
    Sentry.setTag('user.role', user.role);
  }
}

/**
 * Clear user context from Sentry
 * Call this when user logs out
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
  Sentry.setTag('user.role', undefined);
}

/**
 * Capture an exception with optional context
 */
export function captureError(
  error: Error | unknown,
  context?: CustomErrorContext
): string {
  const scope = new Sentry.Scope();

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });
  }

  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
  }

  if (context?.level) {
    scope.setLevel(context.level);
  }

  return Sentry.captureException(error, scope);
}

/**
 * Capture a message with optional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Omit<CustomErrorContext, 'level'>
): string {
  const scope = new Sentry.Scope();
  scope.setLevel(level);

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });
  }

  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
  }

  return Sentry.captureMessage(message, scope);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track a user action as a breadcrumb
 */
export function trackUserAction(
  action: string,
  details?: Record<string, unknown>
): void {
  addBreadcrumb('user.action', action, details, 'info');
}

/**
 * Track navigation as a breadcrumb
 */
export function trackNavigation(from: string, to: string): void {
  addBreadcrumb('navigation', `${from} -> ${to}`, { from, to }, 'info');
}

/**
 * Track API calls as breadcrumbs
 */
export function trackApiCall(
  method: string,
  url: string,
  status?: number,
  error?: string
): void {
  addBreadcrumb(
    'api',
    `${method} ${url}`,
    { method, url, status, error },
    error ? 'error' : 'info'
  );
}

/**
 * Set a custom tag for the current scope
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set extra data for the current scope
 */
export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value);
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Wrap a function with Sentry error boundary
 */
export function withSentryErrorBoundary<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: CustomErrorContext
): T {
  return ((...args: unknown[]) => {
    try {
      return fn(...args);
    } catch (error) {
      captureError(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Test Sentry integration by sending a test error
 * Use this in development to verify setup
 */
export function testSentryIntegration(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Cannot test integration.');
    return;
  }

  try {
    throw new Error('[Sentry Test] Integration test from TalentFlow');
  } catch (error) {
    captureError(error, {
      tags: { test: 'true' },
      extra: { timestamp: new Date().toISOString() },
    });
    console.log('[Sentry] Test error sent. Check your Sentry dashboard.');
  }
}

// Re-export Sentry for direct access when needed
export { Sentry };
