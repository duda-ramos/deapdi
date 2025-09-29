import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, X, User, Briefcase, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { authService } from '../services/auth';
import { SalaryEntry } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Timeline } from '../components/ui/Timeline';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    formation: user?.formation || '',
    avatar_url: user?.avatar_url || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        bio: user.bio || '',
        formation: user.formation || '',
        avatar_url: user.avatar_url || ''
      });
      loadSalaryHistory();
    }
  }, [user]);

  const loadSalaryHistory = async () => {
    if (!user) return;
    
    try {
      const history = await databaseService.getSalaryHistory(user.id);
      setSalaryHistory(history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico salarial:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await authService.updateProfile(user.id, {
        name: formData.name,
        bio: formData.bio || null,
        formation: formData.formation || null,
        avatar_url: formData.avatar_url || null
      });
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        bio: user.bio || '',
        formation: user.formation || '',
        avatar_url: user.avatar_url || ''
      });
    }
    setIsEditing(false);
  };

  const formatSalaryHistory = () => {
    return salaryHistory.map(entry => ({
      id: entry.id,
      date: new Date(entry.effective_date).toLocaleDateString('pt-BR'),
      title: entry.position,
      description: entry.reason,
      amount: entry.amount,
      type: 'salary' as const
    }));
  };

  const renderPersonalityTest = () => {
    if (!user?.personality_test_results) return null;

    try {
      const results = typeof user.personality_test_results === 'string' 
        ? JSON.parse(user.personality_test_results)
        : user.personality_test_results;

      return (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Perfil de Personalidade
          </h3>
          <div className="space-y-3">
            {Object.entries(results).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                <Badge variant="info">{String(value)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      );
    } catch (error) {
      console.error('Erro ao processar resultados do teste:', error);
      return null;
    }
  };

  if (!user) {
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
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e profissionais</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit size={20} className="mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleSave} loading={loading}>
              <Save size={20} className="mr-2" />
              Salvar
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              <X size={20} className="mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-6">
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={formData.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white ${
                user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
                <Input
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="URL da foto"
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <Badge variant="info" className="block">
                {user.position}
              </Badge>
              <Badge variant="success" className="block">
                Nível {user.level}
              </Badge>
              <div className="text-center mt-4">
                <div className="text-2xl font-bold text-blue-600">{user.points}</div>
                <div className="text-sm text-gray-500">Pontos</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Briefcase className="mr-2" size={20} />
              Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <p className="text-gray-900">{user.position}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                <p className="text-gray-900">{user.level}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <p className="text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                  {user.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sobre Mim</h3>
            {isEditing ? (
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Conte um pouco sobre você..."
                rows={4}
              />
            ) : (
              <p className="text-gray-700">
                {user.bio || 'Nenhuma informação adicionada ainda.'}
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Formação</h3>
            {isEditing ? (
              <Textarea
                value={formData.formation}
                onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
                placeholder="Descreva sua formação acadêmica e cursos..."
                rows={3}
              />
            ) : (
              <p className="text-gray-700">
                {user.formation || 'Nenhuma formação cadastrada ainda.'}
              </p>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Histórico Salarial
          </h3>
          {salaryHistory.length > 0 ? (
            <Timeline items={formatSalaryHistory()} />
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhum histórico salarial encontrado</p>
            </div>
          )}
        </Card>

        {/* Personality Test Results */}
        {renderPersonalityTest()}
      </div>
    </div>
  );
};

export default Profile;