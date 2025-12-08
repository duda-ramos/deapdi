import React from 'react';
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonBadge } from './Skeleton';

export interface TableSkeletonProps {
  /** Número de linhas */
  rows?: number;
  /** Número de colunas */
  columns?: number;
  /** Se deve mostrar header */
  showHeader?: boolean;
  /** Se deve mostrar checkbox de seleção */
  showCheckbox?: boolean;
  /** Se deve mostrar avatar na primeira coluna */
  showAvatar?: boolean;
  /** Se deve mostrar coluna de ações */
  showActions?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Configuração das colunas */
  columnConfig?: Array<{
    width?: string;
    type?: 'text' | 'avatar' | 'badge' | 'actions' | 'checkbox';
  }>;
}

/**
 * Skeleton para Tabelas - usado em listas de usuários, logs, etc.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  showCheckbox = false,
  showAvatar = false,
  showActions = false,
  className = '',
  columnConfig,
}) => {
  // Calcular número total de colunas
  const totalColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0);
  
  // Gerar configuração de colunas se não fornecida
  const cols = columnConfig || Array.from({ length: columns }).map((_, i) => ({
    width: i === 0 ? '30%' : '20%',
    type: i === 0 && showAvatar ? 'avatar' : 'text' as const,
  }));

  const renderCell = (colConfig: { width?: string; type?: string }, index: number) => {
    switch (colConfig.type) {
      case 'avatar':
        return (
          <div className="flex items-center gap-3">
            <SkeletonAvatar size="sm" />
            <div className="space-y-1">
              <SkeletonText width="120px" />
              <SkeletonText width="80px" />
            </div>
          </div>
        );
      case 'badge':
        return <SkeletonBadge />;
      case 'actions':
        return (
          <div className="flex gap-2 justify-end">
            <Skeleton width={28} height={28} className="rounded" />
            <Skeleton width={28} height={28} className="rounded" />
          </div>
        );
      case 'checkbox':
        return <Skeleton width={18} height={18} className="rounded" />;
      default:
        return <SkeletonText width={colConfig.width || '100%'} />;
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Carregando tabela..."
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          {showHeader && (
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {showCheckbox && (
                  <th className="px-4 py-3 text-left w-12">
                    <Skeleton width={18} height={18} className="rounded" />
                  </th>
                )}
                {cols.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <SkeletonText width="60%" />
                  </th>
                ))}
                {showActions && (
                  <th className="px-4 py-3 text-right w-24">
                    <SkeletonText width="50px" />
                  </th>
                )}
              </tr>
            </thead>
          )}
          
          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50">
                {showCheckbox && (
                  <td className="px-4 py-4">
                    <Skeleton width={18} height={18} className="rounded" />
                  </td>
                )}
                {cols.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-4">
                    {renderCell(col, colIndex)}
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-4">
                    <div className="flex gap-2 justify-end">
                      <Skeleton width={28} height={28} className="rounded" />
                      <Skeleton width={28} height={28} className="rounded" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <SkeletonText width="150px" />
        <div className="flex items-center gap-2">
          <Skeleton width={32} height={32} className="rounded" />
          <Skeleton width={32} height={32} className="rounded" />
          <Skeleton width={32} height={32} className="rounded" />
          <Skeleton width={32} height={32} className="rounded" />
        </div>
      </div>
      
      <span className="sr-only">Carregando tabela...</span>
    </div>
  );
};

/**
 * Skeleton para tabela simples (sem header elaborado)
 */
export const SimpleTableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 3, className = '' }) => (
  <div 
    className={`space-y-2 ${className}`}
    role="status"
    aria-busy="true"
    aria-label="Carregando lista..."
  >
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div 
        key={rowIndex} 
        className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonText 
            key={colIndex} 
            width={colIndex === 0 ? '40%' : '20%'} 
          />
        ))}
      </div>
    ))}
    <span className="sr-only">Carregando lista...</span>
  </div>
);

/**
 * Skeleton para tabela de usuários
 */
export const UserTableSkeleton: React.FC<{
  rows?: number;
  className?: string;
}> = ({ rows = 5, className = '' }) => (
  <TableSkeleton
    rows={rows}
    showHeader={true}
    showCheckbox={true}
    showActions={true}
    columnConfig={[
      { type: 'avatar', width: '30%' },
      { type: 'text', width: '20%' },
      { type: 'badge', width: '15%' },
      { type: 'text', width: '15%' },
    ]}
    className={className}
  />
);

TableSkeleton.displayName = 'TableSkeleton';
SimpleTableSkeleton.displayName = 'SimpleTableSkeleton';
UserTableSkeleton.displayName = 'UserTableSkeleton';
