/*
  ============================================================================
  DIAGNOSTIC AND FIX SCRIPT FOR NOTIFICATION TRIGGERS
  ============================================================================
  
  This script:
  1. Diagnoses the current state of notification triggers
  2. Identifies any issues (missing columns, wrong types, missing triggers)
  3. Reports findings
  
  RUN THIS FIRST before running the fix migration.
  
  INSTRUCTIONS:
  1. Copy this script to the Supabase SQL Editor
  2. Execute and review the output
  3. If issues are found, run 20251201140000_fix_notification_triggers.sql
  4. Re-run complete_trigger_validation.sql to verify 100% pass rate
*/

-- ============================================================================
-- DIAGNOSTIC RESULTS TABLE
-- ============================================================================

DROP TABLE IF EXISTS _diagnostic_results;
CREATE TEMP TABLE _diagnostic_results (
  item_id serial PRIMARY KEY,
  category text NOT NULL,
  item_name text NOT NULL,
  expected text NOT NULL,
  actual text NOT NULL,
  status text NOT NULL CHECK (status IN ('OK', 'WARNING', 'ERROR')),
  fix_action text,
  checked_at timestamptz DEFAULT now()
);

-- ============================================================================
-- DIAGNOSTIC FUNCTION
-- ============================================================================

DO $$
DECLARE
  v_count integer;
  v_data_type text;
  v_exists boolean;
  v_trigger_record record;
  v_function_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     DIAGNÓSTICO COMPLETO - TRIGGERS DE NOTIFICAÇÃO          ║';
  RAISE NOTICE '║     Data: %                             ║', to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 1: NOTIFICATIONS TABLE STRUCTURE
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '1. ESTRUTURA DA TABELA NOTIFICATIONS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  -- Check if notifications table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('STRUCTURE', 'notifications table', 'Exists', 'Exists', 'OK');
    RAISE NOTICE '✅ Tabela notifications existe';
    
    -- Check category column
    SELECT data_type INTO v_data_type
    FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'category';
    
    IF v_data_type IS NOT NULL THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('STRUCTURE', 'category column', 'text', v_data_type, 'OK');
      RAISE NOTICE '   ✅ Coluna category existe (%)', v_data_type;
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('STRUCTURE', 'category column', 'Exists', 'Missing', 'ERROR', 
              'ALTER TABLE notifications ADD COLUMN category text DEFAULT ''general''');
      RAISE NOTICE '   ❌ Coluna category NÃO existe';
    END IF;
    
    -- Check related_id column and type
    SELECT data_type INTO v_data_type
    FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'related_id';
    
    IF v_data_type IS NULL THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('STRUCTURE', 'related_id column', 'Exists as text', 'Missing', 'ERROR',
              'ALTER TABLE notifications ADD COLUMN related_id text');
      RAISE NOTICE '   ❌ Coluna related_id NÃO existe';
    ELSIF v_data_type = 'uuid' THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('STRUCTURE', 'related_id column type', 'text', 'uuid', 'ERROR',
              'Convert uuid to text - run fix migration');
      RAISE NOTICE '   ⚠️ Coluna related_id existe mas tipo é UUID (esperado: text)';
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('STRUCTURE', 'related_id column', 'text', v_data_type, 'OK');
      RAISE NOTICE '   ✅ Coluna related_id existe (%)', v_data_type;
    END IF;
    
    -- Check metadata column
    SELECT data_type INTO v_data_type
    FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata';
    
    IF v_data_type IS NOT NULL THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('STRUCTURE', 'metadata column', 'jsonb', v_data_type, 'OK');
      RAISE NOTICE '   ✅ Coluna metadata existe (%)', v_data_type;
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('STRUCTURE', 'metadata column', 'Exists', 'Missing', 'WARNING',
              'ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT ''{}''');
      RAISE NOTICE '   ⚠️ Coluna metadata NÃO existe (opcional)';
    END IF;
    
    -- Check action_url column
    SELECT data_type INTO v_data_type
    FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_url';
    
    IF v_data_type IS NOT NULL THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('STRUCTURE', 'action_url column', 'text', v_data_type, 'OK');
      RAISE NOTICE '   ✅ Coluna action_url existe (%)', v_data_type;
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('STRUCTURE', 'action_url column', 'Exists', 'Missing', 'WARNING',
              'ALTER TABLE notifications ADD COLUMN action_url text');
      RAISE NOTICE '   ⚠️ Coluna action_url NÃO existe';
    END IF;
    
  ELSE
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('STRUCTURE', 'notifications table', 'Exists', 'Missing', 'ERROR',
            'Create notifications table');
    RAISE NOTICE '❌ Tabela notifications NÃO existe!';
  END IF;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 2: NOTIFICATION_PREFERENCES TABLE
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '2. TABELA NOTIFICATION_PREFERENCES';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'notification_preferences';
    
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('STRUCTURE', 'notification_preferences table', 'Exists', format('Exists (%s columns)', v_count), 'OK');
    RAISE NOTICE '✅ Tabela notification_preferences existe (%s colunas)', v_count;
    
    -- Check for required columns
    FOR v_function_record IN
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'notification_preferences'
      AND column_name IN ('pdi_approved', 'pdi_rejected', 'task_assigned', 'deadline_reminder')
    LOOP
      RAISE NOTICE '   ✅ Coluna % existe', v_function_record.column_name;
    END LOOP;
  ELSE
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('STRUCTURE', 'notification_preferences table', 'Exists', 'Missing', 'ERROR',
            'Run fix migration to create table');
    RAISE NOTICE '❌ Tabela notification_preferences NÃO existe!';
  END IF;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 3: FUNCTIONS
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '3. FUNÇÕES PL/PGSQL';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  -- Check required functions
  FOR v_function_record IN
    SELECT * FROM (VALUES
      ('create_notification_if_enabled'),
      ('notify_pdi_status_change'),
      ('notify_task_assigned'),
      ('notify_group_participant_added'),
      ('notify_group_leader_promoted'),
      ('notify_mentorship_request'),
      ('notify_mentorship_accepted'),
      ('notify_mentorship_session_scheduled'),
      ('send_deadline_reminders')
    ) AS t(function_name)
  LOOP
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = v_function_record.function_name) THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('FUNCTIONS', v_function_record.function_name, 'Exists', 'Exists', 'OK');
      RAISE NOTICE '   ✅ %() existe', v_function_record.function_name;
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('FUNCTIONS', v_function_record.function_name, 'Exists', 'Missing', 'ERROR',
              'Run fix migration');
      RAISE NOTICE '   ❌ %() NÃO existe', v_function_record.function_name;
    END IF;
  END LOOP;
  
  -- Check for conflicting functions (old names)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_group_leader_promotion') THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('FUNCTIONS', 'notify_group_leader_promotion (old)', 'Not exists', 'Exists', 'WARNING',
            'This old function should be replaced by notify_group_leader_promoted');
    RAISE NOTICE '   ⚠️ notify_group_leader_promotion() existe (função antiga, deve ser substituída)';
  END IF;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 4: TRIGGERS
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '4. TRIGGERS ATIVOS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  -- Check required triggers
  FOR v_trigger_record IN
    SELECT * FROM (VALUES
      ('pdi_status_notification', 'pdis'),
      ('task_assigned_notification', 'tasks'),
      ('group_participant_added_notification', 'action_group_participants'),
      ('group_leader_promoted_notification', 'action_group_participants'),
      ('mentorship_accepted_notification', 'mentorships'),
      ('mentorship_session_scheduled_notification', 'mentorship_sessions')
    ) AS t(trigger_name, table_name)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = v_trigger_record.trigger_name
      AND c.relname = v_trigger_record.table_name
    ) THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('TRIGGERS', v_trigger_record.trigger_name || ' ON ' || v_trigger_record.table_name, 
              'Exists', 'Exists', 'OK');
      RAISE NOTICE '   ✅ % ON % existe', v_trigger_record.trigger_name, v_trigger_record.table_name;
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('TRIGGERS', v_trigger_record.trigger_name || ' ON ' || v_trigger_record.table_name, 
              'Exists', 'Missing', 'ERROR', 'Run fix migration');
      RAISE NOTICE '   ❌ % ON % NÃO existe', v_trigger_record.trigger_name, v_trigger_record.table_name;
    END IF;
  END LOOP;
  
  -- Check mentorship_request_notification (could be on mentorships or mentorship_requests)
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'mentorship_request_notification'
  ) THEN
    SELECT c.relname INTO v_data_type
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'mentorship_request_notification'
    LIMIT 1;
    
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('TRIGGERS', 'mentorship_request_notification', 
            'Exists', format('Exists ON %s', v_data_type), 'OK');
    RAISE NOTICE '   ✅ mentorship_request_notification ON % existe', v_data_type;
  ELSE
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('TRIGGERS', 'mentorship_request_notification', 
            'Exists', 'Missing', 'WARNING', 'May need mentorship_requests table');
    RAISE NOTICE '   ⚠️ mentorship_request_notification NÃO existe (necessita mentorship_requests)';
  END IF;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 5: REQUIRED TABLES
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '5. TABELAS RELACIONADAS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  FOR v_function_record IN
    SELECT * FROM (VALUES
      ('pdis'),
      ('tasks'),
      ('action_groups'),
      ('action_group_participants'),
      ('mentorships'),
      ('mentorship_sessions'),
      ('profiles')
    ) AS t(table_name)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = v_function_record.table_name) THEN
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
      VALUES ('TABLES', v_function_record.table_name, 'Exists', 'Exists', 'OK');
      RAISE NOTICE '   ✅ % existe', v_function_record.table_name;
    ELSE
      INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
      VALUES ('TABLES', v_function_record.table_name, 'Exists', 'Missing', 'ERROR',
              'Table required for triggers');
      RAISE NOTICE '   ❌ % NÃO existe', v_function_record.table_name;
    END IF;
  END LOOP;
  
  -- Optional table check
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mentorship_requests') THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('TABLES', 'mentorship_requests (optional)', 'Optional', 'Exists', 'OK');
    RAISE NOTICE '   ✅ mentorship_requests existe (opcional)';
  ELSE
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('TABLES', 'mentorship_requests (optional)', 'Optional', 'Missing', 'OK');
    RAISE NOTICE '   ℹ️ mentorship_requests não existe (opcional)';
  END IF;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 6: INDEXES
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '6. ÍNDICES DE PERFORMANCE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE tablename = 'notifications'
  AND indexname LIKE 'idx_notifications%';
  
  IF v_count >= 4 THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('INDEXES', 'notifications indexes', '>=4', v_count::text, 'OK');
    RAISE NOTICE '   ✅ %s índices criados', v_count;
  ELSIF v_count > 0 THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('INDEXES', 'notifications indexes', '>=4', v_count::text, 'WARNING',
            'Run fix migration to create all indexes');
    RAISE NOTICE '   ⚠️ Apenas %s índices criados (esperado: >=4)', v_count;
  ELSE
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('INDEXES', 'notifications indexes', '>=4', '0', 'WARNING',
            'Run fix migration to create indexes');
    RAISE NOTICE '   ⚠️ Nenhum índice de notificação criado';
  END IF;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- SECTION 7: TEST USERS
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '7. USUÁRIOS DE TESTE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  SELECT COUNT(*) INTO v_count FROM profiles;
  
  IF v_count >= 2 THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status)
    VALUES ('USERS', 'profiles count', '>=2', v_count::text, 'OK');
    RAISE NOTICE '   ✅ %s perfis encontrados (mínimo 2 para testes)', v_count;
  ELSIF v_count = 1 THEN
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('USERS', 'profiles count', '>=2', '1', 'WARNING',
            'Some tests may use same user for both roles');
    RAISE NOTICE '   ⚠️ Apenas 1 perfil encontrado (alguns testes podem falhar)';
  ELSE
    INSERT INTO _diagnostic_results (category, item_name, expected, actual, status, fix_action)
    VALUES ('USERS', 'profiles count', '>=2', '0', 'ERROR',
            'Create test users first');
    RAISE NOTICE '   ❌ Nenhum perfil encontrado!';
  END IF;
  
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- DISPLAY RESULTS
-- ============================================================================

