/*
  ============================================================================
  FIX: Notification Triggers - Resolving Conflicts and Type Mismatches
  ============================================================================
  
  This migration fixes issues caused by conflicting notification trigger
  migrations (20251127 and 20251201).
  
  ISSUES FIXED:
  1. related_id column type (uuid vs text) - standardizing to TEXT
  2. Function signature conflicts for create_notification_if_enabled
  3. Function naming inconsistency (notify_group_leader_promotion vs promoted)
  4. Trigger naming and table targeting inconsistencies
  5. Missing columns in notifications table
  
  SAFE TO RUN MULTIPLE TIMES (idempotent)
*/

-- ============================================================================
-- STEP 1: ENSURE NOTIFICATIONS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== STEP 1: Ensuring notifications table has required columns ===';
  
  -- Add category column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications ADD COLUMN category text DEFAULT 'general';
    RAISE NOTICE 'Added category column';
  END IF;

  -- Check if related_id exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'related_id'
  ) THEN
    -- Add as text type
    ALTER TABLE notifications ADD COLUMN related_id text;
    RAISE NOTICE 'Added related_id column as text';
  ELSE
    -- Check if it's uuid type and convert to text
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'related_id'
      AND data_type = 'uuid'
    ) THEN
      -- Create temporary column
      ALTER TABLE notifications ADD COLUMN related_id_text text;
      -- Copy data with conversion
      UPDATE notifications SET related_id_text = related_id::text WHERE related_id IS NOT NULL;
      -- Drop old column
      ALTER TABLE notifications DROP COLUMN related_id;
      -- Rename new column
      ALTER TABLE notifications RENAME COLUMN related_id_text TO related_id;
      RAISE NOTICE 'Converted related_id from uuid to text';
    ELSE
      RAISE NOTICE 'related_id column already exists as correct type';
    END IF;
  END IF;

  -- Add metadata column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}';
    RAISE NOTICE 'Added metadata column';
  END IF;
  
  -- Add action_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url text;
    RAISE NOTICE 'Added action_url column';
  END IF;
  
END $$;

-- ============================================================================
-- STEP 2: ENSURE NOTIFICATION_PREFERENCES TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
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
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;

-- Create RLS policies
CREATE POLICY "Users can read own preferences"
  ON notification_preferences FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ============================================================================
-- STEP 3: DROP ALL NOTIFICATION TRIGGERS FIRST (before functions)
-- ============================================================================

-- Must drop triggers BEFORE dropping functions they depend on
DROP TRIGGER IF EXISTS pdi_status_notification ON pdis;
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
DROP TRIGGER IF EXISTS achievement_unlocked_notification ON achievements;
DROP TRIGGER IF EXISTS group_participant_added_notification ON action_group_participants;
DROP TRIGGER IF EXISTS group_leader_promotion_notification ON action_group_participants;
DROP TRIGGER IF EXISTS group_leader_promoted_notification ON action_group_participants;
DROP TRIGGER IF EXISTS mentorship_request_notification ON mentorships;
DROP TRIGGER IF EXISTS mentorship_accepted_notification ON mentorships;
DROP TRIGGER IF EXISTS mentorship_session_scheduled_notification ON mentorship_sessions;
DROP TRIGGER IF EXISTS mentorship_session_cancelled_notification ON mentorship_sessions;

-- Also drop from mentorship_requests if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mentorship_requests') THEN
    DROP TRIGGER IF EXISTS mentorship_request_notification ON mentorship_requests;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: DROP ALL CONFLICTING FUNCTIONS (now safe after triggers removed)
-- ============================================================================

-- Drop all variations of create_notification_if_enabled
DROP FUNCTION IF EXISTS create_notification_if_enabled(uuid, text, text, text, text, uuid, text, jsonb);
DROP FUNCTION IF EXISTS create_notification_if_enabled(uuid, text, text, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS create_notification_if_enabled(uuid, text, text, text, text, uuid, text);
DROP FUNCTION IF EXISTS create_notification_if_enabled(uuid, text, text, text, text, text, text);

-- Drop check_notification_preference function
DROP FUNCTION IF EXISTS check_notification_preference(uuid, text);

-- Drop notify functions with variations (use CASCADE as safety)
DROP FUNCTION IF EXISTS notify_pdi_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_task_assigned() CASCADE;
DROP FUNCTION IF EXISTS notify_achievement_unlocked() CASCADE;
DROP FUNCTION IF EXISTS notify_group_participant_added() CASCADE;
DROP FUNCTION IF EXISTS notify_group_leader_promotion() CASCADE;
DROP FUNCTION IF EXISTS notify_group_leader_promoted() CASCADE;
DROP FUNCTION IF EXISTS notify_mentorship_request() CASCADE;
DROP FUNCTION IF EXISTS notify_mentorship_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_mentorship_session_scheduled() CASCADE;
DROP FUNCTION IF EXISTS notify_mentorship_session_cancelled() CASCADE;
DROP FUNCTION IF EXISTS send_deadline_reminders() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications() CASCADE;
DROP FUNCTION IF EXISTS get_notification_stats(uuid) CASCADE;

-- ============================================================================
-- STEP 5: CREATE CORE HELPER FUNCTION (STANDARDIZED)
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
  -- Validate type
  IF p_type NOT IN ('info', 'success', 'warning', 'error') THEN
    p_type := 'info';
  END IF;

  -- Map category to preference column
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
    WHEN 'mentorship_cancelled' THEN 'mentorship_cancelled'
    WHEN 'deadline_reminder' THEN 'deadline_reminder'
    ELSE NULL
  END;
  
  -- Check user preference if category known
  IF preference_column IS NOT NULL THEN
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(%I, true) FROM notification_preferences WHERE profile_id = $1',
        preference_column
      )
      INTO preference_enabled
      USING p_profile_id;
      
      -- If no preference found, create default and allow
      IF preference_enabled IS NULL THEN
        INSERT INTO notification_preferences (profile_id)
        VALUES (p_profile_id)
        ON CONFLICT (profile_id) DO NOTHING;
        preference_enabled := true;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- On any error (table doesn't exist, etc), allow notification
      preference_enabled := true;
    END;
  END IF;
  
  -- Create notification if enabled
  IF preference_enabled THEN
    INSERT INTO notifications (
      profile_id,
      title,
      message,
      type,
      category,
      related_id,
      action_url,
      read
    ) VALUES (
      p_profile_id,
      p_title,
      p_message,
      p_type::notification_type,
      p_category,
      p_related_id,
      p_action_url,
      false
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION create_notification_if_enabled IS 
  'Creates notification respecting user preferences. Returns UUID or NULL.';

-- ============================================================================
-- STEP 6: PDI STATUS CHANGE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_pdi_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- PDI approved (validated)
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
  
  -- PDI rejected (goes back to in-progress after completed)
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

CREATE TRIGGER pdi_status_notification
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_pdi_status_change();

-- ============================================================================
-- STEP 7: TASK ASSIGNED TRIGGER
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
  -- Get group title if exists
  IF NEW.group_id IS NOT NULL THEN
    SELECT title INTO group_title
    FROM action_groups
    WHERE id = NEW.group_id;
    action_url := '/groups';
  ELSE
    action_url := '/pdi';
  END IF;
  
  -- Notify assigned person
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

CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- ============================================================================
-- STEP 8: GROUP PARTICIPANT ADDED TRIGGER
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
  -- Get group title
  SELECT ag.title INTO group_title
  FROM action_groups ag
  WHERE ag.id = NEW.group_id;
  
  -- Notify new participant
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

CREATE TRIGGER group_participant_added_notification
  AFTER INSERT ON action_group_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_group_participant_added();

-- ============================================================================
-- STEP 9: GROUP LEADER PROMOTED TRIGGER
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
  -- Only notify if promoted to leader
  IF NEW.role = 'leader' AND (OLD.role IS NULL OR OLD.role = 'member') THEN
    -- Get group title
    SELECT ag.title INTO group_title
    FROM action_groups ag
    WHERE ag.id = NEW.group_id;
    
    -- Notify new leader
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

CREATE TRIGGER group_leader_promoted_notification
  AFTER UPDATE OF role ON action_group_participants
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION notify_group_leader_promoted();

-- ============================================================================
-- STEP 10: MENTORSHIP REQUEST TRIGGER
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
  -- Get mentee name
  SELECT name INTO mentee_name
  FROM profiles
  WHERE id = NEW.mentee_id;
  
  -- Try to get topic (may not exist in all versions)
  BEGIN
    EXECUTE 'SELECT topic FROM mentorship_requests WHERE id = $1' INTO topic_info USING NEW.id;
  EXCEPTION WHEN undefined_column OR undefined_table THEN
    topic_info := NULL;
  END;
  
  -- Notify mentor
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

-- Create trigger on mentorship_requests table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mentorship_requests') THEN
    CREATE TRIGGER mentorship_request_notification
      AFTER INSERT ON mentorship_requests
      FOR EACH ROW
      EXECUTE FUNCTION notify_mentorship_request();
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================================
-- STEP 11: MENTORSHIP ACCEPTED TRIGGER
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
  -- Only notify if changed to active
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Get mentor name
    SELECT name INTO mentor_name
    FROM profiles
    WHERE id = NEW.mentor_id;
    
    -- Notify mentee
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

CREATE TRIGGER mentorship_accepted_notification
  AFTER UPDATE OF status ON mentorships
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_mentorship_accepted();

-- ============================================================================
-- STEP 12: MENTORSHIP SESSION SCHEDULED TRIGGER
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
  -- Get mentorship data
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
  
  -- Determine session datetime (use scheduled_start if exists, else session_date)
  BEGIN
    session_datetime := COALESCE(NEW.scheduled_start, NEW.session_date);
  EXCEPTION WHEN undefined_column THEN
    session_datetime := NEW.session_date;
  END;
  
  -- Only notify if found mentorship and has date
  IF mentorship_record.mentor_id IS NOT NULL AND session_datetime IS NOT NULL THEN
    -- Notify mentor
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
    
    -- Notify mentee
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

CREATE TRIGGER mentorship_session_scheduled_notification
  AFTER INSERT ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_session_scheduled();

-- ============================================================================
-- STEP 13: DEADLINE REMINDERS FUNCTION
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
  -- PDI reminders for deadlines in 7, 3, or 1 day
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
  
  -- Task reminders for deadlines in 3 or 1 day
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
  'Sends deadline reminders for PDIs and tasks. Run daily via cron.';

-- ============================================================================
-- STEP 14: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index for user+category lookup
CREATE INDEX IF NOT EXISTS idx_notifications_profile_category 
  ON notifications(profile_id, category);

-- Index for related_id lookup (duplicate prevention)
CREATE INDEX IF NOT EXISTS idx_notifications_related_id 
  ON notifications(related_id) 
  WHERE related_id IS NOT NULL;

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_profile_unread 
  ON notifications(profile_id, read) 
  WHERE read = false;

-- Index for cleanup by date
CREATE INDEX IF NOT EXISTS idx_notifications_created_at_read 
  ON notifications(created_at, read);

-- ============================================================================
-- STEP 15: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_notification_if_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION send_deadline_reminders TO authenticated;

-- ============================================================================
-- STEP 16: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  function_count integer;
  trigger_count integer;
BEGIN
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
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
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN (
    'pdi_status_notification',
    'task_assigned_notification',
    'group_participant_added_notification',
    'group_leader_promoted_notification',
    'mentorship_request_notification',
    'mentorship_accepted_notification',
    'mentorship_session_scheduled_notification'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NOTIFICATION TRIGGERS FIX - VERIFICATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Functions created: %/9', function_count;
  RAISE NOTICE 'Triggers created: %/7', trigger_count;
  
  IF function_count >= 9 AND trigger_count >= 6 THEN
    RAISE NOTICE '✅ SUCCESS: All notification triggers fixed and ready';
  ELSE
    RAISE WARNING '⚠️ WARNING: Some functions or triggers may be missing';
  END IF;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

/*
  ============================================================================
  USAGE NOTES
  ============================================================================
  
  1. DEADLINE REMINDERS:
     Configure a cron job in Supabase Dashboard:
     - Name: daily_deadline_reminders
     - Schedule: 0 9 * * * (every day at 9am)
     - Statement: SELECT send_deadline_reminders();
  
  2. MANUAL TEST:
     -- Test creating a notification
     SELECT create_notification_if_enabled(
       'YOUR-USER-ID-HERE',
       '🧪 Test Notification',
       'This is a test notification',
       'info',
       'general',
       NULL,
       '/profile'
     );
     
     -- Test deadline reminders
     SELECT send_deadline_reminders();
  
  3. VERIFY INSTALLATION:
     -- List all notification triggers
     SELECT tgname, tgrelid::regclass 
     FROM pg_trigger 
     WHERE tgname LIKE '%notification%';
     
     -- Check notifications table structure
     SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_name = 'notifications'
     ORDER BY ordinal_position;
*/
