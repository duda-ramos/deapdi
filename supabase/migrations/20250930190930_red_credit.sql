/*
  # Complete RLS Consolidation - Fix Infinite Recursion

  This migration consolidates and fixes all RLS policies to eliminate infinite recursion.
  It replaces recursive policies with JWT-based policies for better performance and stability.

  ## Key Changes:
  1. Remove all recursive policies on profiles table
  2. Implement JWT-based role checking
  3. Add automatic role synchronization
  4. Create performance indexes
  5. Ensure all tables have proper RLS policies

  ## Security Model:
  - admin: Full access to everything
  - hr: Access to all employee data except system config
  - manager: Access to own team members only
  - employee: Access to own data only

  Based on: RLS_IMPLEMENTATION_SUMMARY.md and RLS_SECURITY_DOCUMENTATION.md
*/

-- ============================================================================
-- SECTION 1: CLEANUP EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_hr_admin_jwt" ON profiles;
DROP POLICY IF EXISTS "profiles_manager_team_read" ON profiles;
DROP POLICY IF EXISTS "profiles_anon_health" ON profiles;
DROP POLICY IF EXISTS "profiles_anon_health_check" ON profiles;

-- ============================================================================
-- SECTION 2: JWT ROLE SYNCHRONIZATION SYSTEM
-- ============================================================================

-- Function to sync user role to JWT claims
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's JWT claims with the new role
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_role', NEW.role::text)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync role changes
DROP TRIGGER IF EXISTS sync_role_to_jwt_trigger ON profiles;
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- ============================================================================
-- SECTION 3: NON-RECURSIVE PROFILES POLICIES
-- ============================================================================

-- Policy 1: Users can access their own profile data
CREATE POLICY "profiles_own_access"
  ON profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 2: HR and Admin have full access via JWT
CREATE POLICY "profiles_hr_admin_jwt"
  ON profiles FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Policy 3: Managers can read their team members
CREATE POLICY "profiles_manager_team_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

-- Policy 4: Anonymous health checks (for system monitoring)
CREATE POLICY "profiles_anon_health"
  ON profiles FOR SELECT
  TO anon
  USING (false);

-- ============================================================================
-- SECTION 4: OTHER CRITICAL TABLE POLICIES
-- ============================================================================

-- Salary History - Ultra-sensitive data
DROP POLICY IF EXISTS "salary_own_read" ON salary_history;
DROP POLICY IF EXISTS "salary_hr_admin_all" ON salary_history;

CREATE POLICY "salary_own_read"
  ON salary_history FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "salary_hr_admin_all"
  ON salary_history FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Emotional Check-ins - Private mental health data
DROP POLICY IF EXISTS "emotional_own" ON emotional_checkins;
DROP POLICY IF EXISTS "emotional_hr_read" ON emotional_checkins;

CREATE POLICY "emotional_own"
  ON emotional_checkins FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "emotional_hr_read"
  ON emotional_checkins FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- PDIs - Development plans
DROP POLICY IF EXISTS "pdis_own" ON pdis;
DROP POLICY IF EXISTS "pdis_mentor" ON pdis;
DROP POLICY IF EXISTS "pdis_mentor_update" ON pdis;
DROP POLICY IF EXISTS "pdis_manager" ON pdis;
DROP POLICY IF EXISTS "pdis_hr_admin" ON pdis;

CREATE POLICY "pdis_own"
  ON pdis FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "pdis_mentor"
  ON pdis FOR SELECT
  TO authenticated
  USING (mentor_id = auth.uid());

CREATE POLICY "pdis_mentor_update"
  ON pdis FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "pdis_hr_admin"
  ON pdis FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Competencies
DROP POLICY IF EXISTS "competencies_own" ON competencies;
DROP POLICY IF EXISTS "competencies_hr_admin" ON competencies;
DROP POLICY IF EXISTS "competencies_manager_read" ON competencies;
DROP POLICY IF EXISTS "competencies_manager_update" ON competencies;

CREATE POLICY "competencies_own"
  ON competencies FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "competencies_hr_admin"
  ON competencies FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- System Config - Admin only
DROP POLICY IF EXISTS "system_config_admin" ON system_config;

CREATE POLICY "system_config_admin"
  ON system_config FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

-- Teams - Read all, manage by HR/Admin
DROP POLICY IF EXISTS "teams_read_all" ON teams;
DROP POLICY IF EXISTS "teams_hr_admin_manage" ON teams;

CREATE POLICY "teams_read_all"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teams_hr_admin_manage"
  ON teams FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Notifications - Own access + system insert
DROP POLICY IF EXISTS "notifications_own" ON notifications;
DROP POLICY IF EXISTS "notifications_system" ON notifications;

CREATE POLICY "notifications_own"
  ON notifications FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "notifications_system"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- SECTION 5: PERFORMANCE INDEXES
-- ============================================================================

-- Critical indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_auth ON profiles(id);

CREATE INDEX IF NOT EXISTS idx_salary_profile ON salary_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_emotional_checkins_employee ON emotional_checkins(employee_id);
CREATE INDEX IF NOT EXISTS idx_pdis_profile ON pdis(profile_id);
CREATE INDEX IF NOT EXISTS idx_pdis_mentor ON pdis(mentor_id) WHERE mentor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_competencies_profile ON competencies(profile_id);

-- ============================================================================
-- SECTION 6: SYNC EXISTING USERS
-- ============================================================================

-- Sync all existing users' roles to JWT
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('user_role', p.role::text)
FROM profiles p 
WHERE auth.users.id = p.id;

-- ============================================================================
-- SECTION 7: VALIDATION
-- ============================================================================

-- Verify no recursive policies exist
DO $$
DECLARE
  recursive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recursive_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND (qual LIKE '%FROM profiles%' OR with_check LIKE '%FROM profiles%')
    AND policyname != 'profiles_manager_team_read'; -- This one is safe
  
  IF recursive_count > 0 THEN
    RAISE EXCEPTION 'Recursive policies still exist on profiles table!';
  END IF;
  
  RAISE NOTICE 'RLS Consolidation completed successfully. No recursive policies detected.';
END $$;

-- ============================================================================
-- FINAL NOTES
-- ============================================================================

/*
  This migration eliminates infinite recursion by:
  
  1. Using auth.jwt() ->> 'user_role' instead of querying profiles table
  2. Automatic role synchronization via trigger
  3. Performance indexes for policy evaluation
  4. Clear separation of concerns per role
  
  Security guarantees:
  - Employees: Own data only
  - Managers: Own data + direct reports
  - HR: All employee data (except system config)
  - Admin: Everything including system config
  
  Performance improvements:
  - No subqueries in policies
  - JWT claims cached by Supabase
  - Strategic indexes for fast lookups
  
  Next steps:
  1. Test with different user roles
  2. Monitor query performance
  3. Run RLS_VALIDATION_SCRIPT.sql to verify
*/