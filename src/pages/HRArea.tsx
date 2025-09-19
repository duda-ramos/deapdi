import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Calendar,
  Award,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Profile, PDI, Competency } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AddSalaryModal } from '../components/modals/AddSalaryModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const HRArea: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingPDIs, setPendingPDIs] = useState<PDI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);
  const [selectedProfileForSalary, setSelectedProfileForSalary] = useState<string>('');

  useEffect(() => {
    if (user && (user.role === 'hr' || user.role === 'admin')) {
      loadHRData();
    }
  }, [user]);

  const loadHRData = async () => {
    try {
      setLoading(true);
      setError('');
      const profilesData = await databaseService.getProfiles();
      setProfiles(profilesData || []);
      
      // TODO: Load pending PDIs for validation
      // const pendingPDIsData = await databaseService.getPendingPDIs();
      // setPendingPDIs(pendingPDIsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do RH:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados do RH');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalary = (profileId: string) => {
    setSelectedProfileForSalary(profileId);
    setShowAddSalaryModal(true);
  };

  const handleSalarySuccess = () => {
    setSelectedProfileForSalary('');
    loadHRData(); // Reload data to reflect changes
  };
  // Mock data for charts
  const teamPerformanceData = [
    { team: 'Desenvolvimento', performance: 85, members: 12 },
    { team: 'Design', performance: 92, members: 8 },
    { team: 'Marketing', performance: 78, members: 10 },
    { team: 'Vendas', performance: 88, members: 15 },
    { team: 'Suporte', performance: 90, members: 6 }
  ];

  const competencyGapData = [
    { competency: 'React', current: 3.2, target: 4.5 },
    { competency: 'Liderança', current: 2.8, target: 4.0 },
    { competency: 'Comunicação', current: 4.1, target: 4.5 },
    { competency: 'TypeScript', current: 2.5, target: 4.0 },
    { competency: 'Gestão de Projetos', current: 3.5, target: 4.2 }
  ];

  const engagementData = [
    { month: 'Jan', engagement: 78, satisfaction: 82 },
    { month: 'Fev', engagement: 82, satisfaction: 85 },
    { month: 'Mar', engagement: 85, satisfaction: 88 },
    { month: 'Abr', engagement: 88, satisfaction: 90 },
    { month: 'Mai', engagement: 92, satisfaction: 93 },
    { month: 'Jun', engagement: 89, satisfaction: 91 }
  ];

  const roleDistribution = [
    { name: 'Colaboradores', value: profiles.filter(p => p.role === 'employee').length, color: '#3B82F6' },
    { name: 'Gestores', value: profiles.filter(p => p.role === 'manager').length, color: '#10B981' },
    { name: 'RH', value: profiles.filter(p => p.role === 'hr').length, color: '#F59E0B' },
    { name: 'Admins', value: profiles.filter(p => p.role === 'admin').length, color: '#EF4444' }
  ];

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={16} /> },
    { id: 'employees', label: 'Colaboradores', icon: <Users size={16} /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> },
    { id: 'development', label: 'Desenvolvimento', icon: <Target size={16} /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText size={16} /> }
  ];

  const employeeColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, row: Profile) => (
        <div className="flex items-center space-x-3">
          <img
            src={row.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
            alt={value}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { key: 'position', label: 'Cargo' },
    { key: 'level', label: 'Nível' },
    {
      key: 'points',
      label: 'Pontos',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: Profile) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddSalary(row.id)}
            title="Adicionar histórico salarial"
          >
            <DollarSign size={14} />
          </Button>
        </div>
      )
    }
  ];

  if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar a área de RH.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando dados do RH..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Área de RH</h1>
          <p className="text-gray-600 mt-1">Gestão estratégica de pessoas e desenvolvimento</p>
        </div>
        <ErrorMessage error={error} onRetry={loadHRData} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Área de RH</h1>
          <p className="text-gray-600 mt-1">Gestão estratégica de pessoas e desenvolvimento</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowAddSalaryModal(true)}
            variant="secondary"
          >
            <DollarSign size={16} className="mr-2" />
            Gerenciar Salários
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-3 md:p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
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
        <div className="space-y-4 md:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-3 md:p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                <div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{profiles.length}</div>
                  <div className="text-sm text-gray-600">Total Colaboradores</div>
                </div>
              </div>
            </Card>
            <Card className="p-3 md:p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                <div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {profiles.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Ativos</div>
                </div>
              </div>
            </Card>
            <Card className="p-3 md:p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
                <div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">87%</div>
                  <div className="text-sm text-gray-600">Engajamento</div>
                </div>
              </div>
            </Card>
            <Card className="p-3 md:p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
                <div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">23</div>
                  <div className="text-sm text-gray-600">PDIs Pendentes</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Role Distribution */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Função</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roleDistribution.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Engagement Trend */}
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Tendência de Engajamento</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="engagement" stroke="#3B82F6" name="Engajamento" />
                  <Line type="monotone" dataKey="satisfaction" stroke="#10B981" name="Satisfação" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Team Performance */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">Performance por Equipe</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="performance" fill="#3B82F6" name="Performance %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Employees Tab */}
      {selectedTab === 'employees' && (
        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lista de Colaboradores</h3>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowAddSalaryModal(true)}
                  variant="secondary"
                >
                  <DollarSign size={16} className="mr-2" />
                  Adicionar Histórico Salarial
                </Button>
                <Button>
                  Exportar Relatório
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={employeeColumns}
                data={profiles}
                loading={loading}
                emptyMessage="Nenhum colaborador encontrado"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gap de Competências</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competencyGapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competency" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="current" fill="#94A3B8" name="Nível Atual" />
                <Bar dataKey="target" fill="#3B82F6" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              <div className="space-y-3">
                {profiles
                  .sort((a, b) => b.points - a.points)
                  .slice(0, 5)
                  .map((profile, index) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <img
                          src={profile.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
                          alt={profile.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{profile.name}</p>
                          <p className="text-sm text-gray-500">{profile.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{profile.points}</p>
                        <p className="text-xs text-gray-500">pontos</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Alertas de Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle size={20} className="text-red-500" />
                  <div>
                    <p className="font-medium text-red-900">3 colaboradores com baixo engajamento</p>
                    <p className="text-sm text-red-700">Necessário acompanhamento individual</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock size={20} className="text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-900">5 PDIs próximos do prazo</p>
                    <p className="text-sm text-yellow-700">Vencimento em menos de 7 dias</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={20} className="text-green-500" />
                  <div>
                    <p className="font-medium text-green-900">12 competências melhoradas</p>
                    <p className="text-sm text-green-700">Este mês comparado ao anterior</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      <AddSalaryModal
        isOpen={showAddSalaryModal}
        onClose={() => {
          setShowAddSalaryModal(false);
          setSelectedProfileForSalary('');
        }}
        profiles={profiles}
        selectedProfileId={selectedProfileForSalary}
        onSuccess={handleSalarySuccess}
      />
      {/* Development Tab */}
      {selectedTab === 'development' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">45</div>
                  <div className="text-sm text-gray-600">PDIs Ativos</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">23</div>
                  <div className="text-sm text-gray-600">Concluídos este mês</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">78%</div>
                  <div className="text-sm text-gray-600">Taxa de conclusão</div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Planos de Desenvolvimento por Status</h3>
            <div className="space-y-4">
              {[
                { status: 'Pendente', count: 12, color: 'bg-yellow-500' },
                { status: 'Em Progresso', count: 33, color: 'bg-blue-500' },
                { status: 'Aguardando Validação', count: 8, color: 'bg-orange-500' },
                { status: 'Concluído', count: 23, color: 'bg-green-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${item.color}`} />
                    <span className="font-medium text-gray-900">{item.status}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                    <ProgressBar 
                      progress={(item.count / 76) * 100} 
                      className="w-24"
                      color="blue"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {selectedTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Relatório de Performance',
                description: 'Análise completa de performance por colaborador e equipe',
                icon: <TrendingUp size={24} />,
                color: 'bg-blue-500'
              },
              {
                title: 'Relatório de Competências',
                description: 'Mapeamento de competências e gaps de desenvolvimento',
                icon: <BarChart3 size={24} />,
                color: 'bg-green-500'
              },
              {
                title: 'Relatório de Engajamento',
                description: 'Métricas de engajamento e satisfação dos colaboradores',
                icon: <Award size={24} />,
                color: 'bg-purple-500'
              },
              {
                title: 'Relatório de PDIs',
                description: 'Status e progresso dos planos de desenvolvimento',
                icon: <Target size={24} />,
                color: 'bg-orange-500'
              },
              {
                title: 'Relatório de Trilhas',
                description: 'Progresso nas trilhas de carreira por colaborador',
                icon: <Users size={24} />,
                color: 'bg-pink-500'
              },
              {
                title: 'Relatório Executivo',
                description: 'Resumo executivo com principais métricas e insights',
                icon: <FileText size={24} />,
                color: 'bg-indigo-500'
              }
            ].map((report, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center text-white mb-4`}>
                    {report.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {report.description}
                  </p>
                  <Button size="sm" className="w-full">
                    Gerar Relatório
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRArea;