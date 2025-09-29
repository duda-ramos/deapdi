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
  content_text?: string;
  category: string;
  target_audience: string[];
  created_by: string;
  active: boolean;
  view_count: number;
  target_audience: string[];
  created_by: string;
  active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface TherapeuticTask {
  id: string;
  title: string;
  description?: string;
  task_type: 'formulario' | 'meditacao' | 'exercicio' | 'leitura' | 'reflexao' | 'anotacao';
  content: any;
  instructions?: string;
  assigned_to: string[];
  assigned_by: string;
  due_date: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  completion_tracking: any;
  created_at: string;
  updated_at: string;
}

export interface ResourceFavorite {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
}

export interface CheckinSettings {
  id: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'custom';
  reminder_time: string;
  reminder_enabled: boolean;
  custom_questions: any[];
  team_questions: any[];
  created_at: string;
  updated_at: string;
}

export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  form_type: 'auto_avaliacao' | 'feedback_gestor' | 'avaliacao_rh';
  questions: FormQuestion[];
  scoring_rules: any;
  alert_thresholds: any;
  target_audience: string[];
  is_active: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  template_id: string;
  submitted_by: string;
  target_user?: string;
  responses: any;
  calculated_score?: number;
  risk_level?: 'baixo' | 'medio' | 'alto' | 'critico';
  auto_alerts_triggered: boolean;
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  submission_type: 'auto_avaliacao' | 'feedback' | 'avaliacao';
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'form_score' | 'checkin_pattern' | 'inactivity' | 'manual';
  trigger_conditions: any;
  alert_severity: 'baixo' | 'medio' | 'alto' | 'critico';
  auto_actions: any;
  target_audience: string[];
  is_active: boolean;
  created_by: string;
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
  wellness_resources_accessed: number;
}

