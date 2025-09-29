/*
  # Create career progression functions

  1. Functions
    - `update_career_progress` - Calculate and update career progress
    - `trigger_update_career_progress` - Trigger for automatic progress updates
    - `trigger_pdi_career_progress` - Update career progress when PDI status changes

  2. Triggers
    - Connect triggers to competencies and PDIs tables

  3. Career Track Templates
    - Insert basic career track templates
*/

-- Function to update career progress
CREATE OR REPLACE FUNCTION update_career_progress(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  track_record record;
  competency_progress numeric := 0;
  pdi_progress numeric := 0;
  total_progress numeric := 0;
  total_weight numeric := 0;
  achieved_weight numeric := 0;
  comp_record record;
  pdi_count integer;
  completed_pdi_count integer;
BEGIN
  -- Get current career track
  SELECT * INTO track_record
  FROM career_tracks
  WHERE profile_id = p_profile_id;
  
  IF track_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate competency progress
  IF track_record.template_id IS NOT NULL THEN
    -- Get stage competencies for current stage
    FOR comp_record IN
      SELECT csc.*, c.self_rating, c.manager_rating
      FROM career_stage_competencies csc
      LEFT JOIN competencies c ON (c.name = csc.competency_name AND c.profile_id = p_profile_id)
      WHERE csc.template_id = track_record.template_id
      AND csc.stage_name = track_record.current_stage
    LOOP
      total_weight := total_weight + comp_record.weight;
      
      -- Get current level (max of self and manager rating)
      DECLARE
        current_level integer := GREATEST(
          COALESCE(comp_record.self_rating, 0),
          COALESCE(comp_record.manager_rating, 0)
        );
      BEGIN
        IF current_level >= comp_record.required_level THEN
          achieved_weight := achieved_weight + comp_record.weight;
        ELSE
          achieved_weight := achieved_weight + (comp_record.weight * (current_level::numeric / comp_record.required_level));
        END IF;
      END;
    END LOOP;
    
    IF total_weight > 0 THEN
      competency_progress := (achieved_weight / total_weight) * 100;
    END IF;
  ELSE
    -- Fallback: calculate based on all competencies
    SELECT 
      AVG(GREATEST(COALESCE(self_rating, 0), COALESCE(manager_rating, 0))) * 20 
    INTO competency_progress
    FROM competencies 
    WHERE profile_id = p_profile_id;
    
    competency_progress := COALESCE(competency_progress, 0);
  END IF;
  
  -- Calculate PDI progress (last 12 months)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('completed', 'validated'))
  INTO pdi_count, completed_pdi_count
  FROM pdis 
  WHERE profile_id = p_profile_id
  AND created_at >= now() - interval '12 months';
  
  IF pdi_count > 0 THEN
    pdi_progress := (completed_pdi_count::numeric / pdi_count) * 100;
  END IF;
  
  -- Calculate total progress (weighted: 70% competencies, 30% PDIs)
  total_progress := (competency_progress * 0.7) + (pdi_progress * 0.3);
  
  -- Update career track
  UPDATE career_tracks
  SET 
    progress = total_progress,
    competency_progress = competency_progress,
    pdi_progress = pdi_progress,
    last_progression_check = now()
  WHERE profile_id = p_profile_id;
  
  -- Check for automatic progression (80% threshold)
  IF total_progress >= 80 AND track_record.next_stage IS NOT NULL THEN
    -- Auto-advance to next stage
    UPDATE career_tracks
    SET 
      current_stage = next_stage,
      progress = 0,
      competency_progress = 0,
      pdi_progress = 0
    WHERE profile_id = p_profile_id;
    
    -- Update profile level
    UPDATE profiles
    SET level = track_record.next_stage
    WHERE id = p_profile_id;
    
    -- Create notification
    INSERT INTO notifications (profile_id, title, message, type, category)
    VALUES (
      p_profile_id,
      '🚀 Progressão de Carreira!',
      'Parabéns! Você avançou para o nível ' || track_record.next_stage || '!',
      'success',
      'career_progression'
    );
  END IF;
END;
$$;

-- Trigger function for competency updates
CREATE OR REPLACE FUNCTION trigger_update_career_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM update_career_progress(NEW.profile_id);
  RETURN NEW;
END;
$$;

