import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mentorshipService, MentorshipRelation, MentorshipSession } from '../services/mentorship';
import { Profile } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

const Mentorship: React.FC = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<MentorshipRelation[]>([]);
  const [availableMentors, setAvailableMentors] = useState<Profile[]>([]);
  const [selectedMentorship, setSelectedMentorship] = useState<MentorshipRelation | null>(null);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    mentorId: '',
    message: ''
  });
  const [sessionForm, setSessionForm] = useState({
    sessionDate: '',
    durationMinutes: 60,
    topicsDiscussed: '',
    actionItems: '',
    mentorFeedback: '',
    menteeFeedback: ''
  });

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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorship) return;

    try {
      await mentorshipService.createSession({
        mentorship_id: selectedMentorship.id,
        session_date: sessionForm.sessionDate,
        duration_minutes: sessionForm.durationMinutes,
        topics_discussed: sessionForm.topicsDiscussed,
        action_items: sessionForm.actionItems,
        mentor_feedback: sessionForm.mentorFeedback || undefined,
        mentee_feedback: sessionForm.menteeFeedback || undefined
      });

      setShowSessionModal(false);
      setSessionForm({
        sessionDate: '',
        durationMinutes: 60,
        topicsDiscussed: '',
        actionItems: '',
        mentorFeedback: '',
        menteeFeedback: ''
      });
      
      if (selectedMentorship) {
        loadSessions(selectedMentorship.id);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: MentorshipRelation['status']) => {
    try {
      await mentorshipService.updateMentorshipStatus(id, status);
      loadMentorships();
    } catch (error) {
      console.error('Error updating mentorship status:', error);
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

  const mentorOptions = availableMentors.map(mentor => ({
    value: mentor.id,
    label: `${mentor.name} - ${mentor.position}`
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
                {sessions.length}
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
            Nenhuma mentoria encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Comece solicitando mentoria com um especialista.
          </p>
          <Button onClick={() => setShowRequestModal(true)}>
            <Plus size={20} className="mr-2" />
            Solicitar Primeira Mentoria
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
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                setSelectedMentorship(mentorship);
                loadSessions(mentorship.id);
              }}>
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
                    </div>
                  </div>
                  <Badge variant={getStatusColor(mentorship.status)}>
                    {getStatusLabel(mentorship.status)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
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

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {sessions.length} sessões realizadas
                  </div>
                  <div className="flex space-x-2">
                    {mentorship.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMentorship(mentorship);
                            setShowSessionModal(true);
                          }}
                        >
                          <Plus size={14} className="mr-1" />
                          Sessão
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(mentorship.id, 'completed');
                          }}
                        >
                          Concluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

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
            value={requestForm.mentorId}
            onChange={(e) => setRequestForm({ ...requestForm, mentorId: e.target.value })}
            options={mentorOptions}
            placeholder="Selecione um mentor"
            required
          />

          <Textarea
            label="Mensagem"
            value={requestForm.message}
            onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
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

      {/* Create Session Modal */}
      <Modal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        title="Nova Sessão de Mentoria"
        size="lg"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data da Sessão"
              type="datetime-local"
              value={sessionForm.sessionDate}
              onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
              required
            />
            <Input
              label="Duração (minutos)"
              type="number"
              value={sessionForm.durationMinutes}
              onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: parseInt(e.target.value) })}
              min="15"
              max="180"
              required
            />
          </div>

          <Textarea
            label="Tópicos Discutidos"
            value={sessionForm.topicsDiscussed}
            onChange={(e) => setSessionForm({ ...sessionForm, topicsDiscussed: e.target.value })}
            placeholder="Quais assuntos foram abordados na sessão?"
            rows={3}
            required
          />

          <Textarea
            label="Itens de Ação"
            value={sessionForm.actionItems}
            onChange={(e) => setSessionForm({ ...sessionForm, actionItems: e.target.value })}
            placeholder="Quais ações foram definidas para o próximo período?"
            rows={3}
            required
          />

          {user?.role === 'manager' || user?.role === 'admin' ? (
            <Textarea
              label="Feedback do Mentor"
              value={sessionForm.mentorFeedback}
              onChange={(e) => setSessionForm({ ...sessionForm, mentorFeedback: e.target.value })}
              placeholder="Observações e feedback do mentor..."
              rows={2}
            />
          ) : (
            <Textarea
              label="Feedback do Mentee"
              value={sessionForm.menteeFeedback}
              onChange={(e) => setSessionForm({ ...sessionForm, menteeFeedback: e.target.value })}
              placeholder="Como foi a sessão? O que você aprendeu?"
              rows={2}
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSessionModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Sessão
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Mentorship;