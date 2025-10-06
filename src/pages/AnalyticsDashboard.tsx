import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Activity,
  Download,
  Filter,
  Eye,
  Clock,
  Heart,
  Brain,
  Shield,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mentalHealthService } from '../services/mentalHealth';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  total_employees_participating: number;
  average_mood_score: number;
  sessions_this_month: number;
  high_risk_responses: number;
  active_alerts: number;
  wellness_resources_accessed: number;
  mood_trend: Array<{
    date: string;
    average_mood: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);

  const periods = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: '365', label: 'Último ano' }
  ];

  const departments = [
    { value: 'all', label: 'Todos os departamentos' },
    { value: 'rh', label: 'Recursos Humanos' },
    { value: 'ti', label: 'Tecnologia da Informação' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'financeiro', label: 'Financeiro' }
  ];

  useEffect(() => {
    if (user && user.role === 'hr') {
      loadAnalytics();
    }
  }, [user, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
      
      const data = await mentalHealthService.getMentalHealthAnalytics(
        startDate.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
      
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  const getMoodTrendData = () => {
    if (!analytics?.mood_trend) return [];
    
    return analytics.mood_trend.map(item => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      mood: item.average_mood
    }));
  };

  const getEngagementData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Check-ins', value: analytics.total_employees_participating, color: '#22c55e' },
      { name: 'Sessões', value: analytics.sessions_this_month, color: '#3b82f6' },
      { name: 'Formulários', value: analytics.high_risk_responses, color: '#f97316' },
      { name: 'Recursos', value: analytics.wellness_resources_accessed, color: '#8b5cf6' }
    ];
  };

  const getRiskDistribution = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Baixo Risco', value: Math.max(0, analytics.total_employees_participating - analytics.high_risk_responses), color: '#22c55e' },
      { name: 'Alto Risco', value: analytics.high_risk_responses, color: '#ef4444' },
      { name: 'Alertas Ativos', value: analytics.active_alerts, color: '#f97316' }
    ];
  };

  const calculateEngagementRate = () => {
    if (!analytics) return 0;
    // This would be calculated based on actual participation vs total employees
    return Math.min(100, (analytics.total_employees_participating / 50) * 100);
  };

  const calculateResolutionRate = () => {
    if (!analytics) return 0;
    // This would be calculated based on resolved vs total alerts
    return Math.max(0, 100 - (analytics.active_alerts / Math.max(1, analytics.high_risk_responses)) * 100);
  };

  const handleExportPDF = async () => {
    // TODO: Implement PDF export functionality
    console.log('Exporting analytics to PDF...');
    setShowExportModal(false);
  };

  if (!user || user.role !== 'hr') {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas usuários do RH podem acessar o dashboard de analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando analytics de saúde mental..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Saúde Mental</h1>
          <p className="text-gray-600 mt-1">Relatórios e insights sobre bem-estar organizacional</p>
        </div>
        <ErrorMessage error={error} onRetry={loadAnalytics} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Saúde Mental</h1>
          <p className="text-gray-600 mt-1">Relatórios e insights sobre bem-estar organizacional</p>
        </div>
        <Card className="p-8 text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum dado disponível</h3>
          <p className="text-gray-600">
            Ainda não há dados suficientes para exibir analytics. Continue incentivando a participação no programa.
          </p>
        </Card>
      </div>
    );
  }

  const engagementRate = calculateEngagementRate();
  const resolutionRate = calculateResolutionRate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 text-blue-500" size={28} />
            Analytics - Saúde Mental
          </h1>
          <p className="text-gray-600 mt-1">Relatórios e insights sobre bem-estar organizacional</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => setShowExportModal(true)}>
            <Download size={16} className="mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Período"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periods}
          />
          <Select
            label="Departamento"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            options={departments}
          />
          <div className="flex items-end">
            <Button variant="secondary" className="w-full">
              <Filter size={16} className="mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.total_employees_participating}</div>
              <div className="text-sm text-gray-600">Participantes</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.average_mood_score.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Humor Médio</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.sessions_this_month}</div>
              <div className="text-sm text-gray-600">Sessões/Mês</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.active_alerts}</div>
              <div className="text-sm text-gray-600">Alertas Ativos</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Taxa de Engajamento</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">{engagementRate.toFixed(1)}%</div>
            <div className="flex items-center space-x-1">
              {engagementRate > 70 ? (
                <TrendingUp className="text-green-500" size={20} />
              ) : (
                <TrendingDown className="text-red-500" size={20} />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${engagementRate}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {analytics.total_employees_participating} funcionários participando do programa
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Taxa de Resolução</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-gray-900">{resolutionRate.toFixed(1)}%</div>
            <div className="flex items-center space-x-1">
              {resolutionRate > 80 ? (
                <TrendingUp className="text-green-500" size={20} />
              ) : (
                <TrendingDown className="text-red-500" size={20} />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Alertas resolvidos vs. total de alertas
          </p>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendência de Humor</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getMoodTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Engagement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Engajamento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getEngagementData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getEngagementData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Risco</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getRiskDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getRiskDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Department Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparação por Departamento</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'RH', mood: 7.2, stress: 4.1, engagement: 85 },
              { name: 'TI', mood: 6.8, stress: 5.2, engagement: 72 },
              { name: 'Vendas', mood: 7.5, stress: 3.8, engagement: 90 },
              { name: 'Marketing', mood: 6.9, stress: 4.5, engagement: 78 },
              { name: 'Financeiro', mood: 7.1, stress: 4.3, engagement: 82 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mood" fill="#22c55e" name="Humor Médio" />
              <Bar dataKey="stress" fill="#f97316" name="Estresse Médio" />
              <Bar dataKey="engagement" fill="#3b82f6" name="Engajamento %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Action Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Itens de Ação Prioritários</h3>
        <div className="space-y-3">
          {analytics.high_risk_responses > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="text-red-500" size={20} />
                <div>
                  <p className="font-medium text-red-900">{analytics.high_risk_responses} respostas de alto risco</p>
                  <p className="text-sm text-red-700">Requerem atenção imediata</p>
                </div>
              </div>
              <Button size="sm" variant="danger">
                Revisar
              </Button>
            </div>
          )}
          
          {analytics.active_alerts > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <Clock className="text-orange-500" size={20} />
                <div>
                  <p className="font-medium text-orange-900">{analytics.active_alerts} alertas ativos</p>
                  <p className="text-sm text-orange-700">Aguardando resolução</p>
                </div>
              </div>
              <Button size="sm" variant="warning">
                Resolver
              </Button>
            </div>
          )}
          
          {engagementRate < 70 && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <Target className="text-yellow-500" size={20} />
                <div>
                  <p className="font-medium text-yellow-900">Baixo engajamento ({engagementRate.toFixed(1)}%)</p>
                  <p className="text-sm text-yellow-700">Considere campanhas de conscientização</p>
                </div>
              </div>
              <Button size="sm" variant="warning">
                Ações
              </Button>
            </div>
          )}
          
          {analytics.high_risk_responses === 0 && analytics.active_alerts === 0 && engagementRate >= 70 && (
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                <p className="font-medium text-green-900">Excelente! Nenhuma ação prioritária no momento</p>
                <p className="text-sm text-green-700">Continue monitorando e incentivando a participação</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Exportar Relatório</h3>
            <p className="text-gray-600 mb-4">
              O relatório será exportado em formato PDF incluindo todos os gráficos e métricas do período selecionado.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExportPDF}>
                <Download size={16} className="mr-2" />
                Exportar PDF
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
