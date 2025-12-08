import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonText, SkeletonBadge } from './Skeleton';

export interface ListSkeletonProps {
  /** Número de itens */
  count?: number;
  /** Variante do item */
  variant?: 'simple' | 'detailed' | 'action' | 'notification' | 'task' | 'timeline';
  /** Se deve mostrar avatar */
  showAvatar?: boolean;
  /** Se deve mostrar checkbox */
  showCheckbox?: boolean;
  /** Se deve mostrar ações */
  showActions?: boolean;
  /** Se deve mostrar divisores */
  showDividers?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Skeleton para Listas - usado em listas de ações, tarefas, notificações
 */
export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  variant = 'simple',
  showAvatar = false,
  showCheckbox = false,
  showActions = false,
  showDividers = true,
  className = '',
}) => {
  const renderItem = (index: number) => {
    const isLast = index === count - 1;
    
    // Item simples
    if (variant === 'simple') {
      return (
        <div className={`py-3 ${showDividers && !isLast ? 'border-b border-slate-100' : ''}`}>
          <div className="flex items-center gap-3">
            {showCheckbox && <Skeleton width={18} height={18} className="rounded flex-shrink-0" />}
            {showAvatar && <SkeletonAvatar size="sm" />}
            <div className="flex-1 min-w-0">
              <SkeletonText width="70%" />
            </div>
            {showActions && (
              <div className="flex gap-1">
                <Skeleton width={24} height={24} className="rounded" />
                <Skeleton width={24} height={24} className="rounded" />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Item detalhado (com descrição)
    if (variant === 'detailed') {
      return (
        <div className={`py-4 ${showDividers && !isLast ? 'border-b border-slate-100' : ''}`}>
          <div className="flex items-start gap-3">
            {showCheckbox && <Skeleton width={18} height={18} className="rounded flex-shrink-0 mt-1" />}
            {showAvatar && <SkeletonAvatar size="md" />}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <SkeletonText width="60%" />
                <SkeletonBadge />
              </div>
              <SkeletonText width="90%" />
              <SkeletonText width="40%" />
            </div>
            {showActions && (
              <div className="flex gap-1 flex-shrink-0">
                <Skeleton width={28} height={28} className="rounded" />
                <Skeleton width={28} height={28} className="rounded" />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Item de ação (PDI action)
    if (variant === 'action') {
      return (
        <div className={`py-4 ${showDividers && !isLast ? 'border-b border-slate-100' : ''}`}>
          <div className="flex items-start gap-3">
            <Skeleton width={18} height={18} className="rounded flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0 space-y-2">
              <SkeletonText width="80%" />
              <div className="flex items-center gap-4">
                <SkeletonText width="80px" />
                <SkeletonText width="100px" />
              </div>
            </div>
            <SkeletonBadge />
          </div>
        </div>
      );
    }

    // Notificação
    if (variant === 'notification') {
      return (
        <div className={`py-4 ${showDividers && !isLast ? 'border-b border-slate-100' : ''}`}>
          <div className="flex items-start gap-3">
            <Skeleton width={40} height={40} className="rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <SkeletonText width="90%" />
              <div className="flex items-center gap-2">
                <SkeletonText width="60px" />
                <Skeleton width={4} height={4} circle />
                <SkeletonText width="80px" />
              </div>
            </div>
            <Skeleton width={8} height={8} circle className="flex-shrink-0" />
          </div>
        </div>
      );
    }

    // Tarefa
    if (variant === 'task') {
      return (
        <div className={`py-3 ${showDividers && !isLast ? 'border-b border-slate-100' : ''}`}>
          <div className="flex items-center gap-3">
            <Skeleton width={20} height={20} className="rounded flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <SkeletonText width="75%" />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <SkeletonText width="60px" />
              <SkeletonBadge />
            </div>
          </div>
        </div>
      );
    }

    // Timeline
    if (variant === 'timeline') {
      return (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton width={12} height={12} circle />
            {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-2" />}
          </div>
          <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SkeletonText width="120px" />
                <SkeletonText width="80px" />
              </div>
              <SkeletonText width="90%" />
              <SkeletonText width="60%" />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      className={className}
      role="status"
      aria-busy="true"
      aria-label={`Carregando ${count} itens...`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderItem(index)}
        </React.Fragment>
      ))}
      <span className="sr-only">Carregando lista...</span>
    </div>
  );
};

/**
 * Skeleton para lista de ações do PDI
 */
export const ActionListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 5, className = '' }) => (
  <ListSkeleton 
    count={count} 
    variant="action" 
    showDividers={true}
    className={className}
  />
);

/**
 * Skeleton para lista de notificações
 */
export const NotificationListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 5, className = '' }) => (
  <ListSkeleton 
    count={count} 
    variant="notification" 
    showDividers={true}
    className={className}
  />
);

/**
 * Skeleton para lista de tarefas
 */
export const TaskListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 5, className = '' }) => (
  <ListSkeleton 
    count={count} 
    variant="task" 
    showDividers={true}
    className={className}
  />
);

/**
 * Skeleton para timeline
 */
export const TimelineSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className = '' }) => (
  <ListSkeleton 
    count={count} 
    variant="timeline" 
    showDividers={false}
    className={className}
  />
);

ListSkeleton.displayName = 'ListSkeleton';
ActionListSkeleton.displayName = 'ActionListSkeleton';
NotificationListSkeleton.displayName = 'NotificationListSkeleton';
TaskListSkeleton.displayName = 'TaskListSkeleton';
TimelineSkeleton.displayName = 'TimelineSkeleton';
