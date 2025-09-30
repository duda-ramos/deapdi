/*
  # Sistema Completo de Notificações Funcionais

  1. Novas Tabelas
    - `notification_preferences` - Preferências de notificação por usuário
    - Campos adicionais em `notifications` para melhor categorização

  2. Triggers Automáticos
    - PDI aprovado/rejeitado
    - Nova tarefa atribuída
    - Conquista desbloqueada
    - Mentoria agendada

  3. Funções SQL
    - Criação automática de notificações
    - Verificação de preferências
    - Cleanup de notificações antigas

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas granulares por tipo de usuário
*/

-- Tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  pdi_approved boolean DEFAULT true,
  pdi_rejected boolean DEFAULT true,
  task_assigned boolean DEFAULT true,
  achievement_unlocked boolean DEFAULT true,
  mentorship_scheduled boolean DEFAULT true,
  mentorship_cancelled boolean DEFAULT true,
  group_invitation boolean DEFAULT true,
  deadline_reminder boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_preferences
CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (profile_id = uid());

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (profile_id = uid())
  WITH CHECK (profile_id = uid());

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = uid());

-- Adicionar campos à tabela notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications ADD COLUMN category text DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'related_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN related_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Função para verificar preferências de notificação
CREATE OR REPLACE FUNCTION check_notification_preference(
  p_profile_id uuid,
  p_notification_type text
) RETURNS boolean AS $$
DECLARE
  preference_value boolean;
BEGIN
  -- Buscar preferência específica
  EXECUTE format('SELECT %I FROM notification_preferences WHERE profile_id = $1', p_notification_type)
  INTO preference_value
  USING p_profile_id;
  
  -- Se não encontrou preferência, criar com padrões e retornar true
  IF preference_value IS NULL THEN
    INSERT INTO notification_preferences (profile_id)
    VALUES (p_profile_id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN true;
  END IF;
  
  RETURN COALESCE(preference_value, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação com verificação de preferências
CREATE OR REPLACE FUNCTION create_notification_if_enabled(
  p_profile_id uuid,
  p_title text,
  p_message text,
  p_type notification_type DEFAULT 'info',
  p_category text DEFAULT 'general',
  p_related_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  preference_enabled boolean;
BEGIN
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
      metadata
    ) VALUES (
      p_profile_id,
      p_title,
      p_message,
      p_type,
      p_category,
      p_related_id,
      p_action_url,
      p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
      '/pdi'
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
      '/pdi'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pdi_status_notification ON pdis;
CREATE TRIGGER pdi_status_notification
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION notify_pdi_status_change();

-- Trigger para nova tarefa atribuída
CREATE OR REPLACE FUNCTION notify_task_assigned() RETURNS trigger AS $$
BEGIN
  -- Notificar quando tarefa é criada
  PERFORM create_notification_if_enabled(
    NEW.assignee_id,
    '📋 Nova Tarefa Atribuída',
    format('Você recebeu uma nova tarefa: "%s". Prazo: %s', 
           NEW.title, 
           to_char(NEW.deadline::date, 'DD/MM/YYYY')),
    'info',
    'task_assigned',
    NEW.id,
    '/groups'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Trigger para conquista desbloqueada
CREATE OR REPLACE FUNCTION notify_achievement_unlocked() RETURNS trigger AS $$
BEGIN
  PERFORM create_notification_if_enabled(
    NEW.profile_id,
    '🏆 Nova Conquista Desbloqueada!',
    format('Parabéns! Você desbloqueou "%s" e ganhou %s pontos!', 
           NEW.title, 
           NEW.points),
    'success',
    'achievement_unlocked',
    NEW.id,
    '/achievements'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS achievement_unlocked_notification ON achievements;
CREATE TRIGGER achievement_unlocked_notification
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_unlocked();

-- Trigger para mentoria agendada
CREATE OR REPLACE FUNCTION notify_mentorship_scheduled() RETURNS trigger AS $$
DECLARE
  mentorship_record record;
BEGIN
  -- Buscar dados da mentoria
  SELECT m.mentor_id, m.mentee_id, mp.name as mentor_name, me.name as mentee_name
  INTO mentorship_record
  FROM mentorships m
  JOIN profiles mp ON mp.id = m.mentor_id
  JOIN profiles me ON me.id = m.mentee_id
  WHERE m.id = NEW.mentorship_id;
  
  -- Notificar mentor
  PERFORM create_notification_if_enabled(
    mentorship_record.mentor_id,
    '📅 Sessão de Mentoria Agendada',
    format('Sessão agendada com %s para %s às %s', 
           mentorship_record.mentee_name,
           to_char(NEW.scheduled_start::date, 'DD/MM/YYYY'),
           to_char(NEW.scheduled_start::time, 'HH24:MI')),
    'info',
    'mentorship_scheduled',
    NEW.id,
    '/mentorship'
  );
  
  -- Notificar mentee
  PERFORM create_notification_if_enabled(
    mentorship_record.mentee_id,
    '📅 Sessão de Mentoria Confirmada',
    format('Sua sessão com %s foi confirmada para %s às %s', 
           mentorship_record.mentor_name,
           to_char(NEW.scheduled_start::date, 'DD/MM/YYYY'),
           to_char(NEW.scheduled_start::time, 'HH24:MI')),
    'success',
    'mentorship_scheduled',
    NEW.id,
    '/mentorship'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS mentorship_scheduled_notification ON mentorship_sessions;
CREATE TRIGGER mentorship_scheduled_notification
  AFTER INSERT ON mentorship_sessions
  FOR EACH ROW
  WHEN (NEW.scheduled_start IS NOT NULL)
  EXECUTE FUNCTION notify_mentorship_scheduled();

-- Função para limpar notificações antigas (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < now() - interval '30 days'
  AND read = true;
  
  -- Manter notificações não lidas por mais tempo
  DELETE FROM notifications 
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de notificações
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
    COUNT(*) FILTER (WHERE read = false) as unread_notifications,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as notifications_today,
    (
      SELECT type::text 
      FROM notifications 
      WHERE profile_id = p_profile_id 
      GROUP BY type 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as most_common_type
  FROM notifications
  WHERE profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at em notification_preferences
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS notifications_profile_id_category_idx ON notifications(profile_id, category);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_read_created_at_idx ON notifications(read, created_at);
CREATE INDEX IF NOT EXISTS notification_preferences_profile_id_idx ON notification_preferences(profile_id);