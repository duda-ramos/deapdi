/**
 * Responsive utilities and breakpoint management
 */

import { breakpoints, type Breakpoint } from '../hooks/useResponsive';

export const responsive = {
  // Test different screen sizes programmatically
  testBreakpoint: (breakpoint: Breakpoint) => {
    const width = breakpoints[breakpoint];
    
    // Simulate screen size change
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: Math.round(width * 0.6), // 16:10 aspect ratio
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    console.log(`📱 Responsive Test: Simulated ${breakpoint} (${width}px)`);
  },

  // Get responsive classes for common patterns
  getGridCols: (mobile: number, tablet: number, desktop: number) => 
    `grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`,
  
  getSpacing: (mobile: string, desktop: string) => 
    `${mobile} lg:${desktop}`,
  
  getTextSize: (mobile: string, desktop: string) => 
    `${mobile} lg:${desktop}`,

  // Common responsive patterns
  patterns: {
    cardGrid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    statsGrid: 'grid-cols-2 md:grid-cols-4',
    formGrid: 'grid-cols-1 md:grid-cols-2',
    spacing: 'space-y-4 md:space-y-6',
    padding: 'p-4 md:p-6',
    text: 'text-sm md:text-base',
    heading: 'text-xl md:text-2xl'
  }
};