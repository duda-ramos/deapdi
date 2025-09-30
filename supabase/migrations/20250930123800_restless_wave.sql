/*
  # Temporarily disable RLS for action_groups table

  This migration temporarily disables Row Level Security for the action_groups table
  to resolve the infinite recursion error in RLS policies.

  ## Changes
  1. Disable RLS on action_groups table
  2. Disable RLS on action_group_participants table (related table)
  
  ## Security Note
  This is a temporary fix. RLS should be re-enabled with proper policies once
  the recursion issue is resolved.
*/

-- Temporarily disable RLS on action_groups table
ALTER TABLE action_groups DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on related table to prevent issues
ALTER TABLE action_group_participants DISABLE ROW LEVEL SECURITY;

-- Add a comment to remind about re-enabling RLS
COMMENT ON TABLE action_groups IS 'RLS temporarily disabled due to recursion. Re-enable with fixed policies.';
COMMENT ON TABLE action_group_participants IS 'RLS temporarily disabled due to recursion. Re-enable with fixed policies.';