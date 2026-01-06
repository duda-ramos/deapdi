import React, { useCallback, useMemo } from 'react';

// Performance monitoring utility
export const performance = {
  now: () => {
    return window.performance ? window.performance.now() : Date.now();
  },
  mark: (name: string) => {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  },
  measure: (name: string, startMark: string, endMark: string) => {
    if (window.performance && window.performance.measure) {
      window.performance.measure(name, startMark, endMark);
    }
  },
  clearMarks: () => {
    if (window.performance && window.performance.clearMarks) {
      window.performance.clearMarks();
    }
  },
  clearMeasures: () => {
    if (window.performance && window.performance.clearMeasures) {
      window.performance.clearMeasures();
    }
  },
  monitorWebVitals: () => {
    if (typeof window === 'undefined') return;

    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const reportMetric = (metric: { name: string; value: number; id: string }) => {
        if (import.meta.env.DEV) {
          console.log(`[Web Vitals] ${metric.name}`, metric);
        }
      };

      onCLS(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onFCP(reportMetric);
      onTTFB(reportMetric);
    }).catch(() => {
      // Ignore web-vitals load errors to avoid breaking the app shell.
    });
  }
};

// Debounce hook for search inputs
export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized search function
export const useMemoizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(lowerSearchTerm);
      })
    );
  }, [items, searchTerm, searchFields]);
};

// Memoized filter function
export const useMemoizedFilter = <T>(
  items: T[],
  filters: Record<string, any>
) => {
  return useMemo(() => {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === 'all' || value === null || value === undefined) return true;
        return item[key as keyof T] === value;
      });
    });
  }, [items, filters]);
};

// Memoized sort function
export const useMemoizedSort = <T>(
  items: T[],
  sortKey: keyof T,
  sortDirection: 'asc' | 'desc' = 'asc'
) => {
  return useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortKey, sortDirection]);
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, scrollTop, itemHeight, containerHeight]);

  const totalHeight = items.length * itemHeight;
  const offsetY = scrollTop;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return { imageSrc, isLoaded };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = React.useRef(0);
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  });

  return { renderCount: renderCount.current };
};

// Memoized callback hook
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Batch state updates hook
export const useBatchedState = <T>(initialState: T) => {
  const [state, setState] = React.useState(initialState);
  const batchRef = React.useRef<(Partial<T> | ((prev: T) => T))[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const batchedSetState = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    batchRef.current.push(updates);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const finalState = batchRef.current.reduce<T>((acc, update) => {
        if (typeof update === 'function') {
          return (update as (prev: T) => T)(acc);
        } else {
          return { ...acc, ...update };
        }
      }, state);
      
      setState(finalState);
      batchRef.current = [];
    }, 0);
  }, [state]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState] as const;
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = React.useState<any>(null);

  React.useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Component visibility hook for intersection observer
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Data pagination hook
export const usePagination = <T>(
  items: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// Cache management hook
export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const cacheRef = React.useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const getCachedData = useCallback(() => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, [key, ttl]);

  const fetchData = useCallback(async () => {
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, getCachedData]);

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key);
    setData(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache,
    getCachedData
  };
};
