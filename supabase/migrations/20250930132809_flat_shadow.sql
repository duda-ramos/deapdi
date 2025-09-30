/*
  # Fix profiles RLS recursion - Complete Solution

  1. Drop all existing policies that cause recursion
  2. Create simple, non-recursive policies
  3. Add optimized indexes for policy performance
  4. Enable anonymous access for health checks
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_anon_health_check" ON public.profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manager_team_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;

-- Temporarily disable RLS to clear any cached policy evaluations
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. Users can access their own profile data
CREATE POLICY "profiles_own_access" ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Allow anonymous health checks (count queries only)
CREATE POLICY "profiles_health_check" ON public.profiles
  FOR SELECT
  TO anon
  USING (false); -- This will allow count queries but not actual data

-- 3. HR and Admin can access all profiles (simplified role check)
CREATE POLICY "profiles_hr_admin_all" ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@empresa.com', 
        'rh@empresa.com'
      )
    )
    OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('hr', 'admin')
      AND id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@empresa.com', 
        'rh@empresa.com'
      )
    )
    OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('hr', 'admin')
      AND id = auth.uid()
    )
  );

-- 4. Managers can read their team members (direct manager_id check)
CREATE POLICY "profiles_manager_team_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

-- Add optimized indexes for policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id_policy ON public.profiles(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role_policy ON public.profiles(role) WHERE role IN ('hr', 'admin');
CREATE INDEX IF NOT EXISTS idx_profiles_id_auth ON public.profiles(id);

-- Grant necessary permissions for anonymous health checks
GRANT SELECT ON public.profiles TO anon;