/*
  # Sistema Automático de Conquistas

  1. New Tables
    - `achievement_templates` - Templates de conquistas disponíveis
    - Atualização da tabela `achievements` para usar templates

  2. Functions
    - `check_and_unlock_achievements` - Verifica e desbloqueia conquistas
    - `unlock_achievement` - Desbloqueia uma conquista específica

  3. Triggers
    - Trigger para PDIs concluídos
    - Trigger para competências avaliadas
    - Trigger para progresso de carreira
    - Trigger para tarefas concluídas

  4. Achievement Templates
    - Primeira tarefa concluída
    - 5 PDIs completados
    - Progresso de 25%, 50%, 75% na trilha
    - Primeira avaliação 5 estrelas
*/

-- Create achievement templates table
CREATE TABLE IF NOT EXISTS achievement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  points integer NOT NULL DEFAULT 100,
  category text NOT NULL DEFAULT 'general',
  trigger_type text NOT NULL, -- 'pdi_completed', 'competency_rated', 'career_progress', 'task_completed'
  trigger_condition jsonb NOT NULL, -- Conditions for unlocking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE achievement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage achievement templates"
  ON achievement_templates
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Users can read achievement templates"
  ON achievement_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Update achievements table to reference templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE achievements ADD COLUMN template_id uuid REFERENCES achievement_templates(id);
  END IF;
END $$;

-- Function to unlock achievement
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_profile_id uuid,
  p_template_id uuid
) RETURNS void AS $$
DECLARE
  v_template achievement_templates%ROWTYPE;
  v_existing_achievement achievements%ROWTYPE;
BEGIN
  -- Get template
  SELECT * INTO v_template FROM achievement_templates WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Achievement template not found: %', p_template_id;
  END IF;

  -- Check if already unlocked
  SELECT * INTO v_existing_achievement 
  FROM achievements 
  WHERE profile_id = p_profile_id AND template_id = p_template_id;
  
  IF FOUND THEN
    RETURN; -- Already unlocked
  END IF;

  -- Unlock achievement
  INSERT INTO achievements (
    profile_id,
    template_id,
    title,
    description,
    icon,
    points,
    unlocked_at
  ) VALUES (
    p_profile_id,
    p_template_id,
    v_template.title,
    v_template.description,
    v_template.icon,
    v_template.points,
    now()
  );

  -- Update user points
  UPDATE profiles 
  SET points = points + v_template.points
  WHERE id = p_profile_id;

  -- Create notification
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    p_profile_id,
    'Nova Conquista Desbloqueada! 🏆',
    'Parabéns! Você desbloqueou: ' || v_template.title || ' (+' || v_template.points || ' pontos)',
    'success',
    '/achievements'
  );

  RAISE NOTICE 'Achievement unlocked: % for profile %', v_template.title, p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_profile_id uuid,
  p_trigger_type text
) RETURNS void AS $$
DECLARE
  v_template achievement_templates%ROWTYPE;
  v_condition jsonb;
  v_should_unlock boolean;
  v_pdi_count integer;
  v_task_count integer;
  v_career_progress numeric;
  v_max_competency_rating integer;
