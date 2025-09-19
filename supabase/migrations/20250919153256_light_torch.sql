/*
  # Add onboarding fields to profiles table

  1. New Columns
    - `is_onboarded` (boolean) - tracks if user completed onboarding
    - `onboarding_progress` (jsonb) - stores partial progress
    - `onboarding_completed_at` (timestamp) - completion timestamp
    - `emergency_contact` (text) - emergency contact info
    - `mental_health_consent` (boolean) - consent for mental health tracking
    - `preferred_session_type` (text) - preferred session type
    - `birth_date` (date) - date of birth
    - `phone` (text) - phone number
    - `location` (text) - city/location
    - `admission_date` (date) - company admission date
    - `area` (text) - work area
    - `certifications` (text[]) - certifications array
    - `hard_skills` (text[]) - hard skills tags
    - `soft_skills` (text[]) - soft skills tags
    - `languages` (jsonb) - languages and levels
    - `career_objectives` (text) - career goals
    - `development_interests` (text[]) - areas of interest
    - `mentorship_availability` (boolean) - available for mentorship

  2. Security
    - Update existing RLS policies to handle new fields
*/

-- Add onboarding and profile enhancement fields
DO $$
BEGIN
  -- Onboarding tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_onboarded'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_onboarded BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_progress'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_progress JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
  END IF;

  -- Personal information fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;

  -- Professional information fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'admission_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN admission_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'area'
  ) THEN
    ALTER TABLE profiles ADD COLUMN area TEXT;
  END IF;

  -- Education and skills fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN certifications TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hard_skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hard_skills TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'soft_skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN soft_skills TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages JSONB DEFAULT '{}';
  END IF;

  -- Mental health fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mental_health_consent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mental_health_consent BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_session_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_session_type TEXT;
  END IF;

  -- Career and development fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'career_objectives'
  ) THEN
    ALTER TABLE profiles ADD COLUMN career_objectives TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'development_interests'
  ) THEN
    ALTER TABLE profiles ADD COLUMN development_interests TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mentorship_availability'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mentorship_availability BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_preferred_session_type_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_preferred_session_type_check 
    CHECK (preferred_session_type IN ('presencial', 'online', 'ambos'));
  END IF;
END $$;