-- Migration: Restore Mentorship RPC Functions
-- Descrição: Restaura funções schedule_mentorship_session e complete_mentorship_session
--            que estavam em migrations descartadas
-- Prioridade: CRÍTICA - Sistema de mentoria quebrado sem estas funções
-- Data: 2025-10-29
-- Origem: .bolt/supabase_discarded_migrations/20250930150000_create_rpc_functions.sql

-- ============================================
-- 0. ADD MISSING COLUMNS TO mentorship_sessions
-- ============================================

-- Add columns needed by the RPC functions if they don't exist
DO $$ 
BEGIN
  -- Add scheduled_start column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'scheduled_start'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN scheduled_start timestamptz;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN status text DEFAULT 'scheduled' 
      CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'));
  END IF;

  -- Add meeting_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'meeting_link'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN meeting_link text;
  END IF;

  -- Add session_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'session_notes'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN session_notes text;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mentorship_sessions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE mentorship_sessions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS mentorship_sessions_updated_at ON mentorship_sessions;
CREATE TRIGGER mentorship_sessions_updated_at
  BEFORE UPDATE ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- 1. DROP se existir (garantir idempotência)
-- ============================================

DROP FUNCTION IF EXISTS schedule_mentorship_session(uuid, timestamptz, integer, text);
DROP FUNCTION IF EXISTS complete_mentorship_session(uuid, text);

-- ============================================
-- 2. CREATE FUNCTION: schedule_mentorship_session
-- ============================================

-- Function: Schedule Mentorship Session
CREATE OR REPLACE FUNCTION schedule_mentorship_session(
  mentorship_id_param uuid,
  scheduled_start_param timestamptz,
  duration_minutes_param int,
  meeting_link_param text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_mentorship record;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get mentorship details
  SELECT * INTO v_mentorship
  FROM mentorships
  WHERE id = mentorship_id_param
  AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship not found or not active';
  END IF;

  -- Verify user is mentor or mentee
  IF v_mentorship.mentor_id != auth.uid() AND v_mentorship.mentee_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized to schedule session for this mentorship';
  END IF;

  -- Create session
  INSERT INTO mentorship_sessions (
    mentorship_id,
    scheduled_start,
    duration_minutes,
    meeting_link,
    status
  ) VALUES (
    mentorship_id_param,
    scheduled_start_param,
    duration_minutes_param,
    meeting_link_param,
    'scheduled'
  ) RETURNING id INTO v_session_id;

  -- Create notifications would be handled by triggers or application layer

  RETURN v_session_id::text;
END;
$$;

-- ============================================
-- 3. CREATE FUNCTION: complete_mentorship_session
-- ============================================

-- Function: Complete Mentorship Session
CREATE OR REPLACE FUNCTION complete_mentorship_session(
  session_id uuid,
  session_notes_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session record;
  v_mentorship record;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get session details
  SELECT ms.*, m.mentor_id, m.mentee_id
  INTO v_session
  FROM mentorship_sessions ms
  JOIN mentorships m ON ms.mentorship_id = m.id
  WHERE ms.id = session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Verify user is mentor or mentee
  IF v_session.mentor_id != auth.uid() AND v_session.mentee_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized to complete this session';
  END IF;

  -- Update session
  UPDATE mentorship_sessions
  SET
    status = 'completed',
    session_notes = COALESCE(session_notes_param, session_notes),
    updated_at = now()
  WHERE id = session_id;

  -- Trigger achievement check for both mentor and mentee
  PERFORM check_and_unlock_achievements(v_session.mentor_id, 'mentorship_session');
  PERFORM check_and_unlock_achievements(v_session.mentee_id, 'mentorship_session');
END;
$$;

-- ============================================
-- 4. GRANT EXECUTE
-- ============================================

GRANT EXECUTE ON FUNCTION schedule_mentorship_session(uuid, timestamptz, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_mentorship_session(uuid, text) TO authenticated;

-- ============================================
-- 5. COMMENT
-- ============================================

COMMENT ON FUNCTION schedule_mentorship_session IS 
'Agenda uma sessão de mentoria com validações de conflito e autorização';

COMMENT ON FUNCTION complete_mentorship_session IS 
'Marca sessão como completa, registra notas e desbloqueia conquistas de gamificação';
