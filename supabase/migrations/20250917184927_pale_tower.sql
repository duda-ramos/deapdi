/*
  # Complete Database Schema for TalentFlow

  1. New Tables
    - `profiles` - User profiles with professional information
    - `teams` - Team/department organization
    - `career_tracks` - Career progression tracking
    - `salary_history` - Salary change history
    - `competencies` - Skills and competency ratings
    - `pdis` - Personal Development Plans
    - `achievements` - User achievements and badges
    - `action_groups` - Collaborative project groups
    - `action_group_participants` - Group membership
    - `tasks` - Tasks for groups and PDIs
    - `psychological_records` - HR psychological records
    - `notifications` - System notifications
    - `mentorships` - Mentorship relationships
    - `mentorship_sessions` - Mentorship session records
    - `mentorship_requests` - Pending mentorship requests

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each user role
    - Create triggers for automatic profile creation

  3. Functions and Triggers
    - Auto-create profile on user signup
    - Update timestamps automatically
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE track_type AS ENUM ('development', 'specialization');
CREATE TYPE competency_type AS ENUM ('hard', 'soft');
CREATE TYPE pdi_status AS ENUM ('pending', 'in-progress', 'completed', 'validated');
CREATE TYPE group_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'done');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE record_type AS ENUM ('session', 'test', 'evaluation', 'note');
CREATE TYPE mentorship_status AS ENUM ('active', 'completed', 'paused');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table (main user data)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  role user_role DEFAULT 'employee',
  team_id uuid REFERENCES teams(id),
  manager_id uuid REFERENCES profiles(id),
  level text NOT NULL,
  position text NOT NULL,
  points integer DEFAULT 0,
  bio text,
  formation text,
  status user_status DEFAULT 'active',
  personality_test_results jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for teams manager
ALTER TABLE teams ADD CONSTRAINT teams_manager_id_fkey 
  FOREIGN KEY (manager_id) REFERENCES profiles(id);

-- Career tracks table
CREATE TABLE IF NOT EXISTS career_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession text NOT NULL,
  current_stage text NOT NULL,
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  next_stage text,
  track_type track_type DEFAULT 'development',
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Salary history table
CREATE TABLE IF NOT EXISTS salary_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  position text NOT NULL,
  reason text NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Competencies table
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type competency_type NOT NULL,
  stage text NOT NULL,
  self_rating integer CHECK (self_rating >= 1 AND self_rating <= 5),
  manager_rating integer CHECK (manager_rating >= 1 AND manager_rating <= 5),
  target_level integer NOT NULL CHECK (target_level >= 1 AND target_level <= 5),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDIs table
CREATE TABLE IF NOT EXISTS pdis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  deadline date NOT NULL,
  status pdi_status DEFAULT 'pending',
  mentor_id uuid REFERENCES profiles(id),
  points integer DEFAULT 100,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  validated_by uuid REFERENCES profiles(id),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points integer DEFAULT 0,
  unlocked_at timestamptz,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Action groups table
CREATE TABLE IF NOT EXISTS action_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  deadline date NOT NULL,
  status group_status DEFAULT 'active',
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Action group participants table
CREATE TABLE IF NOT EXISTS action_group_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES action_groups(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, profile_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES profiles(id) NOT NULL,
  group_id uuid REFERENCES action_groups(id) ON DELETE CASCADE,
  pdi_id uuid REFERENCES pdis(id) ON DELETE CASCADE,
  deadline date NOT NULL,
  status task_status DEFAULT 'todo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (group_id IS NOT NULL OR pdi_id IS NOT NULL)
);

-- Psychological records table
CREATE TABLE IF NOT EXISTS psychological_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  record_type record_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  confidential boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type DEFAULT 'info',
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Mentorships table
CREATE TABLE IF NOT EXISTS mentorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES profiles(id) NOT NULL,
  mentee_id uuid REFERENCES profiles(id) NOT NULL,
  status mentorship_status DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Mentorship sessions table
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id uuid REFERENCES mentorships(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  topics_discussed text NOT NULL,
  action_items text NOT NULL,
  mentor_feedback text,
  mentee_feedback text,
  created_at timestamptz DEFAULT now()
);

-- Mentorship requests table
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES profiles(id) NOT NULL,
  mentee_id uuid REFERENCES profiles(id) NOT NULL,
  message text NOT NULL,
  status request_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, level, position)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'level', 'Estagiário'),
    COALESCE(new.raw_user_meta_data->>'position', 'Colaborador')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER career_tracks_updated_at BEFORE UPDATE ON career_tracks
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER competencies_updated_at BEFORE UPDATE ON competencies
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER pdis_updated_at BEFORE UPDATE ON pdis
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER action_groups_updated_at BEFORE UPDATE ON action_groups
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER psychological_records_updated_at BEFORE UPDATE ON psychological_records
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER mentorships_updated_at BEFORE UPDATE ON mentorships
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER mentorship_requests_updated_at BEFORE UPDATE ON mentorship_requests
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "HR and Admin can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR and Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR and Admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- RLS Policies for teams
CREATE POLICY "Users can read teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Managers and above can manage teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  );

-- RLS Policies for career_tracks
CREATE POLICY "Users can read own career track" ON career_tracks
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "HR and Admin can read all career tracks" ON career_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR and Admin can manage career tracks" ON career_tracks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- RLS Policies for salary_history
CREATE POLICY "Users can read own salary history" ON salary_history
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "HR and Admin can read all salary history" ON salary_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR and Admin can manage salary history" ON salary_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- RLS Policies for competencies
CREATE POLICY "Users can read own competencies" ON competencies
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update own competencies" ON competencies
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Managers can read team competencies" ON competencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p1.role IN ('manager', 'hr', 'admin')
      AND p2.id = competencies.profile_id
      AND (p2.manager_id = p1.id OR p1.role IN ('hr', 'admin'))
    )
  );

CREATE POLICY "Managers can update team competencies" ON competencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p1.role IN ('manager', 'hr', 'admin')
      AND p2.id = competencies.profile_id
      AND (p2.manager_id = p1.id OR p1.role IN ('hr', 'admin'))
    )
  );

CREATE POLICY "HR and Admin can manage all competencies" ON competencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- RLS Policies for pdis
CREATE POLICY "Users can read own PDIs" ON pdis
  FOR SELECT USING (profile_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "Users can create own PDIs" ON pdis
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own PDIs" ON pdis
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Mentors can update mentored PDIs" ON pdis
  FOR UPDATE USING (mentor_id = auth.uid());

CREATE POLICY "Managers can read team PDIs" ON pdis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p1.role IN ('manager', 'hr', 'admin')
      AND p2.id = pdis.profile_id
      AND (p2.manager_id = p1.id OR p1.role IN ('hr', 'admin'))
    )
  );

CREATE POLICY "Managers can validate team PDIs" ON pdis
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p1.role IN ('manager', 'hr', 'admin')
      AND p2.id = pdis.profile_id
      AND (p2.manager_id = p1.id OR p1.role IN ('hr', 'admin'))
    )
  );

-- RLS Policies for achievements
CREATE POLICY "Users can read own achievements" ON achievements
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "HR and Admin can read all achievements" ON achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "System can create achievements" ON achievements
  FOR INSERT WITH CHECK (true);

-- RLS Policies for action_groups
CREATE POLICY "Users can read action groups" ON action_groups
  FOR SELECT USING (true);

CREATE POLICY "Users can create action groups" ON action_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update own groups" ON action_groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Managers can manage all groups" ON action_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'hr', 'admin')
    )
  );

-- RLS Policies for action_group_participants
CREATE POLICY "Users can read group participants" ON action_group_participants
  FOR SELECT USING (true);

CREATE POLICY "Group leaders can manage participants" ON action_group_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM action_groups ag
      WHERE ag.id = action_group_participants.group_id
      AND ag.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join groups" ON action_group_participants
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Users can read own tasks" ON tasks
  FOR SELECT USING (assignee_id = auth.uid());

CREATE POLICY "Group members can read group tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM action_group_participants agp
      WHERE agp.group_id = tasks.group_id
      AND agp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (assignee_id = auth.uid());

CREATE POLICY "Group leaders can manage group tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM action_groups ag
      WHERE ag.id = tasks.group_id
      AND ag.created_by = auth.uid()
    )
  );

-- RLS Policies for psychological_records
CREATE POLICY "HR can read all psychological records" ON psychological_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR can manage psychological records" ON psychological_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for mentorships
CREATE POLICY "Users can read own mentorships" ON mentorships
  FOR SELECT USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "Users can create mentorships" ON mentorships
  FOR INSERT WITH CHECK (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "Users can update own mentorships" ON mentorships
  FOR UPDATE USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "HR can read all mentorships" ON mentorships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- RLS Policies for mentorship_sessions
CREATE POLICY "Users can read own mentorship sessions" ON mentorship_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mentorships m
      WHERE m.id = mentorship_sessions.mentorship_id
      AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Users can create mentorship sessions" ON mentorship_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mentorships m
      WHERE m.id = mentorship_sessions.mentorship_id
      AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own mentorship sessions" ON mentorship_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mentorships m
      WHERE m.id = mentorship_sessions.mentorship_id
      AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
  );

-- RLS Policies for mentorship_requests
CREATE POLICY "Users can read own mentorship requests" ON mentorship_requests
  FOR SELECT USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "Users can create mentorship requests" ON mentorship_requests
  FOR INSERT WITH CHECK (mentee_id = auth.uid());

CREATE POLICY "Mentors can update requests" ON mentorship_requests
  FOR UPDATE USING (mentor_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_team_id_idx ON profiles(team_id);
CREATE INDEX IF NOT EXISTS profiles_manager_id_idx ON profiles(manager_id);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);
CREATE INDEX IF NOT EXISTS career_tracks_profile_id_idx ON career_tracks(profile_id);
CREATE INDEX IF NOT EXISTS salary_history_profile_id_idx ON salary_history(profile_id);
CREATE INDEX IF NOT EXISTS competencies_profile_id_idx ON competencies(profile_id);
CREATE INDEX IF NOT EXISTS pdis_profile_id_idx ON pdis(profile_id);
CREATE INDEX IF NOT EXISTS pdis_mentor_id_idx ON pdis(mentor_id);
CREATE INDEX IF NOT EXISTS pdis_status_idx ON pdis(status);
CREATE INDEX IF NOT EXISTS achievements_profile_id_idx ON achievements(profile_id);
CREATE INDEX IF NOT EXISTS action_groups_created_by_idx ON action_groups(created_by);
CREATE INDEX IF NOT EXISTS action_groups_status_idx ON action_groups(status);
CREATE INDEX IF NOT EXISTS action_group_participants_group_id_idx ON action_group_participants(group_id);
CREATE INDEX IF NOT EXISTS action_group_participants_profile_id_idx ON action_group_participants(profile_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_group_id_idx ON tasks(group_id);
CREATE INDEX IF NOT EXISTS tasks_pdi_id_idx ON tasks(pdi_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS psychological_records_profile_id_idx ON psychological_records(profile_id);
CREATE INDEX IF NOT EXISTS notifications_profile_id_idx ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS mentorships_mentor_id_idx ON mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS mentorships_mentee_id_idx ON mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS mentorship_sessions_mentorship_id_idx ON mentorship_sessions(mentorship_id);
CREATE INDEX IF NOT EXISTS mentorship_requests_mentor_id_idx ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS mentorship_requests_mentee_id_idx ON mentorship_requests(mentee_id);