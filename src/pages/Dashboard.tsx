import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Trophy,
  Calendar,
  BookOpen,
  Star,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const dashboardStats = [
    {
      icon: <TrendingUp className="text-blue-600" size={24} />,
      title: 'Progresso na Carreira',
      value: `75%`, // TODO: Get from career_tracks table
      change: '+15% este mês',
      color: 'blue'
    },
    {
      icon: <Target className="text-green-600" size={24} />,
      title: 'PDIs Ativos',
      value: '3',
      change: '2 concluídos',
      color: 'green'
    },
    {
      icon: <Trophy className="text-purple-600" size={24} />,
      title: 'Pontos Totais',
      value: user?.points.toLocaleString() || '0',
      change: '+250 esta semana',
      color: 'purple'
    },
    {
      icon: <Award className="text-orange-600" size={24} />,
      title: 'Conquistas',
      value: user?.achievements.length || '0',
      change: 'Nova desbloqueada!',
      color: 'orange'
    }
  ];

  const competencyData = [
    { name: 'React', self: 8, manager: 7 },
    { name: 'TypeScript', self: 7, manager: 8 },
    { name: 'Design Patterns', self: 6, manager: 6 },
    { name: 'Liderança', self: 5, manager: 7 },
    { name: 'Comunicação', self: 8, manager: 8 }
  ];

  const pieData = [
    { name: 'Concluído', value: 65, color: '#10B981' },
    { name: 'Em Progresso', value: 25, color: '#3B82F6' },
    { name: 'Pendente', value: 10, color: '#F59E0B' }
  ];
  if (loading) {
    return <LoadingScreen message="Carregando dashboard..." />;
  }


  const upcomingTasks = [
    { id: 1, title: 'Reunião de Feedback', date: '2024-01-15', type: 'meeting' },
    { id: 2, title: 'Entrega do PDI Q1', date: '2024-01-20', type: 'deadline' },
    { id: 3, title: 'Curso de TypeScript', date: '2024-01-25', type: 'learning' },
    { id: 4, title: 'Avaliação 360°', date: '2024-01-30', type: 'evaluation' }
  ];

  const recentAchievements = [
    { title: 'Primeira Conquista', date: '15/01/2024', points: 100, icon: '🚀' },
    { title: 'Team Player', date: '10/01/2024', points: 200, icon: '🤝' },
    { title: 'Eterno Aprendiz', date: '05/01/2024', points: 250, icon: '📚' }
  ];

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Olá, {user?.name}! 🚀
            </h1>
            <p className="text-blue-100 text-base md:text-lg">
              Continue sua jornada de desenvolvimento. Você está no nível <strong>{user?.level}</strong>
            </p>
            <div className="mt-4">
              <ProgressBar 
                progress={75} // TODO: Get from career_tracks table
                className="mb-2" 
                color="purple"
              />
              <p className="text-sm text-blue-100">
                Próximo nível: Pleno {/* TODO: Get from career_tracks table */}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Trophy size={48} className="mx-auto mb-2" />
              <p className="text-2xl font-bold">{user?.points}</p>
              <p className="text-sm text-blue-100">Pontos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {dashboardStats.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dashboardStats.indexOf(stat) * 0.1 }}
          >
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Competency Comparison Chart */}
        <Card className="lg:col-span-2 p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-6">Avaliação de Competências</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={competencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="self" fill="#3B82F6" name="Autoavaliação" />
              <Bar dataKey="manager" fill="#10B981" name="Avaliação do Gestor" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Progress Overview */}
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-6">Visão Geral</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Upcoming Tasks */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Próximas Atividades</h3>
            <Button size="sm" variant="ghost">
              <Calendar size={16} className="mr-2" />
              Ver Agenda
            </Button>
          </div>
          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.type === 'meeting' ? 'bg-blue-500' :
                    task.type === 'deadline' ? 'bg-red-500' :
                    task.type === 'learning' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.date}</p>
                  </div>
                </div>
                <Badge variant={
                  task.type === 'meeting' ? 'info' :
                  task.type === 'deadline' ? 'danger' :
                  task.type === 'learning' ? 'success' : 'warning'
                }>
                  {task.type === 'meeting' ? 'Reunião' :
                   task.type === 'deadline' ? 'Prazo' :
                   task.type === 'learning' ? 'Curso' : 'Avaliação'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Achievements */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Conquistas Recentes</h3>
            <Button size="sm" variant="ghost">
              <Trophy size={16} className="mr-2" />
              Ver Todas
            </Button>
          </div>
          <div className="space-y-4">
            {recentAchievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: recentAchievements.indexOf(achievement) * 0.1 }}
                className="flex items-center space-x-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-sm text-gray-500">{achievement.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">+{achievement.points}</p>
                  <p className="text-xs text-gray-500">pontos</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-6">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Button variant="primary" className="flex flex-col items-center py-4 space-y-2">
            <Target size={24} />
            <span className="text-sm">Criar PDI</span>
          </Button>
          <Button variant="secondary" className="flex flex-col items-center py-4 space-y-2">
            <Users size={24} />
            <span className="text-sm">Ver Equipe</span>
          </Button>
          <Button variant="success" className="flex flex-col items-center py-4 space-y-2">
            <BookOpen size={24} />
            <span className="text-sm">Iniciar Curso</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-4 space-y-2">
            <Star size={24} />
            <span className="text-sm">Avaliar</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-4 space-y-2">
            <Calendar size={24} />
            <span className="text-sm">Agendar</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-4 space-y-2">
            <Trophy size={24} />
            <span className="text-sm">Ranking</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-4 space-y-2"
            onClick={() => window.location.href = '/mental-health'}
          >
            <Heart size={24} />
            <span className="text-sm">Bem-estar</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;