-- ════════════════════════════════════════════════════════════════════════════════
-- TALENTFLOW - HEALTH CHECK FUNCTION
-- ════════════════════════════════════════════════════════════════════════════════
-- Função RPC para verificação de saúde do sistema
-- Usada por serviços de monitoramento (UptimeRobot, Pingdom, etc.)
-- ════════════════════════════════════════════════════════════════════════════════

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.health_check();

-- Create health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  db_connected boolean := false;
  profile_count integer := 0;
  app_version text := '1.0.0';
BEGIN
  -- Test database connection
  BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles LIMIT 1;
    db_connected := true;
  EXCEPTION
    WHEN OTHERS THEN
      db_connected := false;
  END;

  -- Build result JSON
  result := jsonb_build_object(
    'status', CASE WHEN db_connected THEN 'healthy' ELSE 'unhealthy' END,
    'timestamp', NOW()::text,
    'version', app_version,
    'checks', jsonb_build_object(
      'database', jsonb_build_object(
        'connected', db_connected,
        'latency_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - now())::integer
      ),
      'tables', jsonb_build_object(
        'profiles_accessible', db_connected
      )
    ),
    'environment', current_setting('app.settings.environment', true)
  );

  RETURN result;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.health_check() TO anon;
GRANT EXECUTE ON FUNCTION public.health_check() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.health_check() IS 
'Health check endpoint for monitoring services. Returns system status, database connectivity, and version information.';

-- ════════════════════════════════════════════════════════════════════════════════
-- VALIDATION
-- ════════════════════════════════════════════════════════════════════════════════

-- Test the health check function
DO $$
DECLARE
  result jsonb;
BEGIN
  SELECT health_check() INTO result;
  
  IF result->>'status' = 'healthy' THEN
    RAISE NOTICE '✅ Health check function created successfully';
    RAISE NOTICE '   Status: %', result->>'status';
    RAISE NOTICE '   Version: %', result->>'version';
  ELSE
    RAISE WARNING '⚠️ Health check function created but database may have issues';
  END IF;
END $$;
