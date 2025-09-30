import React from 'react';
import { Filter, X } from 'lucide-react';
import { CalendarEvent, hrCalendarService } from '../../services/hrCalendar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CalendarFiltersProps {
  filters: {
    types: string[];
    teams: string[];
    users: string[];
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  events: CalendarEvent[];
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  filters,
  onFiltersChange,
  events
}) => {
  const eventTypes = [
    { value: 'aniversario', label: 'Aniversários', color: '#3B82F6' },
    { value: 'aniversario_empresa', label: 'Aniversários Empresa', color: '#10B981' },
    { value: 'ferias', label: 'Férias', color: '#F59E0B' },
    { value: 'feriado', label: 'Feriados', color: '#EF4444' },
    { value: 'evento', label: 'Eventos', color: '#8B5CF6' },
    { value: 'day_off', label: 'Day Off', color: '#F97316' },
    { value: 'ferias_coletivas', label: 'Férias Coletivas', color: '#F59E0B' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'rejected', label: 'Rejeitado' }
  ];

  const toggleTypeFilter = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      teams: [],
      users: [],
      status: 'all'
    });
  };

  const hasActiveFilters = filters.types.length > 0 || 
                          filters.teams.length > 0 || 
                          filters.users.length > 0 || 
                          filters.status !== 'all';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Filter className="mr-2" size={16} />
          Filtros
        </h3>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAllFilters}
          >
            <X size={14} className="mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Event Types */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipos de Evento
          </label>
          <div className="space-y-2">
            {eventTypes.map((type) => {
              const isActive = filters.types.includes(type.value);
              const count = events.filter(e => e.type === type.value).length;
              
              return (
                <button
                  key={type.value}
                  onClick={() => toggleTypeFilter(type.value)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isActive 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {type.label}
                    </span>
                  </div>
                  <Badge variant="default" size="sm">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Filtros ativos:</div>
            <div className="flex flex-wrap gap-1">
              {filters.types.map((type) => (
                <Badge key={type} variant="info" size="sm">
                  {eventTypes.find(t => t.value === type)?.label}
                </Badge>
              ))}
              {filters.status !== 'all' && (
                <Badge variant="info" size="sm">
                  {statusOptions.find(s => s.value === filters.status)?.label}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};