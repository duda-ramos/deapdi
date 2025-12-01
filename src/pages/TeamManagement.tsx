import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  Building,
  Crown,
  BarChart3,
  ArrowRightLeft,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { teamService, Team, TeamStats, CreateTeamData } from '../services/teams';
import { peopleManagementService } from '../services/peopleManagement';
import { permissionService } from '../utils/permissions';
import { Profile } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOrgChartModal, setShowOrgChartModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [teamForm, setTeamForm] = useState<CreateTeamData>({
    name: '',
    description: '',
    manager_id: '',
    status: 'active'
  });

  const [transferForm, setTransferForm] = useState({
    fromTeamId: '',
    toTeamId: '',
    memberIds: [] as string[]
  });

  useEffect(() => {
    if (user && permissionService.canCreateTeams(user.role)) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use Promise.allSettled for better error handling - allows partial success
      const results = await Promise.allSettled([
        teamService.getTeams(true), // Include inactive teams
        peopleManagementService.getProfilesWithDetails(), // Use consistent service
        teamService.getTeamStats() // Already has fallback error handling
      ]);

      // Extract results with fallbacks for failures
      const teamsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const profilesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const statsData = results[2].status === 'fulfilled' ? results[2].value : {
        total_teams: teamsData.length,
        active_teams: teamsData.filter((t: Team) => t.status === 'active').length,
        teams_without_manager: teamsData.filter((t: Team) => !t.manager_id).length,
        average_team_size: teamsData.length > 0 
          ? teamsData.reduce((sum: number, t: Team) => sum + (t.members?.length || 0), 0) / teamsData.length 
          : 0,
        largest_team_size: teamsData.reduce((max: number, t: Team) => Math.max(max, t.members?.length || 0), 0)
      };

      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const serviceName = ['getTeams', 'getProfilesWithDetails', 'getTeamStats'][index];
          console.error(`⚠️ TeamManagement: ${serviceName} failed:`, result.reason);
        }
      });

      setTeams(teamsData || []);
      setProfiles(profilesData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading team data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados dos times');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate manager assignment if provided
      if (teamForm.manager_id) {
        const validationError = await teamService.validateManagerAssignment(teamForm.manager_id, '');
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      await teamService.createTeam(teamForm);
      
      setShowCreateModal(false);
      setTeamForm({
        name: '',
        description: '',
        manager_id: '',
        status: 'active'
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating team:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar time');
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      // Validate manager assignment if changed
      if (teamForm.manager_id && teamForm.manager_id !== selectedTeam.manager_id) {
        const validationError = await teamService.validateManagerAssignment(teamForm.manager_id, selectedTeam.id);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      await teamService.updateTeam(selectedTeam.id, teamForm);
      
      setShowEditModal(false);
      setSelectedTeam(null);
      loadData();
    } catch (error) {
      console.error('Error updating team:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar time');
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    try {
      const validationError = await teamService.validateTeamDeletion(team.id);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (confirm(`Tem certeza que deseja excluir o time "${team.name}"?`)) {
        await teamService.deleteTeam(team.id);
        loadData();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir time');
    }
  };

  const handleTransferMembers = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await teamService.bulkTransferMembers(transferForm.memberIds, transferForm.toTeamId);
      
      setShowTransferModal(false);
      setTransferForm({
        fromTeamId: '',
        toTeamId: '',
        memberIds: []
      });
      setSelectedMembers([]);
      
      loadData();
    } catch (error) {
      console.error('Error transferring members:', error);
      setError(error instanceof Error ? error.message : 'Erro ao transferir membros');
    }
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      manager_id: team.manager_id || '',
      status: team.status
    });
    setShowEditModal(true);
  };

  const openTransferModal = (team: Team) => {
    setTransferForm({
      fromTeamId: team.id,
      toTeamId: '',
      memberIds: []
    });
    setSelectedMembers([]);
    setShowTransferModal(true);
  };

  const managerOptions = profiles
    .filter(p => ['manager', 'admin'].includes(p.role) && p.status === 'active')
    .map(p => ({ value: p.id, label: `${p.name} - ${p.position}` }));

  const teamOptions = teams
    .filter(t => t.status === 'active')
    .map(t => ({ value: t.id, label: t.name }));

  const teamColumns = [
    {
      key: 'name',
      label: 'Nome do Time',
      render: (value: string, row: Team) => (
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Building size={16} className="text-blue-600" />
          </div>
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            {row.description && (
              <p className="text-sm text-gray-500">{row.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'manager',
      label: 'Gestor',
      render: (value: Profile | null) => value ? (
        <div className="flex items-center space-x-2">
          <img
            src={value.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
            alt={value.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-medium">{value.name}</span>
        </div>
      ) : (
        <Badge variant="warning" size="sm">Sem Gestor</Badge>
      )
    },
    {
      key: 'members',
      label: 'Membros',
      render: (value: Profile[]) => (
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-gray-400" />
          <span className="font-medium">{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: Team) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(row)}
          >
            <Edit size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openTransferModal(row)}
            disabled={!row.members || row.members.length === 0}
          >
            <ArrowRightLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteTeam(row)}
            disabled={row.members && row.members.length > 0}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  if (!user || !permissionService.canCreateTeams(user.role)) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para gerenciar times.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando gerenciamento de times..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Times</h1>
          <p className="text-gray-600 mt-1">Gerencie a estrutura organizacional</p>
        </div>
        <ErrorMessage error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Times</h1>
          <p className="text-gray-600 mt-1">Gerencie a estrutura organizacional da empresa</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowOrgChartModal(true)}
          >
            <BarChart3 size={16} className="mr-2" />
            Organograma
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Novo Time
          </Button>
        </div>
      </div>

      {/* Team Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_teams}</div>
                <div className="text-sm text-gray-600">Total de Times</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.active_teams}</div>
                <div className="text-sm text-gray-600">Times Ativos</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.teams_without_manager}</div>
                <div className="text-sm text-gray-600">Sem Gestor</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.average_team_size.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Tamanho Médio</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.largest_team_size}</div>
                <div className="text-sm text-gray-600">Maior Time</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Teams Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Building className="mr-2" size={20} />
            Times da Organização
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {teams.filter(t => t.status === 'active').length} de {teams.length} ativos
            </span>
          </div>
        </div>
        <Table
          columns={teamColumns}
          data={teams}
          loading={loading}
          emptyMessage="Nenhum time encontrado"
        />
      </Card>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Novo Time"
        size="lg"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <Building className="mr-2" size={16} />
              Informações do Time
            </h4>
            <div className="space-y-4">
              <Input
                label="Nome do Time"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="Ex: Desenvolvimento Frontend, Marketing Digital"
                required
              />

              <Textarea
                label="Descrição/Objetivo"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="Descreva o propósito e responsabilidades do time..."
                rows={3}
              />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <Crown className="mr-2" size={16} />
              Gestão e Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Gestor do Time"
                value={teamForm.manager_id}
                onChange={(e) => setTeamForm({ ...teamForm, manager_id: e.target.value })}
                options={managerOptions}
                placeholder="Selecione um gestor"
              />

              <Select
                label="Status"
                value={teamForm.status}
                onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value as 'active' | 'inactive' })}
                options={[
                  { value: 'active', label: 'Ativo' },
                  { value: 'inactive', label: 'Inativo' }
                ]}
                required
              />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">📋 Informações Importantes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• O time será criado sem membros inicialmente</li>
              <li>• Você pode adicionar membros após a criação</li>
              <li>• O gestor pode ser alterado posteriormente</li>
              <li>• Times inativos não aparecem na seleção de onboarding</li>
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
              Criar Time
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Time"
        size="lg"
      >
        <form onSubmit={handleEditTeam} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Informações do Time</h4>
            <div className="space-y-4">
              <Input
                label="Nome do Time"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                required
              />

              <Textarea
                label="Descrição/Objetivo"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">Gestão e Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Gestor do Time"
                value={teamForm.manager_id}
                onChange={(e) => setTeamForm({ ...teamForm, manager_id: e.target.value })}
                options={managerOptions}
                placeholder="Selecione um gestor"
              />

              <Select
                label="Status"
                value={teamForm.status}
                onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value as 'active' | 'inactive' })}
                options={[
                  { value: 'active', label: 'Ativo' },
                  { value: 'inactive', label: 'Inativo' }
                ]}
                required
              />
            </div>
          </div>

          {selectedTeam?.members && selectedTeam.members.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Membros Atuais ({selectedTeam.members.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {selectedTeam.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2 p-2 bg-white rounded">
                    <img
                      src={member.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=24&h=24&fit=crop&crop=face'}
                      alt={member.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-sm">{member.name}</span>
                    <Badge variant={member.status === 'active' ? 'success' : 'default'} size="sm">
                      {member.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Members Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transferir Membros Entre Times"
        size="lg"
      >
        <form onSubmit={handleTransferMembers} className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-3">Transferência de Membros</h4>
            <div className="space-y-4">
              <Select
                label="Time de Destino"
                value={transferForm.toTeamId}
                onChange={(e) => setTransferForm({ ...transferForm, toTeamId: e.target.value })}
                options={teamOptions.filter(t => t.value !== transferForm.fromTeamId)}
                placeholder="Selecione o time de destino"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membros para Transferir
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {teams
                    .find(t => t.id === transferForm.fromTeamId)
                    ?.members?.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          checked={transferForm.memberIds.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTransferForm(prev => ({
                                ...prev,
                                memberIds: [...prev.memberIds, member.id]
                              }));
                            } else {
                              setTransferForm(prev => ({
                                ...prev,
                                memberIds: prev.memberIds.filter(id => id !== member.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <img
                          src={member.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-sm font-medium">{member.name}</span>
                          <span className="text-xs text-gray-500 block">{member.position}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">⚠️ Atenção</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Esta ação transferirá os membros selecionados permanentemente</li>
              <li>• Os membros serão notificados sobre a mudança</li>
              <li>• PDIs e tarefas ativas serão mantidos</li>
              <li>• Histórico de performance será preservado</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTransferModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={transferForm.memberIds.length === 0 || !transferForm.toTeamId}
            >
              Transferir {transferForm.memberIds.length} Membro(s)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Organizational Chart Modal */}
      <Modal
        isOpen={showOrgChartModal}
        onClose={() => setShowOrgChartModal(false)}
        title="Organograma da Empresa"
        size="xl"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Building size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Organograma Interativo
            </h3>
            <p className="text-gray-600">
              Visualização hierárquica da estrutura organizacional
            </p>
          </div>

          {/* Simplified Org Chart */}
          <div className="space-y-4">
            {teams.filter(t => t.status === 'active').map((team) => (
              <Card key={team.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{team.name}</h4>
                      <p className="text-sm text-gray-600">{team.description}</p>
                    </div>
                  </div>
                  <Badge variant="info">
                    {team.members?.length || 0} membros
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Manager */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Crown size={14} className="mr-1 text-yellow-500" />
                      Gestor
                    </h5>
                    {team.manager ? (
                      <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                        <img
                          src={team.manager.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
                          alt={team.manager.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-sm font-medium">{team.manager.name}</span>
                          <span className="text-xs text-gray-500 block">{team.manager.position}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-red-50 rounded-lg text-center">
                        <span className="text-sm text-red-600">Sem gestor atribuído</span>
                      </div>
                    )}
                  </div>

                  {/* Members Preview */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Users size={14} className="mr-1 text-blue-500" />
                      Membros ({team.members?.length || 0})
                    </h5>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {team.members?.slice(0, 3).map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 p-1 bg-gray-50 rounded">
                          <img
                            src={member.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=24&h=24&fit=crop&crop=face'}
                            alt={member.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs">{member.name}</span>
                        </div>
                      ))}
                      {team.members && team.members.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{team.members.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamManagement;