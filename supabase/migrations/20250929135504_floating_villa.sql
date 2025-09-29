/*
  # Create notification system functions

  1. Functions
    - `cleanup_old_notifications` - Clean up old read notifications
    - `send_deadline_reminders` - Send automatic deadline reminders
    - `create_system_notification` - Helper for system notifications

  2. Scheduled Functions
    - Daily cleanup of old notifications
    - Daily deadline reminder checks

  3. Notification Automation
    - Automatic deadline reminders for PDIs and tasks
*/

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE read = true
  AND created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete unread notifications older than 90 days (except critical ones)
  DELETE FROM notifications
  WHERE read = false
  AND created_at < now() - interval '90 days'
  AND type != 'error'
  AND category NOT IN ('mental_health_alert', 'emergency');
  
  RETURN deleted_count;
END;
$$;

-- Function to send deadline reminders
CREATE OR REPLACE FUNCTION send_deadline_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_count integer := 0;
  pdi_record record;
  task_record record;
BEGIN
  -- Send PDI deadline reminders (7 days, 3 days, 1 day before)
  FOR pdi_record IN
    SELECT p.*, pr.name as profile_name
    FROM pdis p
    JOIN profiles pr ON pr.id = p.profile_id
    WHERE p.status IN ('pending', 'in-progress')
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
    INSERT INTO notifications (profile_id, title, message, type, category, related_id, action_url)
    VALUES (
      pdi_record.profile_id,
      '⏰ Lembrete de Prazo - PDI',
      'Seu PDI "' || pdi_record.title || '" vence em ' || 
      (pdi_record.deadline::date - CURRENT_DATE) || ' dia(s)',
      CASE 
        WHEN pdi_record.deadline::date = CURRENT_DATE + interval '1 day' THEN 'warning'
        ELSE 'info'
      END,
      'deadline_reminder',
      pdi_record.id::text,
      '/pdi'
    );
    
    reminder_count := reminder_count + 1;
  END LOOP;
  
  -- Send task deadline reminders
  FOR task_record IN
    SELECT t.*, p.name as assignee_name, ag.title as group_title
    FROM tasks t
    JOIN profiles p ON p.id = t.assignee_id
    LEFT JOIN action_groups ag ON ag.id = t.group_id
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
    INSERT INTO notifications (profile_id, title, message, type, category, related_id, action_url)
    VALUES (
      task_record.assignee_id,
      '⏰ Lembrete de Prazo - Tarefa',
      'Sua tarefa "' || task_record.title || '" vence em ' || 
      (task_record.deadline::date - CURRENT_DATE) || ' dia(s)',
      CASE 
        WHEN task_record.deadline::date = CURRENT_DATE + interval '1 day' THEN 'warning'
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

-- Function to create system notifications
CREATE OR REPLACE FUNCTION create_system_notification(
  p_profile_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_category text DEFAULT 'system',
  p_related_id text DEFAULT NULL,
  p_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    profile_id, title, message, type, category, related_id, action_url
  ) VALUES (
    p_profile_id, p_title, p_message, p_type::notification_type, 
    p_category, p_related_id, p_action_url
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;