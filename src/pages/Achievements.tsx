import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Target, Users, BookOpen, TrendingUp, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Achievement } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'career' | 'learning' | 'collaboration' | 'leadership' | 'innovation';
  requirements: string[];
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

const Achievements: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock achievement templates - in real app, this would come from database
  const achievementTemplates: AchievementTemplate[] = [
    {
      id: '1',
      title: 'Primeira Conquista',
      description: 'Complete seu primeiro PDI',
      icon: '🚀',
      points: 100,
      category: 'career',
      requirements: ['Concluir 1 PDI'],
      unlocked: true,
      progress: 1,
      maxProgress: 1
    },
    {
      id: '2',
      title: 'Eterno Aprendiz',
      description: 'Complete 5 cursos de capacitação',
      icon: '📚',
      points: 250,
      category: 'learning',
      requirements: ['Concluir 5 cursos'],
      unlocked: true,
      progress: 3,
      maxProgress: 5
    },
    {
      id: '3',
      title: 'Team Player',
      description: 'Participe de 3 grupos de ação',
      icon: '🤝',
      points: 200,
      category: 'collaboration',
      requirements: ['Participar de 3 grupos de ação'],
      unlocked: true,
      progress: 2,
      maxProgress: 3
    },
    {
      id: '4',
      title: 'Mentor Dedicado',
      description: 'Seja mentor em 5 PDIs',
      icon: '🎯',
      points: 300,
      category: 'leadership',
      requirements: ['Ser mentor em 5 PDIs'],
      unlocked: false,
      progress: 1,
      maxProgress: 5
    },
    {
      id: '5',
      title: 'Inovador',
      description: 'Proponha 3 melhorias implementadas',
      icon: '💡',
      points: 400,
      category: 'innovation',
      requirements: ['3 melhorias implementadas'],
      unlocked: false,
      progress: 0,
      maxProgress: 3
    },
    {
      id: '6',
      title: 'Especialista',
      description: 'Alcance nível 5 em todas as competências técnicas',
      icon: '⭐',
      points: 500,
      category: 'career',
      requirements: ['Nível 5 em todas competências técnicas'],
      unlocked: false,
      progress: 2,
      maxProgress: 8
    },
    {
      id: '7',
      title: 'Comunicador',
      description: 'Apresente 10 workshops internos',
      icon: '🎤',
      points: 350,
      category: 'leadership',
      requirements: ['Apresentar 10 workshops'],
      unlocked: false,
      progress: 0,
      maxProgress: 10
    },
    {
      id: '8',
      title: 'Colaborador do Ano',
      description: 'Acumule 2000 pontos em um ano',
      icon: '🏆',
      points: 1000,
      category: 'career',
      requirements: ['2000 pontos em 12 meses'],
      unlocked: false,
      progress: user?.points || 0,
      maxProgress: 2000
    }
  ];

  const categories = [
    { id: 'all', label: 'Todas', icon: <Trophy size={16} /> },
    { id: 'career', label: 'Carreira', icon: <TrendingUp size={16} /> },
    { id: 'learning', label: 'Aprendizado', icon: <BookOpen size={16} /> },
    { id: 'collaboration', label: 'Colaboração', icon: <Users size={16} /> },
    { id: 'leadership', label: 'Liderança', icon: <Award size={16} /> },
    { id: 'innovation', label: 'Inovação', icon: <Star size={16} /> }
  ];

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await databaseService.getAchievements(user.id);
      setAchievements(data || []);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievementTemplates 
    : achievementTemplates.filter(a => a.category === selectedCategory);

  const unlockedCount = achievementTemplates.filter(a => a.unlocked).length;
  const totalPoints = achievementTemplates
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'career': return 'bg-blue-500';
      case 'learning': return 'bg-green-500';
      case 'collaboration': return 'bg-purple-500';
      case 'leadership': return 'bg-orange-500';
      case 'innovation': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'career': return 'info';
      case 'learning': return 'success';
      case 'collaboration': return 'default';
      case 'leadership': return 'warning';
      case 'innovation': return 'danger';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingScreen message="Carregando conquistas..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conquistas</h1>
          <p className="text-gray-600 mt-1">Acompanhe seu progresso e desbloqueie novas conquistas</p>
        </div>
        <ErrorMessage error={error} onRetry={loadAchievements} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conquistas</h1>
          <p className="text-gray-600 mt-1">Acompanhe seu progresso e desbloqueie novas conquistas</p>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{unlockedCount}</div>
              <div className="text-sm text-gray-600">Desbloqueadas</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{achievementTemplates.length - unlockedCount}</div>
              <div className="text-sm text-gray-600">Bloqueadas</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{totalPoints}</div>
              <div className="text-sm text-gray-600">Pontos Ganhos</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{Math.round((unlockedCount / achievementTemplates.length) * 100)}%</div>
              <div className="text-sm text-gray-600">Progresso</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="p-3 md:p-4">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredAchievements.indexOf(achievement) * 0.1 }}
          >
            <Card className={`p-6 h-full transition-all ${
              achievement.unlocked 
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={getCategoryBadgeVariant(achievement.category)}>
                    {categories.find(c => c.id === achievement.category)?.label}
                  </Badge>
                  {achievement.unlocked && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">+{achievement.points}</div>
                      <div className="text-xs text-gray-500">pontos</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className={`text-lg font-semibold ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${
                    achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Requisitos:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {achievement.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        {achievement.unlocked ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-gray-400">○</span>
                        )}
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progresso</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <ProgressBar
                      progress={(achievement.progress / achievement.maxProgress) * 100}
                      color="blue"
                    />
                  </div>
                )}

                {achievement.unlocked && (
                  <div className="flex items-center space-x-2 text-xs text-green-600">
                    <Trophy size={12} />
                    <span>Conquista desbloqueada!</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Next Achievements */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Próximas Conquistas</h3>
        <div className="space-y-3">
          {achievementTemplates
            .filter(a => !a.unlocked && a.progress !== undefined)
            .sort((a, b) => {
              const progressA = a.maxProgress ? (a.progress! / a.maxProgress) : 0;
              const progressB = b.maxProgress ? (b.progress! / b.maxProgress) : 0;
              return progressB - progressA;
            })
            .slice(0, 3)
            .map((achievement) => (
              <div key={achievement.id} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl grayscale opacity-50">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  {achievement.maxProgress && (
                    <div className="mt-2">
                      <ProgressBar
                        progress={(achievement.progress! / achievement.maxProgress) * 100}
                        color="blue"
                        showLabel
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-600">+{achievement.points}</div>
                  <div className="text-xs text-gray-500">pontos</div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default Achievements;