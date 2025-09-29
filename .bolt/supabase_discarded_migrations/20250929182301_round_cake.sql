/*
  # HR Calendar Management System

  1. New Tables
    - `calendar_events` - Main calendar events table
    - `calendar_requests` - Vacation and day-off requests
    - `calendar_notifications` - Event notifications
    - `calendar_settings` - System configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
    - Protect sensitive data

  3. Functions
    - Auto-create birthday and company anniversary events
    - Validate vacation requests
    - Calculate available vacation days
*/

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('aniversario', 'aniversario_empresa', 'ferias', 'feriado', 'evento', 'day_off', 'ferias_coletivas')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  all_day BOOLEAN DEFAULT true,
  category VARCHAR(50) DEFAULT 'general',
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'approved', 'rejected', 'confirmed')),
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  user_id UUID REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),
  is_public BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3B82F6',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Requests Table
CREATE TABLE IF NOT EXISTS calendar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ferias', 'day_off')),
  requester_id UUID NOT NULL REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  manager_approval BOOLEAN,
  hr_approval BOOLEAN,
  comments TEXT,
  rejection_reason TEXT,
  days_requested INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Notifications Table
CREATE TABLE IF NOT EXISTS calendar_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  request_id UUID REFERENCES calendar_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('reminder', 'approval', 'change', 'birthday', 'anniversary')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Settings Table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view public events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "HR can manage all events"
  ON calendar_events FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Managers can create team events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('manager', 'hr', 'admin')
  ));

-- RLS Policies for calendar_requests
CREATE POLICY "Users can view own requests"
  ON calendar_requests FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Users can create own requests"
  ON calendar_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own pending requests"
  ON calendar_requests FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Managers can view team requests"
  ON calendar_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = calendar_requests.requester_id 
    AND profiles.manager_id = auth.uid()
  ));

CREATE POLICY "Managers can approve team requests"
  ON calendar_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = calendar_requests.requester_id 
    AND profiles.manager_id = auth.uid()
  ));

CREATE POLICY "HR can manage all requests"
  ON calendar_requests FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

-- RLS Policies for calendar_notifications
CREATE POLICY "Users can view own notifications"
  ON calendar_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON calendar_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON calendar_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for calendar_settings
CREATE POLICY "HR can manage calendar settings"
  ON calendar_settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Users can read calendar settings"
  ON calendar_settings FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS calendar_events_user_idx ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_team_idx ON calendar_events(team_id);
CREATE INDEX IF NOT EXISTS calendar_events_type_idx ON calendar_events(type);
CREATE INDEX IF NOT EXISTS calendar_requests_requester_idx ON calendar_requests(requester_id);
CREATE INDEX IF NOT EXISTS calendar_requests_status_idx ON calendar_requests(status);
CREATE INDEX IF NOT EXISTS calendar_notifications_user_idx ON calendar_notifications(user_id);

-- Function to calculate business days
CREATE OR REPLACE FUNCTION calculate_business_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
  days INTEGER := 0;
  current_date DATE := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      days := days + 1;
    END IF;
    current_date := current_date + 1;
  END LOOP;
  
  RETURN days;
END;
$$ LANGUAGE plpgsql;

-- Function to check vacation eligibility
CREATE OR REPLACE FUNCTION check_vacation_eligibility(profile_id UUID, request_start_date DATE)
RETURNS JSONB AS $$
DECLARE
  admission_date DATE;
  years_in_company INTEGER;
  available_days INTEGER := 0;
  used_days INTEGER := 0;
  result JSONB;
