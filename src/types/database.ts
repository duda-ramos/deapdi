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
          is_onboarded: boolean
          onboarding_progress: Json | null
          onboarding_completed_at: string | null
          birth_date: string | null
          phone: string | null
          location: string | null
          admission_date: string | null
          area: string | null
          certifications: string[]
          hard_skills: string[]
          soft_skills: string[]
          languages: Json | null
          emergency_contact: string | null
          mental_health_consent: boolean
          preferred_session_type: string | null
          career_objectives: string | null
          development_interests: string[]
          mentorship_availability: boolean
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
          is_onboarded?: boolean
          onboarding_progress?: Json | null
          onboarding_completed_at?: string | null
          birth_date?: string | null
          phone?: string | null
          location?: string | null
          admission_date?: string | null
          area?: string | null
          certifications?: string[]
          hard_skills?: string[]
          soft_skills?: string[]
          languages?: Json | null
          emergency_contact?: string | null
          mental_health_consent?: boolean
          preferred_session_type?: string | null
          career_objectives?: string | null
          development_interests?: string[]
          mentorship_availability?: boolean
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
          is_onboarded?: boolean
          onboarding_progress?: Json | null
          onboarding_completed_at?: string | null
          birth_date?: string | null
          phone?: string | null
          location?: string | null
          admission_date?: string | null
          area?: string | null
          certifications?: string[]
          hard_skills?: string[]
          soft_skills?: string[]
          languages?: Json | null
          emergency_contact?: string | null
          mental_health_consent?: boolean
          preferred_session_type?: string | null
          career_objectives?: string | null
          development_interests?: string[]
          mentorship_availability?: boolean
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
          category: string | null
          related_id: string | null
          metadata: Json | null
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
          category?: string | null
          related_id?: string | null
          metadata?: Json | null
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
          category?: string | null
          related_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          profile_id: string
          pdi_approved: boolean
          pdi_rejected: boolean
          task_assigned: boolean
          achievement_unlocked: boolean
          mentorship_scheduled: boolean
          mentorship_cancelled: boolean
          group_invitation: boolean
          deadline_reminder: boolean
          email_notifications: boolean
          push_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          pdi_approved?: boolean
          pdi_rejected?: boolean
          task_assigned?: boolean
          achievement_unlocked?: boolean
          mentorship_scheduled?: boolean
          mentorship_cancelled?: boolean
          group_invitation?: boolean
          deadline_reminder?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          pdi_approved?: boolean
          pdi_rejected?: boolean
          task_assigned?: boolean
          achievement_unlocked?: boolean
          mentorship_scheduled?: boolean
          mentorship_cancelled?: boolean
          group_invitation?: boolean
          deadline_reminder?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      psychology_sessions: {
        Row: {
          id: string
          employee_id: string
          psychologist_id: string
          scheduled_date: string
          status: 'solicitada' | 'agendada' | 'realizada' | 'cancelada' | 'faltou'
          session_notes: string | null
          summary_for_employee: string | null
          duration_minutes: number
          session_type: 'presencial' | 'online' | 'emergencial' | 'follow_up'
          urgency: 'normal' | 'prioritaria' | 'emergencial'
          location: string | null
          meeting_link: string | null
          employee_feedback: string | null
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          psychologist_id: string
          scheduled_date: string
          status?: 'solicitada' | 'agendada' | 'realizada' | 'cancelada' | 'faltou'
          session_notes?: string | null
          summary_for_employee?: string | null
          duration_minutes?: number
          session_type?: 'presencial' | 'online' | 'emergencial' | 'follow_up'
          urgency?: 'normal' | 'prioritaria' | 'emergencial'
          location?: string | null
          meeting_link?: string | null
          employee_feedback?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          psychologist_id?: string
          scheduled_date?: string
          status?: 'solicitada' | 'agendada' | 'realizada' | 'cancelada' | 'faltou'
          session_notes?: string | null
          summary_for_employee?: string | null
          duration_minutes?: number
          session_type?: 'presencial' | 'online' | 'emergencial' | 'follow_up'
          urgency?: 'normal' | 'prioritaria' | 'emergencial'
          location?: string | null
          meeting_link?: string | null
          employee_feedback?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      therapeutic_activities: {
        Row: {
          id: string
          session_id: string
          employee_id: string
          title: string
          description: string
          instructions: string | null
          due_date: string
          status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
          employee_feedback: string | null
          psychologist_notes: string | null
          completion_evidence: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          employee_id: string
          title: string
          description: string
          instructions?: string | null
          due_date: string
          status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
          employee_feedback?: string | null
          psychologist_notes?: string | null
          completion_evidence?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          employee_id?: string
          title?: string
          description?: string
          instructions?: string | null
          due_date?: string
          status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
          employee_feedback?: string | null
          psychologist_notes?: string | null
          completion_evidence?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      consent_records: {
        Row: {
          id: string
          employee_id: string
          consent_type: string
          granted: boolean
          consent_text: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          consent_type: string
          granted: boolean
          consent_text: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          consent_type?: string
          granted?: boolean
          consent_text?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      emotional_checkins: {
        Row: {
          id: string
          employee_id: string
          mood_score: number
          energy_level: number
          stress_level: number
          sleep_quality: number
          notes: string | null
          tags: string[]
          checkin_date: string
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          mood_score: number
          energy_level: number
          stress_level: number
          sleep_quality: number
          notes?: string | null
          tags?: string[]
          checkin_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          mood_score?: number
          energy_level?: number
          stress_level?: number
          sleep_quality?: number
          notes?: string | null
          tags?: string[]
          checkin_date?: string
          created_at?: string
        }
      }
      therapeutic_activities: {
        Row: {
          id: string
          session_id: string
          employee_id: string
          title: string
          description: string
          instructions: string | null
          due_date: string
          status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
          employee_feedback: string | null
          psychologist_notes: string | null
          completion_evidence: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          employee_id: string
          title: string
          description: string
          instructions?: string | null
          due_date: string
          status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
          employee_feedback?: string | null
          psychologist_notes?: string | null
          completion_evidence?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          employee_id?: string
          title?: string
          description?: string
          instructions?: string | null
          due_date?: string
          status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
          employee_feedback?: string | null
          psychologist_notes?: string | null
          completion_evidence?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      session_requests: {
        Row: {
          id: string
          employee_id: string
          urgency: 'normal' | 'prioritaria' | 'emergencial'
          preferred_type: 'presencial' | 'online' | 'emergencial' | 'follow_up'
          reason: string
          preferred_times: string[]
          status: 'pendente' | 'aceita' | 'agendada' | 'rejeitada'
          assigned_psychologist: string | null
          response_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          urgency?: 'normal' | 'prioritaria' | 'emergencial'
          preferred_type?: 'presencial' | 'online' | 'emergencial' | 'follow_up'
          reason: string
          preferred_times?: string[]
          status?: 'pendente' | 'aceita' | 'agendada' | 'rejeitada'
          assigned_psychologist?: string | null
          response_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          urgency?: 'normal' | 'prioritaria' | 'emergencial'
          preferred_type?: 'presencial' | 'online' | 'emergencial' | 'follow_up'
          reason?: string
          preferred_times?: string[]
          status?: 'pendente' | 'aceita' | 'agendada' | 'rejeitada'
          assigned_psychologist?: string | null
          response_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wellness_resources: {
        Row: {
          id: string
          title: string
          description: string
          resource_type: 'article' | 'video' | 'audio' | 'pdf' | 'link'
          category: string
          content_url: string | null
          content_text: string | null
          thumbnail_url: string | null
          tags: string[]
          target_audience: string[]
          active: boolean
          view_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          resource_type?: 'article' | 'video' | 'audio' | 'pdf' | 'link'
          category?: string
          content_url?: string | null
          content_text?: string | null
          thumbnail_url?: string | null
          tags?: string[]
          target_audience?: string[]
          active?: boolean
          view_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          resource_type?: 'article' | 'video' | 'audio' | 'pdf' | 'link'
          category?: string
          content_url?: string | null
          content_text?: string | null
          thumbnail_url?: string | null
          tags?: string[]
          target_audience?: string[]
          active?: boolean
          view_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
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