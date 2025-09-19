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

export const achievementService = {
  async getTemplates() {
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .select('*')
      .order('category, points'), 'getAchievementTemplates');
  },

  async getUserAchievements(profileId: string) {
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
      const careerProgress = careerResult.data?.progress || 0;

      // Calculate progress for each template
      const progress: AchievementProgress[] = templates?.map(template => {
        const isUnlocked = unlockedTemplateIds.includes(template.id);
        const condition = template.trigger_condition;
        
        let currentProgress = 0;
        let maxProgress = 1;
        let requirements: string[] = [];

        switch (template.trigger_type) {
          case 'pdi_completed':
            maxProgress = condition.min_pdis;
            currentProgress = Math.min(completedPDIs, maxProgress);
            requirements = [`Completar ${maxProgress} PDI${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'task_completed':
            maxProgress = condition.min_tasks;
            currentProgress = Math.min(completedTasks, maxProgress);
            requirements = [`Completar ${maxProgress} tarefa${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'competency_rated':
            maxProgress = condition.min_rating;
            currentProgress = Math.min(maxCompetencyRating, maxProgress);
            requirements = [`Receber avaliação ${maxProgress} estrelas`];
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
      // Check all trigger types
      const triggerTypes = ['pdi_completed', 'task_completed', 'competency_rated', 'career_progress'];
      
      for (const triggerType of triggerTypes) {
        const { error } = await supabase.rpc('check_and_unlock_achievements', {
          p_profile_id: profileId,
          p_trigger_type: triggerType
        });

        if (error) {
          console.error(`🏆 Achievements: Error checking ${triggerType}:`, error);
        }
      }
      
      console.log('🏆 Achievements: Manual check completed');
    } catch (error) {
      console.error('🏆 Achievements: Manual check failed:', error);
      throw error;
    }
  },

  // Admin functions
  async createTemplate(template: Omit<AchievementTemplate, 'id' | 'created_at' | 'updated_at'>) {
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .insert(template)
      .select()
      .single(), 'createAchievementTemplate');
  },

  async updateTemplate(id: string, updates: Partial<AchievementTemplate>) {
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateAchievementTemplate');
  },

  async deleteTemplate(id: string) {
    return supabaseRequest(() => supabase
      .from('achievement_templates')
      .delete()
      .eq('id', id), 'deleteAchievementTemplate');
  }
};