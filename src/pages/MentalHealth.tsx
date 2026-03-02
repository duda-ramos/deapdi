import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  AlertTriangle,
  Activity,
  BookOpen,
  Play,
  Headphones,
  FileText,
  BarChart3,
  ClipboardList,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { CheckInWidget } from '../components/mental-health/CheckInWidget';

const MentalHealth: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [requestForm, setRequestForm] = useState({
    urgency: 'normal' as 'normal' | 'prioritaria' | 'emergencial',
    preferred_type: 'presencial' as 'presencial' | 'online' | 'emergencial' | 'follow_up',
    reason: '',
    preferred_times: [] as string[]
  });

  // Memoized handler to prevent input focus loss
  const handleRequestFormChange = useCallback((field: string, value: string) => {
    setRequestForm(prev => ({ ...prev, [field]: value }));
  }, []);

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
      setError('');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="mr-2 sm:mr-3 text-pink-500" size={24} />
            Bem-estar Psicológico
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Cuide da sua saúde mental e bem-estar</p>
        </div>
        <div className="flex items-center">
          <Button onClick={() => setShowRequestModal(true)} variant="secondary" className="w-full sm:w-auto">
            <Calendar size={16} className="mr-2" />
            Solicitar Sessão
          </Button>
        </div>
      </div>

      {user && <CheckInWidget employeeId={user.id} />}

      {/* Mental Health Features Navigation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Heart className="mr-2 text-pink-500" size={20} />
          Recursos de Bem-estar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Registro Psicológico',
              description: 'Acompanhe seu progresso e histórico de bem-estar',
              icon: <FileText className="text-blue-500" size={24} />,
              path: '/mental-health/record',
              color: 'blue'
            },
            {
              title: 'Análises e Relatórios',
              description: 'Visualize insights sobre sua saúde mental',
              icon: <BarChart3 className="text-green-500" size={24} />,
              path: '/mental-health/analytics',
              color: 'green'
            },
            {
              title: 'Formulários',
              description: 'Avaliações e questionários personalizados',
              icon: <ClipboardList className="text-purple-500" size={24} />,
              path: '/mental-health/forms',
              color: 'purple'
            },
            {
              title: 'Tarefas e Atividades',
              description: 'Exercícios e atividades terapêuticas',
              icon: <CheckSquare className="text-orange-500" size={24} />,
              path: '/mental-health/tasks',
              color: 'orange'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(feature.path)}
              className={`p-4 rounded-lg border-2 border-transparent hover:border-${feature.color}-200 cursor-pointer transition-all duration-200 hover:shadow-md bg-gradient-to-br from-${feature.color}-50 to-white`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${feature.color}-100`}>
                  {feature.icon}
                </div>
                <Badge variant="default" size="sm">
                  Acessar
                </Badge>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
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
            onChange={(e) => handleRequestFormChange('urgency', e.target.value)}
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
            onChange={(e) => handleRequestFormChange('preferred_type', e.target.value)}
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
            onChange={(e) => handleRequestFormChange('reason', e.target.value)}
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
                    setRequestForm(prev => {
                      if (prev.preferred_times.includes(time)) {
                        return { ...prev, preferred_times: prev.preferred_times.filter(t => t !== time) };
                      } else if (prev.preferred_times.length < 3) {
                        return { ...prev, preferred_times: [...prev.preferred_times, time] };
                      }
                      return prev;
                    });
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