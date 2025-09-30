/*
  # Fix Login Loop - Garantir Criação Automática de Perfil
  
  1. Problema Identificado
    - Usuários autenticam mas não têm perfil criado
    - Causa loop de erro no login
    
  2. Solução
    - Recriar trigger de criação automática de perfil
    - Garantir que função handle_new_user está correta
    - Adicionar verificação e criação manual de perfis faltantes
    
  3. Segurança
    - Manter RLS ativo mas permitir criação de perfil próprio
    - SECURITY DEFINER para permitir inserção via trigger
*/

-- ====================================================================
-- RECREATE HANDLE_NEW_USER FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the attempt
  RAISE LOG 'Creating profile for new user: %', NEW.id;
  
  -- Insert profile for new user
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'employee',
    'active',
    COALESCE(NEW.raw_user_meta_data->>'position', 'Colaborador'),
    COALESCE(NEW.raw_user_meta_data->>'level', 'Júnior'),
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- RECREATE TRIGGER
-- ====================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- FIX EXISTING USERS WITHOUT PROFILES
-- ====================================================================

-- Create profiles for any auth users that don't have them
DO $$
DECLARE
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
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
        user_record.id,
        user_record.email,
        COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1)),
        'employee',
        'active',
        COALESCE(user_record.raw_user_meta_data->>'position', 'Colaborador'),
        COALESCE(user_record.raw_user_meta_data->>'level', 'Júnior'),
        0,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created missing profile for user: %', user_record.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not create profile for user %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  -- Report results
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE NOTICE 'Total profiles in database: %', profile_count;
END $$;

-- ====================================================================
-- VERIFY TRIGGER IS ACTIVE
-- ====================================================================

-- Check if trigger exists
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
    AND trigger_schema = 'auth'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Trigger on_auth_user_created is active';
  ELSE
    RAISE WARNING '✗ Trigger on_auth_user_created is NOT active';
  END IF;
END $$;