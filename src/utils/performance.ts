/**
 * Performance monitoring utilities
 */

export const performance = {
  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    if (import.meta.env.DEV) {
      const start = Date.now();
      renderFn();
      const end = Date.now();
      console.log(`🚀 Performance: ${componentName} rendered in ${end - start}ms`);
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
      
      if (import.meta.env.DEV) {
        console.log(`🚀 Performance: ${operation} completed in ${end - start}ms`);
      }
      
      // Track slow operations in production
      if (import.meta.env.PROD && end - start > 3000) {
        console.warn(`Slow operation detected: ${operation} took ${end - start}ms`);
      }
      
      return result;
    } catch (error) {
      const end = Date.now();
      console.error(`❌ Performance: ${operation} failed after ${end - start}ms`, error);
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
  }
};

/**
 * Memory usage monitoring
 */
export const memoryMonitor = {
  logMemoryUsage(context: string) {
    if (import.meta.env.DEV && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`💾 Memory (${context}):`, {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
      });
    }
  }
};