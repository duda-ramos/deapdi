import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface PsychologySession {
  id: string;
  employee_id: string;
  psychologist_id: string;
  scheduled_date: string;
  status: 'solicitada' | 'agendada' | 'realizada' | 'cancelada' | 'faltou';
  session_notes?: string;
  summary_for_employee?: string;
  duration_minutes: number;
  session_type: 'presencial' | 'online' | 'emergencial' | 'follow_up';
  urgency: 'normal' | 'prioritaria' | 'emergencial';
  location?: string;
  meeting_link?: string;
  employee_feedback?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  employee?: any;
  psychologist?: any;
}

export interface TherapeuticActivity {
  id: string;
  session_id: string;
  employee_id: string;
  title: string;
  description: string;
  instructions?: string;
  due_date: string;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  employee_feedback?: string;
  psychologist_notes?: string;
  completion_evidence?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PsychologicalForm {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  form_type: string;
  scoring_rules: any;
  risk_thresholds: any;
  created_by: string;
  active: boolean;
  requires_followup: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple_choice' | 'text' | 'yes_no';
  options?: Array<{ value: number | string; label: string }>;
  required?: boolean;
}

export interface FormResponse {
  id: string;
  form_id: string;
  employee_id: string;
  responses: any;
  score: number;
  risk_level: 'baixo' | 'medio' | 'alto' | 'critico';
  reviewed_by?: string;
  psychologist_notes?: string;
  requires_attention: boolean;
  follow_up_scheduled: boolean;
  created_at: string;
  reviewed_at?: string;
  form?: PsychologicalForm;
}

export interface SessionRequest {
  id: string;
  employee_id: string;
  urgency: 'normal' | 'prioritaria' | 'emergencial';
  preferred_type: 'presencial' | 'online' | 'emergencial' | 'follow_up';
  reason: string;
  preferred_times: string[];
  status: 'pendente' | 'aceita' | 'agendada' | 'rejeitada';
  assigned_psychologist?: string;
  response_notes?: string;
  created_at: string;
  updated_at: string;
  employee?: any;
  psychologist?: any;
}

export interface EmotionalCheckin {
  id: string;
  employee_id: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  sleep_quality: number;
  notes?: string;
  tags: string[];
  checkin_date: string;
  created_at: string;
}

export interface MentalHealthAlert {
  id: string;
  employee_id: string;
  alert_type: string;
  severity: 'baixo' | 'medio' | 'alto' | 'critico';
  title: string;
  description: string;
  triggered_by?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  employee?: any;
}

export interface WellnessResource {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'audio' | 'exercise';
  content_url?: string;
  content_text?: string;
  category: string;
  target_audience: string[];
  created_by: string;
  active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface MentalHealthStats {
  total_employees_participating: number;
  average_mood_score: number;
  sessions_this_month: number;
  high_risk_responses: number;
  active_alerts: number;
  wellness_resources_accessed: number;
}

export const mentalHealthService = {
  // Sessions Management
  async getSessions(employeeId?: string, psychologistId?: string): Promise<PsychologySession[]> {
    console.log('🧠 MentalHealth: Getting sessions', { employeeId, psychologistId });

    let query = supabase
      .from('psychology_sessions')
      .select(`
        *,
        employee:profiles!employee_id(id, name, avatar_url, position),
        psychologist:profiles!psychologist_id(id, name, avatar_url, position)
      `);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    if (psychologistId) {
      query = query.eq('psychologist_id', psychologistId);
    }

    return supabaseRequest(() => query.order('scheduled_date', { ascending: false }), 'getSessions');
  },

  async createSession(session: Omit<PsychologySession, 'id' | 'created_at' | 'updated_at'>): Promise<PsychologySession> {
    console.log('🧠 MentalHealth: Creating session');

    return supabaseRequest(() => supabase
      .from('psychology_sessions')
      .insert(session)
      .select()
      .single(), 'createSession');
  },

  async updateSession(id: string, updates: Partial<PsychologySession>): Promise<PsychologySession> {
    console.log('🧠 MentalHealth: Updating session:', id);

    return supabaseRequest(() => supabase
      .from('psychology_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateSession');
  },

  // Session Requests
  async getSessionRequests(psychologistId?: string): Promise<SessionRequest[]> {
    console.log('🧠 MentalHealth: Getting session requests');

    let query = supabase
      .from('session_requests')
      .select(`
        *,
        employee:profiles!employee_id(id, name, avatar_url, position, email),
        psychologist:profiles!assigned_psychologist(id, name, avatar_url)
      `);

    if (psychologistId) {
      query = query.eq('assigned_psychologist', psychologistId);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getSessionRequests');
  },

  async createSessionRequest(request: Omit<SessionRequest, 'id' | 'created_at' | 'updated_at'>): Promise<SessionRequest> {
    console.log('🧠 MentalHealth: Creating session request');

    return supabaseRequest(() => supabase
      .from('session_requests')
      .insert(request)
      .select()
      .single(), 'createSessionRequest');
  },

  async updateSessionRequest(id: string, updates: Partial<SessionRequest>): Promise<SessionRequest> {
    console.log('🧠 MentalHealth: Updating session request:', id);

    return supabaseRequest(() => supabase
      .from('session_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateSessionRequest');
  },

  // Therapeutic Activities
  async getActivities(employeeId: string): Promise<TherapeuticActivity[]> {
    console.log('🧠 MentalHealth: Getting activities for employee:', employeeId);

    return supabaseRequest(() => supabase
      .from('therapeutic_activities')
      .select('*')
      .eq('employee_id', employeeId)
      .order('due_date', { ascending: true }), 'getActivities');
  },

  async createActivity(activity: Omit<TherapeuticActivity, 'id' | 'created_at' | 'updated_at'>): Promise<TherapeuticActivity> {
    console.log('🧠 MentalHealth: Creating therapeutic activity');

    return supabaseRequest(() => supabase
      .from('therapeutic_activities')
      .insert(activity)
      .select()
      .single(), 'createActivity');
  },

  async updateActivity(id: string, updates: Partial<TherapeuticActivity>): Promise<TherapeuticActivity> {
    console.log('🧠 MentalHealth: Updating activity:', id);

    return supabaseRequest(() => supabase
      .from('therapeutic_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateActivity');
  },

  async completeActivity(id: string, feedback: string, evidence?: string): Promise<TherapeuticActivity> {
    console.log('🧠 MentalHealth: Completing activity:', id);

    return supabaseRequest(() => supabase
      .from('therapeutic_activities')
      .update({
        status: 'concluida',
        employee_feedback: feedback,
        completion_evidence: evidence,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single(), 'completeActivity');
  },

  // Psychological Forms
  async getForms(activeOnly = true): Promise<PsychologicalForm[]> {
    console.log('🧠 MentalHealth: Getting forms, activeOnly:', activeOnly);

    let query = supabase
      .from('psychological_forms')
      .select('*');

    if (activeOnly) {
      query = query.eq('active', true);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getForms');
  },

  async getForm(id: string): Promise<PsychologicalForm> {
    console.log('🧠 MentalHealth: Getting form:', id);

    return supabaseRequest(() => supabase
      .from('psychological_forms')
      .select('*')
      .eq('id', id)
      .single(), 'getForm');
  },

  async createForm(form: Omit<PsychologicalForm, 'id' | 'created_at' | 'updated_at'>): Promise<PsychologicalForm> {
    console.log('🧠 MentalHealth: Creating form:', form.title);

    return supabaseRequest(() => supabase
      .from('psychological_forms')
      .insert(form)
      .select()
      .single(), 'createForm');
  },

  // Form Responses
  async getFormResponses(employeeId?: string, formId?: string): Promise<FormResponse[]> {
    console.log('🧠 MentalHealth: Getting form responses', { employeeId, formId });

    let query = supabase
      .from('form_responses')
      .select(`
        *,
        form:psychological_forms(title, form_type),
        employee:profiles!employee_id(id, name, avatar_url),
        reviewer:profiles!reviewed_by(id, name)
      `);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    if (formId) {
      query = query.eq('form_id', formId);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getFormResponses');
  },

  async submitFormResponse(response: Omit<FormResponse, 'id' | 'created_at' | 'score' | 'risk_level'>): Promise<FormResponse> {
    console.log('🧠 MentalHealth: Submitting form response');

    return supabaseRequest(() => supabase
      .from('form_responses')
      .insert(response)
      .select()
      .single(), 'submitFormResponse');
  },

  async reviewFormResponse(id: string, notes: string, followUpNeeded = false): Promise<FormResponse> {
    console.log('🧠 MentalHealth: Reviewing form response:', id);

    return supabaseRequest(async () => supabase
      .from('form_responses')
      .update({
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        psychologist_notes: notes,
        follow_up_scheduled: followUpNeeded,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single(), 'reviewFormResponse');
  },

  // Emotional Check-ins
  async getEmotionalCheckins(employeeId: string, days = 30): Promise<EmotionalCheckin[]> {
    console.log('🧠 MentalHealth: Getting emotional checkins for employee:', employeeId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return supabaseRequest(() => supabase
      .from('emotional_checkins')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('checkin_date', startDate.toISOString().split('T')[0])
      .order('checkin_date', { ascending: false }), 'getEmotionalCheckins');
  },

  async createEmotionalCheckin(checkin: Omit<EmotionalCheckin, 'id' | 'created_at'>): Promise<EmotionalCheckin> {
    console.log('🧠 MentalHealth: Creating emotional checkin');

    return supabaseRequest(() => supabase
      .from('emotional_checkins')
      .upsert(checkin)
      .select()
      .single(), 'createEmotionalCheckin');
  },

  async getTodayCheckin(employeeId: string): Promise<EmotionalCheckin | null> {
    console.log('🧠 MentalHealth: Getting today checkin for employee:', employeeId);

    try {
      const { data, error } = await supabase
        .from('emotional_checkins')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('checkin_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting today checkin:', error);
      return null;
    }
  },

  // Mental Health Alerts
  async getAlerts(acknowledged = false): Promise<MentalHealthAlert[]> {
    console.log('🧠 MentalHealth: Getting alerts, acknowledged:', acknowledged);

    let query = supabase
      .from('mental_health_alerts')
      .select(`
        *,
        employee:profiles!employee_id(id, name, avatar_url, position)
      `);

    if (!acknowledged) {
      query = query.is('acknowledged_at', null);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getAlerts');
  },

  async acknowledgeAlert(id: string, notes?: string): Promise<MentalHealthAlert> {
    console.log('🧠 MentalHealth: Acknowledging alert:', id);

    return supabaseRequest(() => supabase
      .from('mental_health_alerts')
      .update({
        acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
        acknowledged_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', id)
      .select()
      .single(), 'acknowledgeAlert');
  },

  async resolveAlert(id: string, notes: string): Promise<MentalHealthAlert> {
    console.log('🧠 MentalHealth: Resolving alert:', id);

    return supabaseRequest(() => supabase
      .from('mental_health_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', id)
      .select()
      .single(), 'resolveAlert');
  },

  // Wellness Resources
  async getWellnessResources(category?: string): Promise<WellnessResource[]> {
    console.log('🧠 MentalHealth: Getting wellness resources, category:', category);

    let query = supabase
      .from('wellness_resources')
      .select('*')
      .eq('active', true);

    if (category) {
      query = query.eq('category', category);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getWellnessResources');
  },

  async viewResource(resourceId: string, employeeId: string, timeSpent = 0): Promise<void> {
    console.log('🧠 MentalHealth: Recording resource view');

    try {
      // Record the view
      await supabase
        .from('resource_views')
        .upsert({
          resource_id: resourceId,
          employee_id: employeeId,
          time_spent_seconds: timeSpent,
          viewed_at: new Date().toISOString()
        });

      // Increment view count
      await supabase.rpc('increment_resource_views', {
        resource_id: resourceId
      });
    } catch (error) {
      console.error('🧠 MentalHealth: Error recording resource view:', error);
    }
  },

  // Statistics and Reports
  async getMentalHealthStats(): Promise<MentalHealthStats> {
    console.log('🧠 MentalHealth: Getting mental health statistics');

    try {
      const { data, error } = await supabase.rpc('get_mental_health_stats');
      
      if (error) {
        console.error('🧠 MentalHealth: Error getting stats:', error);
        // Return default stats if function doesn't exist
        return {
          total_employees_participating: 0,
          average_mood_score: 0,
          sessions_this_month: 0,
          high_risk_responses: 0,
          active_alerts: 0,
          wellness_resources_accessed: 0
        };
      }

      return data || {
        total_employees_participating: 0,
        average_mood_score: 0,
        sessions_this_month: 0,
        high_risk_responses: 0,
        active_alerts: 0,
        wellness_resources_accessed: 0
      };
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting stats:', error);
      return {
        total_employees_participating: 0,
        average_mood_score: 0,
        sessions_this_month: 0,
        high_risk_responses: 0,
        active_alerts: 0,
        wellness_resources_accessed: 0
      };
    }
  },

  async getEmployeeWellnessOverview(employeeId: string): Promise<{
    recent_checkins: EmotionalCheckin[];
    upcoming_sessions: PsychologySession[];
    pending_activities: TherapeuticActivity[];
    recent_responses: FormResponse[];
    wellness_trend: 'improving' | 'stable' | 'declining';
  }> {
    console.log('🧠 MentalHealth: Getting wellness overview for employee:', employeeId);

    try {
      const [checkins, sessions, activities, responses] = await Promise.all([
        this.getEmotionalCheckins(employeeId, 7),
        this.getSessions(employeeId),
        this.getActivities(employeeId),
        this.getFormResponses(employeeId)
      ]);

      // Calculate wellness trend based on recent checkins
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (checkins.length >= 3) {
        const recent = checkins.slice(0, 3);
        const older = checkins.slice(3, 6);
        
        const recentAvg = recent.reduce((sum, c) => sum + c.mood_score, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, c) => sum + c.mood_score, 0) / older.length : recentAvg;
        
        if (recentAvg > olderAvg + 1) trend = 'improving';
        else if (recentAvg < olderAvg - 1) trend = 'declining';
      }

      return {
        recent_checkins: checkins.slice(0, 7),
        upcoming_sessions: sessions.filter(s => 
          s.status === 'agendada' && new Date(s.scheduled_date) > new Date()
        ).slice(0, 3),
        pending_activities: activities.filter(a => a.status === 'pendente').slice(0, 5),
        recent_responses: responses.slice(0, 3),
        wellness_trend: trend
      };
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting wellness overview:', error);
      throw error;
    }
  },

  // Consent Management
  async recordConsent(employeeId: string, consentType: string, granted: boolean, consentText: string): Promise<void> {
    console.log('🧠 MentalHealth: Recording consent:', { employeeId, consentType, granted });

    try {
      await supabase
        .from('consent_records')
        .insert({
          employee_id: employeeId,
          consent_type: consentType,
          granted: granted,
          consent_text: consentText,
          ip_address: '127.0.0.1', // Would be actual IP in production
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('🧠 MentalHealth: Error recording consent:', error);
      throw error;
    }
  },

  async getConsent(employeeId: string, consentType: string): Promise<boolean> {
    console.log('🧠 MentalHealth: Checking consent:', { employeeId, consentType });

    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('granted')
        .eq('employee_id', employeeId)
        .eq('consent_type', consentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.granted || false;
    } catch (error) {
      console.error('🧠 MentalHealth: Error checking consent:', error);
      return false;
    }
  },

  // Utility functions
  getRiskLevelColor(level: string): string {
    switch (level) {
      case 'baixo': return 'text-green-600';
      case 'medio': return 'text-yellow-600';
      case 'alto': return 'text-orange-600';
      case 'critico': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  getRiskLevelBadge(level: string): 'success' | 'warning' | 'danger' | 'default' {
    switch (level) {
      case 'baixo': return 'success';
      case 'medio': return 'warning';
      case 'alto': return 'danger';
      case 'critico': return 'danger';
      default: return 'default';
    }
  },

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'normal': return 'text-blue-600';
      case 'prioritaria': return 'text-orange-600';
      case 'emergencial': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  getUrgencyBadge(urgency: string): 'info' | 'warning' | 'danger' | 'default' {
    switch (urgency) {
      case 'normal': return 'info';
      case 'prioritaria': return 'warning';
      case 'emergencial': return 'danger';
      default: return 'default';
    }
  },

  formatSessionType(type: string): string {
    switch (type) {
      case 'presencial': return 'Presencial';
      case 'online': return 'Online';
      case 'emergencial': return 'Emergencial';
      case 'follow_up': return 'Follow-up';
      default: return type;
    }
  },

  formatSessionStatus(status: string): string {
    switch (status) {
      case 'solicitada': return 'Solicitada';
      case 'agendada': return 'Agendada';
      case 'realizada': return 'Realizada';
      case 'cancelada': return 'Cancelada';
      case 'faltou': return 'Faltou';
      default: return status;
    }
  }
};