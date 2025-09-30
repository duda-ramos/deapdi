import { supabase } from '../lib/supabase';
import { Profile, PDI, Competency, Achievement } from '../types';

interface ReportData {
  profiles: Profile[];
  pdis: PDI[];
  competencies: Competency[];
  achievements: Achievement[];
}

export interface PerformanceReport {
  profileId: string;
  name: string;
  position: string;
  level: string;
  points: number;
  completedPDIs: number;
  averageCompetencyRating: number;
  achievementsCount: number;
  engagementScore: number;
}

export interface TeamReport {
  teamId: string;
  teamName: string;
  memberCount: number;
  averagePoints: number;
  completedPDIs: number;
  averageCompetencyRating: number;
  topPerformers: Profile[];
}

export const reportService = {
  async generatePerformanceReport(profileId?: string): Promise<PerformanceReport[]> {
    console.log('📊 Reports: Generating performance report for profile:', profileId);
    
    try {
      // Get profiles data
      let profilesQuery = supabase
        .from('profiles')
        .select(`
          *,
          pdis!pdis_profile_id_fkey(id, status),
          competencies!competencies_profile_id_fkey(self_rating, manager_rating),
          achievements!achievements_profile_id_fkey(id)
        `);

      if (profileId) {
        profilesQuery = profilesQuery.eq('id', profileId);
      }

      const { data: profiles, error } = await profilesQuery;
      if (error) {
        console.error('📊 Reports: Error fetching profiles for performance report:', error);
        throw error;
      }

      console.log('📊 Reports: Profiles fetched:', profiles?.length);

      return profiles?.map(profile => ({
        profileId: profile.id,
        name: profile.name,
        position: profile.position,
        level: profile.level,
        points: profile.points,
        completedPDIs: profile.pdis?.filter((pdi: any) => 
          pdi.status === 'completed' || pdi.status === 'validated'
        ).length || 0,
        averageCompetencyRating: this.calculateAverageRating(profile.competencies || []),
        achievementsCount: profile.achievements?.length || 0,
        engagementScore: this.calculateEngagementScore(profile)
      })) || [];
    } catch (error) {
      console.error('📊 Reports: Critical error generating performance report:', error);
      throw error;
    }
  },

  async generateTeamReport(): Promise<TeamReport[]> {
    console.log('📊 Reports: Generating team report');
    
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          members:profiles!profiles_team_id_fkey(
            id,
            name,
            points,
            pdis!pdis_profile_id_fkey(status),
            competencies!competencies_profile_id_fkey(self_rating, manager_rating)
          )
        `);

      if (error) {
        console.error('📊 Reports: Error fetching teams for team report:', error);
        throw error;
      }

      console.log('📊 Reports: Teams fetched:', teams?.length);

      return teams?.map(team => ({
        teamId: team.id,
        teamName: team.name,
        memberCount: team.members?.length || 0,
        averagePoints: this.calculateAveragePoints(team.members || []),
        completedPDIs: this.calculateCompletedPDIs(team.members || []),
        averageCompetencyRating: this.calculateTeamAverageRating(team.members || []),
        topPerformers: this.getTopPerformers(team.members || [], 3)
      })) || [];
    } catch (error) {
      console.error('📊 Reports: Critical error generating team report:', error);
      throw error;
    }
  },

  async generateCompetencyGapReport() {
    console.log('📊 Reports: Generating competency gap report');
    
    try {
      const { data: competencies, error } = await supabase
        .from('competencies')
        .select(`
          *,
          profile:profiles!competencies_profile_id_fkey(name, position, level)
        `);

      if (error) {
        console.error('📊 Reports: Error fetching competencies for gap report:', error);
        throw error;
      }

      console.log('📊 Reports: Competencies fetched:', competencies?.length);

      const gaps = competencies?.map(comp => ({
        competencyName: comp.name,
        type: comp.type,
        stage: comp.stage,
        profileName: comp.profile?.name,
        position: comp.profile?.position,
        currentLevel: Math.max(comp.self_rating || 0, comp.manager_rating || 0),
        targetLevel: comp.target_level,
        gap: comp.target_level - Math.max(comp.self_rating || 0, comp.manager_rating || 0)
      })).filter(gap => gap.gap > 0) || [];

      console.log('📊 Reports: Competency gaps calculated:', gaps.length);
      return gaps.sort((a, b) => b.gap - a.gap);
    } catch (error) {
      console.error('📊 Reports: Critical error generating competency gap report:', error);
      throw error;
    }
  },

  async exportToCSV(data: any[], filename: string) {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Helper methods
  calculateAverageRating(competencies: any[]): number {
    if (!competencies.length) return 0;
    
    const ratings = competencies.map(comp => 
      Math.max(comp.self_rating || 0, comp.manager_rating || 0)
    );
    
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  },

  calculateAveragePoints(members: any[]): number {
    if (!members.length) return 0;
    return members.reduce((sum, member) => sum + (member.points || 0), 0) / members.length;
  },

  calculateCompletedPDIs(members: any[]): number {
    return members.reduce((total, member) => {
      const completed = member.pdis?.filter((pdi: any) => 
        pdi.status === 'completed' || pdi.status === 'validated'
      ).length || 0;
      return total + completed;
    }, 0);
  },

  calculateTeamAverageRating(members: any[]): number {
    if (!members.length) return 0;
    
    const averages = members.map(member => 
      this.calculateAverageRating(member.competencies || [])
    );
    
    return averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
  },

  getTopPerformers(members: any[], count: number): any[] {
    return members
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, count);
  },

  calculateEngagementScore(profile: any): number {
    // Simple engagement calculation based on activity
    const pdiScore = (profile.pdis?.length || 0) * 10;
    const competencyScore = (profile.competencies?.length || 0) * 5;
    const achievementScore = (profile.achievements?.length || 0) * 15;
    
    return Math.min(100, pdiScore + competencyScore + achievementScore);
  }
};