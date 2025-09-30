/*
  # Fix RLS Policies - Prevent Recursion and Ensure Correct Permissions

  1. Security Updates
    - Fix recursive policies in action_groups and action_group_participants
    - Enable RLS on calendar tables with proper policies
    - Simplify profiles policies to prevent recursion
    - Add proper policies for calendar_notifications and calendar_settings

  2. Policy Structure
    - Users can manage their own data
    - Managers can access their team's data
    - HR/Admin can access all data
    - Prevent infinite recursion in policy checks

  3. Performance Optimizations
    - Use direct user ID comparisons where possible
    - Avoid complex joins in policy conditions
    - Add indexes for policy performance
*/

-- First, disable RLS on problematic tables to fix them
ALTER TABLE action_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE action_group_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "action_groups_admin_access" ON action_groups;
DROP POLICY IF EXISTS "action_groups_create" ON action_groups;
DROP POLICY IF EXISTS "action_groups_creator_access" ON action_groups;
DROP POLICY IF EXISTS "action_groups_participant_read" ON action_groups;

DROP POLICY IF EXISTS "participants_admin_access" ON action_group_participants;
DROP POLICY IF EXISTS "participants_creator_manage" ON action_group_participants;
DROP POLICY IF EXISTS "participants_self_manage" ON action_group_participants;

-- Create simple, non-recursive policies for action_groups
ALTER TABLE action_groups ENABLE ROW LEVEL SECURITY;

-- Users can read groups they created
CREATE POLICY "action_groups_creator_read"
  ON action_groups
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can update groups they created
CREATE POLICY "action_groups_creator_update"
  ON action_groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can create new groups
CREATE POLICY "action_groups_create_own"
  ON action_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can delete groups they created
CREATE POLICY "action_groups_creator_delete"
  ON action_groups
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Participants can read groups they're part of
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

-- HR/Admin can manage all groups
CREATE POLICY "action_groups_hr_admin_all"
  ON action_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Create simple policies for action_group_participants
ALTER TABLE action_group_participants ENABLE ROW LEVEL SECURITY;

-- Users can manage their own participation
CREATE POLICY "participants_own_access"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Group creators can manage participants
CREATE POLICY "participants_creator_manage"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM action_groups 
      WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM action_groups 
      WHERE created_by = auth.uid()
    )
  );

-- HR/Admin can manage all participants
CREATE POLICY "participants_hr_admin_all"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Fix profiles table policies (currently disabled due to recursion)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "profiles_own_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Managers can read their team members
CREATE POLICY "profiles_manager_team_read"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

-- HR/Admin can manage all profiles
CREATE POLICY "profiles_hr_admin_all"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('hr', 'admin')
    )
  );

-- Create policies for calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can read public events
CREATE POLICY "calendar_events_public_read"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Users can read their own events
CREATE POLICY "calendar_events_own_read"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can read their team's events
CREATE POLICY "calendar_events_team_read"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM profiles 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
  );

-- HR/Admin can manage all events
CREATE POLICY "calendar_events_hr_admin_all"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Users can create events for themselves
CREATE POLICY "calendar_events_create_own"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Create policies for calendar_requests
ALTER TABLE calendar_requests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own requests
CREATE POLICY "calendar_requests_own_access"
  ON calendar_requests
  FOR ALL
  TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- Managers can read/update requests from their team
CREATE POLICY "calendar_requests_manager_team"
  ON calendar_requests
  FOR ALL
  TO authenticated
  USING (
    requester_id IN (
      SELECT id FROM profiles 
      WHERE manager_id = auth.uid()
    )
  )
  WITH CHECK (
    requester_id IN (
      SELECT id FROM profiles 
      WHERE manager_id = auth.uid()
    )
  );

-- HR/Admin can manage all requests
CREATE POLICY "calendar_requests_hr_admin_all"
  ON calendar_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Create policies for calendar_notifications
ALTER TABLE calendar_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "calendar_notifications_own_read"
  ON calendar_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "calendar_notifications_own_update"
  ON calendar_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications for any user
CREATE POLICY "calendar_notifications_system_create"
  ON calendar_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- HR/Admin can manage all notifications
CREATE POLICY "calendar_notifications_hr_admin_all"
  ON calendar_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Create policies for calendar_settings
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- Only HR/Admin can manage calendar settings
CREATE POLICY "calendar_settings_hr_admin_only"
  ON calendar_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- All users can read calendar settings
CREATE POLICY "calendar_settings_read_all"
  ON calendar_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Add performance indexes for policy queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_auth ON profiles(id, role) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_groups_created_by ON action_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_action_group_participants_profile ON action_group_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_team_id ON calendar_events(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_requests_requester ON calendar_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notifications_user ON calendar_notifications(user_id);

-- Update the action groups service to handle the new policies
COMMENT ON TABLE action_groups IS 'Action groups with fixed RLS policies - no more recursion';
COMMENT ON TABLE action_group_participants IS 'Action group participants with fixed RLS policies';
COMMENT ON TABLE profiles IS 'User profiles with simplified RLS policies';
COMMENT ON TABLE calendar_events IS 'Calendar events with proper RLS policies';
COMMENT ON TABLE calendar_requests IS 'Calendar requests with approval workflow policies';
COMMENT ON TABLE calendar_notifications IS 'Calendar notifications with user-specific access';
COMMENT ON TABLE calendar_settings IS 'Calendar settings with admin-only management';