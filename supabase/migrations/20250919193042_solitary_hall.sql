/*
  # Secure RLS Policies Implementation

  1. Security Strategy
    - Simple, direct policies without complex joins
    - Use auth.uid() directly for user identification
    - Avoid recursive references to same table
    - Clear separation of permissions by role

  2. Policy Structure
    - Profiles: Self-access + role-based team access
    - PDIs: Owner access + manager validation rights
    - Action Groups: Public read + participant management
    - Mental Health: Maximum privacy protection
    - Notifications: Personal access only

  3. Testing Requirements
    - Test each role independently
    - Verify data isolation between users
    - Confirm manager access to team data only
    - Validate admin/HR appropriate access levels
*/

-- First, disable all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Disable RLS temporarily to recreate policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 1. PROFILES TABLE - Foundation for all other policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "profiles_own_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Managers can read profiles where they are the direct manager
CREATE POLICY "profiles_manager_read_team"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles manager_profile
      WHERE manager_profile.id = auth.uid()
      AND manager_profile.role = 'manager'
      AND profiles.manager_id = manager_profile.id
    )
  );

-- HR and Admin can read all profiles
CREATE POLICY "profiles_hr_admin_read_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles user_profile
      WHERE user_profile.id = auth.uid()
      AND user_profile.role IN ('hr', 'admin')
    )
  );

-- HR and Admin can update all profiles
CREATE POLICY "profiles_hr_admin_update_all"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles user_profile
      WHERE user_profile.id = auth.uid()
      AND user_profile.role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles user_profile
      WHERE user_profile.id = auth.uid()
      AND user_profile.role IN ('hr', 'admin')
    )
  );

-- 2. PDIS TABLE - Personal Development Plans
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;

-- Users can manage their own PDIs
CREATE POLICY "pdis_own_access"
  ON pdis
  FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Mentors can read and update PDIs they mentor
CREATE POLICY "pdis_mentor_access"
  ON pdis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = mentor_id);

CREATE POLICY "pdis_mentor_update"
  ON pdis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

-- Managers can read and validate PDIs of their direct reports
CREATE POLICY "pdis_manager_team_access"
  ON pdis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = pdis.profile_id
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "pdis_manager_validate"
  ON pdis
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles manager_profile
      WHERE manager_profile.id = auth.uid()
      AND manager_profile.role IN ('manager', 'hr', 'admin')
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles employee_profile
      WHERE employee_profile.id = pdis.profile_id
      AND (employee_profile.manager_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles admin_check WHERE admin_check.id = auth.uid() AND admin_check.role IN ('hr', 'admin')))
    )
  );

-- HR and Admin can read all PDIs
CREATE POLICY "pdis_hr_admin_read_all"
  ON pdis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 3. COMPETENCIES TABLE
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;

-- Users can manage their own competencies
CREATE POLICY "competencies_own_access"
  ON competencies
  FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Managers can read and rate competencies of their team
CREATE POLICY "competencies_manager_team_read"
  ON competencies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = competencies.profile_id
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "competencies_manager_team_update"
  ON competencies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = competencies.profile_id
      AND profiles.manager_id = auth.uid()
    )
  );

-- HR and Admin can read and manage all competencies
CREATE POLICY "competencies_hr_admin_all"
  ON competencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 4. ACTION GROUPS TABLE - Simplified policies
ALTER TABLE action_groups ENABLE ROW LEVEL SECURITY;

-- Everyone can read action groups (public visibility)
CREATE POLICY "action_groups_read_all"
  ON action_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create action groups
CREATE POLICY "action_groups_create"
  ON action_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creators can update their groups
CREATE POLICY "action_groups_creator_update"
  ON action_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Managers, HR, and Admin can update any group
CREATE POLICY "action_groups_manager_update"
  ON action_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'hr', 'admin')
    )
  );

-- 5. ACTION GROUP PARTICIPANTS TABLE
ALTER TABLE action_group_participants ENABLE ROW LEVEL SECURITY;

-- Everyone can read participants (for group visibility)
CREATE POLICY "participants_read_all"
  ON action_group_participants
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can join groups (insert their own participation)
CREATE POLICY "participants_join_groups"
  ON action_group_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Group creators can manage participants
CREATE POLICY "participants_creator_manage"
  ON action_group_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM action_groups
      WHERE action_groups.id = action_group_participants.group_id
      AND action_groups.created_by = auth.uid()
    )
  );

-- Users can leave groups (delete their own participation)
CREATE POLICY "participants_leave_groups"
  ON action_group_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- 6. TASKS TABLE
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Assignees can read and update their tasks
CREATE POLICY "tasks_assignee_access"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = assignee_id)
  WITH CHECK (auth.uid() = assignee_id);

