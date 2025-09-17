/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current RLS policies on profiles table are causing infinite recursion
    - Policies are referencing profiles table within their own conditions
    - This creates a loop when trying to fetch user profiles

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Use auth.uid() directly without subqueries to profiles table
    - Separate policies for different user roles without complex joins

  3. New Policies
    - Users can read/update their own profile using auth.uid() = id
    - HR and Admin can read all profiles using role check on auth.jwt()
    - Managers can read team profiles using direct manager_id comparison
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can read team profiles" ON profiles;

-- Create simple, non-recursive policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- HR and Admin can read all profiles (using JWT claims instead of table lookup)
CREATE POLICY "HR and Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text IN ('hr', 'admin')
    OR
    auth.uid() = id
  );

-- HR and Admin can insert profiles
CREATE POLICY "HR and Admin can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text IN ('hr', 'admin')
  );

-- HR and Admin can update all profiles
CREATE POLICY "HR and Admin can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text IN ('hr', 'admin')
    OR
    auth.uid() = id
  );

-- Managers can read profiles where they are the manager (direct comparison, no subquery)
CREATE POLICY "Managers can read team profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR
    auth.uid() = id
    OR
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text IN ('hr', 'admin')
  );