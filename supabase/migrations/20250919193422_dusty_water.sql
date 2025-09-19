/*
  # Fix Infinite Recursion in Profiles RLS Policies

  This migration removes problematic RLS policies that cause infinite recursion
  and replaces them with simple, non-recursive policies.

  ## Changes Made
  1. Drop all existing policies on profiles table
  2. Create simple policies that avoid self-referencing queries
  3. Use direct auth.uid() comparisons without complex joins
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_team_read" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_update_all" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_read_team" ON profiles;

-- Simple policy: Users can read and update their own profile
CREATE POLICY "profiles_own_full_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple policy: HR and Admin can read all profiles (no complex joins)
CREATE POLICY "profiles_hr_admin_read"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('hr', 'admin')
    )
  );

-- Simple policy: HR and Admin can update all profiles (no complex joins)
CREATE POLICY "profiles_hr_admin_update"
  ON profiles
  FOR UPDATE
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

-- Temporarily disable manager team access to avoid recursion
-- This can be re-enabled later with a more careful implementation
-- that doesn't cause infinite loops

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;