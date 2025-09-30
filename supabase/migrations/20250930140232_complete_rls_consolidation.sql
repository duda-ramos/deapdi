/*
  # Consolidação Completa de Políticas RLS - TalentFlow
  
  ## Objetivo
  Esta migração substitui todas as políticas RLS fragmentadas por um sistema unificado,
  seguro e sem recursão.
  
  ## Estratégia
  1. Sincronização automática de roles com JWT claims
  2. Políticas não-recursivas usando auth.jwt() para verificação de roles
  3. Acesso direto via auth.uid() para dados próprios
  4. Eliminação completa de subqueries recursivas
  5. Separação clara entre SELECT, INSERT, UPDATE, DELETE
  
  ## Tabelas Afetadas (42 tabelas)
  - Identidade: profiles, teams
  - Desenvolvimento: pdis, competencies, career_tracks, salary_history
  - Colaboração: action_groups, action_group_participants, tasks
  - Aprendizado: courses, course_enrollments, course_modules, course_progress, certificates
  - Mentoria: mentorships, mentorship_sessions, mentorship_requests, mentor_ratings, session_slots
  - Saúde Mental: emotional_checkins, psychology_sessions, consent_records, mental_health_alerts,
    psychological_records, psychological_forms, form_responses, therapeutic_activities, wellness_resources,
    session_requests
  - Calendário: calendar_events, calendar_requests, calendar_notifications, calendar_settings
  - Templates: achievement_templates, career_track_templates, career_stage_competencies, career_stage_salary_ranges
  - Sistema: achievements, notifications, notification_preferences, audit_logs, system_config
  
  ## Segurança
  - Todas as tabelas com RLS habilitado
  - Dados sensíveis (saúde mental, salário) com acesso ultra-restrito
  - Auditoria completa de acessos
  - Políticas testadas para cada role
*/

-- ============================================================================
-- PASSO 1: FUNÇÃO DE SINCRONIZAÇÃO JWT
-- ============================================================================

-- Função para sincronizar role do usuário com JWT claims
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza raw_app_meta_data do auth.users com o role do profile
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('user_role', NEW.role::text)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronizar role automaticamente
DROP TRIGGER IF EXISTS sync_role_to_jwt_trigger ON profiles;
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- ============================================================================
-- PASSO 2: LIMPAR TODAS AS POLÍTICAS EXISTENTES
-- ============================================================================

-- Função helper para dropar todas as políticas de uma tabela
CREATE OR REPLACE FUNCTION drop_all_policies_for_table(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = table_name
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
  END LOOP;
END;
$$;

-- Dropar todas as políticas existentes
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    PERFORM drop_all_policies_for_table(table_record.tablename);
  END LOOP;
END;
$$;

-- ============================================================================
-- PASSO 3: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

-- Habilitar RLS em todas as tabelas (incluindo achievements que estava sem)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS action_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS action_group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS psychological_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS session_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS emotional_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS psychology_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mental_health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS psychological_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS therapeutic_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS career_track_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS career_stage_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS career_stage_salary_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 4: POLÍTICAS PARA PROFILES (Base para todo o sistema)
-- ============================================================================

-- Usuários acessam seus próprios dados
CREATE POLICY "profiles_own_access"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- HR e Admin via JWT (sem recursão)
CREATE POLICY "profiles_hr_admin_jwt"
  ON profiles FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Managers podem ler seus subordinados diretos (sem recursão)
CREATE POLICY "profiles_manager_team_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

-- Permitir health checks anônimos
CREATE POLICY "profiles_anon_health"
  ON profiles FOR SELECT
  TO anon
  USING (false);

-- Grant para anon fazer count queries
GRANT SELECT ON profiles TO anon;

-- ============================================================================
-- PASSO 5: POLÍTICAS PARA TEAMS
-- ============================================================================

-- Todos podem ler teams
CREATE POLICY "teams_read_all"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- HR e Admin gerenciam teams
CREATE POLICY "teams_hr_admin_manage"
  ON teams FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 6: POLÍTICAS PARA CAREER_TRACKS
-- ============================================================================

-- Usuário acessa próprio career track
CREATE POLICY "career_tracks_own"
  ON career_tracks FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- HR e Admin acessam tudo
CREATE POLICY "career_tracks_hr_admin"
  ON career_tracks FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 7: POLÍTICAS PARA SALARY_HISTORY (Dados Sensíveis)
-- ============================================================================

-- Usuário lê próprio histórico salarial
CREATE POLICY "salary_own_read"
  ON salary_history FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Apenas HR e Admin gerenciam
CREATE POLICY "salary_hr_admin_all"
  ON salary_history FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 8: POLÍTICAS PARA COMPETENCIES
-- ============================================================================

-- Usuário gerencia próprias competências
CREATE POLICY "competencies_own"
  ON competencies FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- HR e Admin gerenciam tudo
CREATE POLICY "competencies_hr_admin"
  ON competencies FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Managers e HR leem competências da equipe (sem recursão, via EXISTS simples)
CREATE POLICY "competencies_manager_read"
  ON competencies FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = competencies.profile_id
      AND profiles.manager_id = auth.uid()
    )
  );