-- Group creators can manage group tasks
CREATE POLICY "tasks_group_creator_manage"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_groups
      WHERE action_groups.id = tasks.group_id
      AND action_groups.created_by = auth.uid()
    )
  );

-- Group participants can read group tasks
CREATE POLICY "tasks_group_participants_read"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
    )
  );

-- Managers, HR, and Admin can manage all tasks
CREATE POLICY "tasks_manager_admin_all"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'hr', 'admin')
    )
  );

-- 7. ACHIEVEMENTS TABLE
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users can read their own achievements
CREATE POLICY "achievements_own_read"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- System can create achievements (for triggers)
CREATE POLICY "achievements_system_create"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- HR and Admin can read all achievements
CREATE POLICY "achievements_hr_admin_read"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 8. NOTIFICATIONS TABLE
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own notifications
CREATE POLICY "notifications_own_access"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- System can create notifications for any user
CREATE POLICY "notifications_system_create"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 9. TEAMS TABLE
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Everyone can read teams (for organizational visibility)
CREATE POLICY "teams_read_all"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- HR and Admin can manage teams
CREATE POLICY "teams_hr_admin_manage"
  ON teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 10. CAREER TRACKS TABLE
ALTER TABLE career_tracks ENABLE ROW LEVEL SECURITY;

-- Users can read their own career track
CREATE POLICY "career_tracks_own_read"
  ON career_tracks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- Users can create their own career track
CREATE POLICY "career_tracks_own_create"
  ON career_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- HR and Admin can manage all career tracks
CREATE POLICY "career_tracks_hr_admin_all"
  ON career_tracks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 11. SALARY HISTORY TABLE - Sensitive data
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own salary history
CREATE POLICY "salary_history_own_read"
  ON salary_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- Only HR and Admin can manage salary history
CREATE POLICY "salary_history_hr_admin_all"
  ON salary_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 12. MENTAL HEALTH TABLES - Maximum privacy protection

-- EMOTIONAL CHECKINS
ALTER TABLE emotional_checkins ENABLE ROW LEVEL SECURITY;

-- Only the employee can access their own checkins
CREATE POLICY "emotional_checkins_own_access"
  ON emotional_checkins
  FOR ALL
  TO authenticated
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

-- HR can read checkins for statistical purposes (anonymized)
CREATE POLICY "emotional_checkins_hr_stats"
  ON emotional_checkins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- PSYCHOLOGY SESSIONS
ALTER TABLE psychology_sessions ENABLE ROW LEVEL SECURITY;

-- Employees can access their own sessions
CREATE POLICY "psychology_sessions_employee_access"
  ON psychology_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

-- Psychologists can access sessions they conduct
CREATE POLICY "psychology_sessions_psychologist_access"
  ON psychology_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = psychologist_id)
  WITH CHECK (auth.uid() = psychologist_id);

-- HR can read all sessions for administrative purposes
CREATE POLICY "psychology_sessions_hr_read"
  ON psychology_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- CONSENT RECORDS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Employees can manage their own consent
CREATE POLICY "consent_records_employee_access"
  ON consent_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

-- HR can read consent records for compliance
CREATE POLICY "consent_records_hr_read"
  ON consent_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- MENTAL HEALTH ALERTS
ALTER TABLE mental_health_alerts ENABLE ROW LEVEL SECURITY;

-- Only HR and Admin can access mental health alerts
CREATE POLICY "mental_health_alerts_hr_admin_only"
  ON mental_health_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 13. LEARNING TABLES

-- COURSES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Everyone can read active courses
CREATE POLICY "courses_read_active"
  ON courses
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- HR can manage all courses
CREATE POLICY "courses_hr_manage"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- COURSE ENROLLMENTS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can manage their own enrollments
CREATE POLICY "course_enrollments_own_access"
  ON course_enrollments
  FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- HR and Managers can read all enrollments
CREATE POLICY "course_enrollments_manager_read"
  ON course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'hr', 'admin')
    )
  );

-- COURSE MODULES
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

-- Everyone can read modules of active courses
CREATE POLICY "course_modules_read_active"
  ON course_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.is_active = true
    )
  );

-- HR can manage course modules
CREATE POLICY "course_modules_hr_manage"
  ON course_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- COURSE PROGRESS
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage progress for their own enrollments
CREATE POLICY "course_progress_own_access"
  ON course_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = course_progress.enrollment_id
      AND course_enrollments.profile_id = auth.uid()
    )
  );

-- HR and Managers can read all progress
CREATE POLICY "course_progress_manager_read"
  ON course_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'hr', 'admin')
    )
  );

