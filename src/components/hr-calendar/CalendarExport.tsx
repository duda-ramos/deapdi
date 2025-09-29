import React, { useState } from 'react';
import { Download, Calendar, Link, Mail, Settings } from 'lucide-react';
import { CalendarEvent, hrCalendarService } from '../../services/hrCalendar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';

interface CalendarExportProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  filters: any;
}

export const CalendarExport: React.FC<CalendarExportProps> = ({
  isOpen,
  onClose,
  events,
  filters
}) => {
  const [exportType, setExportType] = useState<'ics' | 'subscription' | 'outlook'>('ics');
  const [exportFilters, setExportFilters] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    include_types: ['feriado', 'ferias_coletivas', 'evento'],
    include_personal: false
  });
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [generating, setGenerating] = useState(false);

  const exportTypes = [
    {
      value: 'ics',
      label: 'Arquivo ICS',
      description: 'Baixar arquivo para importar no Outlook/Google Calendar',
      icon: <Download size={16} />
    },
    {
      value: 'subscription',
      label: 'Link de Assinatura',
      description: 'URL para sincronização automática',
      icon: <Link size={16} />
    },
    {
      value: 'outlook',
      label: 'Integração Outlook',
      description: 'Configuração para Microsoft Outlook',
      icon: <Mail size={16} />
    }
  ];

  const eventTypeOptions = [
    { value: 'aniversario', label: 'Aniversários' },
    { value: 'aniversario_empresa', label: 'Aniversários Empresa' },
    { value: 'ferias', label: 'Férias' },
    { value: 'feriado', label: 'Feriados' },
    { value: 'evento', label: 'Eventos' },
    { value: 'day_off', label: 'Day Off' },
    { value: 'ferias_coletivas', label: 'Férias Coletivas' }
  ];

  const handleExport = async () => {
    setGenerating(true);
    
    try {
      switch (exportType) {
        case 'ics':
          await exportICSFile();
          break;
        case 'subscription':
          await generateSubscriptionUrl();
          break;
        case 'outlook':
          await setupOutlookIntegration();
          break;
      }
    } catch (error) {
      console.error('Error exporting calendar:', error);
    } finally {
      setGenerating(false);
    }
  };

  const exportICSFile = async () => {
    const icsContent = await hrCalendarService.exportToICS({
      start_date: exportFilters.start_date,
      end_date: exportFilters.end_date,
      types: exportFilters.include_types
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendario-rh-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSubscriptionUrl = async () => {
    // In a real implementation, this would generate a secure subscription URL
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      types: exportFilters.include_types.join(','),
      start: exportFilters.start_date,
      end: exportFilters.end_date
    });
    
    const url = `${baseUrl}/api/calendar/subscribe?${params}`;
    setSubscriptionUrl(url);
  };

  const setupOutlookIntegration = async () => {
    // Generate instructions for Outlook integration
    alert('Instruções de integração com Outlook serão exibidas');
  };

  const toggleEventType = (type: string) => {
    const newTypes = exportFilters.include_types.includes(type)
      ? exportFilters.include_types.filter(t => t !== type)
      : [...exportFilters.include_types, type];
    
    setExportFilters({ ...exportFilters, include_types: newTypes });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exportar Calendário"
      size="lg"
    >
      <div className="space-y-6">
        {/* Export Type Selection */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Tipo de Exportação</h4>
          <div className="space-y-3">
            {exportTypes.map((type) => (
              <div
                key={type.value}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  exportType === type.value
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setExportType(type.value as any)}
              >
                <div className="flex items-center space-x-3">
                  {type.icon}
                  <div>
                    <h5 className="font-medium text-gray-900">{type.label}</h5>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Filters */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Filtros de Exportação</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Data de Início"
              type="date"
              value={exportFilters.start_date}
              onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })}
            />
            <Input
              label="Data de Fim"
              type="date"
              value={exportFilters.end_date}
              onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de Evento para Incluir
            </label>
            <div className="grid grid-cols-2 gap-2">
              {eventTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`export-${option.value}`}
                    checked={exportFilters.include_types.includes(option.value)}
                    onChange={() => toggleEventType(option.value)}
                    className="rounded"
                  />
                  <label htmlFor={`export-${option.value}`} className="text-sm text-gray-700">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include_personal"
                checked={exportFilters.include_personal}
                onChange={(e) => setExportFilters({ ...exportFilters, include_personal: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="include_personal" className="text-sm text-gray-700">
                Incluir eventos pessoais (aniversários, férias individuais)
              </label>
            </div>
          </div>
        </div>

        {/* Export Results */}
        {exportType === 'subscription' && subscriptionUrl && (
          <Card className="p-4 bg-green-50">
            <h4 className="font-medium text-green-900 mb-2">URL de Assinatura Gerada</h4>
            <div className="flex items-center space-x-2">
              <Input
                value={subscriptionUrl}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => navigator.clipboard.writeText(subscriptionUrl)}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm text-green-800 mt-2">
              Use esta URL no seu cliente de calendário para sincronização automática
            </p>
          </Card>
        )}

        {exportType === 'outlook' && (
          <Card className="p-4 bg-blue-50">
            <h4 className="font-medium text-blue-900 mb-3">Instruções para Outlook</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Opção 1 - Arquivo ICS:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Baixe o arquivo ICS clicando em "Exportar"</li>
                <li>Abra o Outlook</li>
                <li>Vá em Arquivo → Abrir e Exportar → Importar/Exportar</li>
                <li>Selecione "Importar um arquivo iCalendar (.ics) ou vCalendar"</li>
                <li>Escolha o arquivo baixado</li>
              </ol>
              
              <p className="mt-3"><strong>Opção 2 - Assinatura (Recomendado):</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Gere um link de assinatura</li>
                <li>No Outlook, vá em Calendário → Adicionar Calendário</li>
                <li>Selecione "Da Internet"</li>
                <li>Cole a URL de assinatura</li>
                <li>O calendário será sincronizado automaticamente</li>
              </ol>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button
            onClick={handleExport}
            loading={generating}
          >
            <Download size={16} className="mr-2" />
            {exportType === 'ics' ? 'Baixar ICS' :
             exportType === 'subscription' ? 'Gerar Link' :
             'Configurar Outlook'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};