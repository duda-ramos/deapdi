/*
  # Sistema Automático de Conquistas

  1. Templates de Conquistas
    - Conquistas básicas pré-configuradas
    - Condições de desbloqueio definidas
    - Pontuação e categorização

  2. Triggers Automáticos
    - Verificação após conclusão de tarefas
    - Verificação após conclusão de PDIs
    - Verificação após progresso na trilha
    - Verificação após avaliações de competências

  3. Funções de Verificação
    - Lógica de desbloqueio por tipo
    - Prevenção de duplicatas
    - Notificações automáticas
*/

-- Inserir templates de conquistas básicas
INSERT INTO achievement_templates (title, description, icon, points, category, trigger_type, trigger_condition) VALUES
('Primeira Conquista', 'Complete sua primeira tarefa', '🚀', 50, 'getting_started', 'task_completed', '{"min_tasks": 1}'),
('Iniciante Dedicado', 'Complete 5 PDIs', '📈', 250, 'development', 'pdi_completed', '{"min_pdis": 5}'),
('Progresso Inicial', 'Alcance 25% de progresso na trilha', '🎯', 100, 'career', 'career_progress', '{"min_progress": 25}'),
('Meio Caminho', 'Alcance 50% de progresso na trilha', '⭐', 200, 'career', 'career_progress', '{"min_progress": 50}'),
('Quase Lá', 'Alcance 75% de progresso na trilha', '🌟', 300, 'career', 'career_progress', '{"min_progress": 75}'),
('Excelência', 'Receba sua primeira avaliação 5 estrelas', '⭐', 150, 'competency', 'competency_rated', '{"min_rating": 5}'),
('Colaborador Ativo', 'Complete 10 tarefas', '💪', 200, 'productivity', 'task_completed', '{"min_tasks": 10}'),
('Desenvolvedor Consistente', 'Complete 10 PDIs', '🎓', 500, 'development', 'pdi_completed', '{"min_pdis": 10}'),
('Especialista', 'Receba 5 avaliações 5 estrelas', '🏆', 400, 'competency', 'competency_rated', '{"min_rating": 5, "min_count": 5}'),
('Trilha Completa', 'Complete 100% da trilha de carreira', '👑', 1000, 'career', 'career_progress', '{"min_progress": 100}')
ON CONFLICT (title) DO NOTHING;

-- Função para verificar conquistas de tarefas
CREATE OR REPLACE FUNCTION check_task_achievements()
RETURNS TRIGGER AS $$
DECLARE
  completed_tasks_count INTEGER;
  template_record RECORD;
  existing_achievement_id UUID;
BEGIN
  -- Só processa se a tarefa foi marcada como concluída
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    
    -- Conta tarefas concluídas pelo usuário
    SELECT COUNT(*) INTO completed_tasks_count
    FROM tasks 
    WHERE assignee_id = NEW.assignee_id AND status = 'done';
    
    -- Verifica templates de conquistas relacionadas a tarefas
    FOR template_record IN 
      SELECT * FROM achievement_templates 
      WHERE trigger_type = 'task_completed'
    LOOP
      -- Verifica se já tem essa conquista
      SELECT id INTO existing_achievement_id
      FROM achievements 
      WHERE profile_id = NEW.assignee_id AND template_id = template_record.id;
      
      -- Se não tem a conquista e atende aos requisitos
      IF existing_achievement_id IS NULL THEN
        IF completed_tasks_count >= (template_record.trigger_condition->>'min_tasks')::INTEGER THEN
          
          -- Desbloqueia a conquista
          INSERT INTO achievements (
            profile_id, 
            template_id,
            title, 
            description, 
            icon, 
            points, 
            unlocked_at
          ) VALUES (
            NEW.assignee_id,
            template_record.id,
            template_record.title,
            template_record.description,
            template_record.icon,
            template_record.points,
            NOW()
          );
          
          -- Adiciona pontos ao perfil
          UPDATE profiles 
          SET points = points + template_record.points 
          WHERE id = NEW.assignee_id;
          
          -- Cria notificação
          INSERT INTO notifications (
            profile_id,
            title,
            message,
            type,
            action_url
          ) VALUES (
            NEW.assignee_id,
            '🏆 Nova Conquista Desbloqueada!',
            'Parabéns! Você desbloqueou: ' || template_record.title || ' (+' || template_record.points || ' pontos)',
            'success',
            '/achievements'
          );
          
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar conquistas de PDIs
CREATE OR REPLACE FUNCTION check_pdi_achievements()
RETURNS TRIGGER AS $$
DECLARE
  completed_pdis_count INTEGER;
  template_record RECORD;
  existing_achievement_id UUID;
