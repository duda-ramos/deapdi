-- ============================================================================
-- TESTES PARA FUNÇÕES RPC CRÍTICAS
-- ============================================================================
-- 
-- Como executar:
-- psql -U postgres -d seu_banco -f CRITICAL_RPC_FUNCTIONS_TESTS.sql
--
-- Ou no Supabase SQL Editor, copie e cole este arquivo
-- ============================================================================

-- Começar transação de teste (ROLLBACK no final para não afetar dados)
BEGIN;

-- ============================================================================
-- SETUP: Criar dados de teste
-- ============================================================================

-- Inserir usuários de teste
INSERT INTO profiles (id, name, email, role, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'João Mentor', 'mentor@test.com', 'colaborador', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Maria Mentorada', 'mentee@test.com', 'colaborador', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Pedro Gestor', 'manager@test.com', 'manager', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Ana Colaboradora', 'collab@test.com', 'colaborador', 'active')
ON CONFLICT (id) DO NOTHING;

-- Configurar Ana como subordinada de Pedro
UPDATE profiles 
SET manager_id = '33333333-3333-3333-3333-333333333333'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Inserir mentoria de teste
INSERT INTO mentorships (id, mentor_id, mentee_id, status)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir PDI de teste
INSERT INTO pdis (id, profile_id, manager_id, title, status, related_competency)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'Aprender TypeScript',
  'in-progress',
  'TypeScript'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir trilha de carreira
INSERT INTO career_tracks (profile_id, current_stage, progress)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Júnior',
  45
)
ON CONFLICT (profile_id) DO NOTHING;

-- ============================================================================
-- TESTE 1: schedule_mentorship_session
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'TESTE 1: schedule_mentorship_session'
\echo '========================================='

-- Caso 1.1: Agendamento bem-sucedido
\echo ''
\echo '1.1 - Agendamento bem-sucedido'
DO $$
DECLARE
  v_session_id uuid;
BEGIN
  SELECT schedule_mentorship_session(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2025-11-15 10:00:00+00'::timestamptz,
    60,
    'https://meet.google.com/test'
  ) INTO v_session_id;
  
  IF v_session_id IS NOT NULL THEN
    RAISE NOTICE '✅ PASSOU: Sessão agendada com ID %', v_session_id;
    
    -- Verificar que sessão foi criada
    IF EXISTS (SELECT 1 FROM mentorship_sessions WHERE id = v_session_id) THEN
      RAISE NOTICE '✅ PASSOU: Sessão existe no banco';
    ELSE
      RAISE WARNING '❌ FALHOU: Sessão não foi criada no banco';
    END IF;
    
    -- Verificar notificações
    IF (SELECT COUNT(*) FROM notifications WHERE related_id = v_session_id::text) = 2 THEN
      RAISE NOTICE '✅ PASSOU: 2 notificações criadas (mentor + mentorado)';
    ELSE
      RAISE WARNING '❌ FALHOU: Notificações não foram criadas corretamente';
    END IF;
  ELSE
    RAISE WARNING '❌ FALHOU: Função retornou NULL';
  END IF;
END $$;

-- Caso 1.2: Mentoria inexistente (deve falhar)
\echo ''
\echo '1.2 - Mentoria inexistente (deve falhar)'
DO $$
DECLARE
  v_session_id uuid;
BEGIN
  BEGIN
    SELECT schedule_mentorship_session(
      gen_random_uuid(),
      now(),
      60,
      NULL
    ) INTO v_session_id;
    
    RAISE WARNING '❌ FALHOU: Deveria ter lançado exceção';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASSOU: Exceção lançada corretamente: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- TESTE 2: complete_mentorship_session
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'TESTE 2: complete_mentorship_session'
\echo '========================================='

-- Caso 2.1: Conclusão bem-sucedida
\echo ''
\echo '2.1 - Conclusão bem-sucedida'
DO $$
DECLARE
  v_session_id uuid;
  v_sessions_before integer;
  v_sessions_after integer;
BEGIN
  -- Criar sessão para testar
  SELECT schedule_mentorship_session(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2025-11-20 14:00:00+00'::timestamptz,
    60,
    NULL
  ) INTO v_session_id;
  
  -- Contar sessões antes
  SELECT sessions_completed INTO v_sessions_before
  FROM mentorships
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  
  -- Completar sessão
  PERFORM complete_mentorship_session(v_session_id, 'Ótima sessão, muito produtiva!');
  
  -- Verificar status
  IF (SELECT status FROM mentorship_sessions WHERE id = v_session_id) = 'completed' THEN
    RAISE NOTICE '✅ PASSOU: Sessão marcada como completed';
  ELSE
    RAISE WARNING '❌ FALHOU: Sessão não está completed';
  END IF;
  
  -- Verificar contador
  SELECT sessions_completed INTO v_sessions_after
  FROM mentorships
  WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  
  IF v_sessions_after = COALESCE(v_sessions_before, 0) + 1 THEN
    RAISE NOTICE '✅ PASSOU: Contador de sessões incrementado';
  ELSE
    RAISE WARNING '❌ FALHOU: Contador não foi incrementado corretamente';
  END IF;
