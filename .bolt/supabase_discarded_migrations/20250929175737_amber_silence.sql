/*
  # Create migration control system

  1. New Tables
    - `schema_migrations` - tracks applied migrations
  
  2. Functions
    - `check_migration_applied` - checks if migration was applied
    - `mark_migration_applied` - marks migration as applied
  
  3. Security
    - Only admins can manage migrations
    - Migration tracking is system-level
*/

-- Create migration control table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by UUID REFERENCES auth.users(id),
  description TEXT,
  checksum TEXT
);

-- Enable RLS
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage migrations
CREATE POLICY "Only admins can manage migrations"
  ON schema_migrations
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

-- Function to check if migration was applied
CREATE OR REPLACE FUNCTION check_migration_applied(migration_version TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM schema_migrations 
    WHERE version = migration_version
  );
END;
$$;

-- Function to mark migration as applied
CREATE OR REPLACE FUNCTION mark_migration_applied(
  migration_version TEXT,
  migration_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO schema_migrations (version, applied_by, description)
  VALUES (migration_version, auth.uid(), migration_description)
  ON CONFLICT (version) DO NOTHING;
END;
$$;

-- Function to get pending migrations
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE (
  version TEXT,
  applied BOOLEAN,
  applied_at TIMESTAMP WITH TIME ZONE,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.version::TEXT,
    TRUE as applied,
    sm.applied_at,
    sm.description
  FROM schema_migrations sm
  ORDER BY sm.applied_at DESC;
END;
$$;

-- Mark existing core migrations as applied (to prevent re-running)
DO $$
BEGIN
  -- Only insert if the table is empty (first time setup)
  IF NOT EXISTS (SELECT 1 FROM schema_migrations LIMIT 1) THEN
    INSERT INTO schema_migrations (version, description, applied_at) VALUES
    ('001_initial_schema', 'Initial database schema with core tables', NOW() - INTERVAL '1 day'),
    ('002_profiles_and_auth', 'User profiles and authentication setup', NOW() - INTERVAL '1 day'),
    ('003_career_tracks', 'Career track and competency system', NOW() - INTERVAL '1 day'),
    ('004_pdis_and_tasks', 'PDI and task management system', NOW() - INTERVAL '1 day'),
    ('005_achievements', 'Achievement and gamification system', NOW() - INTERVAL '1 day'),
    ('006_notifications', 'Notification system', NOW() - INTERVAL '1 day'),
    ('007_teams_and_groups', 'Team and action group management', NOW() - INTERVAL '1 day'),
    ('008_courses_and_learning', 'Learning and course system', NOW() - INTERVAL '1 day'),
    ('009_mentorship', 'Mentorship and session management', NOW() - INTERVAL '1 day'),
    ('010_audit_and_admin', 'Audit logs and admin features', NOW() - INTERVAL '1 day');
  END IF;
END $$;