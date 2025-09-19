import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Calendar, CheckCircle, Clock, AlertTriangle, User, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementContext';
import { databaseService } from '../services/database';
import { ActionGroup, Profile, Task } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

const ActionGroups: React.FC = () => {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [groups, setGroups] = useState<ActionGroup[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ActionGroup | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    participants: [] as string[]
  });

  useEffect(() => {
    loadGroups();
    loadProfiles();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await databaseService.getActionGroups(user?.id);
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar grupos de ação');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await databaseService.getProfiles();
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newGroup = {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        status: 'active' as const,
        created_by: user.id
      };
      
      await databaseService.createActionGroup(newGroup);
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        participants: []
      });
      
      loadGroups();
      
      // Check for achievements after creating group
      setTimeout(() => {
        checkAchievements();
      }, 1000);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const getStatusColor = (status: ActionGroup['status']) => {
    switch (status) {
      case 'active':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ActionGroup['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ActionGroup['status']) => {
    switch (status) {
      case 'active':
        return <Clock size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <AlertTriangle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const profileOptions = profiles.map(profile => ({
    value: profile.id,
    label: profile.name
  }));

  if (loading) {
    return <LoadingScreen message="Carregando grupos de ação..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos de Ação</h1>
          <p className="text-gray-600 mt-1">Colabore em projetos e iniciativas estratégicas</p>
        </div>
        <ErrorMessage error={error} onRetry={loadGroups} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos de Ação</h1>
          <p className="text-gray-600 mt-1">Colabore em projetos e iniciativas estratégicas</p>
        </div>
        {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'hr') && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Novo Grupo
          </Button>
        )}
      </div>

      {/* Groups Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Grupos Ativos', count: groups.filter(g => g.status === 'active').length, color: 'bg-blue-500' },
          { label: 'Concluídos', count: groups.filter(g => g.status === 'completed').length, color: 'bg-green-500' },
          { label: 'Total', count: groups.length, color: 'bg-purple-500' }
        ].map((stat) => (
          <Card key={stat.label} className="p-3 md:p-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`} />
              <div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card className="p-6 md:p-8 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum grupo encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece criando seu primeiro grupo de ação colaborativo.
          </p>
          {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'hr') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={20} className="mr-2" />
              Criar Primeiro Grupo
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groups.indexOf(group) * 0.1 }}
            >
              <Card className="p-4 md:p-6 h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                setSelectedGroup(group);
                setShowDetailsModal(true);
              }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {group.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {group.description}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(group.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(group.status)}
                      <span>{getStatusLabel(group.status)}</span>
                    </div>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Prazo: {new Date(group.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users size={16} className="mr-2" />
                    <span>{group.participants?.length || 0} participantes</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Target size={16} className="mr-2" />
                    <span>{group.tasks?.length || 0} tarefas</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Novo Grupo de Ação"
        size="lg"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Título do Grupo"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Projeto de Melhoria de Processos"
            required
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva os objetivos e escopo do grupo..."
            rows={4}
            required
          />

          <Input
            label="Prazo"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informações sobre Grupos de Ação</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Você será automaticamente definido como líder do grupo</li>
              <li>• Participantes podem ser adicionados após a criação</li>
              <li>• Tarefas podem ser atribuídas aos membros</li>
              <li>• Progresso é acompanhado em tempo real</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Criar Grupo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Group Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedGroup?.title || ''}
        size="xl"
      >
        {selectedGroup && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
              <p className="text-gray-600">{selectedGroup.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informações</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={getStatusColor(selectedGroup.status)}>
                      {getStatusLabel(selectedGroup.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prazo:</span>
                    <span>{new Date(selectedGroup.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Criado em:</span>
                    <span>{new Date(selectedGroup.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Participantes</h4>
                <div className="space-y-2">
                  {selectedGroup.participants && selectedGroup.participants.length > 0 ? (
                    selectedGroup.participants.map((participant: any) => (
                      <div key={participant.id} className="flex items-center space-x-2">
                        <img
                          src={participant.profile?.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
                          alt={participant.profile?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm">
                          {participant.profile?.name} 
                          {participant.role === 'leader' && ' (Líder)'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum participante adicionado ainda</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tarefas</h4>
              <div className="space-y-2">
                {selectedGroup.tasks && selectedGroup.tasks.length > 0 ? (
                  selectedGroup.tasks.map((task: any) => (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex items-center space-x-3">
                        {task.status === 'done' ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : task.status === 'in-progress' ? (
                          <Clock size={16} className="text-blue-500" />
                        ) : (
                          <AlertTriangle size={16} className="text-gray-500" />
                        )}
                        <span className="text-sm">{task.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {task.status === 'done' ? 'Concluída' :
                         task.status === 'in-progress' ? 'Em progresso' : 'Pendente'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma tarefa criada ainda</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActionGroups;