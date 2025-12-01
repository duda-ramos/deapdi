/*
  # Triggers de Notificações Automáticas
  
  Este migration cria triggers para gerar notificações automaticamente quando
  eventos específicos ocorrem no sistema.
  
  ## Funções Criadas
  
  1. `create_notification_if_enabled` - Função auxiliar que verifica preferências
  2. `notify_pdi_status_change` - Notifica aprovação/rejeição de PDI
  3. `notify_task_assigned` - Notifica nova tarefa atribuída
  4. `notify_group_participant_added` - Notifica quando adicionado a grupo
  5. `notify_group_leader_promoted` - Notifica promoção a líder
  6. `notify_mentorship_request` - Notifica solicitação de mentoria
  7. `notify_mentorship_accepted` - Notifica mentoria aceita
  8. `notify_mentorship_session_scheduled` - Notifica sessão agendada
  
  ## Triggers Criados
  
  - PDI: pdi_status_notification
  - Tasks: task_assigned_notification  
  - Groups: group_participant_added_notification, group_leader_promoted_notification
  - Mentorship: mentorship_request_notification, mentorship_accepted_notification, 
                mentorship_session_scheduled_notification
  
  ## Segurança
  
  - Todas as funções usam SECURITY DEFINER
  - Preferências do usuário são respeitadas
  - Mensagens em português brasileiro
*/

-- ============================================================================
-- PASSO 1: GARANTIR COLUNAS NECESSÁRIAS NA TABELA NOTIFICATIONS
-- ============================================================================

DO $$
BEGIN
  -- Adicionar coluna category se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications ADD COLUMN category text DEFAULT 'general';
    RAISE NOTICE 'Coluna category adicionada à tabela notifications';
  END IF;

  -- Adicionar coluna related_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'related_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN related_id text;
    RAISE NOTICE 'Coluna related_id adicionada à tabela notifications';
  END IF;

  -- Adicionar coluna metadata se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}';
    RAISE NOTICE 'Coluna metadata adicionada à tabela notifications';
  END IF;
END $$;

-- ============================================================================
-- PASSO 2: FUNÇÃO AUXILIAR PARA CRIAR NOTIFICAÇÃO COM VERIFICAÇÃO DE PREFERÊNCIAS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification_if_enabled(
  p_profile_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_category text DEFAULT 'general',
  p_related_id text DEFAULT NULL,
  p_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
  preference_enabled boolean := true;
  preference_column text;
BEGIN
  -- Mapear categoria para coluna de preferência
  preference_column := CASE p_category
    WHEN 'pdi_approved' THEN 'pdi_approved'
    WHEN 'pdi_rejected' THEN 'pdi_rejected'
    WHEN 'task_assigned' THEN 'task_assigned'
    WHEN 'achievement_unlocked' THEN 'achievement_unlocked'
    WHEN 'competency_evaluation' THEN 'achievement_unlocked'
    WHEN 'group_invitation' THEN 'group_invitation'
    WHEN 'group_leader' THEN 'group_invitation'
    WHEN 'mentorship_request' THEN 'mentorship_scheduled'
    WHEN 'mentorship_accepted' THEN 'mentorship_scheduled'
    WHEN 'mentorship_scheduled' THEN 'mentorship_scheduled'
    WHEN 'deadline_reminder' THEN 'deadline_reminder'
    ELSE NULL
  END;
  
  -- Verificar preferência do usuário se categoria conhecida
  IF preference_column IS NOT NULL THEN
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(%I, true) FROM notification_preferences WHERE profile_id = $1',
        preference_column
      )
      INTO preference_enabled
      USING p_profile_id;
      
      -- Se não encontrou preferência, criar registro com defaults
      IF preference_enabled IS NULL THEN
        INSERT INTO notification_preferences (profile_id)
        VALUES (p_profile_id)
        ON CONFLICT (profile_id) DO NOTHING;
        preference_enabled := true;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Em caso de erro (tabela não existe, etc), permitir notificação
      preference_enabled := true;
    END;
  END IF;
  
  -- Criar notificação se habilitada
  IF preference_enabled THEN
    INSERT INTO notifications (
      profile_id,
      title,
      message,
      type,
      category,
      related_id,
      action_url
    ) VALUES (
      p_profile_id,
      p_title,
      p_message,
      p_type::notification_type,
      p_category,
      p_related_id,
      p_action_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION create_notification_if_enabled IS 
  'Cria notificação verificando preferências do usuário. Retorna UUID ou NULL.';

-- ============================================================================
-- PASSO 3: TRIGGER PARA PDI - MUDANÇAS DE STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_pdi_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- PDI aprovado (validado)
  IF NEW.status = 'validated' AND (OLD.status = 'completed' OR OLD.status = 'in-progress') THEN
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '✅ PDI Aprovado!',
      format('Seu PDI "%s" foi aprovado pelo gestor. Parabéns!', NEW.title),
      'success',
      'pdi_approved',
      NEW.id::text,
      '/pdi'
    );
  END IF;
  
  -- PDI rejeitado (volta para in-progress após completed)
  IF NEW.status = 'in-progress' AND OLD.status = 'completed' THEN
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '⚠️ PDI Precisa de Ajustes',
      format('Seu PDI "%s" precisa de alguns ajustes. Verifique os comentários do gestor.', NEW.title),
      'warning',
      'pdi_rejected',
      NEW.id::text,
      '/pdi'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS pdi_status_notification ON pdis;
