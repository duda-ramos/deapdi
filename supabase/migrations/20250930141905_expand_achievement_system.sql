/*
  # Expandir Sistema de Conquistas
  
  1. Overview
    - Adicionar novos tipos de triggers para o sistema de conquistas
    - Melhorar a função de avaliação de condições
    - Adicionar triggers para cursos, mentoria e grupos de ação
    - Criar novos templates de conquistas
  
  2. New Trigger Types
    - `course_completed` - Conquistas por conclusão de cursos
    - `mentorship_session` - Conquistas por participação em mentorias
    - `action_group_task` - Conquistas por trabalho em grupos de ação
    - `wellness_checkin` - Conquistas por check-ins de bem-estar
  
  3. Enhanced Functions
    - Melhorar `check_and_unlock_achievements` para suportar novos tipos
    - Recriar `get_user_achievement_stats` com novo tipo de retorno
    - Adicionar função `manual_check_achievements` para verificação manual
  
  4. New Triggers
    - Trigger para conclusão de cursos
    - Trigger para sessões de mentoria (baseado em INSERT)
    - Trigger para tarefas de grupos de ação
    - Trigger para check-ins emocionais
  
  5. New Achievement Templates
    - Templates para todas as novas categorias
    - Templates progressivos (1, 5, 10, 25, 50, 100)
    - Templates especiais para marcos importantes
*/

-- ====================================================================
-- DROP AND RECREATE ACHIEVEMENT STATS FUNCTION
-- ====================================================================

DROP FUNCTION IF EXISTS get_user_achievement_stats(uuid);

CREATE FUNCTION get_user_achievement_stats(
  p_profile_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
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
      SELECT COUNT(*) FROM mentorship_sessions 
      WHERE mentorship_id IN (
        SELECT id FROM mentorships 
        WHERE mentor_id = p_profile_id OR mentee_id = p_profile_id
      )
    ),
    'careerProgressions', (
      SELECT COUNT(*) FROM career_tracks 
      WHERE profile_id = p_profile_id 
      AND progress > 0
    ),
    'actionGroupTasks', (
      SELECT COUNT(*) FROM tasks t
      INNER JOIN action_group_participants agp ON agp.profile_id = p_profile_id
      WHERE t.group_id = agp.group_id
      AND t.assignee_id = p_profile_id
      AND t.status = 'done'
    ),
    'wellnessCheckins', (
      SELECT COUNT(*) FROM emotional_checkins 
      WHERE profile_id = p_profile_id
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ENHANCED CHECK AND UNLOCK ACHIEVEMENTS FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_profile_id uuid,
  p_trigger_type text
) RETURNS void AS $$
DECLARE
  v_template achievement_templates%ROWTYPE;
  v_condition jsonb;
  v_should_unlock boolean;
  v_count integer;
  v_progress numeric;
  v_max_rating integer;
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
        SELECT COUNT(*) INTO v_count
        FROM pdis 
        WHERE profile_id = p_profile_id 
        AND status IN ('completed', 'validated');
        
        IF (v_condition->>'count')::integer <= v_count THEN
          v_should_unlock := true;
        END IF;

      WHEN 'task_completed' THEN
        SELECT COUNT(*) INTO v_count
        FROM tasks 
        WHERE assignee_id = p_profile_id 
        AND status = 'done';
        
        IF (v_condition->>'count')::integer <= v_count THEN
          v_should_unlock := true;
        END IF;

      WHEN 'course_completed' THEN
        SELECT COUNT(*) INTO v_count
        FROM course_enrollments 
        WHERE profile_id = p_profile_id 
        AND status = 'completed';
        
        IF (v_condition->>'count')::integer <= v_count THEN
          v_should_unlock := true;
        END IF;

      WHEN 'competency_rated' THEN
        SELECT COALESCE(MAX(GREATEST(
          COALESCE(self_rating, 0), 
          COALESCE(manager_rating, 0)
        )), 0) INTO v_max_rating
        FROM competencies 
        WHERE profile_id = p_profile_id;
        
        IF (v_condition->>'count')::integer <= v_max_rating THEN
          v_should_unlock := true;
        END IF;

      WHEN 'career_progression' THEN
        SELECT COALESCE(MAX(progress), 0) INTO v_progress
        FROM career_tracks 
        WHERE profile_id = p_profile_id;
        
        IF (v_condition->>'count')::numeric <= v_progress THEN
          v_should_unlock := true;
        END IF;

      WHEN 'mentorship_session' THEN
        SELECT COUNT(*) INTO v_count
        FROM mentorship_sessions 
        WHERE mentorship_id IN (
          SELECT id FROM mentorships 
          WHERE mentor_id = p_profile_id OR mentee_id = p_profile_id
        );
        
        IF (v_condition->>'count')::integer <= v_count THEN
          v_should_unlock := true;
        END IF;

      WHEN 'action_group_task' THEN
        SELECT COUNT(*) INTO v_count
        FROM tasks t
        INNER JOIN action_group_participants agp ON agp.profile_id = p_profile_id
        WHERE t.group_id = agp.group_id
        AND t.assignee_id = p_profile_id
        AND t.status = 'done';
        
        IF (v_condition->>'count')::integer <= v_count THEN
          v_should_unlock := true;
        END IF;

      WHEN 'wellness_checkin' THEN
        SELECT COUNT(*) INTO v_count
        FROM emotional_checkins 
        WHERE profile_id = p_profile_id;
        
        IF (v_condition->>'count')::integer <= v_count THEN
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

