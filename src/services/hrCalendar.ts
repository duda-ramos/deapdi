import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';

export interface CalendarEvent {
  id: string;
  type: 'aniversario' | 'aniversario_empresa' | 'ferias' | 'feriado' | 'evento' | 'day_off' | 'ferias_coletivas';
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'confirmed';
  created_by?: string;
  approved_by?: string;
  user_id?: string;
  team_id?: string;
  is_public: boolean;
  color: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  user?: any;
  team?: any;
  creator?: any;
}

export interface CalendarRequest {
  id: string;
  event_type: 'ferias' | 'day_off';
  requester_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: string;
  reviewed_at?: string;
  manager_approval?: boolean;
  hr_approval?: boolean;
  comments?: string;
  rejection_reason?: string;
  days_requested: number;
  created_at: string;
  updated_at: string;
  requester?: any;
  reviewer?: any;
}

export interface CalendarSettings {
  vacation_min_advance_days: number;
  dayoff_min_advance_days: number;
  max_dayoff_per_year: number;
  max_consecutive_dayoffs: number;
  vacation_days_per_year: number;
  team_absence_limit: number;
  auto_create_birthdays: boolean;
  auto_create_anniversaries: boolean;
  notification_reminders: boolean;
  colors: {
    weekend: string;
    holiday: string;
    vacation: string;
    birthday: string;
    anniversary: string;
    event: string;
    dayoff: string;
  };
}

export interface VacationEligibility {
  eligible: boolean;
  reason?: string;
  years_in_company: number;
  available_days: number;
  used_days: number;
  remaining_days: number;
  admission_date: string;
}

export interface CalendarStats {
  total_events: number;
  pending_requests: number;
  upcoming_birthdays: number;
  upcoming_anniversaries: number;
  team_absences_today: number;
  vacation_requests_this_month: number;
}

