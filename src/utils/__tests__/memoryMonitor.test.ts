import { memoryMonitor, isMemoryMonitoringAvailable } from '../memoryMonitor';

// Mock performance.memory for testing
const mockMemory = {
  usedJSHeapSize: 1000000,
  totalJSHeapSize: 2000000,
  jsHeapSizeLimit: 4000000
};

// Mock performance object
Object.defineProperty(global, 'performance', {
  value: {
    memory: mockMemory
  },
  writable: true
});

// Mock import.meta.env.DEV
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: true
      }
    }
  },
  writable: true
});

describe('MemoryMonitor', () => {
  beforeEach(() => {
    // Clear stats before each test
    memoryMonitor.clearStats();
  });

  describe('isMemoryMonitoringAvailable', () => {
    it('should return true in development environment', () => {
      expect(isMemoryMonitoringAvailable()).toBe(true);
    });
  });

  describe('getMemoryInfo', () => {
    it('should return memory information when available', () => {
      const memoryInfo = memoryMonitor.getMemoryInfo();
      
      expect(memoryInfo).toEqual({
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      });
    });
  });

  describe('logMemoryUsage', () => {
    it('should log memory usage and store stats', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      memoryMonitor.logMemoryUsage('TestComponent', 'Test Action');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧠 Memory [TestComponent] Test Action:'),
        expect.objectContaining({
          used: expect.any(String),
          total: expect.any(String),
          limit: expect.any(String),
          usage: expect.any(String)
        })
      );
      
      const stats = memoryMonitor.getStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].component).toBe('TestComponent');
      expect(stats[0].action).toBe('Test Action');
      
      consoleSpy.mockRestore();
    });
  });

  describe('startMemoryMonitoring', () => {
    it('should start periodic monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.useFakeTimers();
      
      memoryMonitor.startMemoryMonitoring(1000);
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      expect(consoleSpy).toHaveBeenCalledWith('🧠 Memory monitoring started');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧠 Memory [System] Periodic Check:')
      );
      
      memoryMonitor.stopMemoryMonitoring();
      jest.useRealTimers();
      consoleSpy.mockRestore();
    });
  });

  describe('stopMemoryMonitoring', () => {
    it('should stop periodic monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      memoryMonitor.startMemoryMonitoring(1000);
      memoryMonitor.stopMemoryMonitoring();
      
      expect(consoleSpy).toHaveBeenCalledWith('🧠 Memory monitoring stopped');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getMemorySummary', () => {
    it('should return memory usage summary', () => {
      // Add some test data
      memoryMonitor.logMemoryUsage('TestComponent', 'Action 1');
      memoryMonitor.logMemoryUsage('TestComponent', 'Action 2');
      
      const summary = memoryMonitor.getMemorySummary();
      
      expect(summary.current).toEqual({
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      });
      expect(summary.peak).toBe(1000000);
      expect(summary.average).toBe(1000000);
      expect(summary.samples).toBe(2);
    });
  });

  describe('clearStats', () => {
    it('should clear all statistics', () => {
      memoryMonitor.logMemoryUsage('TestComponent', 'Test Action');
      expect(memoryMonitor.getStats()).toHaveLength(1);
      
      memoryMonitor.clearStats();
      expect(memoryMonitor.getStats()).toHaveLength(0);
    });
  });
});