import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Frown,
  History,
  Loader2,
  Meh,
  Smile
} from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { mentalHealthService, CheckinSettings, EmotionalCheckin } from '../../services/mentalHealth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

interface CheckInWidgetProps {
  employeeId: string;
}

interface SliderField {
  key: keyof Pick<EmotionalCheckin, 'mood_rating' | 'energy_level' | 'stress_level' | 'sleep_quality'>;
  label: string;
  icon: React.ReactNode;
  description: string;
  lowLabel: string;
  highLabel: string;
  tone: 'positive' | 'neutral' | 'negative';
}

const sliderFields: SliderField[] = [
  {
    key: 'mood_rating',
    label: 'Humor',
    icon: <Smile className="text-green-500" size={18} />,
    description: 'Como você está se sentindo hoje? ',
    lowLabel: 'Muito baixo',
    highLabel: 'Excelente',
    tone: 'positive'
  },
  {
    key: 'energy_level',
    label: 'Energia',
    icon: <Activity className="text-blue-500" size={18} />,
    description: 'Qual seu nível de energia agora?',
    lowLabel: 'Sem energia',
    highLabel: 'Muito energizado',
    tone: 'positive'
  },
  {
    key: 'stress_level',
    label: 'Estresse',
    icon: <Meh className="text-orange-500" size={18} />,
    description: 'Como está o estresse no momento?',
    lowLabel: 'Muito baixo',
    highLabel: 'Muito alto',
    tone: 'negative'
  },
  {
    key: 'sleep_quality',
    label: 'Sono',
    icon: <History className="text-purple-500" size={18} />,
    description: 'Como foi a qualidade do seu sono?',
    lowLabel: 'Muito ruim',
    highLabel: 'Excelente',
    tone: 'positive'
  }
];

const formatScoreColor = (score: number, tone: SliderField['tone']) => {
  if (tone === 'negative') {
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-orange-500';
    return 'text-green-600';
  }

  if (score >= 8) return 'text-green-600';
  if (score >= 5) return 'text-yellow-500';
  return 'text-red-600';
};

const formatDateLabel = (date: string) => {
  const value = new Date(date);
  return value.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
};