export const hrCalendarService = {
  // Events Management
  async getEvents(filters?: {
    start_date?: string;
    end_date?: string;
    type?: string;
    user_id?: string;
    team_id?: string;
    is_public?: boolean;
  }): Promise<CalendarEvent[]> {
    console.log('📅 HRCalendar: Getting events with filters:', filters);

    if (!supabase) {
      console.warn('📅 HRCalendar: Supabase not available');
      return [];
    }

    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        user:profiles!calendar_events_user_id_fkey(id, name, avatar_url, position),
        team:teams!calendar_events_team_id_fkey(id, name),
        creator:profiles!calendar_events_created_by_fkey(id, name)
      `);

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.team_id) {
      query = query.eq('team_id', filters.team_id);
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    return supabaseRequest(() => query.order('start_date'), 'getCalendarEvents');
  },

  async createEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    console.log('📅 HRCalendar: Creating event:', event.title);

    return supabaseRequest(() => supabase
      .from('calendar_events')
      .insert(event)
      .select()
      .single(), 'createCalendarEvent');
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    console.log('📅 HRCalendar: Updating event:', id);

    return supabaseRequest(() => supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateCalendarEvent');
  },

  async deleteEvent(id: string): Promise<void> {
    console.log('📅 HRCalendar: Deleting event:', id);

    return supabaseRequest(() => supabase
      .from('calendar_events')
      .delete()
      .eq('id', id), 'deleteCalendarEvent');
  },

  // Requests Management
  async getRequests(filters?: {
    requester_id?: string;
    status?: string;
    event_type?: string;
  }): Promise<CalendarRequest[]> {
    console.log('📅 HRCalendar: Getting requests with filters:', filters);

    if (!supabase) {
      console.warn('📅 HRCalendar: Supabase not available');
      return [];
    }

    let query = supabase
      .from('calendar_requests')
      .select(`
        *,
        requester:profiles!calendar_requests_requester_id_fkey(id, name, avatar_url, position, team_id),
        reviewer:profiles!calendar_requests_reviewed_by_fkey(id, name)
      `);

    if (filters?.requester_id) {
      query = query.eq('requester_id', filters.requester_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getCalendarRequests');
  },

  async createRequest(request: Omit<CalendarRequest, 'id' | 'created_at' | 'updated_at' | 'days_requested'>): Promise<CalendarRequest> {
    console.log('📅 HRCalendar: Creating request:', request.event_type);

    // Calculate business days
    const days_requested = await this.calculateBusinessDays(request.start_date, request.end_date);

    return supabaseRequest(() => supabase
      .from('calendar_requests')
      .insert({
        ...request,
        days_requested
      })
      .select()
      .single(), 'createCalendarRequest');
  },

  async updateRequest(id: string, updates: Partial<CalendarRequest>): Promise<CalendarRequest> {
    console.log('📅 HRCalendar: Updating request:', id);

    return supabaseRequest(() => supabase
      .from('calendar_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateCalendarRequest');
  },

  async approveRequest(id: string, reviewerId: string, comments?: string): Promise<CalendarRequest> {
    console.log('📅 HRCalendar: Approving request:', id);

    const request = await supabaseRequest(() => supabase
      .from('calendar_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        hr_approval: true,
        comments: comments
      })
      .eq('id', id)
      .select(`
        *,
        requester:profiles!inner(id, name, email)
      `)
      .single(), 'approveCalendarRequest');

    // Create calendar event
    await this.createEvent({
      type: request.event_type,
      title: `${request.event_type === 'ferias' ? 'Férias' : 'Day Off'} - ${request.requester.name}`,
      description: request.reason,
      start_date: request.start_date,
      end_date: request.end_date,
      all_day: true,
      category: request.event_type,
      status: 'confirmed',
      user_id: request.requester_id,
      is_public: true,
      color: request.event_type === 'ferias' ? '#F59E0B' : '#F97316',
      created_by: reviewerId
    });

    // Send notification
    await this.createNotification({
      request_id: id,
      user_id: request.requester_id,
      type: 'approval',
      title: `${request.event_type === 'ferias' ? 'Férias' : 'Day Off'} Aprovado!`,
      message: `Sua solicitação de ${request.event_type} de ${new Date(request.start_date).toLocaleDateString('pt-BR')} a ${new Date(request.end_date).toLocaleDateString('pt-BR')} foi aprovada.`
    });

    return request;
  },

  async rejectRequest(id: string, reviewerId: string, reason: string): Promise<CalendarRequest> {
    console.log('📅 HRCalendar: Rejecting request:', id);

    const request = await supabaseRequest(() => supabase
      .from('calendar_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', id)
      .select(`
        *,
        requester:profiles!inner(id, name, email)
      `)
      .single(), 'rejectCalendarRequest');

    // Send notification
    await this.createNotification({
      request_id: id,
      user_id: request.requester_id,
      type: 'approval',
      title: `${request.event_type === 'ferias' ? 'Férias' : 'Day Off'} Rejeitado`,
      message: `Sua solicitação foi rejeitada. Motivo: ${reason}`
    });

    return request;
  },

  // Validation Functions
  async checkVacationEligibility(profileId: string, startDate: string): Promise<VacationEligibility> {
    console.log('📅 HRCalendar: Checking vacation eligibility for:', profileId);

    try {
      const { data, error } = await supabase.rpc('check_vacation_eligibility', {
        profile_id: profileId,
        request_start_date: startDate
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('📅 HRCalendar: Error checking eligibility:', error);
      throw error;
    }
  },

  async validateVacationRequest(
    requesterId: string,
    startDate: string,
    endDate: string,
    daysRequested: number
  ): Promise<any> {
    console.log('📅 HRCalendar: Validating vacation request');

    try {
      const { data, error } = await supabase.rpc('validate_vacation_request', {
        requester_id: requesterId,
        start_date: startDate,
        end_date: endDate,
        days_requested: daysRequested
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('📅 HRCalendar: Error validating request:', error);
      throw error;
    }
  },

  async calculateBusinessDays(startDate: string, endDate: string): Promise<number> {
    console.log('📅 HRCalendar: Calculating business days');

    try {
      const { data, error } = await supabase.rpc('calculate_business_days', {
        start_date: startDate,
        end_date: endDate
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('📅 HRCalendar: Error calculating business days:', error);
      return 0;
    }
  },

  // Auto-generation Functions
  async createBirthdayEvents(): Promise<number> {
    console.log('📅 HRCalendar: Creating birthday events');

    try {
      const { data, error } = await supabase.rpc('create_birthday_events');
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('📅 HRCalendar: Error creating birthday events:', error);
      return 0;
    }
  },

  async createCompanyAnniversaryEvents(): Promise<number> {
    console.log('📅 HRCalendar: Creating company anniversary events');

    try {
      const { data, error } = await supabase.rpc('create_company_anniversary_events');
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('📅 HRCalendar: Error creating anniversary events:', error);
      return 0;
    }
  },

  // Settings Management
  async getSettings(): Promise<CalendarSettings> {
    console.log('📅 HRCalendar: Getting calendar settings');

    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settings: any = {};
      data?.forEach(setting => {
        const value = setting.setting_value;
        settings[setting.setting_key] = typeof value === 'string' ? value : value;
      });

      return {
        vacation_min_advance_days: parseInt(settings.vacation_min_advance_days) || 30,
        dayoff_min_advance_days: parseInt(settings.dayoff_min_advance_days) || 7,
        max_dayoff_per_year: parseInt(settings.max_dayoff_per_year) || 12,
        max_consecutive_dayoffs: parseInt(settings.max_consecutive_dayoffs) || 2,
        vacation_days_per_year: parseInt(settings.vacation_days_per_year) || 10,
        team_absence_limit: parseFloat(settings.team_absence_limit) || 0.3,
        auto_create_birthdays: settings.auto_create_birthdays === 'true',
        auto_create_anniversaries: settings.auto_create_anniversaries === 'true',
        notification_reminders: settings.notification_reminders === 'true',
        colors: {
          weekend: settings.weekend_color || '#9CA3AF',
          holiday: settings.holiday_color || '#EF4444',
          vacation: settings.vacation_color || '#F59E0B',
          birthday: settings.birthday_color || '#3B82F6',
          anniversary: settings.anniversary_color || '#10B981',
          event: settings.event_color || '#8B5CF6',
          dayoff: settings.dayoff_color || '#F97316'
        }
      };
    } catch (error) {
      console.error('📅 HRCalendar: Error getting settings:', error);
      return this.getDefaultSettings();
    }
  },

  getDefaultSettings(): CalendarSettings {
    return {
      vacation_min_advance_days: 30,
      dayoff_min_advance_days: 7,
      max_dayoff_per_year: 12,
      max_consecutive_dayoffs: 2,
      vacation_days_per_year: 10,
      team_absence_limit: 0.3,
      auto_create_birthdays: true,
      auto_create_anniversaries: true,
      notification_reminders: true,
      colors: {
        weekend: '#9CA3AF',
        holiday: '#EF4444',
        vacation: '#F59E0B',
        birthday: '#3B82F6',
        anniversary: '#10B981',
        event: '#8B5CF6',
        dayoff: '#F97316'
      }
    };
  },

  async updateSettings(settings: Partial<CalendarSettings>): Promise<void> {
    console.log('📅 HRCalendar: Updating settings');

    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));

    return supabaseRequest(() => supabase
      .from('calendar_settings')
      .upsert(updates), 'updateCalendarSettings');
  },

  // Statistics
  async getStats(): Promise<CalendarStats> {
    console.log('📅 HRCalendar: Getting calendar statistics');

    if (!supabase) {
      console.warn('📅 HRCalendar: Supabase not available');
      return {
        total_events: 0,
        pending_requests: 0,
        upcoming_birthdays: 0,
        upcoming_anniversaries: 0,
        team_absences_today: 0,
        vacation_requests_this_month: 0
      };
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      const [events, requests, todayAbsences] = await Promise.all([
        this.getEvents(),
        this.getRequests(),
        this.getEvents({
          start_date: today,
          end_date: today,
          type: 'ferias'
        })
      ]);

      const upcomingBirthdays = events.filter(e => 
        e.type === 'aniversario' && 
        new Date(e.start_date) >= new Date() &&
        new Date(e.start_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length;

      const upcomingAnniversaries = events.filter(e => 
        e.type === 'aniversario_empresa' && 
        new Date(e.start_date) >= new Date() &&
        new Date(e.start_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length;

      const vacationRequestsThisMonth = requests.filter(r =>
        r.event_type === 'ferias' &&
        r.created_at >= startOfMonth &&
        r.created_at <= endOfMonth
      ).length;

      return {
        total_events: events.length,
        pending_requests: requests.filter(r => r.status === 'pending').length,
        upcoming_birthdays: upcomingBirthdays,
        upcoming_anniversaries: upcomingAnniversaries,
        team_absences_today: todayAbsences.length,
        vacation_requests_this_month: vacationRequestsThisMonth
      };
    } catch (error) {
      console.error('📅 HRCalendar: Error getting stats:', error);
      return {
        total_events: 0,
        pending_requests: 0,
        upcoming_birthdays: 0,
        upcoming_anniversaries: 0,
        team_absences_today: 0,
        vacation_requests_this_month: 0
      };
    }
  },

  // Notifications
  async createNotification(notification: {
    event_id?: string;
    request_id?: string;
    user_id: string;
    type: 'reminder' | 'approval' | 'change' | 'birthday' | 'anniversary';
    title: string;
    message: string;
  }): Promise<void> {
    console.log('📅 HRCalendar: Creating notification');

    if (!supabase) {
      console.warn('📅 HRCalendar: Supabase not available, cannot create notification');
      return;
    }

    return supabaseRequest(() => supabase
      .from('calendar_notifications')
      .insert(notification), 'createCalendarNotification');
  },

  async getNotifications(userId: string, unreadOnly = false): Promise<any[]> {
    console.log('📅 HRCalendar: Getting notifications for user:', userId);

    let query = supabase
      .from('calendar_notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    return supabaseRequest(() => query.order('sent_at', { ascending: false }), 'getCalendarNotifications');
  },

  // Export Functions
  async exportToICS(filters?: any): Promise<string> {
    console.log('📅 HRCalendar: Exporting to ICS format');

    const events = await this.getEvents(filters);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TalentFlow//HR Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
      // Format dates for ICS (YYYYMMDD)
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
      };

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@talentflow.com`,
        `DTSTART;VALUE=DATE:${formatDate(startDate)}`,
        `DTEND;VALUE=DATE:${formatDate(new Date(endDate.getTime() + 24 * 60 * 60 * 1000))}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `CATEGORIES:${event.category}`,
        `STATUS:${event.status.toUpperCase()}`,
        `CREATED:${new Date(event.created_at).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `LAST-MODIFIED:${new Date(event.updated_at).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
  },

  async generateCalendarSubscriptionUrl(userId: string): Promise<string> {
    // In a real implementation, this would generate a secure subscription URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/calendar/subscribe/${userId}`;
  },

  // Utility Functions
  getEventTypeLabel(type: string): string {
    switch (type) {
      case 'aniversario': return 'Aniversário';
      case 'aniversario_empresa': return 'Aniversário de Empresa';
      case 'ferias': return 'Férias';
      case 'feriado': return 'Feriado';
      case 'evento': return 'Evento';
      case 'day_off': return 'Day Off';
      case 'ferias_coletivas': return 'Férias Coletivas';
      default: return type;
    }
  },

  getEventTypeColor(type: string): string {
    switch (type) {
      case 'aniversario': return '#3B82F6';
      case 'aniversario_empresa': return '#10B981';
      case 'ferias': return '#F59E0B';
      case 'feriado': return '#EF4444';
      case 'evento': return '#8B5CF6';
      case 'day_off': return '#F97316';
      case 'ferias_coletivas': return '#F59E0B';
      default: return '#6B7280';
    }
  },

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'confirmed': return 'Confirmado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  },

  getStatusColor(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'approved':
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'rejected':
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  },

  // Team Management
  async getTeamAbsences(teamId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    console.log('📅 HRCalendar: Getting team absences');

    return this.getEvents({
      start_date: startDate,
      end_date: endDate,
      team_id: teamId,
      type: 'ferias'
    });
  },

  async getUpcomingBirthdays(days = 30): Promise<CalendarEvent[]> {
    console.log('📅 HRCalendar: Getting upcoming birthdays');

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getEvents({
      start_date: new Date().toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      type: 'aniversario'
    });
  },

  async getUpcomingAnniversaries(days = 30): Promise<CalendarEvent[]> {
    console.log('📅 HRCalendar: Getting upcoming anniversaries');

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getEvents({
      start_date: new Date().toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      type: 'aniversario_empresa'
    });
  },

  // Bulk Operations
  async createHolidays(year: number, holidays: Array<{
    name: string;
    date: string;
    description?: string;
  }>): Promise<void> {
    console.log('📅 HRCalendar: Creating holidays for year:', year);

    const holidayEvents = holidays.map(holiday => ({
      type: 'feriado' as const,
      title: holiday.name,
      description: holiday.description || '',
      start_date: holiday.date,
      end_date: holiday.date,
      all_day: true,
      category: 'holiday',
      status: 'confirmed' as const,
      is_public: true,
      color: '#EF4444'
    }));

    return supabaseRequest(() => supabase
      .from('calendar_events')
      .insert(holidayEvents), 'createHolidays');
  },

  async createCollectiveVacation(
    title: string,
    startDate: string,
    endDate: string,
    description?: string
  ): Promise<CalendarEvent> {
    console.log('📅 HRCalendar: Creating collective vacation');

    return this.createEvent({
      type: 'ferias_coletivas',
      title,
      description: description || 'Férias coletivas da empresa',
      start_date: startDate,
      end_date: endDate,
      all_day: true,
      category: 'collective_vacation',
      status: 'confirmed',
      is_public: true,
      color: '#F59E0B'
    });
  }
};