export const mentalHealthService = {
  // Sessions Management
  async getSessions(employeeId?: string, psychologistId?: string): Promise<PsychologySession[]> {
    console.log('🧠 MentalHealth: Getting sessions', { employeeId, psychologistId });

    try {
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

      return await supabaseRequest(() => query.order('scheduled_date', { ascending: false }), 'getSessions');
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting sessions:', error);
      return [];
    }
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

    try {
      return await supabaseRequest(() => supabase
        .from('therapeutic_activities')
        .select('*')
        .order('created_at', { ascending: false }), 'getActivities');
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting activities:', error);
      return [];
    }
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

    try {
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

      return await supabaseRequest(() => query.order('created_at', { ascending: false }), 'getFormResponses');
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting form responses:', error);
      return [];
    }
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

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await supabaseRequest(() => supabase
        .from('emotional_checkins')
        .select(`
          id,
          employee_id,
          mood_rating,
          stress_level,
          energy_level,
          sleep_quality,
          notes,
          checkin_date,
          created_at
        `)
        .eq('employee_id', employeeId)
        .gte('checkin_date', startDate.toISOString().split('T')[0])
        .order('checkin_date', { ascending: false }), 'getEmotionalCheckins');
      
      // Map the database fields to the expected interface
      return data.map((item: any) => ({
        id: item.id,
        employee_id: item.employee_id,
        mood_score: item.mood_score,
        stress_level: item.stress_level,
        energy_level: item.energy_level,
        sleep_quality: item.sleep_quality,
        notes: item.notes,
        tags: item.tags || [],
        checkin_date: item.checkin_date,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('🧠 MentalHealth: Error getting emotional checkins:', error);
      return [];
    }
  },

  async createEmotionalCheckin(checkin: Omit<EmotionalCheckin, 'id' | 'created_at'>): Promise<EmotionalCheckin> {
    console.log('🧠 MentalHealth: Creating emotional checkin');

    return await supabaseRequest(() => supabase
      .from('emotional_checkins')
      .upsert({
        employee_id: checkin.employee_id,
        mood_score: checkin.mood_score,
        stress_level: checkin.stress_level,
        energy_level: checkin.energy_level,
        sleep_quality: checkin.sleep_quality,
        notes: checkin.notes,
        tags: checkin.tags,
        checkin_date: checkin.checkin_date
      })
      .select()
      .single(), 'createEmotionalCheckin');
  },

  async getTodayCheckin(employeeId: string): Promise<EmotionalCheckin | null> {
    console.log('🧠 MentalHealth: Getting today checkin for employee:', employeeId);

    try {
      const { data, error } = await supabase
        .from('emotional_checkins')
        .select(`
          id,
          employee_id,
          mood_score,
          stress_level,
          energy_level,
          sleep_quality,
          notes,
          tags,
          checkin_date,
          created_at
        `)
        .eq('employee_id', employeeId)
        .eq('checkin_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          id: data.id,
          employee_id: data.employee_id,
          mood_score: data.mood_score,
          stress_level: data.stress_level,
          energy_level: data.energy_level,
          sleep_quality: data.sleep_quality,
          notes: data.notes,
          tags: data.tags || [],
          checkin_date: data.checkin_date,
          created_at: data.created_at
        };
      }
      
      return null;
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

    return supabaseRequest(async () => supabase
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

    return supabaseRequest(() => query.order('view_count', { ascending: false }), 'getWellnessResources');
  },

  async createWellnessResource(resource: Omit<WellnessResource, 'id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<WellnessResource> {
    console.log('🧠 MentalHealth: Creating wellness resource:', resource.title);

    return supabaseRequest(() => supabase
      .from('wellness_resources')
      .insert({
        ...resource,
        view_count: 0
      })
      .select()
      .single(), 'createWellnessResource');
  },

  async updateWellnessResource(id: string, updates: Partial<WellnessResource>): Promise<WellnessResource> {
    console.log('🧠 MentalHealth: Updating wellness resource:', id);

    return supabaseRequest(() => supabase
      .from('wellness_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateWellnessResource');
  },

  async deleteWellnessResource(id: string): Promise<void> {
    console.log('🧠 MentalHealth: Deleting wellness resource:', id);

    return supabaseRequest(() => supabase
      .from('wellness_resources')
      .delete()
      .eq('id', id), 'deleteWellnessResource');
  },

  async viewResource(resourceId: string, employeeId: string, timeSpent = 0): Promise<void> {
    console.log('🧠 MentalHealth: Recording resource view');

    return supabaseRequest(() => supabase
      .rpc('increment_resource_view_count', { resource_id: resourceId }), 'incrementResourceViewCount');
  },

  // Resource Favorites
  async getFavoriteResources(userId: string): Promise<WellnessResource[]> {
    console.log('🧠 MentalHealth: Getting favorite resources for user:', userId);

    return supabaseRequest(() => supabase
      .from('resource_favorites')
      .select(`
        resource:wellness_resources(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }), 'getFavoriteResources');
  },

  async addToFavorites(userId: string, resourceId: string): Promise<ResourceFavorite> {
    console.log('🧠 MentalHealth: Adding resource to favorites');

    return supabaseRequest(() => supabase
      .from('resource_favorites')
      .insert({
        user_id: userId,
        resource_id: resourceId
      })
      .select()
      .single(), 'addToFavorites');
  },

  async removeFromFavorites(userId: string, resourceId: string): Promise<void> {
    console.log('🧠 MentalHealth: Removing resource from favorites');

    return supabaseRequest(() => supabase
      .from('resource_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('resource_id', resourceId), 'removeFromFavorites');
  },

  // Therapeutic Tasks
  async getTherapeuticTasks(userId: string): Promise<TherapeuticTask[]> {
    console.log('🧠 MentalHealth: Getting therapeutic tasks for user:', userId);

    return supabaseRequest(() => supabase
      .from('therapeutic_tasks')
      .select('*')
      .contains('assigned_to', [userId])
      .order('due_date'), 'getTherapeuticTasks');
  },

  async createTherapeuticTask(task: Omit<TherapeuticTask, 'id' | 'created_at' | 'updated_at' | 'completion_tracking'>): Promise<TherapeuticTask> {
    console.log('🧠 MentalHealth: Creating therapeutic task:', task.title);

    return supabaseRequest(() => supabase
      .from('therapeutic_tasks')
      .insert({
        ...task,
        completion_tracking: {}
      })
      .select()
      .single(), 'createTherapeuticTask');
  },

  async updateTherapeuticTask(id: string, updates: Partial<TherapeuticTask>): Promise<TherapeuticTask> {
    console.log('🧠 MentalHealth: Updating therapeutic task:', id);

    return supabaseRequest(() => supabase
      .from('therapeutic_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateTherapeuticTask');
  },

  async completeTherapeuticTask(id: string, feedback?: string): Promise<TherapeuticTask> {
    console.log('🧠 MentalHealth: Completing therapeutic task:', id);

    return supabaseRequest(() => supabase
      .from('therapeutic_tasks')
      .update({
        status: 'completed',
        completion_tracking: {
          completed_at: new Date().toISOString(),
          feedback: feedback
        }
      })
      .eq('id', id)
      .select()
      .single(), 'completeTherapeuticTask');
  },

  // Check-in Settings
  async getCheckinSettings(userId: string): Promise<CheckinSettings> {
    console.log('🧠 MentalHealth: Getting checkin settings for user:', userId);

    try {
      const result = await supabaseRequest(() => supabase
        .from('checkin_settings')
        .select('*')
        .eq('user_id', userId)
        .single(), 'getCheckinSettings');
      return result;
    } catch (error) {
      // Create default settings if none exist
      return await this.createDefaultCheckinSettings(userId);
    }
  },

  async createDefaultCheckinSettings(userId: string): Promise<CheckinSettings> {
    console.log('🧠 MentalHealth: Creating default checkin settings for user:', userId);

    return supabaseRequest(() => supabase
      .from('checkin_settings')
      .insert({
        user_id: userId,
        frequency: 'daily',
        reminder_time: '09:00:00',
        reminder_enabled: true,
        custom_questions: [],
        team_questions: []
      })
      .select()
      .single(), 'createDefaultCheckinSettings');
  },

  async updateCheckinSettings(userId: string, settings: Partial<CheckinSettings>): Promise<CheckinSettings> {
    console.log('🧠 MentalHealth: Updating checkin settings for user:', userId);

    return supabaseRequest(() => supabase
      .from('checkin_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single(), 'updateCheckinSettings');
  },

  // Form Templates (Dynamic Forms)
  async getFormTemplates(activeOnly = true): Promise<FormTemplate[]> {
    console.log('🧠 MentalHealth: Getting form templates, activeOnly:', activeOnly);

    let query = supabase
      .from('form_templates')
      .select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getFormTemplates');
  },

  async createFormTemplate(template: Omit<FormTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<FormTemplate> {
    console.log('🧠 MentalHealth: Creating form template:', template.title);

    return supabaseRequest(() => supabase
      .from('form_templates')
      .insert(template)
      .select()
      .single(), 'createFormTemplate');
  },

  async updateFormTemplate(id: string, updates: Partial<FormTemplate>): Promise<FormTemplate> {
    console.log('🧠 MentalHealth: Updating form template:', id);

    return supabaseRequest(() => supabase
      .from('form_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateFormTemplate');
  },

  // Form Submissions
  async getFormSubmissions(filters?: {
    templateId?: string;
    submittedBy?: string;
    targetUser?: string;
    riskLevel?: string;
  }): Promise<FormSubmission[]> {
    console.log('🧠 MentalHealth: Getting form submissions with filters:', filters);

    let query = supabase
      .from('form_submissions')
      .select(`
        *,
        template:form_templates(title, form_type),
        submitter:profiles!submitted_by(name, avatar_url),
        target:profiles!target_user(name, avatar_url, position)
      `);

    if (filters?.templateId) {
      query = query.eq('template_id', filters.templateId);
    }
    if (filters?.submittedBy) {
      query = query.eq('submitted_by', filters.submittedBy);
    }
    if (filters?.targetUser) {
      query = query.eq('target_user', filters.targetUser);
    }
    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getFormSubmissions');
  },

  async submitForm(submission: Omit<FormSubmission, 'id' | 'created_at' | 'updated_at' | 'calculated_score' | 'risk_level' | 'auto_alerts_triggered'>): Promise<FormSubmission> {
    console.log('🧠 MentalHealth: Submitting form');

    return supabaseRequest(() => supabase
      .from('form_submissions')
      .insert({
        ...submission,
        auto_alerts_triggered: false
      })
      .select()
      .single(), 'submitForm');
  },

  async reviewFormSubmission(id: string, reviewNotes: string, reviewerId: string): Promise<FormSubmission> {
    console.log('🧠 MentalHealth: Reviewing form submission:', id);

    return supabaseRequest(() => supabase
      .from('form_submissions')
      .update({
        reviewed_by: reviewerId,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single(), 'reviewFormSubmission');
  },

  // Alert Rules
  async getAlertRules(): Promise<AlertRule[]> {
    console.log('🧠 MentalHealth: Getting alert rules');

    return supabaseRequest(() => supabase
      .from('alert_rules')
      .select('*')
      .order('created_at', { ascending: false }), 'getAlertRules');
  },

  async createAlertRule(rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<AlertRule> {
    console.log('🧠 MentalHealth: Creating alert rule:', rule.name);

    return supabaseRequest(() => supabase
      .from('alert_rules')
      .insert(rule)
      .select()
      .single(), 'createAlertRule');
  },

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    console.log('🧠 MentalHealth: Updating alert rule:', id);

    return supabaseRequest(() => supabase
      .from('alert_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateAlertRule');
  },

  async triggerAlertCheck(): Promise<void> {
    console.log('🧠 MentalHealth: Triggering alert check');

    return supabaseRequest(() => supabase
      .rpc('check_alert_rules'), 'triggerAlertCheck');
  },

  // Analytics
  async getMentalHealthAnalytics(startDate?: string, endDate?: string): Promise<any> {
    console.log('🧠 MentalHealth: Getting analytics');

    return supabaseRequest(() => supabase
      .rpc('get_mental_health_analytics', {
        start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0]
      }), 'getMentalHealthAnalytics');
  },

  // Digital Record (Prontuário)
  async getDigitalRecord(userId: string): Promise<{
    checkins: EmotionalCheckin[];
    sessions: PsychologySession[];
    alerts: MentalHealthAlert[];
    submissions: FormSubmission[];
    tasks: TherapeuticTask[];
    timeline: any[];
  }> {
    console.log('🧠 MentalHealth: Getting digital record for user:', userId);

    const [checkins, sessions, alerts, submissions, tasks] = await Promise.all([
      this.getEmotionalCheckins(userId, 365), // Last year
      this.getSessions(userId),
      supabaseRequest(() => supabase
        .from('mental_health_alerts')
        .select('*')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false }), 'getUserAlerts'),
      this.getFormSubmissions({ targetUser: userId }),
      this.getTherapeuticTasks(userId)
    ]);

    // Create unified timeline
    const timeline = [
      ...checkins.map(c => ({
        id: c.id,
        type: 'checkin',
        date: c.checkin_date,
        title: 'Check-in Emocional',
        data: c
      })),
      ...sessions.map(s => ({
        id: s.id,
        type: 'session',
        date: s.scheduled_date,
        title: 'Sessão de Psicologia',
        data: s
      })),
      ...alerts.map(a => ({
        id: a.id,
        type: 'alert',
        date: a.created_at,
        title: a.title,
        data: a
      })),
      ...submissions.map(s => ({
        id: s.id,
        type: 'submission',
        date: s.created_at,
        title: 'Formulário Respondido',
        data: s
      })),
      ...tasks.map(t => ({
        id: t.id,
        type: 'task',
        date: t.due_date,
        title: t.title,
        data: t
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      checkins,
      sessions,
      alerts,
      submissions,
      tasks,
      timeline
    };
  },

  // Statistics and Reports
  async getMentalHealthStats(): Promise<MentalHealthStats> {
    console.log('🧠 MentalHealth: Getting mental health statistics');

    return supabaseRequest(() => supabase
      .rpc('get_mental_health_stats'), 'getMentalHealthStats');
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
        this.getTherapeuticTasks(employeeId),
        this.getFormSubmissions({ targetUser: employeeId })
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
          s.status === 'scheduled' && new Date(s.scheduled_date) > new Date()
        ).slice(0, 3),
        pending_activities: activities.filter(a => a.status === 'active').slice(0, 5),
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

    return supabaseRequest(() => supabase
      .from('consent_records')
      .insert({
        employee_id: employeeId,
        consent_type: consentType,
        granted: granted,
        consent_text: consentText,
        ip_address: '127.0.0.1', // Would be actual IP in production
        user_agent: navigator.userAgent
      }), 'recordConsent');
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