import React, { useState } from 'react';
import { 
  Activity, 
  Smile, 
  Meh, 
  Frown, 
  Battery, 
  Zap, 
  Moon, 
  CheckCircle 
} from 'lucide-react';
import { mentalHealthService, EmotionalCheckin as EmotionalCheckinType } from '../../services/mentalHealth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface EmotionalCheckinProps {
  onComplete: (checkin: EmotionalCheckinType) => void;
  employeeId: string;
}

export const EmotionalCheckin: React.FC<EmotionalCheckinProps> = ({ 
  onComplete, 
  employeeId 
}) => {
  const [formData, setFormData] = useState({
    mood_rating: 5,
    energy_level: 5,
    stress_level: 5,
    sleep_quality: 5,
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const checkin = await mentalHealthService.createEmotionalCheckin({
        employee_id: employeeId,
        ...formData,
        checkin_date: new Date().toISOString().split('T')[0]
      });

      onComplete(checkin);
    } catch (error) {
      console.error('Error creating checkin:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getMoodIcon = (score: number) => {
    if (score >= 8) return <Smile className="text-green-500" size={24} />;
    if (score >= 6) return <Meh className="text-yellow-500" size={24} />;
    return <Frown className="text-red-500" size={24} />;
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderScaleInput = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    icon: React.ReactNode,
    lowLabel: string,
    highLabel: string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {icon}
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 w-16">{lowLabel}</span>
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500 w-16 text-right">{highLabel}</span>
        </div>
        <div className="text-center">
          <span className={`text-lg font-bold ${getMoodColor(value)}`}>
            {value}/10
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <Activity className="mx-auto mb-2 text-blue-500" size={32} />
          <h3 className="text-lg font-semibold text-gray-900">Check-in Emocional</h3>
          <p className="text-gray-600">
            Reserve um momento para avaliar como você está se sentindo hoje
          </p>
        </div>

        <div className="space-y-6">
          {renderScaleInput(
            'Como está seu humor hoje?',
            formData.mood_rating,
            (value) => setFormData({ ...formData, mood_rating: value }),
            getMoodIcon(formData.mood_rating),
            'Muito baixo',
            'Excelente'
          )}

          {renderScaleInput(
            'Qual seu nível de energia?',
            formData.energy_level,
            (value) => setFormData({ ...formData, energy_level: value }),
            <Battery className="text-green-500" size={20} />,
            'Sem energia',
            'Muito energizado'
          )}

          {renderScaleInput(
            'Como está seu nível de estresse?',
            formData.stress_level,
            (value) => setFormData({ ...formData, stress_level: value }),
            <Zap className="text-orange-500" size={20} />,
            'Muito relaxado',
            'Muito estressado'
          )}

          {renderScaleInput(
            'Como foi a qualidade do seu sono?',
            formData.sleep_quality,
            (value) => setFormData({ ...formData, sleep_quality: value }),
            <Moon className="text-purple-500" size={20} />,
            'Muito ruim',
            'Excelente'
          )}
        </div>

        <Textarea
          label="Observações (Opcional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Compartilhe como foi seu dia, desafios ou conquistas..."
          rows={3}
        />

        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">💚 Lembre-se:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Não existem respostas certas ou erradas</li>
            <li>• Seja honesto consigo mesmo</li>
            <li>• Estes dados ajudam você a se conhecer melhor</li>
            <li>• Apenas você e psicólogos autorizados têm acesso</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            <CheckCircle size={16} className="mr-2" />
            Salvar Check-in
          </Button>
        </div>
      </form>
    </Card>
  );
};