import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  TrendingUp, 
  Target,
  DollarSign,
  Users,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { careerTrackService, CareerTrackTemplate, StageCompetency, StageSalaryRange } from '../services/careerTrack';
import { permissionService } from '../utils/permissions';
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

const CareerTrackManagement: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CareerTrackTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CareerTrackTemplate | null>(null);
  const [stageCompetencies, setStageCompetencies] = useState<StageCompetency[]>([]);
  const [salaryRanges, setSalaryRanges] = useState<StageSalaryRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompetencyModal, setShowCompetencyModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('templates');

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    profession: '',
    track_type: 'development' as 'development' | 'specialization'
  });

  const [competencyForm, setCompetencyForm] = useState({
    stage_name: '',
    competency_name: '',
    required_level: 3,
    weight: 1.0
  });

  const [salaryForm, setSalaryForm] = useState({
    stage_name: '',
    min_salary: 0,
    max_salary: 0
  });

  const stages = [
    'Estagiário', 'Assistente', 'Júnior', 'Pleno', 
    'Sênior', 'Especialista', 'Principal'
  ];

  const competencyNames = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
    'HTML/CSS', 'SQL', 'Git', 'Docker', 'AWS',
    'Liderança', 'Comunicação', 'Trabalho em Equipe', 
    'Resolução de Problemas', 'Gestão de Tempo'
  ];

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await careerTrackService.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (permissionService.canManageCareerTracks(user.role)) {
      loadTemplates();
    } else {
      // User logged in but no access: stop loader and show message
      setLoading(false);
      setError('Você não tem permissão para acessar a gestão de trilhas.');
    }
  }, [user?.id, user?.role, loadTemplates]);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateDetails();
    }
  }, [selectedTemplate]);

  const loadTemplateDetails = async () => {
    if (!selectedTemplate) return;

    try {
      const [competencies, salaries] = await Promise.all([
        careerTrackService.getStageCompetencies(selectedTemplate.id),
        careerTrackService.getSalaryRanges(selectedTemplate.id)
      ]);

      setStageCompetencies(competencies || []);
      setSalaryRanges(salaries || []);
    } catch (error) {
      console.error('Error loading template details:', error);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const defaultStages = [
        { name: 'Estagiário', level: 1, description: 'Início da jornada profissional' },
        { name: 'Assistente', level: 2, description: 'Desenvolvimento de habilidades básicas' },
        { name: 'Júnior', level: 3, description: 'Autonomia em tarefas simples' },
        { name: 'Pleno', level: 4, description: 'Responsabilidade por projetos completos' },
        { name: 'Sênior', level: 5, description: 'Especialista técnico ou líder' },
        { name: 'Especialista', level: 6, description: 'Referência técnica na área' },
        { name: 'Principal', level: 7, description: 'Liderança estratégica' }
      ];

      await careerTrackService.createTemplate({
        ...templateForm,
        stages: defaultStages,
        created_by: user.id
      });

      setShowCreateModal(false);
      setTemplateForm({
        name: '',
        description: '',
        profession: '',
        track_type: 'development'
      });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleAddCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await careerTrackService.addStageCompetency({
        template_id: selectedTemplate.id,
        ...competencyForm
      });

      setShowCompetencyModal(false);
      setCompetencyForm({
        stage_name: '',
        competency_name: '',
        required_level: 3,
        weight: 1.0
      });
      loadTemplateDetails();
    } catch (error) {
      console.error('Error adding competency:', error);
    }
  };

  const handleSetSalaryRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await careerTrackService.setSalaryRange({
        template_id: selectedTemplate.id,
        ...salaryForm,
        currency: 'BRL'
      });

      setShowSalaryModal(false);
      setSalaryForm({
        stage_name: '',
        min_salary: 0,
        max_salary: 0
      });
      loadTemplateDetails();
    } catch (error) {
      console.error('Error setting salary range:', error);
    }
  };

  const templateColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'profession', label: 'Profissão' },
    {
      key: 'track_type',
      label: 'Tipo',
      render: (value: string) => (
        <Badge variant={value === 'development' ? 'info' : 'success'}>
          {value === 'development' ? 'Desenvolvimento' : 'Especialização'}
        </Badge>
      )
    },
    {
      key: 'stages',
      label: 'Estágios',
      render: (value: any[]) => (
        <span className="text-sm text-gray-600">{value?.length || 0} estágios</span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: CareerTrackTemplate) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedTemplate(row)}
          >
            <Edit size={16} />
          </Button>
        </div>
      )
    }
  ];

  const competencyColumns = [
    { key: 'stage_name', label: 'Estágio' },
    { key: 'competency_name', label: 'Competência' },
    { key: 'required_level', label: 'Nível Requerido' },
    { 
      key: 'weight', 
      label: 'Peso',
      render: (value: number) => value.toFixed(1)
    }
  ];

  const salaryColumns = [
    { key: 'stage_name', label: 'Estágio' },
    {
      key: 'min_salary',
      label: 'Salário Mínimo',
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`
    },
    {
      key: 'max_salary',
      label: 'Salário Máximo',
      render: (value: number) => `R$ ${value.toLocaleString('pt-BR')}`
    }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem gerenciar trilhas de carreira.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando gerenciamento de trilhas..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Trilhas</h1>
          <p className="text-gray-600 mt-1">Configure trilhas de carreira e progressão</p>
        </div>
        <ErrorMessage error={error} onRetry={loadTemplates} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Trilhas</h1>
          <p className="text-gray-600 mt-1">Configure trilhas de carreira e progressão</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          Nova Trilha
        </Button>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'templates', label: 'Templates', icon: <TrendingUp size={16} /> },
            { id: 'competencies', label: 'Competências', icon: <Target size={16} /> },
            { id: 'salaries', label: 'Faixas Salariais', icon: <DollarSign size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Templates Tab */}
      {selectedTab === 'templates' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Templates de Trilhas</h3>
          <Table
            columns={templateColumns}
            data={templates}
            loading={loading}
            emptyMessage="Nenhum template encontrado"
          />
        </Card>
      )}

      {/* Competencies Tab */}
      {selectedTab === 'competencies' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Competências por Estágio</h3>
              <div className="flex items-center space-x-3">
                <Select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                  }}
                  options={templates.map(t => ({ value: t.id, label: t.name }))}
                  placeholder="Selecione uma trilha"
                />
                <Button
                  onClick={() => setShowCompetencyModal(true)}
                  disabled={!selectedTemplate}
                >
                  <Plus size={16} className="mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
            
            {selectedTemplate ? (
              <Table
                columns={competencyColumns}
                data={stageCompetencies}
                emptyMessage="Nenhuma competência configurada"
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                Selecione uma trilha para gerenciar competências
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Salaries Tab */}
      {selectedTab === 'salaries' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Faixas Salariais</h3>
              <div className="flex items-center space-x-3">
                <Select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                  }}
                  options={templates.map(t => ({ value: t.id, label: t.name }))}
                  placeholder="Selecione uma trilha"
                />
                <Button
                  onClick={() => setShowSalaryModal(true)}
                  disabled={!selectedTemplate}
                >
                  <Plus size={16} className="mr-2" />
                  Configurar
                </Button>
              </div>
            </div>
            
            {selectedTemplate ? (
              <Table
                columns={salaryColumns}
                data={salaryRanges}
                emptyMessage="Nenhuma faixa salarial configurada"
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                Selecione uma trilha para gerenciar faixas salariais
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Nova Trilha"
        size="lg"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <Input
            label="Nome da Trilha"
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            placeholder="Ex: Trilha de Desenvolvimento - Frontend"
            required
          />

          <Textarea
            label="Descrição"
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            placeholder="Descreva o objetivo e escopo desta trilha..."
            rows={3}
          />

          <Input
            label="Profissão"
            value={templateForm.profession}
            onChange={(e) => setTemplateForm({ ...templateForm, profession: e.target.value })}
            placeholder="Ex: Desenvolvedor Frontend"
            required
          />

          <Select
            label="Tipo de Trilha"
            value={templateForm.track_type}
            onChange={(e) => setTemplateForm({ ...templateForm, track_type: e.target.value as any })}
            options={[
              { value: 'development', label: 'Desenvolvimento' },
              { value: 'specialization', label: 'Especialização' }
            ]}
            required
          />

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informações</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A trilha será criada com 7 estágios padrão</li>
              <li>• Você poderá configurar competências e salários após criação</li>
              <li>• Progressão automática será baseada em competências e PDIs</li>
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
              Criar Trilha
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Competency Modal */}
      <Modal
        isOpen={showCompetencyModal}
        onClose={() => setShowCompetencyModal(false)}
        title="Adicionar Competência ao Estágio"
        size="md"
      >
        <form onSubmit={handleAddCompetency} className="space-y-4">
          <Select
            label="Estágio"
            value={competencyForm.stage_name}
            onChange={(e) => setCompetencyForm({ ...competencyForm, stage_name: e.target.value })}
            options={stages.map(s => ({ value: s, label: s }))}
            required
          />

          <Select
            label="Competência"
            value={competencyForm.competency_name}
            onChange={(e) => setCompetencyForm({ ...competencyForm, competency_name: e.target.value })}
            options={competencyNames.map(c => ({ value: c, label: c }))}
            required
          />

          <Select
            label="Nível Requerido"
            value={competencyForm.required_level.toString()}
            onChange={(e) => setCompetencyForm({ ...competencyForm, required_level: parseInt(e.target.value) })}
            options={[
              { value: '1', label: '1 - Básico' },
              { value: '2', label: '2 - Iniciante' },
              { value: '3', label: '3 - Intermediário' },
              { value: '4', label: '4 - Avançado' },
              { value: '5', label: '5 - Especialista' }
            ]}
            required
          />

          <Input
            label="Peso (Importância)"
            type="number"
            step="0.1"
            min="0.1"
            max="3.0"
            value={competencyForm.weight}
            onChange={(e) => setCompetencyForm({ ...competencyForm, weight: parseFloat(e.target.value) })}
            helperText="1.0 = peso normal, 1.5 = mais importante, 0.5 = menos importante"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCompetencyModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Set Salary Range Modal */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title="Configurar Faixa Salarial"
        size="md"
      >
        <form onSubmit={handleSetSalaryRange} className="space-y-4">
          <Select
            label="Estágio"
            value={salaryForm.stage_name}
            onChange={(e) => setSalaryForm({ ...salaryForm, stage_name: e.target.value })}
            options={stages.map(s => ({ value: s, label: s }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salário Mínimo (R$)"
              type="number"
              min="0"
              step="100"
              value={salaryForm.min_salary}
              onChange={(e) => setSalaryForm({ ...salaryForm, min_salary: parseInt(e.target.value) })}
              required
            />

            <Input
              label="Salário Máximo (R$)"
              type="number"
              min="0"
              step="100"
              value={salaryForm.max_salary}
              onChange={(e) => setSalaryForm({ ...salaryForm, max_salary: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Orientações</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Considere o mercado regional para definir valores</li>
              <li>• Mantenha sobreposição entre estágios consecutivos</li>
              <li>• Revise periodicamente com base em pesquisas salariais</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSalaryModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Configurar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CareerTrackManagement;