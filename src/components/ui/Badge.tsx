import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Circle } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  /** Show status icon alongside text for accessibility (not relying only on color) */
  showIcon?: boolean;
  /** Custom icon to display */
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  showIcon = false,
  icon
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const iconSize = size === 'sm' ? 12 : 14;

  // Default icons for each variant to provide visual indication beyond color
  const defaultIcons: Record<string, React.ReactNode> = {
    default: <Circle size={iconSize} aria-hidden="true" />,
    success: <CheckCircle size={iconSize} aria-hidden="true" />,
    warning: <AlertTriangle size={iconSize} aria-hidden="true" />,
    danger: <XCircle size={iconSize} aria-hidden="true" />,
    info: <Info size={iconSize} aria-hidden="true" />
  };

  const displayIcon = icon || (showIcon ? defaultIcons[variant] : null);

  return (
    <span 
      className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      role="status"
    >
      {displayIcon}
      {children}
    </span>
  );
};