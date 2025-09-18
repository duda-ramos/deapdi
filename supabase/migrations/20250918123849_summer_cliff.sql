/*
  # Fix signup flow and RLS policies

  1. Security Policies
    - Remove conflicting policies
    - Create proper policies for user signup
    - Allow users to create their own profiles
    - Enable proper access controls

  2. Trigger Function
    - Automatic profile creation after user signup
    - Handle errors gracefully
    - Use metadata from signup
*/

-- Remove conflicting policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow individual insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile after signup" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to create their own profile (during signup)
CREATE POLICY "Users can create own profile after signup" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin and HR can view all profiles
CREATE POLICY "Admin and HR can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

-- Managers can view their team members
CREATE POLICY "Managers can view their team" 
ON profiles FOR SELECT 
USING (
  manager_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM teams 
    WHERE manager_id = auth.uid() 
    AND id = profiles.team_id
  )
);

-- Function to create profile automatically after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    status,
    position,
    level,
    points,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'employee',
    'active',
    COALESCE(new.raw_user_meta_data->>'position', 'Colaborador'),
    COALESCE(new.raw_user_meta_data->>'level', 'Júnior'),
    0,
    now(),
    now()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();