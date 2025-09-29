/*
  # Create notification preferences table

  1. New Tables
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - `pdi_approved` (boolean, default true)
      - `pdi_rejected` (boolean, default true)
      - `task_assigned` (boolean, default true)
      - `achievement_unlocked` (boolean, default true)
      - `mentorship_scheduled` (boolean, default true)
      - `mentorship_cancelled` (boolean, default true)
      - `group_invitation` (boolean, default true)
      - `deadline_reminder` (boolean, default true)
      - `email_notifications` (boolean, default true)
      - `push_notifications` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notification_preferences` table
    - Add policy for users to manage their own preferences
    - Add policy for HR/Admin to read all preferences

  3. Indexes
    - Add index on profile_id for performance
*/

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "HR and Admin can read all notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS notification_preferences_profile_id_idx 
  ON notification_preferences(profile_id);

-- Trigger for updated_at
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();