-- Trigger function for PDI career progress
CREATE OR REPLACE FUNCTION trigger_pdi_career_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('completed', 'validated') AND OLD.status NOT IN ('completed', 'validated') THEN
    PERFORM update_career_progress(NEW.profile_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Insert basic career track templates
INSERT INTO career_track_templates (name, description, profession, track_type, stages, created_by) VALUES
('Trilha de Desenvolvimento - Frontend', 'Trilha para desenvolvedores frontend', 'Desenvolvedor Frontend', 'development', 
 '[
   {"name": "Estagiário", "level": 1, "description": "Início da jornada como desenvolvedor"},
   {"name": "Júnior", "level": 2, "description": "Desenvolvimento de habilidades básicas"},
   {"name": "Pleno", "level": 3, "description": "Autonomia em projetos completos"},
   {"name": "Sênior", "level": 4, "description": "Liderança técnica e mentoria"},
   {"name": "Especialista", "level": 5, "description": "Referência técnica na área"}
 ]'::jsonb,
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Trilha de Desenvolvimento - Backend', 'Trilha para desenvolvedores backend', 'Desenvolvedor Backend', 'development',
 '[
   {"name": "Estagiário", "level": 1, "description": "Início da jornada como desenvolvedor"},
   {"name": "Júnior", "level": 2, "description": "Desenvolvimento de habilidades básicas"},
   {"name": "Pleno", "level": 3, "description": "Autonomia em projetos completos"},
   {"name": "Sênior", "level": 4, "description": "Arquitetura e liderança técnica"},
   {"name": "Especialista", "level": 5, "description": "Arquiteto de soluções"}
 ]'::jsonb,
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Trilha de Liderança', 'Trilha para desenvolvimento de liderança', 'Líder/Gestor', 'specialization',
 '[
   {"name": "Líder de Projeto", "level": 1, "description": "Liderança de projetos específicos"},
   {"name": "Supervisor", "level": 2, "description": "Supervisão de pequenas equipes"},
   {"name": "Gestor", "level": 3, "description": "Gestão de equipes e processos"},
   {"name": "Gerente", "level": 4, "description": "Gestão estratégica de área"},
   {"name": "Diretor", "level": 5, "description": "Liderança executiva"}
 ]'::jsonb,
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Insert stage competencies for Frontend track
DO $$
DECLARE
  frontend_template_id uuid;
BEGIN
  SELECT id INTO frontend_template_id 
  FROM career_track_templates 
  WHERE name = 'Trilha de Desenvolvimento - Frontend' 
  LIMIT 1;
  
  IF frontend_template_id IS NOT NULL THEN
    INSERT INTO career_stage_competencies (template_id, stage_name, competency_name, required_level, weight) VALUES
    -- Estagiário
    (frontend_template_id, 'Estagiário', 'HTML/CSS', 2, 1.0),
    (frontend_template_id, 'Estagiário', 'JavaScript', 2, 1.0),
    (frontend_template_id, 'Estagiário', 'Git', 2, 0.8),
    -- Júnior
    (frontend_template_id, 'Júnior', 'HTML/CSS', 3, 1.0),
    (frontend_template_id, 'Júnior', 'JavaScript', 3, 1.2),
    (frontend_template_id, 'Júnior', 'React', 3, 1.5),
    (frontend_template_id, 'Júnior', 'Git', 3, 0.8),
    -- Pleno
    (frontend_template_id, 'Pleno', 'JavaScript', 4, 1.2),
    (frontend_template_id, 'Pleno', 'React', 4, 1.5),
    (frontend_template_id, 'Pleno', 'TypeScript', 3, 1.3),
    (frontend_template_id, 'Pleno', 'Liderança', 3, 1.0),
    -- Sênior
    (frontend_template_id, 'Sênior', 'React', 5, 1.5),
    (frontend_template_id, 'Sênior', 'TypeScript', 4, 1.3),
    (frontend_template_id, 'Sênior', 'Liderança', 4, 1.2),
    (frontend_template_id, 'Sênior', 'Arquitetura', 4, 1.4)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert salary ranges for Frontend track
DO $$
DECLARE
  frontend_template_id uuid;
BEGIN
  SELECT id INTO frontend_template_id 
  FROM career_track_templates 
  WHERE name = 'Trilha de Desenvolvimento - Frontend' 
  LIMIT 1;
  
  IF frontend_template_id IS NOT NULL THEN
    INSERT INTO career_stage_salary_ranges (template_id, stage_name, min_salary, max_salary, currency) VALUES
    (frontend_template_id, 'Estagiário', 1500, 2500, 'BRL'),
    (frontend_template_id, 'Júnior', 3000, 5000, 'BRL'),
    (frontend_template_id, 'Pleno', 5500, 8500, 'BRL'),
    (frontend_template_id, 'Sênior', 9000, 13000, 'BRL'),
    (frontend_template_id, 'Especialista', 13500, 18000, 'BRL')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;