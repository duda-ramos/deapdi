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
  trigger_type: 'pdi_completed' | 'task_completed' | 'course_completed' | 'competency_rated' | 'career_progression' | 'mentorship_session' | 'action_group_task' | 'wellness_checkin';
  trigger_condition: {
    count: number;
  };
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

export interface UserStats {
  completedPDIs: number;
  completedTasks: number;
  completedCourses: number;
  competenciesRated: number;
  mentorshipSessions: number;
  careerProgressions: number;
  actionGroupTasks: number;
  wellnessCheckins: number;
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

    try {
      return await supabaseRequest(() => supabase
        .from('achievements')
        .select(`
          *,
          template:achievement_templates(*)
        `)
        .eq('profile_id', profileId)
        .order('unlocked_at', { ascending: false }), 'getUserAchievements');
    } catch (error) {
      console.warn('🏆 Achievements: Error getting user achievements, returning empty array:', error);
      return [];
    }
  },

  async getUserAchievementsWithTemplate(profileId: string) {
    console.log('🏆 Achievements: Getting user achievements with template for:', profileId);

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
      let stats: UserStats;
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
            careerProgressions: 0,
            actionGroupTasks: 0,
            wellnessCheckins: 0
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
            requirements = [`Progredir ${condition.count}% na trilha de carreira`];
            break;

          case 'action_group_task':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.actionGroupTasks, maxProgress);
            requirements = [`Completar ${maxProgress} tarefa${maxProgress > 1 ? 's' : ''} em grupos de ação`];
            break;

          case 'wellness_checkin':
            maxProgress = condition.count || 1;
            currentProgress = Math.min(stats.wellnessCheckins, maxProgress);
            requirements = [`Fazer ${maxProgress} check-in${maxProgress > 1 ? 's' : ''} emocional${maxProgress > 1 ? 'is' : ''}`];
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

  async getUserStats(profileId: string): Promise<UserStats> {
    console.log('🏆 Achievements: Getting user stats for profile:', profileId);

    // Check if Supabase is available
    if (!supabase) {
      console.warn('🏆 Achievements: Supabase not available, returning default stats');
      return {
        completedPDIs: 0,
        completedTasks: 0,
        completedCourses: 0,
        competenciesRated: 0,
        mentorshipSessions: 0,
        careerProgressions: 0,
        actionGroupTasks: 0,
        wellnessCheckins: 0
      };
    }

    // Use a single RPC call to avoid RLS policy recursion
    try {
      const { data, error } = await supabase.rpc('get_user_achievement_stats', {
        p_profile_id: profileId
      });

      if (error) {
        console.warn('🏆 Achievements: RPC function not available, using fallback method:', error.message);
        return await this.getUserStatsFallback(profileId);
      }

      return data || {
        completedPDIs: 0,
        completedTasks: 0,
        completedCourses: 0,
        competenciesRated: 0,
        mentorshipSessions: 0,
        careerProgressions: 0,
        actionGroupTasks: 0,
        wellnessCheckins: 0
      };
    } catch (error) {
      console.warn('🏆 Achievements: Error calling RPC, using fallback method:', error);
      return await this.getUserStatsFallback(profileId);
    }
  },

  async getUserStatsFallback(profileId: string): Promise<UserStats> {
    console.log('🏆 Achievements: Using fallback method for user stats');

    // Initialize all stats to 0
    let completedPDIs = 0;
    let completedTasks = 0;
    let completedCourses = 0;
    let competenciesRated = 0;
    let mentorshipSessions = 0;
    let careerProgressions = 0;
    let actionGroupTasks = 0;
    let wellnessCheckins = 0;

    // Get completed PDIs with minimal query
    try {
      const { data: pdis, error } = await supabase
        .from('pdis')
        .select('status')
        .eq('profile_id', profileId)
        .in('status', ['completed', 'validated']);

      if (!error && pdis) {
        completedPDIs = pdis.length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch PDI stats:', error);
    }

    // Get completed tasks with minimal query
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('assignee_id', profileId)
        .eq('status', 'done');

      if (!error && tasks) {
        completedTasks = tasks.length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch task stats:', error);
    }

    // Get completed courses with minimal query
    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('status')
        .eq('profile_id', profileId)
        .eq('status', 'completed');

      if (!error && enrollments) {
        completedCourses = enrollments.length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch course stats:', error);
    }

    // Get competencies with ratings with minimal query
    try {
      const { data: competencies, error } = await supabase
        .from('competencies')
        .select('self_rating, manager_rating')
        .eq('profile_id', profileId);

      if (!error && competencies) {
        competenciesRated = competencies.filter(c => c.self_rating || c.manager_rating).length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch competency stats:', error);
    }

    // Skip mentorship sessions to avoid complex joins that might cause recursion
    // This can be implemented later with a simpler approach if needed
    mentorshipSessions = 0;

    // Get career track progress with minimal query
    try {
      const { data: careerTracks, error } = await supabase
        .from('career_tracks')
        .select('progress')
        .eq('profile_id', profileId);

      if (!error && careerTracks) {
        careerProgressions = careerTracks.filter(ct => ct.progress > 0).length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch career track stats:', error);
    }

    // Get action group tasks
    try {
      const { data: groupTasks, error } = await supabase
        .from('tasks')
        .select('id, group_id')
        .eq('assignee_id', profileId)
        .eq('status', 'done')
        .not('group_id', 'is', null);

      if (!error && groupTasks) {
        actionGroupTasks = groupTasks.length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch action group task stats:', error);
    }

    // Get wellness check-ins
    try {
      const { data: checkins, error } = await supabase
        .from('emotional_checkins')
        .select('id')
        .eq('profile_id', profileId);

      if (!error && checkins) {
        wellnessCheckins = checkins.length;
      }
    } catch (error) {
      console.warn('🏆 Achievements: Could not fetch wellness checkin stats:', error);
    }

    return {
      completedPDIs,
      completedTasks,
      completedCourses,
      competenciesRated,
      mentorshipSessions,
      careerProgressions,
      actionGroupTasks,
      wellnessCheckins
    };
  },

  async getUserMentorshipIds(profileId: string): Promise<string[]> {
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

      if (error) throw error;

      console.log('🏆 Achievements: Manual check completed:', data);
      return data;
    } catch (error) {
      console.error('🏆 Achievements: Error during manual check:', error);
      throw error;
    }
  },

  // Trigger achievement check for specific action
  async triggerAchievementCheck(profileId: string, triggerType: string) {
    console.log('🏆 Achievements: Triggering check for:', { profileId, triggerType });

    try {
      const { error } = await supabase.rpc('check_and_unlock_achievements', {
        p_profile_id: profileId,
        p_trigger_type: triggerType
      });

      if (error) throw error;

      console.log('🏆 Achievements: Trigger check completed');
    } catch (error) {
      console.error('🏆 Achievements: Error during trigger check:', error);
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
    console.log('�� Achievements: Updating template:', id);
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