/*
  # Create Calendar Management Tables

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `type` (enum: ferias, feriado, evento, aniversario, day-off)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `all_day` (boolean, default true)
      - `user_id` (uuid, optional - for personal events)
      - `team_id` (uuid, optional - for team events)
      - `created_by` (uuid, required)
      - `status` (enum: pending, approved, rejected)
      - `color` (text, optional)
      - `location` (text, optional)
      - `recurrence_rule` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `calendar_requests`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, required)
      - `type` (enum: ferias, day-off, licenca)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `reason` (text, required)
      - `status` (enum: pending, approved, rejected)
      - `reviewed_by` (uuid, optional)
      - `reviewed_at` (timestamp, optional)
      - `review_notes` (text, optional)
      - `days_requested` (integer, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for appropriate access control
</sql>

-- Create enum types
CREATE TYPE calendar_event_type AS ENUM ('ferias', 'feriado', 'evento', 'aniversario', 'day-off');
CREATE TYPE calendar_event_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE calendar_request_type AS ENUM ('ferias', 'day-off', 'licenca');
CREATE TYPE calendar_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type calendar_event_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  all_day boolean DEFAULT true,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  status calendar_event_status DEFAULT 'pending',
  color text,
  location text,
  recurrence_rule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calendar_requests table
CREATE TABLE IF NOT EXISTS calendar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type calendar_request_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status calendar_request_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  days_requested integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX calendar_events_start_date_idx ON calendar_events(start_date);
CREATE INDEX calendar_events_end_date_idx ON calendar_events(end_date);
CREATE INDEX calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX calendar_events_team_id_idx ON calendar_events(team_id);
CREATE INDEX calendar_events_type_idx ON calendar_events(type);
CREATE INDEX calendar_events_status_idx ON calendar_events(status);

CREATE INDEX calendar_requests_requester_id_idx ON calendar_requests(requester_id);
CREATE INDEX calendar_requests_start_date_idx ON calendar_requests(start_date);
CREATE INDEX calendar_requests_status_idx ON calendar_requests(status);
CREATE INDEX calendar_requests_type_idx ON calendar_requests(type);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can read all calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "HR can manage all calendar events"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- RLS Policies for calendar_requests
CREATE POLICY "Users can read own calendar requests"
  ON calendar_requests
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Users can create own calendar requests"
  ON calendar_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own pending calendar requests"
  ON calendar_requests
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "HR can read all calendar requests"
  ON calendar_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'manager')
    )
  );

CREATE POLICY "HR can update calendar requests"
  ON calendar_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin', 'manager')
    )
  );

-- Add updated_at triggers
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER calendar_requests_updated_at
  BEFORE UPDATE ON calendar_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();