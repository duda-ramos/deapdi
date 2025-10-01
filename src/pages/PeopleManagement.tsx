import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Users,
  Building,
  Crown,
  BarChart3,
  ArrowRightLeft,
  Settings,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Target,
  Heart,
  Briefcase
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
import { ProgressBar } from '../components/ui/ProgressBar';

interface PeopleFilters {
  search: string;
  team: string;
  role: string;
  level: string;
  status: string;
  manager: string;
}

interface BulkAction {
  action: 'change_team' | 'change_status' | 'change_role' | 'change_manager' | '';
  team_id: string;
  status: string;
  role: string;
  manager_id: string;
}

const PeopleManagement: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [filters, setFilters] = useState<PeopleFilters>({
    search: '',
    team: 'all',
    role: 'all',
    level: 'all',
    status: 'all',
    manager: 'all'
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    position: '',
    level: '',
    role: 'employee' as UserRole,
    team_id: '',
    manager_id: '',
    status: 'active' as 'active' | 'inactive',
    bio: '',
    formation: '',
    birth_date: '',
    phone: '',
    location: '',
    admission_date: '',
    area: '',
    emergency_contact: '',
    career_objectives: ''
  });

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    level: 'Júnior',
    role: 'employee' as UserRole,
    team_id: '',
    manager_id: '',
    bio: '',
    formation: ''
  });

  const [bulkAction, setBulkAction] = useState<BulkAction>({
    action: '',
    team_id: '',
    status: '',
    role: '',
    manager_id: ''
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

      const [teamsData, managersData] = await Promise.all([
        teamService.getTeams(),
        databaseService.getProfiles({ role: 'manager' })
      ]);

      setProfiles(profilesData || []);
      setTeams(teamsData || []);
      setManagers(managersData || []);
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
      if (filters.team === 'none') {
        filtered = filtered.filter(profile => !profile.team_id);
      } else {
        filtered = filtered.filter(profile => profile.team_id === filters.team);
      }
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

    // Manager filter
    if (filters.manager !== 'all') {
      if (filters.manager === 'none') {
        filtered = filtered.filter(profile => !profile.manager_id);
      } else {
        filtered = filtered.filter(profile => profile.manager_id === filters.manager);
      }
    }

    setFilteredProfiles(filtered);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { authService } = await import('../services/auth');
      await authService.signUp({
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        position: createForm.position,
        level: createForm.level
      });

      // Update additional profile data
      const newProfile = await databaseService.updateProfile(user.id, {
        role: createForm.role,
        team_id: createForm.team_id || null,
        manager_id: createForm.manager_id || null,
        bio: createForm.bio || null,
        formation: createForm.formation || null
      });

      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        position: '',
        level: 'Júnior',
        role: 'employee',
        team_id: '',
        manager_id: '',
        bio: '',
        formation: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar usuário');
    }
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
        email: editForm.email,
        position: editForm.position,
        level: editForm.level,
        role: editForm.role,
        team_id: editForm.team_id || null,
        manager_id: editForm.manager_id || null,
        status: editForm.status,
        bio: editForm.bio || null,
        formation: editForm.formation || null,
        birth_date: editForm.birth_date || null,
        phone: editForm.phone || null,
        location: editForm.location || null,
        admission_date: editForm.admission_date || null,
        area: editForm.area || null,
        emergency_contact: editForm.emergency_contact || null,
        career_objectives: editForm.career_objectives || null
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
        case 'change_manager':
          if (bulkAction.manager_id) {
            updates.manager_id = bulkAction.manager_id;
          }
          break;
      }

      // Update each selected profile
      for (const profileId of selectedProfiles) {
        await databaseService.updateProfile(profileId, updates);
      }

      setShowBulkModal(false);
      setSelectedProfiles([]);
      setBulkAction({ action: '', team_id: '', status: '', role: '', manager_id: '' });
      loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError(error instanceof Error ? error.message : 'Erro ao executar ação em massa');
    }
  };

  const handleTransferTeam = async (fromTeamId: string, toTeamId: string, memberIds: string[]) => {
    try {
      for (const memberId of memberIds) {
        await databaseService.updateProfile(memberId, { team_id: toTeamId });
      }
      loadData();
    } catch (error) {
      console.error('Error transferring team members:', error);
      setError(error instanceof Error ? error.message : 'Erro ao transferir membros');
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
      email: profile.email,
      position: profile.position,
      level: profile.level,
      role: profile.role,
      team_id: profile.team_id || '',
      manager_id: profile.manager_id || '',
      status: profile.status,
      bio: profile.bio || '',
      formation: profile.formation || '',
      birth_date: profile.birth_date || '',
      phone: profile.phone || '',
      location: profile.location || '',
      admission_date: profile.admission_date || '',
      area: profile.area || '',
      emergency_contact: profile.emergency_contact || '',
      career_objectives: profile.career_objectives || ''
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

  const exportData = () => {
    const csvContent = [
      'Nome,Email,Cargo,Nível,Papel,Time,Status,Pontos,Data Admissão',
      ...filteredProfiles.map(profile => [
        profile.name,
        profile.email,
        profile.position,
        profile.level,
        profile.role,
        teams.find(t => t.id === profile.team_id)?.name || '',
        profile.status,
        profile.points,
        profile.admission_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `colaboradores-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    { value: 'none', label: 'Sem Time' },
    ...teams.map(team => ({ value: team.id, label: team.name }))
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ];

  const managerOptions = [
    { value: 'all', label: 'Todos os Gestores' },
    { value: 'none', label: 'Sem Gestor' },
    ...managers.map(manager => ({ value: manager.id, label: manager.name }))
  ];

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
      key: 'manager',
      label: 'Gestor',
      render: (value: any, row: Profile) => {
        const manager = managers.find(m => m.id === row.manager_id);
        return manager ? (
          <div className="flex items-center space-x-2">
            <Crown size={14} className="text-yellow-500" />
            <span className="text-sm">{manager.name}</span>
          </div>
        ) : (
          <Badge variant="warning" size="sm">Sem Gestor</Badge>
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
            title="Ver detalhes"
          >
            <Eye size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(row)}
            title="Editar"
          >
            <Edit size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              databaseService.updateProfile(row.id, {
                status: row.status === 'active' ? 'inactive' : 'active'
              }).then(() => loadData());
            }}
            title={row.status === 'active' ? 'Desativar' : 'Ativar'}
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
              <Button variant="secondary" onClick={exportData}>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={16} className="mr-2" />
                Novo Colaborador
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-pink-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredProfiles.filter(p => !p.manager_id).length}
              </div>
              <div className="text-sm text-gray-600">Sem Gestor</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
          <Select
            value={filters.manager}
            onChange={(e) => setFilters({ ...filters, manager: e.target.value })}
            options={managerOptions}
          />
          <Button
            variant="secondary"
            onClick={() => setFilters({
              search: '',
              team: 'all',
              role: 'all',
              level: 'all',
              status: 'all',
              manager: 'all'
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
            {/* Header with Photo and Basic Info */}
            <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <img
                src={selectedProfile.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=96&h=96&fit=crop&crop=face'}
                alt={selectedProfile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProfile.name}</h2>
                <p className="text-gray-600 mb-2">{selectedProfile.email}</p>
                <div className="flex items-center space-x-3">
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
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Award size={16} />
                    <span className="font-semibold">{selectedProfile.points} pontos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Briefcase className="mr-2" size={16} />
                  Informações Profissionais
                </h4>
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
                    <span className="text-gray-600">Área:</span>
                    <span className="font-medium">{selectedProfile.area || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {teams.find(t => t.id === selectedProfile.team_id)?.name || 'Sem time'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gestor:</span>
                    <span className="font-medium">
                      {managers.find(m => m.id === selectedProfile.manager_id)?.name || 'Sem gestor'}
                    </span>
                  </div>
                  {selectedProfile.admission_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admissão:</span>
                      <span className="font-medium">
                        {new Date(selectedProfile.admission_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="mr-2" size={16} />
                  Informações Pessoais
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedProfile.birth_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nascimento:</span>
                      <span className="font-medium">
                        {new Date(selectedProfile.birth_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {selectedProfile.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="font-medium">{selectedProfile.phone}</span>
                    </div>
                  )}
                  {selectedProfile.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Localização:</span>
                      <span className="font-medium">{selectedProfile.location}</span>
                    </div>
                  )}
                  {selectedProfile.emergency_contact && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contato Emergência:</span>
                      <span className="font-medium">{selectedProfile.emergency_contact}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Bio and Formation */}
            {(selectedProfile.bio || selectedProfile.formation || selectedProfile.career_objectives) && (
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
                {selectedProfile.career_objectives && (
                  <Card className="p-4 lg:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Target className="mr-2" size={16} />
                      Objetivos de Carreira
                    </h4>
                    <p className="text-gray-700 text-sm">{selectedProfile.career_objectives}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Skills and Interests */}
            {(selectedProfile.hard_skills?.length > 0 || selectedProfile.soft_skills?.length > 0 || selectedProfile.development_interests?.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {selectedProfile.hard_skills?.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Hard Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProfile.hard_skills.map((skill, index) => (
                        <Badge key={index} variant="info" size="sm">{skill}</Badge>
                      ))}
                    </div>
                  </Card>
                )}
                {selectedProfile.soft_skills?.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Soft Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProfile.soft_skills.map((skill, index) => (
                        <Badge key={index} variant="success" size="sm">{skill}</Badge>
                      ))}
                    </div>
                  </Card>
                )}
                {selectedProfile.development_interests?.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Interesses de Desenvolvimento</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProfile.development_interests.map((interest, index) => (
                        <Badge key={index} variant="warning" size="sm">{interest}</Badge>
                      ))}
                    </div>
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Novo Colaborador"
        size="xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <User className="mr-2" size={16} />
              Informações Básicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ex: João Silva Santos"
                required
              />
              <Input
                label="Email Corporativo"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="joao.silva@empresa.com"
                required
              />
            </div>
            <Input
              label="Senha Inicial"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Senha temporária (usuário deve alterar no primeiro login)"
              helperText="Mínimo 6 caracteres - O usuário será solicitado a alterar no primeiro acesso"
              required
            />
          </div>

          {/* Professional Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <Briefcase className="mr-2" size={16} />
              Informações Profissionais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cargo/Posição"
                value={createForm.position}
                onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                placeholder="Ex: Desenvolvedor Frontend"
                required
              />
              <Select
                label="Nível Profissional"
                value={createForm.level}
                onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}
                options={levelOptions.filter(l => l.value !== 'all')}
                required
              />
              <Select
                label="Função no Sistema"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                options={roleOptions.filter(r => r.value !== 'all')}
                required
              />
              <Select
                label="Time"
                value={createForm.team_id}
                onChange={(e) => setCreateForm({ ...createForm, team_id: e.target.value })}
                options={teamOptions.filter(t => t.value !== 'all' && t.value !== 'none')}
                placeholder="Selecione um time"
              />
            </div>
            <Select
              label="Gestor Direto"
              value={createForm.manager_id}
              onChange={(e) => setCreateForm({ ...createForm, manager_id: e.target.value })}
              options={[
                { value: '', label: 'Será atribuído automaticamente' },
                ...managers.map(manager => ({ value: manager.id, label: `${manager.name} - ${manager.position}` }))
              ]}
              placeholder="Selecione um gestor"
            />
          </div>

          {/* Additional Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3">Informações Adicionais (Opcional)</h4>
            <div className="space-y-4">
              <Textarea
                label="Biografia/Apresentação"
                value={createForm.bio}
                onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                placeholder="Breve descrição sobre o colaborador..."
                rows={3}
              />
              <Textarea
                label="Formação Acadêmica"
                value={createForm.formation}
                onChange={(e) => setCreateForm({ ...createForm, formation: e.target.value })}
                placeholder="Graduação, pós-graduação, certificações..."
                rows={2}
              />
            </div>
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
              Criar Colaborador
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Editar ${selectedProfile?.name}`}
        size="xl"
      >
        <form onSubmit={handleEditProfile} className="space-y-6">
          {/* Basic Information */}
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
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
              <Input
                label="Telefone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
              <Input
                label="Localização"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="São Paulo, SP"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">Informações Profissionais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cargo/Posição"
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                required
              />
              <Select
                label="Nível"
                value={editForm.level}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                options={levelOptions.filter(l => l.value !== 'all')}
                required
              />
              {permissions?.canChangeRoles && (
                <Select
                  label="Papel no Sistema"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  options={roleOptions.filter(r => r.value !== 'all')}
                  required
                />
              )}
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
              <Select
                label="Time"
                value={editForm.team_id}
                onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                options={[
                  { value: '', label: 'Sem time' },
                  ...teams.map(team => ({ value: team.id, label: team.name }))
                ]}
              />
              <Select
                label="Gestor Direto"
                value={editForm.manager_id}
                onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
                options={[
                  { value: '', label: 'Sem gestor' },
                  ...managers.map(manager => ({ value: manager.id, label: `${manager.name} - ${manager.position}` }))
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Área de Atuação"
                value={editForm.area}
                onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                placeholder="Ex: Tecnologia, Marketing"
              />
              <Input
                label="Data de Admissão"
                type="date"
                value={editForm.admission_date}
                onChange={(e) => setEditForm({ ...editForm, admission_date: e.target.value })}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-3">Informações Pessoais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Data de Nascimento"
                type="date"
                value={editForm.birth_date}
                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
              />
              <Input
                label="Contato de Emergência"
                value={editForm.emergency_contact}
                onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                placeholder="Nome e telefone"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3">Informações Adicionais</h4>
            <div className="space-y-4">
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
              <Textarea
                label="Objetivos de Carreira"
                value={editForm.career_objectives}
                onChange={(e) => setEditForm({ ...editForm, career_objectives: e.target.value })}
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
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Colaboradores Selecionados</h4>
            <div className="max-h-32 overflow-y-auto">
              {selectedProfiles.map(id => {
                const profile = profiles.find(p => p.id === id);
                return profile ? (
                  <div key={id} className="flex items-center space-x-2 text-sm text-blue-800">
                    <span>•</span>
                    <span>{profile.name} - {profile.position}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <Select
            label="Ação"
            value={bulkAction.action}
            onChange={(e) => setBulkAction({ ...bulkAction, action: e.target.value as any })}
            options={[
              { value: '', label: 'Selecione uma ação' },
              { value: 'change_team', label: 'Alterar Time' },
              { value: 'change_status', label: 'Alterar Status' },
              { value: 'change_manager', label: 'Alterar Gestor' },
              ...(permissions?.canChangeRoles ? [{ value: 'change_role', label: 'Alterar Papel' }] : [])
            ]}
            required
          />

          {bulkAction.action === 'change_team' && (
            <Select
              label="Novo Time"
              value={bulkAction.team_id}
              onChange={(e) => setBulkAction({ ...bulkAction, team_id: e.target.value })}
              options={[
                { value: '', label: 'Remover do time atual' },
                ...teams.map(team => ({ value: team.id, label: team.name }))
              ]}
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

          {bulkAction.action === 'change_manager' && (
            <Select
              label="Novo Gestor"
              value={bulkAction.manager_id}
              onChange={(e) => setBulkAction({ ...bulkAction, manager_id: e.target.value })}
              options={[
                { value: '', label: 'Remover gestor atual' },
                ...managers.map(manager => ({ value: manager.id, label: `${manager.name} - ${manager.position}` }))
              ]}
              required
            />
          )}

          {bulkAction.action === 'change_role' && permissions?.canChangeRoles && (
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