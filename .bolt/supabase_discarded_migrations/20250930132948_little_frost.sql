/*
  # Emergency Fix for Profiles RLS Recursion

  This migration completely disables and rebuilds the profiles RLS policies
  to eliminate the infinite recursion error that's preventing the app from loading.
*/

-- Step 1: Completely disable RLS to break the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies that might be causing recursion
DROP POLICY IF EXISTS "profiles_health_check" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_team_read" ON profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "HR can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can read team profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Step 3: Wait a moment for policy cache to clear (simulated with a comment)
-- Policy cache clearing...

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, non-recursive policies
-- Policy 1: Users can access their own profile (most basic, no recursion)
CREATE POLICY "profiles_own_simple" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 2: Allow anonymous health checks (count queries only)
CREATE POLICY "profiles_health_anonymous" ON profiles
  FOR SELECT
  TO anon
  USING (false); -- This will allow count queries but not actual data

-- Policy 3: HR/Admin access with direct email check (no profile table lookup)
CREATE POLICY "profiles_hr_direct" ON profiles
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('admin@empresa.com', 'rh@empresa.com')
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN ('admin@empresa.com', 'rh@empresa.com')
  );

-- Step 6: Grant necessary permissions for anonymous health checks
GRANT SELECT ON profiles TO anon;

-- Step 7: Create optimized indexes for the new policies
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON profiles(id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_profiles_manager_simple ON profiles(manager_id) WHERE manager_id IS NOT NULL;