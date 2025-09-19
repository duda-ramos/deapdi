/*
  # Create Team Statistics Function

  1. New Functions
    - `get_team_stats()` - Returns comprehensive team statistics
    
  2. Statistics Included
    - Total teams count
    - Active teams count  
    - Teams without manager count
    - Average team size
    - Largest team size
    
  3. Security
    - Only accessible by HR and Admin roles
*/

CREATE OR REPLACE FUNCTION get_team_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_teams_count INTEGER;
  active_teams_count INTEGER;
  teams_without_manager_count INTEGER;
  avg_team_size NUMERIC;
  largest_team_size INTEGER;
BEGIN
  -- Security check: only HR and Admin can access
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('hr', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;

  -- Get total teams count
  SELECT COUNT(*) INTO total_teams_count
  FROM teams;

  -- Get active teams count
  SELECT COUNT(*) INTO active_teams_count
  FROM teams
  WHERE status = 'active';

  -- Get teams without manager count
  SELECT COUNT(*) INTO teams_without_manager_count
  FROM teams
  WHERE manager_id IS NULL AND status = 'active';

  -- Get average team size
  SELECT COALESCE(AVG(member_count), 0) INTO avg_team_size
  FROM (
    SELECT COUNT(p.id) as member_count
    FROM teams t
    LEFT JOIN profiles p ON p.team_id = t.id
    WHERE t.status = 'active'
    GROUP BY t.id
  ) team_sizes;

  -- Get largest team size
  SELECT COALESCE(MAX(member_count), 0) INTO largest_team_size
  FROM (
    SELECT COUNT(p.id) as member_count
    FROM teams t
    LEFT JOIN profiles p ON p.team_id = t.id
    WHERE t.status = 'active'
    GROUP BY t.id
  ) team_sizes;

  -- Build result JSON
  result := json_build_object(
    'total_teams', total_teams_count,
    'active_teams', active_teams_count,
    'teams_without_manager', teams_without_manager_count,
    'average_team_size', avg_team_size,
    'largest_team_size', largest_team_size
  );

  RETURN result;
END;
$$;