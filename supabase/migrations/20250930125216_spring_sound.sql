/*
  # HR Calendar Complete Schema

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `type` (enum: aniversario, aniversario_empresa, ferias, feriado, evento, day_off, ferias_coletivas)
      - `title` (text)
      - `description` (text, optional)
      - `start_date` (date)
      - `end_date` (date)
      - `all_day` (boolean)
      - `category` (text)
      - `status` (enum: pending, approved, rejected, confirmed)
      - `created_by` (uuid, references profiles)
      - `approved_by` (uuid, references profiles, optional)
      - `user_id` (uuid, references profiles, optional)
      - `team_id` (uuid, references teams, optional)
      - `is_public` (boolean)
      - `color` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `calendar_requests`
      - `id` (uuid, primary key)
      - `event_type` (enum: ferias, day_off)
      - `requester_id` (uuid, references profiles)
      - `start_date` (date)
      - `end_date` (date)
      - `reason` (text)
      - `status` (enum: pending, approved, rejected, cancelled)
      - `reviewed_by` (uuid, references profiles, optional)
      - `reviewed_at` (timestamp, optional)
      - `manager_approval` (boolean, optional)
      - `hr_approval` (boolean, optional)
      - `comments` (text, optional)
      - `rejection_reason` (text, optional)
      - `days_requested` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `calendar_notifications`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references calendar_events, optional)
      - `request_id` (uuid, references calendar_requests, optional)
      - `user_id` (uuid, references profiles)
      - `type` (enum: reminder, approval, change, birthday, anniversary)
      - `title` (text)
      - `message` (text)
      - `read_at` (timestamp, optional)
      - `sent_at` (timestamp)

    - `calendar_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (text)
      - `description` (text, optional)
      - `updated_by` (uuid, references profiles)
      - `updated_at` (timestamp)

  2. Enums
    - `calendar_event_type`
    - `calendar_event_status`
    - `calendar_request_type`
    - `calendar_request_status`
    - `calendar_notification_type`

  3. Security
    - RLS disabled initially to avoid recursion issues
    - Will be enabled later with proper policies

  4. Indexes
    - Performance indexes on date ranges and foreign keys
    - Composite indexes for common queries

  5. Triggers
    - Automatic timestamp updates
    - Notification triggers for status changes
*/

-- Create enum types for calendar system
CREATE TYPE calendar_event_type AS ENUM (
  'aniversario',
  'aniversario_empresa', 
  'ferias',
  'feriado',
  'evento',
  'day_off',
  'ferias_coletivas'
);

CREATE TYPE calendar_event_status AS ENUM (
  'pending',
  'approved', 
  'rejected',
  'confirmed'
);

CREATE TYPE calendar_request_type AS ENUM (
  'ferias',
  'day_off'
);

CREATE TYPE calendar_request_status AS ENUM (
  'pending',
  'approved',
  'rejected', 
  'cancelled'
);

CREATE TYPE calendar_notification_type AS ENUM (
  'reminder',
  'approval',
  'change',
  'birthday',
  'anniversary'
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type calendar_event_type NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  all_day boolean DEFAULT true,
  category text DEFAULT 'general',
  status calendar_event_status DEFAULT 'confirmed',
  created_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  user_id uuid REFERENCES profiles(id),
  team_id uuid REFERENCES teams(id),
  is_public boolean DEFAULT true,
  color text DEFAULT '#8B5CF6',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calendar_requests table
CREATE TABLE IF NOT EXISTS calendar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type calendar_request_type NOT NULL,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status calendar_request_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  manager_approval boolean,
  hr_approval boolean,
  comments text,
  rejection_reason text,
  days_requested integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calendar_notifications table
CREATE TABLE IF NOT EXISTS calendar_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  request_id uuid REFERENCES calendar_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type calendar_notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  sent_at timestamptz DEFAULT now()
);

