import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import type { Achievement } from '../types';

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