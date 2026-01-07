import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, UserCheck, UserX, Users, Mail, User, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { authService } from '../services/auth';
import { Profile, UserRole } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/Textarea';
import { getAvatarUrl, handleImageError } from '../utils/images';

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  level: string;
  position: string;
  bio?: string;
  formation?: string;
  team_id?: string;
  manager_id?: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'employee',
    level: 'Estagiário',
    position: '',
    bio: '',
    formation: '',
    team_id: '',
    manager_id: ''
  });

  // Memoized handler to prevent input focus loss
  const handleFormChange = useCallback((field: keyof UserFormData, value: string | UserRole) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const roleOptions = [
    { value: 'employee', label: 'Colaborador' },
    { value: 'manager', label: 'Gestor' },
    { value: 'hr', label: 'RH' },
    { value: 'admin', label: 'Administrador' }
  ];

  const levelOptions = [
    { value: 'Estagiário', label: 'Estagiário' },
    { value: 'Assistente', label: 'Assistente' },
    { value: 'Júnior', label: 'Júnior' },
    { value: 'Pleno', label: 'Pleno' },
    { value: 'Sênior', label: 'Sênior' },
    { value: 'Especialista', label: 'Especialista' }
  ];

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getProfiles();
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const signup = await authService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        position: formData.position,
        level: formData.level
      });

      if (!signup.success || !signup.user?.id) {
        throw new Error(signup.error || 'Erro ao criar usuário');
      }

      const createdUserId = signup.user.id as string;

      // Persist role/team/manager and optional fields into the created user's profile.
      try {
        await databaseService.updateProfile(createdUserId, {
          role: formData.role,
          level: formData.level,
          position: formData.position,
          team_id: formData.team_id || null,
          manager_id: formData.manager_id || null,
          bio: formData.bio || null,
          formation: formData.formation || null
        });
      } catch (updateError) {
        // Fallback for cases where the profile row isn't available yet.
        const { supabase } = await import('../lib/supabase');
        if (!supabase) throw updateError;

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: createdUserId,
            email: formData.email,
            name: formData.name,
            position: formData.position,
            level: formData.level,
            role: formData.role,
            team_id: formData.team_id || null,
            manager_id: formData.manager_id || null,
            bio: formData.bio || null,
            formation: formData.formation || null,
            status: 'active'
          })
          .select()
          .single();

        if (upsertError) {
          throw updateError;
        }
      }
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'employee',
        level: 'Estagiário',
        position: '',
        bio: '',
        formation: '',
        team_id: '',
        manager_id: ''
      });
      loadProfiles();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await databaseService.updateProfile(selectedUser.id, {
        name: formData.name,
        role: formData.role,
        level: formData.level,
        position: formData.position,
        team_id: formData.team_id || null,
        manager_id: formData.manager_id || null
      });
      setShowEditModal(false);
      setSelectedUser(null);
      loadProfiles();
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
    }
  };

  const handleToggleStatus = async (profile: Profile) => {
    try {
      const newStatus = profile.status === 'active' ? 'inactive' : 'active';
      await databaseService.updateProfile(profile.id, { status: newStatus });
      loadProfiles();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const openEditModal = (profile: Profile) => {
    setSelectedUser(profile);
    setFormData({
      email: profile.email,
      password: '',
      name: profile.name,
      role: profile.role,
      level: profile.level,
      position: profile.position,
      bio: profile.bio || '',
      formation: profile.formation || '',
      team_id: profile.team_id || '',
      manager_id: profile.manager_id || ''
    });
    setShowEditModal(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, row: Profile) => (
        <div className="flex items-center space-x-3">
          <img
            src={getAvatarUrl(row.avatar_url, value)}
            alt={value}
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => handleImageError(e, value)}
          />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Função',
      render: (value: UserRole) => (
        <Badge variant={
          value === 'admin' ? 'danger' :
          value === 'hr' ? 'warning' :
          value === 'manager' ? 'info' : 'default'
        }>
          {roleOptions.find(r => r.value === value)?.label}
        </Badge>
      )
    },
    { key: 'level', label: 'Nível' },
    { key: 'position', label: 'Cargo' },
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
            onClick={() => openEditModal(row)}
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleStatus(row)}
          >
            {row.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
          </Button>
        </div>
      )
    }
  ];

  if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie colaboradores e suas permissões</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total de usuários</div>
            <div className="text-2xl font-bold text-blue-600">{profiles.length}</div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {profiles.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Usuários Ativos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {profiles.filter(p => p.role === 'employee').length}
              </div>
              <div className="text-sm text-gray-600">Colaboradores</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {profiles.filter(p => p.role === 'manager').length}
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
                {profiles.filter(p => p.role === 'admin' || p.role === 'hr').length}
              </div>
              <div className="text-sm text-gray-600">Admin/RH</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="mr-2" size={20} />
            Lista de Colaboradores
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {profiles.filter(p => p.status === 'active').length} de {profiles.length} ativos
            </span>
          </div>
        </div>
        <Table
          columns={columns}
          data={profiles}
          loading={loading}
          emptyMessage="Nenhum usuário encontrado"
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="text-blue-600" size={20} />
            </div>
            <span>Criar Novo Usuário</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {/* Informações Básicas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="mr-2" size={16} />
              Informações Pessoais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={formData.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: João Silva Santos"
                required
              />
              <Input
                label="Email Corporativo"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="joao.silva@empresa.com"
                required
              />
            </div>
          </div>
          
          {/* Credenciais */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Mail className="mr-2" size={16} />
              Credenciais de Acesso
            </h4>
            <Input
              label="Senha Inicial"
              type="password"
              value={formData.password || ''}
              onChange={(e) => handleFormChange('password', e.target.value)}
              placeholder="Senha temporária (usuário deve alterar no primeiro login)"
              required
              helperText="Mínimo 6 caracteres - O usuário será solicitado a alterar no primeiro acesso"
            />
          </div>

          {/* Informações Profissionais */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Briefcase className="mr-2" size={16} />
              Informações Profissionais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label="Função no Sistema"
                value={formData.role}
                onChange={(e) => handleFormChange('role', e.target.value as UserRole)}
                options={roleOptions}
                required
              />
              <Select
                label="Nível Profissional"
                value={formData.level}
                onChange={(e) => handleFormChange('level', e.target.value)}
                options={levelOptions}
                required
              />
            </div>
            <Input
              label="Cargo/Posição"
              value={formData.position || ''}
              onChange={(e) => handleFormChange('position', e.target.value)}
              placeholder="Ex: Desenvolvedor Frontend, Analista de Marketing, etc."
              required
            />
          </div>

          {/* Informações Adicionais */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informações Adicionais (Opcional)</h4>
            <div className="space-y-4">
              <Textarea
                label="Biografia/Apresentação"
                value={formData.bio || ''}
                onChange={(e) => handleFormChange('bio', e.target.value)}
                placeholder="Breve descrição sobre o colaborador, experiências, interesses..."
                rows={3}
              />
              <Textarea
                label="Formação Acadêmica"
                value={formData.formation || ''}
                onChange={(e) => handleFormChange('formation', e.target.value)}
                placeholder="Graduação, pós-graduação, certificações..."
                rows={2}
              />
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h4 className="font-medium text-indigo-900 mb-2">ℹ️ Informações Importantes</h4>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• O usuário receberá um email com as credenciais de acesso</li>
              <li>• Será solicitada a alteração da senha no primeiro login</li>
              <li>• O perfil será criado automaticamente no sistema</li>
              <li>• Competências e trilha de carreira podem ser configuradas posteriormente</li>
              <li>• O usuário começará com 0 pontos no sistema de gamificação</li>
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
              {creating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Edit className="text-orange-600" size={20} />
            </div>
            <span>Editar Usuário</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          {/* Informações Básicas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={formData.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled
                helperText="Email não pode ser alterado após criação"
              />
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informações Profissionais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label="Função no Sistema"
                value={formData.role}
                onChange={(e) => handleFormChange('role', e.target.value as UserRole)}
                options={roleOptions}
                required
              />
              <Select
                label="Nível Profissional"
                value={formData.level}
                onChange={(e) => handleFormChange('level', e.target.value)}
                options={levelOptions}
                required
              />
            </div>
            <Input
              label="Cargo/Posição"
              value={formData.position || ''}
              onChange={(e) => handleFormChange('position', e.target.value)}
              required
            />
          </div>

          {/* Informações Adicionais */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informações Adicionais</h4>
            <div className="space-y-4">
              <Textarea
                label="Biografia/Apresentação"
                value={formData.bio || ''}
                onChange={(e) => handleFormChange('bio', e.target.value)}
                rows={3}
              />
              <Textarea
                label="Formação Acadêmica"
                value={formData.formation || ''}
                onChange={(e) => handleFormChange('formation', e.target.value)}
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
    </div>
  );
};

export default UserManagement;