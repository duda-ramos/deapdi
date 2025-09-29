/**
 * Responsive utilities and breakpoint management
 */

import React from 'react';

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState<{
    width: number;
    height: number;
    breakpoint: Breakpoint;
  }>({
    width: window.innerWidth,
    height: window.innerHeight,
    breakpoint: getCurrentBreakpoint(window.innerWidth)
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getCurrentBreakpoint(width);
      
      setScreenSize({ width, height, breakpoint });
      
      // Log for responsive testing
      if (import.meta.env.DEV) {
        console.log(`📱 Responsive: ${width}x${height} (${breakpoint})`);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...screenSize,
    isMobile: screenSize.width < breakpoints.md,
    isTablet: screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg,
    isDesktop: screenSize.width >= breakpoints.lg,
    isSmallScreen: screenSize.width < breakpoints.lg
  };
};

function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}

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