-- Create calendar_settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_team ON calendar_events(team_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_public ON calendar_events(is_public);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_requester ON calendar_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_calendar_requests_dates ON calendar_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_requests_status ON calendar_requests(status);
CREATE INDEX IF NOT EXISTS idx_calendar_requests_type ON calendar_requests(event_type);

CREATE INDEX IF NOT EXISTS idx_calendar_notifications_user ON calendar_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_event ON calendar_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_request ON calendar_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_read ON calendar_notifications(read_at);

CREATE INDEX IF NOT EXISTS idx_calendar_settings_key ON calendar_settings(setting_key);

-- Add constraints
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_dates_check 
  CHECK (end_date >= start_date);

ALTER TABLE calendar_requests ADD CONSTRAINT calendar_requests_dates_check 
  CHECK (end_date >= start_date);

ALTER TABLE calendar_requests ADD CONSTRAINT calendar_requests_days_check 
  CHECK (days_requested > 0);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER calendar_requests_updated_at
  BEFORE UPDATE ON calendar_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert default calendar settings
INSERT INTO calendar_settings (setting_key, setting_value, description) VALUES
  ('vacation_min_advance_days', '30', 'Minimum days in advance for vacation requests'),
  ('dayoff_min_advance_days', '7', 'Minimum days in advance for day-off requests'),
  ('max_dayoff_per_year', '12', 'Maximum day-offs per employee per year'),
  ('max_consecutive_dayoffs', '2', 'Maximum consecutive day-offs allowed'),
  ('vacation_days_per_year', '10', 'Vacation days per employee per year'),
  ('team_absence_limit', '0.3', 'Maximum percentage of team that can be absent simultaneously'),
  ('auto_create_birthdays', 'true', 'Automatically create birthday events'),
  ('auto_create_anniversaries', 'true', 'Automatically create company anniversary events'),
  ('notification_reminders', 'true', 'Send notification reminders'),
  ('weekend_color', '#9CA3AF', 'Color for weekend days'),
  ('holiday_color', '#EF4444', 'Color for holidays'),
  ('vacation_color', '#F59E0B', 'Color for vacation events'),
  ('birthday_color', '#3B82F6', 'Color for birthday events'),
  ('anniversary_color', '#10B981', 'Color for anniversary events'),
  ('event_color', '#8B5CF6', 'Color for general events'),
  ('dayoff_color', '#F97316', 'Color for day-off events')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample Brazilian holidays for 2024
INSERT INTO calendar_events (type, title, description, start_date, end_date, all_day, category, status, is_public, color) VALUES
  ('feriado', 'Confraternização Universal', 'Feriado Nacional', '2024-01-01', '2024-01-01', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Carnaval', 'Feriado Nacional', '2024-02-12', '2024-02-13', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Sexta-feira Santa', 'Feriado Nacional', '2024-03-29', '2024-03-29', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Tiradentes', 'Feriado Nacional', '2024-04-21', '2024-04-21', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Dia do Trabalhador', 'Feriado Nacional', '2024-05-01', '2024-05-01', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Independência do Brasil', 'Feriado Nacional', '2024-09-07', '2024-09-07', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Nossa Senhora Aparecida', 'Feriado Nacional', '2024-10-12', '2024-10-12', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Finados', 'Feriado Nacional', '2024-11-02', '2024-11-02', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Proclamação da República', 'Feriado Nacional', '2024-11-15', '2024-11-15', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Natal', 'Feriado Nacional', '2024-12-25', '2024-12-25', true, 'holiday', 'confirmed', true, '#EF4444')
ON CONFLICT DO NOTHING;

-- Insert sample holidays for 2025
INSERT INTO calendar_events (type, title, description, start_date, end_date, all_day, category, status, is_public, color) VALUES
  ('feriado', 'Confraternização Universal', 'Feriado Nacional', '2025-01-01', '2025-01-01', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Carnaval', 'Feriado Nacional', '2025-03-03', '2025-03-04', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Sexta-feira Santa', 'Feriado Nacional', '2025-04-18', '2025-04-18', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Tiradentes', 'Feriado Nacional', '2025-04-21', '2025-04-21', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Dia do Trabalhador', 'Feriado Nacional', '2025-05-01', '2025-05-01', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Independência do Brasil', 'Feriado Nacional', '2025-09-07', '2025-09-07', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Nossa Senhora Aparecida', 'Feriado Nacional', '2025-10-12', '2025-10-12', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Finados', 'Feriado Nacional', '2025-11-02', '2025-11-02', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Proclamação da República', 'Feriado Nacional', '2025-11-15', '2025-11-15', true, 'holiday', 'confirmed', true, '#EF4444'),
  ('feriado', 'Natal', 'Feriado Nacional', '2025-12-25', '2025-12-25', true, 'holiday', 'confirmed', true, '#EF4444')
ON CONFLICT DO NOTHING;

-- Create helper functions for calendar operations
CREATE OR REPLACE FUNCTION calculate_business_days(start_date date, end_date date)
RETURNS integer AS $$
DECLARE
  business_days integer := 0;
  current_date date := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Count only weekdays (Monday = 1, Sunday = 0)
    IF EXTRACT(DOW FROM current_date) BETWEEN 1 AND 5 THEN
      business_days := business_days + 1;
    END IF;
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN business_days;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_vacation_eligibility(
  profile_id_param uuid,
  request_start_date date
)
RETURNS jsonb AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  years_in_company numeric;
  used_days integer := 0;
  available_days integer := 10; -- Default vacation days per year
  result jsonb;
BEGIN
  -- Get profile information
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Perfil não encontrado'
    );
  END IF;
  
  -- Calculate years in company
  IF profile_record.admission_date IS NOT NULL THEN
    years_in_company := EXTRACT(YEAR FROM AGE(request_start_date, profile_record.admission_date::date));
  ELSE
    years_in_company := 0;
  END IF;
  
  -- Check if employee has been in company for at least 1 year
  IF years_in_company < 1 THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Colaborador deve ter pelo menos 1 ano de empresa para solicitar férias',
      'years_in_company', years_in_company,
      'available_days', 0,
      'used_days', 0,
      'remaining_days', 0,
      'admission_date', profile_record.admission_date
    );
  END IF;
  
  -- Calculate used vacation days this year
  SELECT COALESCE(SUM(days_requested), 0) INTO used_days
  FROM calendar_requests 
  WHERE requester_id = profile_id_param 
    AND event_type = 'ferias'
    AND status = 'approved'
    AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM request_start_date);
  
  -- Build result
  result := jsonb_build_object(
    'eligible', (available_days - used_days) > 0,
    'reason', CASE 
      WHEN (available_days - used_days) <= 0 THEN 'Você já utilizou todos os dias de férias disponíveis este ano'
      ELSE null
    END,
    'years_in_company', years_in_company,
    'available_days', available_days,
    'used_days', used_days,
    'remaining_days', available_days - used_days,
    'admission_date', profile_record.admission_date
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_vacation_request(
  requester_id uuid,
  start_date date,
  end_date date,
  days_requested integer
)
RETURNS jsonb AS $$
DECLARE
  team_conflicts integer := 0;
  profile_record profiles%ROWTYPE;
  result jsonb;
BEGIN
  -- Get requester profile
  SELECT * INTO profile_record FROM profiles WHERE id = requester_id;
  
  -- Check team conflicts if user has a team
  IF profile_record.team_id IS NOT NULL THEN
    SELECT COUNT(*) INTO team_conflicts
    FROM calendar_events ce
    JOIN profiles p ON p.id = ce.user_id
    WHERE p.team_id = profile_record.team_id
      AND ce.type IN ('ferias', 'day_off')
      AND ce.status = 'confirmed'
      AND (
        (ce.start_date <= start_date AND ce.end_date >= start_date) OR
        (ce.start_date <= end_date AND ce.end_date >= end_date) OR
        (ce.start_date >= start_date AND ce.end_date <= end_date)
      );
  END IF;
  
  result := jsonb_build_object(
    'valid', true,
    'days_requested', days_requested,
    'team_conflicts', team_conflicts,
    'warnings', CASE 
      WHEN team_conflicts > 0 THEN 
        jsonb_build_array('Há conflitos com ausências de outros membros da equipe')
      ELSE jsonb_build_array()
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create notification trigger function
CREATE OR REPLACE FUNCTION notify_calendar_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- This would create notifications for calendar changes
  -- Implementation depends on notification system requirements
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for calendar_requests status changes
CREATE TRIGGER calendar_request_status_change
  AFTER UPDATE OF status ON calendar_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_calendar_changes();

-- Note: RLS is intentionally disabled to avoid recursion issues
-- Enable RLS later with proper policies after testing
COMMENT ON TABLE calendar_events IS 'Calendar events table - RLS disabled temporarily to avoid recursion';
COMMENT ON TABLE calendar_requests IS 'Calendar requests table - RLS disabled temporarily to avoid recursion';
COMMENT ON TABLE calendar_notifications IS 'Calendar notifications table - RLS disabled temporarily to avoid recursion';
COMMENT ON TABLE calendar_settings IS 'Calendar settings table - RLS disabled temporarily to avoid recursion';