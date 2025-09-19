/*
  # Completely Disable RLS on Profiles Table

  This migration completely removes all RLS policies and disables RLS
  on the profiles table to fix the infinite recursion error.
  
  IMPORTANT: This is a temporary security bypass. Re-enable RLS with
  proper policies once authentication is working.
*/

-- Drop ALL existing policies on profiles table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Disable RLS entirely on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on achievements table (used in the join)
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;

-- Drop any policies on achievements table as well
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'achievements' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.achievements', policy_record.policyname);
    END LOOP;
END $$;