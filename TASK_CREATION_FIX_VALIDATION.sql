-- ============================================================================
-- VALIDATION QUERIES FOR TASK CREATION FIX
-- ============================================================================
-- Use these queries to validate that the RLS policies are working correctly
-- for task creation in action groups
-- ============================================================================

-- ============================================================================
-- 1. Check if the new policies were created
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks'
AND policyname IN ('tasks_group_participants_insert', 'tasks_group_leaders_manage')
ORDER BY policyname;

-- ============================================================================
-- 2. List all RLS policies for tasks table
-- ============================================================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'ALL' THEN 'SELECT, INSERT, UPDATE, DELETE'
    ELSE cmd::text
  END as operations,
  permissive
FROM pg_policies 
WHERE tablename = 'tasks'
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
-- 3. Verify RLS is enabled on tasks table
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tasks';

-- ============================================================================
-- 4. Check action groups with participants
-- ============================================================================
SELECT 
  ag.id,
  ag.title,
  ag.status,
  ag.created_by,
  COUNT(DISTINCT agp.profile_id) as participant_count,
  COUNT(DISTINCT t.id) as task_count
FROM action_groups ag
LEFT JOIN action_group_participants agp ON ag.id = agp.group_id
LEFT JOIN tasks t ON ag.id = t.group_id
WHERE ag.status = 'active'
GROUP BY ag.id, ag.title, ag.status, ag.created_by
ORDER BY ag.created_at DESC;

-- ============================================================================
-- 5. Check group participants and their roles
-- ============================================================================
SELECT 
  ag.title as group_name,
  p.name as participant_name,
  p.email,
  agp.role,
  agp.created_at as joined_at
FROM action_groups ag
JOIN action_group_participants agp ON ag.id = agp.group_id
JOIN profiles p ON agp.profile_id = p.id
WHERE ag.status = 'active'
ORDER BY ag.title, agp.role DESC, p.name;

-- ============================================================================
-- 6. Check tasks by group
-- ============================================================================
SELECT 
  ag.title as group_name,
  t.title as task_title,
  t.status,
  p.name as assignee_name,
  t.deadline,
  t.created_at
FROM tasks t
JOIN action_groups ag ON t.group_id = ag.id
JOIN profiles p ON t.assignee_id = p.id
WHERE ag.status = 'active'
ORDER BY ag.title, t.created_at DESC;

-- ============================================================================
-- 7. TESTING SCENARIOS
-- ============================================================================
-- Run these after logging in as different users to test permissions

-- Test 1: Check if current user is a participant in any groups
SELECT 
  ag.id,
  ag.title,
  agp.role,
  'Can create tasks' as permission
FROM action_groups ag
JOIN action_group_participants agp ON ag.id = agp.group_id
WHERE agp.profile_id = auth.uid()
  AND ag.status = 'active';

-- Test 2: Check what tasks the current user can see
SELECT 
  t.id,
  t.title,
  t.status,
  ag.title as group_name,
  CASE 
    WHEN t.assignee_id = auth.uid() THEN 'Assigned to me'
    WHEN EXISTS (
      SELECT 1 FROM action_group_participants agp 
      WHERE agp.group_id = t.group_id 
      AND agp.profile_id = auth.uid()
    ) THEN 'Group member'
    ELSE 'Other'
  END as access_reason
FROM tasks t
JOIN action_groups ag ON t.group_id = ag.id;

-- ============================================================================
-- 8. TROUBLESHOOTING QUERIES
-- ============================================================================

-- If task creation fails, run this to check permissions:
-- Replace <group_id> with the actual group ID you're testing

/*
-- Check if you're a participant
SELECT 
  EXISTS (
    SELECT 1 FROM action_group_participants
    WHERE group_id = '<group_id>'
    AND profile_id = auth.uid()
  ) as am_i_participant;

-- Check if assignee is a participant
SELECT 
  EXISTS (
    SELECT 1 FROM action_group_participants
    WHERE group_id = '<group_id>'
    AND profile_id = '<assignee_id>'
  ) as is_assignee_participant;

-- Check all participants in the group
SELECT 
  p.id,
  p.name,
  p.email,
  agp.role
FROM action_group_participants agp
JOIN profiles p ON agp.profile_id = p.id
WHERE agp.group_id = '<group_id>';
*/

-- ============================================================================
-- 9. CLEANUP (if needed)
-- ============================================================================

-- To remove test tasks (use with caution):
-- DELETE FROM tasks WHERE title LIKE '%TEST%' OR title LIKE '%test%';

-- To check for orphaned tasks (tasks without a valid group):
SELECT 
  t.id,
  t.title,
  t.group_id,
  'Orphaned - group not found' as issue
FROM tasks t
LEFT JOIN action_groups ag ON t.group_id = ag.id
WHERE ag.id IS NULL;

-- ============================================================================
-- EXPECTED RESULTS AFTER FIX
-- ============================================================================
-- 
-- 1. Query 1 should return 2 rows (the new policies)
-- 2. Query 2 should show at least 6 policies for tasks table
-- 3. Query 3 should show rowsecurity = true
-- 4. Users who are participants in a group should be able to create tasks
-- 5. Users who are NOT participants should NOT be able to create tasks
-- 6. Managers, HR, and Admin should always be able to create tasks
-- 7. Tasks can only be assigned to participants of the same group
-- ============================================================================