BEGIN
  -- Loop through all templates for this trigger type
  FOR v_template IN 
    SELECT * FROM achievement_templates 
    WHERE trigger_type = p_trigger_type
  LOOP
    v_should_unlock := false;
    v_condition := v_template.trigger_condition;

    -- Check conditions based on trigger type
    CASE p_trigger_type
      WHEN 'pdi_completed' THEN
        -- Count completed PDIs
        SELECT COUNT(*) INTO v_pdi_count
        FROM pdis 
        WHERE profile_id = p_profile_id 
        AND status IN ('completed', 'validated');
        
        IF (v_condition->>'min_pdis')::integer <= v_pdi_count THEN
          v_should_unlock := true;
        END IF;

      WHEN 'competency_rated' THEN
        -- Check for 5-star rating
        SELECT COALESCE(MAX(GREATEST(self_rating, manager_rating)), 0) INTO v_max_competency_rating
        FROM competencies 
        WHERE profile_id = p_profile_id;
        
        IF (v_condition->>'min_rating')::integer <= v_max_competency_rating THEN
          v_should_unlock := true;
        END IF;

      WHEN 'career_progress' THEN
        -- Check career progress percentage
        SELECT COALESCE(progress, 0) INTO v_career_progress
        FROM career_tracks 
        WHERE profile_id = p_profile_id;
        
        IF (v_condition->>'min_progress')::numeric <= v_career_progress THEN
          v_should_unlock := true;
        END IF;

      WHEN 'task_completed' THEN
        -- Count completed tasks
        SELECT COUNT(*) INTO v_task_count
        FROM tasks 
        WHERE assignee_id = p_profile_id 
        AND status = 'done';
        
        IF (v_condition->>'min_tasks')::integer <= v_task_count THEN
          v_should_unlock := true;
        END IF;
    END CASE;

    -- Unlock if conditions met
    IF v_should_unlock THEN
      PERFORM unlock_achievement(p_profile_id, v_template.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic achievement checking

-- PDI completion trigger
CREATE OR REPLACE FUNCTION trigger_check_pdi_achievements()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('completed', 'validated') AND OLD.status NOT IN ('completed', 'validated') THEN
    PERFORM check_and_unlock_achievements(NEW.profile_id, 'pdi_completed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_pdi_achievements ON pdis;
CREATE TRIGGER check_pdi_achievements
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_pdi_achievements();

-- Competency rating trigger
CREATE OR REPLACE FUNCTION trigger_check_competency_achievements()
RETURNS trigger AS $$
BEGIN
  IF (NEW.self_rating IS DISTINCT FROM OLD.self_rating) OR 
     (NEW.manager_rating IS DISTINCT FROM OLD.manager_rating) THEN
    PERFORM check_and_unlock_achievements(NEW.profile_id, 'competency_rated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_competency_achievements ON competencies;
CREATE TRIGGER check_competency_achievements
  AFTER UPDATE OF self_rating, manager_rating ON competencies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_competency_achievements();

-- Career progress trigger
CREATE OR REPLACE FUNCTION trigger_check_career_achievements()
RETURNS trigger AS $$
BEGIN
  IF NEW.progress IS DISTINCT FROM OLD.progress THEN
    PERFORM check_and_unlock_achievements(NEW.profile_id, 'career_progress');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_career_achievements ON career_tracks;
CREATE TRIGGER check_career_achievements
  AFTER UPDATE OF progress ON career_tracks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_career_achievements();

-- Task completion trigger
CREATE OR REPLACE FUNCTION trigger_check_task_achievements()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    PERFORM check_and_unlock_achievements(NEW.assignee_id, 'task_completed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_task_achievements ON tasks;
CREATE TRIGGER check_task_achievements
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_task_achievements();

-- Insert basic achievement templates
INSERT INTO achievement_templates (title, description, icon, points, category, trigger_type, trigger_condition) VALUES
('Primeira Conquista', 'Complete sua primeira tarefa', '🚀', 50, 'getting_started', 'task_completed', '{"min_tasks": 1}'),
('Desenvolvedor Dedicado', 'Complete 5 PDIs', '📈', 250, 'development', 'pdi_completed', '{"min_pdis": 5}'),
('Progresso Inicial', 'Alcance 25% de progresso na trilha', '🎯', 100, 'career', 'career_progress', '{"min_progress": 25}'),
('Meio Caminho', 'Alcance 50% de progresso na trilha', '⭐', 200, 'career', 'career_progress', '{"min_progress": 50}'),
('Quase Lá', 'Alcance 75% de progresso na trilha', '🌟', 300, 'career', 'career_progress', '{"min_progress": 75}'),
('Excelência', 'Receba sua primeira avaliação 5 estrelas', '⭐', 150, 'excellence', 'competency_rated', '{"min_rating": 5}'),
('Executor', 'Complete 10 tarefas', '✅', 200, 'productivity', 'task_completed', '{"min_tasks": 10}'),
('Especialista em PDI', 'Complete 10 PDIs', '🎓', 500, 'development', 'pdi_completed', '{"min_pdis": 10}')
ON CONFLICT DO NOTHING;