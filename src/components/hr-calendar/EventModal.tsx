import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Tag, Palette, Save, X } from 'lucide-react';
import { CalendarEvent, hrCalendarService } from '../../services/hrCalendar';
import { databaseService } from '../../services/database';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  event?: CalendarEvent | null;
  canEdit: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  canEdit
}) => {
  const [formData, setFormData] = useState({
    type: 'evento' as CalendarEvent['type'],
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: true,
    category: 'general',
    user_id: '',
    team_id: '',
    is_public: true,
    color: '#8B5CF6'
  });

  const [teams, setTeams] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const eventTypes = [
    { value: 'evento', label: 'Evento Geral' },
    { value: 'feriado', label: 'Feriado' },
    { value: 'ferias_coletivas', label: 'Férias Coletivas' },
    { value: 'aniversario', label: 'Aniversário' },
    { value: 'aniversario_empresa', label: 'Aniversário de Empresa' }
  ];

  const categories = [
    { value: 'general', label: 'Geral' },
    { value: 'meeting', label: 'Reunião' },
    { value: 'training', label: 'Treinamento' },
    { value: 'holiday', label: 'Feriado' },
    { value: 'birthday', label: 'Aniversário' },
    { value: 'company_anniversary', label: 'Aniversário de Empresa' },
    { value: 'collective_vacation', label: 'Férias Coletivas' }
  ];

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul', color: '#3B82F6' },
    { value: '#10B981', label: 'Verde', color: '#10B981' },
    { value: '#F59E0B', label: 'Amarelo', color: '#F59E0B' },
    { value: '#EF4444', label: 'Vermelho', color: '#EF4444' },
    { value: '#8B5CF6', label: 'Roxo', color: '#8B5CF6' },
    { value: '#F97316', label: 'Laranja', color: '#F97316' },
    { value: '#6B7280', label: 'Cinza', color: '#6B7280' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadSelectOptions();
      
      if (event) {
        setFormData({
          type: event.type,
          title: event.title,
          description: event.description || '',
          start_date: event.start_date,
          end_date: event.end_date,
          all_day: event.all_day,
          category: event.category,
          user_id: event.user_id || '',
          team_id: event.team_id || '',
          is_public: event.is_public,
          color: event.color
        });
      } else {
        setFormData({
          type: 'evento',
          title: '',
          description: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          all_day: true,
          category: 'general',
          user_id: '',
          team_id: '',
          is_public: true,
          color: '#8B5CF6'
        });
      }
    }
  }, [isOpen, event]);

  const loadSelectOptions = async () => {
    try {
      const [teamsData, profilesData] = await Promise.all([
        databaseService.getTeams(),
        databaseService.getProfiles()
      ]);
      setTeams(teamsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error loading select options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert empty strings to null for UUID fields
      const cleanedFormData = {
        ...formData,
        user_id: formData.user_id || null,
        team_id: formData.team_id || null
      };
      
      await onSave(cleanedFormData);
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const teamOptions = teams.map(team => ({ value: team.id, label: team.name }));
  const userOptions = profiles.map(profile => ({ value: profile.id, label: profile.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Detalhes do Evento' : 'Criar Novo Evento'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type and Basic Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <Calendar className="mr-2" size={16} />
            Informações Básicas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Evento"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={eventTypes}
              disabled={!canEdit}
              required
            />
            <Select
              label="Categoria"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories}
              disabled={!canEdit}
              required
            />
          </div>
          
          <Input
            label="Título do Evento"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Reunião de Equipe, Feriado Nacional"
            disabled={!canEdit}
            required
          />
          
          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detalhes sobre o evento..."
            rows={3}
            disabled={!canEdit}
          />
        </div>

        {/* Date and Time */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <Clock className="mr-2" size={16} />
            Data e Horário
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              disabled={!canEdit}
              required
            />
            <Input
              label="Data de Fim"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              disabled={!canEdit}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              id="all_day"
              checked={formData.all_day}
              onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
              disabled={!canEdit}
              className="rounded"
            />
            <label htmlFor="all_day" className="text-sm text-gray-700">
              Evento de dia inteiro
            </label>
          </div>
        </div>

        {/* Assignment and Visibility */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center">
            <Users className="mr-2" size={16} />
            Atribuição e Visibilidade
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Usuário Específico (Opcional)"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              options={[
                { value: '', label: 'Nenhum usuário específico' },
                ...userOptions
              ]}
              disabled={!canEdit}
            />
            <Select
              label="Equipe (Opcional)"
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              options={[
                { value: '', label: 'Nenhuma equipe específica' },
                ...teamOptions
              ]}
              disabled={!canEdit}
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              disabled={!canEdit}
              className="rounded"
            />
            <label htmlFor="is_public" className="text-sm text-gray-700">
              Evento público (visível para todos)
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-3 flex items-center">
            <Palette className="mr-2" size={16} />
            Aparência
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor do Evento
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: option.value })}
                  disabled={!canEdit}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === option.value 
                      ? 'border-gray-900 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: option.color }}
                  title={option.label}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm text-gray-600">
                Cor selecionada: {colorOptions.find(c => c.value === formData.color)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Event Info (Read-only) */}
        {event && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informações do Evento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="mt-1">
                  <Badge variant={hrCalendarService.getStatusColor(event.status)}>
                    {hrCalendarService.getStatusLabel(event.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Criado em:</span>
                <p className="font-medium">{new Date(event.created_at).toLocaleString('pt-BR')}</p>
              </div>
              {event.creator && (
                <div>
                  <span className="text-gray-600">Criado por:</span>
                  <p className="font-medium">{event.creator.name}</p>
                </div>
              )}
              {event.approved_by && (
                <div>
                  <span className="text-gray-600">Aprovado por:</span>
                  <p className="font-medium">{event.approved_by}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            <X size={16} className="mr-2" />
            {canEdit ? 'Cancelar' : 'Fechar'}
          </Button>
          {canEdit && (
            <Button type="submit" loading={loading}>
              <Save size={16} className="mr-2" />
              {event ? 'Atualizar' : 'Criar'} Evento
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};