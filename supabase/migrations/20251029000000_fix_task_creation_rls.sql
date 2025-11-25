-- ============================================================================
-- FIX: Allow group participants to create tasks
-- Issue: Tasks creation in action groups was failing because RLS policies
-- didn't allow group participants (leaders/members) to INSERT tasks
-- 
-- Root Cause: The consolidation migration (20250930140232) only created
-- policies for group creators and managers to insert tasks, but not for
-- regular group participants or leaders.
-- ============================================================================

-- Drop existing policies that might conflict (if any)
DROP POLICY IF EXISTS "tasks_group_participants_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_manage" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_delete" ON tasks;
DROP POLICY IF EXISTS "Group leaders can manage group tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their groups" ON tasks;

-- ============================================================================
-- POLICY 1: Allow group participants to INSERT tasks
-- ============================================================================
-- Any participant (member or leader) can create tasks for other participants
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

-- ============================================================================
-- POLICY 2: Allow group leaders to UPDATE group tasks
-- ============================================================================
-- Group leaders can update all tasks in their groups
CREATE POLICY "tasks_group_leaders_manage"
  ON tasks FOR UPDATE
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

-- ============================================================================
-- POLICY 3: Allow group leaders to DELETE group tasks
-- ============================================================================
-- Group leaders can delete tasks in their groups
CREATE POLICY "tasks_group_leaders_delete"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  );

-- ============================================================================
-- Documentation
-- ============================================================================
COMMENT ON POLICY "tasks_group_participants_insert" ON tasks IS 
  'Allows any group participant (member or leader) to create tasks for other participants in the same group';

COMMENT ON POLICY "tasks_group_leaders_manage" ON tasks IS 
  'Allows group leaders to update all tasks in their groups';

COMMENT ON POLICY "tasks_group_leaders_delete" ON tasks IS 
  'Allows group leaders to delete tasks in their groups';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the policies were created:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks' ORDER BY cmd, policyname;
