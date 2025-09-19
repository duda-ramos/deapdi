import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Target, Users, BookOpen, TrendingUp, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementContext';
import { achievementService, AchievementProgress } from '../services/achievements';
import { Achievement } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

const Achievements: React.FC = () => {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas', icon: <Trophy size={16} /> },
    { id: 'getting_started', label: 'Primeiros Passos', icon: <TrendingUp size={16} /> },
    { id: 'development', label: 'Desenvolvimento', icon: <BookOpen size={16} /> },
    { id: 'productivity', label: 'Produtividade', icon: <Users size={16} /> },
    { id: 'competency', label: 'Competências', icon: <Award size={16} /> },
    { id: 'career', label: 'Carreira', icon: <Star size={16} /> }
  ];

  useEffect(() => {
    if (user) {
      loadAchievementProgress();
    }
  }, [user]);

  const loadAchievementProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const progress = await achievementService.getAchievementProgress(user.id);
      setAchievementProgress(progress);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!user) return;

    try {
      setChecking(true);
      await checkAchievements();
      await loadAchievementProgress(); // Reload to see new achievements
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    } finally {
      setChecking(false);
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievementProgress 
    : achievementProgress.filter(a => a.category === selectedCategory);

  const unlockedCount = achievementProgress.filter(a => a.unlocked).length;
  const totalPoints = achievementProgress
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'getting_started': return 'bg-green-500';
      case 'development': return 'bg-blue-500';
      case 'productivity': return 'bg-purple-500';
      case 'competency': return 'bg-orange-500';
      case 'career': return 'bg-yellow-500';
      case 'learning': return 'bg-green-500';
      case 'collaboration': return 'bg-purple-500';
      case 'leadership': return 'bg-orange-500';
      case 'innovation': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'getting_started': return 'success';
      case 'development': return 'info';
      case 'productivity': return 'default';
      case 'competency': return 'warning';
      case 'career': return 'danger';
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
        <ErrorMessage error={error} onRetry={loadAchievementProgress} />
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
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleManualCheck}
            loading={checking}
            variant="secondary"
          >
            <RefreshCw size={16} className="mr-2" />
            Verificar Conquistas
          </Button>
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
              <div className="text-xl md:text-2xl font-bold text-gray-900">{achievementProgress.length - unlockedCount}</div>
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
              <div className="text-xl md:text-2xl font-bold text-gray-900">{Math.round((unlockedCount / achievementProgress.length) * 100)}%</div>
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
      {filteredAchievements.length === 0 ? (
        <Card className="p-6 md:p-8 text-center">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Suas conquistas aparecerão aqui!
          </h3>
          <p className="text-gray-600">
            Complete atividades, PDIs e cursos para desbloquear suas primeiras conquistas.
          </p>
          <div className="mt-6 space-y-2">
            <Button onClick={() => window.location.href = '/pdi'}>
              <Target size={16} className="mr-2" />
              Criar Primeiro PDI
            </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filteredAchievements.findIndex(a => a.templateId === achievement.templateId) * 0.1 }}
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
      )}

      {/* Next Achievements */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Próximas Conquistas</h3>
        <div className="space-y-3">
          {achievementProgress
            .filter(a => !a.unlocked && a.progress !== undefined)
            .sort((a, b) => {
              const progressA = a.maxProgress ? (a.progress! / a.maxProgress) : 0;
              const progressB = b.maxProgress ? (b.progress! / b.maxProgress) : 0;
              return progressB - progressA;
            })
            .slice(0, 3)
            .map((achievement, index) => (
              <div key={achievement.templateId} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl grayscale opacity-50">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  {achievement.maxProgress && (
                    <div className="mt-2">
                      <ProgressBar
                        progress={(achievement.progress / achievement.maxProgress) * 100}
                        color="blue"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Progresso</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
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