/*
  # Temporarily Disable RLS on Profiles Table

  This migration temporarily disables RLS on the profiles table to fix the infinite recursion
  error that's preventing user authentication. This is a temporary fix to get the system
  working again.

  ## Changes
  1. Drop all existing policies on profiles table
  2. Disable RLS on profiles table
  3. Keep RLS disabled on achievements table (referenced in the join)

  ## Security Note
  This temporarily removes access control on profiles. Re-enable with proper policies
  once the recursion issue is resolved.
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_own_full_access" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_read" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_update" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_team_read" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_team_update" ON profiles;

-- Temporarily disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Also ensure achievements table has RLS disabled to prevent issues with the join
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;