BEGIN
  -- Só processa se o PDI foi marcado como concluído ou validado
  IF NEW.status IN ('completed', 'validated') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'validated')) THEN
    
    -- Conta PDIs concluídos pelo usuário
    SELECT COUNT(*) INTO completed_pdis_count
    FROM pdis 
    WHERE profile_id = NEW.profile_id AND status IN ('completed', 'validated');
    
    -- Verifica templates de conquistas relacionadas a PDIs
    FOR template_record IN 
      SELECT * FROM achievement_templates 
      WHERE trigger_type = 'pdi_completed'
    LOOP
      -- Verifica se já tem essa conquista
      SELECT id INTO existing_achievement_id
      FROM achievements 
      WHERE profile_id = NEW.profile_id AND template_id = template_record.id;
      
      -- Se não tem a conquista e atende aos requisitos
      IF existing_achievement_id IS NULL THEN
        IF completed_pdis_count >= (template_record.trigger_condition->>'min_pdis')::INTEGER THEN
          
          -- Desbloqueia a conquista
          INSERT INTO achievements (
            profile_id, 
            template_id,
            title, 
            description, 
            icon, 
            points, 
            unlocked_at
          ) VALUES (
            NEW.profile_id,
            template_record.id,
            template_record.title,
            template_record.description,
            template_record.icon,
            template_record.points,
            NOW()
          );
          
          -- Adiciona pontos ao perfil
          UPDATE profiles 
          SET points = points + template_record.points 
          WHERE id = NEW.profile_id;
          
          -- Cria notificação
          INSERT INTO notifications (
            profile_id,
            title,
            message,
            type,
            action_url
          ) VALUES (
            NEW.profile_id,
            '🏆 Nova Conquista Desbloqueada!',
            'Parabéns! Você desbloqueou: ' || template_record.title || ' (+' || template_record.points || ' pontos)',
            'success',
            '/achievements'
          );
          
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar conquistas de competências
CREATE OR REPLACE FUNCTION check_competency_achievements()
RETURNS TRIGGER AS $$
DECLARE
  max_rating INTEGER;
  five_star_count INTEGER;
  template_record RECORD;
  existing_achievement_id UUID;
