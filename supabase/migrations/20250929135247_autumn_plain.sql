/*
  # Create administration support tables

  1. New Tables
    - `system_config`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `system_url` (text)
      - `timezone` (text)
      - `default_language` (text)
      - `admin_email` (text)
      - `maintenance_mode` (boolean)
      - `password_min_length` (integer)
      - `password_require_uppercase` (boolean)
      - `password_require_numbers` (boolean)
      - `password_require_symbols` (boolean)
      - `password_validity_days` (integer)
      - `max_login_attempts` (integer)
      - `lockout_duration_minutes` (integer)
      - `session_timeout_hours` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (uuid, optional)
      - `details` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Only admins can access these tables

  3. Indexes
    - Add indexes for performance and querying
*/

-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'TalentFlow Corp',
  system_url text NOT NULL DEFAULT 'https://talentflow.empresa.com',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  default_language text NOT NULL DEFAULT 'pt-BR',
  admin_email text NOT NULL DEFAULT 'admin@empresa.com',
  maintenance_mode boolean DEFAULT false,
  password_min_length integer DEFAULT 8 CHECK (password_min_length >= 6),
  password_require_uppercase boolean DEFAULT true,
  password_require_numbers boolean DEFAULT true,
  password_require_symbols boolean DEFAULT false,
  password_validity_days integer DEFAULT 90 CHECK (password_validity_days > 0),
  max_login_attempts integer DEFAULT 5 CHECK (max_login_attempts > 0),
  lockout_duration_minutes integer DEFAULT 15 CHECK (lockout_duration_minutes > 0),
  session_timeout_hours integer DEFAULT 24 CHECK (session_timeout_hours > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- System Config Policies (Admin only)
CREATE POLICY "Only admins can manage system config"
  ON system_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Audit Logs Policies
CREATE POLICY "Only admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS system_config_updated_at_idx ON system_config(updated_at);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS audit_logs_resource_id_idx ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- Trigger for updated_at
CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert default system configuration
INSERT INTO system_config (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;