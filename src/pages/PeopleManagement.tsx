import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit, 
  Eye, 
  UserCheck, 
  UserX, 
  Crown,
  Building,
  Filter,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { teamService } from '../services/teams';
import { permissionService } from '../utils/permissions';
import { Profile, UserRole } from '../types';
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

interface PeopleFilters {
  search: string;
  team: string;
  role: string;
  level: string;
  status: string;
}

const PeopleManagement: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const [filters, setFilters] = useState<PeopleFilters>({
    search: '',
    team: 'all',
    role: 'all',
    level: 'all',
    status: 'all'
  });

  const [editForm, setEditForm] = useState({
    name: '',
    position: '',
    level: '',
    role: 'employee' as UserRole,
    team_id: '',
    manager_id: '',
    status: 'active' as 'active' | 'inactive',
    bio: '',
    formation: ''
  });

  const [bulkAction, setBulkAction] = useState({
    action: '',
    team_id: '',
    status: '',
    role: ''
  });

  const permissions = user ? permissionService.getUserPermissions(user.role) : null;
  const userFilter = user ? permissionService.getVisibleUserFilter(user) : null;

  useEffect(() => {
    if (user && permissions?.canManageTeam) {
      loadData();
    }
  }, [user, permissions]);

  useEffect(() => {
    applyFilters();
  }, [profiles, filters]);

  const loadData = async () => {
    if (!user || !userFilter) return;

    try {
      setLoading(true);
      setError('');

      let profilesData: Profile[] = [];
      
      if (userFilter.all) {
        // Admin/HR can see all profiles
        profilesData = await databaseService.getProfiles();
      } else if (userFilter.managerFilter) {
        // Manager can see only their team
        profilesData = await databaseService.getProfiles({ 
          manager_id: userFilter.managerFilter 
        });
      }

      const teamsData = await teamService.getTeams();

      setProfiles(profilesData || []);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error loading people data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados de pessoas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = profiles;

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        profile.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        profile.position.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Team filter
    if (filters.team !== 'all') {
      filtered = filtered.filter(profile => profile.team_id === filters.team);
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(profile => profile.role === filters.role);
    }

    // Level filter
    if (filters.level !== 'all') {
      filtered = filtered.filter(profile => profile.level === filters.level);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(profile => profile.status === filters.status);
    }

    setFilteredProfiles(filtered);
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !user) return;

    try {
      // Validate role change if applicable
      if (editForm.role !== selectedProfile.role && permissions?.canChangeRoles) {
        const validationError = permissionService.validateRoleChange(user, selectedProfile, editForm.role);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      await databaseService.updateProfile(selectedProfile.id, {
        name: editForm.name,
        position: editForm.position,
        level: editForm.level,
        role: editForm.role,
        team_id: editForm.team_id || null,
        manager_id: editForm.manager_id || null,
        status: editForm.status,
        bio: editForm.bio || null,
        formation: editForm.formation || null
      });

      setShowEditModal(false);
      setSelectedProfile(null);
      loadData();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    }
  };

  const handleBulkAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfiles.length === 0) return;

    try {
      const updates: any = {};

      switch (bulkAction.action) {
        case 'change_team':
          if (bulkAction.team_id) {
            updates.team_id = bulkAction.team_id;
          }
          break;
        case 'change_status':
          if (bulkAction.status) {
            updates.status = bulkAction.status;
          }
          break;
        case 'change_role':
          if (bulkAction.role && permissions?.canChangeRoles) {
            updates.role = bulkAction.role;
          }
          break;
      }

      // Update each selected profile
      for (const profileId of selectedProfiles) {
        await databaseService.updateProfile(profileId, updates);
      }

      setShowBulkModal(false);
      setSelectedProfiles([]);
      setBulkAction({ action: '', team_id: '', status: '', role: '' });
      loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError(error instanceof Error ? error.message : 'Erro ao executar ação em massa');
    }
  };

  const openDetailsModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowDetailsModal(true);
  };

  const openEditModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setEditForm({
      name: profile.name,
      position: profile.position,
      level: profile.level,
      role: profile.role,
      team_id: profile.team_id || '',
      manager_id: profile.manager_id || '',
      status: profile.status,
      bio: profile.bio || '',
      formation: profile.formation || ''
    });
    setShowEditModal(true);
  };

  const handleToggleSelection = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProfiles.length === filteredProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(filteredProfiles.map(p => p.id));
    }
  };

  const roleOptions = [
    { value: 'all', label: 'Todos os Papéis' },
    { value: 'employee', label: 'Colaborador' },
    { value: 'manager', label: 'Gestor' },
    { value: 'hr', label: 'RH' },
    { value: 'admin', label: 'Administrador' }
  ];

  const levelOptions = [
    { value: 'all', label: 'Todos os Níveis' },
    { value: 'Estagiário', label: 'Estagiário' },
    { value: 'Assistente', label: 'Assistente' },
    { value: 'Júnior', label: 'Júnior' },
    { value: 'Pleno', label: 'Pleno' },
    { value: 'Sênior', label: 'Sênior' },
    { value: 'Especialista', label: 'Especialista' },
    { value: 'Principal', label: 'Principal' }
  ];

  const teamOptions = [
    { value: 'all', label: 'Todos os Times' },
    { value: '', label: 'Sem Time' },
    ...teams.map(team => ({ value: team.id, label: team.name }))
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ];

  const managerOptions = profiles
    .filter(p => ['manager', 'admin'].includes(p.role) && p.status === 'active')
    .map(p => ({ value: p.id, label: `${p.name} - ${p.position}` }));

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedProfiles.length === filteredProfiles.length && filteredProfiles.length > 0}
          onChange={handleSelectAll}
          className="rounded"
        />
      ),
      render: (value: any, row: Profile) => (
        <input
          type="checkbox"
          checked={selectedProfiles.includes(row.id)}
          onChange={() => handleToggleSelection(row.id)}
          className="rounded"
        />
      )
    },
    {
      key: 'name',
      label: 'Colaborador',
      render: (value: string, row: Profile) => (
        <div className="flex items-center space-x-3">
          <img
            src={row.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=32&h=32&fit=crop&crop=face'}
            alt={value}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'position',
      label: 'Cargo',
      render: (value: string, row: Profile) => (
        <div>
          <span className="text-gray-900">{value}</span>
          <p className="text-sm text-gray-500">{row.level}</p>
        </div>
      )
    },
    {
      key: 'team',
      label: 'Time',
      render: (value: any, row: Profile) => {
        const team = teams.find(t => t.id === row.team_id);
        return team ? (
          <div className="flex items-center space-x-2">
            <Building size={14} className="text-blue-500" />
            <span className="text-sm">{team.name}</span>
          </div>
        ) : (
          <Badge variant="warning" size="sm">Sem Time</Badge>
        );
      }
    },
    {
      key: 'role',
      label: 'Papel',
      render: (value: UserRole) => (
        <Badge variant={
          value === 'admin' ? 'danger' :
          value === 'hr' ? 'warning' :
          value === 'manager' ? 'info' : 'default'
        }>
          {value === 'admin' ? 'Admin' :
           value === 'hr' ? 'RH' :
           value === 'manager' ? 'Gestor' : 'Colaborador'}
        </Badge>
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
      key: 'points',
      label: 'Pontos',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value}</span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: Profile) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openDetailsModal(row)}
          >
            <Eye size={14} />
          </Button>
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
            onClick={() => {
              // Toggle status
              databaseService.updateProfile(row.id, {
                status: row.status === 'active' ? 'inactive' : 'active'
              }).then(() => loadData());
            }}
          >
            {row.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
          </Button>
        </div>
      )
    }
  ];

  if (!user || !permissions?.canManageTeam) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para gerenciar pessoas.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando gestão de pessoas..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.canManageAllUsers ? 'Gestão de Pessoas' : 'Minha Equipe'}
          </h1>
          <p className="text-gray-600 mt-1">
            {permissions.canManageAllUsers 
              ? 'Gerencie todos os colaboradores da organização'
              : 'Gerencie sua equipe direta'
            }
          </p>
        </div>
        <ErrorMessage error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permissions.canManageAllUsers ? 'Gestão de Pessoas' : 'Minha Equipe'}
          </h1>
          <p className="text-gray-600 mt-1">
            {permissions.canManageAllUsers 
              ? 'Gerencie todos os colaboradores da organização'
              : 'Gerencie sua equipe direta'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedProfiles.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowBulkModal(true)}
            >
              <MoreHorizontal size={16} className="mr-2" />
              Ações em Massa ({selectedProfiles.length})
            </Button>
          )}
          {permissions.canManageAllUsers && (
            <>
              <Button variant="secondary">
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
              <Button variant="secondary">
                <Upload size={16} className="mr-2" />
                Importar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredProfiles.length}</div>
              <div className="text-sm text-gray-600">
                {permissions.canManageAllUsers ? 'Total' : 'Minha Equipe'}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredProfiles.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredProfiles.filter(p => p.role === 'manager').length}
              </div>
              <div className="text-sm text-gray-600">Gestores</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredProfiles.filter(p => !p.team_id).length}
              </div>
              <div className="text-sm text-gray-600">Sem Time</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(filteredProfiles.reduce((sum, p) => sum + p.points, 0) / filteredProfiles.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Pontos Médios</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar pessoas..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Select
            value={filters.team}
            onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            options={teamOptions}
          />
          <Select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            options={roleOptions}
          />
          <Select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            options={levelOptions}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={statusOptions}
          />
          <Button
            variant="secondary"
            onClick={() => setFilters({
              search: '',
              team: 'all',
              role: 'all',
              level: 'all',
              status: 'all'
            })}
          >
            <Filter size={16} className="mr-2" />
            Limpar
          </Button>
        </div>
      </Card>

      {/* People Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="mr-2" size={20} />
            {permissions.canManageAllUsers ? 'Todos os Colaboradores' : 'Minha Equipe'}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredProfiles.filter(p => p.status === 'active').length} de {filteredProfiles.length} ativos
            </span>
          </div>
        </div>
        <Table
          columns={columns}
          data={filteredProfiles}
          loading={loading}
          emptyMessage={
            permissions.canManageAllUsers 
              ? "Nenhum colaborador encontrado"
              : "Você ainda não possui uma equipe atribuída"
          }
        />
      </Card>

      {/* Profile Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Perfil de ${selectedProfile?.name}`}
        size="xl"
      >
        {selectedProfile && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedProfile.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=64&h=64&fit=crop&crop=face'}
                      alt={selectedProfile.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedProfile.name}</h3>
                      <p className="text-gray-600">{selectedProfile.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={
                          selectedProfile.role === 'admin' ? 'danger' :
                          selectedProfile.role === 'hr' ? 'warning' :
                          selectedProfile.role === 'manager' ? 'info' : 'default'
                        }>
                          {selectedProfile.role === 'admin' ? 'Admin' :
                           selectedProfile.role === 'hr' ? 'RH' :
                           selectedProfile.role === 'manager' ? 'Gestor' : 'Colaborador'}
                        </Badge>
                        <Badge variant={selectedProfile.status === 'active' ? 'success' : 'default'}>
                          {selectedProfile.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informações Profissionais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cargo:</span>
                    <span className="font-medium">{selectedProfile.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nível:</span>
                    <span className="font-medium">{selectedProfile.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {teams.find(t => t.id === selectedProfile.team_id)?.name || 'Sem time'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pontos:</span>
                    <span className="font-semibold text-blue-600">{selectedProfile.points}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bio and Formation */}
            {(selectedProfile.bio || selectedProfile.formation) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedProfile.bio && (
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Biografia</h4>
                    <p className="text-gray-700 text-sm">{selectedProfile.bio}</p>
                  </Card>
                )}
                {selectedProfile.formation && (
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Formação</h4>
                    <p className="text-gray-700 text-sm">{selectedProfile.formation}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => openEditModal(selectedProfile)}
              >
                <Edit size={16} className="mr-2" />
                Editar Perfil
              </Button>
              <Button
                onClick={() => {
                  // Navigate to user's PDIs
                  window.location.href = `/pdi?user=${selectedProfile.id}`;
                }}
              >
                <Target size={16} className="mr-2" />
                Ver PDIs
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Editar ${selectedProfile?.name}`}
        size="lg"
      >
        <form onSubmit={handleEditProfile} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Informações Básicas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
              <Input
                label="Cargo/Posição"
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">Estrutura Organizacional</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Nível"
                value={editForm.level}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                options={levelOptions.filter(l => l.value !== 'all')}
                required
              />
              
              {permissions.canChangeRoles && (
                <Select
                  label="Papel no Sistema"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  options={roleOptions.filter(r => r.value !== 'all')}
                  required
                />
              )}
              
              <Select
                label="Time"
                value={editForm.team_id}
                onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                options={teamOptions.filter(t => t.value !== 'all')}
                placeholder="Selecione um time"
              />
              
              <Select
                label="Gestor Direto"
                value={editForm.manager_id}
                onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
                options={[
                  { value: '', label: 'Sem gestor' },
                  ...managerOptions
                ]}
                placeholder="Selecione um gestor"
              />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3">Informações Adicionais</h4>
            <div className="space-y-4">
              <Select
                label="Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                options={[
                  { value: 'active', label: 'Ativo' },
                  { value: 'inactive', label: 'Inativo' }
                ]}
                required
              />
              
              <Textarea
                label="Biografia"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={2}
              />
              
              <Textarea
                label="Formação"
                value={editForm.formation}
                onChange={(e) => setEditForm({ ...editForm, formation: e.target.value })}
                rows={2}
              />
            </div>
          </div>

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

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={`Ações em Massa (${selectedProfiles.length} selecionados)`}
        size="md"
      >
        <form onSubmit={handleBulkAction} className="space-y-4">
          <Select
            label="Ação"
            value={bulkAction.action}
            onChange={(e) => setBulkAction({ ...bulkAction, action: e.target.value })}
            options={[
              { value: '', label: 'Selecione uma ação' },
              { value: 'change_team', label: 'Alterar Time' },
              { value: 'change_status', label: 'Alterar Status' },
              ...(permissions.canChangeRoles ? [{ value: 'change_role', label: 'Alterar Papel' }] : [])
            ]}
            required
          />

          {bulkAction.action === 'change_team' && (
            <Select
              label="Novo Time"
              value={bulkAction.team_id}
              onChange={(e) => setBulkAction({ ...bulkAction, team_id: e.target.value })}
              options={teamOptions.filter(t => t.value !== 'all')}
              required
            />
          )}

          {bulkAction.action === 'change_status' && (
            <Select
              label="Novo Status"
              value={bulkAction.status}
              onChange={(e) => setBulkAction({ ...bulkAction, status: e.target.value })}
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' }
              ]}
              required
            />
          )}

          {bulkAction.action === 'change_role' && permissions.canChangeRoles && (
            <Select
              label="Novo Papel"
              value={bulkAction.role}
              onChange={(e) => setBulkAction({ ...bulkAction, role: e.target.value })}
              options={roleOptions.filter(r => r.value !== 'all')}
              required
            />
          )}

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Confirmação</h4>
            <p className="text-sm text-yellow-800">
              Esta ação será aplicada a {selectedProfiles.length} colaborador(es) selecionado(s).
              Tem certeza que deseja continuar?
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowBulkModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!bulkAction.action}
            >
              Aplicar Ação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PeopleManagement;