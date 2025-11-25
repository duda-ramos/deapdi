/*
  # Fix RLS for resource_favorites table
  
  ## Issue
  Table `resource_favorites` discovered without RLS during security audit.
  
  ## Changes
  1. Enable RLS on resource_favorites
  2. Create 4 policies:
     - Users can SELECT their own favorites
     - Users can INSERT their own favorites
     - Users can DELETE their own favorites
     - HR/Admin can SELECT all favorites (for analytics)
  
  ## Security
  - Criticality: MEDIUM (user preferences data)
  - Impact: Prevents unauthorized access to favorite patterns
  - Compliance: LGPD-compliant (personal data protection)
*/

-- Enable RLS
ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own favorites
CREATE POLICY "resource_favorites_own_select"
  ON resource_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can add their own favorites
CREATE POLICY "resource_favorites_own_insert"
  ON resource_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can remove their own favorites
CREATE POLICY "resource_favorites_own_delete"
  ON resource_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 4: HR/Admin can view all favorites (for analytics)
CREATE POLICY "resource_favorites_hr_admin_select"
  ON resource_favorites
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role')::text IN ('hr', 'admin')
  );
