/*
  # Sistema Completo de Triggers para Notificações Automáticas

  Este arquivo implementa triggers de banco de dados para criar notificações
  automaticamente quando eventos relevantes ocorrem no sistema.

  ## Funcionalidades

  1. Funções Auxiliares
    - check_notification_preference() - Verifica preferências do usuário
    - create_notification_if_enabled() - Cria notificação respeitando preferências

  2. Triggers para PDIs
    - PDI aprovado (status = 'validated')
    - PDI rejeitado (status volta para 'in-progress')

  3. Triggers para Tarefas
    - Nova tarefa atribuída

  4. Triggers para Conquistas
    - Nova conquista desbloqueada

  5. Triggers para Grupos de Ação
    - Adicionado em grupo
    - Promovido a líder

  6. Triggers para Mentoria
    - Nova solicitação de mentoria
    - Mentoria aceita
    - Sessão de mentoria agendada
    - Mentoria cancelada

  7. Funções Auxiliares
    - cleanup_old_notifications() - Limpeza de notificações antigas
    - get_notification_stats() - Estatísticas de notificações

  ## Segurança
  - Todas as funções são SECURITY DEFINER para garantir acesso
  - Respeita preferências de notificação do usuário
*/

-- ============================================================================
-- SEÇÃO 0: PRE-REQUISITOS - GARANTIR COLUNAS NECESSÁRIAS
-- ============================================================================

-- Adicionar colunas ao mentorship_sessions se não existirem
-- Isso é necessário porque triggers podem depender dessas colunas
DO $$ 
BEGIN
  -- Add scheduled_start column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'scheduled_start'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN scheduled_start timestamptz;
    -- Copiar session_date para scheduled_start se a coluna existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'mentorship_sessions' AND column_name = 'session_date'
    ) THEN
      UPDATE mentorship_sessions SET scheduled_start = session_date WHERE scheduled_start IS NULL;
    END IF;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN status text DEFAULT 'scheduled' 
      CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'));
  END IF;

  -- Add session_notes column if it doesn't exist (used by cancellation trigger)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'session_notes'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN session_notes text;
  END IF;
END $$;

-- ============================================================================
-- SEÇÃO 1: FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para verificar preferências de notificação
DROP FUNCTION IF EXISTS check_notification_preference(uuid, text);
CREATE OR REPLACE FUNCTION check_notification_preference(
  p_profile_id uuid,
  p_notification_type text
) RETURNS boolean AS $$
DECLARE
  preference_value boolean;
  pref_record record;
