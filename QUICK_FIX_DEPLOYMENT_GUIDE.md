# 🚀 Quick Deployment Guide: Task Creation Fix

## TL;DR - Fix the Bug in 5 Minutes

### The Problem
Group participants cannot create tasks in action groups due to missing RLS INSERT policies.

### The Solution
Apply new RLS policies that allow group participants to insert tasks.

---

## 🎯 Quick Deploy (Production)

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to your project
   - Go to SQL Editor

2. **Run the Fix Script**
   - Copy the contents of: `DIAGNOSE_AND_FIX_TASK_RLS.sql`
   - Paste in SQL Editor
   - Click "Run"
   - Check output for any errors

3. **Verify**
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'tasks' 
   AND policyname = 'tasks_group_participants_insert';
   ```
   Should return 1 row.

4. **Test**
   - Login as a group participant
   - Try creating a task
   - Should work without errors

**Time Required:** ~2 minutes

---

### Option 2: Supabase CLI

```bash
# 1. Make sure CLI is installed and logged in
supabase --version

# 2. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Push the migration
supabase db push

# 4. Verify
supabase db diff --use-migra
```

**Time Required:** ~3 minutes

---

### Option 3: Direct SQL Connection

```bash
# 1. Get connection string from Supabase Dashboard
# Settings → Database → Connection string

# 2. Apply migration
psql "YOUR_CONNECTION_STRING" \
  -f supabase/migrations/20251029000000_fix_task_creation_rls.sql

# 3. Verify policies
psql "YOUR_CONNECTION_STRING" \
  -c "SELECT policyname FROM pg_policies WHERE tablename = 'tasks';"
```

**Time Required:** ~2 minutes

---

## 🧪 Quick Test

### Test in 1 Minute

1. **Login** as a regular employee (not admin)
2. **Go to** Action Groups page
3. **Open** any group where you're a participant
4. **Click** "Adicionar Tarefa"
5. **Fill** the form and submit

**Expected:** Task is created successfully ✅

**If it fails:**
- Check browser console for errors
- Run diagnostic queries from `VALIDATE_TASK_CREATION.sql`
- Check if policies were created correctly

---

## 📋 Pre-Deployment Checklist

- [ ] Backup database (Supabase has automatic backups, but verify)
- [ ] Review migration file: `20251029000000_fix_task_creation_rls.sql`
- [ ] Have rollback plan ready (see below)
- [ ] Notify team about deployment
- [ ] Have test account credentials ready

---

## 🔄 Rollback (If Needed)

If something goes wrong, run this:

```sql
-- Remove the new policies
DROP POLICY IF EXISTS "tasks_group_participants_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_manage" ON tasks;
DROP POLICY IF EXISTS "tasks_group_leaders_delete" ON tasks;
```

This reverts to the previous state (where only group creators and managers can create tasks).

---

## 🎯 What Gets Fixed

| Before | After |
|--------|-------|
| ❌ Only group creators can add tasks | ✅ All participants can add tasks |
| ❌ Leaders can't manage their groups | ✅ Leaders can manage all tasks |
| ❌ Collaboration limited | ✅ Full collaboration enabled |

---

## 📊 Monitoring

### Check for Issues

**Dashboard Query (run hourly for first day):**
```sql
SELECT 
  COUNT(*) as tasks_created,
  COUNT(DISTINCT assignee_id) as unique_assignees,
  COUNT(DISTINCT group_id) as groups_affected
FROM tasks
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Look for:**
- ✅ Increase in task creation rate
- ✅ More diverse assignees
- ❌ No RLS error logs

---

## 🆘 Troubleshooting

### Issue: "Permission denied for table tasks"
**Solution:** Policies weren't applied. Re-run the fix script.

### Issue: "Cannot create task for this user"
**Solution:** Check if assignee is a group participant:
```sql
SELECT * FROM action_group_participants 
WHERE group_id = 'GROUP_ID' AND profile_id = 'USER_ID';
```

### Issue: Form submits but no task appears
**Solution:** Check browser console and database logs. Task might be created but not refreshing in UI.

### Issue: Migration fails with "policy already exists"
**Solution:** Normal if re-running. Check if policies exist:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'tasks';
```

---

## 📞 Support

If issues persist:

1. Check full documentation: `BUG_FIX_REPORT_ACTION_GROUP_TASKS.md`
2. Run diagnostic script: `DIAGNOSE_AND_FIX_TASK_RLS.sql`
3. Run validation queries: `VALIDATE_TASK_CREATION.sql`
4. Check Supabase logs in Dashboard → Database → Logs

---

## ✅ Success Criteria

Deploy is successful when:

1. ✅ Migration runs without errors
2. ✅ New policies are in `pg_policies` table
3. ✅ Group participants can create tasks via UI
4. ✅ Tasks appear in database and UI
5. ✅ No RLS errors in logs
6. ✅ Assignees receive notifications

---

## 📅 Post-Deployment

- [ ] Monitor task creation rate (should increase)
- [ ] Check for user feedback/support tickets (should decrease)
- [ ] Verify no performance degradation
- [ ] Update status page/changelog
- [ ] Mark bug as resolved in issue tracker

---

**Deployment Difficulty:** 🟢 Easy  
**Risk Level:** 🟢 Low (policies only add permissions, don't remove)  
**Rollback Time:** < 1 minute  
**Expected Downtime:** None

---

*Created: November 25, 2025*  
*For: Bug Fix #3 - Task Creation in Action Groups*