BEGIN
  -- Get admission date
  SELECT p.admission_date INTO admission_date
  FROM profiles p
  WHERE p.id = profile_id;
  
  IF admission_date IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Data de admissão não encontrada'
    );
  END IF;
  
  -- Calculate years in company
  years_in_company := EXTRACT(YEAR FROM AGE(request_start_date, admission_date));
  
  -- Check if employee has at least 1 year
  IF years_in_company < 1 THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Colaborador deve ter pelo menos 1 ano de empresa para solicitar férias',
      'years_in_company', years_in_company,
      'admission_date', admission_date
    );
  END IF;
  
  -- Calculate available vacation days (10 business days per year)
  available_days := 10;
  
  -- Calculate used vacation days in current year
  SELECT COALESCE(SUM(
    calculate_business_days(ce.start_date, ce.end_date)
  ), 0) INTO used_days
  FROM calendar_events ce
  WHERE ce.user_id = profile_id
    AND ce.type = 'ferias'
    AND ce.status = 'confirmed'
    AND EXTRACT(YEAR FROM ce.start_date) = EXTRACT(YEAR FROM request_start_date);
  
  RETURN jsonb_build_object(
    'eligible', true,
    'years_in_company', years_in_company,
    'available_days', available_days,
    'used_days', used_days,
    'remaining_days', available_days - used_days,
    'admission_date', admission_date
  );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create birthday events
CREATE OR REPLACE FUNCTION create_birthday_events()
RETURNS INTEGER AS $$
DECLARE
  profile_record RECORD;
  event_count INTEGER := 0;
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  FOR profile_record IN 
    SELECT id, name, birth_date 
    FROM profiles 
    WHERE birth_date IS NOT NULL 
      AND status = 'active'
  LOOP
    -- Create birthday event for current year if not exists
    INSERT INTO calendar_events (
      type,
      title,
      description,
      start_date,
      end_date,
      all_day,
      category,
      status,
      user_id,
      is_public,
      color,
      created_by
    )
    SELECT 
      'aniversario',
      'Aniversário - ' || profile_record.name,
      'Aniversário de ' || profile_record.name,
      DATE(current_year || '-' || EXTRACT(MONTH FROM profile_record.birth_date) || '-' || EXTRACT(DAY FROM profile_record.birth_date)),
      DATE(current_year || '-' || EXTRACT(MONTH FROM profile_record.birth_date) || '-' || EXTRACT(DAY FROM profile_record.birth_date)),
      true,
      'birthday',
      'confirmed',
      profile_record.id,
      true,
      '#3B82F6',
      profile_record.id
    WHERE NOT EXISTS (
      SELECT 1 FROM calendar_events 
      WHERE type = 'aniversario' 
        AND user_id = profile_record.id 
        AND EXTRACT(YEAR FROM start_date) = current_year
    );
    
    event_count := event_count + 1;
  END LOOP;
  
  RETURN event_count;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create company anniversary events
CREATE OR REPLACE FUNCTION create_company_anniversary_events()
RETURNS INTEGER AS $$
DECLARE
  profile_record RECORD;
  event_count INTEGER := 0;
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  years_in_company INTEGER;
BEGIN
  FOR profile_record IN 
    SELECT id, name, admission_date 
    FROM profiles 
    WHERE admission_date IS NOT NULL 
      AND status = 'active'
  LOOP
    years_in_company := EXTRACT(YEAR FROM AGE(NOW(), profile_record.admission_date));
    
    -- Only create if employee has at least 1 year
    IF years_in_company >= 1 THEN
      INSERT INTO calendar_events (
        type,
        title,
        description,
        start_date,
        end_date,
        all_day,
        category,
        status,
        user_id,
        is_public,
        color,
        metadata,
        created_by
      )
      SELECT 
        'aniversario_empresa',
        years_in_company || ' anos - ' || profile_record.name,
        profile_record.name || ' completa ' || years_in_company || ' anos na empresa',
        DATE(current_year || '-' || EXTRACT(MONTH FROM profile_record.admission_date) || '-' || EXTRACT(DAY FROM profile_record.admission_date)),
        DATE(current_year || '-' || EXTRACT(MONTH FROM profile_record.admission_date) || '-' || EXTRACT(DAY FROM profile_record.admission_date)),
        true,
        'company_anniversary',
        'confirmed',
        profile_record.id,
        true,
        '#10B981',
        jsonb_build_object('years_in_company', years_in_company),
        profile_record.id
      WHERE NOT EXISTS (
        SELECT 1 FROM calendar_events 
        WHERE type = 'aniversario_empresa' 
          AND user_id = profile_record.id 
          AND EXTRACT(YEAR FROM start_date) = current_year
      );
      
      event_count := event_count + 1;
    END IF;
  END LOOP;
  
  RETURN event_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate vacation request