BEGIN
  -- Mapear categorias para colunas da tabela
  SELECT * INTO pref_record
  FROM notification_preferences
  WHERE profile_id = p_profile_id;
  
  -- Se não encontrou preferências, retornar true (default é notificar)
  IF NOT FOUND THEN
    -- Criar preferências padrão para o usuário
    INSERT INTO notification_preferences (profile_id)
    VALUES (p_profile_id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN true;
  END IF;
  
  -- Mapear tipo de notificação para coluna correspondente
  CASE p_notification_type
    WHEN 'pdi_approved' THEN preference_value := pref_record.pdi_approved;
    WHEN 'pdi_rejected' THEN preference_value := pref_record.pdi_rejected;
    WHEN 'task_assigned' THEN preference_value := pref_record.task_assigned;
    WHEN 'achievement_unlocked' THEN preference_value := pref_record.achievement_unlocked;
    WHEN 'mentorship_scheduled' THEN preference_value := pref_record.mentorship_scheduled;
    WHEN 'mentorship_cancelled' THEN preference_value := pref_record.mentorship_cancelled;
    WHEN 'mentorship_request' THEN preference_value := pref_record.mentorship_scheduled; -- Use same as scheduled
    WHEN 'mentorship_accepted' THEN preference_value := pref_record.mentorship_scheduled; -- Use same as scheduled
    WHEN 'group_invitation' THEN preference_value := pref_record.group_invitation;
    WHEN 'group_leader' THEN preference_value := pref_record.group_invitation; -- Use same as invitation
    WHEN 'deadline_reminder' THEN preference_value := pref_record.deadline_reminder;
    ELSE preference_value := true; -- Default to true for unknown types
  END CASE;
  
  RETURN COALESCE(preference_value, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_notification_preference IS 
'Verifica se um tipo específico de notificação está habilitado para o usuário';


-- Função para criar notificação com verificação de preferências
DROP FUNCTION IF EXISTS create_notification_if_enabled(uuid, text, text, text, text, uuid, text, jsonb);
CREATE OR REPLACE FUNCTION create_notification_if_enabled(
  p_profile_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_category text DEFAULT 'general',
  p_related_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  preference_enabled boolean;
  notification_type text;
BEGIN
  -- Validar tipo de notificação
  IF p_type NOT IN ('info', 'success', 'warning', 'error') THEN
    p_type := 'info';
  END IF;

  -- Verificar se o tipo de notificação está habilitado
  SELECT check_notification_preference(p_profile_id, p_category) INTO preference_enabled;
  
  IF preference_enabled THEN
    INSERT INTO notifications (
      profile_id,
      title,
      message,
      type,
      category,
      related_id,
      action_url,
      metadata,
      read
    ) VALUES (
      p_profile_id,
      p_title,
      p_message,
      p_type::text,
      p_category,
      p_related_id,
      p_action_url,
      p_metadata,
      false
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification_if_enabled IS 
'Cria uma notificação se o usuário tiver a preferência habilitada para o tipo especificado';


-- ============================================================================
-- SEÇÃO 2: TRIGGERS PARA PDIs
-- ============================================================================

-- Trigger para PDI aprovado/rejeitado
CREATE OR REPLACE FUNCTION notify_pdi_status_change() RETURNS trigger AS $$
BEGIN
  -- PDI aprovado (validado)
  IF NEW.status = 'validated' AND OLD.status = 'completed' THEN
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '✅ PDI Aprovado!',
      format('Seu PDI "%s" foi aprovado pelo gestor. Parabéns!', NEW.title),
      'success',
      'pdi_approved',
      NEW.id,
      '/pdi',
      jsonb_build_object('pdi_id', NEW.id, 'pdi_title', NEW.title)
    );
  END IF;
  
  -- PDI rejeitado (volta para in-progress)
  IF NEW.status = 'in-progress' AND OLD.status = 'completed' THEN
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '⚠️ PDI Precisa de Ajustes',
      format('Seu PDI "%s" precisa de alguns ajustes. Verifique os comentários do gestor.', NEW.title),
      'warning',
      'pdi_rejected',
      NEW.id,
      '/pdi',
      jsonb_build_object('pdi_id', NEW.id, 'pdi_title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_pdi_status_change IS 
'Notifica o usuário quando o status do PDI é alterado para aprovado ou rejeitado';

DROP TRIGGER IF EXISTS pdi_status_notification ON pdis;
CREATE TRIGGER pdi_status_notification
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_pdi_status_change();


-- ============================================================================
-- SEÇÃO 3: TRIGGERS PARA TAREFAS
-- ============================================================================

-- Trigger para nova tarefa atribuída
CREATE OR REPLACE FUNCTION notify_task_assigned() RETURNS trigger AS $$
DECLARE
  formatted_deadline text;
BEGIN
  -- Formatar data do prazo
  formatted_deadline := to_char(NEW.deadline::date, 'DD/MM/YYYY');
  
  -- Notificar quando tarefa é criada
  PERFORM create_notification_if_enabled(
    NEW.assignee_id,
    '📋 Nova Tarefa Atribuída',
    format('Você recebeu uma nova tarefa: "%s". Prazo: %s', 
           NEW.title, 
           formatted_deadline),
    'info',
    'task_assigned',
    NEW.id,
    '/groups',
    jsonb_build_object(
      'task_id', NEW.id, 
      'task_title', NEW.title,
      'deadline', NEW.deadline
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_task_assigned IS 
'Notifica o usuário quando uma nova tarefa é atribuída a ele';

DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();


-- ============================================================================
-- SEÇÃO 4: TRIGGERS PARA CONQUISTAS
-- ============================================================================

-- Trigger para conquista desbloqueada
CREATE OR REPLACE FUNCTION notify_achievement_unlocked() RETURNS trigger AS $$
BEGIN
  -- Apenas notificar se a conquista foi desbloqueada (unlocked_at não era null antes)
  IF NEW.unlocked_at IS NOT NULL THEN
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '🏆 Nova Conquista Desbloqueada!',
      format('Parabéns! Você desbloqueou "%s" e ganhou %s pontos!', 
             NEW.title, 
             COALESCE(NEW.points, 0)),
      'success',
      'achievement_unlocked',
      NEW.id,
      '/achievements',
      jsonb_build_object(
        'achievement_id', NEW.id, 
        'achievement_title', NEW.title,
        'points', NEW.points
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_achievement_unlocked IS 
'Notifica o usuário quando uma nova conquista é desbloqueada';

DROP TRIGGER IF EXISTS achievement_unlocked_notification ON achievements;
CREATE TRIGGER achievement_unlocked_notification
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_unlocked();


-- ============================================================================
-- SEÇÃO 5: TRIGGERS PARA GRUPOS DE AÇÃO
-- ============================================================================

-- Trigger para adicionado em grupo de ação
CREATE OR REPLACE FUNCTION notify_group_participant_added() RETURNS trigger AS $$
DECLARE
  group_record record;
  inviter_name text;
BEGIN
  -- Buscar dados do grupo
  SELECT ag.title, ag.created_by, p.name as creator_name
  INTO group_record
  FROM action_groups ag
  LEFT JOIN profiles p ON p.id = ag.created_by
  WHERE ag.id = NEW.group_id;
  
  IF group_record IS NOT NULL THEN
    -- Notificar novo participante
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '👥 Você foi adicionado a um Grupo',
      format('Você foi adicionado ao grupo "%s"', group_record.title),
      'info',
      'group_invitation',
      NEW.group_id,
      '/groups',
      jsonb_build_object(
        'group_id', NEW.group_id, 
        'group_title', group_record.title,
        'inviter', group_record.creator_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_group_participant_added IS 
'Notifica o usuário quando é adicionado a um grupo de ação';

DROP TRIGGER IF EXISTS group_participant_added_notification ON action_group_participants;
CREATE TRIGGER group_participant_added_notification
  AFTER INSERT ON action_group_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_group_participant_added();


-- Trigger para promovido a líder de grupo
CREATE OR REPLACE FUNCTION notify_group_leader_promotion() RETURNS trigger AS $$
DECLARE
  group_record record;
BEGIN
  -- Verificar se foi promovido a líder
  IF NEW.role = 'leader' AND (OLD.role IS NULL OR OLD.role != 'leader') THEN
    -- Buscar dados do grupo
    SELECT title INTO group_record
    FROM action_groups
    WHERE id = NEW.group_id;
    
    IF group_record IS NOT NULL THEN
      PERFORM create_notification_if_enabled(
        NEW.profile_id,
        '⭐ Você é agora Líder do Grupo',
        format('Você foi promovido a líder do grupo "%s"', group_record.title),
        'success',
        'group_leader',
        NEW.group_id,
        '/groups',
        jsonb_build_object(
          'group_id', NEW.group_id, 
          'group_title', group_record.title
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_group_leader_promotion IS 
'Notifica o usuário quando é promovido a líder de um grupo';

DROP TRIGGER IF EXISTS group_leader_promotion_notification ON action_group_participants;
CREATE TRIGGER group_leader_promotion_notification
  AFTER UPDATE OF role ON action_group_participants
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION notify_group_leader_promotion();


-- ============================================================================
-- SEÇÃO 6: TRIGGERS PARA MENTORIA
-- ============================================================================

-- Trigger para nova solicitação de mentoria
CREATE OR REPLACE FUNCTION notify_mentorship_request() RETURNS trigger AS $$
DECLARE
  mentee_record record;
BEGIN
  -- Apenas para novas solicitações
  IF NEW.status = 'pending' THEN
    -- Buscar dados do mentee
    SELECT name INTO mentee_record
    FROM profiles
    WHERE id = NEW.mentee_id;
    
    IF mentee_record IS NOT NULL AND NEW.mentor_id IS NOT NULL THEN
      PERFORM create_notification_if_enabled(
        NEW.mentor_id,
        '🎓 Nova Solicitação de Mentoria',
        format('%s solicitou mentoria. Tópico: %s', 
               mentee_record.name,
               COALESCE(NEW.topic, 'Não especificado')),
        'info',
        'mentorship_request',
        NEW.id,
        '/mentorship',
        jsonb_build_object(
          'mentorship_id', NEW.id, 
          'mentee_name', mentee_record.name,
          'topic', NEW.topic
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_mentorship_request IS 
'Notifica o mentor quando recebe uma nova solicitação de mentoria';

DROP TRIGGER IF EXISTS mentorship_request_notification ON mentorships;
CREATE TRIGGER mentorship_request_notification
  AFTER INSERT ON mentorships
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_request();


-- Trigger para mentoria aceita
CREATE OR REPLACE FUNCTION notify_mentorship_accepted() RETURNS trigger AS $$
DECLARE
  mentor_record record;
BEGIN
  -- Verificar se a mentoria foi aceita
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    -- Buscar dados do mentor
    SELECT name INTO mentor_record
    FROM profiles
    WHERE id = NEW.mentor_id;
    
    IF mentor_record IS NOT NULL THEN
      PERFORM create_notification_if_enabled(
        NEW.mentee_id,
        '✅ Mentoria Aceita!',
        format('%s aceitou sua solicitação de mentoria', mentor_record.name),
        'success',
        'mentorship_accepted',
        NEW.id,
        '/mentorship',
        jsonb_build_object(
          'mentorship_id', NEW.id, 
          'mentor_name', mentor_record.name
        )
      );
    END IF;
  END IF;
  
  -- Verificar se a mentoria foi cancelada/rejeitada
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status = 'pending' THEN
    -- Buscar dados do mentor
    SELECT name INTO mentor_record
    FROM profiles
    WHERE id = NEW.mentor_id;
    
    IF mentor_record IS NOT NULL THEN
      PERFORM create_notification_if_enabled(
        NEW.mentee_id,
        '❌ Solicitação de Mentoria Recusada',
        format('%s não pôde aceitar sua solicitação de mentoria no momento', mentor_record.name),
        'warning',
        'mentorship_cancelled',
        NEW.id,
        '/mentorship',
        jsonb_build_object('mentorship_id', NEW.id, 'mentor_name', mentor_record.name)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_mentorship_accepted IS 
'Notifica o mentee quando sua solicitação de mentoria é aceita ou recusada';

DROP TRIGGER IF EXISTS mentorship_accepted_notification ON mentorships;
CREATE TRIGGER mentorship_accepted_notification
  AFTER UPDATE OF status ON mentorships
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_mentorship_accepted();


-- Trigger para sessão de mentoria agendada
CREATE OR REPLACE FUNCTION notify_mentorship_session_scheduled() RETURNS trigger AS $$
DECLARE
  mentorship_record record;
  formatted_date text;
  formatted_time text;
  session_datetime timestamptz;
BEGIN
  -- Buscar dados da mentoria e participantes
  SELECT 
    m.mentor_id, 
    m.mentee_id, 
    mp.name as mentor_name, 
    me.name as mentee_name
  INTO mentorship_record
  FROM mentorships m
  JOIN profiles mp ON mp.id = m.mentor_id
  JOIN profiles me ON me.id = m.mentee_id
  WHERE m.id = NEW.mentorship_id;
  
  -- Usar scheduled_start ou session_date como fallback
  session_datetime := COALESCE(NEW.scheduled_start, NEW.session_date);
  
  IF mentorship_record IS NOT NULL AND session_datetime IS NOT NULL THEN
    -- Formatar data e hora
    formatted_date := to_char(session_datetime::date, 'DD/MM/YYYY');
    formatted_time := to_char(session_datetime::time, 'HH24:MI');
    
    -- Notificar mentor
    PERFORM create_notification_if_enabled(
      mentorship_record.mentor_id,
      '📅 Sessão de Mentoria Agendada',
      format('Sessão agendada com %s para %s às %s', 
             mentorship_record.mentee_name,
             formatted_date,
             formatted_time),
      'info',
      'mentorship_scheduled',
      NEW.id,
      '/mentorship',
      jsonb_build_object(
        'session_id', NEW.id, 
        'mentee_name', mentorship_record.mentee_name,
        'scheduled_start', session_datetime
      )
    );
    
    -- Notificar mentee
    PERFORM create_notification_if_enabled(
      mentorship_record.mentee_id,
      '📅 Sessão de Mentoria Confirmada',
      format('Sua sessão com %s foi confirmada para %s às %s', 
             mentorship_record.mentor_name,
             formatted_date,
             formatted_time),
      'success',
      'mentorship_scheduled',
      NEW.id,
      '/mentorship',
      jsonb_build_object(
        'session_id', NEW.id, 
        'mentor_name', mentorship_record.mentor_name,
        'scheduled_start', session_datetime
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_mentorship_session_scheduled IS 
'Notifica mentor e mentee quando uma sessão de mentoria é agendada';

DROP TRIGGER IF EXISTS mentorship_session_scheduled_notification ON mentorship_sessions;
CREATE TRIGGER mentorship_session_scheduled_notification
  AFTER INSERT ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_session_scheduled();


-- Trigger para sessão de mentoria cancelada
CREATE OR REPLACE FUNCTION notify_mentorship_session_cancelled() RETURNS trigger AS $$
DECLARE
  mentorship_record record;
  formatted_date text;
  session_datetime timestamptz;
BEGIN
  -- Verificar se a sessão foi cancelada (com tratamento para status NULL)
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    -- Buscar dados da mentoria e participantes
    SELECT 
      m.mentor_id, 
      m.mentee_id, 
      mp.name as mentor_name, 
      me.name as mentee_name
    INTO mentorship_record
    FROM mentorships m
    JOIN profiles mp ON mp.id = m.mentor_id
    JOIN profiles me ON me.id = m.mentee_id
    WHERE m.id = NEW.mentorship_id;
    
    IF mentorship_record IS NOT NULL THEN
      -- Usar scheduled_start ou session_date como fallback
      session_datetime := COALESCE(OLD.scheduled_start, NEW.session_date);
      IF session_datetime IS NOT NULL THEN
        formatted_date := to_char(session_datetime::date, 'DD/MM/YYYY');
      ELSE
        formatted_date := 'data não definida';
      END IF;
      
      -- Notificar mentor
      PERFORM create_notification_if_enabled(
        mentorship_record.mentor_id,
        '❌ Sessão de Mentoria Cancelada',
        format('A sessão de mentoria com %s do dia %s foi cancelada', 
               mentorship_record.mentee_name,
               formatted_date),
        'warning',
        'mentorship_cancelled',
        NEW.id,
        '/mentorship',
        jsonb_build_object('session_id', NEW.id, 'mentee_name', mentorship_record.mentee_name)
      );
      
      -- Notificar mentee
      PERFORM create_notification_if_enabled(
        mentorship_record.mentee_id,
        '❌ Sessão de Mentoria Cancelada',
        format('A sessão de mentoria com %s do dia %s foi cancelada', 
               mentorship_record.mentor_name,
               formatted_date),
        'warning',
        'mentorship_cancelled',
        NEW.id,
        '/mentorship',
        jsonb_build_object('session_id', NEW.id, 'mentor_name', mentorship_record.mentor_name)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_mentorship_session_cancelled IS 
'Notifica mentor e mentee quando uma sessão de mentoria é cancelada';

DROP TRIGGER IF EXISTS mentorship_session_cancelled_notification ON mentorship_sessions;
CREATE TRIGGER mentorship_session_cancelled_notification
  AFTER UPDATE ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_session_cancelled();


-- ============================================================================
-- SEÇÃO 7: FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para limpar notificações antigas (executar periodicamente)
DROP FUNCTION IF EXISTS cleanup_old_notifications();
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Deletar notificações lidas com mais de 30 dias
  DELETE FROM notifications 
  WHERE created_at < now() - interval '30 days'
  AND read = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % read notifications older than 30 days', deleted_count;
  
  -- Manter notificações não lidas por mais tempo (90 dias)
  DELETE FROM notifications 
  WHERE created_at < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old notifications older than 90 days', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_notifications IS 
'Remove notificações antigas - lidas após 30 dias, todas após 90 dias';


-- Função para obter estatísticas de notificações
DROP FUNCTION IF EXISTS get_notification_stats(uuid);
CREATE OR REPLACE FUNCTION get_notification_stats(p_profile_id uuid)
RETURNS TABLE (
  total_notifications bigint,
  unread_notifications bigint,
  notifications_today bigint,
  most_common_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE n.read = false) as unread_notifications,
    COUNT(*) FILTER (WHERE n.created_at >= CURRENT_DATE) as notifications_today,
    (
      SELECT n2.type::text 
      FROM notifications n2
      WHERE n2.profile_id = p_profile_id 
      GROUP BY n2.type 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as most_common_type
  FROM notifications n
  WHERE n.profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_notification_stats IS 
'Retorna estatísticas de notificações para um usuário específico';


-- ============================================================================
-- SEÇÃO 8: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para melhorar performance das queries de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_profile_category 
  ON notifications(profile_id, category);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_read 
  ON notifications(profile_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at_read 
  ON notifications(created_at, read);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_created_desc 
  ON notifications(profile_id, created_at DESC);


-- ============================================================================
-- SEÇÃO 9: VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todos os triggers foram criados
DO $$
DECLARE
  trigger_count integer;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE t.tgname IN (
    'pdi_status_notification',
    'task_assigned_notification',
    'achievement_unlocked_notification',
    'group_participant_added_notification',
    'group_leader_promotion_notification',
    'mentorship_request_notification',
    'mentorship_accepted_notification',
    'mentorship_session_scheduled_notification',
    'mentorship_session_cancelled_notification'
  );
  
  RAISE NOTICE 'Total notification triggers created: %', trigger_count;
  
  IF trigger_count < 9 THEN
    RAISE WARNING 'Some triggers may not have been created. Expected 9, found %', trigger_count;
  END IF;
END $$;

-- Comentário final
COMMENT ON SCHEMA public IS 
'Schema público com triggers de notificações automáticas implementados em 27/11/2025';
