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
  Award,
  Heart
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
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    checkFirstTimeUser();
  }, [user]);

  const checkFirstTimeUser = async () => {
    if (!user) return;
    
    try {
      // Check if user just completed onboarding
      const completedRecently = user.onboarding_completed_at && 
        new Date(user.onboarding_completed_at).getTime() > Date.now() - (5 * 60 * 1000); // 5 minutes ago
      
      setIsFirstTime(!!completedRecently);
      setLoading(false);
    } catch (error) {
      console.error('Error checking first time user:', error);
      setLoading(false);
    }
  };
  if (loading) {
    return <LoadingScreen message="Carregando dashboard..." />;
  }

  // Show welcome message for first-time users
  if (isFirstTime) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-4">
              Bem-vindo ao TalentFlow, {user?.name}!
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              Sua configuração foi concluída com sucesso. Agora você pode começar sua jornada de desenvolvimento!
            </p>
          </motion.div>
        </div>

        {/* First Steps */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-center">Primeiros Passos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="primary" 
              className="flex flex-col items-center py-6 space-y-3 h-auto"
              onClick={() => window.location.href = '/pdi'}
            >
              <Target size={32} />
              <div className="text-center">
                <div className="font-semibold">Criar Primeiro PDI</div>
                <div className="text-xs opacity-80">Defina seus objetivos</div>
              </div>
            </Button>
            
            <Button 
              variant="secondary" 
              className="flex flex-col items-center py-6 space-y-3 h-auto"
              onClick={() => window.location.href = '/learning'}
            >
              <BookOpen size={32} />
              <div className="text-center">
                <div className="font-semibold">Explorar Cursos</div>
                <div className="text-xs opacity-80">Comece a aprender</div>
              </div>
            </Button>
            
            <Button 
              variant="success" 
              className="flex flex-col items-center py-6 space-y-3 h-auto"
              onClick={() => window.location.href = '/competencies'}
            >
              <BarChart3 size={32} />
              <div className="text-center">
                <div className="font-semibold">Avaliar Competências</div>
                <div className="text-xs opacity-80">Autoconhecimento</div>
              </div>
            </Button>
            
            {user?.mental_health_consent && (
              <Button 
                variant="ghost" 
                className="flex flex-col items-center py-6 space-y-3 h-auto"
                onClick={() => window.location.href = '/mental-health'}
              >
                <Heart size={32} />
                <div className="text-center">
                  <div className="font-semibold">Bem-estar</div>
                  <div className="text-xs opacity-80">Cuide da sua saúde mental</div>
                </div>
              </Button>
            )}
          </div>
        </Card>
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
  // Empty dashboard for regular users
  const dashboardStats = [
    {
      icon: <TrendingUp className="text-blue-600" size={24} />,
      title: 'Progresso na Carreira',
      value: '0%',
      change: 'Comece criando PDIs',
      color: 'blue'
    },
    {
      icon: <Target className="text-green-600" size={24} />,
      title: 'PDIs Ativos',
      value: '0',
      change: 'Crie seu primeiro PDI',
      color: 'green'
    },
    {
      icon: <Trophy className="text-purple-600" size={24} />,
      title: 'Pontos Totais',
      value: user?.points.toLocaleString() || '0',
      change: 'Ganhe pontos completando atividades',
      color: 'purple'
    },
    {
      icon: <Award className="text-orange-600" size={24} />,
      title: 'Conquistas',
      value: '0',
      change: 'Desbloqueie suas primeiras conquistas',
      color: 'orange'
    }
  ];
          <Button 

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
              Bem-vindo à sua jornada de desenvolvimento. Você está no nível <strong>{user?.level}</strong>
            </p>
            <div className="mt-4">
              <p className="text-sm text-blue-100">
                Comece criando seu primeiro PDI para iniciar sua trilha de desenvolvimento
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
        {/* Getting Started */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-6">Comece Sua Jornada</h3>
          <div className="text-center py-8">
            <Target size={48} className="mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Pronto para começar?
            </h4>
            <p className="text-gray-600 mb-6">
              Suas competências e progresso aparecerão aqui conforme você avança
            </p>
            <Button onClick={() => window.location.href = '/competencies'}>
              Fazer Primeira Autoavaliação
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-6">Próximos Passos</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">1. Criar PDI</h4>
              <p className="text-sm text-blue-700">Defina seus objetivos de desenvolvimento</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">2. Avaliar Competências</h4>
              <p className="text-sm text-green-700">Faça sua autoavaliação</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">3. Explorar Cursos</h4>
              <p className="text-sm text-purple-700">Inicie seu aprendizado</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Empty Upcoming Tasks */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Próximas Atividades</h3>
          </div>
          <div className="text-center py-8">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600">Suas atividades aparecerão aqui</p>
          </div>
        </Card>

        {/* Empty Achievements */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Suas Conquistas</h3>
            <Button size="sm" variant="ghost">
              <Trophy size={16} className="mr-2" />
              Ver Todas
            </Button>
          </div>
          <div className="text-center py-8">
            <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 mb-4">
              Suas conquistas aparecerão aqui conforme você progride!
            </p>
            <Button size="sm" onClick={() => window.location.href = '/achievements'}>
              Ver Sistema de Conquistas
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-6">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Button 
            variant="primary" 
            className="flex flex-col items-center py-4 space-y-2"
            onClick={() => window.location.href = '/pdi'}
          >
            <Target size={24} />
            <span className="text-sm">Criar PDI</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex flex-col items-center py-4 space-y-2"
            onClick={() => window.location.href = '/profile'}
          >
            <Users size={24} />
            <span className="text-sm">Meu Perfil</span>
          </Button>
          <Button 
            variant="success" 
            className="flex flex-col items-center py-4 space-y-2"
            onClick={() => window.location.href = '/learning'}
          >
            <BookOpen size={24} />
            <span className="text-sm">Iniciar Curso</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-4 space-y-2"
            onClick={() => window.location.href = '/competencies'}
          >
            <Star size={24} />
            <span className="text-sm">Avaliar</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-4 space-y-2"
            onClick={() => window.location.href = '/achievements'}
          >
            <Trophy size={24} />
            <span className="text-sm">Conquistas</span>
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