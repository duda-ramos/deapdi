import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  Target, 
  Users,
  BarChart3,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { peopleManagementService, PerformanceMetrics } from '../../services/peopleManagement';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Select } from '../ui/Select';
import { LoadingScreen } from '../ui/LoadingScreen';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PerformanceDashboardProps {
  teamId?: string;
  managerId?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  teamId,
  managerId
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'engagement_score' | 'points' | 'completed_pdis'>('engagement_score');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadPerformanceData();
  }, [teamId, managerId, timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await peopleManagementService.getPerformanceMetrics();
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMetrics = metrics
    .filter(metric => filterLevel === 'all' || metric.level === filterLevel)
    .sort((a, b) => {
      switch (sortBy) {
        case 'engagement_score':
          return b.engagement_score - a.engagement_score;
        case 'points':
          return b.points - a.points;
        case 'completed_pdis':
          return b.completed_pdis - a.completed_pdis;
        default:
          return 0;
      }
    });

  const getPerformanceTrend = (score: number) => {
    if (score >= 80) return { icon: <TrendingUp size={16} className="text-green-500" />, color: 'text-green-600' };
    if (score >= 60) return { icon: <Minus size={16} className="text-yellow-500" />, color: 'text-yellow-600' };
    return { icon: <TrendingDown size={16} className="text-red-500" />, color: 'text-red-600' };
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const exportPerformanceReport = () => {
    peopleManagementService.exportToCSV(
      filteredMetrics.map(metric => ({
        Nome: metric.name,
        Cargo: metric.position,
        Nível: metric.level,
        Pontos: metric.points,
        'PDIs Concluídos': metric.completed_pdis,
        'Média Competências': metric.average_competency_rating.toFixed(1),
        'Conquistas': metric.achievements_count,
        'Score Engajamento': metric.engagement_score,
        'Última Atividade': new Date(metric.last_activity).toLocaleDateString('pt-BR')
      })),
      `performance-report-${new Date().toISOString().split('T')[0]}`
    );
  };

  const chartData = filteredMetrics.slice(0, 10).map(metric => ({
    name: metric.name.split(' ')[0], // First name only for chart
    engagement: metric.engagement_score,
    points: metric.points / 10, // Scale down for chart
    pdis: metric.completed_pdis * 10 // Scale up for chart
  }));

  if (loading) {
    return <LoadingScreen message="Carregando métricas de performance..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 text-blue-500" size={24} />
            Dashboard de Performance
          </h2>
          <p className="text-gray-600">Métricas de engajamento e produtividade</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={loadPerformanceData}
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportPerformanceReport}>
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Ordenar por"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            options={[
              { value: 'engagement_score', label: 'Score de Engajamento' },
              { value: 'points', label: 'Pontos' },
              { value: 'completed_pdis', label: 'PDIs Concluídos' }
            ]}
          />
          <Select
            label="Filtrar por Nível"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            options={[
              { value: 'all', label: 'Todos os Níveis' },
              { value: 'Júnior', label: 'Júnior' },
              { value: 'Pleno', label: 'Pleno' },
              { value: 'Sênior', label: 'Sênior' },
              { value: 'Especialista', label: 'Especialista' }
            ]}
          />
          <Select
            label="Período"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            options={[
              { value: '7d', label: 'Últimos 7 dias' },
              { value: '30d', label: 'Últimos 30 dias' },
              { value: '90d', label: 'Últimos 90 dias' }
            ]}
          />
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSortBy('engagement_score');
                setFilterLevel('all');
                setTimeRange('30d');
              }}
            >
              <Filter size={16} className="mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Performance Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparativo de Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="engagement" fill="#3B82F6" name="Engajamento" />
            <Bar dataKey="points" fill="#10B981" name="Pontos (x10)" />
            <Bar dataKey="pdis" fill="#F59E0B" name="PDIs (x10)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ranking de Performance</h3>
        <div className="space-y-3">
          {filteredMetrics.map((metric, index) => {
            const trend = getPerformanceTrend(metric.engagement_score);
            
            return (
              <motion.div
                key={metric.profile_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{metric.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{metric.position}</span>
                      <span>•</span>
                      <span>{metric.level}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{metric.points}</div>
                    <div className="text-xs text-gray-500">pontos</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{metric.completed_pdis}</div>
                    <div className="text-xs text-gray-500">PDIs</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{metric.achievements_count}</div>
                    <div className="text-xs text-gray-500">conquistas</div>
                  </div>
                  
                  <div className="text-center min-w-24">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      {trend.icon}
                      <span className={`font-bold ${trend.color}`}>
                        {metric.engagement_score}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">engajamento</div>
                  </div>
                  
                  <div className="w-24">
                    <ProgressBar 
                      progress={metric.engagement_score} 
                      color={metric.engagement_score >= 80 ? 'green' : metric.engagement_score >= 60 ? 'orange' : 'blue'}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <TrendingUp className="mr-2 text-green-500" size={16} />
            Top Performers
          </h4>
          <div className="space-y-2">
            {filteredMetrics.slice(0, 3).map((metric, index) => (
              <div key={metric.profile_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{metric.name}</span>
                <Badge variant="success" size="sm">
                  {metric.engagement_score}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Target className="mr-2 text-blue-500" size={16} />
            Mais PDIs Concluídos
          </h4>
          <div className="space-y-2">
            {filteredMetrics
              .sort((a, b) => b.completed_pdis - a.completed_pdis)
              .slice(0, 3)
              .map((metric) => (
                <div key={metric.profile_id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{metric.name}</span>
                  <Badge variant="info" size="sm">
                    {metric.completed_pdis} PDIs
                  </Badge>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Award className="mr-2 text-purple-500" size={16} />
            Mais Conquistas
          </h4>
          <div className="space-y-2">
            {filteredMetrics
              .sort((a, b) => b.achievements_count - a.achievements_count)
              .slice(0, 3)
              .map((metric) => (
                <div key={metric.profile_id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{metric.name}</span>
                  <Badge variant="warning" size="sm">
                    {metric.achievements_count} conquistas
                  </Badge>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};