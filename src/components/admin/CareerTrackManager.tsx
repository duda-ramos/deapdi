import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Layers,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  careerTrackService, 
  CareerTrackTemplate, 
  CareerStage, 
  StageCompetency, 
  StageSalaryRange,
  CareerTrackStats,
  CareerTrackDependencies
} from '../../services/careerTrack';
import { databaseService } from '../../services/database';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

// Types
interface StageFormData {
  name: string;
  level: number;
  description: string;
  order: number;
}

interface StageCompetencyFormData {
  competency_name: string;
  required_level: number;
  weight: number;
}

interface StageSalaryFormData {
  min_salary: number;
  max_salary: number;
  enabled: boolean;
}

interface FormData {
  name: string;
  description: string;
  profession: string;
  target_role: string;
  area: string;
  track_type: 'development' | 'specialization';
  stages: StageFormData[];
  competencies: Record<string, StageCompetencyFormData[]>;
  salaries: Record<string, StageSalaryFormData>;
}

// Constants
const AREAS = [
  'Tecnologia',
  'Vendas',
  'Marketing',
  'Operações',
  'Financeiro',
  'RH',
  'Administrativo',
  'Produto',
  'Design',
  'Atendimento'
];

const PROFICIENCY_LEVELS = [
  { level: 1, label: 'Básico', color: 'bg-gray-200' },
  { level: 2, label: 'Intermediário', color: 'bg-blue-200' },
  { level: 3, label: 'Avançado', color: 'bg-green-200' },
  { level: 4, label: 'Expert', color: 'bg-purple-200' },
  { level: 5, label: 'Master', color: 'bg-amber-200' }
];

const DEFAULT_STAGES: StageFormData[] = [
  { name: 'Júnior', level: 1, description: 'Início da jornada, aprendizado constante', order: 1 },
  { name: 'Pleno', level: 2, description: 'Autonomia em tarefas, responsabilidade crescente', order: 2 },
  { name: 'Sênior', level: 3, description: 'Especialista técnico, mentor de outros', order: 3 }
];

