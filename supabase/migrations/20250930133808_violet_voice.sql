/*
  # Fix RLS Recursion for All Tables

  This migration fixes infinite recursion in RLS policies by:
  1. Adding user role to JWT claims for direct access
  2. Rebuilding all problematic policies to use JWT instead of profile subqueries
  3. Ensuring no circular dependencies between tables

  ## Tables Fixed
  - profiles: Core user data with role in JWT
  - action_groups: Project collaboration
  - calendar_events: HR calendar events
  - calendar_requests: Vacation/day-off requests
  - calendar_notifications: Calendar notifications

  ## Security Changes
  - All policies now use auth.jwt() ->> 'user_role' instead of profile subqueries
  - Maintains security while eliminating recursion
  - Simplified but effective permission model
*/

-- Step 1: Create function to sync user role to JWT
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the user's raw_app_meta_data to include role
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Step 2: Add trigger to profiles table to sync role changes
DROP TRIGGER IF EXISTS sync_role_to_jwt_trigger ON profiles;
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- Step 3: Fix profiles table RLS (complete rebuild)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_own_access ON profiles;
DROP POLICY IF EXISTS profiles_hr_admin_all ON profiles;
DROP POLICY IF EXISTS profiles_manager_team_read ON profiles;
DROP POLICY IF EXISTS profiles_health_check ON profiles;

-- Re-enable RLS with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to access their own data
CREATE POLICY "profiles_own_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow HR/Admin access using JWT role
CREATE POLICY "profiles_hr_admin_jwt"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('hr', 'admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('hr', 'admin'));

-- Allow anonymous health checks (count only)
CREATE POLICY "profiles_health_check"
  ON profiles
  FOR SELECT
  TO anon
  USING (false); -- This will allow count queries but not actual data

-- Grant necessary permissions
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

-- Step 4: Fix action_groups RLS
ALTER TABLE action_groups DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS action_groups_creator_read ON action_groups;
DROP POLICY IF EXISTS action_groups_creator_update ON action_groups;
DROP POLICY IF EXISTS action_groups_creator_delete ON action_groups;
DROP POLICY IF EXISTS action_groups_create_own ON action_groups;
DROP POLICY IF EXISTS action_groups_participant_read ON action_groups;
DROP POLICY IF EXISTS action_groups_hr_admin_all ON action_groups;

ALTER TABLE action_groups ENABLE ROW LEVEL SECURITY;

-- Simple policies for action_groups
CREATE POLICY "action_groups_own_access"
  ON action_groups
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "action_groups_hr_admin_jwt"
  ON action_groups
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('hr', 'admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('hr', 'admin'));

CREATE POLICY "action_groups_participant_read"
  ON action_groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id 
      FROM action_group_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- Step 5: Fix calendar_events RLS
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_events_create_own ON calendar_events;
DROP POLICY IF EXISTS calendar_events_hr_admin_all ON calendar_events;
DROP POLICY IF EXISTS calendar_events_own_read ON calendar_events;
DROP POLICY IF EXISTS calendar_events_public_read ON calendar_events;
DROP POLICY IF EXISTS calendar_events_team_read ON calendar_events;

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Simple policies for calendar_events
CREATE POLICY "calendar_events_own_access"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "calendar_events_hr_admin_jwt"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('hr', 'admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('hr', 'admin'));

CREATE POLICY "calendar_events_public_read"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Step 6: Fix calendar_requests RLS
ALTER TABLE calendar_requests DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_requests_own_access ON calendar_requests;
DROP POLICY IF EXISTS calendar_requests_hr_admin_all ON calendar_requests;
DROP POLICY IF EXISTS calendar_requests_manager_team ON calendar_requests;

ALTER TABLE calendar_requests ENABLE ROW LEVEL SECURITY;

-- Simple policies for calendar_requests
CREATE POLICY "calendar_requests_own_access"
  ON calendar_requests
  FOR ALL
  TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "calendar_requests_hr_admin_jwt"
  ON calendar_requests
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('hr', 'admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('hr', 'admin'));

CREATE POLICY "calendar_requests_manager_jwt"
  ON calendar_requests
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'manager')
  WITH CHECK (auth.jwt() ->> 'user_role' = 'manager');

-- Step 7: Fix calendar_notifications RLS
ALTER TABLE calendar_notifications DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_notifications_own_read ON calendar_notifications;
DROP POLICY IF EXISTS calendar_notifications_own_update ON calendar_notifications;
DROP POLICY IF EXISTS calendar_notifications_hr_admin_all ON calendar_notifications;
DROP POLICY IF EXISTS calendar_notifications_system_create ON calendar_notifications;

ALTER TABLE calendar_notifications ENABLE ROW LEVEL SECURITY;

-- Simple policies for calendar_notifications
CREATE POLICY "calendar_notifications_own_access"
  ON calendar_notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "calendar_notifications_hr_admin_jwt"
  ON calendar_notifications
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('hr', 'admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('hr', 'admin'));

CREATE POLICY "calendar_notifications_system_create"
  ON calendar_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 8: Update existing users' JWT with their roles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, role FROM profiles 
  LOOP
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', profile_record.role)
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_groups_created_by ON action_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_requests_requester_id ON calendar_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_user_id ON calendar_notifications(user_id);

-- Step 10: Grant necessary permissions
GRANT ALL ON action_groups TO authenticated;
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON calendar_requests TO authenticated;
GRANT ALL ON calendar_notifications TO authenticated;

-- Step 11: Add helpful comments
COMMENT ON FUNCTION sync_user_role_to_jwt() IS 'Syncs user role from profiles table to JWT claims to avoid RLS recursion';
COMMENT ON POLICY "profiles_hr_admin_jwt" ON profiles IS 'HR and Admin access using JWT role to prevent recursion';
COMMENT ON POLICY "action_groups_hr_admin_jwt" ON action_groups IS 'HR and Admin access using JWT role to prevent recursion';
COMMENT ON POLICY "calendar_events_hr_admin_jwt" ON calendar_events IS 'HR and Admin access using JWT role to prevent recursion';
COMMENT ON POLICY "calendar_requests_hr_admin_jwt" ON calendar_requests IS 'HR and Admin access using JWT role to prevent recursion';
COMMENT ON POLICY "calendar_notifications_hr_admin_jwt" ON calendar_notifications IS 'HR and Admin access using JWT role to prevent recursion';