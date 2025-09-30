import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Calendar, CheckCircle, Clock, AlertTriangle, User, Target, CreditCard as Edit, Trash2, UserPlus, UserMinus, BarChart3, Award, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementContext';
import { actionGroupService, GroupWithDetails, CreateGroupData, CreateTaskData, MemberContribution } from '../services/actionGroups';
import { databaseService } from '../services/database';
import { Profile, PDI } from '../types';
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

const ActionGroups: React.FC = () => {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userPDIs, setUserPDIs] = useState<PDI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  const [creating, setCreating] = useState(false);

  const [groupForm, setGroupForm] = useState<CreateGroupData>({
    title: '',
    description: '',
    deadline: '',
    participants: [],
    linked_pdi_id: ''
  });

  const [taskForm, setTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    assignee_id: '',
    deadline: '',
    group_id: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load groups with full details
      const groups = await actionGroupService.getActionGroups();
      setGroups(groups);
      
      // Load profiles and PDIs separately
      try {
        const profilesData = await databaseService.getProfiles();
        setProfiles(profilesData || []);
      } catch (profileError) {
        console.error('Erro ao carregar profiles:', profileError);
        setProfiles([]);
      }
      
      if (user) {
        try {
          const pdisData = await databaseService.getPDIs(user.id);
          setUserPDIs(pdisData || []);
        } catch (pdiError) {
          console.error('Erro ao carregar PDIs:', pdiError);
          setUserPDIs([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setGroups([]);
      
      // Provide specific error message for RLS recursion
      if (error instanceof Error && error.message.includes('SUPABASE_RLS_RECURSION')) {
        setError('⚠️ Problema de configuração detectado: As políticas de segurança da tabela action_groups no Supabase estão causando recursão infinita. Para resolver: 1) Acesse o Supabase SQL Editor, 2) Execute: ALTER TABLE action_groups DISABLE ROW LEVEL SECURITY; 3) Ou corrija as políticas RLS recursivas.');
      } else {
        setError('Erro ao carregar grupos de ação');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setCreating(true);
      await actionGroupService.createGroup(groupForm, user.id);
      
      setShowCreateModal(false);
      setGroupForm({
        title: '',
        description: '',
        deadline: '',
        participants: [],
        linked_pdi_id: ''
      });
      
      await loadData();
      
      // Check for achievements after creating group
      setTimeout(() => {
        checkAchievements();
      }, 1000);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar grupo');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      await actionGroupService.createTask({
        ...taskForm,
        group_id: selectedGroup.id
      });
      
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        assignee_id: '',
        deadline: '',
        group_id: ''
      });
      
      await loadData();
      
      // Trigger will automatically create notification for assignee
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'todo' | 'in-progress' | 'done') => {
    try {
      await actionGroupService.updateTask(taskId, { status });
      await loadData();
      
      // Check for achievements after completing task
      if (status === 'done') {
        setTimeout(() => {
          checkAchievements();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleCompleteGroup = async (groupId: string) => {
    try {
      await actionGroupService.completeGroup(groupId);
      await loadData();
      
      // Check for achievements after completing group
      setTimeout(() => {
        checkAchievements();
      }, 1000);
      
      // Check for career progression after group completion
      setTimeout(async () => {
        try {
          const { careerTrackService } = await import('../services/careerTrack');
          await careerTrackService.checkProgression(user.id);
        } catch (error) {
          console.error('Error checking career progression:', error);
        }
      }, 1500);
    } catch (error) {
      console.error('Erro ao concluir grupo:', error);
    }
  };

  const handleAddParticipant = async (groupId: string, profileId: string) => {
    try {
      await actionGroupService.addParticipant(groupId, profileId, 'member');
      await loadData();
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
    }
  };

  const handleRemoveParticipant = async (groupId: string, profileId: string) => {
    try {
      await actionGroupService.removeParticipant(groupId, profileId);
      await loadData();
    } catch (error) {
      console.error('Erro ao remover participante:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <AlertTriangle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-gray-500';
      case 'in-progress': return 'text-blue-500';
      case 'done': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const canManageGroup = (group: GroupWithDetails) => {
    if (!user) return false;
    
    // Creator can manage
    if (group.created_by === user.id) return true;
    
    // Leaders can manage
    const userParticipant = group.participants?.find(p => p.profile_id === user.id);
    if (userParticipant?.role === 'leader') return true;
    
    // Managers/HR/Admin can manage
    if (['manager', 'hr', 'admin'].includes(user.role)) return true;
    
    return false;
  };

  const profileOptions = profiles.map(profile => ({
    value: profile.id,
    label: `${profile.name} - ${profile.position}`
  }));

  const pdiOptions = userPDIs
    .filter(pdi => pdi.status === 'in-progress')
    .map(pdi => ({
      value: pdi.id,
      label: pdi.title
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
        <ErrorMessage error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos de Ação</h1>
          <p className="text-gray-600 mt-1">Colabore em projetos e iniciativas estratégicas</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={loadData}
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'hr') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={20} className="mr-2" />
              Novo Grupo
            </Button>
          )}
        </div>
      </div>

      {/* Groups Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Grupos Ativos', count: groups.filter(g => g.status === 'active').length, color: 'bg-blue-500' },
          { label: 'Concluídos', count: groups.filter(g => g.status === 'completed').length, color: 'bg-green-500' },
          { label: 'Participações', count: groups.filter(g => g.participants?.some(p => p.profile_id === user?.id)).length, color: 'bg-purple-500' },
          { label: 'Total', count: groups.length, color: 'bg-orange-500' }
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
            Colabore em projetos incríveis!
          </h3>
          <p className="text-gray-600 mb-4">
            Os grupos de ação aparecerão aqui. Colabore com colegas em projetos e iniciativas estratégicas.
          </p>
          {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'hr') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={20} className="mr-2" />
              Criar Grupo de Ação
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
              <Card className="p-4 md:p-6 h-full hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {group.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={getStatusColor(group.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(group.status)}
                        <span>{getStatusLabel(group.status)}</span>
                      </div>
                    </Badge>
                    {canManageGroup(group) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                    )}
                  </div>
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
                    <span>{group.completed_tasks || 0}/{group.total_tasks || 0} tarefas concluídas</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium">{(group.progress || 0).toFixed(1)}%</span>
                    </div>
                    <ProgressBar 
                      progress={group.progress || 0} 
                      color="blue"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowDetailsModal(true);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                    {canManageGroup(group) && group.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setTaskForm(prev => ({ ...prev, group_id: group.id }));
                            setShowTaskModal(true);
                          }}
                        >
                          <Plus size={14} className="mr-1" />
                          Tarefa
                        </Button>
                        {group.progress === 100 && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleCompleteGroup(group.id)}
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Concluir
                          </Button>
                        )}
                      </>
                    )}
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
            value={groupForm.title}
            onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
            placeholder="Ex: Projeto de Melhoria de Processos"
            required
          />

          <Textarea
            label="Descrição"
            value={groupForm.description}
            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
            placeholder="Descreva os objetivos e escopo do grupo..."
            rows={4}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prazo"
              type="date"
              value={groupForm.deadline}
              onChange={(e) => setGroupForm({ ...groupForm, deadline: e.target.value })}
              required
            />

            <Select
              label="Vincular ao PDI (Opcional)"
              value={groupForm.linked_pdi_id}
              onChange={(e) => setGroupForm({ ...groupForm, linked_pdi_id: e.target.value })}
              options={pdiOptions}
              placeholder="Selecione um PDI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participantes
            </label>
            <div className="space-y-2">
              {profiles.filter(p => p.id !== user?.id).map((profile) => (
                <div key={profile.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={groupForm.participants.includes(profile.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGroupForm(prev => ({
                          ...prev,
                          participants: [...prev.participants, profile.id]
                        }));
                      } else {
                        setGroupForm(prev => ({
                          ...prev,
                          participants: prev.participants.filter(id => id !== profile.id)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <img
                    src={profile.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
                    alt={profile.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-sm font-medium">{profile.name}</span>
                    <span className="text-xs text-gray-500 block">{profile.position}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informações sobre Grupos de Ação</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Você será automaticamente definido como líder do grupo</li>
              <li>• Participantes podem ser adicionados/removidos após criação</li>
              <li>• Tarefas podem ser atribuídas aos membros</li>
              <li>• Progresso é calculado automaticamente</li>
              <li>• Grupo vinculado ao PDI será marcado como concluído automaticamente</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Criar Grupo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Criar Nova Tarefa"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Título da Tarefa"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Ex: Revisar documentação do processo"
            required
          />

          <Textarea
            label="Descrição (Opcional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Detalhes sobre a tarefa..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Responsável"
              value={taskForm.assignee_id}
              onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
              options={selectedGroup?.participants?.map(p => ({
                value: p.profile_id,
                label: p.profile.name
              })) || []}
              placeholder="Selecione o responsável"
              required
            />

            <Input
              label="Prazo"
              type="date"
              value={taskForm.deadline}
              onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTaskModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Criar Tarefa
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
            {/* Group Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informações do Grupo</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Descrição:</span>
                    <p className="text-gray-900">{selectedGroup.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">
                        <Badge variant={getStatusColor(selectedGroup.status)}>
                          {getStatusLabel(selectedGroup.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Progresso:</span>
                      <div className="mt-1">
                        <ProgressBar 
                          progress={selectedGroup.progress || 0} 
                          color="blue"
                          showLabel
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Prazo:</span>
                      <p className="text-gray-900">{new Date(selectedGroup.deadline).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Criado em:</span>
                      <p className="text-gray-900">{new Date(selectedGroup.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Participantes</h4>
                  {canManageGroup(selectedGroup) && (
                    <Button size="sm" variant="ghost">
                      <UserPlus size={14} />
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedGroup.participants && selectedGroup.participants.length > 0 ? (
                    selectedGroup.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <img
                            src={participant.profile?.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
                            alt={participant.profile?.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-sm font-medium">
                              {participant.profile?.name}
                            </span>
                            {participant.role === 'leader' && (
                              <Badge variant="warning" size="sm" className="ml-2">Líder</Badge>
                            )}
                          </div>
                        </div>
                        {canManageGroup(selectedGroup) && participant.profile_id !== user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveParticipant(selectedGroup.id, participant.profile_id)}
                          >
                            <UserMinus size={12} />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum participante adicionado ainda</p>
                  )}
                </div>
              </div>
            </div>

            {/* Member Contributions */}
            {selectedGroup.member_contributions && selectedGroup.member_contributions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <BarChart3 size={16} className="mr-2" />
                  Contribuições por Membro
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedGroup.member_contributions.map((contribution) => (
                    <div key={contribution.profile_id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={contribution.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
                          alt={contribution.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{contribution.name}</span>
                          {contribution.role === 'leader' && (
                            <Badge variant="warning" size="sm" className="ml-2">Líder</Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tarefas:</span>
                          <span>{contribution.completed_tasks}/{contribution.total_tasks}</span>
                        </div>
                        <ProgressBar 
                          progress={contribution.completion_rate} 
                          color="green"
                          className="h-2"
                        />
                        <div className="text-xs text-gray-500 text-right">
                          {contribution.completion_rate.toFixed(1)}% concluído
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Tarefas</h4>
                {canManageGroup(selectedGroup) && selectedGroup.status === 'active' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setTaskForm(prev => ({ ...prev, group_id: selectedGroup.id }));
                      setShowTaskModal(true);
                    }}
                  >
                    <Plus size={14} className="mr-1" />
                    Nova Tarefa
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedGroup.tasks && selectedGroup.tasks.length > 0 ? (
                  selectedGroup.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'done' ? 'bg-green-500' :
                          task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{task.title}</span>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Responsável: {task.assignee?.name}</span>
                            <span>Prazo: {new Date(task.deadline).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          task.status === 'done' ? 'success' :
                          task.status === 'in-progress' ? 'info' : 'default'
                        } size="sm">
                          {task.status === 'done' ? 'Concluída' :
                           task.status === 'in-progress' ? 'Em progresso' : 'Pendente'}
                        </Badge>
                        {(task.assignee_id === user?.id || canManageGroup(selectedGroup)) && task.status !== 'done' && (
                          <div className="flex space-x-1">
                            {task.status === 'todo' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'in-progress')}
                              >
                                Iniciar
                              </Button>
                            )}
                            {task.status === 'in-progress' && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleUpdateTaskStatus(task.id, 'done')}
                              >
                                Concluir
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma tarefa criada ainda</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {canManageGroup(selectedGroup) && selectedGroup.status === 'active' && (
              <div className="flex justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  {selectedGroup.progress === 100 && (
                    <Button
                      variant="success"
                      onClick={() => handleCompleteGroup(selectedGroup.id)}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Marcar como Concluído
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja cancelar este grupo?')) {
                        actionGroupService.updateGroup(selectedGroup.id, { status: 'cancelled' })
                          .then(() => loadData());
                      }
                    }}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Cancelar Grupo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActionGroups;