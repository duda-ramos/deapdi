# 🧪 Test Plan: Bug #3 - Task Creation in Action Groups

## Test Execution Guide

### Prerequisites
- [ ] Database backup completed
- [ ] Migration file reviewed: `20251029000000_fix_task_creation_rls.sql`
- [ ] Test environment available
- [ ] Test user accounts prepared (different roles)
- [ ] Browser dev tools ready for debugging

---

## Phase 1: Pre-Deployment Validation

### Test 1.1: Verify Current State (Bug Reproduction)
**Objective:** Confirm the bug exists before fix

**Steps:**
1. Login as a regular employee (group member, not creator)
2. Navigate to `/action-groups`
3. Open a group where user is a participant
4. Click "Adicionar Tarefa" / "Add Task"
5. Fill in form with valid data
6. Submit

**Expected Before Fix:**
- ❌ Error message appears OR
- ❌ Task doesn't appear in list OR
- ❌ Console shows RLS error

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 1.2: Check Database Policies
**Objective:** Verify current RLS policies

**SQL Query:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' 
AND cmd IN ('INSERT', 'ALL')
ORDER BY policyname;
```

**Expected Before Fix:**
- Should NOT see `tasks_group_participants_insert`
- Should see `tasks_creator` (ALL)
- Should see `tasks_managers_all` (ALL)

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 2: Deploy Fix

### Test 2.1: Apply Migration
**Objective:** Deploy the RLS policy fix

**Method 1 - Supabase Dashboard:**
1. Open Supabase → SQL Editor
2. Copy contents of `DIAGNOSE_AND_FIX_TASK_RLS.sql`
3. Execute
4. Check for errors in output

**Method 2 - CLI:**
```bash
supabase db push
```

**Expected:**
- ✅ Migration completes without errors
- ✅ Policies created successfully

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 2.2: Verify Policies Created
**Objective:** Confirm new policies exist

**SQL Query:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' 
AND policyname IN (
  'tasks_group_participants_insert',
  'tasks_group_leaders_manage',
  'tasks_group_leaders_delete'
);
```

**Expected:**
```
policyname                          | cmd
------------------------------------|--------
tasks_group_participants_insert     | INSERT
tasks_group_leaders_manage          | UPDATE
tasks_group_leaders_delete          | DELETE
```

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 3: Functional Testing

### Test 3.1: Group Member Creates Task
**Objective:** Regular member can create tasks

**Test User:**
- Role: Employee
- Group Role: Member (not leader, not creator)

**Steps:**
1. Login as test user
2. Navigate to Action Groups
3. Select a group where user is a member
4. Click "Add Task"
5. Fill form:
   - Title: "Test Task - Member Creation"
   - Description: "Testing member task creation"
   - Assignee: Select any participant
   - Deadline: Tomorrow
6. Submit

**Expected:**
- ✅ Form submits without error
- ✅ Modal closes
- ✅ Task appears in task list
- ✅ Task has correct status (todo)
- ✅ No console errors

**Database Verification:**
```sql
SELECT * FROM tasks 
WHERE title = 'Test Task - Member Creation'
ORDER BY created_at DESC LIMIT 1;
```

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 3.2: Group Leader Creates Task
**Objective:** Leader can create tasks

**Test User:**
- Role: Employee
- Group Role: Leader

**Steps:**
1. Login as group leader
2. Navigate to Action Groups
3. Select a group where user is a leader
4. Click "Add Task"
5. Fill form:
   - Title: "Test Task - Leader Creation"
   - Description: "Testing leader task creation"
   - Assignee: Select any participant
   - Deadline: Tomorrow
6. Submit

**Expected:**
- ✅ Form submits without error
- ✅ Task appears in list
- ✅ Task is saved in database

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 3.3: Group Leader Updates Task
**Objective:** Leader can update any group task

**Test User:**
- Role: Employee
- Group Role: Leader

**Steps:**
1. Login as group leader
2. Navigate to group with existing tasks
3. Select a task assigned to someone else
4. Update task status (todo → in-progress)
5. Verify change is saved

**Expected:**
- ✅ Leader can update any task in their group
- ✅ Status change is reflected in UI
- ✅ Status change is saved in database

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 3.4: Group Leader Deletes Task
**Objective:** Leader can delete group tasks

**Test User:**
- Role: Employee
- Group Role: Leader

**Steps:**
1. Login as group leader
2. Navigate to group with existing tasks
3. Delete a test task
4. Verify task is removed

**Expected:**
- ✅ Leader can delete tasks
- ✅ Task is removed from UI
- ✅ Task is deleted from database

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 3.5: Group Creator Creates Task
**Objective:** Creator can still create tasks (existing functionality)

**Test User:**
- Role: Employee/Manager
- Group Role: Creator

**Steps:**
1. Login as group creator
2. Navigate to their created group
3. Create a task

**Expected:**
- ✅ Creator can create tasks (unchanged)

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 3.6: Manager Creates Task
**Objective:** Manager can create tasks (existing functionality)

**Test User:**
- Role: Manager

**Steps:**
1. Login as manager
2. Navigate to any group
3. Create a task

**Expected:**
- ✅ Manager can create tasks (unchanged)

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 4: Negative Testing (Security)

### Test 4.1: Non-Participant Cannot Create Task
**Objective:** Users outside group cannot create tasks

**Test User:**
- Employee not in the group

**Steps:**
1. Login as non-participant
2. Try to access group (should be visible if group is public)
3. Should NOT see "Add Task" button OR
4. If button visible, task creation should fail

**Expected:**
- ❌ Non-participants cannot create tasks
- ❌ If attempted, should get permission error

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 4.2: Cannot Assign to Non-Participant
**Objective:** Tasks can only be assigned to group participants