SELECT '════════════════════════════════════════════════════════════════' as "═══════════════════════════════════════════════════════════";
SELECT 'RESUMO DO DIAGNÓSTICO' as title;
SELECT '════════════════════════════════════════════════════════════════' as "═══════════════════════════════════════════════════════════";

-- Summary by category
SELECT 
  category as "Categoria",
  COUNT(*) FILTER (WHERE status = 'OK') as "✅ OK",
  COUNT(*) FILTER (WHERE status = 'WARNING') as "⚠️ Aviso",
  COUNT(*) FILTER (WHERE status = 'ERROR') as "❌ Erro"
FROM _diagnostic_results
GROUP BY category
ORDER BY category;

SELECT '════════════════════════════════════════════════════════════════' as "═══════════════════════════════════════════════════════════";

-- Detailed results
SELECT 
  CASE status
    WHEN 'OK' THEN '✅'
    WHEN 'WARNING' THEN '⚠️'
    WHEN 'ERROR' THEN '❌'
  END as "Status",
  category as "Categoria",
  item_name as "Item",
  expected as "Esperado",
  actual as "Encontrado",
  COALESCE(fix_action, '-') as "Ação para Correção"
FROM _diagnostic_results
ORDER BY 
  CASE status 
    WHEN 'ERROR' THEN 1 
    WHEN 'WARNING' THEN 2 
    ELSE 3 
  END,
  category,
  item_id;

