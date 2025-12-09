import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Users, 
  AlertTriangle, 
  Calendar, 
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Plus,
  BarChart3,
  Heart,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  CheckSquare,
  ArrowRight,
  BookOpen as BookOpenIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  mentalHealthService, 
  PsychologySession, 
  SessionRequest, 
  MentalHealthAlert, 
  FormResponse,
  MentalHealthStats 
} from '../services/mentalHealth';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { getAvatarUrl, handleImageError } from '../utils/images';
import { Table } from '../components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const MentalHealthAdmin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Define time slots for scheduling
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];
  
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [recentSessions, setRecentSessions] = useState<PsychologySession[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<MentalHealthAlert[]>([]);
  const [highRiskResponses, setHighRiskResponses] = useState<FormResponse[]>([]);
  const [stats, setStats] = useState<MentalHealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MentalHealthAlert | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    session_type: 'presencial' as 'presencial' | 'online' | 'emergencial' | 'follow_up',
    location: '',
    meeting_link: ''
  });

  const [alertResolution, setAlertResolution] = useState({
    resolution_notes: ''
  });

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={16} /> },
    { id: 'requests', label: 'Solicitações', icon: <Calendar size={16} /> },
    { id: 'alerts', label: 'Alertas', icon: <AlertTriangle size={16} /> },
    { id: 'sessions', label: 'Sessões', icon: <Users size={16} /> }
  ];

  useEffect(() => {
    if (user && user.role === 'hr') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      const [requests, sessions, alerts, responses, statsData] = await Promise.all([
        mentalHealthService.getSessionRequests(),
        mentalHealthService.getSessions(),
        mentalHealthService.getAlerts(false),
        mentalHealthService.getFormResponses(),
        mentalHealthService.getMentalHealthStats()
      ]);

      setSessionRequests(requests || []);
      setRecentSessions(sessions?.slice(0, 10) || []);
      setActiveAlerts(alerts || []);
      setHighRiskResponses(responses?.filter(r => r.risk_level === 'alto' || r.risk_level === 'critico') || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await mentalHealthService.updateSessionRequest(requestId, {
        status: 'aceita',
        assigned_psychologist: user!.id,
        response_notes: 'Solicitação aceita. Agendamento será realizado em breve.'
      });
      
      const request = sessionRequests.find(r => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
        setShowScheduleModal(true);
      }
      
      loadAdminData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const scheduledDateTime = `${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}:00`;
      
      // Create the session
      await mentalHealthService.createSession({
        employee_id: selectedRequest.employee_id,
        psychologist_id: user!.id,
        scheduled_date: scheduledDateTime,
        status: 'agendada',
        duration_minutes: scheduleForm.duration_minutes,
        session_type: scheduleForm.session_type,
        urgency: selectedRequest.urgency,
        location: scheduleForm.location || undefined,
        meeting_link: scheduleForm.meeting_link || undefined
      });

      // Update request status
      await mentalHealthService.updateSessionRequest(selectedRequest.id, {
        status: 'agendada'
      });

      setShowScheduleModal(false);
      setSelectedRequest(null);
      setScheduleForm({
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        session_type: 'presencial',
        location: '',
        meeting_link: ''
      });

      loadAdminData();
    } catch (error) {
      console.error('Error scheduling session:', error);
    }
  };

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    try {
      await mentalHealthService.resolveAlert(selectedAlert.id, alertResolution.resolution_notes);
      
      setShowAlertModal(false);
      setSelectedAlert(null);
      setAlertResolution({ resolution_notes: '' });
      
      loadAdminData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const requestColumns = [
    {
      key: 'employee',
      label: 'Colaborador',
      render: (value: any) => (
        <div className="flex items-center space-x-2">
          <img
            src={getAvatarUrl(value?.avatar_url, value?.name)}
            alt={value?.name}
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => handleImageError(e, value?.name)}
          />
          <span className="font-medium">{value?.name}</span>
        </div>
      )
    },
    {
      key: 'urgency',
      label: 'Urgência',
      render: (value: string) => (
        <Badge variant={mentalHealthService.getUrgencyBadge(value)}>
          {value === 'normal' ? 'Normal' :
           value === 'prioritaria' ? 'Prioritária' : 'Emergencial'}
        </Badge>
      )
    },
    {
      key: 'preferred_type',
      label: 'Tipo',
      render: (value: string) => mentalHealthService.formatSessionType(value)
    },
    {
      key: 'created_at',
      label: 'Solicitado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: SessionRequest) => (
        <div className="flex space-x-2">
          {row.status === 'pendente' && (
            <Button
              size="sm"
              onClick={() => handleAcceptRequest(row.id)}
            >
              Aceitar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedRequest(row);
              // Show request details modal
            }}
          >
            <Eye size={14} />
          </Button>
        </div>
      )
    }
  ];

  const alertColumns = [
    {
      key: 'employee',
      label: 'Colaborador',
      render: (value: any) => (
        <div className="flex items-center space-x-2">
          <img
            src={getAvatarUrl(value?.avatar_url, value?.name)}
            alt={value?.name}
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => handleImageError(e, value?.name)}
          />
          <span className="font-medium">{value?.name}</span>
        </div>
      )
    },
    {
      key: 'severity',
      label: 'Severidade',
      render: (value: string) => (
        <Badge variant={mentalHealthService.getRiskLevelBadge(value)}>
          {value === 'baixo' ? 'Baixo' :
           value === 'medio' ? 'Médio' :
           value === 'alto' ? 'Alto' : 'Crítico'}
        </Badge>
      )
    },
    { key: 'title', label: 'Título' },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: MentalHealthAlert) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedAlert(row);
            setShowAlertModal(true);
          }}
        >
          Resolver
        </Button>
      )
    }
  ];

  if (!user || user.role !== 'hr') {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas usuários do RH podem acessar a área administrativa de saúde mental.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando dados administrativos..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administração - Saúde Mental</h1>
          <p className="text-gray-600 mt-1">Gestão do programa de bem-estar psicológico</p>
        </div>
        <ErrorMessage error={error} onRetry={loadAdminData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="mr-3 text-blue-500" size={28} />
            Administração - Saúde Mental
          </h1>
          <p className="text-gray-600 mt-1">Gestão do programa de bem-estar psicológico</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success" className="flex items-center space-x-1">
            <Shield size={14} />
            <span>Dados Protegidos</span>
          </Badge>
        </div>
      </div>

      {/* Portal do Psicólogo - Funcionalidades Completas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="mr-2 text-blue-500" size={20} />
          Portal do Psicólogo - Ferramentas Completas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Check-ins Emocionais',
              description: 'Acompanhar check-ins individuais dos colaboradores',
              icon: <Heart className="text-pink-500" size={24} />,
              path: '/mental-health/checkins',
              color: 'pink'
            },
            {
              title: 'Gestão de Sessões',
              description: 'Agendar e gerenciar sessões psicológicas',
              icon: <Calendar className="text-blue-500" size={24} />,
              path: '/mental-health/sessions',
              color: 'blue'
            },
            {
              title: 'Sistema de Alertas',
              description: 'Monitorar alertas de saúde mental em tempo real',
              icon: <AlertTriangle className="text-red-500" size={24} />,
              path: '/mental-health/alerts',
              color: 'red'
            },
            {
              title: 'Prontuários Digitais',
              description: 'Registros completos e confidenciais',
              icon: <FileText className="text-green-500" size={24} />,
              path: '/mental-health/record',
              color: 'green'
            },
            {
              title: 'Biblioteca Terapêutica',
              description: 'Recursos e materiais de apoio',
              icon: <BookOpenIcon className="text-purple-500" size={24} />,
              path: '/mental-health/library',
              color: 'purple'
            },
            {
              title: 'Formulários Psicológicos',
              description: 'Avaliações e questionários especializados',
              icon: <ClipboardList className="text-indigo-500" size={24} />,
              path: '/mental-health/forms',
              color: 'indigo'
            },
            {
              title: 'Tarefas Terapêuticas',
              description: 'Atribuir e acompanhar atividades',
              icon: <CheckSquare className="text-orange-500" size={24} />,
              path: '/mental-health/tasks',
              color: 'orange'
            },
            {
              title: 'Relatórios Identificados',
              description: 'Relatórios com dados individuais',
              icon: <BarChart3 className="text-teal-500" size={24} />,
              path: '/mental-health/analytics',
              color: 'teal'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(feature.path)}
              className={`p-4 rounded-lg border-2 border-transparent hover:border-${feature.color}-200 cursor-pointer transition-all duration-200 hover:shadow-md bg-gradient-to-br from-${feature.color}-50 to-white group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${feature.color}-100 group-hover:bg-${feature.color}-200 transition-colors`}>
                  {feature.icon}
                </div>
                <ArrowRight className={`text-${feature.color}-500 group-hover:translate-x-1 transition-transform`} size={16} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.total_employees_participating || 0}
                  </div>
                  <div className="text-sm text-gray-600">Participantes</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.average_mood_score?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Humor Médio</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.sessions_this_month || 0}
                  </div>
                  <div className="text-sm text-gray-600">Sessões/Mês</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.high_risk_responses || 0}
                  </div>
                  <div className="text-sm text-gray-600">Alto Risco</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.active_alerts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Alertas Ativos</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Priority Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" size={20} />
                Ações Prioritárias
              </h3>
              <div className="space-y-3">
                {sessionRequests.filter(r => r.urgency === 'emergencial').map((request) => (
                  <div key={request.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900">
                          Solicitação Emergencial - {request.employee?.name}
                        </p>
                        <p className="text-sm text-red-700">
                          {new Date(request.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        Atender
                      </Button>
                    </div>
                  </div>
                ))}
                
                {activeAlerts.filter(a => a.severity === 'critico').map((alert) => (
                  <div key={alert.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900">{alert.title}</p>
                        <p className="text-sm text-red-700">{alert.employee?.name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowAlertModal(true);
                        }}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}

                {sessionRequests.filter(r => r.urgency === 'emergencial').length === 0 && 
                 activeAlerts.filter(a => a.severity === 'critico').length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                    <p>Nenhuma ação prioritária no momento</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Solicitações Pendentes</h3>
              <div className="space-y-3">
                {sessionRequests.filter(r => r.status === 'pendente').slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{request.employee?.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant={mentalHealthService.getUrgencyBadge(request.urgency)} size="sm">
                          {request.urgency === 'normal' ? 'Normal' :
                           request.urgency === 'prioritaria' ? 'Prioritária' : 'Emergencial'}
                        </Badge>
                        <span>{mentalHealthService.formatSessionType(request.preferred_type)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Aceitar
                    </Button>
                  </div>
                ))}
                
                {sessionRequests.filter(r => r.status === 'pendente').length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma solicitação pendente</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {selectedTab === 'requests' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Solicitações de Sessão</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="danger">
                {sessionRequests.filter(r => r.urgency === 'emergencial').length} Emergenciais
              </Badge>
              <Badge variant="warning">
                {sessionRequests.filter(r => r.urgency === 'prioritaria').length} Prioritárias
              </Badge>
            </div>
          </div>
          <Table
            columns={requestColumns}
            data={sessionRequests}
            loading={loading}
            emptyMessage="Nenhuma solicitação encontrada"
          />
        </Card>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Alertas de Saúde Mental</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="danger">
                {activeAlerts.filter(a => a.severity === 'critico').length} Críticos
              </Badge>
              <Badge variant="warning">
                {activeAlerts.filter(a => a.severity === 'alto').length} Alto Risco
              </Badge>
            </div>
          </div>
          <Table
            columns={alertColumns}
            data={activeAlerts}
            loading={loading}
            emptyMessage="Nenhum alerta ativo"
          />
        </Card>
      )}

      {/* Schedule Session Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Agendar Sessão de Psicologia"
        size="lg"
      >
        <form onSubmit={handleScheduleSession} className="space-y-4">
          {selectedRequest && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Agendando para: {selectedRequest.employee?.name}
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Urgência:</strong> {selectedRequest.urgency}</p>
                <p><strong>Tipo preferido:</strong> {mentalHealthService.formatSessionType(selectedRequest.preferred_type)}</p>
                <p><strong>Motivo:</strong> {selectedRequest.reason}</p>
                {selectedRequest.preferred_times.length > 0 && (
                  <p><strong>Horários preferidos:</strong> {selectedRequest.preferred_times.join(', ')}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={scheduleForm.scheduled_date}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <Select
              label="Horário"
              value={scheduleForm.scheduled_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
              options={timeSlots.map(time => ({ value: time, label: time }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Duração"
              value={scheduleForm.duration_minutes.toString()}
              onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: parseInt(e.target.value) })}
              options={[
                { value: '30', label: '30 minutos' },
                { value: '60', label: '1 hora' },
                { value: '90', label: '1h 30min' }
              ]}
              required
            />
            <Select
              label="Tipo de Sessão"
              value={scheduleForm.session_type}
              onChange={(e) => setScheduleForm({ ...scheduleForm, session_type: e.target.value as any })}
              options={[
                { value: 'presencial', label: 'Presencial' },
                { value: 'online', label: 'Online' },
                { value: 'emergencial', label: 'Emergencial' },
                { value: 'follow_up', label: 'Follow-up' }
              ]}
              required
            />
          </div>

          {scheduleForm.session_type === 'presencial' && (
            <Input
              label="Local"
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
              placeholder="Ex: Sala de Psicologia - 2º andar"
            />
          )}

          {scheduleForm.session_type === 'online' && (
            <Input
              label="Link da Reunião"
              value={scheduleForm.meeting_link}
              onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          )}

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">📅 Informações do Agendamento</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• O colaborador receberá confirmação por email</li>
              <li>• Lembrete será enviado 24h antes da sessão</li>
              <li>• Você pode reagendar até 2h antes se necessário</li>
              <li>• Sessão será marcada como "agendada" automaticamente</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Calendar size={16} className="mr-2" />
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Alert Modal */}
      <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title="Resolver Alerta de Saúde Mental"
        size="md"
      >
        <form onSubmit={handleResolveAlert} className="space-y-4">
          {selectedAlert && (
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="text-red-500" size={20} />
                <h4 className="font-medium text-red-900">{selectedAlert.title}</h4>
              </div>
              <div className="text-sm text-red-800 space-y-1">
                <p><strong>Colaborador:</strong> {selectedAlert.employee?.name}</p>
                <p><strong>Severidade:</strong> {selectedAlert.severity}</p>
                <p><strong>Descrição:</strong> {selectedAlert.description}</p>
                <p><strong>Criado em:</strong> {new Date(selectedAlert.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          )}

          <Textarea
            label="Notas de Resolução"
            value={alertResolution.resolution_notes}
            onChange={(e) => setAlertResolution({ ...alertResolution, resolution_notes: e.target.value })}
            placeholder="Descreva as ações tomadas para resolver este alerta..."
            rows={4}
            required
          />

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Lembre-se:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Documente todas as ações tomadas</li>
              <li>• Considere agendar follow-up se necessário</li>
              <li>• Mantenha confidencialidade absoluta</li>
              <li>• Informe outros profissionais se autorizado</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAlertModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <CheckCircle size={16} className="mr-2" />
              Resolver Alerta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentalHealthAdmin;