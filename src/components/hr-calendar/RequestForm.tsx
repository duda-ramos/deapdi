import React, { useState, useEffect } from 'react';
import { Sun, Coffee, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { hrCalendarService, VacationEligibility } from '../../services/hrCalendar';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface RequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: any) => void;
  userId: string;
}

export const RequestForm: React.FC<RequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId
}) => {
  const [formData, setFormData] = useState({
    event_type: 'day_off' as 'ferias' | 'day_off',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const [eligibility, setEligibility] = useState<VacationEligibility | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Memoized handler to prevent input focus loss
  const handleFormChange = React.useCallback((field: keyof typeof formData, value: string | 'ferias' | 'day_off') => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        event_type: 'day_off',
        start_date: '',
        end_date: '',
        reason: ''
      });
      setEligibility(null);
      setValidation(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.event_type === 'ferias' && formData.start_date) {
      checkVacationEligibility();
    }
  }, [formData.event_type, formData.start_date]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      validateRequest();
    }
  }, [formData.start_date, formData.end_date, formData.event_type]);

  const checkVacationEligibility = async () => {
    if (formData.event_type !== 'ferias' || !formData.start_date) return;

    try {
      setChecking(true);
      const eligibilityData = await hrCalendarService.checkVacationEligibility(userId, formData.start_date);
      setEligibility(eligibilityData);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setChecking(false);
    }
  };

  const validateRequest = async () => {
    if (!formData.start_date || !formData.end_date) return;

    try {
      const businessDays = await hrCalendarService.calculateBusinessDays(formData.start_date, formData.end_date);
      
      if (formData.event_type === 'ferias') {
        const validationResult = await hrCalendarService.validateVacationRequest(
          userId,
          formData.start_date,
          formData.end_date,
          businessDays
        );
        setValidation(validationResult);
      } else {
        // Simple validation for day-off
        setValidation({
          valid: businessDays <= 2,
          reason: businessDays > 2 ? 'Day-off não pode exceder 2 dias consecutivos' : null,
          days_requested: businessDays
        });
      }
    } catch (error) {
      console.error('Error validating request:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validation && !validation.valid) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = (): string => {
    const today = new Date();
    const minDays = formData.event_type === 'ferias' ? 30 : 7;
    today.setDate(today.getDate() + minDays);
    return today.toISOString().split('T')[0];
  };

  const requestTypes = [
    { 
      value: 'day_off', 
      label: 'Day Off', 
      icon: <Coffee size={16} className="text-orange-500" />,
      description: 'Folga de 1-2 dias (mínimo 7 dias de antecedência)'
    },
    { 
      value: 'ferias', 
      label: 'Férias', 
      icon: <Sun size={16} className="text-yellow-500" />,
      description: 'Férias individuais (mínimo 30 dias de antecedência)'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Solicitação"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type Selection */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Tipo de Solicitação</h4>
          <div className="space-y-3">
            {requestTypes.map((type) => (
              <div
                key={type.value}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.event_type === type.value
                    ? 'border-blue-300 bg-blue-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleFormChange('event_type', type.value as any)}
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

        {/* Vacation Eligibility Check */}
        {formData.event_type === 'ferias' && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
              <CheckCircle className="mr-2" size={16} />
              Verificação de Elegibilidade
            </h4>
            
            {checking ? (
              <div className="flex items-center space-x-2 text-yellow-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm">Verificando elegibilidade...</span>
              </div>
            ) : eligibility ? (
              <div className="space-y-2">
                {eligibility.eligible ? (
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">Elegível para férias</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">{eligibility.reason}</span>
                  </div>
                )}
                
                {eligibility.eligible && (
                  <div className="grid grid-cols-2 gap-4 text-sm text-yellow-800">
                    <div>
                      <span>Anos na empresa:</span>
                      <span className="font-medium ml-1">{eligibility.years_in_company}</span>
                    </div>
                    <div>
                      <span>Dias disponíveis:</span>
                      <span className="font-medium ml-1">{eligibility.remaining_days}</span>
                    </div>
                    <div>
                      <span>Dias usados:</span>
                      <span className="font-medium ml-1">{eligibility.used_days}</span>
                    </div>
                    <div>
                      <span>Total anual:</span>
                      <span className="font-medium ml-1">{eligibility.available_days}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-yellow-800">
                Selecione a data de início para verificar elegibilidade
              </p>
            )}
          </div>
        )}

        {/* Date Selection */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <Calendar className="mr-2" size={16} />
            Período Solicitado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => handleFormChange('start_date', e.target.value)}
              min={getMinDate()}
              required
            />
            <Input
              label="Data de Fim"
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => handleFormChange('end_date', e.target.value)}
              min={formData.start_date || getMinDate()}
              required
            />
          </div>

          {/* Request Validation */}
          {validation && (
            <div className={`mt-4 p-3 rounded-lg ${
              validation.valid ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {validation.valid ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  validation.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validation.valid ? 'Solicitação válida' : validation.reason}
                </span>
              </div>
              
              {validation.valid && validation.days_requested && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Dias solicitados: {validation.days_requested} dia{validation.days_requested !== 1 ? 's' : ''} úteis</p>
                  {validation.team_conflicts > 0 && (
                    <p>Conflitos de equipe: {validation.team_conflicts} pessoa{validation.team_conflicts !== 1 ? 's' : ''} ausente{validation.team_conflicts !== 1 ? 's' : ''}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <h4 className="font-medium text-indigo-900 mb-3">Justificativa</h4>
          <Textarea
            label="Motivo da Solicitação"
            value={formData.reason || ''}
            onChange={(e) => handleFormChange('reason', e.target.value)}
            placeholder={
              formData.event_type === 'ferias' 
                ? 'Descreva o motivo das férias (viagem, descanso, etc.)...'
                : 'Descreva o motivo do day-off (compromisso pessoal, etc.)...'
            }
            rows={3}
            required
          />
        </div>

        {/* Important Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">📋 Informações Importantes</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {formData.event_type === 'ferias' ? (
              <>
                <li>• Férias devem ser solicitadas com pelo menos 30 dias de antecedência</li>
                <li>• Colaboradores têm direito a 10 dias úteis de férias por ano</li>
                <li>• Férias só estão disponíveis após 1 ano de empresa</li>
                <li>• Aprovação necessária do gestor direto e RH</li>
                <li>• Máximo de 30% da equipe pode estar ausente simultaneamente</li>
              </>
            ) : (
              <>
                <li>• Day-off deve ser solicitado com pelo menos 7 dias de antecedência</li>
                <li>• Máximo de 2 dias consecutivos por solicitação</li>
                <li>• Máximo de 12 day-offs por ano</li>
                <li>• Aprovação necessária apenas do gestor direto</li>
                <li>• Justificativa é obrigatória</li>
              </>
            )}
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            loading={loading}
            disabled={validation && !validation.valid}
          >
            <Clock size={16} className="mr-2" />
            Enviar Solicitação
          </Button>
        </div>
      </form>
    </Modal>
  );
};