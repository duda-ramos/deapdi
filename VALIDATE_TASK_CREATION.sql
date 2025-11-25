-- ============================================================================
-- VALIDATION SCRIPT: Test Task Creation in Action Groups
-- ============================================================================
-- This script helps validate that the task creation fix is working correctly
-- Run these queries to verify the fix before and after testing in the UI
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if RLS is enabled on tasks table
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'tasks';

-- Expected: rls_enabled = true

-- ============================================================================
-- STEP 2: List all RLS policies on tasks table
-- ============================================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
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

-- Expected: Should see "tasks_group_participants_insert" with cmd = 'INSERT'

-- ============================================================================
-- STEP 3: Check specific INSERT policies
-- ============================================================================
SELECT 
  policyname,
  pg_get_expr(with_check, 'tasks'::regclass) as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tasks'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Expected: Should include policy checking for group participation

-- ============================================================================
-- STEP 4: List active action groups
-- ============================================================================
SELECT 
  id,
  title,
  description,
  status,
  created_by,
  deadline,
  created_at
FROM action_groups
WHERE status = 'active'
ORDER BY created_at DESC;

-- Note: Pick a group_id from this list for testing

-- ============================================================================
-- STEP 5: List participants of a specific group
-- ============================================================================
-- Replace 'YOUR_GROUP_ID_HERE' with an actual group ID from Step 4
/*
SELECT 
  agp.profile_id,
  p.name,
  p.email,
  agp.role,
  agp.created_at
FROM action_group_participants agp
JOIN profiles p ON p.id = agp.profile_id
WHERE agp.group_id = 'YOUR_GROUP_ID_HERE'
ORDER BY agp.role DESC, p.name;
*/

-- ============================================================================
-- STEP 6: Check current user's group memberships
-- ============================================================================
-- Run this as the logged-in user to see which groups they're part of
SELECT 
  ag.id as group_id,
  ag.title,
  agp.role,
  ag.status,
  ag.deadline
FROM action_group_participants agp
JOIN action_groups ag ON ag.id = agp.group_id
WHERE agp.profile_id = auth.uid()
ORDER BY ag.created_at DESC;

-- ============================================================================
-- STEP 7: Count tasks in each group
-- ============================================================================
SELECT 
  ag.id,
  ag.title,
  ag.status,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as pending_tasks
FROM action_groups ag
LEFT JOIN tasks t ON t.group_id = ag.id
GROUP BY ag.id, ag.title, ag.status
ORDER BY ag.created_at DESC;

-- ============================================================================
-- STEP 8: View recent tasks (last 10)
-- ============================================================================
SELECT 
  t.id,
  t.title,
  t.status,
  t.deadline,
  ag.title as group_name,
  p.name as assignee_name,
  t.created_at
FROM tasks t
JOIN action_groups ag ON ag.id = t.group_id
JOIN profiles p ON p.id = t.assignee_id
ORDER BY t.created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 9: Test task creation (Manual Test)
-- ============================================================================
-- After fixing RLS, test by:
-- 1. Login as a group participant (not the creator)
-- 2. Navigate to Action Groups page
-- 3. Open a group where you're a participant
-- 4. Click "Add Task" / "Nova Tarefa"
-- 5. Fill in:
--    - Title: "Test Task - Bug Fix Validation"
--    - Description: "Testing task creation after RLS fix"
--    - Assignee: Select any group participant
--    - Deadline: Select a future date
-- 6. Click "Create Task" / "Criar Tarefa"
-- 7. Verify:
--    - No error appears
--    - Task appears in the task list
--    - Task is saved in database (check with Step 8)

-- ============================================================================
-- STEP 10: Verify the test task was created
-- ============================================================================
-- Run this after creating the test task to confirm it's in the database
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.deadline,
  ag.title as group_name,
  p_assignee.name as assignee_name,
  p_creator.name as created_by_name,
  t.created_at
FROM tasks t
JOIN action_groups ag ON ag.id = t.group_id
JOIN profiles p_assignee ON p_assignee.id = t.assignee_id
LEFT JOIN profiles p_creator ON p_creator.id = auth.uid()
WHERE t.title ILIKE '%test%' OR t.title ILIKE '%bug fix%'
ORDER BY t.created_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 11: Check for RLS-related errors in recent operations
-- ============================================================================
-- If you have audit_logs table enabled:
/*
SELECT 
  action,
  table_name,
  error_message,
  performed_by,
  performed_at
FROM audit_logs
WHERE table_name = 'tasks'
  AND error_message IS NOT NULL
ORDER BY performed_at DESC
LIMIT 10;
*/

-- ============================================================================
-- VALIDATION CHECKLIST
-- ============================================================================
/*
✅ RLS is enabled on tasks table (Step 1)
✅ INSERT policy exists for group participants (Step 2)
✅ Active groups exist for testing (Step 4)
✅ Current user is a participant in at least one group (Step 6)
✅ Can create task through UI without errors (Step 9)
✅ Task appears in database after creation (Step 10)
✅ No RLS errors in console or logs (Step 11)
✅ Task appears in Action Groups UI
✅ Assignee receives notification (if notification system is working)

If all checkboxes are ✅, the fix is successful!
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
/*
If task creation still fails:

1. Check browser console for specific error message
2. Verify user is logged in and authenticated
3. Verify user is actually a participant of the group:
   SELECT * FROM action_group_participants 
   WHERE group_id = 'GROUP_ID' AND profile_id = auth.uid();

4. Check if there are conflicting policies:
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'tasks' AND cmd IN ('INSERT', 'ALL');

5. Verify group_id is being passed correctly (check browser network tab)

6. Test direct INSERT query to isolate RLS issue:
   -- This should succeed if RLS is configured correctly
   INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
   VALUES (
     'Manual Test Task',
     'Testing RLS policy',
     'ASSIGNEE_ID',  -- Must be a group participant
     'GROUP_ID',     -- Group where current user is a participant
     CURRENT_DATE + INTERVAL '7 days',
     'todo'
   );
*/
