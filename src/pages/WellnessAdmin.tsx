import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  mentalHealthService, 
  MentalHealthStats 
} from '../services/mentalHealth';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Badge } from '../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const WellnessAdmin: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MentalHealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={16} /> },
    { id: 'teams', label: 'Por Equipes', icon: <Users size={16} /> },
    { id: 'trends', label: 'Tendências', icon: <TrendingUp size={16} /> },
    { id: 'alerts', label: 'Alertas Agregados', icon: <AlertTriangle size={16} /> }
  ];

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadWellnessData();
    }
  }, [user]);

  const loadWellnessData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load aggregated and anonymized data only
      const statsData = await mentalHealthService.getMentalHealthStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading wellness data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados de bem-estar');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for aggregated views (no individual identification)
  const teamWellnessData = [
    { team: 'Desenvolvimento', participation: 85, avgMood: 7.2, sessions: 12, riskLevel: 'baixo' },
    { team: 'Marketing', participation: 78, avgMood: 6.8, sessions: 8, riskLevel: 'baixo' },
    { team: 'Vendas', participation: 92, avgMood: 7.5, sessions: 15, riskLevel: 'baixo' },
    { team: 'Suporte', participation: 67, avgMood: 6.2, sessions: 6, riskLevel: 'medio' },
    { team: 'Financeiro', participation: 73, avgMood: 6.9, sessions: 9, riskLevel: 'baixo' }
  ];

  const monthlyTrends = [
    { month: 'Jan', participation: 65, avgMood: 6.5, sessions: 8 },
    { month: 'Fev', participation: 72, avgMood: 6.8, sessions: 12 },
    { month: 'Mar', participation: 78, avgMood: 7.1, sessions: 15 },
    { month: 'Abr', participation: 82, avgMood: 7.3, sessions: 18 },
    { month: 'Mai', participation: 85, avgMood: 7.5, sessions: 22 },
    { month: 'Jun', participation: 88, avgMood: 7.6, sessions: 25 }
  ];

  const riskDistribution = [
    { name: 'Baixo Risco', value: 75, color: '#10B981' },
    { name: 'Médio Risco', value: 20, color: '#F59E0B' },
    { name: 'Alto Risco', value: 5, color: '#EF4444' }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando dados de bem-estar..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-estar - Visão Executiva</h1>
          <p className="text-gray-600 mt-1">Métricas agregadas e anonimizadas</p>
        </div>
        <ErrorMessage error={error} onRetry={loadWellnessData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="mr-3 text-blue-500" size={28} />
            Bem-estar - Visão Executiva
          </h1>
          <p className="text-gray-600 mt-1">Métricas agregadas e anonimizadas para tomada de decisão</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="info" className="flex items-center space-x-1">
            <Shield size={14} />
            <span>Dados Anonimizados</span>
          </Badge>
          <Badge variant="warning" className="flex items-center space-x-1">
            <EyeOff size={14} />
            <span>Sem Identificação Individual</span>
          </Badge>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="text-blue-600 mt-1" size={20} />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Proteção de Dados e Privacidade</h3>
            <p className="text-sm text-blue-800">
              Esta área apresenta apenas dados agregados e anonimizados. Nenhuma informação individual identificável é exibida, 
              garantindo total confidencialidade e sigilo dos dados de saúde mental dos colaboradores.
            </p>
          </div>
        </div>
      </Card>

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

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.total_employees_participating || 0}
                  </div>
                  <div className="text-sm text-gray-600">Participantes</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.average_mood_score?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Humor Médio</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.sessions_this_month || 0}
                  </div>
                  <div className="text-sm text-gray-600">Sessões/Mês</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.active_alerts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Alertas Ativos</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição de Risco</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tendência de Participação</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="participation" stroke="#3B82F6" name="Participação %" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {selectedTab === 'teams' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bem-estar por Equipe</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Equipe</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Participação</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Humor Médio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Sessões</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nível de Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {teamWellnessData.map((team, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{team.team}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${team.participation}%` }}
                            />
                          </div>
                          <span className="text-sm">{team.participation}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{team.avgMood}/10</td>
                      <td className="py-3 px-4">{team.sessions}</td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          team.riskLevel === 'baixo' ? 'success' :
                          team.riskLevel === 'medio' ? 'warning' : 'danger'
                        }>
                          {team.riskLevel === 'baixo' ? 'Baixo' :
                           team.riskLevel === 'medio' ? 'Médio' : 'Alto'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance de Bem-estar por Equipe</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamWellnessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgMood" fill="#3B82F6" name="Humor Médio" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {selectedTab === 'trends' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tendências de Bem-estar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="participation" stroke="#3B82F6" name="Participação %" />
                <Line type="monotone" dataKey="avgMood" stroke="#10B981" name="Humor Médio" />
                <Line type="monotone" dataKey="sessions" stroke="#F59E0B" name="Sessões" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Indicadores Positivos</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-green-900">Aumento de 15% na participação</p>
                    <p className="text-sm text-green-700">Últimos 3 meses</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-green-900">Redução de 30% nos alertas</p>
                    <p className="text-sm text-green-700">Comparado ao mês anterior</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Activity className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-green-900">Maior engajamento em sessões</p>
                    <p className="text-sm text-green-700">Taxa de conclusão de 92%</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Áreas de Atenção</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingDown className="text-yellow-500" size={20} />
                  <div>
                    <p className="font-medium text-yellow-900">Equipe Suporte com menor participação</p>
                    <p className="text-sm text-yellow-700">67% vs média de 79%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  <div>
                    <p className="font-medium text-yellow-900">Aumento de 5% em alertas médios</p>
                    <p className="text-sm text-yellow-700">Necessário acompanhamento</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Alertas Agregados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h4 className="font-medium text-red-900">Alto Risco</h4>
                </div>
                <div className="text-2xl font-bold text-red-600">3</div>
                <div className="text-sm text-red-700">Casos identificados</div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  <h4 className="font-medium text-yellow-900">Médio Risco</h4>
                </div>
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <div className="text-sm text-yellow-700">Casos identificados</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <h4 className="font-medium text-green-900">Baixo Risco</h4>
                </div>
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-green-700">Casos identificados</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tendência de Alertas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#EF4444" name="Alertas" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WellnessAdmin;