CREATE TRIGGER pdi_status_notification
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_pdi_status_change();

COMMENT ON FUNCTION notify_pdi_status_change IS 
  'Notifica usuário quando PDI é aprovado ou rejeitado';

-- ============================================================================
-- PASSO 4: TRIGGER PARA TAREFAS - NOVA TAREFA ATRIBUÍDA
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_title text;
  action_url text;
BEGIN
  -- Buscar título do grupo se houver
  IF NEW.group_id IS NOT NULL THEN
    SELECT title INTO group_title
    FROM action_groups
    WHERE id = NEW.group_id;
    action_url := '/groups';
  ELSE
    action_url := '/pdi';
  END IF;
  
  -- Notificar pessoa atribuída
  PERFORM create_notification_if_enabled(
    NEW.assignee_id,
    '📋 Nova Tarefa Atribuída',
    format('Você recebeu uma nova tarefa: "%s"%s. Prazo: %s', 
           NEW.title,
           CASE WHEN group_title IS NOT NULL THEN ' no grupo "' || group_title || '"' ELSE '' END,
           to_char(NEW.deadline::date, 'DD/MM/YYYY')),
    'info',
    'task_assigned',
    NEW.id::text,
    action_url
  );
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

COMMENT ON FUNCTION notify_task_assigned IS 
  'Notifica usuário quando uma tarefa é atribuída a ele';

-- ============================================================================
-- PASSO 5: TRIGGER PARA GRUPOS - PARTICIPANTE ADICIONADO
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_group_participant_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_title text;
BEGIN
  -- Buscar título do grupo
  SELECT ag.title INTO group_title
  FROM action_groups ag
  WHERE ag.id = NEW.group_id;
  
  -- Notificar novo participante
  PERFORM create_notification_if_enabled(
    NEW.profile_id,
    '👥 Você foi adicionado a um Grupo',
    format('Você foi adicionado ao grupo de ação "%s"', group_title),
    'info',
    'group_invitation',
    NEW.group_id::text,
    '/groups'
  );
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS group_participant_added_notification ON action_group_participants;
CREATE TRIGGER group_participant_added_notification
  AFTER INSERT ON action_group_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_group_participant_added();

COMMENT ON FUNCTION notify_group_participant_added IS 
  'Notifica usuário quando adicionado a um grupo de ação';

