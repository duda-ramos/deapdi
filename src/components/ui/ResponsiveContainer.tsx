import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const responsiveClass = isMobile ? mobileClassName : 
                         isTablet ? tabletClassName : 
                         isDesktop ? desktopClassName : '';

  return (
    <div className={`${className} ${responsiveClass}`}>
      {children}
    </div>
  );
};

// Debug component for responsive testing
export const ResponsiveDebugger: React.FC = () => {
  const responsive = useResponsive();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded-lg text-xs z-50">
      <div>Screen: {responsive.width}x{responsive.height}</div>
      <div>Breakpoint: {responsive.breakpoint}</div>
      <div>Type: {responsive.isMobile ? 'Mobile' : responsive.isTablet ? 'Tablet' : 'Desktop'}</div>
    </div>
  );
};