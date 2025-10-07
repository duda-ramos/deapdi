import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Plus,
  Edit,
  Eye,
  Trash2,
  Users,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

interface EvaluationForm {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'competency' | 'engagement' | 'satisfaction' | '360_feedback';
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
  responses_count: number;
  target_audience: string[];
}

interface EvaluationResponse {
  id: string;
  form_id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  submitted_at: string;
  status: 'completed' | 'pending' | 'overdue';
  score?: number;
}

const EvaluationsManagement: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<EvaluationForm[]>([]);
  const [responses, setResponses] = useState<EvaluationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('forms');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<EvaluationForm | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<EvaluationResponse | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'performance' as 'performance' | 'competency' | 'engagement' | 'satisfaction' | '360_feedback',
    target_audience: [] as string[]
  });

  const tabs = [
    { id: 'forms', label: 'Formulários', icon: <ClipboardList size={16} /> },
    { id: 'responses', label: 'Respostas', icon: <BarChart3 size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> }
  ];

  const formTypes = [
    { value: 'performance', label: 'Avaliação de Performance' },
    { value: 'competency', label: 'Avaliação de Competências' },
    { value: 'engagement', label: 'Engajamento' },
    { value: 'satisfaction', label: 'Satisfação' },
    { value: '360_feedback', label: 'Feedback 360°' }
  ];

  const targetAudiences = [
    'Todos os colaboradores',
    'Gestores',
    'Equipe de Desenvolvimento',
    'Equipe de Marketing',
    'Equipe de Vendas',
    'Equipe de Suporte',
    'Equipe Financeira'
  ];

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'hr')) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Mock data - in real implementation, this would come from API
      const mockForms: EvaluationForm[] = [
        {
          id: '1',
          title: 'Avaliação de Performance Q2 2024',
          description: 'Avaliação semestral de performance individual',
          type: 'performance',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          responses_count: 45,
          target_audience: ['Todos os colaboradores']
        },
        {
          id: '2',
          title: 'Avaliação de Competências Técnicas',
          description: 'Avaliação específica de competências técnicas por área',
          type: 'competency',
          status: 'active',
          created_at: '2024-01-20T14:30:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          responses_count: 32,
          target_audience: ['Equipe de Desenvolvimento', 'Equipe de Suporte']
        },
        {
          id: '3',
          title: 'Pesquisa de Engajamento',
          description: 'Medição do nível de engajamento dos colaboradores',
          type: 'engagement',
          status: 'draft',
          created_at: '2024-02-01T09:15:00Z',
          updated_at: '2024-02-01T09:15:00Z',
          responses_count: 0,
          target_audience: ['Todos os colaboradores']
        }
      ];

      const mockResponses: EvaluationResponse[] = [
        {
          id: '1',
          form_id: '1',
          employee_id: 'emp1',
          employee_name: 'João Silva',
          employee_position: 'Desenvolvedor Senior',
          submitted_at: '2024-01-20T16:30:00Z',
          status: 'completed',
          score: 8.5
        },
        {
          id: '2',
          form_id: '1',
          employee_id: 'emp2',
          employee_name: 'Maria Santos',
          employee_position: 'Gerente de Marketing',
          submitted_at: '2024-01-22T11:45:00Z',
          status: 'completed',
          score: 9.2
        },
        {
          id: '3',
          form_id: '2',
          employee_id: 'emp3',
          employee_name: 'Pedro Costa',
          employee_position: 'Desenvolvedor Pleno',
          submitted_at: '2024-01-25T14:20:00Z',
          status: 'completed',
          score: 7.8
        }
      ];

      setForms(mockForms);
      setResponses(mockResponses);
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados de avaliações');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In real implementation, this would call an API
      const newForm: EvaluationForm = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        responses_count: 0,
        target_audience: formData.target_audience
      };

      setForms([...forms, newForm]);
      setShowFormModal(false);
      setFormData({
        title: '',
        description: '',
        type: 'performance',
        target_audience: []
      });
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const handleToggleFormStatus = (formId: string) => {
    setForms(forms.map(form => 
      form.id === formId 
        ? { 
            ...form, 
            status: form.status === 'active' ? 'closed' : 'active',
            updated_at: new Date().toISOString()
          }
        : form
    ));
  };

  const formColumns = [
    {
      key: 'title',
      label: 'Título',
      render: (value: string, row: EvaluationForm) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (value: string) => (
        <Badge variant="default">
          {formTypes.find(t => t.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'active' ? 'success' :
          value === 'draft' ? 'warning' : 'default'
        }>
          {value === 'active' ? 'Ativo' :
           value === 'draft' ? 'Rascunho' : 'Fechado'}
        </Badge>
      )
    },
    {
      key: 'responses_count',
      label: 'Respostas',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: EvaluationForm) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedForm(row);
              setShowResponseModal(true);
            }}
          >
            <Eye size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleFormStatus(row.id)}
          >
            {row.status === 'active' ? 'Fechar' : 'Ativar'}
          </Button>
        </div>
      )
    }
  ];

  const responseColumns = [
    {
      key: 'employee_name',
      label: 'Colaborador',
      render: (value: string, row: EvaluationResponse) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.employee_position}</div>
        </div>
      )
    },
    {
      key: 'form_id',
      label: 'Formulário',
      render: (value: string) => {
        const form = forms.find(f => f.id === value);
        return form ? form.title : 'N/A';
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'completed' ? 'success' :
          value === 'pending' ? 'warning' : 'danger'
        }>
          {value === 'completed' ? 'Concluído' :
           value === 'pending' ? 'Pendente' : 'Atrasado'}
        </Badge>
      )
    },
    {
      key: 'score',
      label: 'Pontuação',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Target size={16} className="text-gray-400" />
          <span className="font-medium">{value ? `${value}/10` : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'submitted_at',
      label: 'Enviado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando avaliações..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Avaliações</h1>
          <p className="text-gray-600 mt-1">Criar e gerenciar formulários de avaliação de performance</p>
        </div>
        <ErrorMessage error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="mr-3 text-blue-500" size={28} />
            Gestão de Avaliações
          </h1>
          <p className="text-gray-600 mt-1">Criar e gerenciar formulários de avaliação de performance</p>
        </div>
        <Button onClick={() => setShowFormModal(true)}>
          <Plus size={16} className="mr-2" />
          Novo Formulário
        </Button>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
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

      {/* Forms Tab */}
      {selectedTab === 'forms' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Formulários de Avaliação</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="success">
                {forms.filter(f => f.status === 'active').length} Ativos
              </Badge>
              <Badge variant="warning">
                {forms.filter(f => f.status === 'draft').length} Rascunhos
              </Badge>
            </div>
          </div>
          <Table
            columns={formColumns}
            data={forms}
            loading={loading}
            emptyMessage="Nenhum formulário encontrado"
          />
        </Card>
      )}

      {/* Responses Tab */}
      {selectedTab === 'responses' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Respostas das Avaliações</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="success">
                {responses.filter(r => r.status === 'completed').length} Concluídas
              </Badge>
              <Badge variant="warning">
                {responses.filter(r => r.status === 'pending').length} Pendentes
              </Badge>
            </div>
          </div>
          <Table
            columns={responseColumns}
            data={responses}
            loading={loading}
            emptyMessage="Nenhuma resposta encontrada"
          />
        </Card>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{forms.length}</div>
                  <div className="text-sm text-gray-600">Total Formulários</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{responses.length}</div>
                  <div className="text-sm text-gray-600">Total Respostas</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {responses.filter(r => r.status === 'completed').length > 0 
                      ? (responses.filter(r => r.status === 'completed').reduce((acc, r) => acc + (r.score || 0), 0) / responses.filter(r => r.status === 'completed').length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Pontuação Média</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {responses.length > 0 ? Math.round((responses.filter(r => r.status === 'completed').length / responses.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa de Conclusão</div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo por Tipo de Avaliação</h3>
            <div className="space-y-4">
              {formTypes.map((type) => {
                const typeForms = forms.filter(f => f.type === type.value);
                const typeResponses = responses.filter(r => typeForms.some(f => f.id === r.form_id));
                return (
                  <div key={type.value} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{type.label}</h4>
                      <p className="text-sm text-gray-600">
                        {typeForms.length} formulário(s) • {typeResponses.length} resposta(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {typeResponses.length > 0 ? Math.round((typeResponses.filter(r => r.status === 'completed').length / typeResponses.length) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-500">Conclusão</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Create Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Criar Novo Formulário"
        size="lg"
      >
        <form onSubmit={handleCreateForm} className="space-y-4">
          <Input
            label="Título do Formulário"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Avaliação de Performance Q1 2024"
            required
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o objetivo e escopo desta avaliação..."
            rows={3}
            required
          />

          <Select
            label="Tipo de Avaliação"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={formTypes}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Público-Alvo
            </label>
            <div className="space-y-2">
              {targetAudiences.map((audience) => (
                <label key={audience} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.target_audience.includes(audience)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          target_audience: [...formData.target_audience, audience]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          target_audience: formData.target_audience.filter(a => a !== audience)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{audience}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 Próximos Passos:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• O formulário será criado como rascunho</li>
              <li>• Você poderá adicionar questões específicas</li>
              <li>• Configure prazos e notificações</li>
              <li>• Publique quando estiver pronto</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFormModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Plus size={16} className="mr-2" />
              Criar Formulário
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Responses Modal */}
      <Modal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        title={selectedForm ? `Respostas - ${selectedForm.title}` : 'Respostas'}
        size="lg"
      >
        {selectedForm && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedForm.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{selectedForm.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Público: {selectedForm.target_audience.join(', ')}</span>
                <span>•</span>
                <span>Respostas: {selectedForm.responses_count}</span>
              </div>
            </div>

            <div className="space-y-3">
              {responses
                .filter(r => r.form_id === selectedForm.id)
                .map((response) => (
                  <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{response.employee_name}</p>
                      <p className="text-sm text-gray-600">{response.employee_position}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={
                        response.status === 'completed' ? 'success' :
                        response.status === 'pending' ? 'warning' : 'danger'
                      }>
                        {response.status === 'completed' ? 'Concluído' :
                         response.status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </Badge>
                      {response.score && (
                        <span className="font-medium text-blue-600">{response.score}/10</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EvaluationsManagement;