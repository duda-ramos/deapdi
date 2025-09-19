/*
  # Create session_requests table for mental health module

  1. New Tables
    - `session_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to profiles)
      - `urgency` (enum: normal, prioritaria, emergencial)
      - `preferred_type` (enum: presencial, online, emergencial, follow_up)
      - `reason` (text)
      - `preferred_times` (text array)
      - `status` (enum: pendente, aceita, agendada, rejeitada)
      - `assigned_psychologist` (uuid, foreign key to profiles)
      - `response_notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `session_requests` table
    - Add policies for employees to create and view own requests
    - Add policies for HR/psychologists to manage requests
*/

-- Create custom types for session requests
CREATE TYPE session_urgency AS ENUM ('normal', 'prioritaria', 'emergencial');
CREATE TYPE session_type AS ENUM ('presencial', 'online', 'emergencial', 'follow_up');
CREATE TYPE session_request_status AS ENUM ('pendente', 'aceita', 'agendada', 'rejeitada');

-- Create session_requests table
CREATE TABLE IF NOT EXISTS session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  urgency session_urgency NOT NULL DEFAULT 'normal',
  preferred_type session_type NOT NULL DEFAULT 'presencial',
  reason text NOT NULL,
  preferred_times text[] DEFAULT '{}',
  status session_request_status NOT NULL DEFAULT 'pendente',
  assigned_psychologist uuid REFERENCES profiles(id),
  response_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX session_requests_employee_id_idx ON session_requests(employee_id);
CREATE INDEX session_requests_status_idx ON session_requests(status);
CREATE INDEX session_requests_urgency_idx ON session_requests(urgency);
CREATE INDEX session_requests_assigned_psychologist_idx ON session_requests(assigned_psychologist);

-- Enable RLS
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_requests
CREATE POLICY "Employees can create own session requests"
  ON session_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can view own session requests"
  ON session_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = employee_id);

CREATE POLICY "Employees can update own pending requests"
  ON session_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = employee_id AND status = 'pendente');

CREATE POLICY "HR can view all session requests"
  ON session_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR can update all session requests"
  ON session_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Assigned psychologists can view and update their requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = assigned_psychologist);

-- Add updated_at trigger
CREATE TRIGGER session_requests_updated_at
  BEFORE UPDATE ON session_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();