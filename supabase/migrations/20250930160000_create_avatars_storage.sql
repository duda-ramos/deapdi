/*
  # Create Avatars Storage Bucket

  1. Storage Setup
    - Create 'avatars' storage bucket
    - Set bucket to public for easy avatar access
    - Configure file size limits and allowed MIME types

  2. Security Policies
    - Authenticated users can upload their own avatars
    - Anyone can view avatars (public bucket)
    - Users can only update/delete their own avatars

  3. Notes
    - Max file size: 2MB
    - Allowed formats: JPEG, PNG, WebP, GIF
    - File naming: {user_id}.{extension}
*/

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy: Authenticated users can upload their own avatars
CREATE POLICY IF NOT EXISTS "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Authenticated users can update their own avatars
CREATE POLICY IF NOT EXISTS "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Authenticated users can delete their own avatars
CREATE POLICY IF NOT EXISTS "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY IF NOT EXISTS "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');