**Test User:**
- Group member or leader

**Steps:**
1. Login as group participant
2. Try to create task with assignee NOT in group
3. System should prevent this

**Expected:**
- ❌ Dropdown should only show group participants
- ❌ If manually attempted, should fail validation

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 4.3: Regular Member Cannot Update Others' Tasks
**Objective:** Members can only update their own tasks

**Test User:**
- Group member (not leader, not creator)

**Steps:**
1. Login as member
2. View task assigned to someone else
3. Try to update status

**Expected:**
- ❌ Member cannot update others' tasks OR
- ✅ Only leader/creator/assignee can update

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 5: Integration Testing

### Test 5.1: Task Creation Triggers Notification
**Objective:** Assignee receives notification

**Steps:**
1. Create task assigned to user A
2. Login as user A
3. Check notifications

**Expected:**
- ✅ Notification appears for assignee
- ✅ Notification has correct message
- ✅ Notification links to action groups

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 5.2: Task Completion Updates Group Progress
**Objective:** Group progress recalculates when tasks complete

**Steps:**
1. Note current group progress
2. Complete a task
3. Check group progress

**Expected:**
- ✅ Progress percentage increases
- ✅ UI reflects new progress
- ✅ Database has correct values

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 5.3: Task List Refreshes After Creation
**Objective:** New tasks appear without manual refresh

**Steps:**
1. Note current task count
2. Create new task
3. Check task list

**Expected:**
- ✅ New task appears in list
- ✅ Task count increments
- ✅ No page refresh needed

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 6: Edge Cases

### Test 6.1: Empty Required Fields
**Objective:** Form validation works

**Steps:**
1. Try to submit task with empty title
2. Try to submit without assignee
3. Try to submit without deadline

**Expected:**
- ❌ Form should not submit
- ✅ Error messages shown
- ✅ Fields highlighted as required

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 6.2: Past Deadline Date
**Objective:** Cannot set deadline in the past

**Steps:**
1. Try to create task with yesterday's date

**Expected:**
- ❌ Form validation prevents submission OR
- ❌ Backend rejects the date

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 6.3: Long Text Fields
**Objective:** Handle large input

**Steps:**
1. Create task with very long title (500+ chars)
2. Create task with very long description (5000+ chars)

**Expected:**
- ✅ Database handles long text
- ✅ UI displays appropriately (truncation/scrolling)
- ✅ No character limit errors (unless intentional)

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 6.4: Special Characters
**Objective:** Handle special characters in text

**Steps:**
1. Create task with title: "Test <script>alert('xss')</script>"
2. Create task with emojis: "Task 🚀✅📝"

**Expected:**
- ✅ Special characters are escaped
- ✅ No XSS vulnerabilities
- ✅ Emojis display correctly

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 6.5: Multiple Participants
**Objective:** Handle groups with many participants

**Steps:**
1. Test in group with 20+ participants
2. Create multiple tasks quickly

**Expected:**
- ✅ Dropdown performs well
- ✅ All tasks created successfully
- ✅ No performance issues

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 7: Performance Testing

### Test 7.1: Policy Performance
**Objective:** RLS policies don't slow down queries

**SQL Query:**
```sql
EXPLAIN ANALYZE
SELECT * FROM tasks 
WHERE group_id = 'some-group-id';
```

**Expected:**
- ✅ Query time < 100ms
- ✅ Uses indexes effectively
- ✅ No table scans

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

### Test 7.2: Bulk Operations
**Objective:** Handle multiple task creations

**Steps:**
1. Create 10 tasks rapidly
2. Check all are saved
3. Check UI performance

**Expected:**
- ✅ All tasks created successfully
- ✅ No UI lag
- ✅ No race conditions

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Phase 8: Browser Compatibility

### Test 8.1: Chrome/Edge
**Status:** [ ] PASS / [ ] FAIL

### Test 8.2: Firefox
**Status:** [ ] PASS / [ ] FAIL

### Test 8.3: Safari
**Status:** [ ] PASS / [ ] FAIL

### Test 8.4: Mobile Chrome
**Status:** [ ] PASS / [ ] FAIL

### Test 8.5: Mobile Safari
**Status:** [ ] PASS / [ ] FAIL

---

## Phase 9: Rollback Testing

### Test 9.1: Rollback Script
**Objective:** Verify rollback works if needed

**Steps:**
1. Run rollback script:
```sql
DROP POLICY IF EXISTS "tasks_group_participants_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_manage" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_delete" ON tasks;
```
2. Verify policies removed
3. Re-apply fix

**Expected:**
- ✅ Rollback completes without errors
- ✅ System reverts to previous state
- ✅ Re-application works

**Status:** [ ] PASS / [ ] FAIL  
**Notes:** _______________________

---

## Test Summary

### Execution Details
- **Date:** _______________________
- **Environment:** _______________________
- **Tester:** _______________________
- **Database Version:** _______________________
- **App Version:** _______________________

### Results
- **Total Tests:** 33
- **Passed:** _______
- **Failed:** _______
- **Skipped:** _______
- **Pass Rate:** _______%

### Critical Issues Found
1. _______________________
2. _______________________
3. _______________________

### Minor Issues Found
1. _______________________
2. _______________________
3. _______________________

### Recommendation
- [ ] ✅ APPROVED - Deploy to production
- [ ] ⚠️ CONDITIONAL - Fix minor issues first
- [ ] ❌ REJECTED - Fix critical issues

### Sign-Off
- **QA Lead:** _______________________ Date: _______
- **Developer:** _______________________ Date: _______
- **Product Owner:** _______________________ Date: _______

---

## Notes

_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

*Test Plan Version: 1.0*  
*Created: November 25, 2025*  
*For: Bug Fix #3 - Task Creation in Action Groups*
