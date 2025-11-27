import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Download, 
  Upload, 
  AlertTriangle,
  Check,
  ChevronDown,
  Tag,
  Users,
  FileJson,
  Eye,
  Layers,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../services/database';
import { supabase } from '../../lib/supabase';
import { Competency, Profile } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

// Types for the component
interface CompetencyFormData {
  name: string;
  type: 'hard' | 'soft';
  category: string;
  stage: string;
  target_level: number;
  description: string;
  profile_id?: string;
}

interface CompetencyWithProfile extends Competency {
  description?: string;
  profile?: {
    name: string;
    position: string;
  };
}

interface ImportPreviewItem {
  name: string;
  type: 'hard' | 'soft';
  category: string;
  stage: string;
  target_level: number;
  description: string;
  isDuplicate: boolean;
  existingCount: number;
}

interface DependencyInfo {
  hasDependencies: boolean;
  pdisCount: number;
  evaluationsCount: number;
}

// Predefined categories
const CATEGORIES = [
  { value: 'technical', label: 'Técnicas', color: 'info' },
  { value: 'behavioral', label: 'Comportamentais', color: 'success' },
  { value: 'leadership', label: 'Liderança', color: 'warning' },
  { value: 'communication', label: 'Comunicação', color: 'default' },
  { value: 'analytical', label: 'Analíticas', color: 'info' },
  { value: 'creative', label: 'Criativas', color: 'success' },
  { value: 'management', label: 'Gestão', color: 'warning' },
  { value: 'custom', label: 'Personalizada', color: 'default' }
] as const;

const STAGES = ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Líder'];

const PROFICIENCY_LEVELS = [
  { level: 1, label: 'Básico', description: 'Conhecimento introdutório' },
  { level: 2, label: 'Intermediário', description: 'Aplica com supervisão' },
  { level: 3, label: 'Avançado', description: 'Aplica de forma autônoma' },
  { level: 4, label: 'Expert', description: 'Referência na área' },
  { level: 5, label: 'Master', description: 'Inovador e mentor' }
];

