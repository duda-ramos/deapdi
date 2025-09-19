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
        achievementService.getUserAchievements(user.id),
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

export interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  trigger_type: string;
  trigger_condition: any;
  created_at: string;
  updated_at: string;
}

export interface AchievementProgress {
  templateId: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  requirements: string[];
}

export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
}

export const achievementService = {
  async getTemplates() {
    console.log('🏆 Achievements: Getting templates');
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .select('*')
      .order('category, points'), 'getAchievementTemplates');
  },

  async getUserAchievements(profileId: string) {
    console.log('🏆 Achievements: Getting user achievements for:', profileId);
    return supabaseRequest(() => supabase
      .from('achievements')
      .select(`
        *,
        template:achievement_templates(*)
      `)
      .eq('profile_id', profileId)
      .order('unlocked_at', { ascending: false }), 'getUserAchievements');
  },

  async getAchievementProgress(profileId: string): Promise<AchievementProgress[]> {
    console.log('🏆 Achievements: Getting progress for profile:', profileId);

    try {
      // Get all templates
      const templates = await this.getTemplates();
      
      // Get user's unlocked achievements
      const userAchievements = await this.getUserAchievements(profileId);
      const unlockedTemplateIds = userAchievements?.map(a => a.template_id) || [];

      // Get user's current stats for progress calculation
      const [pdisResult, tasksResult, competenciesResult, careerResult] = await Promise.all([
        supabase.from('pdis').select('status').eq('profile_id', profileId),
        supabase.from('tasks').select('status').eq('assignee_id', profileId),
        supabase.from('competencies').select('self_rating, manager_rating').eq('profile_id', profileId),
        supabase.from('career_tracks').select('progress').eq('profile_id', profileId).maybeSingle()
      ]);

      const completedPDIs = pdisResult.data?.filter(p => p.status === 'completed' || p.status === 'validated').length || 0;
      const completedTasks = tasksResult.data?.filter(t => t.status === 'done').length || 0;
      const maxCompetencyRating = competenciesResult.data?.reduce((max, c) => 
        Math.max(max, Math.max(c.self_rating || 0, c.manager_rating || 0)), 0) || 0;
      const fiveStarCount = competenciesResult.data?.filter(c => 
        Math.max(c.self_rating || 0, c.manager_rating || 0) === 5).length || 0;
      const careerProgress = careerResult.data?.progress || 0;

      console.log('🏆 Achievements: User stats:', {
        completedPDIs,
        completedTasks,
        maxCompetencyRating,
        fiveStarCount,
        careerProgress
      });

      // Calculate progress for each template
      const progress: AchievementProgress[] = templates?.map(template => {
        const isUnlocked = unlockedTemplateIds.includes(template.id);
        const condition = template.trigger_condition;
        
        let currentProgress = 0;
        let maxProgress = 1;
        let requirements: string[] = [];

        switch (template.trigger_type) {
          case 'task_completed':
            maxProgress = condition.min_tasks;
            currentProgress = Math.min(completedTasks, maxProgress);
            requirements = [`Completar ${maxProgress} tarefa${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'pdi_completed':
            maxProgress = condition.min_pdis;
            currentProgress = Math.min(completedPDIs, maxProgress);
            requirements = [`Completar ${maxProgress} PDI${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'competency_rated':
            if (condition.min_count) {
              maxProgress = condition.min_count;
              currentProgress = Math.min(fiveStarCount, maxProgress);
              requirements = [`Receber ${maxProgress} avaliação${maxProgress > 1 ? 'ões' : ''} 5 estrelas`];
            } else {
              maxProgress = condition.min_rating;
              currentProgress = Math.min(maxCompetencyRating, maxProgress);
              requirements = [`Receber avaliação ${maxProgress} estrelas`];
            }
            break;
            
          case 'career_progress':
            maxProgress = condition.min_progress;
            currentProgress = Math.min(careerProgress, maxProgress);
            requirements = [`Alcançar ${maxProgress}% de progresso na trilha`];
            break;
        }

        return {
          templateId: template.id,
          title: template.title,
          description: template.description,
          icon: template.icon,
          points: template.points,
          category: template.category,
          unlocked: isUnlocked,
          progress: currentProgress,
          maxProgress,
          requirements
        };
      }) || [];

      console.log('🏆 Achievements: Progress calculated for', progress.length, 'achievements');
      return progress;

    } catch (error) {
      console.error('🏆 Achievements: Error getting progress:', error);
      throw error;
    }
  },

  async manualCheckAchievements(profileId: string) {
    console.log('🏆 Achievements: Manual check for profile:', profileId);
    
    try {
      const { data, error } = await supabase.rpc('manual_check_achievements', {
        p_profile_id: profileId
      });

      if (error) {
        console.error('🏆 Achievements: Manual check error:', error);
        throw error;
      }

      console.log('🏆 Achievements: Manual check result:', data);
      return data?.[0] || { unlocked_count: 0, total_points: 0 };
    } catch (error) {
      console.error('🏆 Achievements: Manual check failed:', error);
      throw error;
    }
  },

  // Subscribe to new achievements for real-time notifications
  subscribeToAchievements(
    profileId: string,
    callback: (achievement: AchievementNotification) => void
  ) {
    console.log('🏆 Achievements: Setting up subscription for profile:', profileId);
    
    const channel = supabase
      .channel(`achievements_${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('🏆 Achievements: New achievement unlocked:', payload);
          if (payload.new) {
            const achievement = payload.new as Achievement;
            callback({
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              points: achievement.points,
              category: 'achievement'
            });
          }
        }
      )
      .subscribe();
    
    return channel;
  },

  // Admin functions
  async createTemplate(template: Omit<AchievementTemplate, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🏆 Achievements: Creating template:', template.title);
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .insert(template)
      .select()
      .single(), 'createAchievementTemplate');
  },

  async updateTemplate(id: string, updates: Partial<AchievementTemplate>) {
    console.log('🏆 Achievements: Updating template:', id);
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateAchievementTemplate');
  },

  async deleteTemplate(id: string) {
    console.log('🏆 Achievements: Deleting template:', id);
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .delete()
      .eq('id', id), 'deleteAchievementTemplate');
  }
};