END $$;

-- Caso 2.2: Sessão inexistente (deve falhar)
\echo ''
\echo '2.2 - Sessão inexistente (deve falhar)'
DO $$
BEGIN
  BEGIN
    PERFORM complete_mentorship_session(gen_random_uuid(), 'Notas');
    RAISE WARNING '❌ FALHOU: Deveria ter lançado exceção';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASSOU: Exceção lançada corretamente: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- TESTE 3: get_user_dashboard_data
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'TESTE 3: get_user_dashboard_data'
\echo '========================================='

-- Caso 3.1: Dashboard de colaborador
\echo ''
\echo '3.1 - Dashboard de colaborador'
DO $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT get_user_dashboard_data(
    '44444444-4444-4444-4444-444444444444',
    'colaborador'
  ) INTO v_result;
  
  IF v_result IS NOT NULL THEN
    RAISE NOTICE '✅ PASSOU: Função retornou dados';
    
    -- Verificar campos obrigatórios
    IF v_result ? 'pdis' AND v_result ? 'competencies' AND v_result ? 'total_points' THEN
      RAISE NOTICE '✅ PASSOU: Campos obrigatórios presentes';
    ELSE
      RAISE WARNING '❌ FALHOU: Campos obrigatórios faltando';
    END IF;
    
    -- Verificar que dados de gestor NÃO estão presentes
    IF NOT (v_result ? 'team_size') THEN
      RAISE NOTICE '✅ PASSOU: Dados de gestor não presentes (correto)';
    ELSE
      RAISE WARNING '❌ FALHOU: Dados de gestor presentes (incorreto)';
    END IF;
    
    -- Exibir resultado (apenas em dev)
    -- RAISE NOTICE 'Resultado: %', v_result;
  ELSE
    RAISE WARNING '❌ FALHOU: Função retornou NULL';
  END IF;
END $$;

-- Caso 3.2: Dashboard de gestor
\echo ''
\echo '3.2 - Dashboard de gestor'
DO $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT get_user_dashboard_data(
    '33333333-3333-3333-3333-333333333333',
    'manager'
  ) INTO v_result;
  
  IF v_result IS NOT NULL THEN
    RAISE NOTICE '✅ PASSOU: Função retornou dados';
    
    -- Verificar que dados de gestor ESTÃO presentes
    IF v_result ? 'team_size' AND v_result ? 'pending_pdi_validations' THEN
      RAISE NOTICE '✅ PASSOU: Dados de gestor presentes';
    ELSE
      RAISE WARNING '❌ FALHOU: Dados de gestor faltando';
    END IF;
    
    -- Verificar team_size
    IF (v_result->>'team_size')::integer >= 1 THEN
      RAISE NOTICE '✅ PASSOU: Team size >= 1 (Ana é subordinada)';
    ELSE
      RAISE WARNING '❌ FALHOU: Team size incorreto';
    END IF;
  ELSE
    RAISE WARNING '❌ FALHOU: Função retornou NULL';
  END IF;
END $$;

-- ============================================================================
-- TESTE 4: get_team_performance
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'TESTE 4: get_team_performance'
\echo '========================================='

-- Caso 4.1: Performance do gestor
\echo ''
\echo '4.1 - Performance do gestor Pedro'
DO $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT get_team_performance(
    '33333333-3333-3333-3333-333333333333',
    'month'
  ) INTO v_result;
  
  IF v_result IS NOT NULL THEN
    RAISE NOTICE '✅ PASSOU: Função retornou dados';
    
    -- Verificar campos obrigatórios
    IF v_result ? 'team_size' 
       AND v_result ? 'avg_career_progress' 
       AND v_result ? 'top_performers' THEN
      RAISE NOTICE '✅ PASSOU: Campos obrigatórios presentes';
    ELSE
      RAISE WARNING '❌ FALHOU: Campos obrigatórios faltando';
    END IF;
    
    -- Verificar team_size
    IF (v_result->>'team_size')::integer = 1 THEN
      RAISE NOTICE '✅ PASSOU: Team size correto (1 subordinado)';
    ELSE
      RAISE WARNING '❌ FALHOU: Team size incorreto: %', v_result->>'team_size';
    END IF;
    
    -- Exibir resultado (apenas em dev)
    -- RAISE NOTICE 'Resultado: %', v_result;
  ELSE
    RAISE WARNING '❌ FALHOU: Função retornou NULL';
  END IF;