const formatDetailedDate = (date: string) => {
  const value = new Date(date);
  return value.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const CheckInWidget: React.FC<CheckInWidgetProps> = ({ employeeId }) => {
  const [settings, setSettings] = useState<CheckinSettings | null>(null);
  const [history, setHistory] = useState<EmotionalCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notes, setNotes] = useState('');
  const [questionAnswer, setQuestionAnswer] = useState('');
  const [scores, setScores] = useState({
    mood_rating: 6,
    energy_level: 6,
    stress_level: 5,
    sleep_quality: 6
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [checkinSettings, checkins] = await Promise.all([
        mentalHealthService.getCheckinSettings(employeeId),
        mentalHealthService.getEmotionalCheckins(employeeId, 30)
      ]);

      setSettings(checkinSettings);
      setHistory(checkins);
    } catch (error) {
      console.error('Error loading check-in widget data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const hasCheckinToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return history.some((checkin) => checkin.checkin_date === today);
  }, [history]);

  const lastCheckin = history[0];

  const questionOfTheDay = useMemo(() => {
    if (!settings || !settings.custom_questions?.length) {
      return undefined;
    }

    const activeQuestions = settings.custom_questions.filter((question) => question.active !== false);
    if (!activeQuestions.length) {
      return undefined;
    }

    const index = new Date().getDay() % activeQuestions.length;
    return activeQuestions[index];
  }, [settings]);

  const historyChartData = useMemo(() => {
    const data = [...history]
      .sort((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime())
      .slice(-30);

    return data.map((item) => ({
      date: formatDateLabel(item.checkin_date),
      mood: item.mood_rating,
      stress: item.stress_level,
      energy: item.energy_level,
      sleep: item.sleep_quality
    }));
  }, [history]);

  const averageMood = useMemo(() => {
    if (!history.length) {
      return 0;
    }

    const sum = history.reduce((total, checkin) => total + checkin.mood_rating, 0);
    return Math.round((sum / history.length) * 10) / 10;
  }, [history]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (hasCheckinToday) {
      return;
    }

    setSubmitting(true);

    try {
      const compiledNotes = questionOfTheDay && questionAnswer
        ? `${notes}\n\nPergunta do dia: ${questionOfTheDay.prompt}\nResposta: ${questionAnswer}`
        : notes;

      const checkin = await mentalHealthService.createEmotionalCheckin({
        employee_id: employeeId,
        mood_rating: scores.mood_rating,
        energy_level: scores.energy_level,
        stress_level: scores.stress_level,
        sleep_quality: scores.sleep_quality,
        notes: compiledNotes,
        checkin_date: new Date().toISOString().split('T')[0]
      });

      setHistory((previous) => [checkin, ...previous]);
      setNotes('');
      setQuestionAnswer('');
      setScores({
        mood_rating: 6,
        energy_level: 6,
        stress_level: 5,
        sleep_quality: 6
      });
    } catch (error) {
      console.error('Error creating emotional check-in', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettingsUpdate = async (partialSettings: Partial<CheckinSettings>) => {
    if (!settings) {
      return;
    }

    setUpdatingSettings(true);
    try {
      const updated = await mentalHealthService.updateCheckinSettings(employeeId, partialSettings);
      setSettings(updated);
    } catch (error) {
      console.error('Error updating check-in settings', error);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const renderSlider = (field: SliderField) => (
    <div key={field.key} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {field.icon}
          <span className="text-sm font-medium text-gray-700">{field.label}</span>
        </div>
        <span className={`text-sm font-semibold ${formatScoreColor(scores[field.key], field.tone)}`}>
          {scores[field.key]}/10
        </span>
      </div>
      <p className="text-xs text-gray-500">{field.description}</p>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-400 w-20">{field.lowLabel}</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={scores[field.key]}
          onChange={(event) =>
            setScores((previous) => ({
              ...previous,
              [field.key]: Number(event.target.value)
            }))
          }
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-gray-400 w-20 text-right">{field.highLabel}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-3 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando check-ins emocionais...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Seu Check-in Emocional</h3>
            <p className="text-sm text-gray-600">
              {hasCheckinToday
                ? 'Você já registrou suas emoções hoje. Obrigado por cuidar de você!'
                : 'Reserve um minuto para registrar como você está se sentindo.'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="success" size="sm">
              <Activity size={14} className="mr-1" />
              Média 30 dias: {averageMood ? `${averageMood}/10` : '--'}
            </Badge>
            {lastCheckin && (
              <Badge variant="info" size="sm">
                <CalendarCheck size={14} className="mr-1" />
                Último: {formatDateLabel(lastCheckin.checkin_date)}
              </Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sliderFields.map(renderSlider)}
          </div>

          {questionOfTheDay && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-blue-700">
                <Bell size={16} />
                <span className="font-medium">Pergunta do dia</span>
              </div>
              <p className="text-sm text-blue-800">{questionOfTheDay.prompt}</p>
              <Textarea
                label="Sua resposta (opcional)"
                value={questionAnswer}
                onChange={(event) => setQuestionAnswer(event.target.value)}
                placeholder="Compartilhe como você está se sentindo hoje..."
                rows={2}
              />
            </div>
          )}

          <Textarea
            label="Observações (opcional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Registre algo que queira lembrar ou discutir com o time de bem-estar."
            rows={3}
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-gray-500">
              {settings?.frequency === 'daily' && 'Check-ins diários às '}
              {settings?.frequency === 'weekly' && 'Check-in semanal configurado para '}
              {settings?.frequency === 'custom' && 'Check-in personalizado, acompanhe as notificações. '}
              {settings?.frequency !== 'custom' && settings?.reminder_time && (
                <strong>{settings.reminder_time}</strong>
              )}
              {settings?.weekly_reminder_day !== undefined && settings?.frequency === 'weekly' && (
                <span>
                  {' '}no dia {['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][settings.weekly_reminder_day ?? 1]}
                </span>
              )}
            </div>

            <Button type="submit" disabled={hasCheckinToday} loading={submitting}>
              Registrar meu check-in
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History size={18} className="text-gray-500" />
            <h4 className="text-base font-semibold text-gray-900">Histórico dos últimos 30 dias</h4>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory ? (
              <>
                Ocultar detalhes <ChevronUp size={16} className="ml-1" />
              </>
            ) : (
              <>
                Ver detalhes <ChevronDown size={16} className="ml-1" />
              </>
            )}
          </Button>
        </div>

        <div className="h-60">
          <RechartsResponsiveContainer width="100%" height="100%">
            <LineChart data={historyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => `${value}/10`}
                labelStyle={{ fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="mood" stroke="#22c55e" strokeWidth={2} dot={false} name="Humor" />
              <Line type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} dot={false} name="Estresse" />
              <Line type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} dot={false} name="Energia" />
              <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Sono" />
            </LineChart>
          </RechartsResponsiveContainer>
        </div>

        {showHistory && (
          <div className="space-y-3">
            {history.map((checkin) => (
              <div
                key={checkin.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 rounded-lg p-4 gap-3"
              >
                <div className="flex items-center space-x-3">
                  <Badge variant="default" size="sm">
                    {formatDetailedDate(checkin.checkin_date)}
                  </Badge>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span className="flex items-center space-x-1">
                      <Smile size={14} className="text-green-500" />
                      <strong>{checkin.mood_rating}</strong>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center space-x-1">
                      <Activity size={14} className="text-blue-500" />
                      <strong>{checkin.energy_level}</strong>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center space-x-1">
                      <Frown size={14} className="text-orange-500" />
                      <strong>{checkin.stress_level}</strong>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center space-x-1">
                      <History size={14} className="text-purple-500" />
                      <strong>{checkin.sleep_quality}</strong>
                    </span>
                  </div>
                </div>
                {checkin.notes && (
                  <p className="text-sm text-gray-600 whitespace-pre-line max-w-2xl">{checkin.notes}</p>
                )}
              </div>
            ))}

            {!history.length && (
              <p className="text-sm text-gray-500 text-center">
                Ainda não há registros suficientes para exibir o histórico.
              </p>
            )}
          </div>
        )}
      </Card>

      {settings && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Bell size={18} className="text-gray-500" />
            <h4 className="text-base font-semibold text-gray-900">Configurações de lembrete</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Frequência"
              value={settings.frequency}
              onChange={(event) => handleSettingsUpdate({ frequency: event.target.value as CheckinSettings['frequency'] })}
              options={[
                { value: 'daily', label: 'Diário' },
                { value: 'weekly', label: 'Semanal' },
                { value: 'custom', label: 'Personalizado' }
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horário do lembrete</label>
              <input
                type="time"
                value={settings.reminder_time ?? '09:00'}
                onChange={(event) => handleSettingsUpdate({ reminder_time: event.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {settings.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dia do lembrete</label>
                <select
                  value={settings.weekly_reminder_day ?? 1}
                  onChange={(event) => handleSettingsUpdate({ weekly_reminder_day: Number(event.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p>
              Ajuste a frequência dos lembretes conforme o acompanhamento desejado. As notificações semanais são enviadas no
              dia selecionado com um resumo do seu bem-estar.
            </p>
          </div>

          {updatingSettings && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Loader2 className="animate-spin" size={14} />
              <span>Atualizando preferências...</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
