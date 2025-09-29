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
  Headphones
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mentalHealthService } from '../services/mentalHealth';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EmotionalCheckin {
  id: string;
  employee_id: string;
  mood_rating: number;
  stress_level: number;
  energy_level: number;
  sleep_quality: number;
  notes?: string;
  checkin_date: string;
  created_at: string;
}

interface WellnessResource {
  id: string;
  title: string;
  description: string;
  resource_type: 'article' | 'video' | 'audio' | 'pdf' | 'link';
  category: string;
  content_url?: string;
  thumbnail_url?: string;
  tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface TherapeuticActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  difficulty_level: string;
  instructions?: string;
  benefits?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const MentalHealth: React.FC = () => {
  const { user } = useAuth();
  const [recentCheckins, setRecentCheckins] = useState<EmotionalCheckin[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<EmotionalCheckin | null>(null);
  const [wellnessResources, setWellnessResources] = useState<WellnessResource[]>([]);
  const [therapeuticActivities, setTherapeuticActivities] = useState<TherapeuticActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

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

  useEffect(() => {
    if (user && hasConsent) {
      loadWellnessData();
    }
  }, [user, hasConsent]);

  const checkConsent = async () => {
    if (!user) return;

    try {
      // Check if user has mental health consent
      const consent = user.mental_health_consent || false;
      setHasConsent(consent);
      
      if (!consent) {
        setShowConsentModal(true);
      }
    } catch (error) {
      console.error('Error checking consent:', error);
      setShowConsentModal(true);
    }
  };

  const loadWellnessData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const [checkins, todayData, resources, activities] = await Promise.all([
        mentalHealthService.getEmotionalCheckins(user.id, 7),
        mentalHealthService.getTodayCheckin(user.id),
        mentalHealthService.getWellnessResources(),
        mentalHealthService.getTherapeuticActivities()
      ]);

      setRecentCheckins(checkins || []);
      setTodayCheckin(todayData);
      setWellnessResources(resources || []);
      setTherapeuticActivities(activities || []);
    } catch (error) {
      console.error('Error loading wellness data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados de bem-estar');
    } finally {
      setLoading(false);
    }
  };

  const handleConsent = async (granted: boolean) => {
    if (!user) return;

    try {
      await mentalHealthService.recordConsent(
        user.id,
        'mental_health_participation',
        granted,
        granted 
          ? 'Autorizo o uso de meus dados para fins de bem-estar e saúde mental no trabalho, conforme política de privacidade.'
          : 'Não autorizo o uso de meus dados para fins de bem-estar e saúde mental.'
      );

      setHasConsent(granted);
      setShowConsentModal(false);

      if (granted) {
        loadWellnessData();
      }
    } catch (error) {
      console.error('Error recording consent:', error);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await mentalHealthService.createEmotionalCheckin({
        employee_id: user.id,
        ...checkinForm,
        checkin_date: new Date().toISOString().split('T')[0]
      });

      setShowCheckinModal(false);
      setCheckinForm({
        mood_rating: 5,
        energy_level: 5,
        stress_level: 5,
        sleep_quality: 5,
        notes: ''
      });

      loadWellnessData();
    } catch (error) {
      console.error('Error creating checkin:', error);
    }
  };

  const handleSessionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await mentalHealthService.createSessionRequest({
        employee_id: user.id,
        ...requestForm
      });

      setShowRequestModal(false);
      setRequestForm({
        urgency: 'normal',
        preferred_type: 'presencial',
        reason: '',
        preferred_times: []
      });

      loadWellnessData();
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="text-green-500" size={20} />;
      case 'declining': return <TrendingDown className="text-red-500" size={20} />;
      default: return <Minus className="text-gray-500" size={20} />;
    }
  };

  const calculateTrend = (): 'improving' | 'stable' | 'declining' => {
    if (recentCheckins.length < 3) return 'stable';
    
    const recent = recentCheckins.slice(0, 3);
    const older = recentCheckins.slice(3, 6);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, c) => sum + c.mood_rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + c.mood_rating, 0) / older.length;
    
    if (recentAvg > olderAvg + 1) return 'improving';
    if (recentAvg < olderAvg - 1) return 'declining';
    return 'stable';
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

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen size={20} className="text-blue-500" />;
      case 'video': return <Play size={20} className="text-red-500" />;
      case 'audio': return <Headphones size={20} className="text-purple-500" />;
      case 'exercise': return <Activity size={20} className="text-green-500" />;
      default: return <BookOpen size={20} className="text-gray-500" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Artigo';
      case 'video': return 'Vídeo';
      case 'audio': return 'Áudio';
      case 'exercise': return 'Exercício';
      default: return type;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anxiety': return 'Ansiedade';
      case 'stress': return 'Estresse';
      case 'mindfulness': return 'Mindfulness';
      case 'sleep': return 'Sono';
      case 'productivity': return 'Produtividade';
      case 'relationships': return 'Relacionamentos';
      case 'general': return 'Geral';
      default: return category;
    }
  };

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
        <ErrorMessage error={error} onRetry={loadWellnessData} />
      </div>
    );
  }

  const trend = calculateTrend();

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

      {/* Wellness Trend */}
      {recentCheckins.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tendência de Bem-estar (7 dias)</h3>
            <div className="flex items-center space-x-2">
              {getTrendIcon(trend)}
              <span className="text-sm text-gray-600 capitalize">
                {trend === 'improving' ? 'Melhorando' :
                 trend === 'declining' ? 'Declinando' : 'Estável'}
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recentCheckins.reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="checkin_date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis domain={[1, 10]} />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
              />
              <Line type="monotone" dataKey="mood_rating" stroke="#3B82F6" name="Humor" />
              <Line type="monotone" dataKey="energy_level" stroke="#10B981" name="Energia" />
              <Line type="monotone" dataKey="stress_level" stroke="#F59E0B" name="Estresse" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Therapeutic Activities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Atividades Terapêuticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {therapeuticActivities.length > 0 ? (
            therapeuticActivities.slice(0, 6).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: therapeuticActivities.indexOf(activity) * 0.1 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                  <Badge variant="info" size="sm">{activity.difficulty_level}</Badge>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {activity.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {activity.duration_minutes} min
                  </span>
                  <Badge variant="default" size="sm">
                    {activity.category}
                  </Badge>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <FileText size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma atividade disponível</p>
            </div>
          )}
        </div>
      </Card>

      {/* Wellness Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recursos de Bem-estar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wellnessResources.slice(0, 6).map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wellnessResources.indexOf(resource) * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => {
                if (resource.content_url) {
                  window.open(resource.content_url, '_blank');
                }
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getContentIcon(resource.resource_type)}
                  <h4 className="font-medium text-gray-900 text-sm">{resource.title}</h4>
                </div>
                <Badge variant="info" size="sm">
                  {getContentTypeLabel(resource.resource_type)}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {resource.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="default" size="sm">
                  {getCategoryLabel(resource.category)}
                </Badge>
                {resource.tags.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {resource.tags.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {wellnessResources.length === 0 && (
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">Nenhum recurso disponível</p>
          </div>
        )}
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