-- ====================================================================
-- MANUAL CHECK ACHIEVEMENTS FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION manual_check_achievements(
  p_profile_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_unlocked_count integer := 0;
  v_trigger_type text;
BEGIN
  -- Check all trigger types
  FOR v_trigger_type IN 
    SELECT DISTINCT trigger_type FROM achievement_templates
  LOOP
    PERFORM check_and_unlock_achievements(p_profile_id, v_trigger_type);
  END LOOP;

  -- Count newly unlocked achievements
  SELECT COUNT(*) INTO v_unlocked_count
  FROM achievements
  WHERE profile_id = p_profile_id;

  RETURN jsonb_build_object(
    'checked', true,
    'profile_id', p_profile_id,
    'total_achievements', v_unlocked_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- TRIGGERS FOR NEW ACHIEVEMENT TYPES
-- ====================================================================

-- Course completion trigger
CREATE OR REPLACE FUNCTION trigger_check_course_achievements()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM check_and_unlock_achievements(NEW.profile_id, 'course_completed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_course_achievements ON course_enrollments;
CREATE TRIGGER check_course_achievements
  AFTER INSERT OR UPDATE OF status ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_course_achievements();

-- Mentorship session trigger (fires on INSERT since no status column exists)
CREATE OR REPLACE FUNCTION trigger_check_mentorship_achievements()
RETURNS trigger AS $$
DECLARE
  v_mentor_id uuid;
  v_mentee_id uuid;
BEGIN
  -- Get mentor and mentee IDs
  SELECT mentor_id, mentee_id INTO v_mentor_id, v_mentee_id
  FROM mentorships
  WHERE id = NEW.mentorship_id;
  
  -- Check achievements for both mentor and mentee
  IF v_mentor_id IS NOT NULL THEN
    PERFORM check_and_unlock_achievements(v_mentor_id, 'mentorship_session');
  END IF;
  
  IF v_mentee_id IS NOT NULL THEN
    PERFORM check_and_unlock_achievements(v_mentee_id, 'mentorship_session');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_mentorship_achievements ON mentorship_sessions;
CREATE TRIGGER check_mentorship_achievements
  AFTER INSERT ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_mentorship_achievements();

-- Action group task trigger
CREATE OR REPLACE FUNCTION trigger_check_action_group_achievements()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    IF NEW.group_id IS NOT NULL THEN
      PERFORM check_and_unlock_achievements(NEW.assignee_id, 'action_group_task');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_action_group_achievements ON tasks;
CREATE TRIGGER check_action_group_achievements
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_action_group_achievements();

-- Wellness check-in trigger
CREATE OR REPLACE FUNCTION trigger_check_wellness_achievements()
RETURNS trigger AS $$
BEGIN
  PERFORM check_and_unlock_achievements(NEW.profile_id, 'wellness_checkin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_wellness_achievements ON emotional_checkins;
CREATE TRIGGER check_wellness_achievements
  AFTER INSERT ON emotional_checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_wellness_achievements();

-- ====================================================================
-- NEW ACHIEVEMENT TEMPLATES
-- ====================================================================

INSERT INTO achievement_templates (title, description, icon, points, category, trigger_type, trigger_condition) VALUES
-- Course achievements
('Estudante Iniciante', 'Complete seu primeiro curso', '📚', 100, 'learning', 'course_completed', '{"count": 1}'),
('Aprendiz Dedicado', 'Complete 5 cursos', '📖', 300, 'learning', 'course_completed', '{"count": 5}'),
('Scholar', 'Complete 10 cursos', '🎓', 600, 'learning', 'course_completed', '{"count": 10}'),
('Mestre do Conhecimento', 'Complete 25 cursos', '🏅', 1500, 'learning', 'course_completed', '{"count": 25}'),

-- Mentorship achievements
('Primeiro Passo na Mentoria', 'Participe de sua primeira sessão de mentoria', '🤝', 100, 'mentorship', 'mentorship_session', '{"count": 1}'),
('Construtor de Relações', 'Complete 5 sessões de mentoria', '💬', 300, 'mentorship', 'mentorship_session', '{"count": 5}'),
('Mentor Experiente', 'Complete 10 sessões de mentoria', '🌟', 600, 'mentorship', 'mentorship_session', '{"count": 10}'),
('Guia Inspirador', 'Complete 25 sessões de mentoria', '✨', 1500, 'mentorship', 'mentorship_session', '{"count": 25}'),

-- Action Group achievements
('Colaborador Iniciante', 'Complete sua primeira tarefa em grupo', '👥', 100, 'collaboration', 'action_group_task', '{"count": 1}'),
('Jogador de Equipe', 'Complete 5 tarefas em grupos de ação', '🤝', 300, 'collaboration', 'action_group_task', '{"count": 5}'),
('Colaborador Expert', 'Complete 10 tarefas em grupos de ação', '🏆', 600, 'collaboration', 'action_group_task', '{"count": 10}'),
('Líder Colaborativo', 'Complete 25 tarefas em grupos de ação', '👑', 1500, 'collaboration', 'action_group_task', '{"count": 25}'),

-- Wellness achievements
('Autocuidado Iniciante', 'Faça seu primeiro check-in emocional', '💚', 50, 'wellness', 'wellness_checkin', '{"count": 1}'),
('Consciência Emocional', 'Faça 7 check-ins emocionais', '🧘', 200, 'wellness', 'wellness_checkin', '{"count": 7}'),
('Bem-Estar Consistente', 'Faça 30 check-ins emocionais', '🌈', 500, 'wellness', 'wellness_checkin', '{"count": 30}'),
('Guardião do Bem-Estar', 'Faça 100 check-ins emocionais', '💎', 1500, 'wellness', 'wellness_checkin', '{"count": 100}'),

-- PDI achievements (progressive)
('Desenvolvedor Iniciante', 'Complete seu primeiro PDI', '🚀', 100, 'development', 'pdi_completed', '{"count": 1}'),
('Desenvolvedor Consistente', 'Complete 3 PDIs', '📊', 200, 'development', 'pdi_completed', '{"count": 3}'),

-- Task achievements (progressive)
('Primeira Ação', 'Complete sua primeira tarefa', '✓', 50, 'productivity', 'task_completed', '{"count": 1}'),
('Produtivo', 'Complete 5 tarefas', '✅', 150, 'productivity', 'task_completed', '{"count": 5}'),
('Super Produtivo', 'Complete 25 tarefas', '⚡', 500, 'productivity', 'task_completed', '{"count": 25}'),
('Máquina de Produtividade', 'Complete 50 tarefas', '🔥', 1000, 'productivity', 'task_completed', '{"count": 50}'),
('Executor Lendário', 'Complete 100 tarefas', '💪', 2500, 'productivity', 'task_completed', '{"count": 100}'),

-- Career progression achievements
('Carreira em Movimento', 'Alcance 10% de progresso na trilha', '🎯', 100, 'career', 'career_progression', '{"count": 10}'),
('Progresso Sólido', 'Alcance 100% de progresso na trilha', '🏆', 1000, 'career', 'career_progression', '{"count": 100}')

ON CONFLICT DO NOTHING;