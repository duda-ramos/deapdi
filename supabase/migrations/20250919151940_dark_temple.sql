/*
  # Create Mental Health Module Tables

  1. New Tables
    - `emotional_checkins` - Daily emotional check-ins by employees
    - `therapeutic_activities` - Available therapeutic activities and resources
    - `wellness_resources` - Wellness resources and materials
    - `psychology_sessions` - Psychology sessions scheduling and tracking
    - `psychological_forms` - Form templates for psychological assessments
    - `form_responses` - Employee responses to psychological forms
    - `mental_health_alerts` - System alerts for mental health concerns

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for employee privacy and HR access
    - Ensure data protection for sensitive mental health information

  3. Features
    - Support for daily emotional tracking
    - Therapeutic activity management
    - Psychology session scheduling
    - Form-based assessments
    - Alert system for mental health concerns
*/

-- Emotional Check-ins Table
CREATE TABLE IF NOT EXISTS emotional_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  mood_rating integer NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 10),
  stress_level integer NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level integer NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, checkin_date)
);

-- Therapeutic Activities Table
CREATE TABLE IF NOT EXISTS therapeutic_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  duration_minutes integer DEFAULT 15,
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  instructions text,
  benefits text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Wellness Resources Table
CREATE TABLE IF NOT EXISTS wellness_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  resource_type text NOT NULL DEFAULT 'article' CHECK (resource_type IN ('article', 'video', 'audio', 'pdf', 'link')),
  category text NOT NULL DEFAULT 'general',
  content_url text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Psychological Forms Table
CREATE TABLE IF NOT EXISTS psychological_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  form_type text NOT NULL DEFAULT 'assessment' CHECK (form_type IN ('assessment', 'screening', 'feedback', 'survey')),
  questions jsonb NOT NULL DEFAULT '[]',
  scoring_rules jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Psychology Sessions Table
CREATE TABLE IF NOT EXISTS psychology_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  psychologist_id uuid REFERENCES profiles(id),
  session_type text DEFAULT 'individual' CHECK (session_type IN ('individual', 'group', 'assessment')),
  scheduled_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes text,
  confidential_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Form Responses Table
CREATE TABLE IF NOT EXISTS form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES psychological_forms(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}',
  score numeric,
  interpretation text,
  status text DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mental Health Alerts Table
CREATE TABLE IF NOT EXISTS mental_health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('low_mood', 'high_stress', 'concerning_response', 'missed_sessions')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  triggered_by text, -- What triggered the alert (e.g., 'checkin', 'form_response')
  metadata jsonb DEFAULT '{}',
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES profiles(id),
  acknowledged_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE emotional_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_alerts ENABLE ROW LEVEL SECURITY;

-- Emotional Check-ins Policies
CREATE POLICY "Employees can manage own checkins"
  ON emotional_checkins
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "HR can read all checkins"
  ON emotional_checkins
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Therapeutic Activities Policies
CREATE POLICY "Users can read active activities"
  ON therapeutic_activities
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "HR can manage activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Wellness Resources Policies
CREATE POLICY "Users can read active resources"
  ON wellness_resources
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "HR can manage resources"
  ON wellness_resources
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Psychological Forms Policies
CREATE POLICY "Users can read active forms"
  ON psychological_forms
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "HR can manage forms"
  ON psychological_forms
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Psychology Sessions Policies
CREATE POLICY "Employees can manage own sessions"
  ON psychology_sessions
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Psychologists can manage assigned sessions"
  ON psychology_sessions
  FOR ALL
  TO authenticated
  USING (psychologist_id = auth.uid())
  WITH CHECK (psychologist_id = auth.uid());

CREATE POLICY "HR can read all sessions"
  ON psychology_sessions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Form Responses Policies
CREATE POLICY "Employees can manage own responses"
  ON form_responses
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "HR can read all responses"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "HR can review responses"
  ON form_responses
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Mental Health Alerts Policies
CREATE POLICY "HR can manage all alerts"
  ON mental_health_alerts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hr', 'admin')
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS emotional_checkins_employee_date_idx ON emotional_checkins(employee_id, checkin_date);
CREATE INDEX IF NOT EXISTS psychology_sessions_employee_idx ON psychology_sessions(employee_id);
CREATE INDEX IF NOT EXISTS psychology_sessions_psychologist_idx ON psychology_sessions(psychologist_id);
CREATE INDEX IF NOT EXISTS form_responses_employee_idx ON form_responses(employee_id);
CREATE INDEX IF NOT EXISTS form_responses_form_idx ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS mental_health_alerts_employee_idx ON mental_health_alerts(employee_id);
CREATE INDEX IF NOT EXISTS mental_health_alerts_severity_idx ON mental_health_alerts(severity);

-- Insert some sample therapeutic activities
INSERT INTO therapeutic_activities (title, description, category, duration_minutes, difficulty_level, instructions, benefits) VALUES
('Deep Breathing Exercise', 'A simple breathing technique to reduce stress and anxiety', 'breathing', 5, 'beginner', 'Sit comfortably, breathe in for 4 counts, hold for 4, exhale for 6. Repeat 10 times.', 'Reduces stress, lowers heart rate, improves focus'),
('Progressive Muscle Relaxation', 'Systematic tensing and relaxing of muscle groups', 'relaxation', 15, 'beginner', 'Start with your toes, tense for 5 seconds, then relax. Work your way up through each muscle group.', 'Reduces physical tension, improves sleep quality'),
('Mindfulness Meditation', 'Present-moment awareness practice', 'mindfulness', 10, 'intermediate', 'Sit quietly, focus on your breath. When thoughts arise, acknowledge them and return focus to breathing.', 'Improves emotional regulation, reduces anxiety'),
('Gratitude Journaling', 'Writing down things you are grateful for', 'journaling', 10, 'beginner', 'Write down 3-5 things you are grateful for today. Be specific and reflect on why you appreciate them.', 'Improves mood, increases life satisfaction');

-- Insert some sample wellness resources
INSERT INTO wellness_resources (title, description, resource_type, category, content_url, tags) VALUES
('Understanding Workplace Stress', 'Comprehensive guide to identifying and managing workplace stress', 'article', 'stress-management', 'https://example.com/workplace-stress', ARRAY['stress', 'workplace', 'management']),
('Meditation for Beginners', 'Introduction to meditation practices for mental wellness', 'video', 'mindfulness', 'https://example.com/meditation-video', ARRAY['meditation', 'mindfulness', 'beginner']),
('Sleep Hygiene Tips', 'Best practices for improving sleep quality', 'article', 'sleep', 'https://example.com/sleep-tips', ARRAY['sleep', 'health', 'wellness']);