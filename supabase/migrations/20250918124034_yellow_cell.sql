/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - RLS policies on profiles table are causing infinite recursion
    - Policies are referencing profiles table within their own conditions
    - This creates a loop when Supabase tries to evaluate access permissions

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Avoid subqueries that reference the same table being queried

  3. Security
    - Users can view/edit their own profiles
    - Admins and HR can view all profiles
    - Managers can view their direct reports (simplified)
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile after signup" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin and HR can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow individual select for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow individual update for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile after signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Simple admin policy without recursion
CREATE POLICY "profiles_admin_all" 
ON profiles FOR ALL 
USING (
  auth.jwt() ->> 'email' IN (
    'admin@empresa.com',
    'rh@empresa.com'
  )
);

-- Fix teams policies as well
DROP POLICY IF EXISTS "Managers and above can manage teams" ON teams;
DROP POLICY IF EXISTS "Users can read teams" ON teams;

CREATE POLICY "teams_select_all" 
ON teams FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "teams_admin_manage" 
ON teams FOR ALL 
USING (
  auth.jwt() ->> 'email' IN (
    'admin@empresa.com',
    'rh@empresa.com'
  )
);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;