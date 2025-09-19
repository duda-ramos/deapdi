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
      const { data: templates, error: templatesError } = await supabase
        .from('achievement_templates')
        .select('*');

      if (templatesError) throw templatesError;

      const { data: userAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', profileId);

      if (achievementsError) throw achievementsError;

      // Get user stats for progress calculation
      let stats;
      try {
        stats = await this.getUserStats(profileId);
      } catch (error: any) {
        // Handle infinite recursion or other policy errors
        if (error?.message?.includes('infinite recursion')) {
          console.warn('Policy recursion detected, using fallback stats');
          stats = {
            completedPDIs: 0,
            completedTasks: 0,
            completedCourses: 0,
            competenciesRated: 0,
            mentorshipSessions: 0,
            careerProgressions: 0
          };
        } else {
          throw error;
        }
      }

      return templates.map(template => {
        const userAchievement = userAchievements.find(a => a.template_id === template.id);
        const isUnlocked = !!userAchievement;
        
        let currentProgress = 0;
        let maxProgress = 1;
        let requirements: string[] = [];

        const condition = template.trigger_condition;

        switch (template.trigger_type) {
          case 'pdi_completed':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.completedPDIs, maxProgress);
            requirements = [`Completar ${maxProgress} PDI${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'task_completed':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.completedTasks, maxProgress);
            requirements = [`Completar ${maxProgress} tarefa${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'course_completed':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.completedCourses, maxProgress);
            requirements = [`Completar ${maxProgress} curso${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'competency_rated':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.competenciesRated, maxProgress);
            requirements = [`Avaliar ${maxProgress} competência${maxProgress > 1 ? 's' : ''}`];
            break;
            
          case 'mentorship_session':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.mentorshipSessions, maxProgress);
            requirements = [`Participar de ${maxProgress} sessão${maxProgress > 1 ? 'ões' : ''} de mentoria`];
            break;
            
          case 'career_progression':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.careerProgressions, maxProgress);
            requirements = [`Progredir em ${maxProgress} trilha${maxProgress > 1 ? 's' : ''} de carreira`];
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
      });

    } catch (error) {
      console.error('🏆 Achievements: Error getting progress:', error);
      throw error;
    }
  },

  private async getUserStats(profileId: string) {
    try {
      // Get completed PDIs
      let completedPDIs = 0;
      try {
        const { data: pdis, error: pdisError } = await supabase
          .from('pdis')
          .select('status')
          .eq('profile_id', profileId);
        
        if (pdisError) throw pdisError;
        completedPDIs = pdis?.filter(p => p.status === 'completed').length || 0;
      } catch (error: any) {
        if (!error?.message?.includes('infinite recursion')) throw error;
      }

      // Get completed tasks
      let completedTasks = 0;
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('status')
          .eq('assignee_id', profileId);
        
        if (tasksError) throw tasksError;
        completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      } catch (error: any) {
        if (!error?.message?.includes('infinite recursion')) throw error;
      }

      // Get completed courses
      let completedCourses = 0;
      try {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('status')
          .eq('profile_id', profileId);
        
        if (enrollmentsError) throw enrollmentsError;
        completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0;
      } catch (error: any) {
        if (!error?.message?.includes('infinite recursion')) throw error;
      }

      // Get competencies with ratings
      let competenciesRated = 0;
      try {
        const { data: competencies, error: competenciesError } = await supabase
          .from('competencies')
          .select('self_rating, manager_rating')
          .eq('profile_id', profileId);
        
        if (competenciesError) throw competenciesError;
        competenciesRated = competencies?.filter(c => c.self_rating || c.manager_rating).length || 0;
      } catch (error: any) {
        if (!error?.message?.includes('infinite recursion')) throw error;
      }

      // Get mentorship sessions
      let mentorshipSessions = 0;
      try {
        const mentorshipIds = await this.getUserMentorshipIds(profileId);
        if (mentorshipIds.length > 0) {
          const { data: sessions, error: sessionsError } = await supabase
            .from('mentorship_sessions')
            .select('id')
            .in('mentorship_id', mentorshipIds);
          
          if (sessionsError) throw sessionsError;
          mentorshipSessions = sessions?.length || 0;
        }
      } catch (error: any) {
        if (!error?.message?.includes('infinite recursion')) throw error;
      }

      // Get career track progress
      let careerProgressions = 0;
      try {
        const { data: careerTracks, error: careerError } = await supabase
          .from('career_tracks')
          .select('progress')
          .eq('profile_id', profileId);
        
        if (careerError) throw careerError;
        careerProgressions = careerTracks?.filter(ct => ct.progress > 0).length || 0;
      } catch (error: any) {
        if (!error?.message?.includes('infinite recursion')) throw error;
      }

      return {
        completedPDIs,
        completedTasks,
        completedCourses,
        competenciesRated,
        mentorshipSessions,
        careerProgressions
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  private async getUserMentorshipIds(profileId: string): Promise<string[]> {
    try {
      const { data: mentorships, error } = await supabase
        .from('mentorships')
        .select('id')
        .or(`mentor_id.eq.${profileId},mentee_id.eq.${profileId}`);

      if (error) throw error;
      return mentorships?.map(m => m.id) || [];
    } catch (error) {
      console.error('Error getting mentorship IDs:', error);
      return [];
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