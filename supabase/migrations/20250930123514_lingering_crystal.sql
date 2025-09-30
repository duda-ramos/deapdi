/*
  # Fix Action Groups RLS Policies - Remove Infinite Recursion

  This migration fixes the infinite recursion issue in action_groups RLS policies by:
  1. Dropping all existing problematic policies
  2. Creating new, simple policies without self-referencing subqueries
  3. Using direct comparisons with auth.uid() instead of complex JOINs

  ## Changes Made:
  1. **Removed Recursive Policies**: All policies that reference action_groups within subqueries
  2. **Simple Access Control**: Direct comparison with created_by and participant relationships
  3. **Separate Participant Check**: Use action_group_participants table directly without joining back to action_groups
  4. **Role-Based Access**: Clear separation between creator, participant, and admin access

  ## Security Model:
  - **Creators**: Full access to their own groups
  - **Participants**: Read access to groups they participate in
  - **Managers/HR/Admin**: Full access to all groups
  - **Others**: No access
*/

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Enhanced group management" ON action_groups;
DROP POLICY IF EXISTS "Group leaders can manage their groups" ON action_groups;
DROP POLICY IF EXISTS "Group members can read group tasks" ON action_groups;
DROP POLICY IF EXISTS "Users can read own tasks" ON action_groups;
DROP POLICY IF EXISTS "Users can update own tasks" ON action_groups;
DROP POLICY IF EXISTS "tasks_assignee_access" ON action_groups;
DROP POLICY IF EXISTS "tasks_group_creator_manage" ON action_groups;
DROP POLICY IF EXISTS "tasks_group_participants_read" ON action_groups;
DROP POLICY IF EXISTS "tasks_manager_admin_all" ON action_groups;
DROP POLICY IF EXISTS "Creators can update own groups" ON action_groups;
DROP POLICY IF EXISTS "Managers can manage all groups" ON action_groups;
DROP POLICY IF EXISTS "Users can create action groups" ON action_groups;
DROP POLICY IF EXISTS "Users can create groups" ON action_groups;
DROP POLICY IF EXISTS "Users can delete their own groups" ON action_groups;
DROP POLICY IF EXISTS "Users can read action groups" ON action_groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON action_groups;
DROP POLICY IF EXISTS "Users can view all groups" ON action_groups;
DROP POLICY IF EXISTS "action_groups_create" ON action_groups;
DROP POLICY IF EXISTS "action_groups_creator_update" ON action_groups;
DROP POLICY IF EXISTS "action_groups_manager_update" ON action_groups;
DROP POLICY IF EXISTS "action_groups_read_all" ON action_groups;

-- Step 2: Create new, simple policies without recursion

-- Policy 1: Creators can manage their own groups
CREATE POLICY "action_groups_creator_access"
  ON action_groups
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy 2: Participants can read groups they participate in
-- This uses a direct check against action_group_participants without referencing action_groups
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

-- Policy 3: Managers, HR, and Admins can access all groups
CREATE POLICY "action_groups_admin_access"
  ON action_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  );

-- Policy 4: Allow INSERT for authenticated users (they become creators)
CREATE POLICY "action_groups_create"
  ON action_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Step 3: Ensure action_group_participants policies are also simple
-- Drop any problematic participant policies
DROP POLICY IF EXISTS "Group leaders can manage their groups" ON action_group_participants;
DROP POLICY IF EXISTS "Users can join public groups" ON action_group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON action_group_participants;
DROP POLICY IF EXISTS "Users can view participants of their groups" ON action_group_participants;
DROP POLICY IF EXISTS "participants_creator_manage" ON action_group_participants;
DROP POLICY IF EXISTS "participants_join_groups" ON action_group_participants;
DROP POLICY IF EXISTS "participants_leave_groups" ON action_group_participants;
DROP POLICY IF EXISTS "participants_read_all" ON action_group_participants;

-- Create simple participant policies
CREATE POLICY "participants_creator_manage"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT id 
      FROM action_groups 
      WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id 
      FROM action_groups 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "participants_self_manage"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "participants_admin_access"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  );

-- Step 4: Verify RLS is enabled
ALTER TABLE action_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_group_participants ENABLE ROW LEVEL SECURITY;

-- Step 5: Create indexes to improve performance of the new policies
CREATE INDEX IF NOT EXISTS idx_action_groups_created_by ON action_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_action_group_participants_profile_id ON action_group_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_action_group_participants_group_id ON action_group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);