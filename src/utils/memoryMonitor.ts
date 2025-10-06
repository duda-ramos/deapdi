/**
 * Memory monitoring utilities for development
 * Helps detect memory leaks and performance issues
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryStats {
  timestamp: number;
  memory: MemoryInfo | null;
  component: string;
  action: string;
}

class MemoryMonitor {
  private stats: MemoryStats[] = [];
  private isEnabled: boolean;
  private maxStats: number = 1000;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.isEnabled = import.meta.env.DEV && 'memory' in performance;
  }

  /**
   * Get current memory usage
   */
  getMemoryInfo(): MemoryInfo | null {
    if (!this.isEnabled || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }

  /**
   * Log memory usage for a specific component and action
   */
  logMemoryUsage(component: string, action: string): void {
    if (!this.isEnabled) return;

    const memory = this.getMemoryInfo();
    const stats: MemoryStats = {
      timestamp: Date.now(),
      memory,
      component,
      action
    };

    this.stats.push(stats);

    // Keep only the last maxStats entries
    if (this.stats.length > this.maxStats) {
      this.stats = this.stats.slice(-this.maxStats);
    }

    // Log to console in development
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      console.log(`🧠 Memory [${component}] ${action}:`, {
        used: `${usedMB}MB`,
        total: `${totalMB}MB`,
        limit: `${limitMB}MB`,
        usage: `${Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%`
      });
    }
  }

  /**
   * Start periodic memory monitoring
   */
  startMemoryMonitoring(intervalMs: number = 30000): void {
    if (!this.isEnabled || this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.logMemoryUsage('System', 'Periodic Check');
      
      // Check for potential memory leaks
      this.checkForMemoryLeaks();
    }, intervalMs);

    console.log('🧠 Memory monitoring started');
  }

  /**
   * Stop periodic memory monitoring
   */
  stopMemoryMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧠 Memory monitoring stopped');
    }
  }

  /**
   * Check for potential memory leaks
   */
  private checkForMemoryLeaks(): void {
    if (this.stats.length < 10) return;

    const recent = this.stats.slice(-10);
    const memoryValues = recent
      .map(s => s.memory?.usedJSHeapSize)
      .filter((v): v is number => v !== null);

    if (memoryValues.length < 5) return;

    // Check if memory usage is consistently increasing
    const isIncreasing = memoryValues.every((val, index) => 
      index === 0 || val >= memoryValues[index - 1]
    );

    // Check if memory usage is growing significantly
    const firstValue = memoryValues[0];
    const lastValue = memoryValues[memoryValues.length - 1];
    const growthPercent = ((lastValue - firstValue) / firstValue) * 100;

    if (isIncreasing && growthPercent > 20) {
      console.warn('⚠️ Potential memory leak detected:', {
        growth: `${growthPercent.toFixed(1)}%`,
        first: `${Math.round(firstValue / 1024 / 1024)}MB`,
        last: `${Math.round(lastValue / 1024 / 1024)}MB`
      });
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats[] {
    return [...this.stats];
  }

  /**
   * Clear memory statistics
   */
  clearStats(): void {
    this.stats = [];
  }

  /**
   * Get memory usage summary
   */
  getMemorySummary(): {
    current: MemoryInfo | null;
    peak: number;
    average: number;
    samples: number;
  } {
    const current = this.getMemoryInfo();
    const memoryValues = this.stats
      .map(s => s.memory?.usedJSHeapSize)
      .filter((v): v is number => v !== null);

    return {
      current,
      peak: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      average: memoryValues.length > 0 ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length : 0,
      samples: memoryValues.length
    };
  }
}

// Create singleton instance
export const memoryMonitor = new MemoryMonitor();

/**
 * Hook for monitoring memory usage in components
 */
export const useMemoryMonitor = (componentName: string) => {
  const logMemory = (action: string) => {
    memoryMonitor.logMemoryUsage(componentName, action);
  };

  return { logMemory };
};

/**
 * Utility function to check if memory monitoring is available
 */
export const isMemoryMonitoringAvailable = (): boolean => {
  return import.meta.env.DEV && 'memory' in performance;
};