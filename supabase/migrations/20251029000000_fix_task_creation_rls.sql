-- ============================================================================
-- FIX: Allow group participants to create tasks
-- Issue: Tasks creation in action groups was failing because RLS policies
-- didn't allow group participants (leaders/members) to INSERT tasks
-- ============================================================================

-- Drop existing policies that might conflict (if any)
DROP POLICY IF EXISTS "tasks_group_participants_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_insert" ON tasks;

-- Create a policy that allows group participants to INSERT tasks
-- This allows any participant of a group to create tasks for other participants
CREATE POLICY "tasks_group_participants_insert"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The user must be a participant of the group
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
    )
    AND
    -- The assignee must also be a participant of the group
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = tasks.assignee_id
    )
  );

-- Add a policy to allow group leaders to manage all group tasks
CREATE POLICY "tasks_group_leaders_manage"
  ON tasks FOR ALL
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  )
  WITH CHECK (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "tasks_group_participants_insert" ON tasks IS 
  'Allows group participants to create tasks for other participants in the same group';

COMMENT ON POLICY "tasks_group_leaders_manage" ON tasks IS 
  'Allows group leaders to fully manage all tasks in their groups';
