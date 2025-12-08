import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Filter,
  Search,
  Edit,
  Trash2,
  Play,
  Pause,
  Star,
  Target,
  Activity,
  BookOpen,
  FileText,
  Brain
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mentalHealthService } from '../../services/mentalHealth';
import { Card } from '../ui/Card';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ErrorMessage } from '../../utils/errorMessages';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface TherapeuticTask {
  id: string;
  title: string;
  type: 'form' | 'meditation' | 'exercise' | 'reading' | 'reflection';
  content: any;
  assigned_to: string[];
  assigned_by: string;
  due_date?: string;
  recurrence?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  completion_notes?: string;
  effectiveness_rating?: number;
  created_at: string;
  updated_at: string;
  assigned_by_user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

const TaskManager: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TherapeuticTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TherapeuticTask | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTaskIndex, setActiveTaskIndex] = useState(-1);
  const taskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    type: 'exercise' as TherapeuticTask['type'],
    content: {},
    assigned_to: [] as string[],
    due_date: '',
    recurrence: '',
    description: ''
  });

  const [completionForm, setCompletionForm] = useState({
    notes: '',
    effectiveness_rating: 5
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    enabled: !showCreateModal && !showCompleteModal,
    shortcuts: [
      {
        key: 'n',
        ctrlOrCmd: true,
        callback: () => {
          if (user?.role === 'hr') {
            setShowCreateModal(true);
          }
        },
        description: 'Create new task'
      },
      {
        key: 'k',
        ctrlOrCmd: true,
        callback: () => {
          searchInputRef.current?.focus();
        },
        description: 'Focus search'
      },
      {
        key: '/',
        callback: () => {
          searchInputRef.current?.focus();
        },
        description: 'Focus search'
      }
    ]
  });

  // Handle keyboard navigation in task grid
  const handleTaskKeyDown = useCallback((event: React.KeyboardEvent, index: number, task: TherapeuticTask, totalItems: number) => {
    const cols = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        if (index < totalItems - 1) {
          const nextIndex = index + 1;
          setActiveTaskIndex(nextIndex);
          taskRefs.current[nextIndex]?.focus();
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) {
          const prevIndex = index - 1;
          setActiveTaskIndex(prevIndex);
          taskRefs.current[prevIndex]?.focus();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (index + cols < totalItems) {
          const nextIndex = index + cols;
          setActiveTaskIndex(nextIndex);
          taskRefs.current[nextIndex]?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index - cols >= 0) {
          const prevIndex = index - cols;
          setActiveTaskIndex(prevIndex);
          taskRefs.current[prevIndex]?.focus();
        }
        break;
      case 'Home':
        event.preventDefault();
        setActiveTaskIndex(0);
        taskRefs.current[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = totalItems - 1;
        setActiveTaskIndex(lastIndex);
        taskRefs.current[lastIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (task.status === 'pending') {
          handleStartTask(task.id);
        } else if (task.status === 'in_progress') {
          setSelectedTask(task);
          setShowCompleteModal(true);
        }
        break;
      default:
        break;
    }
  }, []);

  // Memoized handlers to prevent input focus loss
  const handleTaskFormChange = React.useCallback((field: keyof typeof taskForm, value: any) => {
    setTaskForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCompletionFormChange = React.useCallback((field: keyof typeof completionForm, value: any) => {
    setCompletionForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const taskTypes = [
    { value: 'form', label: 'Formulário', icon: <FileText size={16} aria-hidden="true" /> },
    { value: 'meditation', label: 'Meditação', icon: <Brain size={16} aria-hidden="true" /> },
    { value: 'exercise', label: 'Exercício', icon: <Activity size={16} aria-hidden="true" /> },
    { value: 'reading', label: 'Leitura', icon: <BookOpen size={16} aria-hidden="true" /> },
    { value: 'reflection', label: 'Reflexão', icon: <Target size={16} aria-hidden="true" /> }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'completed', label: 'Concluída' },
    { value: 'overdue', label: 'Atrasada' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  const typeOptions = [
    { value: 'all', label: 'Todos os tipos' },
    ...taskTypes.map(type => ({ value: type.value, label: type.label }))
  ];

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await mentalHealthService.getTherapeuticTasks(user?.id);
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesType = typeFilter === 'all' || task.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await mentalHealthService.createTherapeuticTask({
        ...taskForm,
        assigned_by: user.id,
        status: 'pending'
      });

      setShowCreateModal(false);
      setTaskForm({
        title: '',
        type: 'exercise',
        content: {},
        assigned_to: [],
        due_date: '',
        recurrence: '',
        description: ''
      });
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await mentalHealthService.completeTherapeuticTask(
        selectedTask.id,
        completionForm.notes,
        completionForm.effectiveness_rating
      );

      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionForm({ notes: '', effectiveness_rating: 5 });
      loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await mentalHealthService.updateTherapeuticTask(taskId, {
        status: 'in_progress'
      });
      loadTasks();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await mentalHealthService.updateTherapeuticTask(taskId, {
        status: 'cancelled'
      });
      loadTasks();
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
  };

  const getTaskIcon = (type: string) => {
    const taskType = taskTypes.find(t => t.value === type);
    return taskType?.icon || <Activity size={16} aria-hidden="true" />;
  };

  const getStatusBadge = (status: string) => {
    const variant = mentalHealthService.getTaskStatusBadge(status);
    const label = mentalHealthService.getTaskStatusLabel(status);
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const label = mentalHealthService.getTaskTypeLabel(type);
    return <Badge variant="info">{label}</Badge>;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (loading) {
    return <LoadingScreen message="Carregando tarefas terapêuticas..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciador de Tarefas</h1>
          <p className="text-gray-600 mt-1">Gerencie atividades terapêuticas e acompanhe o progresso</p>
        </div>
        <ErrorMessage error={error} onRetry={loadTasks} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Target className="mr-3 text-blue-500" size={28} aria-hidden="true" />
            Gerenciador de Tarefas
          </h1>
          <p className="text-gray-600 mt-1">Gerencie atividades terapêuticas e acompanhe o progresso</p>
        </div>
        {user?.role === 'hr' && (
          <Button onClick={() => setShowCreateModal(true)} aria-label="Criar nova tarefa terapêutica">
            <Plus size={16} className="mr-2" aria-hidden="true" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar tarefas... (Ctrl+K ou /)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                  setSearchTerm('');
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Buscar tarefas por título ou descrição. Use Ctrl+K ou barra para focar"
            />
          </div>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
          <Select
            label="Tipo"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
          />
          <Button variant="secondary" className="flex items-center" aria-label="Filtros adicionais">
            <Filter size={16} className="mr-2" aria-hidden="true" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card className="p-8 text-center" role="status" aria-live="polite">
          <Target size={48} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Nenhuma tarefa encontrada' 
              : 'Nenhuma tarefa atribuída'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Você ainda não possui tarefas terapêuticas atribuídas.'
            }
          </p>
        </Card>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          role="grid" 
          aria-label="Lista de tarefas de bem-estar"
        >
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              ref={(el) => { taskRefs.current[index] = el; }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              role="gridcell"
              tabIndex={index === 0 ? 0 : -1}
              onKeyDown={(e) => handleTaskKeyDown(e, index, task, filteredTasks.length)}
              onFocus={() => setActiveTaskIndex(index)}
              className={`outline-none ${activeTaskIndex === index ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow" role="article" aria-label={`Tarefa: ${task.title}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getTaskIcon(task.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeBadge(task.type)}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  </div>
                  {isOverdue(task.due_date) && task.status !== 'completed' && (
                    <AlertTriangle className="text-red-500" size={20} aria-label="Tarefa atrasada" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {task.due_date && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar size={14} aria-hidden="true" />
                      <span>Vence em {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  
                  {task.assigned_by_user && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users size={14} aria-hidden="true" />
                      <span>Atribuída por {task.assigned_by_user.name}</span>
                    </div>
                  )}

                  {task.effectiveness_rating && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star size={14} aria-hidden="true" />
                      <span>Avaliação: {task.effectiveness_rating}/5</span>
                    </div>
                  )}
                </div>

                {task.completion_notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{task.completion_notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Criada em {new Date(task.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartTask(task.id)}
                        aria-label={`Iniciar tarefa "${task.title}"`}
                      >
                        <Play size={14} className="mr-1" aria-hidden="true" />
                        Iniciar
                      </Button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowCompleteModal(true);
                        }}
                        aria-label={`Marcar tarefa "${task.title}" como concluída`}
                      >
                        <CheckCircle size={14} className="mr-1" aria-hidden="true" />
                        Concluir
                      </Button>
                    )}
                    
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelTask(task.id)}
                        aria-label={`Cancelar tarefa "${task.title}"`}
                      >
                        <Pause size={14} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Tarefa Terapêutica"
        size="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Título da Tarefa"
            value={taskForm.title || ''}
            onChange={(e) => handleTaskFormChange('title', e.target.value)}
            placeholder="Ex: Exercício de respiração diário"
            required
          />

          <Select
            label="Tipo de Tarefa"
            value={taskForm.type}
            onChange={(e) => handleTaskFormChange('type', e.target.value)}
            options={taskTypes}
            required
          />

          <Textarea
            label="Descrição"
            value={taskForm.description || ''}
            onChange={(e) => handleTaskFormChange('description', e.target.value)}
            placeholder="Descreva a tarefa e suas instruções..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Vencimento"
              type="date"
              value={taskForm.due_date || ''}
              onChange={(e) => handleTaskFormChange('due_date', e.target.value)}
            />
            <Select
              label="Recorrência"
              value={taskForm.recurrence || ''}
              onChange={(e) => handleTaskFormChange('recurrence', e.target.value)}
              options={[
                { value: '', label: 'Sem recorrência' },
                { value: 'daily', label: 'Diária' },
                { value: 'weekly', label: 'Semanal' },
                { value: 'monthly', label: 'Mensal' }
              ]}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              aria-label="Cancelar criação de tarefa"
            >
              Cancelar
            </Button>
            <Button type="submit" aria-label="Criar nova tarefa terapêutica">
              <Plus size={16} className="mr-2" aria-hidden="true" />
              Criar Tarefa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Task Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Concluir Tarefa"
        size="md"
      >
        <form onSubmit={handleCompleteTask} className="space-y-4">
          {selectedTask && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900">{selectedTask.title}</h4>
              <p className="text-sm text-blue-800">{mentalHealthService.getTaskTypeLabel(selectedTask.type)}</p>
            </div>
          )}

          <Textarea
            label="Notas de Conclusão"
            value={completionForm.notes || ''}
            onChange={(e) => handleCompletionFormChange('notes', e.target.value)}
            placeholder="Descreva como foi a experiência e quais insights você teve..."
            rows={4}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avaliação de Efetividade (1-5)
            </label>
            <div className="flex items-center space-x-2" role="radiogroup" aria-label="Avaliação de eficácia da tarefa">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleCompletionFormChange('effectiveness_rating', rating)}
                  className={`p-2 rounded-lg ${
                    completionForm.effectiveness_rating === rating
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  role="radio"
                  aria-checked={completionForm.effectiveness_rating === rating}
                  aria-label={`Avaliar com ${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`}
                >
                  <Star size={20} fill={completionForm.effectiveness_rating >= rating ? 'currentColor' : 'none'} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCompleteModal(false)}
              aria-label="Cancelar conclusão de tarefa"
            >
              Cancelar
            </Button>
            <Button type="submit" aria-label="Confirmar conclusão da tarefa">
              <CheckCircle size={16} className="mr-2" aria-hidden="true" />
              Concluir Tarefa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskManager;
