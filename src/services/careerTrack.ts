import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface CareerTrackTemplate {
  id: string;
  name: string;
  description: string;
  profession: string;
  target_role?: string;
  area?: string;
  track_type: 'development' | 'specialization';
  stages: CareerStage[];
  is_active?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CareerStage {
  name: string;
  level: number;
  description: string;
  order?: number;
}

export interface StageCompetency {
  id: string;
  template_id: string;
  stage_name: string;
  competency_name: string;
  required_level: number;
  weight: number;
  created_at?: string;
}

export interface StageSalaryRange {
  id: string;
  template_id: string;
  stage_name: string;
  min_salary: number;
  max_salary: number;
  currency: string;
  created_at?: string;
}

export interface CareerTrackStats {
  totalTracks: number;
  activeTracks: number;
  totalStages: number;
  totalCompetencies: number;
  usersInTracks: number;
}

export interface CareerTrackDependencies {
  usersCount: number;
  pdisCount: number;
  hasActiveDependencies: boolean;
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

  async getTemplateById(id: string) {
    return supabaseRequest(() => supabase
      .from('career_track_templates')
      .select('*')
      .eq('id', id)
      .single(), 'getTemplateById');
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
    // First delete related competencies and salary ranges
    if (supabase) {
      await supabase.from('career_stage_competencies').delete().eq('template_id', id);
      await supabase.from('career_stage_salary_ranges').delete().eq('template_id', id);
    }
    return supabaseRequest(() => supabase
      .from('career_track_templates')
      .delete()
      .eq('id', id), 'deleteTemplate');
  },

  async duplicateTemplate(id: string, newName: string, userId: string) {
    // Get the original template
    const original = await this.getTemplateById(id);
    if (!original) throw new Error('Template not found');

    // Create a copy
    const duplicate = await this.createTemplate({
      name: newName,
      description: original.description,
      profession: original.profession,
      target_role: original.target_role,
      area: original.area,
      track_type: original.track_type,
      stages: original.stages,
      is_active: false, // Start as inactive
      created_by: userId
    });

    // Copy competencies
    const competencies = await this.getStageCompetencies(id);
    if (competencies && competencies.length > 0) {
      for (const comp of competencies) {
        await this.addStageCompetency({
          template_id: duplicate.id,
          stage_name: comp.stage_name,
          competency_name: comp.competency_name,
          required_level: comp.required_level,
          weight: comp.weight
        });
      }
    }

    // Copy salary ranges
    const salaries = await this.getSalaryRanges(id);
    if (salaries && salaries.length > 0) {
      for (const salary of salaries) {
        await this.setSalaryRange({
          template_id: duplicate.id,
          stage_name: salary.stage_name,
          min_salary: salary.min_salary,
          max_salary: salary.max_salary,
          currency: salary.currency
        });
      }
    }

    return duplicate;
  },

  async checkDependencies(templateId: string): Promise<CareerTrackDependencies> {
    let usersCount = 0;
    let pdisCount = 0;

    if (supabase) {
      // Check users using this template
      const { count: users } = await supabase
        .from('career_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);
      usersCount = users || 0;

      // Check PDIs that might be related (approximate)
      if (usersCount > 0) {
        const { data: tracks } = await supabase
          .from('career_tracks')
          .select('profile_id')
          .eq('template_id', templateId);
        
        if (tracks && tracks.length > 0) {
          const profileIds = tracks.map(t => t.profile_id);
          const { count: pdis } = await supabase
            .from('pdis')
            .select('*', { count: 'exact', head: true })
            .in('profile_id', profileIds);
          pdisCount = pdis || 0;
        }
      }
    }

    return {
      usersCount,
      pdisCount,
      hasActiveDependencies: usersCount > 0
    };
  },

  async getStats(): Promise<CareerTrackStats> {
    let totalTracks = 0;
    let activeTracks = 0;
    let totalStages = 0;
    let totalCompetencies = 0;
    let usersInTracks = 0;

    if (supabase) {
      // Get templates
      const { data: templates } = await supabase
        .from('career_track_templates')
        .select('*');
      
      if (templates) {
        totalTracks = templates.length;
        activeTracks = templates.filter(t => t.is_active !== false).length;
        totalStages = templates.reduce((acc, t) => acc + (t.stages?.length || 0), 0);
      }

      // Get competencies count
      const { count: compCount } = await supabase
        .from('career_stage_competencies')
        .select('*', { count: 'exact', head: true });
      totalCompetencies = compCount || 0;

      // Get users in tracks
      const { count: usersCount } = await supabase
        .from('career_tracks')
        .select('*', { count: 'exact', head: true });
      usersInTracks = usersCount || 0;
    }

    return {
      totalTracks,
      activeTracks,
      totalStages,
      totalCompetencies,
      usersInTracks
    };
  },

  async getUsersInTrack(templateId: string) {
    if (!supabase) return [];
    
    const { data } = await supabase
      .from('career_tracks')
      .select(`
        *,
        profile:profiles(id, name, position, email)
      `)
      .eq('template_id', templateId);
    
    return data || [];
  },

  // Stage Competencies
  async getStageCompetencies(templateId: string) {
    return supabaseRequest(() => supabase
      .from('career_stage_competencies')
      .select('*')
      .eq('template_id', templateId)
      .order('stage_name, competency_name'), 'getStageCompetencies');
  },

  async getCompetenciesByStage(templateId: string, stageName: string) {
    return supabaseRequest(() => supabase
      .from('career_stage_competencies')
      .select('*')
      .eq('template_id', templateId)
      .eq('stage_name', stageName)
      .order('competency_name'), 'getCompetenciesByStage');
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

  async bulkSaveStageCompetencies(
    templateId: string, 
    stageName: string, 
    competencies: Array<{ competency_name: string; required_level: number; weight: number }>
  ) {
    if (!supabase) return [];

    // Delete existing competencies for this stage
    await supabase
      .from('career_stage_competencies')
      .delete()
      .eq('template_id', templateId)
      .eq('stage_name', stageName);

    // Insert new competencies
    if (competencies.length > 0) {
      const toInsert = competencies.map(c => ({
        template_id: templateId,
        stage_name: stageName,
        ...c
      }));

      const { data, error } = await supabase
        .from('career_stage_competencies')
        .insert(toInsert)
        .select();

      if (error) throw error;
      return data;
    }

    return [];
  },

  // Salary Ranges
  async getSalaryRanges(templateId: string) {
    return supabaseRequest(() => supabase
      .from('career_stage_salary_ranges')
      .select('*')
      .eq('template_id', templateId)
      .order('stage_name'), 'getSalaryRanges');
  },

  async getSalaryRangeByStage(templateId: string, stageName: string) {
    if (!supabase) return null;
    
    const { data } = await supabase
      .from('career_stage_salary_ranges')
      .select('*')
      .eq('template_id', templateId)
      .eq('stage_name', stageName)
      .maybeSingle();
    
    return data;
  },

  async setSalaryRange(range: Omit<StageSalaryRange, 'id' | 'created_at'>) {
    return supabaseRequest(() => supabase
      .from('career_stage_salary_ranges')
      .upsert(range, { onConflict: 'template_id,stage_name' })
      .select()
      .single(), 'setSalaryRange');
  },

  async removeSalaryRange(templateId: string, stageName: string) {
    if (!supabase) return;
    
    await supabase
      .from('career_stage_salary_ranges')
      .delete()
      .eq('template_id', templateId)
      .eq('stage_name', stageName);
  },

  async bulkSaveSalaryRanges(
    templateId: string,
    ranges: Array<{ stage_name: string; min_salary: number; max_salary: number; currency: string }>
  ) {
    if (!supabase) return [];

    // Delete existing ranges for this template
    await supabase
      .from('career_stage_salary_ranges')
      .delete()
      .eq('template_id', templateId);

    // Insert new ranges
    if (ranges.length > 0) {
      const toInsert = ranges.map(r => ({
        template_id: templateId,
        ...r
      }));

      const { data, error } = await supabase
        .from('career_stage_salary_ranges')
        .insert(toInsert)
        .select();

      if (error) throw error;
      return data;
    }

    return [];
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

    return supabaseRequest(() => supabase.rpc('update_career_progress_with_advancement', {
      p_profile_id: profileId
    }), 'updateCareerProgress');
  },

  // Check for automatic career progression
  async checkProgression(profileId: string) {
    console.log('🎯 CareerTrack: Checking automatic progression for profile:', profileId);

    try {
      const result = await supabaseRequest(() => supabase.rpc('manual_career_progression_check', {
        p_profile_id: profileId
      }), 'checkCareerProgression');

      if (result.advancement_occurred) {
        console.log('🎯 CareerTrack: Career advancement occurred!', result);
        
        // Create additional notification for achievement system
        const { notificationService } = await import('./notifications');
        await notificationService.notifyCareerAdvancement(
          profileId,
          result.new_stage,
          500 // Points awarded for advancement
        );
      }

      return result;
    } catch (error) {
      console.error('🎯 CareerTrack: Error checking progression:', error);
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