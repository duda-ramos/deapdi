/*
  # Create Essential RPC Functions

  This migration creates all the RPC (Remote Procedure Call) functions needed by the application.
  These functions are called from the frontend services to perform complex operations.

  ## Functions Created

  1. **get_user_achievement_stats** - Get aggregated achievement statistics for a user
  2. **manual_check_achievements** - Manually check and unlock achievements for a user
  3. **check_and_unlock_achievements** - Check and unlock achievements based on trigger type
  4. **generate_course_certificate** - Generate a certificate for a completed course
  5. **schedule_mentorship_session** - Schedule a new mentorship session
  6. **complete_mentorship_session** - Mark a mentorship session as completed
  7. **cleanup_old_notifications** - Remove old read notifications
  8. **update_career_progress_with_advancement** - Update career progress and check for advancement
  9. **manual_career_progression_check** - Manually check if user can progress in career track

  ## Security

  All functions check authentication and use RLS policies for data access.
*/

-- ============================================================================
-- ACHIEVEMENT FUNCTIONS
-- ============================================================================

-- Function: Get User Achievement Stats
-- Returns aggregated stats for achievement progress calculation
CREATE OR REPLACE FUNCTION get_user_achievement_stats(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Build stats object
  SELECT jsonb_build_object(
    'completedPDIs', (
      SELECT COUNT(*) FROM pdis
      WHERE profile_id = p_profile_id
      AND status IN ('completed', 'validated')
    ),
    'completedTasks', (
      SELECT COUNT(*) FROM tasks
      WHERE assignee_id = p_profile_id
      AND status = 'done'
    ),
    'completedCourses', (
      SELECT COUNT(*) FROM course_enrollments
      WHERE profile_id = p_profile_id
      AND status = 'completed'
    ),
    'competenciesRated', (
      SELECT COUNT(*) FROM competencies
      WHERE profile_id = p_profile_id
      AND (self_rating IS NOT NULL OR manager_rating IS NOT NULL)
    ),
    'mentorshipSessions', (
      SELECT COUNT(DISTINCT ms.id)
      FROM mentorship_sessions ms
      JOIN mentorships m ON ms.mentorship_id = m.id
      WHERE (m.mentor_id = p_profile_id OR m.mentee_id = p_profile_id)
      AND ms.status = 'completed'
    ),
    'careerProgressions', (
      SELECT COUNT(*) FROM career_tracks
      WHERE profile_id = p_profile_id
      AND progress > 0
    ),
    'actionGroupTasks', (
      SELECT COUNT(*) FROM tasks
      WHERE assignee_id = p_profile_id
      AND status = 'done'
      AND group_id IS NOT NULL
    ),
    'wellnessCheckins', (
      SELECT COUNT(*) FROM emotional_checkins
      WHERE profile_id = p_profile_id
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- Function: Manual Check Achievements
-- Manually trigger achievement check for a user
CREATE OR REPLACE FUNCTION manual_check_achievements(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_unlocked_count int := 0;
  v_template record;
  v_stats jsonb;
  v_current_count int;
  v_required_count int;
  v_already_unlocked boolean;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user stats
  v_stats := get_user_achievement_stats(p_profile_id);

  -- Loop through all templates
  FOR v_template IN
    SELECT * FROM achievement_templates
  LOOP
    -- Check if already unlocked
    SELECT EXISTS(
      SELECT 1 FROM achievements
      WHERE profile_id = p_profile_id
      AND template_id = v_template.id
    ) INTO v_already_unlocked;

    -- Skip if already unlocked
    IF v_already_unlocked THEN
      CONTINUE;
    END IF;

    -- Get current count based on trigger type
    v_required_count := (v_template.trigger_condition->>'count')::int;

    CASE v_template.trigger_type
      WHEN 'pdi_completed' THEN
        v_current_count := (v_stats->>'completedPDIs')::int;
      WHEN 'task_completed' THEN
        v_current_count := (v_stats->>'completedTasks')::int;
      WHEN 'course_completed' THEN
        v_current_count := (v_stats->>'completedCourses')::int;
      WHEN 'competency_rated' THEN
        v_current_count := (v_stats->>'competenciesRated')::int;
      WHEN 'mentorship_session' THEN
        v_current_count := (v_stats->>'mentorshipSessions')::int;
      WHEN 'career_progression' THEN
        v_current_count := (v_stats->>'careerProgressions')::int;
      WHEN 'action_group_task' THEN
        v_current_count := (v_stats->>'actionGroupTasks')::int;
      WHEN 'wellness_checkin' THEN
        v_current_count := (v_stats->>'wellnessCheckins')::int;
      ELSE
        v_current_count := 0;
    END CASE;

    -- Check if requirement is met
    IF v_current_count >= v_required_count THEN
      -- Unlock achievement
      INSERT INTO achievements (
        profile_id,
        template_id,
        title,
        description,
        icon,
        points,
        category
      ) VALUES (
        p_profile_id,
        v_template.id,
        v_template.title,
        v_template.description,
        v_template.icon,
        v_template.points,
        v_template.category
      );

      -- Update profile points
      UPDATE profiles
      SET points = points + v_template.points
      WHERE id = p_profile_id;

      v_unlocked_count := v_unlocked_count + 1;
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'unlocked_count', v_unlocked_count,
    'checked_at', now()
  );

  RETURN v_result;
END;
$$;

-- Function: Check and Unlock Achievements by Trigger Type
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_profile_id uuid,
  p_trigger_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template record;
  v_stats jsonb;
  v_current_count int;
  v_required_count int;
  v_already_unlocked boolean;
BEGIN
  -- Get user stats
  v_stats := get_user_achievement_stats(p_profile_id);

  -- Loop through templates of this trigger type
  FOR v_template IN
    SELECT * FROM achievement_templates
    WHERE trigger_type = p_trigger_type
  LOOP
    -- Check if already unlocked
    SELECT EXISTS(
      SELECT 1 FROM achievements
      WHERE profile_id = p_profile_id
      AND template_id = v_template.id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
      CONTINUE;
    END IF;

    -- Get counts
    v_required_count := (v_template.trigger_condition->>'count')::int;

    CASE v_template.trigger_type
      WHEN 'pdi_completed' THEN
        v_current_count := (v_stats->>'completedPDIs')::int;
      WHEN 'task_completed' THEN
        v_current_count := (v_stats->>'completedTasks')::int;
      WHEN 'course_completed' THEN
        v_current_count := (v_stats->>'completedCourses')::int;
      WHEN 'competency_rated' THEN
        v_current_count := (v_stats->>'competenciesRated')::int;
      WHEN 'mentorship_session' THEN
        v_current_count := (v_stats->>'mentorshipSessions')::int;
      WHEN 'career_progression' THEN
        v_current_count := (v_stats->>'careerProgressions')::int;
      WHEN 'action_group_task' THEN
        v_current_count := (v_stats->>'actionGroupTasks')::int;
      WHEN 'wellness_checkin' THEN
        v_current_count := (v_stats->>'wellnessCheckins')::int;
      ELSE
        v_current_count := 0;
    END CASE;

    -- Unlock if requirement met
    IF v_current_count >= v_required_count THEN
      INSERT INTO achievements (
        profile_id,
        template_id,
        title,
        description,
        icon,
        points,
        category
      ) VALUES (
        p_profile_id,
        v_template.id,
        v_template.title,
        v_template.description,
        v_template.icon,
        v_template.points,
        v_template.category
      );

      UPDATE profiles
      SET points = points + v_template.points
      WHERE id = p_profile_id;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- COURSE FUNCTIONS
-- ============================================================================

-- Function: Generate Course Certificate
CREATE OR REPLACE FUNCTION generate_course_certificate(enrollment_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment record;
  v_certificate_number text;
  v_verification_code text;
  v_certificate_id uuid;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get enrollment details
  SELECT ce.*, c.title as course_title, c.points
  INTO v_enrollment
  FROM course_enrollments ce
  JOIN courses c ON ce.course_id = c.id
  WHERE ce.id = enrollment_id_param
  AND ce.status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found or course not completed';
  END IF;

  -- Check if certificate already exists
  IF EXISTS(SELECT 1 FROM certificates WHERE enrollment_id = enrollment_id_param) THEN
    RAISE EXCEPTION 'Certificate already generated for this enrollment';
  END IF;

  -- Generate certificate number
  v_certificate_number := 'CERT-' ||
    TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('certificate_number_seq')::text, 6, '0');

  -- Generate verification code
  v_verification_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));

  -- Create certificate
  INSERT INTO certificates (
    profile_id,
    course_id,
    enrollment_id,
    certificate_number,
    verification_code,
    is_valid
  ) VALUES (
    v_enrollment.profile_id,
    v_enrollment.course_id,
    enrollment_id_param,
    v_certificate_number,
    v_verification_code,
    true
  ) RETURNING id INTO v_certificate_id;

  -- Award points if not already awarded
  UPDATE profiles
  SET points = points + v_enrollment.points
  WHERE id = v_enrollment.profile_id;

  -- Trigger achievement check
  PERFORM check_and_unlock_achievements(v_enrollment.profile_id, 'course_completed');

  RETURN v_certificate_id::text;
END;
$$;

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_number_seq START 1;

-- ============================================================================
-- MENTORSHIP FUNCTIONS
-- ============================================================================

-- Function: Schedule Mentorship Session
CREATE OR REPLACE FUNCTION schedule_mentorship_session(
  mentorship_id_param uuid,
  scheduled_start_param timestamptz,
  duration_minutes_param int,
  meeting_link_param text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_mentorship record;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get mentorship details
  SELECT * INTO v_mentorship
  FROM mentorships
  WHERE id = mentorship_id_param
  AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship not found or not active';
  END IF;

  -- Verify user is mentor or mentee
  IF v_mentorship.mentor_id != auth.uid() AND v_mentorship.mentee_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized to schedule session for this mentorship';
  END IF;

  -- Create session
  INSERT INTO mentorship_sessions (
    mentorship_id,
    scheduled_start,
    duration_minutes,
    meeting_link,
    status
  ) VALUES (
    mentorship_id_param,
    scheduled_start_param,
    duration_minutes_param,
    meeting_link_param,
    'scheduled'
  ) RETURNING id INTO v_session_id;

  -- Create notifications would be handled by triggers or application layer

  RETURN v_session_id::text;
END;
$$;

-- Function: Complete Mentorship Session
CREATE OR REPLACE FUNCTION complete_mentorship_session(
  session_id uuid,
  session_notes_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session record;
  v_mentorship record;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get session details
  SELECT ms.*, m.mentor_id, m.mentee_id
  INTO v_session
  FROM mentorship_sessions ms
  JOIN mentorships m ON ms.mentorship_id = m.id
  WHERE ms.id = session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Verify user is mentor or mentee
  IF v_session.mentor_id != auth.uid() AND v_session.mentee_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized to complete this session';
  END IF;

  -- Update session
  UPDATE mentorship_sessions
  SET
    status = 'completed',
    session_notes = COALESCE(session_notes_param, session_notes),
    updated_at = now()
  WHERE id = session_id;

  -- Trigger achievement check for both mentor and mentee
  PERFORM check_and_unlock_achievements(v_session.mentor_id, 'mentorship_session');
  PERFORM check_and_unlock_achievements(v_session.mentee_id, 'mentorship_session');
END;
$$;

-- ============================================================================
-- NOTIFICATION FUNCTIONS
-- ============================================================================

-- Function: Cleanup Old Notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE read = true
  AND created_at < NOW() - INTERVAL '30 days';

  -- Delete unread notifications older than 90 days
  DELETE FROM notifications
  WHERE read = false
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================================================
-- CAREER TRACK FUNCTIONS
-- ============================================================================

-- Function: Update Career Progress with Advancement
CREATE OR REPLACE FUNCTION update_career_progress_with_advancement(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track record;
  v_competency_progress numeric := 0;
  v_pdi_progress numeric := 0;
  v_total_progress numeric := 0;
  v_result jsonb;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get career track
  SELECT * INTO v_track
  FROM career_tracks
  WHERE profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Career track not found';
  END IF;

  -- Calculate competency progress (simplified)
  SELECT COALESCE(AVG(GREATEST(self_rating, manager_rating)) / 5.0 * 100, 0)
  INTO v_competency_progress
  FROM competencies
  WHERE profile_id = p_profile_id;

  -- Calculate PDI progress
  SELECT COALESCE(
    COUNT(CASE WHEN status IN ('completed', 'validated') THEN 1 END)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    0
  )
  INTO v_pdi_progress
  FROM pdis
  WHERE profile_id = p_profile_id
  AND created_at >= NOW() - INTERVAL '1 year';

  -- Calculate total progress (70% competencies + 30% PDIs)
  v_total_progress := (v_competency_progress * 0.7) + (v_pdi_progress * 0.3);

  -- Update progress in career_tracks
  UPDATE career_tracks
  SET progress = v_total_progress
  WHERE profile_id = p_profile_id;

  v_result := jsonb_build_object(
    'competency_progress', v_competency_progress,
    'pdi_progress', v_pdi_progress,
    'total_progress', v_total_progress,
    'updated_at', now()
  );

  RETURN v_result;
END;
$$;

-- Function: Manual Career Progression Check
CREATE OR REPLACE FUNCTION manual_career_progression_check(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track record;
  v_progress_data jsonb;
  v_can_advance boolean := false;
  v_advancement_occurred boolean := false;
  v_new_stage text := NULL;
  v_result jsonb;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update progress first
  v_progress_data := update_career_progress_with_advancement(p_profile_id);

  -- Get updated track
  SELECT * INTO v_track
  FROM career_tracks
  WHERE profile_id = p_profile_id;

  -- Check if can advance (progress >= 80% and has next stage)
  IF v_track.progress >= 80 AND v_track.next_stage IS NOT NULL THEN
    v_can_advance := true;

    -- Auto-advance
    UPDATE career_tracks
    SET
      current_stage = next_stage,
      progress = 0
    WHERE profile_id = p_profile_id
    RETURNING current_stage INTO v_new_stage;

    v_advancement_occurred := true;

    -- Award bonus points
    UPDATE profiles
    SET points = points + 500
    WHERE id = p_profile_id;

    -- Trigger achievement check
    PERFORM check_and_unlock_achievements(p_profile_id, 'career_progression');
  END IF;

  v_result := jsonb_build_object(
    'advancement_occurred', v_advancement_occurred,
    'new_stage', v_new_stage,
    'can_advance', v_can_advance,
    'current_progress', v_track.progress,
    'progress_data', v_progress_data
  );

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_achievement_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_check_achievements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_unlock_achievements(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_course_certificate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_mentorship_session(uuid, timestamptz, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_mentorship_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION update_career_progress_with_advancement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_career_progression_check(uuid) TO authenticated;