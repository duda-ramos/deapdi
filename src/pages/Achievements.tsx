import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Award, Users, BookOpen, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { achievementService, type AchievementProgress } from '../services/achievements';
import type { Achievement } from '../types';

const Achievements: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unlocked' | 'progress'>('unlocked');

  useEffect(() => {
    if (user?.id) {
      loadAchievements();
    }
  }, [user?.id]);

  const loadAchievements = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [userAchievements, achievementProgress] = await Promise.all([
        databaseService.getAchievements(user.id),
        achievementService.getAchievementProgress(user.id)
      ]);

      setAchievements(userAchievements || []);
      setProgress(achievementProgress || []);
    } catch (err) {
      // Normalize error to prevent primitive conversion issues
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error loading achievements:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'career': return <Target className="w-5 h-5" />;
      case 'learning': return <BookOpen className="w-5 h-5" />;
      case 'collaboration': return <Users className="w-5 h-5" />;
      case 'performance': return <Zap className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'career': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-green-100 text-green-800';
      case 'collaboration': return 'bg-purple-100 text-purple-800';
      case 'performance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPoints = achievements.reduce((sum, achievement) => sum + (achievement.points || 0), 0);
  const unlockedCount = achievements.length;
  const totalAchievements = progress.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Conquistas</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Conquistas</h1>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar conquistas</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAchievements}>
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Conquistas</h1>
        </div>
        <Button onClick={loadAchievements} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Pontos</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conquistas Desbloqueadas</p>
              <p className="text-2xl font-bold text-gray-900">{unlockedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Progresso Geral</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'unlocked'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Desbloqueadas ({unlockedCount})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'progress'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Progresso ({progress.filter(p => !p.unlocked).length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'unlocked' ? (
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma conquista desbloqueada ainda
                </h3>
                <p className="text-gray-600">
                  Complete tarefas, PDIs e desenvolva suas competências para desbloquear conquistas!
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                        <Badge className={getCategoryColor(achievement.category || 'general')}>
                          {getCategoryIcon(achievement.category || 'general')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{achievement.points} pontos</span>
                        </div>
                        {achievement.unlocked_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {progress.filter(p => !p.unlocked).length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Todas as conquistas foram desbloqueadas!
                </h3>
                <p className="text-gray-600">
                  Parabéns! Você completou todas as conquistas disponíveis.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progress
                .filter(p => !p.unlocked)
                .map((item) => (
                  <Card key={item.templateId} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl opacity-50">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <Badge className={getCategoryColor(item.category)}>
                            {getCategoryIcon(item.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progresso</span>
                            <span className="font-medium">
                              {item.progress}/{item.maxProgress}
                            </span>
                          </div>
                          <ProgressBar 
                            progress={(item.progress / item.maxProgress) * 100} 
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-1 mb-3">
                          <p className="text-xs font-medium text-gray-700">Requisitos:</p>
                          {item.requirements.map((req, index) => (
                            <p key={index} className="text-xs text-gray-600">• {req}</p>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{item.points} pontos</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Achievements;
