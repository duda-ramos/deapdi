/*
  # Create get_mental_health_stats function

  1. New Functions
    - `get_mental_health_stats()` - Returns aggregated mental health statistics
      - total_employees_participating
      - average_mood_score
      - sessions_this_month
      - high_risk_responses
      - active_alerts
      - wellness_resources_accessed

  2. Security
    - Function is accessible to authenticated users with HR/admin roles
*/

-- Create the mental health stats function
CREATE OR REPLACE FUNCTION get_mental_health_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_employees integer := 0;
  avg_mood numeric := 0;
  sessions_count integer := 0;
  high_risk_count integer := 0;
  alerts_count integer := 0;
  resources_accessed integer := 0;
BEGIN
  -- Check if user has permission (HR or Admin)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('hr', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. HR or Admin role required.';
  END IF;

  -- Get total employees participating (those who have emotional checkins)
  SELECT COUNT(DISTINCT employee_id) INTO total_employees
  FROM emotional_checkins
  WHERE created_at >= NOW() - INTERVAL '30 days';

  -- Get average mood score from recent checkins
  SELECT COALESCE(AVG(mood_rating), 0) INTO avg_mood
  FROM emotional_checkins
  WHERE created_at >= NOW() - INTERVAL '7 days';

  -- Get sessions this month
  SELECT COUNT(*) INTO sessions_count
  FROM psychology_sessions
  WHERE scheduled_date >= DATE_TRUNC('month', NOW())
  AND scheduled_date < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- Get high risk responses (if form_responses table exists)
  BEGIN
    SELECT COUNT(*) INTO high_risk_count
    FROM form_responses
    WHERE risk_level IN ('alto', 'critico')
    AND created_at >= NOW() - INTERVAL '30 days';
  EXCEPTION
    WHEN undefined_table THEN
      high_risk_count := 0;
  END;

  -- Get active alerts
  BEGIN
    SELECT COUNT(*) INTO alerts_count
    FROM mental_health_alerts
    WHERE acknowledged_at IS NULL;
  EXCEPTION
    WHEN undefined_table THEN
      alerts_count := 0;
  END;

  -- Get wellness resources accessed (if wellness_resources table exists)
  BEGIN
    SELECT COALESCE(SUM(view_count), 0) INTO resources_accessed
    FROM wellness_resources
    WHERE created_at >= NOW() - INTERVAL '30 days';
  EXCEPTION
    WHEN undefined_table THEN
      resources_accessed := 0;
  END;

  -- Build result JSON
  result := json_build_object(
    'total_employees_participating', total_employees,
    'average_mood_score', ROUND(avg_mood, 1),
    'sessions_this_month', sessions_count,
    'high_risk_responses', high_risk_count,
    'active_alerts', alerts_count,
    'wellness_resources_accessed', resources_accessed
  );

  RETURN result;
END;
$$;