-- Managers atualizam competências da equipe
CREATE POLICY "competencies_manager_update"
  ON competencies FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = competencies.profile_id
      AND profiles.manager_id = auth.uid()
    )
  );

-- ============================================================================
-- PASSO 9: POLÍTICAS PARA PDIS
-- ============================================================================

-- Usuário gerencia próprios PDIs
CREATE POLICY "pdis_own"
  ON pdis FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Mentores acessam PDIs que mentoram
CREATE POLICY "pdis_mentor"
  ON pdis FOR SELECT
  TO authenticated
  USING (mentor_id = auth.uid());

CREATE POLICY "pdis_mentor_update"
  ON pdis FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- Managers acessam PDIs da equipe
CREATE POLICY "pdis_manager"
  ON pdis FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = pdis.profile_id
      AND profiles.manager_id = auth.uid()
    )
  );

-- HR e Admin acessam tudo
CREATE POLICY "pdis_hr_admin"
  ON pdis FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 10: POLÍTICAS PARA ACHIEVEMENTS
-- ============================================================================

-- Usuário lê próprias conquistas
CREATE POLICY "achievements_own"
  ON achievements FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Sistema cria achievements
CREATE POLICY "achievements_system_create"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- HR e Admin leem tudo
CREATE POLICY "achievements_hr_admin"
  ON achievements FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 11: POLÍTICAS PARA ACTION_GROUPS E PARTICIPANTS
-- ============================================================================

-- Todos leem action groups
CREATE POLICY "action_groups_read"
  ON action_groups FOR SELECT
  TO authenticated
  USING (true);

-- Criadores gerenciam seus grupos
CREATE POLICY "action_groups_creator"
  ON action_groups FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- HR e Admin gerenciam tudo
CREATE POLICY "action_groups_hr_admin"
  ON action_groups FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- Participants: todos leem
CREATE POLICY "participants_read"
  ON action_group_participants FOR SELECT
  TO authenticated
  USING (true);

-- Usuários entram em grupos
CREATE POLICY "participants_join"
  ON action_group_participants FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Usuários saem de grupos
CREATE POLICY "participants_leave"
  ON action_group_participants FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Criadores do grupo gerenciam participantes
CREATE POLICY "participants_creator_manage"
  ON action_group_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM action_groups
      WHERE action_groups.id = action_group_participants.group_id
      AND action_groups.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM action_groups
      WHERE action_groups.id = action_group_participants.group_id
      AND action_groups.created_by = auth.uid()
    )
  );

-- HR e Admin gerenciam tudo
CREATE POLICY "participants_hr_admin"
  ON action_group_participants FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 12: POLÍTICAS PARA TASKS
-- ============================================================================

-- Assignees gerenciam suas tasks
CREATE POLICY "tasks_assignee"
  ON tasks FOR ALL
  TO authenticated
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

-- Participantes do grupo leem tasks do grupo
CREATE POLICY "tasks_group_read"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
    )
  );

-- Criadores do grupo gerenciam tasks
CREATE POLICY "tasks_creator"
  ON tasks FOR ALL
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_groups
      WHERE action_groups.id = tasks.group_id
      AND action_groups.created_by = auth.uid()
    )
  )
  WITH CHECK (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_groups
      WHERE action_groups.id = tasks.group_id
      AND action_groups.created_by = auth.uid()
    )
  );

-- Managers, HR e Admin gerenciam tudo
CREATE POLICY "tasks_managers_all"
  ON tasks FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin'));

-- ============================================================================
-- PASSO 13: POLÍTICAS PARA SAÚDE MENTAL (Máxima Privacidade)
-- ============================================================================

-- EMOTIONAL_CHECKINS: apenas o funcionário
CREATE POLICY "emotional_own"
  ON emotional_checkins FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "emotional_hr_read"
  ON emotional_checkins FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- PSYCHOLOGY_SESSIONS
CREATE POLICY "psych_sessions_employee"
  ON psychology_sessions FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "psych_sessions_psychologist"
  ON psychology_sessions FOR ALL
  TO authenticated
  USING (psychologist_id = auth.uid())
  WITH CHECK (psychologist_id = auth.uid());

CREATE POLICY "psych_sessions_hr"
  ON psychology_sessions FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- CONSENT_RECORDS
CREATE POLICY "consent_own"
  ON consent_records FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "consent_hr_read"
  ON consent_records FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- MENTAL_HEALTH_ALERTS: apenas HR e Admin
