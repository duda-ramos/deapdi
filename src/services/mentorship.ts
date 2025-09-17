import { supabase } from '../lib/supabase';
import { Profile, PDI } from '../types';

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
  created_at: string;
}

export const mentorshipService = {
  async getMentorships(profileId: string, role: 'mentor' | 'mentee' | 'both' = 'both') {
    let query = supabase
      .from('mentorships')
      .select(`
        *,
        mentor:profiles!mentor_id(id, name, position, avatar_url),
        mentee:profiles!mentee_id(id, name, position, avatar_url)
      `);

    if (role === 'mentor') {
      query = query.eq('mentor_id', profileId);
    } else if (role === 'mentee') {
      query = query.eq('mentee_id', profileId);
    } else {
      query = query.or(`mentor_id.eq.${profileId},mentee_id.eq.${profileId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createMentorship(mentorId: string, menteeId: string, notes?: string) {
    const { data, error } = await supabase
      .from('mentorships')
      .insert({
        mentor_id: mentorId,
        mentee_id: menteeId,
        status: 'active',
        started_at: new Date().toISOString(),
        notes: notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMentorshipStatus(id: string, status: MentorshipRelation['status']) {
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('mentorships')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSessions(mentorshipId: string) {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('mentorship_id', mentorshipId)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createSession(session: Omit<MentorshipSession, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSession(id: string, updates: Partial<MentorshipSession>) {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAvailableMentors(competencyArea?: string) {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        competencies(name, manager_rating),
        mentorships_as_mentor:mentorships!mentor_id(id, status)
      `)
      .in('role', ['manager', 'admin'])
      .eq('status', 'active');

    const { data, error } = await query;
    if (error) throw error;

    // Filter mentors based on competency area if specified
    if (competencyArea && data) {
      return data.filter(mentor => 
        mentor.competencies?.some((comp: any) => 
          comp.name.toLowerCase().includes(competencyArea.toLowerCase()) &&
          (comp.manager_rating || 0) >= 4
        )
      );
    }

    return data;
  },

  async requestMentorship(menteeId: string, mentorId: string, message: string) {
    // Create a notification for the mentor
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        profile_id: mentorId,
        title: 'Nova Solicitação de Mentoria',
        message: `Você recebeu uma solicitação de mentoria. Mensagem: ${message}`,
        type: 'info',
        action_url: `/mentorship/requests`
      });

    if (notificationError) throw notificationError;

    // Create pending mentorship request (you might want a separate table for this)
    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert({
        mentor_id: mentorId,
        mentee_id: menteeId,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};