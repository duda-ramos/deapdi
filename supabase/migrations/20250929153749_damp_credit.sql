/*
  # User Achievement Stats Function

  1. New Function
    - `get_user_achievement_stats` - Safely calculates user statistics for achievements
    - Avoids RLS policy recursion by using direct queries
    - Returns structured data for achievement progress calculation

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only accessible by authenticated users
    - Validates profile_id parameter
*/

-- Create function to get user achievement stats safely
CREATE OR REPLACE FUNCTION get_user_achievement_stats(p_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  completed_pdis INTEGER := 0;
  completed_tasks INTEGER := 0;
  completed_courses INTEGER := 0;
  competencies_rated INTEGER := 0;
  mentorship_sessions INTEGER := 0;
  career_progressions INTEGER := 0;
BEGIN
  -- Validate that the requesting user can access this profile's data
  IF NOT (
    auth.uid() = p_profile_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr', 'manager')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get completed PDIs
  SELECT COUNT(*)
  INTO completed_pdis
  FROM pdis
  WHERE profile_id = p_profile_id
    AND status IN ('completed', 'validated');

  -- Get completed tasks
  SELECT COUNT(*)
  INTO completed_tasks
  FROM tasks
  WHERE assignee_id = p_profile_id
    AND status = 'done';

  -- Get completed courses
  SELECT COUNT(*)
  INTO completed_courses
  FROM course_enrollments
  WHERE profile_id = p_profile_id
    AND status = 'completed';

  -- Get competencies with ratings
  SELECT COUNT(*)
  INTO competencies_rated
  FROM competencies
  WHERE profile_id = p_profile_id
    AND (self_rating IS NOT NULL OR manager_rating IS NOT NULL);

  -- Get mentorship sessions (simplified count)
  SELECT COUNT(DISTINCT ms.id)
  INTO mentorship_sessions
  FROM mentorship_sessions ms
  JOIN mentorships m ON ms.mentorship_id = m.id
  WHERE (m.mentor_id = p_profile_id OR m.mentee_id = p_profile_id)
    AND ms.status = 'completed';

  -- Get career progressions
  SELECT COUNT(*)
  INTO career_progressions
  FROM career_tracks
  WHERE profile_id = p_profile_id
    AND progress > 0;

  -- Build result JSON
  result := json_build_object(
    'completedPDIs', completed_pdis,
    'completedTasks', completed_tasks,
    'completedCourses', completed_courses,
    'competenciesRated', competencies_rated,
    'mentorshipSessions', mentorship_sessions,
    'careerProgressions', career_progressions
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return default stats on any error
    RETURN json_build_object(
      'completedPDIs', 0,
      'completedTasks', 0,
      'completedCourses', 0,
      'competenciesRated', 0,
      'mentorshipSessions', 0,
      'careerProgressions', 0
    );
END;
$$;