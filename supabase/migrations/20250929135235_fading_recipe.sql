/*
  # Create mentorship support tables

  1. New Tables
    - `session_slots`
      - `id` (uuid, primary key)
      - `mentor_id` (uuid, foreign key to profiles)
      - `day_of_week` (integer, 0-6)
      - `start_time` (time)
      - `end_time` (time)
      - `is_available` (boolean, default true)
      - `created_at` (timestamp)

    - `mentor_ratings`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to mentorship_sessions)
      - `mentor_id` (uuid, foreign key to profiles)
      - `mentee_id` (uuid, foreign key to profiles)
      - `rating` (integer, 1-5)
      - `comment` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for mentors and mentees

  3. Indexes
    - Add indexes for performance optimization
*/

-- Session Slots Table
CREATE TABLE IF NOT EXISTS session_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Mentor Ratings Table
CREATE TABLE IF NOT EXISTS mentor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id) -- One rating per session
);

-- Enable RLS
ALTER TABLE session_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_ratings ENABLE ROW LEVEL SECURITY;

-- Session Slots Policies
CREATE POLICY "Mentors can manage own availability slots"
  ON session_slots
  FOR ALL
  TO authenticated
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Users can read mentor availability"
  ON session_slots
  FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "HR can manage all session slots"
  ON session_slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Mentor Ratings Policies
CREATE POLICY "Mentees can create ratings for their sessions"
  ON mentor_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can read ratings for their mentorship sessions"
  ON mentor_ratings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = mentor_id OR 
    auth.uid() = mentee_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Mentees can update their own ratings"
  ON mentor_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentee_id);

-- Indexes
CREATE INDEX IF NOT EXISTS session_slots_mentor_id_idx ON session_slots(mentor_id);
CREATE INDEX IF NOT EXISTS session_slots_day_of_week_idx ON session_slots(day_of_week);
CREATE INDEX IF NOT EXISTS session_slots_available_idx ON session_slots(is_available);

CREATE INDEX IF NOT EXISTS mentor_ratings_mentor_id_idx ON mentor_ratings(mentor_id);
CREATE INDEX IF NOT EXISTS mentor_ratings_mentee_id_idx ON mentor_ratings(mentee_id);
CREATE INDEX IF NOT EXISTS mentor_ratings_session_id_idx ON mentor_ratings(session_id);
CREATE INDEX IF NOT EXISTS mentor_ratings_rating_idx ON mentor_ratings(rating);