END $$;

-- Caso 4.2: Períodos diferentes
\echo ''
\echo '4.2 - Testar períodos diferentes'
DO $$
DECLARE
  v_result_week jsonb;
  v_result_quarter jsonb;
BEGIN
  SELECT get_team_performance(
    '33333333-3333-3333-3333-333333333333',
    'week'
  ) INTO v_result_week;
  
  SELECT get_team_performance(
    '33333333-3333-3333-3333-333333333333',
    'quarter'
  ) INTO v_result_quarter;
  
  IF (v_result_week->>'period') = 'week' AND (v_result_quarter->>'period') = 'quarter' THEN
    RAISE NOTICE '✅ PASSOU: Períodos aplicados corretamente';
  ELSE
    RAISE WARNING '❌ FALHOU: Períodos incorretos';
  END IF;
END $$;

-- ============================================================================
-- TESTE 5: complete_pdi_objetivo
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'TESTE 5: complete_pdi_objetivo'
\echo '========================================='

-- Caso 5.1: Conclusão bem-sucedida
\echo ''
\echo '5.1 - Conclusão bem-sucedida'
DO $$
DECLARE
  v_result jsonb;
  v_points_before integer;
  v_points_after integer;
  v_pdi_status text;
BEGIN
  -- Pegar pontos antes
  SELECT points INTO v_points_before
  FROM profiles
  WHERE id = '44444444-4444-4444-4444-444444444444';
  
  -- Completar PDI
  SELECT complete_pdi_objetivo(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'Concluí todos os exercícios e projetos!'
  ) INTO v_result;
  
  IF v_result IS NOT NULL THEN
    RAISE NOTICE '✅ PASSOU: Função retornou resultado';
    
    -- Verificar status do PDI
    SELECT status INTO v_pdi_status
    FROM pdis
    WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    IF v_pdi_status = 'aguardando_validacao_gestor' THEN
      RAISE NOTICE '✅ PASSOU: PDI em status aguardando_validacao_gestor';
    ELSE
      RAISE WARNING '❌ FALHOU: Status incorreto: %', v_pdi_status;
    END IF;
    
    -- Verificar pontos
    SELECT points INTO v_points_after
    FROM profiles
    WHERE id = '44444444-4444-4444-4444-444444444444';
    
    IF v_points_after > COALESCE(v_points_before, 0) THEN
      RAISE NOTICE '✅ PASSOU: Pontos incrementados de % para %', 
        COALESCE(v_points_before, 0), v_points_after;
    ELSE
      RAISE WARNING '❌ FALHOU: Pontos não foram incrementados';
    END IF;
    
    -- Verificar notificação para gestor
    IF EXISTS (
      SELECT 1 FROM notifications
      WHERE profile_id = '33333333-3333-3333-3333-333333333333'
      AND related_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    ) THEN
      RAISE NOTICE '✅ PASSOU: Notificação criada para gestor';
    ELSE
      RAISE WARNING '❌ FALHOU: Notificação para gestor não criada';
    END IF;
    
    -- Exibir resultado
    RAISE NOTICE 'Resultado: %', v_result;
  ELSE
    RAISE WARNING '❌ FALHOU: Função retornou NULL';
  END IF;
END $$;

-- Caso 5.2: PDI de outro usuário (deve falhar)
\echo ''
\echo '5.2 - Tentar completar PDI de outro usuário (deve falhar)'
DO $$
BEGIN
  BEGIN
    PERFORM complete_pdi_objetivo(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      '11111111-1111-1111-1111-111111111111', -- João tentando completar PDI da Ana
      'Hack attempt'
    );
    
    RAISE WARNING '❌ FALHOU: Deveria ter lançado exceção';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASSOU: Exceção lançada corretamente: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- RESUMO DOS TESTES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'RESUMO DOS TESTES'
\echo '========================================='
\echo ''
\echo 'Execute este arquivo e veja se todos os testes passaram.'
\echo 'Procure por:'
\echo '  ✅ PASSOU - Teste bem-sucedido'
\echo '  ❌ FALHOU - Teste falhou'
\echo ''
\echo 'Se todos passaram, as funções críticas estão funcionando corretamente!'
\echo ''

-- ============================================================================
-- ROLLBACK para não afetar banco
-- ============================================================================

ROLLBACK;

\echo ''
\echo '⚠️  ROLLBACK executado - nenhum dado foi alterado no banco'
\echo ''
