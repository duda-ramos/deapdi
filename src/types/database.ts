export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'hr' | 'manager' | 'employee'
          team_id: string | null
          manager_id: string | null
          level: string
          position: string
          points: number
          bio: string | null
          formation: string | null
          status: 'active' | 'inactive'
          personality_test_results: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          role?: 'admin' | 'hr' | 'manager' | 'employee'
          team_id?: string | null
          manager_id?: string | null
          level: string
          position: string
          points?: number
          bio?: string | null
          formation?: string | null
          status?: 'active' | 'inactive'
          personality_test_results?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'admin' | 'hr' | 'manager' | 'employee'
          team_id?: string | null
          manager_id?: string | null
          level?: string
          position?: string
          points?: number
          bio?: string | null
          formation?: string | null
          status?: 'active' | 'inactive'
          personality_test_results?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      career_tracks: {
        Row: {
          id: string
          profession: string
          current_stage: string
          progress: number
          next_stage: string | null
          track_type: 'development' | 'specialization'
          profile_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profession: string
          current_stage: string
          progress?: number
          next_stage?: string | null
          track_type: 'development' | 'specialization'
          profile_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profession?: string
          current_stage?: string
          progress?: number
          next_stage?: string | null
          track_type?: 'development' | 'specialization'
          profile_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      salary_history: {
        Row: {
          id: string
          profile_id: string
          amount: number
          position: string
          reason: string
          effective_date: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          amount: number
          position: string
          reason: string
          effective_date: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          amount?: number
          position?: string
          reason?: string
          effective_date?: string
          created_at?: string
        }
      }
      competencies: {
        Row: {
          id: string
          name: string
          type: 'hard' | 'soft'
          stage: string
          self_rating: number | null
          manager_rating: number | null
          target_level: number
          profile_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'hard' | 'soft'
          stage: string
          self_rating?: number | null
          manager_rating?: number | null
          target_level: number
          profile_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'hard' | 'soft'
          stage?: string
          self_rating?: number | null
          manager_rating?: number | null
          target_level?: number
          profile_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      pdis: {
        Row: {
          id: string
          title: string
          description: string
          deadline: string
          status: 'pending' | 'in-progress' | 'completed' | 'validated'
          mentor_id: string | null
          points: number
          created_by: string
          validated_by: string | null
          profile_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          deadline: string
          status?: 'pending' | 'in-progress' | 'completed' | 'validated'
          mentor_id?: string | null
          points?: number
          created_by: string
          validated_by?: string | null
          profile_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          deadline?: string
          status?: 'pending' | 'in-progress' | 'completed' | 'validated'
          mentor_id?: string | null
          points?: number
          created_by?: string
          validated_by?: string | null
          profile_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          points: number
          unlocked_at: string | null
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon: string
          points: number
          unlocked_at?: string | null
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          points?: number
          unlocked_at?: string | null
          profile_id?: string
          created_at?: string
        }
      }
      action_groups: {
        Row: {
          id: string
          title: string
          description: string
          deadline: string
          status: 'active' | 'completed' | 'cancelled'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          deadline: string
          status?: 'active' | 'completed' | 'cancelled'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          deadline?: string
          status?: 'active' | 'completed' | 'cancelled'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      action_group_participants: {
        Row: {
          id: string
          group_id: string
          profile_id: string
          role: 'leader' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          profile_id: string
          role?: 'leader' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          profile_id?: string
          role?: 'leader' | 'member'
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          assignee_id: string
          group_id: string | null
          pdi_id: string | null
          deadline: string
          status: 'todo' | 'in-progress' | 'done'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assignee_id: string
          group_id?: string | null
          pdi_id?: string | null
          deadline: string
          status?: 'todo' | 'in-progress' | 'done'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assignee_id?: string
          group_id?: string | null
          pdi_id?: string | null
          deadline?: string
          status?: 'todo' | 'in-progress' | 'done'
          created_at?: string
          updated_at?: string
        }
      }
      psychological_records: {
        Row: {
          id: string
          profile_id: string
          record_type: 'session' | 'test' | 'evaluation' | 'note'
          title: string
          content: string
          confidential: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          record_type: 'session' | 'test' | 'evaluation' | 'note'
          title: string
          content: string
          confidential?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          record_type?: 'session' | 'test' | 'evaluation' | 'note'
          title?: string
          content?: string
          confidential?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          profile_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}