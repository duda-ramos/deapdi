import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  caption?: string;
  'aria-label'?: string;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  caption,
  'aria-label': ariaLabel
}) => {
  if (loading) {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="ml-2 text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
        role="status"
        aria-live="polite"
      >
        <div className="text-center text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Scroll indicator wrapper with gradient shadows */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Left shadow indicator for scroll */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 opacity-0 transition-opacity" aria-hidden="true" />
          {/* Right shadow indicator for scroll */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10" aria-hidden="true" />
          <table 
            className="min-w-full divide-y divide-gray-200"
            aria-label={ariaLabel}
            aria-rowcount={data.length}
          >
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr 
                key={row.id || `row-${index}`} 
                className="hover:bg-gray-50"
                aria-rowindex={index + 1}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {/* Mobile hint for horizontal scroll */}
      {data.length > 0 && (
        <div className="sm:hidden px-3 py-2 text-xs text-center text-gray-400 border-t border-gray-100">
          ← Deslize para ver mais →
        </div>
      )}
    </div>
  );
};