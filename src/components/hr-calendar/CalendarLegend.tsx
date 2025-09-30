import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const CalendarLegend: React.FC = () => {
  const legendItems = [
    { type: 'aniversario', label: 'Aniversários', color: '#3B82F6', icon: '🎂' },
    { type: 'aniversario_empresa', label: 'Aniversários Empresa', color: '#10B981', icon: '🏢' },
    { type: 'ferias', label: 'Férias', color: '#F59E0B', icon: '🏖️' },
    { type: 'feriado', label: 'Feriados', color: '#EF4444', icon: '🎉' },
    { type: 'evento', label: 'Eventos', color: '#8B5CF6', icon: '📅' },
    { type: 'day_off', label: 'Day Off', color: '#F97316', icon: '☕' },
    { type: 'ferias_coletivas', label: 'Férias Coletivas', color: '#F59E0B', icon: '🏝️' }
  ];

  const statusItems = [
    { status: 'confirmed', label: 'Confirmado', variant: 'success' as const },
    { status: 'pending', label: 'Pendente', variant: 'warning' as const },
    { status: 'approved', label: 'Aprovado', variant: 'info' as const },
    { status: 'rejected', label: 'Rejeitado', variant: 'danger' as const }
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Legenda</h3>
      
      {/* Event Types */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tipos de Evento</h4>
          <div className="space-y-2">
            {legendItems.map((item) => (
              <div key={item.type} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs">{item.icon}</span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
          <div className="space-y-1">
            {statusItems.map((item) => (
              <div key={item.status} className="flex items-center space-x-2">
                <Badge variant={item.variant} size="sm">
                  {item.label}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Special Days */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Dias Especiais</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Fins de semana</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
              <span>Hoje</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};