import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Filter, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../services/database';
import { Competency, Profile } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

interface CompetencyFormData {
  name: string;
  type: 'hard' | 'soft';
  stage: string;
  target_level: number;
  description: string;
  profile_id?: string;
}

const CompetencyManager: React.FC = () => {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hard' | 'soft'>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [formData, setFormData] = useState<CompetencyFormData>({
    name: '',
    type: 'hard',
    stage: 'Júnior',
    target_level: 3,
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const stages = ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Líder'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [competenciesData, profilesData] = await Promise.all([
        databaseService.getAllCompetencies(),
        databaseService.getProfiles()
      ]);
      setCompetencies(competenciesData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Nome deve ter no mínimo 3 caracteres';
    }

    if (!formData.stage) {
      errors.stage = 'Estágio é obrigatório';
    }

    if (formData.target_level < 1 || formData.target_level > 5) {
      errors.target_level = 'Nível alvo deve estar entre 1 e 5';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Descrição deve ter no mínimo 10 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (competency?: Competency) => {
    if (competency) {
      setEditingCompetency(competency);
      setFormData({
        name: competency.name,
        type: competency.type,
        stage: competency.stage,
        target_level: competency.target_level,
        description: competency.description || '',
        profile_id: competency.profile_id
      });
    } else {
      setEditingCompetency(null);
      setFormData({
        name: '',
        type: 'hard',
        stage: 'Júnior',
        target_level: 3,
        description: ''
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompetency(null);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (editingCompetency) {
        await databaseService.updateCompetency(editingCompetency.id, formData);
      } else {
        if (!formData.profile_id) {
          setFormErrors({ profile_id: 'Selecione um colaborador' });
          return;
        }
        await databaseService.createCompetency({
          ...formData,
          profile_id: formData.profile_id,
          self_rating: null,
          manager_rating: null
        });
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving competency:', error);
      setFormErrors({ submit: 'Erro ao salvar competência. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta competência?')) {
      return;
    }

    try {
      await databaseService.deleteCompetency(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting competency:', error);
      alert('Erro ao excluir competência. Tente novamente.');
    }
  };

  const filteredCompetencies = competencies.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || comp.type === filterType;
    const matchesStage = filterStage === 'all' || comp.stage === filterStage;
    return matchesSearch && matchesType && matchesStage;
  });

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.name || 'Desconhecido';
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Competências</h2>
          <p className="text-gray-600 mt-1">Crie e gerencie competências dos colaboradores</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={16} className="mr-2" />
          Nova Competência
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                icon={Search}
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'hard' | 'soft')}
            >
              <option value="all">Todos os tipos</option>
              <option value="hard">Hard Skills</option>
              <option value="soft">Soft Skills</option>
            </Select>
            <Select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
            >
              <option value="all">Todos os estágios</option>
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </Select>
          </div>

          {filteredCompetencies.length === 0 ? (
            <div className="text-center py-12">
              <Filter size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma competência encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' || filterStage !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova competência'}
              </p>
              {(searchTerm || filterType !== 'all' || filterStage !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterStage('all');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCompetencies.map((competency) => (
                <motion.div
                  key={competency.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{competency.name}</h4>
                      <Badge variant={competency.type === 'hard' ? 'info' : 'success'}>
                        {competency.type === 'hard' ? 'Hard Skill' : 'Soft Skill'}
                      </Badge>
                      <Badge variant="default">{competency.stage}</Badge>
                      <Badge variant="warning">Meta: {competency.target_level}/5</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{competency.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Colaborador: {getProfileName(competency.profile_id)}</span>
                      <span>Auto: {competency.self_rating || '-'}/5</span>
                      <span>Gestor: {competency.manager_rating || '-'}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(competency)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(competency.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {filteredCompetencies.length > 0 && (
            <div className="text-sm text-gray-600 text-center pt-4 border-t">
              Mostrando {filteredCompetencies.length} de {competencies.length} competências
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCompetency ? 'Editar Competência' : 'Nova Competência'}
      >
        <div className="space-y-4">
          {!editingCompetency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colaborador *
              </label>
              <Select
                value={formData.profile_id || ''}
                onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
                error={formErrors.profile_id}
              >
                <option value="">Selecione um colaborador</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} - {profile.position}
                  </option>
                ))}
              </Select>
              {formErrors.profile_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.profile_id}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Competência *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Liderança de Equipes"
              error={formErrors.name}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'hard' | 'soft' })}
              >
                <option value="hard">Hard Skill</option>
                <option value="soft">Soft Skill</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estágio *
              </label>
              <Select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                error={formErrors.stage}
              >
                {stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </Select>
              {formErrors.stage && (
                <p className="mt-1 text-sm text-red-600">{formErrors.stage}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível Alvo (1-5) *
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="5"
                value={formData.target_level}
                onChange={(e) => setFormData({ ...formData, target_level: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-blue-600 w-12 text-center">
                {formData.target_level}
              </span>
            </div>
            {formErrors.target_level && (
              <p className="mt-1 text-sm text-red-600">{formErrors.target_level}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a competência e os critérios de avaliação..."
              rows={4}
              error={formErrors.description}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
            )}
          </div>

          {formErrors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formErrors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingCompetency ? 'Salvar Alterações' : 'Criar Competência'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompetencyManager;