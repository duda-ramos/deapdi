import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Award, 
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { peopleManagementService } from '../../services/peopleManagement';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { LoadingScreen } from '../ui/LoadingScreen';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { getAvatarUrl, handleImageError } from '../../utils/images';

interface TeamInsightsProps {
  teamId: string;
  teamName: string;
}

export const TeamInsights: React.FC<TeamInsightsProps> = ({ teamId, teamName }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamInsights();
  }, [teamId]);

  const loadTeamInsights = async () => {
    try {
      setLoading(true);
      const data = await peopleManagementService.getTeamInsights(teamId);
      setInsights(data);
    } catch (error) {
      console.error('Error loading team insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Carregando insights da equipe..." />;
  }

  if (!insights) {
    return (
      <Card className="p-6 text-center">
        <Building size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-gray-600">Não foi possível carregar os insights da equipe</p>
      </Card>
    );
  }

  const skillChartData = Object.entries(insights.skill_distribution)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  const levelChartData = Object.entries(insights.level_distribution)
    .map(([level, count]) => ({ level, count, color: getRandomColor() }));

  function getRandomColor() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900">{teamName}</h2>
        <Badge variant="info">{insights.members.length} membros</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.members.length}</div>
              <div className="text-sm text-gray-600">Membros</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.performance_avg}%</div>
              <div className="text-sm text-gray-600">Performance Média</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.engagement_avg}</div>
              <div className="text-sm text-gray-600">Pontos Médios</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {insights.members.filter((m: any) => m.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Distribuição de Habilidades
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={skillChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Level Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="mr-2" size={20} />
            Distribuição por Nível
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={levelChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
                label={({ level, count }) => `${level}: ${count}`}
              >
                {levelChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Membros da Equipe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.members.map((member: any) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={getAvatarUrl(member.avatar_url, member.name)}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => handleImageError(e, member.name)}
                />
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.position}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nível:</span>
                  <Badge variant="default" size="sm">{member.level}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pontos:</span>
                  <span className="font-semibold text-blue-600">{member.points}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={member.status === 'active' ? 'success' : 'default'} size="sm">
                    {member.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};