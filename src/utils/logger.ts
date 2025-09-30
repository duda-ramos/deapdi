/**
 * Structured logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private isDev: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const icons = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    return `${icons[level]} [${level.toUpperCase()}] ${message}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDev) return;
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
    console.debug(this.formatMessage('debug', message), context || '');
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
    if (this.isDev) {
      console.info(this.formatMessage('info', message), context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);
    console.warn(this.formatMessage('warn', message), context || '');
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context, error);
    this.addLog(entry);
    console.error(this.formatMessage('error', message), {
      error: error?.message,
      stack: error?.stack,
      ...context
    });

    // Send to error tracking service in production
    if (!this.isDev && window.gtag) {
      window.gtag('event', 'exception', {
        description: message,
        fatal: false
      });
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Specialized loggers for different modules
  auth = {
    initialized: (context?: LogContext) => this.info('Auth initialized', context),
    signIn: (email: string) => this.info('User signing in', { email }),
    signOut: () => this.info('User signing out'),
    error: (message: string, error?: Error) => this.error(`Auth error: ${message}`, error),
    sessionFound: (email: string) => this.info('Session found', { email }),
    sessionExpired: () => this.warn('Session expired')
  };

  setup = {
    checking: (attempt?: number) => this.info('Checking setup', { attempt }),
    complete: () => this.info('Setup complete'),
    failed: (error: string) => this.error('Setup failed', new Error(error)),
    offline: () => this.warn('Offline mode enabled'),
    skipped: () => this.info('Health check skipped (dev mode)')
  };

  healthCheck = {
    started: () => this.debug('Health check started'),
    cached: (age: number) => this.debug('Using cached health check', { ageMs: age }),
    success: () => this.info('Health check passed'),
    failed: (error: string) => this.error('Health check failed', new Error(error)),
    timeout: () => this.error('Health check timeout'),
    circuitOpen: (waitTime: number) => this.warn('Circuit breaker open', { waitTime })
  };

  performance = {
    slowRender: (component: string, duration: number) =>
      this.warn('Slow render detected', { component, duration }),
    slowApi: (operation: string, duration: number) =>
      this.warn('Slow API call', { operation, duration }),
    memoryWarning: (usedMB: number) =>
      this.warn('High memory usage', { usedMB })
  };
}

export const logger = new Logger();
