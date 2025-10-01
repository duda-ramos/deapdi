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
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  difficulty_level: string;
  instructions: string | null;
  benefits: string | null;
  active: boolean;
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
  score?: number;
  interpretation?: string;
  status?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
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
  mood_rating: number; // Maps to mood_rating in database
  energy_level: number;
  stress_level: number;
  sleep_quality: number;
  notes?: string;
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
  resource_type: 'article' | 'video' | 'audio' | 'pdf' | 'link';
  content_url?: string;
  thumbnail_url?: string;
  category: string;
  active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ResourceFavorite {
  user_id: string;
  resource_id: string;
  created_at: string;
  resource?: WellnessResource;
}

export interface CheckinCustomQuestion {
  id: string;
  prompt: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  audience?: string[];
  active?: boolean;
  last_asked_at?: string | null;
}

export interface CheckinSettings {
  user_id: string;
  frequency: 'daily' | 'weekly' | 'custom';
  reminder_time: string | null;
  reminder_enabled?: boolean;
  weekly_reminder_day?: number | null;
  custom_questions: CheckinCustomQuestion[];
  created_at?: string;
  updated_at?: string;
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
}

const normalizeCheckinSettings = (raw: any): CheckinSettings => ({
  user_id: raw.user_id,
  frequency: (raw.frequency ?? 'daily') as CheckinSettings['frequency'],
  reminder_time: raw.reminder_time ?? null,
  reminder_enabled: raw.reminder_enabled ?? true,
  weekly_reminder_day: raw.weekly_reminder_day ?? null,
  custom_questions: Array.isArray(raw.custom_questions)
    ? raw.custom_questions.map((question: any, index: number) => ({
        id: question?.id ?? `question-${index}`,
        prompt: question?.prompt ?? question?.text ?? '',
        frequency: question?.frequency,
        audience: question?.audience,
        active: question?.active ?? true,
        last_asked_at: question?.last_asked_at ?? null
      }))
    : [],
  created_at: raw.created_at ?? undefined,
  updated_at: raw.updated_at ?? undefined
});

const isOfflineModeEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem('OFFLINE_MODE') === 'true';
  } catch {
    return false;
  }
};

const isSupabaseAvailable = () => Boolean(supabase) && !isOfflineModeEnabled();

