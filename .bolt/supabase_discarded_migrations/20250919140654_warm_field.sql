/*
  # Fix Notifications System Tables

  1. New Tables
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - Various boolean preferences for notification types
      - `email_notifications` and `push_notifications` toggles
      - Timestamps for created_at and updated_at

  2. Functions
    - `get_notification_stats` - Returns notification statistics for a profile
    - `cleanup_old_notifications` - Removes old notifications

  3. Security
    - Enable RLS on notification_preferences table
    - Add policies for users to manage their own preferences
    - Add policies for reading notification stats
*/

-- Create notification_preferences table
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

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (profile_id = uid());

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = uid());

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (profile_id = uid())
  WITH CHECK (profile_id = uid());

-- Create updated_at trigger
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create get_notification_stats function
CREATE OR REPLACE FUNCTION get_notification_stats(p_profile_id uuid)
RETURNS TABLE (
  total_notifications bigint,
  unread_notifications bigint,
  notifications_today bigint,
  most_common_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_notifications,
    COUNT(*) FILTER (WHERE read = false)::bigint as unread_notifications,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::bigint as notifications_today,
    COALESCE(
      (SELECT type 
       FROM notifications 
       WHERE profile_id = p_profile_id 
       GROUP BY type 
       ORDER BY COUNT(*) DESC 
       LIMIT 1), 
      'info'
    ) as most_common_type
  FROM notifications 
  WHERE profile_id = p_profile_id;
END;
$$;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE read = true 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Delete unread notifications older than 90 days
  DELETE FROM notifications 
  WHERE read = false 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$;