CREATE OR REPLACE FUNCTION validate_vacation_request(
  requester_id UUID,
  start_date DATE,
  end_date DATE,
  days_requested INTEGER
)
RETURNS JSONB AS $$
DECLARE
  eligibility JSONB;
  team_conflicts INTEGER;
  max_team_absence_percentage DECIMAL := 0.3; -- 30% max team absence
  team_size INTEGER;
  result JSONB;
BEGIN
  -- Check eligibility
  eligibility := check_vacation_eligibility(requester_id, start_date);
  
  IF NOT (eligibility->>'eligible')::BOOLEAN THEN
    RETURN eligibility;
  END IF;
  
  -- Check if enough remaining days
  IF (eligibility->>'remaining_days')::INTEGER < days_requested THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Dias de férias insuficientes. Disponível: ' || (eligibility->>'remaining_days') || ' dias'
    );
  END IF;
  
  -- Check team conflicts
  SELECT COUNT(*) INTO team_size
  FROM profiles p
  WHERE p.team_id = (SELECT team_id FROM profiles WHERE id = requester_id)
    AND p.status = 'active';
  
  SELECT COUNT(*) INTO team_conflicts
  FROM calendar_events ce
  JOIN profiles p ON ce.user_id = p.id
  WHERE p.team_id = (SELECT team_id FROM profiles WHERE id = requester_id)
    AND ce.type IN ('ferias', 'day_off')
    AND ce.status = 'confirmed'
    AND (ce.start_date <= end_date AND ce.end_date >= start_date)
    AND ce.user_id != requester_id;
  
  -- Check if team absence would exceed limit
  IF team_size > 0 AND (team_conflicts::DECIMAL / team_size) > max_team_absence_percentage THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Muitos membros da equipe já estarão ausentes neste período. Escolha outras datas.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'eligibility', eligibility,
    'team_conflicts', team_conflicts,
    'team_size', team_size
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION handle_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION handle_calendar_updated_at();

CREATE TRIGGER calendar_requests_updated_at
  BEFORE UPDATE ON calendar_requests
  FOR EACH ROW EXECUTE FUNCTION handle_calendar_updated_at();

-- Insert default calendar settings
INSERT INTO calendar_settings (setting_key, setting_value, description) VALUES
  ('vacation_min_advance_days', '30', 'Minimum days in advance for vacation requests'),
  ('dayoff_min_advance_days', '7', 'Minimum days in advance for day-off requests'),
  ('max_dayoff_per_year', '12', 'Maximum day-offs per employee per year'),
  ('max_consecutive_dayoffs', '2', 'Maximum consecutive day-offs'),
  ('vacation_days_per_year', '10', 'Vacation days per year for employees'),
  ('team_absence_limit', '0.3', 'Maximum percentage of team that can be absent simultaneously'),
  ('auto_create_birthdays', 'true', 'Automatically create birthday events'),
  ('auto_create_anniversaries', 'true', 'Automatically create company anniversary events'),
  ('notification_reminders', 'true', 'Send notification reminders'),
  ('weekend_color', '#9CA3AF', 'Color for weekend days'),
  ('holiday_color', '#EF4444', 'Color for holidays'),
  ('vacation_color', '#F59E0B', 'Color for vacation days'),
  ('birthday_color', '#3B82F6', 'Color for birthdays'),
  ('anniversary_color', '#10B981', 'Color for company anniversaries'),
  ('event_color', '#8B5CF6', 'Color for general events'),
  ('dayoff_color', '#F97316', 'Color for day-offs')
ON CONFLICT (setting_key) DO NOTHING;