-- ============================================================================
-- PASSO 6: TRIGGER PARA GRUPOS - PROMOÇÃO A LÍDER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_group_leader_promoted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_title text;
BEGIN
  -- Só notifica se foi promovido a líder
  IF NEW.role = 'leader' AND (OLD.role IS NULL OR OLD.role = 'member') THEN
    -- Buscar título do grupo
    SELECT ag.title INTO group_title
    FROM action_groups ag
    WHERE ag.id = NEW.group_id;
    
    -- Notificar novo líder
    PERFORM create_notification_if_enabled(
      NEW.profile_id,
      '⭐ Você é agora Líder do Grupo',
      format('Você foi promovido a líder do grupo "%s"', group_title),
      'success',
      'group_leader',
      NEW.group_id::text,
      '/groups'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS group_leader_promoted_notification ON action_group_participants;
CREATE TRIGGER group_leader_promoted_notification
  AFTER UPDATE OF role ON action_group_participants
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION notify_group_leader_promoted();

COMMENT ON FUNCTION notify_group_leader_promoted IS 
  'Notifica usuário quando promovido a líder de grupo';

-- ============================================================================
-- PASSO 7: TRIGGER PARA MENTORIA - SOLICITAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_mentorship_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentee_name text;
  topic_info text;
BEGIN
  -- Buscar nome do mentee
  SELECT name INTO mentee_name
  FROM profiles
  WHERE id = NEW.mentee_id;
  
  -- Verificar se tem campo topic (pode não existir em todas versões)
  BEGIN
    EXECUTE 'SELECT topic FROM mentorship_requests WHERE id = $1' INTO topic_info USING NEW.id;
  EXCEPTION WHEN undefined_column THEN
    topic_info := NULL;
  END;
  
  -- Notificar mentor
  PERFORM create_notification_if_enabled(
    NEW.mentor_id,
    '🎓 Nova Solicitação de Mentoria',
    format('%s solicitou mentoria%s', 
           COALESCE(mentee_name, 'Um colaborador'),
           CASE WHEN topic_info IS NOT NULL AND topic_info != '' 
                THEN '. Tópico: ' || topic_info 
                ELSE '' 
           END),
    'info',
    'mentorship_request',
    NEW.id::text,
    '/mentorship'
  );
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS mentorship_request_notification ON mentorship_requests;
CREATE TRIGGER mentorship_request_notification
  AFTER INSERT ON mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_request();

COMMENT ON FUNCTION notify_mentorship_request IS 
  'Notifica mentor quando recebe solicitação de mentoria';

-- ============================================================================
-- PASSO 8: TRIGGER PARA MENTORIA - ACEITA
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_mentorship_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentor_name text;
BEGIN
  -- Só notifica se mudou para ativo
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Buscar nome do mentor
    SELECT name INTO mentor_name
    FROM profiles
    WHERE id = NEW.mentor_id;
    
    -- Notificar mentee
    PERFORM create_notification_if_enabled(
      NEW.mentee_id,
      '✅ Mentoria Aceita!',
      format('%s aceitou sua solicitação de mentoria', COALESCE(mentor_name, 'O mentor')),
      'success',
      'mentorship_accepted',
      NEW.id::text,
      '/mentorship'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS mentorship_accepted_notification ON mentorships;
CREATE TRIGGER mentorship_accepted_notification
  AFTER UPDATE OF status ON mentorships
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_mentorship_accepted();

COMMENT ON FUNCTION notify_mentorship_accepted IS 
  'Notifica mentee quando mentoria é aceita';

-- ============================================================================
-- PASSO 9: TRIGGER PARA MENTORIA - SESSÃO AGENDADA
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_mentorship_session_scheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentorship_record record;
  session_datetime timestamptz;
BEGIN
  -- Buscar dados da mentoria
  SELECT 
    m.mentor_id,
    m.mentee_id,
    pm.name as mentor_name,
    pe.name as mentee_name
  INTO mentorship_record
  FROM mentorships m
  JOIN profiles pm ON pm.id = m.mentor_id
  JOIN profiles pe ON pe.id = m.mentee_id
  WHERE m.id = NEW.mentorship_id;
  
  -- Determinar data da sessão (usar scheduled_start se existir, senão session_date)
  BEGIN
    session_datetime := COALESCE(NEW.scheduled_start, NEW.session_date);
  EXCEPTION WHEN undefined_column THEN
    session_datetime := NEW.session_date;
  END;
  
  -- Só notificar se encontrou a mentoria e tem data
  IF mentorship_record.mentor_id IS NOT NULL AND session_datetime IS NOT NULL THEN
    -- Notificar mentor
    PERFORM create_notification_if_enabled(
      mentorship_record.mentor_id,
      '📅 Sessão de Mentoria Agendada',
      format('Sessão agendada com %s para %s às %s', 
             COALESCE(mentorship_record.mentee_name, 'seu mentee'),
             to_char(session_datetime::date, 'DD/MM/YYYY'),
             to_char(session_datetime::time, 'HH24:MI')),
      'info',
      'mentorship_scheduled',
      NEW.id::text,
      '/mentorship'
    );
    
    -- Notificar mentee
    PERFORM create_notification_if_enabled(
      mentorship_record.mentee_id,
      '📅 Sessão de Mentoria Confirmada',
      format('Sua sessão com %s foi confirmada para %s às %s', 
             COALESCE(mentorship_record.mentor_name, 'seu mentor'),
             to_char(session_datetime::date, 'DD/MM/YYYY'),
             to_char(session_datetime::time, 'HH24:MI')),
      'success',
      'mentorship_scheduled',
      NEW.id::text,
      '/mentorship'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente e criar novo
DROP TRIGGER IF EXISTS mentorship_session_scheduled_notification ON mentorship_sessions;
CREATE TRIGGER mentorship_session_scheduled_notification
  AFTER INSERT ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_session_scheduled();

COMMENT ON FUNCTION notify_mentorship_session_scheduled IS 
  'Notifica mentor e mentee quando sessão é agendada';

-- ============================================================================
-- PASSO 10: ATUALIZAR FUNÇÃO DE LEMBRETES DE PRAZO (MELHORADA)
-- ============================================================================

CREATE OR REPLACE FUNCTION send_deadline_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reminder_count integer := 0;
  pdi_record record;
  task_record record;
  days_until integer;
BEGIN
  -- Lembretes de PDIs com prazo em 7, 3 ou 1 dia
  FOR pdi_record IN
    SELECT p.id, p.profile_id, p.title, p.deadline
    FROM pdis p
    WHERE p.status IN ('pending', 'in-progress', 'completed')
    AND p.deadline::date IN (
      CURRENT_DATE + interval '7 days',
      CURRENT_DATE + interval '3 days',
      CURRENT_DATE + interval '1 day'
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.profile_id = p.profile_id
      AND n.category = 'deadline_reminder'
      AND n.related_id = p.id::text
      AND n.created_at::date = CURRENT_DATE
    )
  LOOP
    days_until := pdi_record.deadline::date - CURRENT_DATE;
    
    PERFORM create_notification_if_enabled(
      pdi_record.profile_id,
      '⏰ Lembrete de Prazo - PDI',
      format('Seu PDI "%s" vence em %s dia(s)', 
             pdi_record.title,
             days_until),
      CASE 
        WHEN days_until <= 1 THEN 'warning'
        ELSE 'info'
      END,
      'deadline_reminder',
      pdi_record.id::text,
      '/pdi'
    );
    
    reminder_count := reminder_count + 1;
  END LOOP;
  
  -- Lembretes de tarefas com prazo em 3 ou 1 dia
  FOR task_record IN
    SELECT t.id, t.assignee_id, t.title, t.deadline, t.group_id
    FROM tasks t
    WHERE t.status IN ('todo', 'in-progress')
    AND t.deadline::date IN (
      CURRENT_DATE + interval '3 days',
      CURRENT_DATE + interval '1 day'
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.profile_id = t.assignee_id
      AND n.category = 'deadline_reminder'
      AND n.related_id = t.id::text
      AND n.created_at::date = CURRENT_DATE
    )
  LOOP
    days_until := task_record.deadline::date - CURRENT_DATE;
    
    PERFORM create_notification_if_enabled(
      task_record.assignee_id,
      '⏰ Lembrete de Prazo - Tarefa',
      format('Sua tarefa "%s" vence em %s dia(s)', 
             task_record.title,
             days_until),
      CASE 
        WHEN days_until <= 1 THEN 'warning'
        ELSE 'info'
      END,
      'deadline_reminder',
      task_record.id::text,
      CASE 
        WHEN task_record.group_id IS NOT NULL THEN '/groups'
        ELSE '/pdi'
      END
    );
    
    reminder_count := reminder_count + 1;
  END LOOP;
  
  RETURN reminder_count;
END;
$$;

COMMENT ON FUNCTION send_deadline_reminders IS 
  'Envia lembretes de prazo para PDIs e tarefas. Executar diariamente via cron.';

-- ============================================================================
-- PASSO 11: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para busca de notificações por usuário e categoria
CREATE INDEX IF NOT EXISTS idx_notifications_profile_category 
  ON notifications(profile_id, category);

-- Índice para busca de notificações por related_id (evitar duplicatas)
CREATE INDEX IF NOT EXISTS idx_notifications_related_id 
  ON notifications(related_id) 
  WHERE related_id IS NOT NULL;

-- Índice para notificações não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_profile_unread 
  ON notifications(profile_id, read) 
  WHERE read = false;

-- Índice para cleanup por data
CREATE INDEX IF NOT EXISTS idx_notifications_created_at_read 
  ON notifications(created_at, read);

-- ============================================================================
-- PASSO 12: GRANTS E PERMISSÕES
-- ============================================================================

-- Garantir que funções sejam acessíveis
GRANT EXECUTE ON FUNCTION create_notification_if_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION send_deadline_reminders TO authenticated;

-- ============================================================================
-- DOCUMENTAÇÃO FINAL
-- ============================================================================

COMMENT ON TRIGGER pdi_status_notification ON pdis IS 
  'Dispara notificação quando status do PDI muda para validated ou in-progress';

COMMENT ON TRIGGER task_assigned_notification ON tasks IS 
  'Dispara notificação quando nova tarefa é criada';

COMMENT ON TRIGGER group_participant_added_notification ON action_group_participants IS 
  'Dispara notificação quando usuário é adicionado a grupo';

COMMENT ON TRIGGER group_leader_promoted_notification ON action_group_participants IS 
  'Dispara notificação quando usuário é promovido a líder';

COMMENT ON TRIGGER mentorship_request_notification ON mentorship_requests IS
  'Dispara notificação quando mentoria é solicitada';

COMMENT ON TRIGGER mentorship_accepted_notification ON mentorships IS 
  'Dispara notificação quando mentoria é aceita';

COMMENT ON TRIGGER mentorship_session_scheduled_notification ON mentorship_sessions IS 
  'Dispara notificação quando sessão de mentoria é agendada';

/*
  ============================================================================
  INSTRUÇÕES DE USO
  ============================================================================
  
  1. LEMBRETES DE PRAZO:
     Para executar lembretes automaticamente, configure um cron job no Supabase:
     
     - Dashboard → Database → Cron Jobs
     - Nome: daily_deadline_reminders
     - Schedule: 0 9 * * * (todos os dias às 9h)
     - Statement: SELECT send_deadline_reminders();
  
  2. VERIFICAÇÃO PÓS-INSTALAÇÃO:
     
     -- Verificar funções criadas
     SELECT proname FROM pg_proc 
     WHERE proname IN (
       'create_notification_if_enabled',
       'notify_pdi_status_change',
       'notify_task_assigned',
       'notify_group_participant_added',
       'notify_group_leader_promoted',
       'notify_mentorship_request',
       'notify_mentorship_accepted',
       'notify_mentorship_session_scheduled',
       'send_deadline_reminders'
     );
     
     -- Verificar triggers criados
     SELECT tgname, tgrelid::regclass as table_name
     FROM pg_trigger 
     WHERE tgname LIKE '%notification%';
  
  3. TESTE MANUAL:
     
     -- Testar criação de notificação
     SELECT create_notification_if_enabled(
       'SEU-USER-ID-AQUI',
       '🧪 Teste de Notificação',
       'Esta é uma notificação de teste',
       'info',
       'general',
       NULL,
       '/profile'
     );
     
     -- Testar lembretes de prazo
     SELECT send_deadline_reminders();
*/
