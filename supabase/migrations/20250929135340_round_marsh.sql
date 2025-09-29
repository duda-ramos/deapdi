/*
  # Create achievement system functions and triggers

  1. Functions
    - `manual_check_achievements` - Manual achievement checking
    - `trigger_check_pdi_achievements` - Check achievements when PDI is completed
    - `trigger_check_task_achievements` - Check achievements when task is completed
    - `trigger_check_competency_achievements` - Check achievements when competency is rated
    - `trigger_check_career_achievements` - Check achievements when career progresses

  2. Triggers
    - Connect triggers to appropriate table events

  3. Sample Achievement Templates
    - Insert basic achievement templates for testing
*/

-- Function to manually check and unlock achievements
CREATE OR REPLACE FUNCTION manual_check_achievements(p_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record record;
  user_stats record;
  condition_met boolean;
  unlocked_count integer := 0;
  total_points integer := 0;
BEGIN
  -- Get user statistics
  SELECT 
    (SELECT COUNT(*) FROM pdis WHERE profile_id = p_profile_id AND status IN ('completed', 'validated')) as completed_pdis,
    (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_profile_id AND status = 'done') as completed_tasks,
    (SELECT COUNT(*) FROM course_enrollments WHERE profile_id = p_profile_id AND status = 'completed') as completed_courses,
    (SELECT COUNT(*) FROM competencies WHERE profile_id = p_profile_id AND (self_rating IS NOT NULL OR manager_rating IS NOT NULL)) as competencies_rated,
    (SELECT COUNT(*) FROM mentorship_sessions ms JOIN mentorships m ON ms.mentorship_id = m.id WHERE (m.mentor_id = p_profile_id OR m.mentee_id = p_profile_id) AND ms.status = 'completed') as mentorship_sessions,
    (SELECT COUNT(*) FROM career_tracks WHERE profile_id = p_profile_id AND progress > 0) as career_progressions
  INTO user_stats;

  -- Check each achievement template
  FOR template_record IN 
    SELECT * FROM achievement_templates 
    WHERE id NOT IN (
      SELECT template_id FROM achievements 
      WHERE profile_id = p_profile_id AND template_id IS NOT NULL
    )
  LOOP
    condition_met := false;
    
    -- Check trigger conditions
    CASE template_record.trigger_type
      WHEN 'pdi_completed' THEN
        condition_met := user_stats.completed_pdis >= (template_record.trigger_condition->>'count')::integer;
      WHEN 'task_completed' THEN
        condition_met := user_stats.completed_tasks >= (template_record.trigger_condition->>'count')::integer;
      WHEN 'course_completed' THEN
        condition_met := user_stats.completed_courses >= (template_record.trigger_condition->>'count')::integer;
      WHEN 'competency_rated' THEN
        condition_met := user_stats.competencies_rated >= (template_record.trigger_condition->>'count')::integer;
      WHEN 'mentorship_session' THEN
        condition_met := user_stats.mentorship_sessions >= (template_record.trigger_condition->>'count')::integer;
      WHEN 'career_progression' THEN
        condition_met := user_stats.career_progressions >= (template_record.trigger_condition->>'count')::integer;
      ELSE
        condition_met := false;
    END CASE;
    
    -- Unlock achievement if condition is met
    IF condition_met THEN
      INSERT INTO achievements (
        title, description, icon, points, profile_id, template_id, unlocked_at
      ) VALUES (
        template_record.title,
        template_record.description,
        template_record.icon,
        template_record.points,
        p_profile_id,
        template_record.id,
        now()
      );
      
      unlocked_count := unlocked_count + 1;
      total_points := total_points + template_record.points;
      
      -- Update user points
      UPDATE profiles 
      SET points = points + template_record.points 
      WHERE id = p_profile_id;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'unlocked_count', unlocked_count,
    'total_points', total_points
  );
END;
$$;

-- Trigger function for PDI achievements
CREATE OR REPLACE FUNCTION trigger_check_pdi_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('completed', 'validated') AND OLD.status NOT IN ('completed', 'validated') THEN
    PERFORM manual_check_achievements(NEW.profile_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for task achievements
CREATE OR REPLACE FUNCTION trigger_check_task_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    PERFORM manual_check_achievements(NEW.assignee_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for competency achievements
CREATE OR REPLACE FUNCTION trigger_check_competency_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (NEW.self_rating IS NOT NULL AND OLD.self_rating IS NULL) OR
     (NEW.manager_rating IS NOT NULL AND OLD.manager_rating IS NULL) THEN
    PERFORM manual_check_achievements(NEW.profile_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for career achievements
CREATE OR REPLACE FUNCTION trigger_check_career_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.progress > OLD.progress THEN
    PERFORM manual_check_achievements(NEW.profile_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Insert sample achievement templates
INSERT INTO achievement_templates (title, description, icon, points, category, trigger_type, trigger_condition) VALUES
('Primeiro PDI', 'Complete seu primeiro Plano de Desenvolvimento Individual', '🎯', 50, 'career', 'pdi_completed', '{"count": 1}'),
('PDI Master', 'Complete 5 PDIs com sucesso', '🏆', 200, 'career', 'pdi_completed', '{"count": 5}'),
('Primeira Tarefa', 'Complete sua primeira tarefa em grupo', '✅', 25, 'collaboration', 'task_completed', '{"count": 1}'),
('Executor', 'Complete 10 tarefas', '⚡', 100, 'collaboration', 'task_completed', '{"count": 10}'),
('Estudante', 'Complete seu primeiro curso', '📚', 75, 'learning', 'course_completed', '{"count": 1}'),
('Aprendiz Dedicado', 'Complete 3 cursos', '🎓', 150, 'learning', 'course_completed', '{"count": 3}'),
('Autoconhecimento', 'Avalie suas primeiras competências', '🔍', 30, 'development', 'competency_rated', '{"count": 3}'),
('Especialista', 'Avalie 10 competências', '⭐', 120, 'development', 'competency_rated', '{"count": 10}'),
('Mentor', 'Participe de sua primeira sessão de mentoria', '🤝', 80, 'collaboration', 'mentorship_session', '{"count": 1}'),
('Evoluindo', 'Progrida em sua trilha de carreira', '📈', 100, 'career', 'career_progression', '{"count": 1}')
ON CONFLICT (title) DO NOTHING;