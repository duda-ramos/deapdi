/*
  # Automated Career Progression System

  1. Enhanced Career Progress Function
    - Calculates competency and PDI progress
    - Automatically advances users when they meet criteria (80% progress)
    - Creates notifications for career advancement
    - Updates career track stages based on template progression

  2. Trigger Integration
    - Connects to existing triggers on PDI completion
    - Connects to competency rating updates
    - Ensures career progression is evaluated after relevant changes

  3. Notification System
    - Automatically notifies users of career advancement
    - Provides details about new stage and requirements
*/

-- Enhanced career progression function with automatic advancement
CREATE OR REPLACE FUNCTION update_career_progress_with_advancement(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_career_track record;
  v_template record;
  v_stages jsonb;
  v_current_stage_index integer;
  v_next_stage_index integer;
  v_next_stage_name text;
  v_new_next_stage_name text;
  v_competency_progress numeric := 0;
  v_pdi_progress numeric := 0;
  v_total_progress numeric := 0;
  v_stage_competencies record;
  v_user_competencies record;
  v_total_weight numeric := 0;
  v_achieved_weight numeric := 0;
  v_pdis_total integer := 0;
  v_pdis_completed integer := 0;
  v_advancement_occurred boolean := false;
  v_result jsonb;
BEGIN
  -- Get current career track
  SELECT * INTO v_career_track
  FROM career_tracks
  WHERE profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Career track not found for profile %', p_profile_id;
  END IF;

  -- Get template if exists
  IF v_career_track.template_id IS NOT NULL THEN
    SELECT * INTO v_template
    FROM career_track_templates
    WHERE id = v_career_track.template_id;
    
    IF FOUND THEN
      v_stages := v_template.stages;
    END IF;
  END IF;

  -- Calculate competency progress
  FOR v_stage_competencies IN
    SELECT competency_name, required_level, weight
    FROM career_stage_competencies
    WHERE template_id = v_career_track.template_id
    AND stage_name = v_career_track.current_stage
  LOOP
    v_total_weight := v_total_weight + v_stage_competencies.weight;
    
    -- Get user's competency rating
    SELECT GREATEST(COALESCE(self_rating, 0), COALESCE(manager_rating, 0)) as current_level
    INTO v_user_competencies
    FROM competencies
    WHERE profile_id = p_profile_id
    AND name = v_stage_competencies.competency_name;
    
    IF FOUND THEN
      IF v_user_competencies.current_level >= v_stage_competencies.required_level THEN
        v_achieved_weight := v_achieved_weight + v_stage_competencies.weight;
      ELSE
        v_achieved_weight := v_achieved_weight + (v_stage_competencies.weight * (v_user_competencies.current_level::numeric / v_stage_competencies.required_level));
      END IF;
    END IF;
  END LOOP;

  -- Calculate competency progress percentage
  IF v_total_weight > 0 THEN
    v_competency_progress := (v_achieved_weight / v_total_weight) * 100;
  END IF;

  -- Calculate PDI progress (last 12 months)
  SELECT COUNT(*) INTO v_pdis_total
  FROM pdis
  WHERE profile_id = p_profile_id
  AND created_at >= NOW() - INTERVAL '12 months';

  SELECT COUNT(*) INTO v_pdis_completed
  FROM pdis
  WHERE profile_id = p_profile_id
  AND status IN ('completed', 'validated')
  AND created_at >= NOW() - INTERVAL '12 months';

  IF v_pdis_total > 0 THEN
    v_pdi_progress := (v_pdis_completed::numeric / v_pdis_total) * 100;
  END IF;

  -- Calculate total progress (70% competencies, 30% PDIs)
  v_total_progress := (v_competency_progress * 0.7) + (v_pdi_progress * 0.3);

  -- Check for automatic advancement
  IF v_total_progress >= 80 AND v_career_track.next_stage IS NOT NULL AND v_stages IS NOT NULL THEN
    -- Find current stage index in template
    FOR i IN 0..jsonb_array_length(v_stages) - 1 LOOP
      IF (v_stages->i->>'name') = v_career_track.current_stage THEN
        v_current_stage_index := i;
        EXIT;
      END IF;
    END LOOP;

    -- Find next stage index
    v_next_stage_index := v_current_stage_index + 1;
    
    -- Check if next stage exists in template
    IF v_next_stage_index < jsonb_array_length(v_stages) THEN
      v_next_stage_name := v_stages->v_next_stage_index->>'name';
      
      -- Determine new next stage (if exists)
      IF v_next_stage_index + 1 < jsonb_array_length(v_stages) THEN
        v_new_next_stage_name := v_stages->(v_next_stage_index + 1)->>'name';
      END IF;

      -- Perform advancement
      UPDATE career_tracks
      SET 
        current_stage = v_next_stage_name,
        next_stage = v_new_next_stage_name,
        progress = 0, -- Reset progress for new stage
        competency_progress = 0,
        pdi_progress = 0,
        last_progression_check = NOW(),
        updated_at = NOW()
      WHERE profile_id = p_profile_id;

      -- Create advancement notification
      INSERT INTO notifications (profile_id, title, message, type, category, action_url)
      VALUES (
        p_profile_id,
        '🚀 Parabéns! Você foi promovido!',
        format('Você avançou para o estágio "%s" em sua trilha de carreira! Continue desenvolvendo suas competências para alcançar o próximo nível.', v_next_stage_name),
        'success',
        'career_progression',
        '/career'
      );

      -- Award progression points
      UPDATE profiles
      SET points = points + 500
      WHERE id = p_profile_id;

      v_advancement_occurred := true;
      v_total_progress := 0; -- Reset since we advanced
    END IF;
  END IF;

  -- Update career track progress (if no advancement occurred)
  IF NOT v_advancement_occurred THEN
    UPDATE career_tracks
    SET 
      progress = v_total_progress,
      competency_progress = v_competency_progress,
      pdi_progress = v_pdi_progress,
      last_progression_check = NOW(),
      updated_at = NOW()
    WHERE profile_id = p_profile_id;
  END IF;

  -- Return result
  v_result := jsonb_build_object(
    'profile_id', p_profile_id,
    'competency_progress', v_competency_progress,
    'pdi_progress', v_pdi_progress,
    'total_progress', v_total_progress,
    'advancement_occurred', v_advancement_occurred,
    'new_stage', CASE WHEN v_advancement_occurred THEN v_next_stage_name ELSE NULL END,
    'updated_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- Replace the existing update_career_progress function
DROP FUNCTION IF EXISTS update_career_progress(uuid);
CREATE OR REPLACE FUNCTION update_career_progress(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN update_career_progress_with_advancement(p_profile_id);
END;
$$;

-- Create trigger function for automatic career progression checks
CREATE OR REPLACE FUNCTION trigger_career_progression_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only check progression for significant changes
  IF TG_OP = 'UPDATE' THEN
    -- For PDIs: check when status changes to completed or validated
    IF TG_TABLE_NAME = 'pdis' AND OLD.status != NEW.status AND NEW.status IN ('completed', 'validated') THEN
      PERFORM update_career_progress_with_advancement(NEW.profile_id);
    END IF;
    
    -- For competencies: check when ratings are updated
    IF TG_TABLE_NAME = 'competencies' AND (OLD.self_rating != NEW.self_rating OR OLD.manager_rating != NEW.manager_rating) THEN
      PERFORM update_career_progress_with_advancement(NEW.profile_id);
    END IF;
    
    -- For course completions: check when enrollment is completed
    IF TG_TABLE_NAME = 'course_enrollments' AND OLD.status != NEW.status AND NEW.status = 'completed' THEN
      PERFORM update_career_progress_with_advancement(NEW.profile_id);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for automatic career progression
DROP TRIGGER IF EXISTS career_progression_pdi_trigger ON pdis;
CREATE TRIGGER career_progression_pdi_trigger
  AFTER UPDATE ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION trigger_career_progression_check();

DROP TRIGGER IF EXISTS career_progression_competency_trigger ON competencies;
CREATE TRIGGER career_progression_competency_trigger
  AFTER UPDATE ON competencies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_career_progression_check();

DROP TRIGGER IF EXISTS career_progression_course_trigger ON course_enrollments;
CREATE TRIGGER career_progression_course_trigger
  AFTER UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_career_progression_check();

-- Function to manually trigger career progression check (for testing)
CREATE OR REPLACE FUNCTION manual_career_progression_check(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN update_career_progress_with_advancement(p_profile_id);
END;
$$;