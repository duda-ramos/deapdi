/**
 * Advanced Debugging System for Loop Detection
 *
 * This utility helps identify infinite loops and performance bottlenecks
 */

interface DebugEntry {
  timestamp: number;
  component: string;
  action: string;
  data?: any;
}

interface LoopDetection {
  key: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

class DebugSystem {
  private enabled: boolean;
  private history: DebugEntry[] = [];
  private maxHistory = 1000;
  private loopThreshold = 10;
  private loopTimeWindow = 1000;
  private loopDetection: Map<string, LoopDetection> = new Map();
  private emergencyBreak = false;

  constructor() {
    this.enabled = import.meta.env.DEV || localStorage.getItem('DEBUG_MODE') === 'true';
  }

  log(component: string, action: string, data?: any) {
    if (!this.enabled) return;

    const entry: DebugEntry = {
      timestamp: Date.now(),
      component,
      action,
      data
    };

    this.history.push(entry);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const loopKey = `${component}:${action}`;
    this.checkForLoop(loopKey);

    console.log(`[DEBUG] ${component} → ${action}`, data || '');
  }

  private checkForLoop(key: string) {
    const now = Date.now();
    const existing = this.loopDetection.get(key);

    if (existing) {
      if (now - existing.firstSeen < this.loopTimeWindow) {
        existing.count++;
        existing.lastSeen = now;

        if (existing.count >= this.loopThreshold) {
          this.triggerEmergencyBreak(key, existing);
        }
      } else {
        this.loopDetection.set(key, {
          key,
          count: 1,
          firstSeen: now,
          lastSeen: now
        });
      }
    } else {
      this.loopDetection.set(key, {
        key,
        count: 1,
        firstSeen: now,
        lastSeen: now
      });
    }
  }

  private triggerEmergencyBreak(key: string, detection: LoopDetection) {
    console.error('🚨 EMERGENCY BREAK: Infinite loop detected!');
    console.error(`Component/Action: ${key}`);
    console.error(`Executions: ${detection.count} times in ${detection.lastSeen - detection.firstSeen}ms`);
    console.error('Recent history:', this.getRecentHistory(20));

    this.emergencyBreak = true;

    const errorMessage = `
      ⚠️ LOOP INFINITO DETECTADO ⚠️

      Componente: ${key}
      Execuções: ${detection.count}x em ${detection.lastSeen - detection.firstSeen}ms

      O sistema pausou automaticamente para prevenir travamento.
      Verifique o console para mais detalhes.
    `;

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        alert(errorMessage);
      }, 100);
    }
  }

  isEmergencyBreak(): boolean {
    return this.emergencyBreak;
  }

  resetEmergencyBreak() {
    console.log('🔄 Resetting emergency break...');
    this.emergencyBreak = false;
    this.loopDetection.clear();
  }

  getRecentHistory(count: number = 50): DebugEntry[] {
    return this.history.slice(-count);
  }

  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  clearHistory() {
    this.history = [];
    this.loopDetection.clear();
  }

  enable() {
    this.enabled = true;
    localStorage.setItem('DEBUG_MODE', 'true');
    console.log('🐛 Debug mode enabled');
  }

  disable() {
    this.enabled = false;
    localStorage.removeItem('DEBUG_MODE');
    console.log('🐛 Debug mode disabled');
  }

  measurePerformance<T>(component: string, action: string, fn: () => T): T {
    if (!this.enabled) return fn();

    const start = performance.now();
    this.log(component, `${action}:START`);

    try {
      const result = fn();
      const duration = performance.now() - start;

      this.log(component, `${action}:END`, { duration: `${duration.toFixed(2)}ms` });

      if (duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${component}.${action} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.log(component, `${action}:ERROR`, { error, duration: `${duration.toFixed(2)}ms` });
      throw error;
    }
  }

  async measurePerformanceAsync<T>(
    component: string,
    action: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) return fn();

    const start = performance.now();
    this.log(component, `${action}:START`);

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.log(component, `${action}:END`, { duration: `${duration.toFixed(2)}ms` });

      if (duration > 2000) {
        console.warn(`⚠️ Slow async operation: ${component}.${action} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.log(component, `${action}:ERROR`, { error, duration: `${duration.toFixed(2)}ms` });
      throw error;
    }
  }

  trackRender(componentName: string) {
    this.log('RENDER', componentName);
  }

  trackEffect(componentName: string, dependencies: any[]) {
    this.log('EFFECT', componentName, { deps: dependencies });
  }

  trackSubscription(service: string, channelName: string, action: 'SUBSCRIBE' | 'UNSUBSCRIBE') {
    this.log('SUBSCRIPTION', `${service}:${channelName}`, { action });
  }

  trackAuth(action: string, data?: any) {
    this.log('AUTH', action, data);
  }

  trackDatabase(table: string, operation: string, data?: any) {
    this.log('DATABASE', `${table}:${operation}`, data);
  }

  getStats() {
    const componentCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    this.history.forEach(entry => {
      componentCounts[entry.component] = (componentCounts[entry.component] || 0) + 1;
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    });

    return {
      totalEvents: this.history.length,
      componentCounts,
      actionCounts,
      potentialLoops: Array.from(this.loopDetection.entries())
        .filter(([, v]) => v.count > 5)
        .map(([k, v]) => ({ key: k, count: v.count }))
    };
  }

  printStats() {
    const stats = this.getStats();
    console.group('📊 Debug Statistics');
    console.log('Total Events:', stats.totalEvents);
    console.log('Component Activity:', stats.componentCounts);
    console.log('Action Frequency:', stats.actionCounts);
    if (stats.potentialLoops.length > 0) {
      console.warn('⚠️ Potential Loops:', stats.potentialLoops);
    }
    console.groupEnd();
  }
}

export const debugSystem = new DebugSystem();

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugSystem = debugSystem;
}

// Helper hooks for React components
export const useDebugRender = (componentName: string) => {
  if (import.meta.env.DEV) {
    debugSystem.trackRender(componentName);
  }
};

export const useDebugEffect = (componentName: string, dependencies: any[]) => {
  if (import.meta.env.DEV) {
    debugSystem.trackEffect(componentName, dependencies);
  }
};