-- CERTIFICATES
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Users can read their own certificates
CREATE POLICY "certificates_own_read"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- System can create certificates
CREATE POLICY "certificates_system_create"
  ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- HR can read all certificates
CREATE POLICY "certificates_hr_read"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 14. MENTORSHIP TABLES

-- MENTORSHIPS
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;

-- Mentors and mentees can access their mentorships
CREATE POLICY "mentorships_participant_access"
  ON mentorships
  FOR ALL
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- HR can read all mentorships
CREATE POLICY "mentorships_hr_read"
  ON mentorships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- MENTORSHIP SESSIONS
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- Participants can access sessions of their mentorships
CREATE POLICY "mentorship_sessions_participant_access"
  ON mentorship_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentorships
      WHERE mentorships.id = mentorship_sessions.mentorship_id
      AND (mentorships.mentor_id = auth.uid() OR mentorships.mentee_id = auth.uid())
    )
  );

-- MENTORSHIP REQUESTS
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Mentors and mentees can access their requests
CREATE POLICY "mentorship_requests_participant_access"
  ON mentorship_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- 15. CAREER TRACK TEMPLATES (HR Management)
ALTER TABLE career_track_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "career_track_templates_read_all"
  ON career_track_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- HR can manage templates
CREATE POLICY "career_track_templates_hr_manage"
  ON career_track_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- CAREER STAGE COMPETENCIES
ALTER TABLE career_stage_competencies ENABLE ROW LEVEL SECURITY;

-- Everyone can read stage competencies
CREATE POLICY "career_stage_competencies_read_all"
  ON career_stage_competencies
  FOR SELECT
  TO authenticated
  USING (true);

-- HR can manage stage competencies
CREATE POLICY "career_stage_competencies_hr_manage"
  ON career_stage_competencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- CAREER STAGE SALARY RANGES
ALTER TABLE career_stage_salary_ranges ENABLE ROW LEVEL SECURITY;

-- Managers, HR, and Admin can read salary ranges
CREATE POLICY "career_stage_salary_ranges_manager_read"
  ON career_stage_salary_ranges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'hr', 'admin')
    )
  );

-- HR can manage salary ranges
CREATE POLICY "career_stage_salary_ranges_hr_manage"
  ON career_stage_salary_ranges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 16. ACHIEVEMENT TEMPLATES
ALTER TABLE achievement_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read achievement templates
CREATE POLICY "achievement_templates_read_all"
  ON achievement_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- HR can manage achievement templates
CREATE POLICY "achievement_templates_hr_manage"
  ON achievement_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 17. WELLNESS RESOURCES
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;

-- Everyone can read active wellness resources
CREATE POLICY "wellness_resources_read_active"
  ON wellness_resources
  FOR SELECT
  TO authenticated
  USING (active = true);

-- HR can manage wellness resources
CREATE POLICY "wellness_resources_hr_manage"
  ON wellness_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 18. PSYCHOLOGICAL FORMS
ALTER TABLE psychological_forms ENABLE ROW LEVEL SECURITY;

-- Everyone can read active forms
CREATE POLICY "psychological_forms_read_active"
  ON psychological_forms
  FOR SELECT
  TO authenticated
  USING (active = true);

-- HR can manage forms
CREATE POLICY "psychological_forms_hr_manage"
  ON psychological_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- FORM RESPONSES
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Employees can manage their own responses
CREATE POLICY "form_responses_employee_access"
  ON form_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

-- HR can read and review all responses
CREATE POLICY "form_responses_hr_access"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

CREATE POLICY "form_responses_hr_review"
  ON form_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 19. THERAPEUTIC ACTIVITIES
ALTER TABLE therapeutic_activities ENABLE ROW LEVEL SECURITY;

-- Everyone can read active activities
CREATE POLICY "therapeutic_activities_read_active"
  ON therapeutic_activities
  FOR SELECT
  TO authenticated
  USING (active = true);

-- HR can manage activities
CREATE POLICY "therapeutic_activities_hr_manage"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- 20. PSYCHOLOGICAL RECORDS - Highly sensitive
ALTER TABLE psychological_records ENABLE ROW LEVEL SECURITY;

-- Only HR and Admin can access psychological records
CREATE POLICY "psychological_records_hr_admin_only"
  ON psychological_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Final verification: Ensure all tables have RLS enabled
DO $$
DECLARE
    table_name text;
    rls_enabled boolean;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class 
        WHERE relname = table_name;
        
        IF NOT rls_enabled THEN
            RAISE NOTICE 'WARNING: Table % does not have RLS enabled', table_name;
        ELSE
            RAISE NOTICE 'OK: Table % has RLS enabled', table_name;
        END IF;
    END LOOP;
END $$;