const createOfflineDefaultSettings = (userId: string): CheckinSettings => ({
  user_id: userId,
  frequency: 'daily',
  reminder_time: '09:00',
  reminder_enabled: true,
  weekly_reminder_day: 1,
  custom_questions: [
    {
      id: 'daily-reflection',
      prompt: 'Qual foi o ponto alto do seu dia?',
      frequency: 'daily',
      active: true
    }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const offlineCheckinSettingsStore = new Map<string, CheckinSettings>();
const offlineCheckinsStore = new Map<string, EmotionalCheckin[]>();
const OFFLINE_DEMO_USER_ID = 'offline-demo-user';

const generateOfflineId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `offline-${Math.random().toString(36).slice(2, 10)}`;
};

const seedOfflineCheckins = (userId: string) => {
  const days = [
    { mood: 7, stress: 4, energy: 6, sleep: 7 },
    { mood: 6, stress: 5, energy: 5, sleep: 6 },
    { mood: 8, stress: 3, energy: 7, sleep: 8 },
    { mood: 5, stress: 6, energy: 4, sleep: 5 },
    { mood: 7, stress: 4, energy: 6, sleep: 7 }
  ];

  const today = new Date();
  const seeded: EmotionalCheckin[] = days.map((entry, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const dateString = date.toISOString().split('T')[0];

    return {
      id: generateOfflineId(),
      employee_id: userId,
      mood_rating: entry.mood,
      stress_level: entry.stress,
      energy_level: entry.energy,
      sleep_quality: entry.sleep,
      notes: index === 0 ? 'Mantendo uma boa rotina de autocuidado.' : null,
      checkin_date: `${dateString}T09:00:00.000Z`,
      created_at: `${dateString}T09:05:00.000Z`
    };
  });

  offlineCheckinsStore.set(userId, seeded);
};

if (!offlineCheckinSettingsStore.has(OFFLINE_DEMO_USER_ID)) {
  offlineCheckinSettingsStore.set(OFFLINE_DEMO_USER_ID, createOfflineDefaultSettings(OFFLINE_DEMO_USER_ID));
}

if (!offlineCheckinsStore.has(OFFLINE_DEMO_USER_ID)) {
  seedOfflineCheckins(OFFLINE_DEMO_USER_ID);
}

const getOfflineMentalHealthStats = (): MentalHealthStats => {
  const allCheckins = Array.from(offlineCheckinsStore.values()).flat();
  const averageMood = allCheckins.length
    ? allCheckins.reduce((sum, checkin) => sum + checkin.mood_rating, 0) / allCheckins.length
    : 0;

  return {
    total_employees_participating: Math.max(offlineCheckinSettingsStore.size, 1),
    average_mood_score: Number(averageMood.toFixed(1)),
    sessions_this_month: 2,
    high_risk_responses: Math.max(allCheckins.filter(checkin => checkin.stress_level >= 7).length, 0),
    active_alerts: 1,
    wellness_resources_accessed: Math.max(allCheckins.length, 3)
  };
};

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
  async getTherapeuticActivities(): Promise<TherapeuticActivity[]> {
    console.log('🧠 MentalHealth: Getting therapeutic activities library');

    return supabaseRequest(() => supabase
      .from('therapeutic_activities')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false }), 'getTherapeuticActivities');
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

      const responses = await supabaseRequest(() => query.order('created_at', { ascending: false }), 'getFormResponses');
      
      // Add risk_level based on score since it doesn't exist in database
      return responses.map(response => ({
        ...response,
        risk_level: this.calculateRiskLevel(response.score || 0)
      }));
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

    if (!isSupabaseAvailable()) {
      if (!offlineCheckinsStore.has(employeeId)) {
        seedOfflineCheckins(employeeId);
      }
      const stored = offlineCheckinsStore.get(employeeId) || [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      return stored
        .filter(checkin => new Date(checkin.checkin_date) >= startDate)
        .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime());
    }

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
        mood_rating: item.mood_rating,
        stress_level: item.stress_level,
        energy_level: item.energy_level,
        sleep_quality: item.sleep_quality,
        notes: item.notes,
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

    if (!isSupabaseAvailable()) {
      const offlineExisting = offlineCheckinsStore.get(checkin.employee_id) || [];
      const existingIndex = offlineExisting.findIndex(item => item.checkin_date === checkin.checkin_date);
      const newCheckin: EmotionalCheckin = {
        ...checkin,
        id: existingIndex >= 0 ? offlineExisting[existingIndex].id : generateOfflineId(),
        created_at: existingIndex >= 0 ? offlineExisting[existingIndex].created_at : new Date().toISOString()
      };

      if (existingIndex >= 0) {
        offlineExisting[existingIndex] = newCheckin;
        offlineCheckinsStore.set(checkin.employee_id, [...offlineExisting]);
      } else {
        offlineCheckinsStore.set(checkin.employee_id, [...offlineExisting, newCheckin]);
      }

      return newCheckin;
    }

    return await supabaseRequest(() => supabase
      .from('emotional_checkins')
      .upsert({
        employee_id: checkin.employee_id,
        mood_rating: checkin.mood_rating,
        stress_level: checkin.stress_level,
        energy_level: checkin.energy_level,
        sleep_quality: checkin.sleep_quality,
        notes: checkin.notes,
        checkin_date: checkin.checkin_date
      })
      .select()
      .single(), 'createEmotionalCheckin');
  },

  async getTodayCheckin(employeeId: string): Promise<EmotionalCheckin | null> {
    console.log('🧠 MentalHealth: Getting today checkin for employee:', employeeId);

    if (!isSupabaseAvailable()) {
      const today = new Date().toISOString().split('T')[0];
      if (!offlineCheckinsStore.has(employeeId)) {
        seedOfflineCheckins(employeeId);
      }
      const checkins = offlineCheckinsStore.get(employeeId) || [];
      return checkins.find(checkin => checkin.checkin_date.startsWith(today)) || null;
    }

    try {
      const { data, error } = await supabase
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
        .eq('checkin_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          employee_id: data.employee_id,
          mood_rating: data.mood_rating,
          stress_level: data.stress_level,
          energy_level: data.energy_level,
          sleep_quality: data.sleep_quality,
          notes: data.notes,
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

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getWellnessResources');
  },

  async createWellnessResource(resource: Omit<WellnessResource, 'id' | 'created_at' | 'updated_at'>): Promise<WellnessResource> {
    console.log('🧠 MentalHealth: Creating wellness resource:', resource.title);

    return supabaseRequest(() => supabase
      .from('wellness_resources')
      .insert(resource)
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

    // View tracking functionality - simplified logging only
    console.log('View recorded for resource:', resourceId, 'by user:', employeeId);
    
    // In a real implementation, this could create a separate view_logs table
    // or increment a counter in a different way
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

  // Therapeutic Tasks (Library-based, no assignments)
  async getTherapeuticTasks(userId: string): Promise<TherapeuticActivity[]> {
    console.log('🧠 MentalHealth: Getting therapeutic activities library for user:', userId);
    
    // Since therapeutic_activities is a library table without employee assignments,
    // return the general library of activities
    return this.getTherapeuticActivities();
  },

  // Check-in Settings
  async getCheckinSettings(userId: string): Promise<CheckinSettings> {
    console.log('🧠 MentalHealth: Getting checkin settings for user:', userId);

    if (!isSupabaseAvailable()) {
      if (!offlineCheckinSettingsStore.has(userId)) {
        offlineCheckinSettingsStore.set(userId, createOfflineDefaultSettings(userId));
      }
      return offlineCheckinSettingsStore.get(userId)!;
    }

    const result = await supabaseRequest(() => supabase
      .from('checkin_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(), 'getCheckinSettings');

    if (result) {
      return normalizeCheckinSettings(result);
    }

    // Create default settings if none exist
    return await this.createDefaultCheckinSettings(userId);
  },

  async createDefaultCheckinSettings(userId: string): Promise<CheckinSettings> {
    console.log('🧠 MentalHealth: Creating default checkin settings for user:', userId);

    if (!isSupabaseAvailable()) {
      const settings = createOfflineDefaultSettings(userId);
      offlineCheckinSettingsStore.set(userId, settings);
      return settings;
    }

    const defaultQuestions: CheckinCustomQuestion[] = createOfflineDefaultSettings(userId).custom_questions;

    try {
      await supabaseRequest(() => supabase
        .from('checkin_settings')
        .insert({
          user_id: userId,
          frequency: 'daily',
          reminder_time: '09:00',
          reminder_enabled: true,
          custom_questions: defaultQuestions,
          weekly_reminder_day: 1
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: true
        }), 'createDefaultCheckinSettingsInsert');
    } catch (error) {
      if (error instanceof Error && error.message === 'Este registro já existe.') {
        console.warn('🧠 MentalHealth: Default check-in settings already exist for user, reusing existing record.');
      } else {
        throw error;
      }
    }

    const result = await supabaseRequest(() => supabase
      .from('checkin_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(), 'createDefaultCheckinSettingsFetch');

    if (!result) {
      throw new Error('Não foi possível criar ou recuperar as configurações de check-in.');
    }

    return normalizeCheckinSettings(result);
  },

  async updateCheckinSettings(userId: string, settings: Partial<CheckinSettings>): Promise<CheckinSettings> {
    console.log('🧠 MentalHealth: Updating checkin settings for user:', userId);

    if (!isSupabaseAvailable()) {
      const current = offlineCheckinSettingsStore.get(userId) || createOfflineDefaultSettings(userId);
      const updated: CheckinSettings = {
        ...current,
        ...settings,
        custom_questions: settings.custom_questions ?? current.custom_questions,
        updated_at: new Date().toISOString()
      };
      offlineCheckinSettingsStore.set(userId, updated);
      return updated;
    }

    const current = await this.getCheckinSettings(userId);

    const payload = {
      user_id: userId,
      frequency: settings.frequency ?? current.frequency,
      reminder_time: settings.reminder_time ?? current.reminder_time,
      reminder_enabled: settings.reminder_enabled ?? current.reminder_enabled,
      weekly_reminder_day: settings.weekly_reminder_day ?? current.weekly_reminder_day,
      custom_questions: settings.custom_questions ?? current.custom_questions,
      updated_at: new Date().toISOString()
    };

    const result = await supabaseRequest(() => supabase
      .from('checkin_settings')
      .upsert(payload)
      .select()
      .single(), 'updateCheckinSettings');

    return normalizeCheckinSettings(result);
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

  // Form Submissions with Filters
  async getFormResponsesWithFilters(employeeId?: string, filters?: {
    templateId?: string;
    formId?: string;
    riskLevel?: string;
  }): Promise<FormResponse[]> {
    console.log('🧠 MentalHealth: Getting form responses for employee:', employeeId);

    let query = supabase
      .from('form_responses')
      .select(`
        *,
        form:psychological_forms(title, form_type),
        employee:profiles!employee_id(name, avatar_url),
        reviewer:profiles!reviewed_by(name, avatar_url)
      `);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (filters?.templateId) {
      query = query.eq('form_id', filters.templateId);
    }
    if (filters?.formId) {
      query = query.eq('form_id', filters.formId);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getFormResponses');
  },

  async submitForm(submission: Omit<FormResponse, 'id' | 'created_at' | 'updated_at'>): Promise<FormResponse> {
    console.log('🧠 MentalHealth: Submitting form response');

    return supabaseRequest(() => supabase
      .from('form_responses')
      .insert(submission)
      .select()
      .single(), 'submitForm');
  },

  async reviewFormSubmission(id: string, reviewNotes: string, reviewerId: string): Promise<FormResponse> {
    console.log('🧠 MentalHealth: Reviewing form response:', id);

    return supabaseRequest(() => supabase
      .from('form_responses')
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
    responses: FormResponse[];
    activities: TherapeuticActivity[];
    timeline: any[];
  }> {
    console.log('🧠 MentalHealth: Getting digital record for user:', userId);

    const [checkins, sessions, alerts, responses, activities] = await Promise.all([
      this.getEmotionalCheckins(userId, 365), // Last year
      this.getSessions(userId),
      supabaseRequest(() => supabase
        .from('mental_health_alerts')
        .select('*')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false }), 'getUserAlerts'),
      this.getFormResponses(userId),
      this.getTherapeuticActivities()
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
      ...responses.map(s => ({
        id: s.id,
        type: 'response',
        date: s.created_at,
        title: 'Formulário Respondido',
        data: s
      })),
      ...activities.slice(0, 5).map(t => ({
        id: t.id,
        type: 'activity',
        date: t.created_at,
        title: t.title,
        data: t
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      checkins,
      sessions,
      alerts,
      responses,
      activities,
      timeline
    };
  },

  // Statistics and Reports
  async getMentalHealthStats(): Promise<MentalHealthStats> {
    console.log('🧠 MentalHealth: Getting mental health statistics');

    try {
      if (!isSupabaseAvailable()) {
        return getOfflineMentalHealthStats();
      }

      // Calculate stats manually since RPC function has column issues
      const [
        employeesResult,
        checkinsResult,
        sessionsResult,
        responsesResult,
        alertsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('emotional_checkins').select('mood_rating'),
        supabase.from('psychology_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('form_responses').select('score'),
        supabase.from('mental_health_alerts')
          .select('id', { count: 'exact', head: true })
          .is('acknowledged_at', null)
      ]);

      // Calculate average mood score
      const moodScores = checkinsResult.data || [];
      const averageMood = moodScores.length > 0 
        ? moodScores.reduce((sum, checkin) => sum + (checkin.mood_rating || 0), 0) / moodScores.length
        : 0;

      // Calculate high risk responses (score >= 60)
      const responses = responsesResult.data || [];
      const highRiskCount = responses.filter(r => (r.score || 0) >= 60).length;

      return {
        total_employees_participating: employeesResult.count || 0,
        average_mood_score: averageMood,
        sessions_this_month: sessionsResult.count || 0,
        high_risk_responses: highRiskCount,
        active_alerts: alertsResult.count || 0,
        wellness_resources_accessed: 0 // Not tracked in current schema
      };
    } catch (error) {
      console.warn('🧠 MentalHealth: Error calculating stats, returning offline defaults:', error);
      return getOfflineMentalHealthStats();
    }
  },

  async getEmployeeWellnessOverview(employeeId: string): Promise<{
    recent_checkins: EmotionalCheckin[];
    upcoming_sessions: PsychologySession[];
    recent_responses: FormResponse[];
    wellness_trend: 'improving' | 'stable' | 'declining';
  }> {
    console.log('🧠 MentalHealth: Getting wellness overview for employee:', employeeId);

    try {
      const [checkins, sessions, responses] = await Promise.all([
        this.getEmotionalCheckins(employeeId, 7),
        this.getSessions(employeeId),
        this.getFormSubmissions({ targetUser: employeeId })
      ]);

      // Calculate wellness trend based on recent checkins
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (checkins.length >= 3) {
        const recent = checkins.slice(0, 3);
        const older = checkins.slice(3, 6);
        
        const recentAvg = recent.reduce((sum, c) => sum + c.mood_rating, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, c) => sum + c.mood_rating, 0) / older.length : recentAvg;
        
        if (recentAvg > olderAvg + 1) trend = 'improving';
        else if (recentAvg < olderAvg - 1) trend = 'declining';
      }

      return {
        recent_checkins: checkins.slice(0, 7),
        upcoming_sessions: sessions.filter(s => 
          s.status === 'scheduled' && new Date(s.scheduled_date) > new Date()
        ).slice(0, 3),
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
  },

  calculateRiskLevel(score: number): 'baixo' | 'medio' | 'alto' | 'critico' {
    if (score >= 80) return 'critico';
    if (score >= 60) return 'alto';
    if (score >= 40) return 'medio';
    return 'baixo';
  }
};