import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Brain,
  Activity,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Meh,
  Frown,
  Battery,
  Moon,
  Zap,
  BookOpen,
  Play,
  Headphones,
  Shield,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

const MentalHealth: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  const [checkinForm, setCheckinForm] = useState({
    mood_rating: 5,
    energy_level: 5,
    stress_level: 5,
    sleep_quality: 5,
    notes: ''
  });

  const [requestForm, setRequestForm] = useState({
    urgency: 'normal' as 'normal' | 'prioritaria' | 'emergencial',
    preferred_type: 'presencial' as 'presencial' | 'online' | 'emergencial' | 'follow_up',
    reason: '',
    preferred_times: [] as string[]
  });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    if (user) {
      checkConsent();
    }
  }, [user]);

  const checkConsent = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Check if user has mental health consent
      const consent = user.mental_health_consent || false;
      setHasConsent(consent);
      
      if (!consent) {
        setShowConsentModal(true);
      } else {
        // Load basic data without complex service calls
        loadBasicData();
      }
    } catch (error) {
      console.error('Error checking consent:', error);
      setShowConsentModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadBasicData = async () => {
    try {
      // Simplified data loading without complex service dependencies
      setTodayCheckin(null);
      setRecentCheckins([]);
    } catch (error) {
      console.error('Error loading basic data:', error);
      setError('Erro ao carregar dados básicos');
    }
  };

  const handleConsent = async (granted: boolean) => {
    if (!user) return;

    try {
      // Update user profile with consent
      const { databaseService } = await import('../services/database');
      await databaseService.updateProfile(user.id, {
        mental_health_consent: granted
      });

      setHasConsent(granted);
      setShowConsentModal(false);

      if (granted) {
        loadBasicData();
      }
    } catch (error) {
      console.error('Error recording consent:', error);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Simplified checkin creation
      const { supabase } = await import('../lib/supabase');
      if (supabase) {
        await supabase.from('emotional_checkins').upsert({
          employee_id: user.id,
          mood_rating: checkinForm.mood_rating,
          stress_level: checkinForm.stress_level,
          energy_level: checkinForm.energy_level,
          sleep_quality: checkinForm.sleep_quality,
          notes: checkinForm.notes,
          checkin_date: new Date().toISOString().split('T')[0]
        });
      }

      setShowCheckinModal(false);
      setCheckinForm({
        mood_rating: 5,
        energy_level: 5,
        stress_level: 5,
        sleep_quality: 5,
        notes: ''
      });

      loadBasicData();
    } catch (error) {
      console.error('Error creating checkin:', error);
    }
  };

  const handleSessionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Simplified session request creation
      const { supabase } = await import('../lib/supabase');
      if (supabase) {
        await supabase.from('session_requests').insert({
          employee_id: user.id,
          urgency: requestForm.urgency,
          preferred_type: requestForm.preferred_type,
          reason: requestForm.reason,
          preferred_times: requestForm.preferred_times,
          status: 'pendente'
        });
      }

      setShowRequestModal(false);
      setRequestForm({
        urgency: 'normal',
        preferred_type: 'presencial',
        reason: '',
        preferred_times: []
      });
    } catch (error) {
      console.error('Error creating session request:', error);
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

  if (!hasConsent) {
    return (
      <Modal
        isOpen={showConsentModal}
        onClose={() => {}}
        title="Programa de Bem-estar Psicológico"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Cuidamos do seu bem-estar
            </h3>
            <p className="text-gray-600">
              Nosso programa de saúde mental oferece suporte confidencial e profissional
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">✅ O que oferecemos:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Sessões individuais com psicólogos qualificados</li>
              <li>• Atividades terapêuticas personalizadas</li>
              <li>• Recursos de bem-estar e mindfulness</li>
              <li>• Check-ins emocionais para autoconhecimento</li>
              <li>• Suporte em situações de emergência</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">🔒 Privacidade e Confidencialidade:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Todos os dados são estritamente confidenciais</li>
              <li>• Apenas psicólogos autorizados têm acesso</li>
              <li>• Gestores NÃO têm acesso aos seus dados</li>
              <li>• Você controla o que é compartilhado</li>
              <li>• Pode revogar consentimento a qualquer momento</li>
            </ul>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-3">📋 Seus Direitos:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Participação é 100% voluntária</li>
              <li>• Pode pausar ou sair do programa quando quiser</li>
              <li>• Acesso aos seus próprios dados a qualquer momento</li>
              <li>• Exclusão de dados mediante solicitação</li>
              <li>• Suporte não afeta avaliações de performance</li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => handleConsent(false)}
            >
              Não Participar
            </Button>
            <Button
              onClick={() => handleConsent(true)}
            >
              <Heart size={16} className="mr-2" />
              Aceitar e Participar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando dados de bem-estar..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-estar Psicológico</h1>
          <p className="text-gray-600 mt-1">Cuide da sua saúde mental e bem-estar</p>
        </div>
        <ErrorMessage error={error} onRetry={loadBasicData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="mr-3 text-pink-500" size={28} />
            Bem-estar Psicológico
          </h1>
          <p className="text-gray-600 mt-1">Cuide da sua saúde mental e bem-estar</p>
        </div>
        <div className="flex items-center space-x-3">
          {!todayCheckin && (
            <Button onClick={() => setShowCheckinModal(true)}>
              <Activity size={16} className="mr-2" />
              Check-in Diário
            </Button>
          )}
          <Button onClick={() => setShowRequestModal(true)} variant="secondary">
            <Calendar size={16} className="mr-2" />
            Solicitar Sessão
          </Button>
        </div>
      </div>

      {/* Today's Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="mr-2" size={20} />
          Como você está hoje?
        </h3>
        
        {todayCheckin ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-center mb-2">
                {getMoodIcon(todayCheckin.mood_rating)}
              </div>
              <div className={`text-2xl font-bold ${getMoodColor(todayCheckin.mood_rating)}`}>
                {todayCheckin.mood_rating}/10
              </div>
              <div className="text-sm text-gray-600">Humor</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Battery className="text-green-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {todayCheckin.energy_level}/10
              </div>
              <div className="text-sm text-gray-600">Energia</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Zap className="text-orange-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {todayCheckin.stress_level}/10
              </div>
              <div className="text-sm text-gray-600">Estresse</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Moon className="text-purple-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {todayCheckin.sleep_quality}/10
              </div>
              <div className="text-sm text-gray-600">Sono</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity size={48} className="mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Seu bem-estar é nossa prioridade
            </h4>
            <p className="text-gray-600 mb-4">
              Faça seu primeiro check-in emocional para começar a acompanhar seu bem-estar
            </p>
            <Button onClick={() => setShowCheckinModal(true)}>
              <Activity size={16} className="mr-2" />
              Fazer Primeiro Check-in
            </Button>
          </div>
        )}
      </Card>

      {/* Wellness Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recursos de Bem-estar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Técnicas de Respiração',
              description: 'Exercícios simples para reduzir ansiedade e estresse',
              type: 'exercise',
              category: 'anxiety'
            },
            {
              title: 'Meditação Guiada',
              description: 'Sessões de mindfulness para relaxamento',
              type: 'audio',
              category: 'mindfulness'
            },
            {
              title: 'Dicas para Melhor Sono',
              description: 'Estratégias para melhorar a qualidade do sono',
              type: 'article',
              category: 'sleep'
            }
          ].map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {resource.type === 'exercise' && <Activity size={16} className="text-green-500" />}
                  {resource.type === 'audio' && <Headphones size={16} className="text-purple-500" />}
                  {resource.type === 'article' && <BookOpen size={16} className="text-blue-500" />}
                  <h4 className="font-medium text-gray-900 text-sm">{resource.title}</h4>
                </div>
                <Badge variant="info" size="sm">
                  {resource.type === 'exercise' ? 'Exercício' :
                   resource.type === 'audio' ? 'Áudio' : 'Artigo'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {resource.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="default" size="sm">
                  {resource.category === 'anxiety' ? 'Ansiedade' :
                   resource.category === 'mindfulness' ? 'Mindfulness' : 'Sono'}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Daily Check-in Modal */}
      <Modal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        title="Check-in Emocional Diário"
        size="lg"
      >
        <form onSubmit={handleCheckin} className="space-y-6">
          <div className="text-center mb-6">
            <Activity className="mx-auto mb-2 text-blue-500" size={32} />
            <p className="text-gray-600">
              Reserve um momento para avaliar como você está se sentindo hoje
            </p>
          </div>

          <div className="space-y-6">
            {renderScaleInput(
              'Como está seu humor hoje?',
              checkinForm.mood_rating,
              (value) => setCheckinForm({ ...checkinForm, mood_rating: value }),
              getMoodIcon(checkinForm.mood_rating),
              'Muito baixo',
              'Excelente'
            )}

            {renderScaleInput(
              'Qual seu nível de energia?',
              checkinForm.energy_level,
              (value) => setCheckinForm({ ...checkinForm, energy_level: value }),
              <Battery className="text-green-500" size={20} />,
              'Sem energia',
              'Muito energizado'
            )}

            {renderScaleInput(
              'Como está seu nível de estresse?',
              checkinForm.stress_level,
              (value) => setCheckinForm({ ...checkinForm, stress_level: value }),
              <Zap className="text-orange-500" size={20} />,
              'Muito relaxado',
              'Muito estressado'
            )}

            {renderScaleInput(
              'Como foi a qualidade do seu sono?',
              checkinForm.sleep_quality,
              (value) => setCheckinForm({ ...checkinForm, sleep_quality: value }),
              <Moon className="text-purple-500" size={20} />,
              'Muito ruim',
              'Excelente'
            )}
          </div>

          <Textarea
            label="Observações (Opcional)"
            value={checkinForm.notes}
            onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCheckinModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <CheckCircle size={16} className="mr-2" />
              Salvar Check-in
            </Button>
          </div>
        </form>
      </Modal>

      {/* Session Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Solicitar Sessão de Psicologia"
        size="lg"
      >
        <form onSubmit={handleSessionRequest} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">🔒 Confidencialidade Garantida</h4>
            <p className="text-sm text-blue-800">
              Todas as sessões são estritamente confidenciais. Apenas você e o psicólogo terão acesso às informações.
            </p>
          </div>

          <Select
            label="Urgência"
            value={requestForm.urgency}
            onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value as any })}
            options={[
              { value: 'normal', label: 'Normal - Agendamento regular' },
              { value: 'prioritaria', label: 'Prioritária - Preciso de atenção em breve' },
              { value: 'emergencial', label: 'Emergencial - Preciso de ajuda urgente' }
            ]}
            required
          />

          <Select
            label="Tipo de Sessão"
            value={requestForm.preferred_type}
            onChange={(e) => setRequestForm({ ...requestForm, preferred_type: e.target.value as any })}
            options={[
              { value: 'presencial', label: 'Presencial - No escritório' },
              { value: 'online', label: 'Online - Videochamada' },
              { value: 'emergencial', label: 'Emergencial - Qualquer formato' }
            ]}
            required
          />

          <Textarea
            label="Motivo da Solicitação"
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            placeholder="Descreva brevemente o que gostaria de abordar na sessão..."
            rows={4}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horários Preferidos (Selecione até 3)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    if (requestForm.preferred_times.includes(time)) {
                      setRequestForm({
                        ...requestForm,
                        preferred_times: requestForm.preferred_times.filter(t => t !== time)
                      });
                    } else if (requestForm.preferred_times.length < 3) {
                      setRequestForm({
                        ...requestForm,
                        preferred_times: [...requestForm.preferred_times, time]
                      });
                    }
                  }}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    requestForm.preferred_times.includes(time)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {requestForm.urgency === 'emergencial' && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="text-red-500" size={20} />
                <h4 className="font-medium text-red-900">Situação de Emergência</h4>
              </div>
              <p className="text-sm text-red-800 mb-3">
                Se você está em crise ou pensando em se machucar, procure ajuda imediatamente:
              </p>
              <div className="space-y-1 text-sm text-red-800">
                <p>• <strong>CVV:</strong> 188 (24h, gratuito)</p>
                <p>• <strong>SAMU:</strong> 192</p>
                <p>• <strong>Emergência:</strong> 190</p>
              </div>
            </div>
          )}

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">📋 Próximos Passos:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Sua solicitação será analisada por um psicólogo</li>
              <li>• Você receberá uma resposta em até 24h (emergencial: 2h)</li>
              <li>• A sessão será agendada conforme sua disponibilidade</li>
              <li>• Você receberá confirmação por email</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRequestModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Calendar size={16} className="mr-2" />
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentalHealth;