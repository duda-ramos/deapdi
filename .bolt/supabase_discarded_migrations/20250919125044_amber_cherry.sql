/*
  # Sistema Completo de Mentoria

  1. New Tables
    - `mentorship_sessions` - Sessões de mentoria com agendamento
    - `mentor_ratings` - Avaliações de mentores
    - `session_slots` - Slots de horários disponíveis

  2. Enhancements
    - Status de sessões (agendada/realizada/cancelada)
    - Sistema de avaliação de mentores
    - Histórico completo de sessões
    - Agendamento com slots de tempo

  3. Security
    - Enable RLS on all new tables
    - Add policies for mentors and mentees
    - Protect sensitive mentor data
*/

-- Create enum for session status
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Update mentorship_sessions table with enhanced fields
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mentorship_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN status session_status DEFAULT 'scheduled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mentorship_sessions' AND column_name = 'scheduled_start'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN scheduled_start timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mentorship_sessions' AND column_name = 'scheduled_end'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN scheduled_end timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mentorship_sessions' AND column_name = 'meeting_link'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN meeting_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mentorship_sessions' AND column_name = 'session_notes'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN session_notes text;
  END IF;
END $$;

-- Create mentor ratings table
CREATE TABLE IF NOT EXISTS mentor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  mentee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(session_id, mentee_id)
);

-- Create session slots table for availability
CREATE TABLE IF NOT EXISTS session_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(mentor_id, day_of_week, start_time)
);

-- Enable RLS
ALTER TABLE mentor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_slots ENABLE ROW LEVEL SECURITY;

-- Policies for mentor_ratings
CREATE POLICY "Users can read own mentor ratings"
  ON mentor_ratings
  FOR SELECT
  TO authenticated
  USING (mentor_id = uid() OR mentee_id = uid());

CREATE POLICY "Mentees can create ratings"
  ON mentor_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (mentee_id = uid());

CREATE POLICY "Users can update own ratings"
  ON mentor_ratings
  FOR UPDATE
  TO authenticated
  USING (mentee_id = uid())
  WITH CHECK (mentee_id = uid());

-- Policies for session_slots
CREATE POLICY "Anyone can read session slots"
  ON session_slots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can manage own slots"
  ON session_slots
  FOR ALL
  TO authenticated
  USING (mentor_id = uid())
  WITH CHECK (mentor_id = uid());

-- Enhanced policies for mentorship_sessions
DROP POLICY IF EXISTS "Users can create mentorship sessions" ON mentorship_sessions;
DROP POLICY IF EXISTS "Users can read own mentorship sessions" ON mentorship_sessions;
DROP POLICY IF EXISTS "Users can update own mentorship sessions" ON mentorship_sessions;

CREATE POLICY "Users can manage own mentorship sessions"
  ON mentorship_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentorships m
      WHERE m.id = mentorship_sessions.mentorship_id
      AND (m.mentor_id = uid() OR m.mentee_id = uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mentorships m
      WHERE m.id = mentorship_sessions.mentorship_id
      AND (m.mentor_id = uid() OR m.mentee_id = uid())
    )
  );

-- Function to get mentor average rating
CREATE OR REPLACE FUNCTION get_mentor_average_rating(mentor_profile_id uuid)
RETURNS numeric AS $$
DECLARE
  avg_rating numeric;
BEGIN
  SELECT AVG(rating)::numeric(3,2)
  INTO avg_rating
  FROM mentor_ratings
  WHERE mentor_id = mentor_profile_id;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mentor total sessions
CREATE OR REPLACE FUNCTION get_mentor_total_sessions(mentor_profile_id uuid)
RETURNS integer AS $$
DECLARE
  total_sessions integer;
