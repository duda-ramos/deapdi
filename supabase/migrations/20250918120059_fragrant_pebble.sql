/*
  # Fix RLS policies for profiles table

  1. Security Changes
    - Drop existing conflicting policies
    - Add policy for authenticated users to insert their own profile
    - Add policy for authenticated users to read their own profile  
    - Add policy for authenticated users to update their own profile

  2. Changes
    - Ensures users can create profiles during signup
    - Maintains security by restricting access to own profile only
    - Uses auth.uid() to match authenticated user ID
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read their own profile
CREATE POLICY "Allow authenticated users to read their own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow authenticated users to update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);