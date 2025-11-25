-- ============================================================================
-- DIAGNOSE AND FIX: Task Creation in Action Groups
-- ============================================================================
-- This script diagnoses and fixes RLS policies for task creation
-- Issue: Group participants/leaders cannot create tasks due to missing INSERT policies
-- ============================================================================

-- PART 1: DIAGNOSTIC QUERIES
-- ============================================================================

-- 1. Check current RLS policies on tasks table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tasks'
ORDER BY cmd, policyname;

-- 2. Check tasks table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 3. Check action_groups table exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'action_groups'
) as action_groups_exists;

-- 4. Check action_group_participants table exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'action_group_participants'
) as action_group_participants_exists;

-- 5. List existing groups (for testing)
SELECT id, title, created_by, status, created_at
FROM action_groups
ORDER BY created_at DESC
LIMIT 5;

-- 6. List participants of groups (for testing)
SELECT 
  agp.group_id,
  ag.title as group_name,
  agp.profile_id,
  p.name as participant_name,
  agp.role
FROM action_group_participants agp
JOIN action_groups ag ON ag.id = agp.group_id
JOIN profiles p ON p.id = agp.profile_id
ORDER BY ag.created_at DESC, agp.role DESC
LIMIT 10;

-- ============================================================================
-- PART 2: FIX RLS POLICIES
-- ============================================================================

-- Drop conflicting or outdated policies
DROP POLICY IF EXISTS "tasks_group_participants_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_manage" ON tasks;
DROP POLICY IF EXISTS "Group leaders can manage group tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their groups" ON tasks;

-- ============================================================================
-- NEW POLICY 1: Allow group participants to INSERT tasks
-- ============================================================================
-- Any participant (member or leader) can create tasks for other participants
CREATE POLICY "tasks_group_participants_insert"
  ON tasks 
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be creating a task for a group (not PDI)
    group_id IS NOT NULL
    AND
    -- The creator must be a participant of the group
    EXISTS (
      SELECT 1 
      FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
    )
    AND
    -- The assignee must also be a participant of the group
    EXISTS (
      SELECT 1 
      FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = tasks.assignee_id
    )
  );

-- ============================================================================
-- NEW POLICY 2: Allow group leaders to UPDATE/DELETE all group tasks
-- ============================================================================
-- Group leaders have full management capabilities
CREATE POLICY "tasks_group_leaders_manage"
  ON tasks 
  FOR UPDATE
  TO authenticated
  USING (
    group_id IS NOT NULL
    AND
    EXISTS (
      SELECT 1 
      FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  )
  WITH CHECK (
    group_id IS NOT NULL
    AND
    EXISTS (
      SELECT 1 
      FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  );

-- ============================================================================
-- NEW POLICY 3: Allow group leaders to DELETE group tasks
-- ============================================================================
CREATE POLICY "tasks_group_leaders_delete"
  ON tasks 
  FOR DELETE
  TO authenticated
  USING (
    group_id IS NOT NULL
    AND
    EXISTS (
      SELECT 1 
      FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  );

-- ============================================================================
-- Add comments for documentation
-- ============================================================================
COMMENT ON POLICY "tasks_group_participants_insert" ON tasks IS 
  'Allows any group participant (member or leader) to create tasks for other participants in the same group';

COMMENT ON POLICY "tasks_group_leaders_manage" ON tasks IS 
  'Allows group leaders to update all tasks in their groups';

COMMENT ON POLICY "tasks_group_leaders_delete" ON tasks IS 
  'Allows group leaders to delete tasks in their groups';

-- ============================================================================
-- PART 3: VERIFICATION QUERIES
-- ============================================================================

-- List all policies on tasks table after fix
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    WHEN cmd = 'ALL' THEN 'All Operations'
    ELSE cmd
  END as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tasks'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    WHEN 'ALL' THEN 5
  END,
  policyname;

-- ============================================================================
-- PART 4: TEST SCENARIO
-- ============================================================================

-- Instructions for manual testing:
/*
1. Login as a user who is a participant (not creator) of a group
2. Try to create a task in that group using the UI
3. The task should be created successfully
4. Verify with this query (replace the UUIDs):

SELECT * FROM tasks 
WHERE group_id = 'YOUR_GROUP_ID'
ORDER BY created_at DESC 
LIMIT 5;

5. Check that the task appears in the action group details page
*/

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
/*
WHAT WAS FIXED:
1. Added INSERT policy for all group participants (not just creators/managers)
2. Added UPDATE policy for group leaders
3. Added DELETE policy for group leaders
4. Existing policies remain for:
   - Task assignees (can manage their own tasks)
   - Group creators (can manage all group tasks)
   - Managers/HR/Admin (can manage all tasks)

WHO CAN NOW CREATE TASKS:
- Group participants (members and leaders)
- Group creators
- Managers, HR, and Admin users

WHO CAN UPDATE TASKS:
- Task assignees (their own tasks)
- Group leaders (all group tasks)
- Group creators (all group tasks)
- Managers, HR, and Admin (all tasks)

WHO CAN DELETE TASKS:
- Group leaders (group tasks)
- Group creators (group tasks)
- Managers, HR, and Admin (all tasks)
*/