const CareerTrackManager: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [templates, setTemplates] = useState<CareerTrackTemplate[]>([]);
  const [stats, setStats] = useState<CareerTrackStats | null>(null);
  const [availableCompetencies, setAvailableCompetencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'development' | 'specialization'>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  
  // Modal states
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState<CareerTrackTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<CareerTrackTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<CareerTrackTemplate | null>(null);
  const [duplicatingTemplate, setDuplicatingTemplate] = useState<CareerTrackTemplate | null>(null);
  const [dependencies, setDependencies] = useState<CareerTrackDependencies | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    profession: '',
    target_role: '',
    area: '',
    track_type: 'development',
    stages: [...DEFAULT_STAGES],
    competencies: {},
    salaries: {}
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // View modal state
  const [viewCompetencies, setViewCompetencies] = useState<StageCompetency[]>([]);
  const [viewSalaries, setViewSalaries] = useState<StageSalaryRange[]>([]);
  const [viewUsers, setViewUsers] = useState<any[]>([]);

  // Check if user can manage salaries (HR or Admin)
  const canManageSalaries = user?.role === 'admin' || user?.role === 'hr';

  // Load data
  useEffect(() => {
    loadData();
    loadAvailableCompetencies();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, statsData] = await Promise.all([
        careerTrackService.getTemplates(),
        careerTrackService.getStats()
      ]);
      setTemplates(templatesData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCompetencies = async () => {
    try {
      const competencies = await databaseService.getAllCompetencies();
      const uniqueNames = [...new Set((competencies || []).map((c: any) => c.name))];
      setAvailableCompetencies(uniqueNames);
    } catch (error) {
      console.error('Error loading competencies:', error);
    }
  };

  // Wizard handlers
  const openWizard = async (template?: CareerTrackTemplate) => {
    if (template) {
      setEditingTemplate(template);
      
      // Load existing competencies and salaries
      const [competencies, salaries] = await Promise.all([
        careerTrackService.getStageCompetencies(template.id),
        canManageSalaries ? careerTrackService.getSalaryRanges(template.id) : Promise.resolve([])
      ]);
      
      // Build competencies map
      const competenciesMap: Record<string, StageCompetencyFormData[]> = {};
      (template.stages || []).forEach(stage => {
        competenciesMap[stage.name] = (competencies || [])
          .filter((c: StageCompetency) => c.stage_name === stage.name)
          .map((c: StageCompetency) => ({
            competency_name: c.competency_name,
            required_level: c.required_level,
            weight: c.weight
          }));
      });
      
      // Build salaries map
      const salariesMap: Record<string, StageSalaryFormData> = {};
      (template.stages || []).forEach(stage => {
        const existing = (salaries || []).find((s: StageSalaryRange) => s.stage_name === stage.name);
        salariesMap[stage.name] = existing 
          ? { min_salary: existing.min_salary, max_salary: existing.max_salary, enabled: true }
          : { min_salary: 0, max_salary: 0, enabled: false };
      });
      
      setFormData({
        name: template.name,
        description: template.description || '',
        profession: template.profession,
        target_role: template.target_role || '',
        area: template.area || '',
        track_type: template.track_type,
        stages: (template.stages || []).map((s, i) => ({
          name: s.name,
          level: s.level,
          description: s.description || '',
          order: i + 1
        })),
        competencies: competenciesMap,
        salaries: salariesMap
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        profession: '',
        target_role: '',
        area: '',
        track_type: 'development',
        stages: [...DEFAULT_STAGES],
        competencies: {},
        salaries: {}
      });
    }
    
    setWizardStep(1);
    setFormErrors({});
    setShowWizardModal(true);
  };

  const closeWizard = () => {
    setShowWizardModal(false);
    setEditingTemplate(null);
    setWizardStep(1);
    setFormErrors({});
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
        else if (formData.name.trim().length < 3) errors.name = 'Nome deve ter no mínimo 3 caracteres';
        else {
          const duplicate = templates.find(t => 
            t.name.toLowerCase() === formData.name.trim().toLowerCase() && 
            t.id !== editingTemplate?.id
          );
          if (duplicate) errors.name = 'Já existe uma trilha com este nome';
        }
        if (!formData.profession.trim()) errors.profession = 'Profissão é obrigatória';
        break;
        
      case 2:
        if (formData.stages.length < 2) errors.stages = 'Mínimo de 2 estágios necessários';
        if (formData.stages.length > 10) errors.stages = 'Máximo de 10 estágios permitidos';
        
        const stageNames = formData.stages.map(s => s.name.toLowerCase());
        const hasDuplicateStages = stageNames.length !== new Set(stageNames).size;
        if (hasDuplicateStages) errors.stages = 'Nomes de estágios devem ser únicos';
        
        formData.stages.forEach((stage, index) => {
          if (!stage.name.trim()) errors[`stage_${index}_name`] = 'Nome do estágio é obrigatório';
        });
        break;
        
      case 3:
        // Check at least 1 competency per stage
        for (const stage of formData.stages) {
          const stageComps = formData.competencies[stage.name] || [];
          if (stageComps.length === 0) {
            errors[`competencies_${stage.name}`] = `Adicione ao menos 1 competência para ${stage.name}`;
          }
          if (stageComps.length > 20) {
            errors[`competencies_${stage.name}`] = `Máximo de 20 competências por estágio`;
          }
        }
        break;
        
      case 4:
        // Validate salary ranges if enabled
        if (canManageSalaries) {
          for (const stage of formData.stages) {
            const salary = formData.salaries[stage.name];
            if (salary?.enabled) {
              if (salary.min_salary <= 0) errors[`salary_${stage.name}_min`] = 'Valor mínimo deve ser maior que 0';
              if (salary.max_salary <= 0) errors[`salary_${stage.name}_max`] = 'Valor máximo deve ser maior que 0';
              if (salary.min_salary >= salary.max_salary) {
                errors[`salary_${stage.name}`] = 'Valor mínimo deve ser menor que máximo';
              }
            }
          }
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setWizardStep(prev => Math.max(prev - 1, 1));
  };

  // Save template
  const handleSave = async () => {
    if (!user) return;
    if (!validateStep(wizardStep)) return;
    
    try {
      setSaving(true);
      
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        profession: formData.profession.trim(),
        target_role: formData.target_role.trim(),
        area: formData.area,
        track_type: formData.track_type,
        stages: formData.stages.map((s, i) => ({
          name: s.name.trim(),
          level: s.level,
          description: s.description.trim(),
          order: i + 1
        })),
        is_active: true
      };
      
      let templateId: string;
      
      if (editingTemplate) {
        await careerTrackService.updateTemplate(editingTemplate.id, templateData);
        templateId = editingTemplate.id;
      } else {
        const created = await careerTrackService.createTemplate({
          ...templateData,
          created_by: user.id
        });
        templateId = created.id;
      }
      
      // Save competencies for each stage
      for (const stage of formData.stages) {
        const stageComps = formData.competencies[stage.name] || [];
        await careerTrackService.bulkSaveStageCompetencies(
          templateId,
          stage.name,
          stageComps.map(c => ({
            competency_name: c.competency_name,
            required_level: c.required_level,
            weight: c.weight
          }))
        );
      }
      
      // Save salary ranges if user has permission
      if (canManageSalaries) {
        const salaryRanges = formData.stages
          .filter(stage => formData.salaries[stage.name]?.enabled)
          .map(stage => ({
            stage_name: stage.name,
            min_salary: formData.salaries[stage.name].min_salary,
            max_salary: formData.salaries[stage.name].max_salary,
            currency: 'BRL'
          }));
        
        await careerTrackService.bulkSaveSalaryRanges(templateId, salaryRanges);
      }
      
      await loadData();
      closeWizard();
    } catch (error) {
      console.error('Error saving template:', error);
      setFormErrors({ submit: 'Erro ao salvar trilha. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  // Stage management
  const addStage = () => {
    if (formData.stages.length >= 10) return;
    
    const newOrder = formData.stages.length + 1;
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, {
        name: `Estágio ${newOrder}`,
        level: newOrder,
        description: '',
        order: newOrder
      }]
    }));
  };

  const removeStage = (index: number) => {
    if (formData.stages.length <= 2) return;
    
    const stageName = formData.stages[index].name;
    setFormData(prev => {
      const newStages = prev.stages.filter((_, i) => i !== index);
      const newCompetencies = { ...prev.competencies };
      delete newCompetencies[stageName];
      const newSalaries = { ...prev.salaries };
      delete newSalaries[stageName];
      
      return {
        ...prev,
        stages: newStages.map((s, i) => ({ ...s, order: i + 1, level: i + 1 })),
        competencies: newCompetencies,
        salaries: newSalaries
      };
    });
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.stages.length) return;
    
    setFormData(prev => {
      const newStages = [...prev.stages];
      [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
      return {
        ...prev,
        stages: newStages.map((s, i) => ({ ...s, order: i + 1, level: i + 1 }))
      };
    });
  };

  const updateStage = (index: number, field: keyof StageFormData, value: string | number) => {
    setFormData(prev => {
      const newStages = [...prev.stages];
      const oldName = newStages[index].name;
      newStages[index] = { ...newStages[index], [field]: value };
      
      // If name changed, update competencies and salaries keys
      if (field === 'name' && oldName !== value) {
        const newCompetencies = { ...prev.competencies };
        const newSalaries = { ...prev.salaries };
        
        if (newCompetencies[oldName]) {
          newCompetencies[value as string] = newCompetencies[oldName];
          delete newCompetencies[oldName];
        }
        
        if (newSalaries[oldName]) {
          newSalaries[value as string] = newSalaries[oldName];
          delete newSalaries[oldName];
        }
        
        return { ...prev, stages: newStages, competencies: newCompetencies, salaries: newSalaries };
      }
      
      return { ...prev, stages: newStages };
    });
  };

  // Competency management
  const addCompetency = (stageName: string) => {
    const currentComps = formData.competencies[stageName] || [];
    if (currentComps.length >= 20) return;
    
    setFormData(prev => ({
      ...prev,
      competencies: {
        ...prev.competencies,
        [stageName]: [...currentComps, { competency_name: '', required_level: 3, weight: 5 }]
      }
    }));
  };

  const updateCompetency = (
    stageName: string, 
    index: number, 
    field: keyof StageCompetencyFormData, 
    value: string | number
  ) => {
    setFormData(prev => {
      const newComps = [...(prev.competencies[stageName] || [])];
      newComps[index] = { ...newComps[index], [field]: value };
      return {
        ...prev,
        competencies: { ...prev.competencies, [stageName]: newComps }
      };
    });
  };

  const removeCompetency = (stageName: string, index: number) => {
    setFormData(prev => {
      const newComps = [...(prev.competencies[stageName] || [])];
      newComps.splice(index, 1);
      return {
        ...prev,
        competencies: { ...prev.competencies, [stageName]: newComps }
      };
    });
  };

  // Salary management
  const updateSalary = (stageName: string, field: keyof StageSalaryFormData, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      salaries: {
        ...prev.salaries,
        [stageName]: { ...prev.salaries[stageName], [field]: value }
      }
    }));
  };

  // View template
  const openViewModal = async (template: CareerTrackTemplate) => {
    setViewingTemplate(template);
    
    const [competencies, salaries, users] = await Promise.all([
      careerTrackService.getStageCompetencies(template.id),
      canManageSalaries ? careerTrackService.getSalaryRanges(template.id) : Promise.resolve([]),
      careerTrackService.getUsersInTrack(template.id)
    ]);
    
    setViewCompetencies(competencies || []);
    setViewSalaries(salaries || []);
    setViewUsers(users || []);
    setShowViewModal(true);
  };

  // Delete template
  const openDeleteModal = async (template: CareerTrackTemplate) => {
    setDeletingTemplate(template);
    const deps = await careerTrackService.checkDependencies(template.id);
    setDependencies(deps);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    
    try {
      setDeleting(true);
      await careerTrackService.deleteTemplate(deletingTemplate.id);
      await loadData();
      setShowDeleteModal(false);
      setDeletingTemplate(null);
      setDependencies(null);
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Duplicate template
  const openDuplicateModal = (template: CareerTrackTemplate) => {
    setDuplicatingTemplate(template);
    setDuplicateName(`${template.name} (Cópia)`);
    setShowDuplicateModal(true);
  };

  const handleDuplicate = async () => {
    if (!duplicatingTemplate || !user || !duplicateName.trim()) return;
    
    try {
      setSaving(true);
      await careerTrackService.duplicateTemplate(duplicatingTemplate.id, duplicateName.trim(), user.id);
      await loadData();
      setShowDuplicateModal(false);
      setDuplicatingTemplate(null);
      setDuplicateName('');
    } catch (error) {
      console.error('Error duplicating template:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.track_type === filterType;
    const matchesArea = filterArea === 'all' || t.area === filterArea;
    return matchesSearch && matchesType && matchesArea;
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Trilhas de Carreira</h2>
          <p className="text-gray-600 mt-1">Configure trilhas de progressão profissional</p>
        </div>
        <Button onClick={() => openWizard()}>
          <Plus size={16} className="mr-2" />
          Nova Trilha
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layers size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Trilhas</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalTracks}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ativas</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeTracks}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estágios</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalStages}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Competências</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalCompetencies}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Users size={20} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Usuários</p>
                <p className="text-xl font-bold text-gray-900">{stats.usersInTracks}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por nome, profissão ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
            >
              <option value="all">Todos os tipos</option>
              <option value="development">Desenvolvimento</option>
              <option value="specialization">Especialização</option>
            </select>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
            >
              <option value="all">Todas as áreas</option>
              {AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Layers size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma trilha encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' || filterArea !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova trilha de carreira'}
              </p>
              {!searchTerm && filterType === 'all' && filterArea === 'all' && (
                <Button onClick={() => openWizard()}>
                  <Plus size={16} className="mr-2" />
                  Criar Primeira Trilha
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="p-4 h-full flex flex-col" hover>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                          <p className="text-sm text-gray-500">{template.profession}</p>
                        </div>
                        <Badge variant={template.track_type === 'development' ? 'info' : 'success'} size="sm">
                          {template.track_type === 'development' ? 'Dev' : 'Esp'}
                        </Badge>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="default" size="sm">
                          {template.stages?.length || 0} estágios
                        </Badge>
                        {template.area && (
                          <Badge variant="default" size="sm">{template.area}</Badge>
                        )}
                      </div>

                      {/* Timeline Preview */}
                      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                        {(template.stages || []).slice(0, 5).map((stage, index) => (
                          <React.Fragment key={stage.name}>
                            <div 
                              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                                PROFICIENCY_LEVELS[Math.min(stage.level - 1, 4)]?.color || 'bg-gray-200'
                              }`}
                            >
                              {stage.name}
                            </div>
                            {index < Math.min((template.stages || []).length - 1, 4) && (
                              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                        {(template.stages || []).length > 5 && (
                          <span className="text-xs text-gray-400">+{(template.stages || []).length - 5}</span>
                        )}
                      </div>
                      
                      <div className="mt-auto flex items-center justify-end gap-1 pt-3 border-t">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(template)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openWizard(template)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDuplicateModal(template)}>
                          <Copy size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteModal(template)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Card>

      {/* Wizard Modal */}
      <Modal
        isOpen={showWizardModal}
        onClose={closeWizard}
        title={editingTemplate ? 'Editar Trilha de Carreira' : 'Nova Trilha de Carreira'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === wizardStep
                      ? 'bg-blue-600 text-white'
                      : step < wizardStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < wizardStep ? <Check size={16} /> : step}
                </div>
                {step < 5 && (
                  <div className={`w-12 md:w-20 h-1 mx-1 ${
                    step < wizardStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-600 mb-4">
            {wizardStep === 1 && 'Informações Básicas'}
            {wizardStep === 2 && 'Definir Estágios'}
            {wizardStep === 3 && 'Competências por Estágio'}
            {wizardStep === 4 && 'Ranges Salariais'}
            {wizardStep === 5 && 'Revisão e Confirmação'}
          </div>

          {/* Step 1: Basic Info */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Trilha *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Trilha de Desenvolvimento Frontend"
                  error={formErrors.name}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo e escopo desta trilha..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profissão *</label>
                  <Input
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Ex: Desenvolvedor Frontend"
                    error={formErrors.profession}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público-alvo</label>
                  <Input
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    placeholder="Ex: Desenvolvedores"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={formData.track_type}
                    onChange={(e) => setFormData({ ...formData, track_type: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                  >
                    <option value="development">Desenvolvimento</option>
                    <option value="specialization">Especialização</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                  >
                    <option value="">Selecione uma área</option>
                    {AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Define Stages */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              {formErrors.stages && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {formErrors.stages}
                </div>
              )}
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {formData.stages.map((stage, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveStage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveStage(index, 'down')}
                        disabled={index === formData.stages.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nome do Estágio</label>
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(index, 'name', e.target.value)}
                          placeholder="Ex: Júnior"
                          error={formErrors[`stage_${index}_name`]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nível (1-5)</label>
                        <select
                          value={stage.level}
                          onChange={(e) => updateStage(index, 'level', parseInt(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                        >
                          {PROFICIENCY_LEVELS.map(l => (
                            <option key={l.level} value={l.level}>{l.level} - {l.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                        <Input
                          value={stage.description}
                          onChange={(e) => updateStage(index, 'description', e.target.value)}
                          placeholder="Breve descrição..."
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeStage(index)}
                      disabled={formData.stages.length <= 2}
                      className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                onClick={addStage}
                disabled={formData.stages.length >= 10}
              >
                <Plus size={16} className="mr-2" />
                Adicionar Estágio
              </Button>
              
              {/* Timeline Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preview da Trilha</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {formData.stages.map((stage, index) => (
                    <React.Fragment key={index}>
                      <div className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                        PROFICIENCY_LEVELS[Math.min(stage.level - 1, 4)]?.color || 'bg-gray-200'
                      }`}>
                        {stage.name || `Estágio ${index + 1}`}
                      </div>
                      {index < formData.stages.length - 1 && (
                        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Stage Competencies */}
          {wizardStep === 3 && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {formData.stages.map((stage) => (
                <div key={stage.name} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{stage.name}</Badge>
                      <span className="text-sm text-gray-600">
                        {(formData.competencies[stage.name] || []).length}/20 competências
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => addCompetency(stage.name)}
                      disabled={(formData.competencies[stage.name] || []).length >= 20}
                    >
                      <Plus size={14} className="mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {formErrors[`competencies_${stage.name}`] && (
                    <div className="px-4 py-2 bg-red-50 text-sm text-red-600">
                      {formErrors[`competencies_${stage.name}`]}
                    </div>
                  )}
                  
                  <div className="p-4 space-y-3">
                    {(formData.competencies[stage.name] || []).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma competência adicionada
                      </p>
                    ) : (
                      (formData.competencies[stage.name] || []).map((comp, compIndex) => (
                        <div key={compIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <select
                              value={comp.competency_name}
                              onChange={(e) => updateCompetency(stage.name, compIndex, 'competency_name', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                            >
                              <option value="">Selecione uma competência</option>
                              {availableCompetencies.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-32">
                            <label className="block text-xs text-gray-500 mb-1">Nível</label>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={comp.required_level}
                              onChange={(e) => updateCompetency(stage.name, compIndex, 'required_level', parseInt(e.target.value))}
                              className="w-full"
                            />
                            <div className="text-xs text-center text-gray-600">
                              {PROFICIENCY_LEVELS[comp.required_level - 1]?.label}
                            </div>
                          </div>
                          <div className="w-28">
                            <label className="block text-xs text-gray-500 mb-1">Peso</label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={comp.weight}
                              onChange={(e) => updateCompetency(stage.name, compIndex, 'weight', parseInt(e.target.value))}
                              className="w-full"
                            />
                            <div className="text-xs text-center text-gray-600">{comp.weight}/10</div>
                          </div>
                          <button
                            onClick={() => removeCompetency(stage.name, compIndex)}
                            className="p-2 text-red-400 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Salary Ranges */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              {!canManageSalaries ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle size={20} />
                    <span className="font-medium">Acesso Restrito</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Apenas usuários com perfil HR ou Admin podem configurar faixas salariais.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <DollarSign size={20} />
                      <span className="font-medium">Dados Sensíveis</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      As faixas salariais são protegidas por RLS e visíveis apenas para HR e Admin.
                    </p>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {formData.stages.map((stage) => {
                      const salary = formData.salaries[stage.name] || { min_salary: 0, max_salary: 0, enabled: false };
                      
                      return (
                        <div key={stage.name} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{stage.name}</Badge>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={salary.enabled}
                                onChange={(e) => updateSalary(stage.name, 'enabled', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-600">Definir faixa salarial</span>
                            </label>
                          </div>
                          
                          {salary.enabled && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Salário Mínimo (R$)</label>
                                <Input
                                  type="number"
                                  value={salary.min_salary || ''}
                                  onChange={(e) => updateSalary(stage.name, 'min_salary', parseInt(e.target.value) || 0)}
                                  placeholder="3000"
                                  error={formErrors[`salary_${stage.name}_min`] || formErrors[`salary_${stage.name}`]}
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Salário Máximo (R$)</label>
                                <Input
                                  type="number"
                                  value={salary.max_salary || ''}
                                  onChange={(e) => updateSalary(stage.name, 'max_salary', parseInt(e.target.value) || 0)}
                                  placeholder="5000"
                                  error={formErrors[`salary_${stage.name}_max`]}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {wizardStep === 5 && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Basic Info Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nome:</span>
                    <span className="ml-2 font-medium">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Profissão:</span>
                    <span className="ml-2 font-medium">{formData.profession}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <Badge variant={formData.track_type === 'development' ? 'info' : 'success'} size="sm" className="ml-2">
                      {formData.track_type === 'development' ? 'Desenvolvimento' : 'Especialização'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Área:</span>
                    <span className="ml-2 font-medium">{formData.area || '-'}</span>
                  </div>
                </div>
                {formData.description && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Descrição:</span>
                    <p className="mt-1 text-gray-700">{formData.description}</p>
                  </div>
                )}
              </div>
              
              {/* Timeline */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Timeline da Trilha</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {formData.stages.map((stage, index) => (
                    <React.Fragment key={index}>
                      <div className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap ${
                        PROFICIENCY_LEVELS[Math.min(stage.level - 1, 4)]?.color || 'bg-gray-200'
                      }`}>
                        <div>{stage.name}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {(formData.competencies[stage.name] || []).length} competências
                        </div>
                      </div>
                      {index < formData.stages.length - 1 && (
                        <ChevronRight size={24} className="text-gray-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              {/* Competencies Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Competências por Estágio</h4>
                <div className="space-y-3">
                  {formData.stages.map(stage => {
                    const comps = formData.competencies[stage.name] || [];
                    return (
                      <div key={stage.name} className="flex items-start gap-3">
                        <Badge variant="default" className="whitespace-nowrap">{stage.name}</Badge>
                        <div className="flex flex-wrap gap-1">
                          {comps.length === 0 ? (
                            <span className="text-sm text-gray-400">Nenhuma</span>
                          ) : (
                            comps.map((c, i) => (
                              <Badge key={i} variant="info" size="sm">
                                {c.competency_name} (Nv.{c.required_level})
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Salaries Summary */}
              {canManageSalaries && Object.values(formData.salaries).some(s => s.enabled) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Faixas Salariais</h4>
                  <div className="space-y-2">
                    {formData.stages.map(stage => {
                      const salary = formData.salaries[stage.name];
                      if (!salary?.enabled) return null;
                      return (
                        <div key={stage.name} className="flex items-center justify-between text-sm">
                          <Badge variant="default">{stage.name}</Badge>
                          <span className="text-gray-700">
                            {formatCurrency(salary.min_salary)} - {formatCurrency(salary.max_salary)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {formErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {formErrors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={wizardStep === 1 ? closeWizard : prevStep}
            >
              <ChevronLeft size={16} className="mr-2" />
              {wizardStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            
            {wizardStep < 5 ? (
              <Button onClick={nextStep}>
                Próximo
                <ChevronRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} loading={saving}>
                <Check size={16} className="mr-2" />
                {editingTemplate ? 'Salvar Alterações' : 'Criar Trilha'}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingTemplate(null);
        }}
        title={viewingTemplate?.name || 'Detalhes da Trilha'}
        size="xl"
      >
        {viewingTemplate && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600">{viewingTemplate.profession}</p>
                {viewingTemplate.description && (
                  <p className="text-sm text-gray-500 mt-2">{viewingTemplate.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={viewingTemplate.track_type === 'development' ? 'info' : 'success'}>
                  {viewingTemplate.track_type === 'development' ? 'Desenvolvimento' : 'Especialização'}
                </Badge>
                {viewingTemplate.area && <Badge variant="default">{viewingTemplate.area}</Badge>}
              </div>
            </div>
            
            {/* Timeline */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Timeline da Trilha</h4>
              <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                {(viewingTemplate.stages || []).map((stage, index) => (
                  <React.Fragment key={stage.name}>
                    <div className={`flex-1 min-w-[150px] p-4 rounded-lg ${
                      PROFICIENCY_LEVELS[Math.min(stage.level - 1, 4)]?.color || 'bg-gray-200'
                    }`}>
                      <div className="font-medium text-gray-900">{stage.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{stage.description}</div>
                      <div className="mt-3 space-y-1">
                        <div className="text-xs">
                          <span className="font-medium">
                            {viewCompetencies.filter(c => c.stage_name === stage.name).length}
                          </span> competências
                        </div>
                        {viewUsers.filter(u => u.current_stage === stage.name).length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">
                              {viewUsers.filter(u => u.current_stage === stage.name).length}
                            </span> usuários
                          </div>
                        )}
                        {canManageSalaries && viewSalaries.find(s => s.stage_name === stage.name) && (
                          <div className="text-xs text-green-700">
                            {formatCurrency(viewSalaries.find(s => s.stage_name === stage.name)!.min_salary)} - 
                            {formatCurrency(viewSalaries.find(s => s.stage_name === stage.name)!.max_salary)}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < (viewingTemplate.stages || []).length - 1 && (
                      <div className="flex items-center">
                        <ChevronRight size={24} className="text-gray-400" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Competencies Detail */}
            {viewCompetencies.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Competências Detalhadas</h4>
                <div className="space-y-3">
                  {(viewingTemplate.stages || []).map(stage => {
                    const stageComps = viewCompetencies.filter(c => c.stage_name === stage.name);
                    if (stageComps.length === 0) return null;
                    
                    return (
                      <div key={stage.name} className="border border-gray-200 rounded-lg p-4">
                        <Badge variant="default" className="mb-3">{stage.name}</Badge>
                        <div className="space-y-2">
                          {stageComps.map(comp => (
                            <div key={comp.id} className="flex items-center justify-between text-sm">
                              <span>{comp.competency_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-500">
                                  Nível {comp.required_level} ({PROFICIENCY_LEVELS[comp.required_level - 1]?.label})
                                </span>
                                <span className="text-gray-400">Peso: {comp.weight}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Users in Track */}
            {viewUsers.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Colaboradores na Trilha ({viewUsers.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {viewUsers.slice(0, 9).map((user: any) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {user.profile?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.profile?.name || 'Desconhecido'}
                        </div>
                        <div className="text-xs text-gray-500">{user.current_stage}</div>
                      </div>
                    </div>
                  ))}
                  {viewUsers.length > 9 && (
                    <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg text-sm text-gray-500">
                      +{viewUsers.length - 9} mais
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                openWizard(viewingTemplate);
              }}>
                <Pencil size={16} className="mr-2" />
                Editar Trilha
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTemplate(null);
          setDependencies(null);
        }}
        title="Excluir Trilha"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                Tem certeza que deseja excluir esta trilha?
              </p>
              {deletingTemplate && (
                <p className="text-gray-600 mt-1">
                  <strong>{deletingTemplate.name}</strong>
                </p>
              )}
            </div>
          </div>

          {dependencies?.hasActiveDependencies && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                <AlertTriangle size={16} />
                Atenção: Esta trilha possui dependências ativas
              </div>
              <ul className="text-sm text-amber-600 space-y-1">
                <li>• {dependencies.usersCount} usuário(s) associado(s)</li>
                {dependencies.pdisCount > 0 && (
                  <li>• {dependencies.pdisCount} PDI(s) relacionado(s)</li>
                )}
              </ul>
              <p className="text-sm text-amber-600 mt-2">
                A exclusão pode afetar o histórico de progressão dos colaboradores.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Excluir Trilha
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setDuplicatingTemplate(null);
          setDuplicateName('');
        }}
        title="Duplicar Trilha"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Você está duplicando a trilha <strong>{duplicatingTemplate?.name}</strong>.
            A cópia incluirá todos os estágios, competências e faixas salariais.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Nova Trilha
            </label>
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Nome da nova trilha"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowDuplicateModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDuplicate} 
              loading={saving}
              disabled={!duplicateName.trim()}
            >
              <Copy size={16} className="mr-2" />
              Duplicar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CareerTrackManager;
