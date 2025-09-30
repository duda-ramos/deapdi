/**
 * Performance monitoring utilities
 */

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 100, // ms
  SLOW_API: 3000, // ms
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
  BUNDLE_WARNING: 1000 * 1024 // 1MB
};
export const performance = {
  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    if (import.meta.env.DEV) {
      const start = Date.now();
      renderFn();
      const end = Date.now();
      const duration = end - start;
      
      if (duration > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
        console.warn(`🐌 Performance: Slow render detected - ${componentName} took ${duration}ms`);
      } else {
        console.log(`🚀 Performance: ${componentName} rendered in ${duration}ms`);
      }
    } else {
      renderFn();
    }
  },

  // Measure API call time
  async measureApiCall<T>(
    operation: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await apiCall();
      const end = Date.now();
      const duration = end - start;
      
      if (import.meta.env.DEV) {
        if (duration > PERFORMANCE_THRESHOLDS.SLOW_API) {
          console.warn(`🐌 Performance: Slow API call - ${operation} took ${duration}ms`);
        } else {
          console.log(`🚀 Performance: ${operation} completed in ${duration}ms`);
        }
      }
      
      // Track slow operations in production
      if (import.meta.env.PROD && duration > PERFORMANCE_THRESHOLDS.SLOW_API) {
        // Send to monitoring service
        if (window.gtag) {
          window.gtag('event', 'slow_api_call', {
            event_category: 'performance',
            event_label: operation,
            value: duration
          });
        }
      }
      
      return result;
    } catch (error) {
      const end = Date.now();
      const duration = end - start;
      console.error(`❌ Performance: ${operation} failed after ${duration}ms`, error);
      
      // Track failed operations in production
      if (import.meta.env.PROD && window.gtag) {
        window.gtag('event', 'api_call_failed', {
          event_category: 'error',
          event_label: operation,
          value: duration
        });
      }
      
      throw error;
    }
  },

  // Debounce function for search inputs
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Lazy load images
  lazyLoadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  },

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (import.meta.env.PROD && 'web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.sendToAnalytics);
        getFID(this.sendToAnalytics);
        getFCP(this.sendToAnalytics);
        getLCP(this.sendToAnalytics);
        getTTFB(this.sendToAnalytics);
      }).catch(() => {
        // Silently fail if web-vitals is not available
      });
    }
  },

  sendToAnalytics(metric: any) {
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  }
};

/**
 * Memory usage monitoring
 */
let memoryMonitorInterval: NodeJS.Timeout | null = null;
let isMemoryMonitorRunning = false;

export const memoryMonitor = {
  logMemoryUsage(context: string) {
    if (import.meta.env.DEV && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

      console.log(`💾 Memory (${context}):`, {
        used: `${usedMB}MB`,
        total: `${totalMB}MB`,
        limit: `${limitMB}MB`
      });

      // Warn about high memory usage
      if (memory.usedJSHeapSize > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
        console.warn(`🚨 Memory: High memory usage detected - ${usedMB}MB used`);
      }
    }
  },

  startMemoryMonitoring() {
    // Prevent multiple monitoring instances
    if (isMemoryMonitorRunning) {
      console.warn('💾 Memory monitor already running');
      return;
    }

    if (import.meta.env.DEV) {
      isMemoryMonitorRunning = true;
      memoryMonitorInterval = setInterval(() => {
        this.logMemoryUsage('periodic-check');
      }, 30000); // Check every 30 seconds
      console.log('💾 Memory monitoring started');
    }
  },

  stopMemoryMonitoring() {
    if (memoryMonitorInterval) {
      clearInterval(memoryMonitorInterval);
      memoryMonitorInterval = null;
      isMemoryMonitorRunning = false;
      console.log('💾 Memory monitoring stopped');
    }
  }
};