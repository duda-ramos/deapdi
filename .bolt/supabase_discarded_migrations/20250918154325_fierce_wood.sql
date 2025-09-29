/*
  # Audit and Fix RLS Policies

  1. Security Review
    - Review all RLS policies for security gaps
    - Ensure proper user isolation
    - Fix any overly permissive policies

  2. Missing Policies
    - Add missing INSERT policies where needed
    - Ensure all tables have appropriate policies

  3. Performance Optimization
    - Optimize policy conditions for better performance
    - Add indexes where needed for policy filters
*/

-- Fix career_tracks INSERT policy (already exists but ensuring it's correct)
DROP POLICY IF EXISTS "Users can create own career tracks" ON career_tracks;
CREATE POLICY "Users can create own career tracks"
  ON career_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Ensure profiles table has proper RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add missing policies for action_group_participants
DROP POLICY IF EXISTS "Users can leave groups" ON action_group_participants;
CREATE POLICY "Users can leave groups"
  ON action_group_participants
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Add missing policies for tasks
DROP POLICY IF EXISTS "Users can create tasks in their groups" ON tasks;
CREATE POLICY "Users can create tasks in their groups"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM action_group_participants agp
      WHERE agp.group_id = tasks.group_id 
      AND agp.profile_id = auth.uid()
      AND agp.role = 'leader'
    )
    OR
    EXISTS (
      SELECT 1 FROM action_groups ag
      WHERE ag.id = tasks.group_id 
      AND ag.created_by = auth.uid()
    )
  );

-- Add missing policies for mentorship_sessions
DROP POLICY IF EXISTS "Users can delete own mentorship sessions" ON mentorship_sessions;
CREATE POLICY "Users can delete own mentorship sessions"
  ON mentorship_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentorships m
      WHERE m.id = mentorship_sessions.mentorship_id 
      AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
  );

-- Optimize indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS profiles_auth_uid_idx ON profiles (id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS career_tracks_profile_auth_idx ON career_tracks (profile_id) WHERE profile_id = auth.uid();
CREATE INDEX IF NOT EXISTS pdis_profile_auth_idx ON pdis (profile_id) WHERE profile_id = auth.uid();
CREATE INDEX IF NOT EXISTS competencies_profile_auth_idx ON competencies (profile_id) WHERE profile_id = auth.uid();
CREATE INDEX IF NOT EXISTS notifications_profile_auth_idx ON notifications (profile_id) WHERE profile_id = auth.uid();

-- Add function to validate user permissions
CREATE OR REPLACE FUNCTION check_user_permission(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role::text = required_role
    AND status = 'active'
  );
END;
$$;