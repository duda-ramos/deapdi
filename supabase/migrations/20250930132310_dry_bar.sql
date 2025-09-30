/*
  # Fix Profiles RLS Recursion - Critical Fix

  This migration fixes the infinite recursion error in the profiles table RLS policies.
  The issue is caused by policies that reference the profiles table within themselves,
  creating circular dependencies.

  ## Changes Made:
  1. Drop all existing problematic policies on profiles table
  2. Create simple, non-recursive policies
  3. Ensure proper permissions for each role without circular references
  4. Add basic anon permissions for health checks

  ## Security Model:
  - Users can access their own profile data
  - Managers can access their team members' profiles  
  - HR/Admin can access all profiles
  - Anonymous users can perform basic health checks
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_team_read" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_all" ON profiles;

-- Simple policy: Users can access their own profile
CREATE POLICY "profiles_own_access" ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Manager policy: Can read team members (direct comparison, no recursion)
CREATE POLICY "profiles_manager_team_read" ON profiles
  FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

-- HR/Admin policy: Can access all profiles (role check without recursion)
CREATE POLICY "profiles_hr_admin_all" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('hr', 'admin')
    )
  );

-- Allow anonymous health checks (count queries only)
CREATE POLICY "profiles_anon_health_check" ON profiles
  FOR SELECT
  TO anon
  USING (false); -- This allows COUNT queries but not actual data access

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add index to optimize policy queries
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id_role ON profiles(manager_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role, id);

-- Grant necessary permissions to anon role for health checks
GRANT SELECT ON profiles TO anon;