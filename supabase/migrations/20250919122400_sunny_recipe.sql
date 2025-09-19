/*
  # Fix ambiguous column reference in update_career_progress function

  1. Changes
    - Drop existing update_career_progress function
    - Recreate with proper table aliases to avoid ambiguous column references
    - Qualify all column references with table aliases (ct. for career_tracks, etc.)
    - Fix the pdi_progress and competency_progress column ambiguity
*/

-- Drop existing function
DROP FUNCTION IF EXISTS update_career_progress(uuid);

-- Recreate function with proper table aliases
CREATE OR REPLACE FUNCTION update_career_progress(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_competency_progress numeric := 0;
    v_pdi_progress numeric := 0;
    v_total_progress numeric := 0;
    v_current_stage text;
    v_next_stage text;
    v_template_id uuid;
BEGIN
    -- Get current career track info
    SELECT ct.current_stage, ct.next_stage, ct.template_id
    INTO v_current_stage, v_next_stage, v_template_id
    FROM career_tracks ct
    WHERE ct.profile_id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Career track not found for profile %', p_profile_id;
    END IF;

    -- Calculate competency progress
    WITH stage_competencies AS (
        SELECT 
            csc.competency_name,
            csc.required_level,
            csc.weight
        FROM career_stage_competencies csc
        WHERE csc.template_id = v_template_id 
        AND csc.stage_name = v_current_stage
    ),
    user_competencies AS (
        SELECT 
            c.name,
            GREATEST(COALESCE(c.self_rating, 0), COALESCE(c.manager_rating, 0)) as current_level
        FROM competencies c
        WHERE c.profile_id = p_profile_id
    ),
    competency_scores AS (
        SELECT 
            sc.competency_name,
            sc.required_level,
            sc.weight,
            COALESCE(uc.current_level, 0) as current_level,
            CASE 
                WHEN COALESCE(uc.current_level, 0) >= sc.required_level THEN sc.weight
                ELSE sc.weight * (COALESCE(uc.current_level, 0)::numeric / sc.required_level::numeric)
            END as achieved_weight
        FROM stage_competencies sc
        LEFT JOIN user_competencies uc ON sc.competency_name = uc.name
    )
    SELECT 
        CASE 
            WHEN SUM(cs.weight) > 0 THEN (SUM(cs.achieved_weight) / SUM(cs.weight)) * 100
            ELSE 0
        END
    INTO v_competency_progress
    FROM competency_scores cs;

    -- Calculate PDI progress
    WITH recent_pdis AS (
        SELECT 
            p.status
        FROM pdis p
        WHERE p.profile_id = p_profile_id
        AND p.created_at >= NOW() - INTERVAL '1 year'
    )
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE rp.status IN ('completed', 'validated'))::numeric / COUNT(*)::numeric) * 100
            ELSE 0
        END
    INTO v_pdi_progress
    FROM recent_pdis rp;

    -- Calculate total progress using weighted formula
    v_total_progress := (v_competency_progress * 0.7) + (v_pdi_progress * 0.3);

    -- Update career track with calculated progress
    UPDATE career_tracks ct
    SET 
        progress = v_total_progress,
        competency_progress = v_competency_progress,
        pdi_progress = v_pdi_progress,
        last_progression_check = NOW(),
        updated_at = NOW()
    WHERE ct.profile_id = p_profile_id;

    -- Check for automatic progression
    IF v_total_progress >= 80 AND v_next_stage IS NOT NULL THEN
        -- Get template stages to find the stage after next_stage
        DECLARE
            v_stages jsonb;
            v_stage_array jsonb;
            v_current_index int;
            v_new_next_stage text := NULL;
        BEGIN
            SELECT ctt.stages INTO v_stages
            FROM career_track_templates ctt
            WHERE ctt.id = v_template_id;

            -- Find current stage index and determine new next stage
            FOR i IN 0..jsonb_array_length(v_stages) - 1 LOOP
                IF (v_stages->i->>'name') = v_next_stage THEN
                    v_current_index := i;
                    IF i + 1 < jsonb_array_length(v_stages) THEN
                        v_new_next_stage := v_stages->(i + 1)->>'name';
                    END IF;
                    EXIT;
                END IF;
            END LOOP;

            -- Update to next stage
            UPDATE career_tracks ct
            SET 
                current_stage = v_next_stage,
                next_stage = v_new_next_stage,
                progress = 0, -- Reset progress for new stage
                competency_progress = 0,
                pdi_progress = 0,
                updated_at = NOW()
            WHERE ct.profile_id = p_profile_id;

            -- Create notification for progression
            INSERT INTO notifications (profile_id, title, message, type, action_url)
            VALUES (
                p_profile_id,
                'Parabéns! Você avançou de estágio!',
                format('Você progrediu para o estágio %s em sua trilha de carreira.', v_next_stage),
                'success',
                '/career'
            );
        END;
    END IF;

    RAISE NOTICE 'Career progress updated for profile %: competency=%, pdi=%, total=%', 
        p_profile_id, v_competency_progress, v_pdi_progress, v_total_progress;
END;
$$;