SELECT '════════════════════════════════════════════════════════════════' as "═══════════════════════════════════════════════════════════";

-- Final summary
SELECT 
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'ERROR') = 0 AND COUNT(*) FILTER (WHERE status = 'WARNING') = 0 
    THEN '✅ SISTEMA PRONTO - Todos os triggers configurados corretamente'
    WHEN COUNT(*) FILTER (WHERE status = 'ERROR') = 0 
    THEN '⚠️ SISTEMA FUNCIONAL - Alguns avisos, mas pode funcionar'
    ELSE '❌ CORREÇÃO NECESSÁRIA - Execute 20251201140000_fix_notification_triggers.sql'
  END as "Resultado Final",
  COUNT(*) FILTER (WHERE status = 'ERROR') as "Erros",
  COUNT(*) FILTER (WHERE status = 'WARNING') as "Avisos",
  COUNT(*) FILTER (WHERE status = 'OK') as "OK"
FROM _diagnostic_results;

/*
  ============================================================================
  NEXT STEPS
  ============================================================================
  
  Se houver ERROS (❌):
  1. Execute: 20251201140000_fix_notification_triggers.sql
  2. Re-execute este diagnóstico para verificar
  3. Execute: complete_trigger_validation.sql para validar funcionamento
  
  Se houver apenas AVISOS (⚠️):
  - O sistema pode funcionar, mas considere executar o fix migration
  
  Se tudo estiver OK (✅):
  - Execute complete_trigger_validation.sql para confirmar 100% de sucesso
*/
