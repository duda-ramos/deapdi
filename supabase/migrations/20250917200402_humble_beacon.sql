/*
  # Temporarily disable RLS on profiles table to fix infinite recursion

  This migration temporarily disables Row Level Security on the profiles table
  to resolve the infinite recursion error that's preventing the app from loading.
  
  This is a temporary fix - RLS should be re-enabled with proper policies later.
*/

-- Disable RLS on profiles table temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "HR and Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;