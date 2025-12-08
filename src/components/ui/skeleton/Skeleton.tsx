import React from 'react';

export interface SkeletonProps {
  /** Largura do skeleton */
  width?: string | number;
  /** Altura do skeleton */
  height?: string | number;
  /** Se é circular */
  circle?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Se deve animar */
  animate?: boolean;
  /** Número de linhas (para texto) */
  lines?: number;
  /** Se é a última linha (menor largura) */
  lastLineShorter?: boolean;
  /** aria-label para acessibilidade */
  'aria-label'?: string;
}

/**
 * Componente base de Skeleton para loading states
 * Implementa aria-busy para acessibilidade
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  circle = false,
  className = '',
  animate = true,
  lines,
  lastLineShorter = true,
  'aria-label': ariaLabel = 'Carregando...',
}) => {
  const baseClasses = `
    bg-slate-200 
    ${animate ? 'animate-pulse' : ''} 
    ${circle ? 'rounded-full' : 'rounded'}
  `;

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  // Renderizar múltiplas linhas de texto
  if (lines && lines > 1) {
    return (
      <div 
        className={`space-y-2 ${className}`} 
        role="status" 
        aria-busy="true"
        aria-label={ariaLabel}
      >
        {Array.from({ length: lines }).map((_, index) => {
          const isLast = index === lines - 1;
          const lineWidth = isLast && lastLineShorter ? '60%' : '100%';
          
          return (
            <div
              key={index}
              className={`${baseClasses} h-4`}
              style={{ width: lineWidth }}
            />
          );
        })}
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

/**
 * Skeleton para texto (uma linha)
 */
export const SkeletonText: React.FC<{
  width?: string | number;
  className?: string;
}> = ({ width = '100%', className = '' }) => (
  <Skeleton 
    width={width} 
    height={16} 
    className={className}
    aria-label="Carregando texto..."
  />
);

/**
 * Skeleton para título/heading
 */
export const SkeletonTitle: React.FC<{
  width?: string | number;
  className?: string;
}> = ({ width = '200px', className = '' }) => (
  <Skeleton 
    width={width} 
    height={24} 
    className={className}
    aria-label="Carregando título..."
  />
);

/**
 * Skeleton para avatar circular
 */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
  };
  
  const dimension = typeof size === 'number' ? size : sizes[size];
  
  return (
    <Skeleton 
      width={dimension} 
      height={dimension} 
      circle 
      className={className}
      aria-label="Carregando avatar..."
    />
  );
};

/**
 * Skeleton para botão
 */
export const SkeletonButton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  className?: string;
}> = ({ size = 'md', width, className = '' }) => {
  const heights = {
    sm: 36,
    md: 44,
    lg: 52,
  };
  
  return (
    <Skeleton 
      width={width || 100} 
      height={heights[size]} 
      className={`rounded-lg ${className}`}
      aria-label="Carregando botão..."
    />
  );
};

/**
 * Skeleton para badge
 */
export const SkeletonBadge: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <Skeleton 
    width={60} 
    height={24} 
    className={`rounded-full ${className}`}
    aria-label="Carregando badge..."
  />
);

/**
 * Skeleton para imagem
 */
export const SkeletonImage: React.FC<{
  width?: string | number;
  height?: string | number;
  aspectRatio?: '1:1' | '16:9' | '4:3';
  className?: string;
}> = ({ width = '100%', height, aspectRatio, className = '' }) => {
  const aspectRatioClass = aspectRatio ? {
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
  }[aspectRatio] : '';

  return (
    <Skeleton 
      width={width} 
      height={aspectRatio ? undefined : (height || 200)} 
      className={`${aspectRatioClass} ${className}`}
      aria-label="Carregando imagem..."
    />
  );
};

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';
SkeletonTitle.displayName = 'SkeletonTitle';
SkeletonAvatar.displayName = 'SkeletonAvatar';
SkeletonButton.displayName = 'SkeletonButton';
SkeletonBadge.displayName = 'SkeletonBadge';
SkeletonImage.displayName = 'SkeletonImage';
