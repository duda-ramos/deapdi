import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Heart,
  AlertTriangle,
  FileText,
  Activity,
  Download,
  Filter,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mentalHealthService, EmotionalCheckin, PsychologySession, MentalHealthAlert, FormResponse, TherapeuticActivity } from '../services/mentalHealth';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TimelineEvent {
  id: string;
  type: 'checkin' | 'session' | 'alert' | 'response' | 'activity';
  date: string;
  title: string;
  data: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface DigitalRecord {
  checkins: EmotionalCheckin[];
  sessions: PsychologySession[];
  alerts: MentalHealthAlert[];
  responses: FormResponse[];
  activities: TherapeuticActivity[];
  timeline: TimelineEvent[];
}

const PsychologicalRecord: React.FC = () => {
  const { user } = useAuth();
  const [record, setRecord] = useState<DigitalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);

  const periods = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: '365', label: 'Último ano' }
  ];

  const eventTypes = [
    { value: 'all', label: 'Todos os eventos' },
    { value: 'checkin', label: 'Check-ins emocionais' },
    { value: 'session', label: 'Sessões de psicologia' },
    { value: 'alert', label: 'Alertas' },
    { value: 'response', label: 'Formulários respondidos' },
    { value: 'activity', label: 'Atividades terapêuticas' }
  ];

  useEffect(() => {
    if (user) {
      loadDigitalRecord();
    }
  }, [user, selectedPeriod]);

  const loadDigitalRecord = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await mentalHealthService.getDigitalRecord(user.id);
      setRecord(data);
    } catch (error) {
      console.error('Error loading digital record:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar prontuário');
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeline = useMemo(() => {
    if (!record) return [];

    let filtered = record.timeline;

    // Filter by period
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    filtered = filtered.filter(event => new Date(event.date) >= cutoffDate);

    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedEventType);
    }

    return filtered;
  }, [record, selectedPeriod, selectedEventType]);

  const moodTrendData = useMemo(() => {
    if (!record) return [];

    const checkins = record.checkins
      .filter(c => {
        const days = parseInt(selectedPeriod);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return new Date(c.checkin_date) >= cutoffDate;
      })
      .sort((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime());

    return checkins.map(checkin => ({
      date: new Date(checkin.checkin_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      mood: checkin.mood_rating,
      stress: checkin.stress_level,
      energy: checkin.energy_level,
      sleep: checkin.sleep_quality
    }));
  }, [record, selectedPeriod]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'checkin': return <Heart className="text-green-500" size={16} />;
      case 'session': return <User className="text-blue-500" size={16} />;
      case 'alert': return <AlertTriangle className="text-red-500" size={16} />;
      case 'response': return <FileText className="text-purple-500" size={16} />;
      case 'activity': return <Activity className="text-orange-500" size={16} />;
      default: return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getEventColor = (type: string, severity?: string) => {
    if (type === 'alert') {
      switch (severity) {
        case 'critico': return 'border-red-200 bg-red-50';
        case 'alto': return 'border-orange-200 bg-orange-50';
        case 'medio': return 'border-yellow-200 bg-yellow-50';
        case 'baixo': return 'border-green-200 bg-green-50';
        default: return 'border-gray-200 bg-gray-50';
      }
    }

    switch (type) {
      case 'checkin': return 'border-green-200 bg-green-50';
      case 'session': return 'border-blue-200 bg-blue-50';
      case 'response': return 'border-purple-200 bg-purple-50';
      case 'activity': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critico': return <Badge variant="danger" size="sm">Crítico</Badge>;
      case 'alto': return <Badge variant="warning" size="sm">Alto</Badge>;
      case 'medio': return <Badge variant="info" size="sm">Médio</Badge>;
      case 'baixo': return <Badge variant="success" size="sm">Baixo</Badge>;
      default: return null;
    }
  };

  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateWellnessTrend = () => {
    if (!record || record.checkins.length < 2) return 'stable';

    const recent = record.checkins.slice(0, 7);
    const older = record.checkins.slice(7, 14);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, c) => sum + c.mood_rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + c.mood_rating, 0) / older.length;

    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  const handleExportPDF = async () => {
    // TODO: Implement PDF export functionality
    console.log('Exporting to PDF...');
    setShowExportModal(false);
  };

  if (loading) {
    return <LoadingScreen message="Carregando prontuário psicológico..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prontuário Psicológico</h1>
          <p className="text-gray-600 mt-1">Seu registro digital de bem-estar</p>
        </div>
        <ErrorMessage error={error} onRetry={loadDigitalRecord} />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prontuário Psicológico</h1>
          <p className="text-gray-600 mt-1">Seu registro digital de bem-estar</p>
        </div>
        <Card className="p-8 text-center">
          <Shield size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum registro encontrado</h3>
          <p className="text-gray-600">
            Ainda não há dados suficientes para exibir seu prontuário. Continue fazendo check-ins e participando das atividades.
          </p>
        </Card>
      </div>
    );
  }

  const wellnessTrend = calculateWellnessTrend();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 text-blue-500" size={28} />
            Prontuário Psicológico
          </h1>
          <p className="text-gray-600 mt-1">Seu registro digital de bem-estar e acompanhamento</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => setShowExportModal(true)}>
            <Download size={16} className="mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Access Control Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2 text-blue-800">
          <Shield size={16} />
          <span className="text-sm font-medium">
            Acesso restrito: Apenas você e a equipe de RH/Psicologia podem visualizar este prontuário.
          </span>
        </div>
      </Card>

      {/* Wellness Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{record.checkins.length}</div>
              <div className="text-sm text-gray-600">Check-ins</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{record.sessions.length}</div>
              <div className="text-sm text-gray-600">Sessões</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{record.responses.length}</div>
              <div className="text-sm text-gray-600">Formulários</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{record.activities.length}</div>
              <div className="text-sm text-gray-600">Atividades</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Wellness Trend Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tendência de Bem-estar</h3>
          <div className="flex items-center space-x-2">
            {wellnessTrend === 'improving' && (
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Melhorando</span>
              </div>
            )}
            {wellnessTrend === 'declining' && (
              <div className="flex items-center space-x-1 text-red-600">
                <TrendingDown size={16} />
                <span className="text-sm font-medium">Declinando</span>
              </div>
            )}
            {wellnessTrend === 'stable' && (
              <div className="flex items-center space-x-1 text-gray-600">
                <Minus size={16} />
                <span className="text-sm font-medium">Estável</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#22c55e" strokeWidth={2} name="Humor" />
              <Line type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} name="Estresse" />
              <Line type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} name="Energia" />
              <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} name="Sono" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Período"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periods}
          />
          <Select
            label="Tipo de Evento"
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            options={eventTypes}
          />
          <div className="flex items-end">
            <Button variant="secondary" className="w-full">
              <Filter size={16} className="mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Linha do Tempo</h3>
        
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600">
              Não há eventos para o período e filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTimeline.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getEventColor(event.type, event.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.severity && getSeverityBadge(event.severity)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatEventDate(event.date)}
                      </p>
                      
                      {/* Event-specific content */}
                      {event.type === 'checkin' && (
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center space-x-1">
                            <Heart size={14} className="text-green-500" />
                            <span>Humor: {event.data.mood_rating}/10</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Activity size={14} className="text-blue-500" />
                            <span>Energia: {event.data.energy_level}/10</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <AlertTriangle size={14} className="text-orange-500" />
                            <span>Estresse: {event.data.stress_level}/10</span>
                          </span>
                        </div>
                      )}
                      
                      {event.type === 'session' && (
                        <div className="text-sm text-gray-600">
                          <p><strong>Tipo:</strong> {mentalHealthService.formatSessionType(event.data.session_type)}</p>
                          <p><strong>Status:</strong> {mentalHealthService.formatSessionStatus(event.data.status)}</p>
                          {event.data.session_notes && (
                            <p className="mt-1 text-gray-700">{event.data.session_notes}</p>
                          )}
                        </div>
                      )}
                      
                      {event.type === 'alert' && (
                        <div className="text-sm text-gray-600">
                          <p>{event.data.description}</p>
                          {event.data.resolution_notes && (
                            <p className="mt-1 text-green-700">
                              <strong>Resolução:</strong> {event.data.resolution_notes}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {event.type === 'response' && (
                        <div className="text-sm text-gray-600">
                          <p><strong>Formulário:</strong> {event.data.form?.title}</p>
                          {event.data.score && (
                            <p><strong>Pontuação:</strong> {event.data.score}</p>
                          )}
                          {event.data.interpretation && (
                            <p className="mt-1 text-gray-700">{event.data.interpretation}</p>
                          )}
                        </div>
                      )}
                      
                      {event.type === 'activity' && (
                        <div className="text-sm text-gray-600">
                          <p><strong>Tipo:</strong> {event.data.type}</p>
                          <p><strong>Duração:</strong> {event.data.duration_minutes} minutos</p>
                          {event.data.instructions && (
                            <p className="mt-1 text-gray-700">{event.data.instructions}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {event.type === 'alert' && !event.data.resolved_at && (
                      <Badge variant="warning" size="sm">Ativo</Badge>
                    )}
                    {event.type === 'alert' && event.data.resolved_at && (
                      <Badge variant="success" size="sm">Resolvido</Badge>
                    )}
                    {event.type === 'session' && event.data.status === 'realizada' && (
                      <Badge variant="success" size="sm">Concluída</Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Exportar Prontuário</h3>
            <p className="text-gray-600 mb-4">
              Seu prontuário será exportado em formato PDF incluindo todos os dados do período selecionado.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExportPDF}>
                <Download size={16} className="mr-2" />
                Exportar PDF
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PsychologicalRecord;