const CompetencyManager: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [competencies, setCompetencies] = useState<CompetencyWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hard' | 'soft'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Form and editing state
  const [editingCompetency, setEditingCompetency] = useState<CompetencyWithProfile | null>(null);
  const [deletingCompetency, setDeletingCompetency] = useState<CompetencyWithProfile | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<DependencyInfo | null>(null);
  const [formData, setFormData] = useState<CompetencyFormData>({
    name: '',
    type: 'hard',
    category: 'technical',
    stage: 'Júnior',
    target_level: 3,
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Import state
  const [importData, setImportData] = useState<ImportPreviewItem[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  
  // Category management state
  const [newCategory, setNewCategory] = useState('');
  
  // Selection state for bulk operations
  const [selectedCompetencies, setSelectedCompetencies] = useState<Set<string>>(new Set());
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
    loadCustomCategories();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [competenciesData, profilesData] = await Promise.all([
        databaseService.getAllCompetencies(),
        databaseService.getProfiles()
      ]);
      
      // Enrich competencies with profile data
      const enrichedCompetencies = (competenciesData || []).map((comp: Competency) => {
        const profile = (profilesData || []).find((p: Profile) => p.id === comp.profile_id);
        return {
          ...comp,
          profile: profile ? { name: profile.name, position: profile.position } : undefined
        };
      });
      
      setCompetencies(enrichedCompetencies);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomCategories = () => {
    // Load custom categories from localStorage
    const stored = localStorage.getItem('customCompetencyCategories');
    if (stored) {
      try {
        setCustomCategories(JSON.parse(stored));
      } catch {
        setCustomCategories([]);
      }
    }
  };

  const saveCustomCategories = (categories: string[]) => {
    localStorage.setItem('customCompetencyCategories', JSON.stringify(categories));
    setCustomCategories(categories);
  };

  // Derive category from type and stage
  const getCompetencyCategory = (comp: CompetencyWithProfile): string => {
    // Use type as main differentiator
    if (comp.type === 'hard') {
      if (comp.stage === 'Líder' || comp.stage === 'Especialista') {
        return 'leadership';
      }
      return 'technical';
    } else {
      if (comp.stage === 'Líder') {
        return 'leadership';
      }
      return 'behavioral';
    }
  };

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Nome deve ter no mínimo 3 caracteres';
    } else {
      // Check for duplicate names (same name + same profile = duplicate)
      const isDuplicate = competencies.some(comp => 
        comp.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        comp.profile_id === formData.profile_id &&
        comp.id !== editingCompetency?.id
      );
      if (isDuplicate) {
        errors.name = 'Já existe uma competência com este nome para este colaborador';
      }
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

    if (!editingCompetency && !formData.profile_id) {
      errors.profile_id = 'Selecione um colaborador';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, competencies, editingCompetency]);

  const handleOpenModal = (competency?: CompetencyWithProfile) => {
    if (competency) {
      setEditingCompetency(competency);
      setFormData({
        name: competency.name,
        type: competency.type,
        category: getCompetencyCategory(competency),
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
        category: 'technical',
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

      const competencyData = {
        name: formData.name.trim(),
        type: formData.type,
        stage: formData.stage,
        target_level: formData.target_level,
        description: formData.description.trim()
      };

      if (editingCompetency) {
        await databaseService.updateCompetency(editingCompetency.id, competencyData);
      } else {
        await databaseService.createCompetency({
          ...competencyData,
          profile_id: formData.profile_id!,
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

  const checkDependencies = async (competencyId: string): Promise<DependencyInfo> => {
    try {
      if (!supabase) {
        return { hasDependencies: false, pdisCount: 0, evaluationsCount: 0 };
      }
      
      // Check for PDIs that reference this competency
      const competencyName = competencies.find(c => c.id === competencyId)?.name;
      if (!competencyName) {
        return { hasDependencies: false, pdisCount: 0, evaluationsCount: 0 };
      }
      
      const { data: pdisData, error: pdisError } = await supabase
        .from('pdis')
        .select('id')
        .ilike('title', `%${competencyName}%`);
      
      if (pdisError) throw pdisError;
      
      return {
        hasDependencies: (pdisData?.length || 0) > 0,
        pdisCount: pdisData?.length || 0,
        evaluationsCount: 0 // Could check evaluations table if exists
      };
    } catch (error) {
      console.error('Error checking dependencies:', error);
      return { hasDependencies: false, pdisCount: 0, evaluationsCount: 0 };
    }
  };

  const handleOpenDeleteModal = async (competency: CompetencyWithProfile) => {
    setDeletingCompetency(competency);
    const deps = await checkDependencies(competency.id);
    setDependencyInfo(deps);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingCompetency(null);
    setDependencyInfo(null);
  };

  const handleDelete = async () => {
    if (!deletingCompetency) return;

    try {
      setDeleting(true);
      await databaseService.deleteCompetency(deletingCompetency.id);
      await loadData();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting competency:', error);
      alert('Erro ao excluir competência. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompetencies.size === 0) return;

    try {
      setDeleting(true);
      
      for (const id of selectedCompetencies) {
        await databaseService.deleteCompetency(id);
      }
      
      setSelectedCompetencies(new Set());
      await loadData();
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting competencies:', error);
      alert('Erro ao excluir competências. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  // Export functionality
  const handleExport = () => {
    const exportData = filteredCompetencies.map(comp => ({
      name: comp.name,
      type: comp.type,
      category: getCompetencyCategory(comp),
      stage: comp.stage,
      target_level: comp.target_level,
      description: comp.description || '',
      self_rating: comp.self_rating,
      manager_rating: comp.manager_rating,
      profile_name: comp.profile?.name,
      profile_position: comp.profile?.position,
      created_at: comp.created_at,
      updated_at: comp.updated_at
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competencies_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!Array.isArray(parsed)) {
          setImportErrors(['O arquivo deve conter um array de competências']);
          setImportData([]);
          return;
        }

        const errors: string[] = [];
        const validItems: ImportPreviewItem[] = [];

        parsed.forEach((item, index) => {
          if (!item.name || typeof item.name !== 'string') {
            errors.push(`Item ${index + 1}: Nome é obrigatório`);
            return;
          }

          if (!['hard', 'soft'].includes(item.type)) {
            errors.push(`Item ${index + 1}: Tipo deve ser 'hard' ou 'soft'`);
            return;
          }

          const existingWithSameName = competencies.filter(
            c => c.name.toLowerCase() === item.name.toLowerCase()
          );

          validItems.push({
            name: item.name,
            type: item.type || 'hard',
            category: item.category || 'technical',
            stage: item.stage || 'Júnior',
            target_level: item.target_level || 3,
            description: item.description || '',
            isDuplicate: existingWithSameName.length > 0,
            existingCount: existingWithSameName.length
          });
        });

        setImportErrors(errors);
        setImportData(validItems);
        setShowImportModal(true);
      } catch {
        setImportErrors(['Erro ao processar arquivo JSON. Verifique o formato.']);
        setImportData([]);
        setShowImportModal(true);
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    if (!profiles.length) {
      alert('Nenhum colaborador disponível para associar as competências.');
      return;
    }

    try {
      setImporting(true);

      // Import competencies for each profile (or first profile as default)
      const defaultProfile = profiles[0];
      
      for (const item of importData) {
        if (!item.isDuplicate) {
          await databaseService.createCompetency({
            name: item.name,
            type: item.type,
            stage: item.stage,
            target_level: item.target_level,
            description: item.description,
            profile_id: defaultProfile.id,
            self_rating: null,
            manager_rating: null
          });
        }
      }

      await loadData();
      setShowImportModal(false);
      setImportData([]);
      setImportErrors([]);
    } catch (error) {
      console.error('Error importing competencies:', error);
      alert('Erro ao importar competências. Tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  // Category management
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const trimmed = newCategory.trim();
    if (customCategories.includes(trimmed)) {
      return;
    }
    
    saveCustomCategories([...customCategories, trimmed]);
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    saveCustomCategories(customCategories.filter(c => c !== category));
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedCompetencies);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCompetencies(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCompetencies.size === filteredCompetencies.length) {
      setSelectedCompetencies(new Set());
    } else {
      setSelectedCompetencies(new Set(filteredCompetencies.map(c => c.id)));
    }
  };

  // Filter competencies
  const filteredCompetencies = competencies.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.profile?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || comp.type === filterType;
    const matchesCategory = filterCategory === 'all' || getCompetencyCategory(comp) === filterCategory;
    const matchesStage = filterStage === 'all' || comp.stage === filterStage;
    return matchesSearch && matchesType && matchesCategory && matchesStage;
  });

  // Get unique competency templates (by name)
  const uniqueCompetencies = Array.from(
    new Map(competencies.map(c => [c.name, c])).values()
  );

  // Statistics
  const stats = {
    total: competencies.length,
    unique: uniqueCompetencies.length,
    hardSkills: competencies.filter(c => c.type === 'hard').length,
    softSkills: competencies.filter(c => c.type === 'soft').length,
    avgRating: competencies.reduce((acc, c) => {
      const rating = Math.max(c.self_rating || 0, c.manager_rating || 0);
      return acc + rating;
    }, 0) / competencies.length || 0
  };

  const getCategoryBadgeVariant = (category: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const cat = CATEGORIES.find(c => c.value === category);
    return (cat?.color as 'default' | 'success' | 'warning' | 'danger' | 'info') || 'default';
  };

  const getCategoryLabel = (category: string): string => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const allCategories = [
    ...CATEGORIES.map(c => ({ value: c.value, label: c.label })),
    ...customCategories.map(c => ({ value: c, label: c }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Competências</h2>
          <p className="text-gray-600 mt-1">Gerencie o catálogo de competências da organização</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setShowCategoryModal(true)}>
            <Tag size={16} className="mr-2" />
            Categorias
          </Button>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" />
            Importar
          </Button>
          <Button variant="ghost" onClick={handleExport} disabled={filteredCompetencies.length === 0}>
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={16} className="mr-2" />
            Nova Competência
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Únicas</p>
              <p className="text-xl font-bold text-gray-900">{stats.unique}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Target size={20} className="text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hard Skills</p>
              <p className="text-xl font-bold text-gray-900">{stats.hardSkills}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Soft Skills</p>
              <p className="text-xl font-bold text-gray-900">{stats.softSkills}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Eye size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Média</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por nome, descrição ou colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'hard' | 'soft')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
              >
                <option value="all">Todos os tipos</option>
                <option value="hard">Hard Skills</option>
                <option value="soft">Soft Skills</option>
              </select>
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
              >
                <option value="all">Todas as categorias</option>
                {allCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
              >
                <option value="all">Todos os estágios</option>
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCompetencies.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg"
            >
              <span className="text-sm font-medium text-blue-700">
                {selectedCompetencies.size} competência(s) selecionada(s)
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 size={14} className="mr-1" />
                Excluir selecionadas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompetencies(new Set())}
              >
                Limpar seleção
              </Button>
            </motion.div>
          )}

          {/* Competencies List */}
          {filteredCompetencies.length === 0 ? (
            <div className="text-center py-12">
              <Filter size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma competência encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStage !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova competência'}
              </p>
              {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStage !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterStage('all');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompetencies.size === filteredCompetencies.length && filteredCompetencies.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Selecionar todas</span>
                </label>
                <span className="text-sm text-gray-500">
                  {filteredCompetencies.length} de {competencies.length} competências
                </span>
              </div>

              {/* Competency Cards */}
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredCompetencies.map((competency) => (
                    <motion.div
                      key={competency.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                        selectedCompetencies.has(competency.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompetencies.has(competency.id)}
                        onChange={() => toggleSelection(competency.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{competency.name}</h4>
                          <Badge variant={competency.type === 'hard' ? 'info' : 'success'}>
                            {competency.type === 'hard' ? 'Hard Skill' : 'Soft Skill'}
                          </Badge>
                          <Badge variant={getCategoryBadgeVariant(getCompetencyCategory(competency))}>
                            {getCategoryLabel(getCompetencyCategory(competency))}
                          </Badge>
                          <Badge variant="default">{competency.stage}</Badge>
                          <Badge variant="warning">Meta: {competency.target_level}/5</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {competency.description || 'Sem descrição'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          {competency.profile && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {competency.profile.name}
                              {competency.profile.position && ` - ${competency.profile.position}`}
                            </span>
                          )}
                          <span>Auto: {competency.self_rating || '-'}/5</span>
                          <span>Gestor: {competency.manager_rating || '-'}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(competency)}
                          aria-label="Editar competência"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteModal(competency)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Excluir competência"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCompetency ? 'Editar Competência' : 'Nova Competência'}
        size="lg"
      >
        <div className="space-y-4">
          {!editingCompetency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colaborador *
              </label>
              <select
                value={formData.profile_id || ''}
                onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 min-h-[2.75rem] ${
                  formErrors.profile_id
                    ? 'border-red-500 focus-visible:ring-red-400'
                    : 'border-slate-200 focus-visible:ring-primary/60'
                }`}
              >
                <option value="">Selecione um colaborador</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} - {profile.position}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'hard' | 'soft' })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
              >
                <option value="hard">Hard Skill</option>
                <option value="soft">Soft Skill</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
              >
                {allCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estágio *
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 min-h-[2.75rem] ${
                formErrors.stage
                  ? 'border-red-500 focus-visible:ring-red-400'
                  : 'border-slate-200 focus-visible:ring-primary/60'
              }`}
            >
              {STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            {formErrors.stage && (
              <p className="mt-1 text-sm text-red-600">{formErrors.stage}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível Alvo (1-5) *
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="1"
                max="5"
                value={formData.target_level}
                onChange={(e) => setFormData({ ...formData, target_level: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between">
                {PROFICIENCY_LEVELS.map((level) => (
                  <div
                    key={level.level}
                    className={`text-center flex-1 ${
                      formData.target_level === level.level
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    <div className="text-lg">{level.level}</div>
                    <div className="text-xs">{level.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 text-center">
                {PROFICIENCY_LEVELS.find(l => l.level === formData.target_level)?.description}
              </p>
            </div>
            {formErrors.target_level && (
              <p className="mt-1 text-sm text-red-600">{formErrors.target_level}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a competência e os critérios de avaliação..."
              rows={4}
              className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 ${
                formErrors.description
                  ? 'border-red-500 focus-visible:ring-red-400'
                  : 'border-slate-200 focus-visible:ring-primary/60'
              }`}
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

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingCompetency ? 'Salvar Alterações' : 'Criar Competência'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Excluir Competência"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                Tem certeza que deseja excluir esta competência?
              </p>
              {deletingCompetency && (
                <p className="text-gray-600 mt-1">
                  <strong>{deletingCompetency.name}</strong>
                  {deletingCompetency.profile && (
                    <span> de {deletingCompetency.profile.name}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {dependencyInfo?.hasDependencies && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                <AlertTriangle size={16} />
                Atenção: Esta competência possui dependências
              </div>
              <ul className="text-sm text-amber-600 space-y-1">
                {dependencyInfo.pdisCount > 0 && (
                  <li>• {dependencyInfo.pdisCount} PDI(s) relacionado(s)</li>
                )}
                {dependencyInfo.evaluationsCount > 0 && (
                  <li>• {dependencyInfo.evaluationsCount} avaliação(ões) relacionada(s)</li>
                )}
              </ul>
              <p className="text-sm text-amber-600 mt-2">
                A exclusão pode afetar o histórico de desenvolvimento.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={handleCloseDeleteModal}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Excluir Competência
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Excluir Competências"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                Tem certeza que deseja excluir {selectedCompetencies.size} competência(s)?
              </p>
              <p className="text-gray-600 mt-1">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowBulkDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} loading={deleting}>
              Excluir Selecionadas
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Preview Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportData([]);
          setImportErrors([]);
        }}
        title="Importar Competências"
        size="lg"
      >
        <div className="space-y-4">
          {importErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-700 mb-2">Erros encontrados:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {importErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {importData.length > 0 && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                  <FileJson size={16} />
                  Preview da Importação
                </div>
                <p className="text-sm text-blue-600">
                  {importData.length} competência(s) encontrada(s), 
                  {importData.filter(i => !i.isDuplicate).length} nova(s), 
                  {importData.filter(i => i.isDuplicate).length} duplicada(s)
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Nome</th>
                      <th className="text-left p-3 font-medium text-gray-700">Tipo</th>
                      <th className="text-left p-3 font-medium text-gray-700">Estágio</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importData.map((item, index) => (
                      <tr key={index} className={item.isDuplicate ? 'bg-amber-50' : ''}>
                        <td className="p-3">{item.name}</td>
                        <td className="p-3">
                          <Badge variant={item.type === 'hard' ? 'info' : 'success'}>
                            {item.type === 'hard' ? 'Hard' : 'Soft'}
                          </Badge>
                        </td>
                        <td className="p-3">{item.stage}</td>
                        <td className="p-3">
                          {item.isDuplicate ? (
                            <Badge variant="warning">
                              Duplicada ({item.existingCount}x)
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              <Check size={12} className="mr-1" />
                              Nova
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-500">
                Competências duplicadas serão ignoradas durante a importação.
              </p>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowImportModal(false);
                setImportData([]);
                setImportErrors([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={importData.filter(i => !i.isDuplicate).length === 0}
            >
              <Upload size={16} className="mr-2" />
              Importar {importData.filter(i => !i.isDuplicate).length} Competência(s)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Gerenciar Categorias"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Categorias Padrão</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Badge key={cat.value} variant={cat.color as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Categorias Personalizadas</h4>
            {customCategories.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma categoria personalizada criada.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {customCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                    <span className="text-sm text-gray-700">{cat}</span>
                    <button
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remover categoria ${cat}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={() => setShowCategoryModal(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompetencyManager;
