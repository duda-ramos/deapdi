/*
  # Criação de Estruturas Faltantes

  1. Novas Tabelas
    - calendar_settings
    - calendar_notifications
    - career_track_stages
    - career_stage_competencies
    - career_stage_salary_ranges
    - salary_history
    
  2. Funções RPC
    - get_team_stats
    - check_vacation_eligibility
    - validate_vacation_request
    - calculate_business_days
    - create_birthday_events
    - create_company_anniversary_events
    
  3. Segurança
    - RLS habilitado em todas as tabelas
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS check_vacation_eligibility(uuid, date);
DROP FUNCTION IF EXISTS validate_vacation_request(uuid, date, date, integer);
DROP FUNCTION IF EXISTS calculate_business_days(date, date);
DROP FUNCTION IF EXISTS create_birthday_events();
DROP FUNCTION IF EXISTS create_company_anniversary_events();
DROP FUNCTION IF EXISTS get_team_stats();

-- Calendar Settings
CREATE TABLE IF NOT EXISTS calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR and admin can manage calendar settings" ON calendar_settings;
CREATE POLICY "HR and admin can manage calendar settings"
  ON calendar_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Calendar Notifications
CREATE TABLE IF NOT EXISTS calendar_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  request_id uuid REFERENCES calendar_requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('reminder', 'approval', 'change', 'birthday', 'anniversary')),
  title text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calendar notifications" ON calendar_notifications;
CREATE POLICY "Users can view their own calendar notifications"
  ON calendar_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "HR can create calendar notifications" ON calendar_notifications;
CREATE POLICY "HR can create calendar notifications"
  ON calendar_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'manager')
    )
  );

-- Career Track Stages
CREATE TABLE IF NOT EXISTS career_track_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES career_track_templates(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  level integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, name)
);

ALTER TABLE career_track_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view career track stages" ON career_track_stages;
CREATE POLICY "Everyone can view career track stages"
  ON career_track_stages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can manage career track stages" ON career_track_stages;
CREATE POLICY "Admin can manage career track stages"
  ON career_track_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Career Stage Competencies
CREATE TABLE IF NOT EXISTS career_stage_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES career_track_templates(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  competency_name text NOT NULL,
  required_level integer NOT NULL CHECK (required_level >= 1 AND required_level <= 5),
  weight numeric DEFAULT 1.0 CHECK (weight > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, stage_name, competency_name)
);

ALTER TABLE career_stage_competencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view stage competencies" ON career_stage_competencies;
CREATE POLICY "Everyone can view stage competencies"
  ON career_stage_competencies FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can manage stage competencies" ON career_stage_competencies;
CREATE POLICY "Admin can manage stage competencies"
  ON career_stage_competencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Career Stage Salary Ranges
CREATE TABLE IF NOT EXISTS career_stage_salary_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES career_track_templates(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  min_salary numeric NOT NULL CHECK (min_salary >= 0),
  max_salary numeric NOT NULL CHECK (max_salary >= min_salary),
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(template_id, stage_name)
);

ALTER TABLE career_stage_salary_ranges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR and admin can view salary ranges" ON career_stage_salary_ranges;
CREATE POLICY "HR and admin can view salary ranges"
  ON career_stage_salary_ranges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage salary ranges" ON career_stage_salary_ranges;
CREATE POLICY "Admin can manage salary ranges"
  ON career_stage_salary_ranges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Salary History
CREATE TABLE IF NOT EXISTS salary_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  effective_date date NOT NULL,
  salary_amount numeric NOT NULL CHECK (salary_amount >= 0),
  currency text DEFAULT 'BRL',
  adjustment_type text CHECK (adjustment_type IN ('initial', 'merit', 'promotion', 'market_adjustment', 'other')),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR and admin can view all salary history" ON salary_history;
CREATE POLICY "HR and admin can view all salary history"
  ON salary_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

DROP POLICY IF EXISTS "HR can create salary history" ON salary_history;
CREATE POLICY "HR can create salary history"
  ON salary_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Function: Get Team Stats
CREATE OR REPLACE FUNCTION get_team_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_teams', (SELECT COUNT(*) FROM teams),
    'active_teams', (SELECT COUNT(*) FROM teams WHERE status = 'active'),
    'teams_without_manager', (SELECT COUNT(*) FROM teams WHERE manager_id IS NULL AND status = 'active'),
    'average_team_size', (
      SELECT COALESCE(AVG(member_count), 0)
      FROM (
        SELECT COUNT(*) as member_count
        FROM profiles
        WHERE team_id IS NOT NULL
        GROUP BY team_id
      ) team_sizes
    ),
    'largest_team_size', (
      SELECT COALESCE(MAX(member_count), 0)
      FROM (
        SELECT COUNT(*) as member_count
        FROM profiles
        WHERE team_id IS NOT NULL
        GROUP BY team_id
      ) team_sizes
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function: Calculate Business Days
CREATE OR REPLACE FUNCTION calculate_business_days(
  start_date date,
  end_date date
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  curr_date date := start_date;
  business_days integer := 0;
BEGIN
  WHILE curr_date <= end_date LOOP
    IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
      business_days := business_days + 1;
    END IF;
    curr_date := curr_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN business_days;
END;
$$;

-- Function: Check Vacation Eligibility
CREATE OR REPLACE FUNCTION check_vacation_eligibility(
  profile_id uuid,
  request_start_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record profiles;
  years_in_company numeric;
  used_days integer;
  available_days integer := 30;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  IF profile_record IS NULL THEN
    RETURN json_build_object('eligible', false, 'reason', 'Profile not found');
  END IF;
  
  IF profile_record.admission_date IS NOT NULL THEN
    years_in_company := EXTRACT(YEAR FROM AGE(request_start_date, profile_record.admission_date::date));
  ELSE
    years_in_company := 0;
  END IF;
  
  IF years_in_company < 1 THEN
    RETURN json_build_object(
      'eligible', false,
      'reason', 'Minimum 1 year in company required',
      'years_in_company', years_in_company,
      'available_days', 0,
      'used_days', 0,
      'remaining_days', 0
    );
  END IF;
  
  SELECT COALESCE(SUM(days_requested), 0) INTO used_days
  FROM calendar_requests
  WHERE requester_id = profile_id
    AND event_type = 'ferias'
    AND status = 'approved'
    AND EXTRACT(YEAR FROM start_date::date) = EXTRACT(YEAR FROM request_start_date);
  
  RETURN json_build_object(
    'eligible', true,
    'years_in_company', years_in_company,
    'available_days', available_days,
    'used_days', used_days,
    'remaining_days', available_days - used_days,
    'admission_date', profile_record.admission_date
  );
END;
$$;

-- Function: Validate Vacation Request
CREATE OR REPLACE FUNCTION validate_vacation_request(
  requester_id uuid,
  start_date date,
  end_date date,
  days_requested integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  eligibility json;
  remaining_days integer;
BEGIN
  eligibility := check_vacation_eligibility(requester_id, start_date);
  
  IF NOT (eligibility->>'eligible')::boolean THEN
    RETURN json_build_object('valid', false, 'reason', eligibility->>'reason');
  END IF;
  
  remaining_days := (eligibility->>'remaining_days')::integer;
  
  IF days_requested > remaining_days THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'Insufficient vacation days',
      'requested', days_requested,
      'available', remaining_days
    );
  END IF;
  
  RETURN json_build_object('valid', true, 'eligibility', eligibility);
END;
$$;

-- Function: Create Birthday Events
CREATE OR REPLACE FUNCTION create_birthday_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  created_count integer := 0;
  profile_record profiles;
  birthday_date date;
BEGIN
  FOR profile_record IN 
    SELECT * FROM profiles 
    WHERE birth_date IS NOT NULL 
    AND status = 'active'
  LOOP
    birthday_date := DATE_TRUNC('year', CURRENT_DATE)::date + 
                     (profile_record.birth_date::date - DATE_TRUNC('year', profile_record.birth_date::date)::date);
    
    BEGIN
      INSERT INTO calendar_events (
        type, title, description, start_date, end_date,
        all_day, category, status, user_id, is_public, color
      )
      VALUES (
        'aniversario',
        'Aniversário de ' || profile_record.name,
        'Feliz aniversário!',
        birthday_date,
        birthday_date,
        true,
        'birthday',
        'confirmed',
        profile_record.id,
        true,
        '#3B82F6'
      );
      
      created_count := created_count + 1;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;
  
  RETURN created_count;
END;
$$;

-- Function: Create Company Anniversary Events
CREATE OR REPLACE FUNCTION create_company_anniversary_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  created_count integer := 0;
  profile_record profiles;
  years_in_company integer;
  anniversary_date date;
BEGIN
  FOR profile_record IN 
    SELECT * FROM profiles 
    WHERE admission_date IS NOT NULL 
    AND status = 'active'
  LOOP
    years_in_company := EXTRACT(YEAR FROM AGE(CURRENT_DATE, profile_record.admission_date::date))::integer;
    
    IF years_in_company > 0 THEN
      anniversary_date := DATE_TRUNC('year', CURRENT_DATE)::date + 
                          (profile_record.admission_date::date - DATE_TRUNC('year', profile_record.admission_date::date)::date);
      
      BEGIN
        INSERT INTO calendar_events (
          type, title, description, start_date, end_date,
          all_day, category, status, user_id, is_public, color
        )
        VALUES (
          'aniversario_empresa',
          profile_record.name || ' - ' || years_in_company || ' ano(s) na empresa',
          'Parabéns por ' || years_in_company || ' ano(s) de dedicação!',
          anniversary_date,
          anniversary_date,
          true,
          'anniversary',
          'confirmed',
          profile_record.id,
          true,
          '#10B981'
        );
        
        created_count := created_count + 1;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END IF;
  END LOOP;
  
  RETURN created_count;
END;
$$;

-- Insert default calendar settings
INSERT INTO calendar_settings (setting_key, setting_value)
VALUES 
  ('vacation_min_advance_days', '30'),
  ('dayoff_min_advance_days', '7'),
  ('max_dayoff_per_year', '12'),
  ('max_consecutive_dayoffs', '2'),
  ('vacation_days_per_year', '30'),
  ('team_absence_limit', '0.3'),
  ('auto_create_birthdays', 'true'),
  ('auto_create_anniversaries', 'true'),
  ('notification_reminders', 'true'),
  ('weekend_color', '#9CA3AF'),
  ('holiday_color', '#EF4444'),
  ('vacation_color', '#F59E0B'),
  ('birthday_color', '#3B82F6'),
  ('anniversary_color', '#10B981'),
  ('event_color', '#8B5CF6'),
  ('dayoff_color', '#F97316')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_user_id ON calendar_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_read_at ON calendar_notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_career_stage_competencies_template ON career_stage_competencies(template_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_profile ON salary_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_effective_date ON salary_history(effective_date);
