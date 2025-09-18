/*
  # Fix profiles RLS policies for user signup

  1. Security
    - Drop existing conflicting policies
    - Enable RLS on profiles table
    - Add policy for authenticated users to insert their own profile
    - Add policy for authenticated users to read their own profile
    - Add policy for authenticated users to update their own profile

  2. Changes
    - Allows new users to create profiles during signup
    - Maintains security by restricting access to own data only
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own data" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own PDIs" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for authenticated users
CREATE POLICY "Allow individual insert for authenticated users" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create SELECT policy for authenticated users
CREATE POLICY "Allow individual select for authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Create UPDATE policy for authenticated users
CREATE POLICY "Allow individual update for authenticated users" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);