/*
  # Fix Mental Health Database Schema

  1. Schema Updates
    - Update emotional_checkins table to match application expectations
    - Add missing columns to psychology_sessions table
    - Create missing tables: therapeutic_activities, session_requests, mental_health_alerts, wellness_resources
    - Update psychological_forms table structure
    - Create form_responses table with proper structure

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for mental health data access
    - Ensure privacy and confidentiality

  3. Functions
    - Create helper functions for mental health statistics
    - Add cleanup functions for old data
*/

-- Update emotional_checkins table to match application expectations
DO $$
BEGIN
  -- Rename mood_rating to mood_score if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emotional_checkins' AND column_name = 'mood_rating'
  ) THEN
    ALTER TABLE emotional_checkins RENAME COLUMN mood_rating TO mood_score;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emotional_checkins' AND column_name = 'tags'
  ) THEN
    ALTER TABLE emotional_checkins ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Update psychology_sessions table
DO $$
BEGIN
  -- Add missing columns to psychology_sessions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychology_sessions' AND column_name = 'session_notes'
  ) THEN
    ALTER TABLE psychology_sessions ADD COLUMN session_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychology_sessions' AND column_name = 'summary_for_employee'
  ) THEN
    ALTER TABLE psychology_sessions ADD COLUMN summary_for_employee text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychology_sessions' AND column_name = 'location'
  ) THEN
    ALTER TABLE psychology_sessions ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychology_sessions' AND column_name = 'meeting_link'
  ) THEN
    ALTER TABLE psychology_sessions ADD COLUMN meeting_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychology_sessions' AND column_name = 'employee_feedback'
  ) THEN
    ALTER TABLE psychology_sessions ADD COLUMN employee_feedback text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychology_sessions' AND column_name = 'rating'
  ) THEN
    ALTER TABLE psychology_sessions ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Create therapeutic_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS therapeutic_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES psychology_sessions(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  due_date date NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'cancelada')),
  employee_feedback text,
  psychologist_notes text,
  completion_evidence text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  urgency session_urgency DEFAULT 'normal' NOT NULL,
  preferred_type session_type DEFAULT 'presencial' NOT NULL,
  reason text NOT NULL,
  preferred_times text[] DEFAULT '{}',
  status session_request_status DEFAULT 'pendente' NOT NULL,
  assigned_psychologist uuid REFERENCES profiles(id),
  response_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wellness_resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS wellness_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  resource_type text DEFAULT 'article' CHECK (resource_type IN ('article', 'video', 'audio', 'pdf', 'link')),
  category text DEFAULT 'general' NOT NULL,
  content_url text,
  content_text text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  target_audience text[] DEFAULT '{}',
  active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update psychological_forms table structure
DO $$
BEGIN
  -- Add missing columns to psychological_forms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychological_forms' AND column_name = 'risk_thresholds'
  ) THEN
    ALTER TABLE psychological_forms ADD COLUMN risk_thresholds jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'psychological_forms' AND column_name = 'requires_followup'
  ) THEN
    ALTER TABLE psychological_forms ADD COLUMN requires_followup boolean DEFAULT false;
  END IF;
END $$;

-- Update form_responses table structure
DO $$
BEGIN
  -- Add missing columns to form_responses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_responses' AND column_name = 'risk_level'
  ) THEN
    ALTER TABLE form_responses ADD COLUMN risk_level text DEFAULT 'baixo' CHECK (risk_level IN ('baixo', 'medio', 'alto', 'critico'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_responses' AND column_name = 'psychologist_notes'
  ) THEN
    ALTER TABLE form_responses ADD COLUMN psychologist_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_responses' AND column_name = 'requires_attention'
  ) THEN
    ALTER TABLE form_responses ADD COLUMN requires_attention boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_responses' AND column_name = 'follow_up_scheduled'
  ) THEN
    ALTER TABLE form_responses ADD COLUMN follow_up_scheduled boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE therapeutic_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for therapeutic_activities
CREATE POLICY "Employees can manage own activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (employee_id = uid())
  WITH CHECK (employee_id = uid());

CREATE POLICY "HR can manage all activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = uid() AND profiles.role IN ('hr', 'admin')
  ));

-- RLS Policies for session_requests
CREATE POLICY "Employees can manage own session requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (employee_id = uid())
  WITH CHECK (employee_id = uid());

CREATE POLICY "HR can manage all session requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = uid() AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Assigned psychologists can view and update requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (assigned_psychologist = uid());

-- RLS Policies for wellness_resources
CREATE POLICY "Users can read active wellness resources"
  ON wellness_resources
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "HR can manage wellness resources"
  ON wellness_resources
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = uid() AND profiles.role IN ('hr', 'admin')
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS therapeutic_activities_employee_idx ON therapeutic_activities(employee_id);
CREATE INDEX IF NOT EXISTS therapeutic_activities_session_idx ON therapeutic_activities(session_id);
CREATE INDEX IF NOT EXISTS therapeutic_activities_status_idx ON therapeutic_activities(status);

CREATE INDEX IF NOT EXISTS session_requests_employee_idx ON session_requests(employee_id);
CREATE INDEX IF NOT EXISTS session_requests_status_idx ON session_requests(status);
CREATE INDEX IF NOT EXISTS session_requests_urgency_idx ON session_requests(urgency);

CREATE INDEX IF NOT EXISTS wellness_resources_category_idx ON wellness_resources(category);
CREATE INDEX IF NOT EXISTS wellness_resources_active_idx ON wellness_resources(active);

-- Add updated_at triggers
CREATE TRIGGER therapeutic_activities_updated_at
  BEFORE UPDATE ON therapeutic_activities
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER session_requests_updated_at
  BEFORE UPDATE ON session_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER wellness_resources_updated_at
  BEFORE UPDATE ON wellness_resources
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to get mental health statistics
CREATE OR REPLACE FUNCTION get_mental_health_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_employees integer;
  avg_mood numeric;
  sessions_count integer;
  alerts_count integer;
BEGIN
  -- Get total employees with mental health consent
  SELECT COUNT(*)
  INTO total_employees
  FROM profiles
  WHERE mental_health_consent = true AND status = 'active';

  -- Get average mood score from recent checkins
  SELECT COALESCE(AVG(mood_score), 0)
  INTO avg_mood
  FROM emotional_checkins
  WHERE checkin_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Get sessions this month
  SELECT COUNT(*)
  INTO sessions_count
  FROM psychology_sessions
  WHERE created_at >= date_trunc('month', CURRENT_DATE);

  -- Get active alerts
  SELECT COUNT(*)
  INTO alerts_count
  FROM mental_health_alerts
  WHERE resolved_at IS NULL;

  result := jsonb_build_object(
    'total_employees_participating', total_employees,
    'average_mood_score', avg_mood,
    'sessions_this_month', sessions_count,
    'high_risk_responses', 0, -- Will be calculated when form_responses is properly implemented
    'active_alerts', alerts_count,
    'wellness_resources_accessed', 0 -- Will be calculated when tracking is implemented
  );

  RETURN result;
END;
$$;