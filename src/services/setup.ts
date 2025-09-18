import { supabase } from '../lib/supabase';

export interface SetupStatus {
  hasUsers: boolean;
  userCount: number;
  hasTeams: boolean;
  teamCount: number;
}

export const setupService = {
  async checkInitialSetup(): Promise<SetupStatus> {
    try {
      // Check if there are any profiles
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) {
        console.error('Error checking users:', userError);
      }

      // Check if there are any teams
      const { count: teamCount, error: teamError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      if (teamError) {
        console.error('Error checking teams:', teamError);
      }

      return {
        hasUsers: (userCount || 0) > 0,
        userCount: userCount || 0,
        hasTeams: (teamCount || 0) > 0,
        teamCount: teamCount || 0
      };
    } catch (error) {
      console.error('Setup check error:', error);
      return {
        hasUsers: false,
        userCount: 0,
        hasTeams: false,
        teamCount: 0
      };
    }
  },

  async getTestCredentials() {
    return [
      { email: 'admin@empresa.com', password: 'admin123', role: 'Administrador' },
      { email: 'gestor@empresa.com', password: 'gestor123', role: 'Gestor' },
      { email: 'colaborador@empresa.com', password: 'colab123', role: 'Colaborador' },
      { email: 'rh@empresa.com', password: 'rh123456', role: 'RH' }
    ];
  }
};