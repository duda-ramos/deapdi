/*
  # Create mental health support tables

  1. New Tables
    - `psychological_forms` (already exists, but ensuring completeness)
    - `form_responses` (already exists, but ensuring completeness)
    - `therapeutic_activities` (new)
    - `mental_health_alerts` (already exists, but ensuring completeness)
    - `wellness_resources` (already exists, but ensuring completeness)
    - `consent_records` (already exists, but ensuring completeness)

  2. Security
    - Enable RLS on all tables
    - Strict privacy policies for mental health data
    - Only HR and assigned psychologists can access sensitive data

  3. Indexes
    - Add indexes for performance optimization
*/

-- Ensure psychological_forms table has all required fields
DO $$
BEGIN
  -- Add missing columns if they don't exist
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

-- Ensure form_responses table has all required fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_responses' AND column_name = 'risk_level'
  ) THEN
    ALTER TABLE form_responses ADD COLUMN risk_level text DEFAULT 'baixo' CHECK (risk_level IN ('baixo', 'medio', 'alto', 'critico'));
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_responses' AND column_name = 'psychologist_notes'
  ) THEN
    ALTER TABLE form_responses ADD COLUMN psychologist_notes text;
  END IF;
END $$;

-- Create therapeutic_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS therapeutic_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES psychology_sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Ensure wellness_resources table has all required fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_resources' AND column_name = 'content_text'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN content_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_resources' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN target_audience text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_resources' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wellness_resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN created_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Ensure psychology_sessions table has all required fields
DO $$
BEGIN
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

-- Enable RLS on therapeutic_activities
ALTER TABLE therapeutic_activities ENABLE ROW LEVEL SECURITY;

-- Therapeutic Activities Policies
CREATE POLICY "Employees can manage own therapeutic activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "HR and psychologists can manage all therapeutic activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Indexes for therapeutic_activities
CREATE INDEX IF NOT EXISTS therapeutic_activities_employee_id_idx ON therapeutic_activities(employee_id);
CREATE INDEX IF NOT EXISTS therapeutic_activities_session_id_idx ON therapeutic_activities(session_id);
CREATE INDEX IF NOT EXISTS therapeutic_activities_status_idx ON therapeutic_activities(status);
CREATE INDEX IF NOT EXISTS therapeutic_activities_due_date_idx ON therapeutic_activities(due_date);

-- Triggers
CREATE TRIGGER therapeutic_activities_updated_at
  BEFORE UPDATE ON therapeutic_activities
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();