BEGIN
  SELECT COUNT(*)
  INTO total_sessions
  FROM mentorship_sessions ms
  JOIN mentorships m ON m.id = ms.mentorship_id
  WHERE m.mentor_id = mentor_profile_id
  AND ms.status = 'completed';
  
  RETURN COALESCE(total_sessions, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete session and trigger rating
CREATE OR REPLACE FUNCTION complete_mentorship_session(
  session_id uuid,
  session_notes_param text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  session_record mentorship_sessions%ROWTYPE;
  mentorship_record mentorships%ROWTYPE;
BEGIN
  -- Get session details
  SELECT * INTO session_record
  FROM mentorship_sessions
  WHERE id = session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- Get mentorship details
  SELECT * INTO mentorship_record
  FROM mentorships
  WHERE id = session_record.mentorship_id;
  
  -- Update session status
  UPDATE mentorship_sessions
  SET 
    status = 'completed',
    session_notes = COALESCE(session_notes_param, session_notes)
  WHERE id = session_id;
  
  -- Create notification for mentee to rate mentor
  INSERT INTO notifications (profile_id, title, message, type, action_url)
  VALUES (
    mentorship_record.mentee_id,
    'Avalie seu Mentor',
    'Sua sessão de mentoria foi concluída. Avalie a experiência para ajudar outros colegas.',
    'info',
    '/mentorship/rate/' || session_id
  );
  
  -- Log the completion
  RAISE NOTICE 'Session % completed successfully', session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule session
CREATE OR REPLACE FUNCTION schedule_mentorship_session(
  mentorship_id_param uuid,
  scheduled_start_param timestamptz,
  duration_minutes_param integer DEFAULT 60,
  meeting_link_param text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_session_id uuid;
  mentorship_record mentorships%ROWTYPE;
BEGIN
  -- Get mentorship details
  SELECT * INTO mentorship_record
  FROM mentorships
  WHERE id = mentorship_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship not found';
  END IF;
  
  -- Create session
  INSERT INTO mentorship_sessions (
    mentorship_id,
    session_date,
    duration_minutes,
    scheduled_start,
    scheduled_end,
    meeting_link,
    status,
    topics_discussed,
    action_items
  ) VALUES (
    mentorship_id_param,
    scheduled_start_param::date,
    duration_minutes_param,
    scheduled_start_param,
    scheduled_start_param + (duration_minutes_param || ' minutes')::interval,
    meeting_link_param,
    'scheduled',
    '',
    ''
  ) RETURNING id INTO new_session_id;
  
  -- Notify both mentor and mentee
  INSERT INTO notifications (profile_id, title, message, type, action_url)
  VALUES 
    (
      mentorship_record.mentor_id,
      'Nova Sessão Agendada',
      'Uma sessão de mentoria foi agendada para ' || to_char(scheduled_start_param, 'DD/MM/YYYY às HH24:MI'),
      'info',
      '/mentorship/sessions/' || new_session_id
    ),
    (
      mentorship_record.mentee_id,
      'Sessão Confirmada',
      'Sua sessão de mentoria foi confirmada para ' || to_char(scheduled_start_param, 'DD/MM/YYYY às HH24:MI'),
      'success',
      '/mentorship/sessions/' || new_session_id
    );
  
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample courses with modules
INSERT INTO courses (title, description, category, level, duration_minutes, instructor, points, competency_mappings, is_active) VALUES
('React Avançado', 'Domine conceitos avançados do React incluindo hooks, context e performance', 'technical', 'advanced', 300, 'Ana Silva', 150, '[{"competency": "React", "rating_boost": 1.0}, {"competency": "JavaScript", "rating_boost": 0.5}]', true),
('Liderança Eficaz', 'Desenvolva habilidades de liderança e gestão de equipes', 'leadership', 'intermediate', 240, 'Carlos Santos', 200, '[{"competency": "Liderança", "rating_boost": 1.0}, {"competency": "Gestão de Equipes", "rating_boost": 0.8}]', true),
('TypeScript Fundamentals', 'Aprenda TypeScript do básico ao avançado', 'technical', 'beginner', 180, 'Maria Costa', 120, '[{"competency": "TypeScript", "rating_boost": 1.0}, {"competency": "JavaScript", "rating_boost": 0.3}]', true),
('Comunicação Assertiva', 'Melhore suas habilidades de comunicação no ambiente corporativo', 'soft-skills', 'beginner', 90, 'João Oliveira', 100, '[{"competency": "Comunicação", "rating_boost": 1.0}]', true),
('LGPD na Prática', 'Entenda e aplique a Lei Geral de Proteção de Dados', 'compliance', 'intermediate', 120, 'Dra. Patricia Lima', 80, '[{"competency": "Compliance", "rating_boost": 1.0}]', true),
('Metodologias Ágeis', 'Scrum, Kanban e outras metodologias para gestão de projetos', 'technical', 'intermediate', 210, 'Roberto Ferreira', 130, '[{"competency": "Scrum", "rating_boost": 1.0}, {"competency": "Gestão de Projetos", "rating_boost": 0.7}]', true)
ON CONFLICT (title) DO NOTHING;

-- Insert course modules
DO $$
DECLARE
  react_course_id uuid;
  leadership_course_id uuid;
  typescript_course_id uuid;
  communication_course_id uuid;
  lgpd_course_id uuid;
  agile_course_id uuid;
BEGIN
  -- Get course IDs
  SELECT id INTO react_course_id FROM courses WHERE title = 'React Avançado';
  SELECT id INTO leadership_course_id FROM courses WHERE title = 'Liderança Eficaz';
  SELECT id INTO typescript_course_id FROM courses WHERE title = 'TypeScript Fundamentals';
  SELECT id INTO communication_course_id FROM courses WHERE title = 'Comunicação Assertiva';
  SELECT id INTO lgpd_course_id FROM courses WHERE title = 'LGPD na Prática';
  SELECT id INTO agile_course_id FROM courses WHERE title = 'Metodologias Ágeis';

  -- React Avançado modules
  IF react_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index, is_required) VALUES
    (react_course_id, 'Hooks Avançados', 'useCallback, useMemo, useReducer e hooks customizados', 'video', 60, 1, true),
    (react_course_id, 'Context API e State Management', 'Gerenciamento de estado global com Context', 'video', 45, 2, true),
    (react_course_id, 'Performance e Otimização', 'React.memo, lazy loading e code splitting', 'video', 75, 3, true),
    (react_course_id, 'Testing com React Testing Library', 'Testes unitários e de integração', 'video', 60, 4, true),
    (react_course_id, 'Projeto Prático', 'Desenvolva uma aplicação completa', 'assignment', 60, 5, true)
    ON CONFLICT (course_id, order_index) DO NOTHING;
  END IF;

  -- Liderança Eficaz modules
  IF leadership_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index, is_required) VALUES
    (leadership_course_id, 'Fundamentos da Liderança', 'Estilos de liderança e autoconhecimento', 'video', 60, 1, true),
    (leadership_course_id, 'Comunicação de Líderes', 'Feedback, delegação e comunicação eficaz', 'video', 60, 2, true),
    (leadership_course_id, 'Gestão de Conflitos', 'Resolução de conflitos e negociação', 'video', 60, 3, true),
    (leadership_course_id, 'Desenvolvimento de Equipes', 'Motivação, engajamento e desenvolvimento', 'video', 60, 4, true)
    ON CONFLICT (course_id, order_index) DO NOTHING;
  END IF;

  -- TypeScript modules
  IF typescript_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index, is_required) VALUES
    (typescript_course_id, 'Introdução ao TypeScript', 'Tipos básicos, interfaces e configuração', 'video', 30, 1, true),
    (typescript_course_id, 'Tipos Avançados', 'Generics, utility types e conditional types', 'video', 45, 2, true),
    (typescript_course_id, 'Classes e Decorators', 'OOP em TypeScript', 'video', 30, 3, true),
    (typescript_course_id, 'Módulos e Namespaces', 'Organização de código', 'video', 30, 4, true),
    (typescript_course_id, 'Projeto Final', 'Aplicação TypeScript completa', 'assignment', 45, 5, true)
    ON CONFLICT (course_id, order_index) DO NOTHING;
  END IF;

  -- Communication modules
  IF communication_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index, is_required) VALUES
    (communication_course_id, 'Comunicação Assertiva', 'Técnicas de comunicação clara e direta', 'video', 30, 1, true),
    (communication_course_id, 'Apresentações Eficazes', 'Como fazer apresentações impactantes', 'video', 30, 2, true),
    (communication_course_id, 'Escuta Ativa', 'Técnicas de escuta e empatia', 'video', 30, 3, true)
    ON CONFLICT (course_id, order_index) DO NOTHING;
  END IF;

  -- LGPD modules
  IF lgpd_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index, is_required) VALUES
    (lgpd_course_id, 'Fundamentos da LGPD', 'Lei, princípios e aplicação', 'video', 40, 1, true),
    (lgpd_course_id, 'Implementação Prática', 'Como aplicar na empresa', 'video', 40, 2, true),
    (lgpd_course_id, 'Casos Práticos', 'Estudos de caso e exemplos', 'video', 40, 3, true)
    ON CONFLICT (course_id, order_index) DO NOTHING;
  END IF;

  -- Agile modules
  IF agile_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index, is_required) VALUES
    (agile_course_id, 'Introdução ao Scrum', 'Framework Scrum e papéis', 'video', 45, 1, true),
    (agile_course_id, 'Kanban e Lean', 'Metodologia Kanban e princípios Lean', 'video', 45, 2, true),
    (agile_course_id, 'Ferramentas Ágeis', 'Jira, Trello e outras ferramentas', 'video', 60, 3, true),
    (agile_course_id, 'Implementação Prática', 'Como implementar metodologias ágeis', 'video', 60, 4, true)
    ON CONFLICT (course_id, order_index) DO NOTHING;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS mentor_ratings_mentor_id_idx ON mentor_ratings(mentor_id);
CREATE INDEX IF NOT EXISTS mentor_ratings_session_id_idx ON mentor_ratings(session_id);
CREATE INDEX IF NOT EXISTS session_slots_mentor_id_idx ON session_slots(mentor_id);
CREATE INDEX IF NOT EXISTS session_slots_day_time_idx ON session_slots(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS mentorship_sessions_status_idx ON mentorship_sessions(status);
CREATE INDEX IF NOT EXISTS mentorship_sessions_scheduled_start_idx ON mentorship_sessions(scheduled_start);

-- Insert sample session slots for mentors
INSERT INTO session_slots (mentor_id, day_of_week, start_time, end_time, is_available)
SELECT 
  p.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00'::time + (generate_series(0, 8) * interval '1 hour') as start_time,
  '09:00'::time + (generate_series(1, 9) * interval '1 hour') as end_time,
  true
FROM profiles p
WHERE p.role IN ('manager', 'admin')
AND p.status = 'active'
ON CONFLICT (mentor_id, day_of_week, start_time) DO NOTHING;