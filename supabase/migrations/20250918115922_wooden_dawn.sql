/*
  # Add RLS policy for profile creation

  1. Security Changes
    - Add INSERT policy for profiles table
    - Allow authenticated users to create their own profile
    - Policy checks that auth.uid() matches the profile id

  2. Policy Details
    - Name: "Users can create own profile"
    - Operation: INSERT
    - Target: authenticated users
    - Check: auth.uid() = id
*/

-- Enable RLS on profiles table (in case it's not enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure users can read their own profile
CREATE POLICY "Users can read own profile" 
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);