import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface CareerTrackTemplate {
  id: string;
  name: string;
  description: string;
  profession: string;
  track_type: 'development' | 'specialization';
  stages: CareerStage[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CareerStage {
  name: string;
  level: number;
  description: string;
}

export interface StageCompetency {
  id: string;
  template_id: string;
  stage_name: string;
  competency_name: string;
  required_level: number;
  weight: number;
}

export interface StageSalaryRange {
  id: string;
  template_id: string;
  stage_name: string;
  min_salary: number;
  max_salary: number;
  currency: string;
}

export interface ProgressBreakdown {
  competencyProgress: number;
  pdiProgress: number;
  totalProgress: number;
  canAdvance: boolean;
  nextStage?: string;
  competencyDetails: CompetencyDetail[];
  pdiDetails: PDIDetail[];
}

export interface CompetencyDetail {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  weight: number;
  achieved: boolean;
}

export interface PDIDetail {
  total: number;
  completed: number;
  percentage: number;
}

export const careerTrackService = {
  // Templates (RH Management)
  async getTemplates() {
    return supabaseRequest(() => supabase
      .from('career_track_templates')
      .select('*')
      .order('created_at', { ascending: false }), 'getTemplates');
  },

  async createTemplate(template: Omit<CareerTrackTemplate, 'id' | 'created_at' | 'updated_at'>) {
    return supabaseRequest(() => supabase
      .from('career_track_templates')
      .insert(template)
      .select()
      .single(), 'createTemplate');
  },

  async updateTemplate(id: string, updates: Partial<CareerTrackTemplate>) {
    return supabaseRequest(() => supabase
      .from('career_track_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateTemplate');
  },

  async deleteTemplate(id: string) {
    return supabaseRequest(() => supabase
      .from('career_track_templates')
      .delete()
      .eq('id', id), 'deleteTemplate');
  },

  // Stage Competencies
  async getStageCompetencies(templateId: string) {
    return supabaseRequest(() => supabase
      .from('career_stage_competencies')
      .select('*')
      .eq('template_id', templateId)
      .order('stage_name, competency_name'), 'getStageCompetencies');
  },

  async addStageCompetency(competency: Omit<StageCompetency, 'id' | 'created_at'>) {
    return supabaseRequest(() => supabase
      .from('career_stage_competencies')
      .insert(competency)
      .select()
      .single(), 'addStageCompetency');
  },

  async updateStageCompetency(id: string, updates: Partial<StageCompetency>) {
    return supabaseRequest(() => supabase
      .from('career_stage_competencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateStageCompetency');
  },

  async removeStageCompetency(id: string) {
    return supabaseRequest(() => supabase
      .from('career_stage_competencies')
      .delete()
      .eq('id', id), 'removeStageCompetency');
  },

  // Salary Ranges
  async getSalaryRanges(templateId: string) {
    return supabaseRequest(() => supabase
      .from('career_stage_salary_ranges')
      .select('*')
      .eq('template_id', templateId)
      .order('stage_name'), 'getSalaryRanges');
  },

  async setSalaryRange(range: Omit<StageSalaryRange, 'id' | 'created_at'>) {
    return supabaseRequest(() => supabase
      .from('career_stage_salary_ranges')
      .upsert(range)
      .select()
      .single(), 'setSalaryRange');
  },

  // Progress Calculation
  async calculateProgress(profileId: string): Promise<ProgressBreakdown> {
    console.log('🎯 CareerTrack: Calculating detailed progress for profile:', profileId);

    try {
      // Get current career track
      const { data: track } = await supabase
        .from('career_tracks')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (!track) {
        throw new Error('Career track not found');
      }

      // Get stage competencies
      const { data: stageCompetencies } = await supabase
        .from('career_stage_competencies')
        .select('*')
        .eq('stage_name', track.current_stage);

      // Get user competencies
      const { data: userCompetencies } = await supabase
        .from('competencies')
        .select('*')
        .eq('profile_id', profileId);

      // Get PDI data
      const { data: pdis } = await supabase
        .from('pdis')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate competency progress
      let totalWeight = 0;
      let achievedWeight = 0;
      const competencyDetails: CompetencyDetail[] = [];

      if (stageCompetencies) {
        for (const stageComp of stageCompetencies) {
          const userComp = userCompetencies?.find(uc => uc.name === stageComp.competency_name);
          const currentLevel = Math.max(userComp?.self_rating || 0, userComp?.manager_rating || 0);
          const achieved = currentLevel >= stageComp.required_level;

          totalWeight += stageComp.weight;
          if (achieved) {
            achievedWeight += stageComp.weight;
          } else {
            achievedWeight += (stageComp.weight * (currentLevel / stageComp.required_level));
          }

          competencyDetails.push({
            name: stageComp.competency_name,
            currentLevel,
            requiredLevel: stageComp.required_level,
            weight: stageComp.weight,
            achieved
          });
        }
      }

      const competencyProgress = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;

      // Calculate PDI progress
      const totalPDIs = pdis?.length || 0;
      const completedPDIs = pdis?.filter(p => p.status === 'completed' || p.status === 'validated').length || 0;
      const pdiProgress = totalPDIs > 0 ? (completedPDIs / totalPDIs) * 100 : 0;

      // Total progress (weighted formula)
      const totalProgress = (competencyProgress * 0.7) + (pdiProgress * 0.3);
      const canAdvance = totalProgress >= 80 && track.next_stage;

      const pdiDetails: PDIDetail = {
        total: totalPDIs,
        completed: completedPDIs,
        percentage: pdiProgress
      };

      console.log('🎯 CareerTrack: Progress calculated:', {
        competencyProgress: competencyProgress.toFixed(1),
        pdiProgress: pdiProgress.toFixed(1),
        totalProgress: totalProgress.toFixed(1),
        canAdvance
      });

      return {
        competencyProgress,
        pdiProgress,
        totalProgress,
        canAdvance,
        nextStage: track.next_stage,
        competencyDetails,
        pdiDetails
      };

    } catch (error) {
      console.error('🎯 CareerTrack: Error calculating progress:', error);
      throw error;
    }
  },

  // Manual progress update
  async updateProgress(profileId: string) {
    console.log('🎯 CareerTrack: Manually updating progress for profile:', profileId);

    try {
      const { error } = await supabase.rpc('update_career_progress', {
        p_profile_id: profileId
      });

      if (error) {
        console.error('🎯 CareerTrack: Error updating progress:', error);
        throw error;
      }

      console.log('🎯 CareerTrack: Progress updated successfully');
    } catch (error) {
      console.error('🎯 CareerTrack: Critical error updating progress:', error);
      throw error;
    }
  },

  // Get progression requirements for current stage
  async getProgressionRequirements(profileId: string) {
    try {
      const { data: track } = await supabase
        .from('career_tracks')
        .select('current_stage, template_id')
        .eq('profile_id', profileId)
        .single();

      if (!track) return null;

      const { data: requirements } = await supabase
        .from('career_stage_competencies')
        .select('*')
        .eq('template_id', track.template_id)
        .eq('stage_name', track.current_stage);

      return requirements;
    } catch (error) {
      console.error('Error getting progression requirements:', error);
      return null;
    }
  }
};