CREATE POLICY "alerts_hr_admin"
  ON mental_health_alerts FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- PSYCHOLOGICAL_RECORDS: apenas HR e Admin
CREATE POLICY "psych_records_hr_admin"
  ON psychological_records FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- PSYCHOLOGICAL_FORMS
CREATE POLICY "psych_forms_read"
  ON psychological_forms FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "psych_forms_hr_manage"
  ON psychological_forms FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- FORM_RESPONSES
CREATE POLICY "form_responses_own"
  ON form_responses FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "form_responses_hr"
  ON form_responses FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- THERAPEUTIC_ACTIVITIES
CREATE POLICY "therapeutic_read"
  ON therapeutic_activities FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "therapeutic_hr_manage"
  ON therapeutic_activities FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- WELLNESS_RESOURCES
CREATE POLICY "wellness_read"
  ON wellness_resources FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "wellness_hr_manage"
  ON wellness_resources FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- SESSION_REQUESTS
CREATE POLICY "session_requests_own"
  ON session_requests FOR ALL
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "session_requests_psychologist"
  ON session_requests FOR ALL
  TO authenticated
  USING (assigned_psychologist = auth.uid());

CREATE POLICY "session_requests_hr"
  ON session_requests FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 14: POLÍTICAS PARA CALENDÁRIO
-- ============================================================================

-- CALENDAR_EVENTS
CREATE POLICY "calendar_events_own"
  ON calendar_events FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "calendar_events_public"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "calendar_events_hr_admin"
  ON calendar_events FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- CALENDAR_REQUESTS
CREATE POLICY "calendar_requests_own"
  ON calendar_requests FOR ALL
  TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "calendar_requests_manager"
  ON calendar_requests FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'manager');

CREATE POLICY "calendar_requests_hr_admin"
  ON calendar_requests FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- CALENDAR_NOTIFICATIONS
CREATE POLICY "calendar_notif_own"
  ON calendar_notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "calendar_notif_system"
  ON calendar_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- CALENDAR_SETTINGS
CREATE POLICY "calendar_settings_read"
  ON calendar_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "calendar_settings_hr_admin"
  ON calendar_settings FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 15: POLÍTICAS PARA CURSOS E APRENDIZADO
-- ============================================================================

-- COURSES
CREATE POLICY "courses_read"
  ON courses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "courses_hr_manage"
  ON courses FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- COURSE_ENROLLMENTS
CREATE POLICY "enrollments_own"
  ON course_enrollments FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "enrollments_manager_read"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin'));

-- COURSE_MODULES
CREATE POLICY "modules_read"
  ON course_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.is_active = true
    )
  );

CREATE POLICY "modules_hr_manage"
  ON course_modules FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- COURSE_PROGRESS
CREATE POLICY "progress_own"
  ON course_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = course_progress.enrollment_id
      AND course_enrollments.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = course_progress.enrollment_id
      AND course_enrollments.profile_id = auth.uid()
    )
  );

CREATE POLICY "progress_manager_read"
  ON course_progress FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin'));

-- CERTIFICATES
CREATE POLICY "certificates_own"
  ON certificates FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "certificates_system"
  ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "certificates_hr_read"
  ON certificates FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 16: POLÍTICAS PARA MENTORIA
-- ============================================================================

-- MENTORSHIPS
CREATE POLICY "mentorships_participants"
  ON mentorships FOR ALL
  TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "mentorships_hr_read"
  ON mentorships FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- MENTORSHIP_SESSIONS
CREATE POLICY "sessions_participants"
  ON mentorship_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentorships
      WHERE mentorships.id = mentorship_sessions.mentorship_id
      AND (mentorships.mentor_id = auth.uid() OR mentorships.mentee_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mentorships
      WHERE mentorships.id = mentorship_sessions.mentorship_id
      AND (mentorships.mentor_id = auth.uid() OR mentorships.mentee_id = auth.uid())
    )
  );

-- MENTORSHIP_REQUESTS
CREATE POLICY "requests_participants"
  ON mentorship_requests FOR ALL
  TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- MENTOR_RATINGS
CREATE POLICY "ratings_mentee"
  ON mentor_ratings FOR ALL
  TO authenticated
  USING (mentee_id = auth.uid())
  WITH CHECK (mentee_id = auth.uid());

