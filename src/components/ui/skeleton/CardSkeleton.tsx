import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonText, SkeletonTitle, SkeletonBadge } from './Skeleton';

export interface CardSkeletonProps {
  /** Variante do card */
  variant?: 'simple' | 'detailed' | 'compact' | 'dashboard' | 'pdi' | 'user';
  /** Se deve mostrar avatar */
  showAvatar?: boolean;
  /** Se deve mostrar ações */
  showActions?: boolean;
  /** Número de linhas de descrição */
  descriptionLines?: number;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Skeleton para Cards - usado em listas de PDIs, competências, etc.
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  variant = 'simple',
  showAvatar = false,
  showActions = false,
  descriptionLines = 2,
  className = '',
}) => {
  // Card simples (título + descrição)
  if (variant === 'simple') {
    return (
      <div 
        className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Carregando card..."
      >
        <div className="space-y-4">
          <SkeletonTitle width="70%" />
          <Skeleton lines={descriptionLines} />
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Skeleton width={80} height={36} className="rounded-lg" />
              <Skeleton width={80} height={36} className="rounded-lg" />
            </div>
          )}
        </div>
        <span className="sr-only">Carregando card...</span>
      </div>
    );
  }

  // Card detalhado (com avatar, badge, métricas)
  if (variant === 'detailed') {
    return (
      <div 
        className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Carregando card detalhado..."
      >
        <div className="flex items-start gap-4">
          {showAvatar && <SkeletonAvatar size="lg" />}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonTitle width="60%" />
              <SkeletonBadge />
            </div>
            <Skeleton lines={descriptionLines} />
            <div className="flex items-center gap-4 pt-2">
              <Skeleton width={100} height={20} />
              <Skeleton width={100} height={20} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
        </div>
        <span className="sr-only">Carregando card detalhado...</span>
      </div>
    );
  }

  // Card compacto (para listas densas)
  if (variant === 'compact') {
    return (
      <div 
        className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Carregando item..."
      >
        <div className="flex items-center gap-3">
          {showAvatar && <SkeletonAvatar size="sm" />}
          <div className="flex-1">
            <SkeletonText width="60%" />
          </div>
          {showActions && <Skeleton width={24} height={24} />}
        </div>
        <span className="sr-only">Carregando item...</span>
      </div>
    );
  }

  // Card dashboard (métricas)
  if (variant === 'dashboard') {
    return (
      <div 
        className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Carregando métricas..."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonText width="50%" />
            <Skeleton width={32} height={32} className="rounded-lg" />
          </div>
          <Skeleton width="40%" height={32} />
          <div className="flex items-center gap-2">
            <Skeleton width={60} height={20} />
            <SkeletonText width="30%" />
          </div>
        </div>
        <span className="sr-only">Carregando métricas...</span>
      </div>
    );
  }

  // Card PDI (específico para lista de PDIs)
  if (variant === 'pdi') {
    return (
      <div 
        className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Carregando PDI..."
      >
        <div className="flex items-start gap-4">
          <SkeletonAvatar size="lg" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SkeletonTitle width="180px" />
                <SkeletonText width="120px" />
              </div>
              <SkeletonBadge />
            </div>
            
            {/* Progress bar */}
            <Skeleton width="100%" height={8} className="rounded-full" />
            
            {/* Competências */}
            <div className="flex flex-wrap gap-2">
              <Skeleton width={80} height={24} className="rounded-full" />
              <Skeleton width={100} height={24} className="rounded-full" />
              <Skeleton width={70} height={24} className="rounded-full" />
            </div>
            
            {/* Meta/deadline */}
            <div className="flex items-center justify-between pt-2">
              <SkeletonText width="100px" />
              <div className="flex gap-2">
                <Skeleton width={32} height={32} className="rounded-lg" />
                <Skeleton width={32} height={32} className="rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        <span className="sr-only">Carregando PDI...</span>
      </div>
    );
  }

  // Card de usuário
  if (variant === 'user') {
    return (
      <div 
        className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Carregando usuário..."
      >
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="lg" />
          <div className="flex-1 space-y-2">
            <SkeletonTitle width="150px" />
            <SkeletonText width="200px" />
            <div className="flex gap-2 pt-1">
              <SkeletonBadge />
              <SkeletonBadge />
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Skeleton width={32} height={32} className="rounded-lg" />
              <Skeleton width={32} height={32} className="rounded-lg" />
            </div>
          )}
        </div>
        <span className="sr-only">Carregando usuário...</span>
      </div>
    );
  }

  return null;
};

/**
 * Grid de CardSkeletons para listas
 */
export const CardSkeletonGrid: React.FC<{
  count?: number;
  variant?: CardSkeletonProps['variant'];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ count = 3, variant = 'simple', columns = 1, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div 
      className={`grid ${gridCols[columns]} gap-4 ${className}`}
      role="status"
      aria-busy="true"
      aria-label={`Carregando ${count} itens...`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
};

CardSkeleton.displayName = 'CardSkeleton';
CardSkeletonGrid.displayName = 'CardSkeletonGrid';
