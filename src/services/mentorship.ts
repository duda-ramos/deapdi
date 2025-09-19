import { supabase } from '../lib/supabase';
import { supabaseRequest } from './api';
import { Profile } from '../types';

export interface MentorshipRelation {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'active' | 'completed' | 'paused';
  started_at: string;
  ended_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  mentor?: Profile;
  mentee?: Profile;
}

export interface MentorshipSession {
  id: string;
  mentorship_id: string;
  session_date: string;
  duration_minutes: number;
  topics_discussed: string;
  action_items: string;
  mentor_feedback?: string;
  mentee_feedback?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  scheduled_start?: string;
  scheduled_end?: string;
  meeting_link?: string;
  session_notes?: string;
  created_at: string;
}

export interface MentorRating {
  id: string;
  session_id: string;
  mentor_id: string;
  mentee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface SessionSlot {
  id: string;
  mentor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface MentorWithStats extends Profile {
  average_rating: number;
  total_sessions: number;
  available_slots: SessionSlot[];
}

export interface ScheduleSessionData {
  mentorship_id: string;
  scheduled_start: string;
  duration_minutes: number;
  meeting_link?: string;
}

export const mentorshipService = {
  // Mentorship Management
  async getMentorships(profileId: string, role: 'mentor' | 'mentee' | 'both' = 'both'): Promise<MentorshipRelation[]> {
    console.log('🤝 Mentorship: Getting mentorships for profile:', profileId, 'role:', role);

    let query = supabase
      .from('mentorships')
      .select(`
        *,
        mentor:profiles!mentor_id(id, name, position, avatar_url, email),
        mentee:profiles!mentee_id(id, name, position, avatar_url, email)
      `);

    if (role === 'mentor') {
      query = query.eq('mentor_id', profileId);
    } else if (role === 'mentee') {
      query = query.eq('mentee_id', profileId);
    } else {
      query = query.or(`mentor_id.eq.${profileId},mentee_id.eq.${profileId}`);
    }

    return supabaseRequest(() => query.order('created_at', { ascending: false }), 'getMentorships');
  },

  async createMentorship(mentorId: string, menteeId: string, notes?: string): Promise<MentorshipRelation> {
    console.log('🤝 Mentorship: Creating mentorship:', { mentorId, menteeId });

    return supabaseRequest(() => supabase
      .from('mentorships')
      .insert({
        mentor_id: mentorId,
        mentee_id: menteeId,
        status: 'active',
        started_at: new Date().toISOString(),
        notes: notes
      })
      .select()
      .single(), 'createMentorship');
  },

  async updateMentorshipStatus(id: string, status: MentorshipRelation['status']): Promise<MentorshipRelation> {
    console.log('🤝 Mentorship: Updating mentorship status:', { id, status });

    const updates: any = { status };
    
    if (status === 'completed') {
      updates.ended_at = new Date().toISOString();
    }

    return supabaseRequest(() => supabase
      .from('mentorships')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateMentorshipStatus');
  },

  // Session Management
  async getSessions(mentorshipId: string): Promise<MentorshipSession[]> {
    console.log('🤝 Mentorship: Getting sessions for mentorship:', mentorshipId);

    return supabaseRequest(() => supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('mentorship_id', mentorshipId)
      .order('scheduled_start', { ascending: false }), 'getMentorshipSessions');
  },

  async scheduleSession(sessionData: ScheduleSessionData): Promise<string> {
    console.log('🤝 Mentorship: Scheduling session:', sessionData);

    try {
      const { data, error } = await supabase.rpc('schedule_mentorship_session', {
        mentorship_id_param: sessionData.mentorship_id,
        scheduled_start_param: sessionData.scheduled_start,
        duration_minutes_param: sessionData.duration_minutes,
        meeting_link_param: sessionData.meeting_link
      });

      if (error) {
        console.error('🤝 Mentorship: Error scheduling session:', error);
        throw error;
      }

      console.log('🤝 Mentorship: Session scheduled successfully:', data);
      return data;
    } catch (error) {
      console.error('🤝 Mentorship: Critical error scheduling session:', error);
      throw error;
    }
  },

  async completeSession(sessionId: string, sessionNotes?: string): Promise<void> {
    console.log('🤝 Mentorship: Completing session:', sessionId);

    try {
      const { error } = await supabase.rpc('complete_mentorship_session', {
        session_id: sessionId,
        session_notes_param: sessionNotes
      });

      if (error) {
        console.error('🤝 Mentorship: Error completing session:', error);
        throw error;
      }

      console.log('🤝 Mentorship: Session completed successfully');
    } catch (error) {
      console.error('🤝 Mentorship: Critical error completing session:', error);
      throw error;
    }
  },

  async updateSession(id: string, updates: Partial<MentorshipSession>): Promise<MentorshipSession> {
    console.log('🤝 Mentorship: Updating session:', id, updates);

    return supabaseRequest(() => supabase
      .from('mentorship_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single(), 'updateMentorshipSession');
  },

  async cancelSession(sessionId: string, reason?: string): Promise<void> {
    console.log('🤝 Mentorship: Cancelling session:', sessionId);

    await this.updateSession(sessionId, {
      status: 'cancelled',
      session_notes: reason ? `Cancelado: ${reason}` : 'Sessão cancelada'
    });
  },

  // Mentor Management
  async getAvailableMentors(): Promise<MentorWithStats[]> {
    console.log('🤝 Mentorship: Getting available mentors');

    try {
      const { data: mentors, error } = await supabase
        .from('profiles')
        .select(`
          *,
          available_slots:session_slots(*)
        `)
        .in('role', ['manager', 'admin'])
        .eq('status', 'active');

      if (error) {
        console.error('🤝 Mentorship: Error fetching mentors:', error);
        throw error;
      }

      // Get ratings and session counts for each mentor
      const mentorsWithStats = await Promise.all(
        (mentors || []).map(async (mentor) => {
          const [ratingResult, sessionsResult] = await Promise.all([
            supabase.rpc('get_mentor_average_rating', { mentor_profile_id: mentor.id }),
            supabase.rpc('get_mentor_total_sessions', { mentor_profile_id: mentor.id })
          ]);

          return {
            ...mentor,
            average_rating: ratingResult.data || 0,
            total_sessions: sessionsResult.data || 0,
            available_slots: mentor.available_slots || []
          };
        })
      );

      console.log('🤝 Mentorship: Mentors with stats loaded:', mentorsWithStats.length);
      return mentorsWithStats;
    } catch (error) {
      console.error('🤝 Mentorship: Critical error getting mentors:', error);
      throw error;
    }
  },

  async getMentorAvailableSlots(mentorId: string, date: string): Promise<SessionSlot[]> {
    console.log('🤝 Mentorship: Getting available slots for mentor:', mentorId, 'on date:', date);

    const dayOfWeek = new Date(date).getDay();

    return supabaseRequest(() => supabase
      .from('session_slots')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .order('start_time'), 'getMentorAvailableSlots');
  },

  async setMentorAvailability(mentorId: string, slots: Omit<SessionSlot, 'id' | 'mentor_id'>[]): Promise<void> {
    console.log('🤝 Mentorship: Setting mentor availability:', mentorId);

    try {
      // Delete existing slots
      await supabase
        .from('session_slots')
        .delete()
        .eq('mentor_id', mentorId);

      // Insert new slots
      const slotsToInsert = slots.map(slot => ({
        ...slot,
        mentor_id: mentorId
      }));

      const { error } = await supabase
        .from('session_slots')
        .insert(slotsToInsert);

      if (error) throw error;

      console.log('🤝 Mentorship: Availability updated successfully');
    } catch (error) {
      console.error('🤝 Mentorship: Error setting availability:', error);
      throw error;
    }
  },

  // Rating System
  async rateMentor(sessionId: string, mentorId: string, menteeId: string, rating: number, comment?: string): Promise<MentorRating> {
    console.log('🤝 Mentorship: Rating mentor:', { sessionId, mentorId, rating });

    return supabaseRequest(() => supabase
      .from('mentor_ratings')
      .insert({
        session_id: sessionId,
        mentor_id: mentorId,
        mentee_id: menteeId,
        rating: rating,
        comment: comment
      })
      .select()
      .single(), 'rateMentor');
  },

  async getMentorRatings(mentorId: string): Promise<MentorRating[]> {
    console.log('🤝 Mentorship: Getting ratings for mentor:', mentorId);

    return supabaseRequest(() => supabase
      .from('mentor_ratings')
      .select(`
        *,
        mentee:profiles!mentee_id(name, avatar_url),
        session:mentorship_sessions(session_date, topics_discussed)
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false }), 'getMentorRatings');
  },

  async getSessionRating(sessionId: string): Promise<MentorRating | null> {
    console.log('🤝 Mentorship: Getting rating for session:', sessionId);

    try {
      const { data, error } = await supabase
        .from('mentor_ratings')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('🤝 Mentorship: Error getting session rating:', error);
      return null;
    }
  },

  // Request System
  async requestMentorship(menteeId: string, mentorId: string, message: string): Promise<void> {
    console.log('🤝 Mentorship: Requesting mentorship:', { menteeId, mentorId });

    try {
      // Create mentorship request
      const { error: requestError } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: mentorId,
          mentee_id: menteeId,
          message: message,
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Create notification for mentor
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          profile_id: mentorId,
          title: 'Nova Solicitação de Mentoria',
          message: `Você recebeu uma solicitação de mentoria. Mensagem: ${message}`,
          type: 'info',
          action_url: '/mentorship/requests'
        });

      if (notificationError) throw notificationError;

      console.log('🤝 Mentorship: Request sent successfully');
    } catch (error) {
      console.error('🤝 Mentorship: Error requesting mentorship:', error);
      throw error;
    }
  },

  async respondToRequest(requestId: string, response: 'accepted' | 'rejected', notes?: string): Promise<void> {
    console.log('🤝 Mentorship: Responding to request:', { requestId, response });

    try {
      // Update request status
      const { data: request, error: updateError } = await supabase
        .from('mentorship_requests')
        .update({ status: response })
        .eq('id', requestId)
        .select('mentor_id, mentee_id')
        .single();

      if (updateError) throw updateError;

      if (response === 'accepted') {
        // Create mentorship relationship
        await this.createMentorship(request.mentor_id, request.mentee_id, notes);
      }

      // Notify mentee
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          profile_id: request.mentee_id,
          title: response === 'accepted' ? 'Mentoria Aceita!' : 'Solicitação Recusada',
          message: response === 'accepted' 
            ? 'Sua solicitação de mentoria foi aceita! Você já pode agendar sessões.'
            : 'Sua solicitação de mentoria foi recusada. Tente com outro mentor.',
          type: response === 'accepted' ? 'success' : 'warning',
          action_url: '/mentorship'
        });

      if (notificationError) throw notificationError;

      console.log('🤝 Mentorship: Request response sent successfully');
    } catch (error) {
      console.error('🤝 Mentorship: Error responding to request:', error);
      throw error;
    }
  },

  // Utility Functions
  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek];
  },

  formatTime(time: string): string {
    return time.substring(0, 5); // HH:MM format
  },

  getNextAvailableSlots(mentor: MentorWithStats, daysAhead = 7): Array<{date: string, slots: SessionSlot[]}> {
    const result = [];
    const today = new Date();

    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const availableSlots = mentor.available_slots.filter(slot => 
        slot.day_of_week === dayOfWeek && slot.is_available
      );

      if (availableSlots.length > 0) {
        result.push({
          date: date.toISOString().split('T')[0],
          slots: availableSlots
        });
      }
    }

    return result;
  },

  // Statistics
  async getMentorshipStats(profileId: string): Promise<{
    as_mentor: { total: number; active: number; completed: number };
    as_mentee: { total: number; active: number; completed: number };
    total_sessions: number;
    average_rating_given: number;
    average_rating_received: number;
  }> {
    console.log('🤝 Mentorship: Getting mentorship stats for:', profileId);

    try {
      const [mentorships, sessions, ratingsGiven, ratingsReceived] = await Promise.all([
        this.getMentorships(profileId, 'both'),
        supabase
          .from('mentorship_sessions')
          .select('status')
          .or(`mentorship_id.in.(${await this.getUserMentorshipIds(profileId)})`),
        supabase
          .from('mentor_ratings')
          .select('rating')
          .eq('mentee_id', profileId),
        supabase
          .from('mentor_ratings')
          .select('rating')
          .eq('mentor_id', profileId)
      ]);

      const asMentor = mentorships.filter(m => m.mentor_id === profileId);
      const asMentee = mentorships.filter(m => m.mentee_id === profileId);

      return {
        as_mentor: {
          total: asMentor.length,
          active: asMentor.filter(m => m.status === 'active').length,
          completed: asMentor.filter(m => m.status === 'completed').length
        },
        as_mentee: {
          total: asMentee.length,
          active: asMentee.filter(m => m.status === 'active').length,
          completed: asMentee.filter(m => m.status === 'completed').length
        },
        total_sessions: sessions.data?.filter(s => s.status === 'completed').length || 0,
        average_rating_given: this.calculateAverageRating(ratingsGiven.data || []),
        average_rating_received: this.calculateAverageRating(ratingsReceived.data || [])
      };
    } catch (error) {
      console.error('🤝 Mentorship: Error getting stats:', error);
      throw error;
    }
  },

  // Helper Functions
  async getUserMentorshipIds(profileId: string): Promise<string> {
    try {
      const { data } = await supabase
        .from('mentorships')
        .select('id')
        .or(`mentor_id.eq.${profileId},mentee_id.eq.${profileId}`);

      const ids = data?.map(m => m.id) || [];
      return ids.length > 0 ? ids.join(',') : '';
    } catch (error) {
      console.error('🤝 Mentorship: Error getting mentorship IDs:', error);
      return '';
    }
  },

  calculateAverageRating(ratings: Array<{rating: number}>): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
  }
};