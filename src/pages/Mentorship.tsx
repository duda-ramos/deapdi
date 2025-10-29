import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Calendar, 
  MessageCircle, 
  Star,
  Clock,
  CheckCircle,
  User,
  Target,
  Video,
  Phone,
  Mail,
  Award,
  TrendingUp,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mentorshipService, MentorshipRelation, MentorshipSession, MentorWithStats, MentorRating } from '../services/mentorship';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { LoadingScreen } from '../components/ui/LoadingScreen';

const Mentorship: React.FC = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<MentorshipRelation[]>([]);
  const [availableMentors, setAvailableMentors] = useState<MentorWithStats[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [selectedMentorship, setSelectedMentorship] = useState<MentorshipRelation | null>(null);
  const [selectedSession, setSelectedSession] = useState<MentorshipSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);

  const [requestForm, setRequestForm] = useState({
    mentorId: '',
    message: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    duration: 60,
    meetingLink: ''
  });

  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: ''
  });

  // Memoized handlers to prevent input focus loss
  const handleRequestFormChange = useCallback((field: 'mentorId' | 'message', value: string) => {
    setRequestForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleScheduleFormChange = useCallback((field: 'date' | 'time' | 'duration' | 'meetingLink', value: string | number) => {
    setScheduleForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRatingFormChange = useCallback((field: 'rating' | 'comment', value: string | number) => {
    setRatingForm(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (user) {
      loadMentorships();
      loadAvailableMentors();
    }
  }, [user]);

  const loadMentorships = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await mentorshipService.getMentorships(user.id);
      setMentorships(data || []);
    } catch (error) {
      console.error('Error loading mentorships:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMentors = async () => {
    try {
      const mentors = await mentorshipService.getAvailableMentors();
      setAvailableMentors(mentors || []);
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const loadSessions = async (mentorshipId: string) => {
    try {
      const data = await mentorshipService.getSessions(mentorshipId);
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleRequestMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await mentorshipService.requestMentorship(
        user.id,
        requestForm.mentorId,
        requestForm.message
      );
      
      setShowRequestModal(false);
      setRequestForm({ mentorId: '', message: '' });
      loadMentorships();
    } catch (error) {
      console.error('Error requesting mentorship:', error);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorship) return;

    try {
      const scheduledStart = `${scheduleForm.date}T${scheduleForm.time}:00`;
      
      await mentorshipService.scheduleSession({
        mentorship_id: selectedMentorship.id,
        scheduled_start: scheduledStart,
        duration_minutes: scheduleForm.duration,
        meeting_link: scheduleForm.meetingLink || undefined
      });

      setShowScheduleModal(false);
      setScheduleForm({
        date: '',
        time: '',
        duration: 60,
        meetingLink: ''
      });
      
      if (selectedMentorship) {
        loadSessions(selectedMentorship.id);
      }
    } catch (error) {
      console.error('Error scheduling session:', error);
    }
  };

  const handleCompleteSession = async (sessionId: string, notes?: string) => {
    try {
      await mentorshipService.completeSession(sessionId, notes);
      
      if (selectedMentorship) {
        loadSessions(selectedMentorship.id);
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleRateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !selectedMentorship) return;

    try {
      await mentorshipService.rateMentor(
        selectedSession.id,
        selectedMentorship.mentor_id,
        selectedMentorship.mentee_id,
        ratingForm.rating,
        ratingForm.comment
      );

      setShowRatingModal(false);
      setRatingForm({ rating: 5, comment: '' });
      setSelectedSession(null);
    } catch (error) {
      console.error('Error rating mentor:', error);
    }
  };

  const getStatusColor = (status: MentorshipRelation['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: MentorshipRelation['status']) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'paused': return 'Pausado';
      default: return status;
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no_show': return 'warning';
      default: return 'default';
    }
  };

  const getSessionStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'completed': return 'Realizada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'Não Compareceu';
      default: return status;
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={() => interactive && onChange && onChange(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  const mentorOptions = availableMentors.map(mentor => ({
    value: mentor.id,
    label: `${mentor.name} - ${mentor.position} (⭐ ${mentor.average_rating.toFixed(1)})`
  }));

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ].map(time => ({ value: time, label: time }));

  const durationOptions = [
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1h 30min' }
  ];

  if (loading) {
    return <LoadingScreen message="Carregando mentorias..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentoria</h1>
          <p className="text-gray-600 mt-1">Conecte-se com mentores e acelere seu desenvolvimento</p>
        </div>
        <Button onClick={() => setShowRequestModal(true)}>
          <Plus size={20} className="mr-2" />
          Solicitar Mentoria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {mentorships.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Mentorias Ativas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {mentorships.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Sessões Realizadas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {availableMentors.length}
              </div>
              <div className="text-sm text-gray-600">Mentores Disponíveis</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mentorships List */}
      {mentorships.length === 0 ? (
        <Card className="p-8 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acelere seu desenvolvimento com mentoria!
          </h3>
          <p className="text-gray-600 mb-4">
            Conecte-se com mentores experientes para acelerar seu crescimento profissional.
          </p>
          <Button onClick={() => setShowRequestModal(true)}>
            <Plus size={20} className="mr-2" />
            Solicitar Mentoria
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mentorships.map((mentorship, index) => (
            <motion.div
              key={mentorship.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={mentorship.mentor?.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
                      alt={mentorship.mentor?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {mentorship.mentor?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mentorship.mentor?.position}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">4.8 (12 avaliações)</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(mentorship.status)}>
                    {getStatusLabel(mentorship.status)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>Iniciado em: {new Date(mentorship.started_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {mentorship.notes && (
                    <div className="flex items-start">
                      <MessageCircle size={16} className="mr-2 mt-0.5" />
                      <span>{mentorship.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedMentorship(mentorship);
                      loadSessions(mentorship.id);
                    }}
                  >
                    Ver Sessões
                  </Button>
                  
                  {mentorship.status === 'active' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMentorship(mentorship);
                          setShowScheduleModal(true);
                        }}
                      >
                        <Calendar size={14} className="mr-1" />
                        Agendar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Available Mentors */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mentores Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableMentors.slice(0, 6).map((mentor) => (
            <div key={mentor.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={mentor.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
                  alt={mentor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{mentor.name}</h4>
                  <p className="text-sm text-gray-600">{mentor.position}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avaliação:</span>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span>{mentor.average_rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sessões:</span>
                  <span>{mentor.total_sessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Disponibilidade:</span>
                  <Badge variant="success" size="sm">
                    {mentor.available_slots.length} slots
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  handleRequestFormChange('mentorId', mentor.id);
                  setShowRequestModal(true);
                }}
              >
                Solicitar Mentoria
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Request Mentorship Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Solicitar Mentoria"
        size="lg"
      >
        <form onSubmit={handleRequestMentorship} className="space-y-4">
          <Select
            label="Mentor"
            value={requestForm.mentorId || ''}
            onChange={(e) => handleRequestFormChange('mentorId', e.target.value)}
            options={mentorOptions}
            placeholder="Selecione um mentor"
            required
          />

          <Textarea
            label="Mensagem"
            value={requestForm.message || ''}
            onChange={(e) => handleRequestFormChange('message', e.target.value)}
            placeholder="Descreva seus objetivos e o que espera da mentoria..."
            rows={4}
            required
          />

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona a mentoria?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• O mentor receberá sua solicitação e poderá aceitar ou recusar</li>
              <li>• Após aceita, vocês podem agendar sessões regulares</li>
              <li>• Cada sessão é documentada com tópicos e ações</li>
              <li>• Você pode avaliar o mentor após cada sessão</li>
              <li>• A mentoria pode ser pausada ou concluída a qualquer momento</li>
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
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Session Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Agendar Sessão de Mentoria"
        size="lg"
      >
        <form onSubmit={handleScheduleSession} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Agendando com: {selectedMentorship?.mentor?.name}
            </h4>
            <p className="text-sm text-blue-800">
              {selectedMentorship?.mentor?.position}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={scheduleForm.date || ''}
              onChange={(e) => handleScheduleFormChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <Select
              label="Horário"
              value={scheduleForm.time || ''}
              onChange={(e) => handleScheduleFormChange('time', e.target.value)}
              options={timeSlots}
              placeholder="Selecione o horário"
              required
            />
          </div>

          <Select
            label="Duração"
            value={scheduleForm.duration.toString()}
            onChange={(e) => handleScheduleFormChange('duration', parseInt(e.target.value))}
            options={durationOptions.map(d => ({ value: d.value.toString(), label: d.label }))}
            required
          />

          <Input
            label="Link da Reunião (Opcional)"
            value={scheduleForm.meetingLink || ''}
            onChange={(e) => handleScheduleFormChange('meetingLink', e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
          />

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">📅 Informações do Agendamento</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Ambos receberão notificação por email</li>
              <li>• Você pode cancelar até 2 horas antes</li>
              <li>• Após a sessão, você poderá avaliar o mentor</li>
              <li>• Link da reunião será enviado por email</li>
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
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sessions List Modal */}
      <Modal
        isOpen={!!selectedMentorship && !showScheduleModal}
        onClose={() => {
          setSelectedMentorship(null);
          setSessions([]);
        }}
        title={`Sessões com ${selectedMentorship?.mentor?.name}`}
        size="xl"
      >
        {selectedMentorship && (
          <div className="space-y-6">
            {/* Mentorship Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedMentorship.mentor?.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
                    alt={selectedMentorship.mentor?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedMentorship.mentor?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedMentorship.mentor?.position}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">4.8 (12 avaliações)</span>
                    </div>
                  </div>
                </div>
                {selectedMentorship.status === 'active' && (
                  <Button
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Calendar size={16} className="mr-2" />
                    Nova Sessão
                  </Button>
                )}
              </div>
            </div>

            {/* Sessions History */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Histórico de Sessões</h4>
              {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma sessão agendada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-gray-900">
                              {session.scheduled_start 
                                ? new Date(session.scheduled_start).toLocaleDateString('pt-BR')
                                : new Date(session.session_date).toLocaleDateString('pt-BR')
                              }
                            </h5>
                            <Badge variant={getSessionStatusColor(session.status)} size="sm">
                              {getSessionStatusLabel(session.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              {session.duration_minutes} min
                            </span>
                            {session.scheduled_start && (
                              <span>
                                {new Date(session.scheduled_start).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {session.status === 'scheduled' && (
                            <>
                              {session.meeting_link && (
                                <Button size="sm" variant="secondary">
                                  <Video size={14} className="mr-1" />
                                  Entrar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleCompleteSession(session.id)}
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Concluir
                              </Button>
                            </>
                          )}
                          
                          {session.status === 'completed' && user?.id === selectedMentorship.mentee_id && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowRatingModal(true);
                              }}
                            >
                              <Star size={14} className="mr-1" />
                              Avaliar
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSession(session);
                              setShowSessionDetailsModal(true);
                            }}
                          >
                            <MessageCircle size={14} />
                          </Button>
                        </div>
                      </div>

                      {session.topics_discussed && (
                        <div className="text-sm">
                          <span className="text-gray-600">Tópicos: </span>
                          <span className="text-gray-900">{session.topics_discussed}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Rate Mentor Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Avaliar Mentor"
        size="md"
      >
        <form onSubmit={handleRateMentor} className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">
              Como foi sua sessão com {selectedMentorship?.mentor?.name}?
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Sua avaliação ajuda outros colegas a escolherem mentores
            </p>
          </div>

          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avaliação Geral
            </label>
            {renderStars(ratingForm.rating, true, (rating) => 
              handleRatingFormChange('rating', rating)
            )}
            <p className="text-sm text-gray-600 mt-2">
              {ratingForm.rating === 5 ? 'Excelente!' :
               ratingForm.rating === 4 ? 'Muito Bom' :
               ratingForm.rating === 3 ? 'Bom' :
               ratingForm.rating === 2 ? 'Regular' : 'Precisa Melhorar'}
            </p>
          </div>

          <Textarea
            label="Comentário (Opcional)"
            value={ratingForm.comment || ''}
            onChange={(e) => handleRatingFormChange('comment', e.target.value)}
            placeholder="Compartilhe sua experiência com outros colegas..."
            rows={3}
          />

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Dicas para Avaliação</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Considere a qualidade do feedback recebido</li>
              <li>• Avalie a pontualidade e preparação</li>
              <li>• Pense na clareza das orientações</li>
              <li>• Considere o suporte oferecido</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRatingModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Enviar Avaliação
            </Button>
          </div>
        </form>
      </Modal>

      {/* Session Details Modal */}
      <Modal
        isOpen={showSessionDetailsModal}
        onClose={() => {
          setShowSessionDetailsModal(false);
          setSelectedSession(null);
        }}
        title="Detalhes da Sessão"
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Horário</label>
                <p className="text-gray-900">
                  {selectedSession.scheduled_start 
                    ? new Date(selectedSession.scheduled_start).toLocaleString('pt-BR')
                    : new Date(selectedSession.session_date).toLocaleDateString('pt-BR')
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                <p className="text-gray-900">{selectedSession.duration_minutes} minutos</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Badge variant={getSessionStatusColor(selectedSession.status)}>
                {getSessionStatusLabel(selectedSession.status)}
              </Badge>
            </div>

            {selectedSession.meeting_link && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link da Reunião</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={selectedSession.meeting_link}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => window.open(selectedSession.meeting_link, '_blank')}
                  >
                    <Video size={14} className="mr-1" />
                    Abrir
                  </Button>
                </div>
              </div>
            )}

            {selectedSession.topics_discussed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tópicos Discutidos</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedSession.topics_discussed}
                </p>
              </div>
            )}

            {selectedSession.action_items && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Itens de Ação</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedSession.action_items}
                </p>
              </div>
            )}

            {selectedSession.mentor_feedback && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback do Mentor</label>
                <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                  {selectedSession.mentor_feedback}
                </p>
              </div>
            )}

            {selectedSession.mentee_feedback && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback do Mentee</label>
                <p className="text-gray-900 bg-green-50 p-3 rounded-lg">
                  {selectedSession.mentee_feedback}
                </p>
              </div>
            )}

            {selectedSession.session_notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas da Sessão</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedSession.session_notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Mentorship;