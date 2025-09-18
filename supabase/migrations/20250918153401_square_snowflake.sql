/*
  # Fix career tracks INSERT policy

  1. Security Changes
    - Add INSERT policy for career_tracks table
    - Allow users to create their own career tracks
    - Ensure profile_id matches authenticated user ID

  This migration fixes the RLS policy violation when users try to create new career tracks.
*/

-- Add INSERT policy for career_tracks table
CREATE POLICY "Users can create own career tracks"
  ON career_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());