BEGIN
  -- Só processa se houve mudança nas avaliações
  IF (NEW.self_rating IS DISTINCT FROM OLD.self_rating) OR (NEW.manager_rating IS DISTINCT FROM OLD.manager_rating) THEN
    
    -- Pega a maior avaliação (self ou manager)
    max_rating := GREATEST(COALESCE(NEW.self_rating, 0), COALESCE(NEW.manager_rating, 0));
    
    -- Conta quantas competências têm avaliação 5
    SELECT COUNT(*) INTO five_star_count
    FROM competencies 
    WHERE profile_id = NEW.profile_id 
    AND GREATEST(COALESCE(self_rating, 0), COALESCE(manager_rating, 0)) = 5;
    
    -- Verifica templates de conquistas relacionadas a competências
    FOR template_record IN 
      SELECT * FROM achievement_templates 
      WHERE trigger_type = 'competency_rated'
    LOOP
      -- Verifica se já tem essa conquista
      SELECT id INTO existing_achievement_id
      FROM achievements 
      WHERE profile_id = NEW.profile_id AND template_id = template_record.id;
      
      -- Se não tem a conquista e atende aos requisitos
      IF existing_achievement_id IS NULL THEN
        -- Verifica se é primeira avaliação 5 estrelas
        IF (template_record.trigger_condition->>'min_count') IS NULL THEN
          IF max_rating >= (template_record.trigger_condition->>'min_rating')::INTEGER THEN
            
            -- Desbloqueia a conquista
            INSERT INTO achievements (
              profile_id, 
              template_id,
              title, 
              description, 
              icon, 
              points, 
              unlocked_at
            ) VALUES (
              NEW.profile_id,
              template_record.id,
              template_record.title,
              template_record.description,
              template_record.icon,
              template_record.points,
              NOW()
            );
            
            -- Adiciona pontos ao perfil
            UPDATE profiles 
            SET points = points + template_record.points 
            WHERE id = NEW.profile_id;
            
            -- Cria notificação
            INSERT INTO notifications (
              profile_id,
              title,
              message,
              type,
              action_url
            ) VALUES (
              NEW.profile_id,
              '🏆 Nova Conquista Desbloqueada!',
              'Parabéns! Você desbloqueou: ' || template_record.title || ' (+' || template_record.points || ' pontos)',
              'success',
              '/achievements'
            );
            
          END IF;
        -- Verifica se tem múltiplas avaliações 5 estrelas
        ELSE
          IF five_star_count >= (template_record.trigger_condition->>'min_count')::INTEGER THEN
            
            -- Desbloqueia a conquista
            INSERT INTO achievements (
              profile_id, 
              template_id,
              title, 
              description, 
              icon, 
              points, 
              unlocked_at
            ) VALUES (
              NEW.profile_id,
              template_record.id,
              template_record.title,
              template_record.description,
              template_record.icon,
              template_record.points,
              NOW()
            );
            
            -- Adiciona pontos ao perfil
            UPDATE profiles 
            SET points = points + template_record.points 
            WHERE id = NEW.profile_id;
            
            -- Cria notificação
            INSERT INTO notifications (
              profile_id,
              title,
              message,
              type,
              action_url
            ) VALUES (
              NEW.profile_id,
              '🏆 Nova Conquista Desbloqueada!',
              'Parabéns! Você desbloqueou: ' || template_record.title || ' (+' || template_record.points || ' pontos)',
              'success',
              '/achievements'
            );
            
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar conquistas de progresso na trilha
CREATE OR REPLACE FUNCTION check_career_achievements()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  existing_achievement_id UUID;
BEGIN
  -- Só processa se houve aumento no progresso
  IF NEW.progress > COALESCE(OLD.progress, 0) THEN
    
    -- Verifica templates de conquistas relacionadas ao progresso
    FOR template_record IN 
      SELECT * FROM achievement_templates 
      WHERE trigger_type = 'career_progress'
    LOOP
      -- Verifica se já tem essa conquista
      SELECT id INTO existing_achievement_id
      FROM achievements 
      WHERE profile_id = NEW.profile_id AND template_id = template_record.id;
      
      -- Se não tem a conquista e atende aos requisitos
      IF existing_achievement_id IS NULL THEN
        IF NEW.progress >= (template_record.trigger_condition->>'min_progress')::NUMERIC THEN
          
          -- Desbloqueia a conquista
          INSERT INTO achievements (
            profile_id, 
            template_id,
            title, 
            description, 
            icon, 
            points, 
            unlocked_at
          ) VALUES (
            NEW.profile_id,
            template_record.id,
            template_record.title,
            template_record.description,
            template_record.icon,
            template_record.points,
            NOW()
          );
          
          -- Adiciona pontos ao perfil
          UPDATE profiles 
          SET points = points + template_record.points 
          WHERE id = NEW.profile_id;
          
          -- Cria notificação
          INSERT INTO notifications (
            profile_id,
            title,
            message,
            type,
            action_url
          ) VALUES (
            NEW.profile_id,
            '🏆 Nova Conquista Desbloqueada!',
            'Parabéns! Você desbloqueou: ' || template_record.title || ' (+' || template_record.points || ' pontos)',
            'success',
            '/achievements'
          );
          
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para verificação automática
DROP TRIGGER IF EXISTS check_task_achievements ON tasks;
CREATE TRIGGER check_task_achievements
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_achievements();

DROP TRIGGER IF EXISTS check_pdi_achievements ON pdis;
CREATE TRIGGER check_pdi_achievements
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION check_pdi_achievements();

DROP TRIGGER IF EXISTS check_competency_achievements ON competencies;
CREATE TRIGGER check_competency_achievements
  AFTER UPDATE OF self_rating, manager_rating ON competencies
  FOR EACH ROW
  EXECUTE FUNCTION check_competency_achievements();

DROP TRIGGER IF EXISTS check_career_achievements ON career_tracks;
CREATE TRIGGER check_career_achievements
  AFTER UPDATE OF progress ON career_tracks
  FOR EACH ROW
  EXECUTE FUNCTION check_career_achievements();

-- Função para verificação manual de conquistas (útil para debug)
CREATE OR REPLACE FUNCTION manual_check_achievements(p_profile_id UUID)
RETURNS TABLE(unlocked_count INTEGER, total_points INTEGER) AS $$
DECLARE
  unlocked_count INTEGER := 0;
  total_points INTEGER := 0;
  template_record RECORD;
  existing_achievement_id UUID;
  completed_tasks INTEGER;
  completed_pdis INTEGER;
  current_progress NUMERIC;
  max_competency_rating INTEGER;
  five_star_count INTEGER;