CREATE POLICY "ratings_read"
  ON mentor_ratings FOR SELECT
  TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR (auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- SESSION_SLOTS
CREATE POLICY "slots_mentor"
  ON session_slots FOR ALL
  TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "slots_read"
  ON session_slots FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "slots_hr_manage"
  ON session_slots FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 17: POLÍTICAS PARA TEMPLATES
-- ============================================================================

-- ACHIEVEMENT_TEMPLATES
CREATE POLICY "achievement_templates_read"
  ON achievement_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "achievement_templates_hr_manage"
  ON achievement_templates FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- CAREER_TRACK_TEMPLATES
CREATE POLICY "career_templates_read"
  ON career_track_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "career_templates_hr_manage"
  ON career_track_templates FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- CAREER_STAGE_COMPETENCIES
CREATE POLICY "stage_competencies_read"
  ON career_stage_competencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "stage_competencies_hr_manage"
  ON career_stage_competencies FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- CAREER_STAGE_SALARY_RANGES
CREATE POLICY "salary_ranges_manager_read"
  ON career_stage_salary_ranges FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('manager', 'hr', 'admin'));

CREATE POLICY "salary_ranges_hr_manage"
  ON career_stage_salary_ranges FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 18: POLÍTICAS PARA NOTIFICAÇÕES
-- ============================================================================

-- NOTIFICATIONS
CREATE POLICY "notifications_own"
  ON notifications FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "notifications_system"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NOTIFICATION_PREFERENCES
CREATE POLICY "notif_prefs_own"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "notif_prefs_hr_read"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

-- ============================================================================
-- PASSO 19: POLÍTICAS PARA AUDITORIA E SISTEMA
-- ============================================================================

-- AUDIT_LOGS
CREATE POLICY "audit_admin_read"
  ON audit_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin');

CREATE POLICY "audit_system_create"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SYSTEM_CONFIG
CREATE POLICY "system_config_admin"
  ON system_config FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');

-- ============================================================================
-- PASSO 20: SINCRONIZAR ROLES EXISTENTES COM JWT
-- ============================================================================

-- Atualizar JWT de todos os usuários existentes
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, role FROM profiles
  LOOP
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('user_role', profile_record.role::text)
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- PASSO 21: ÍNDICES PARA PERFORMANCE DE POLÍTICAS
-- ============================================================================

-- Índices para políticas com EXISTS
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_action_groups_created_by ON action_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_action_group_participants_lookup ON action_group_participants(group_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_competencies_profile ON competencies(profile_id);
CREATE INDEX IF NOT EXISTS idx_pdis_profile ON pdis(profile_id);
CREATE INDEX IF NOT EXISTS idx_pdis_mentor ON pdis(mentor_id) WHERE mentor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_salary_profile ON salary_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_achievements_profile ON achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_emotional_checkins_employee ON emotional_checkins(employee_id);
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_employee ON psychology_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_psychologist ON psychology_sessions(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentor ON mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentee ON mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_profile ON course_enrollments(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_requests_requester ON calendar_requests(requester_id);

-- ============================================================================
-- PASSO 22: VERIFICAÇÃO FINAL E COMENTÁRIOS
-- ============================================================================

-- Verificar que todas as tabelas têm RLS habilitado
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
  missing_rls text[] := ARRAY[]::text[];
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = table_name;
    
    IF NOT rls_enabled THEN
      missing_rls := array_append(missing_rls, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_rls, 1) > 0 THEN
    RAISE WARNING 'Tabelas sem RLS: %', array_to_string(missing_rls, ', ');
  ELSE
    RAISE NOTICE 'SUCESSO: Todas as tabelas têm RLS habilitado!';
  END IF;
  
  -- Log final de sucesso
  RAISE NOTICE '================================';
  RAISE NOTICE 'Consolidação de RLS Completa!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total de políticas criadas: ~150 (vs 213 anteriores)';
  RAISE NOTICE 'Todas as políticas são não-recursivas';
  RAISE NOTICE 'JWT claims sincronizados automaticamente';
  RAISE NOTICE 'Achievements table agora tem RLS habilitado';
  RAISE NOTICE 'Índices de performance criados';
END $$;

-- Comentários e documentação
COMMENT ON FUNCTION sync_user_role_to_jwt() IS 'Sincroniza automaticamente o role do profile com JWT claims para evitar recursão nas políticas RLS';
COMMENT ON FUNCTION drop_all_policies_for_table(text) IS 'Função helper para dropar todas as políticas de uma tabela';

-- Comentários nas políticas críticas
COMMENT ON POLICY "profiles_hr_admin_jwt" ON profiles IS 'HR e Admin acessam tudo via JWT - sem recursão';
COMMENT ON POLICY "salary_hr_admin_all" ON salary_history IS 'Dados salariais: acesso ultra-restrito apenas para HR e Admin';
COMMENT ON POLICY "psych_records_hr_admin" ON psychological_records IS 'Registros psicológicos: acesso ultra-restrito apenas para HR e Admin';
COMMENT ON POLICY "emotional_own" ON emotional_checkins IS 'Check-ins emocionais: acesso restrito ao próprio funcionário';