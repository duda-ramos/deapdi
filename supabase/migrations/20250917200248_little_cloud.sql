/*
  # Fix profiles RLS infinite recursion

  1. Problem
    - Current RLS policies are causing infinite recursion
    - Policies are referencing the profiles table within themselves
    - This creates circular dependencies during policy evaluation

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Use direct auth.uid() comparisons without subqueries
    - Avoid self-referencing the profiles table in policy conditions

  3. New Policies
    - Users can read/update their own profile (auth.uid() = id)
    - All authenticated users can read all profiles (for team visibility)
    - Only the profile owner can update their own data
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "HR and Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);