BEGIN
  -- Busca estatísticas do usuário
  SELECT COUNT(*) INTO completed_tasks
  FROM tasks WHERE assignee_id = p_profile_id AND status = 'done';
  
  SELECT COUNT(*) INTO completed_pdis
  FROM pdis WHERE profile_id = p_profile_id AND status IN ('completed', 'validated');
  
  SELECT COALESCE(progress, 0) INTO current_progress
  FROM career_tracks WHERE profile_id = p_profile_id;
  
  SELECT COALESCE(MAX(GREATEST(COALESCE(self_rating, 0), COALESCE(manager_rating, 0))), 0) INTO max_competency_rating
  FROM competencies WHERE profile_id = p_profile_id;
  
  SELECT COUNT(*) INTO five_star_count
  FROM competencies 
  WHERE profile_id = p_profile_id 
  AND GREATEST(COALESCE(self_rating, 0), COALESCE(manager_rating, 0)) = 5;
  
  -- Verifica cada template
  FOR template_record IN SELECT * FROM achievement_templates LOOP
    -- Verifica se já tem essa conquista
    SELECT id INTO existing_achievement_id
    FROM achievements 
    WHERE profile_id = p_profile_id AND template_id = template_record.id;
    
    -- Se não tem a conquista, verifica condições
    IF existing_achievement_id IS NULL THEN
      CASE template_record.trigger_type
        WHEN 'task_completed' THEN
          IF completed_tasks >= (template_record.trigger_condition->>'min_tasks')::INTEGER THEN
            INSERT INTO achievements (profile_id, template_id, title, description, icon, points, unlocked_at)
            VALUES (p_profile_id, template_record.id, template_record.title, template_record.description, template_record.icon, template_record.points, NOW());
            unlocked_count := unlocked_count + 1;
            total_points := total_points + template_record.points;
          END IF;
          
        WHEN 'pdi_completed' THEN
          IF completed_pdis >= (template_record.trigger_condition->>'min_pdis')::INTEGER THEN
            INSERT INTO achievements (profile_id, template_id, title, description, icon, points, unlocked_at)
            VALUES (p_profile_id, template_record.id, template_record.title, template_record.description, template_record.icon, template_record.points, NOW());
            unlocked_count := unlocked_count + 1;
            total_points := total_points + template_record.points;
          END IF;
          
        WHEN 'career_progress' THEN
          IF current_progress >= (template_record.trigger_condition->>'min_progress')::NUMERIC THEN
            INSERT INTO achievements (profile_id, template_id, title, description, icon, points, unlocked_at)
            VALUES (p_profile_id, template_record.id, template_record.title, template_record.description, template_record.icon, template_record.points, NOW());
            unlocked_count := unlocked_count + 1;
            total_points := total_points + template_record.points;
          END IF;
          
        WHEN 'competency_rated' THEN
          IF (template_record.trigger_condition->>'min_count') IS NULL THEN
            -- Primeira avaliação 5 estrelas
            IF max_competency_rating >= (template_record.trigger_condition->>'min_rating')::INTEGER THEN
              INSERT INTO achievements (profile_id, template_id, title, description, icon, points, unlocked_at)
              VALUES (p_profile_id, template_record.id, template_record.title, template_record.description, template_record.icon, template_record.points, NOW());
              unlocked_count := unlocked_count + 1;
              total_points := total_points + template_record.points;
            END IF;
          ELSE
            -- Múltiplas avaliações 5 estrelas
            IF five_star_count >= (template_record.trigger_condition->>'min_count')::INTEGER THEN
              INSERT INTO achievements (profile_id, template_id, title, description, icon, points, unlocked_at)
              VALUES (p_profile_id, template_record.id, template_record.title, template_record.description, template_record.icon, template_record.points, NOW());
              unlocked_count := unlocked_count + 1;
              total_points := total_points + template_record.points;
            END IF;
          END IF;
      END CASE;
    END IF;
  END LOOP;
  
  -- Atualiza pontos totais se desbloqueou conquistas
  IF total_points > 0 THEN
    UPDATE profiles SET points = points + total_points WHERE id = p_profile_id;
  END IF;
  
  RETURN QUERY SELECT unlocked_count, total_points;
END;
$$ LANGUAGE plpgsql;