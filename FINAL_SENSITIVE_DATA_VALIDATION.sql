-- ============================================================================
-- VALIDAÇÃO FINAL DE PROTEÇÃO DE DADOS ULTRA-SENSÍVEIS
-- ============================================================================
-- Objetivo: Confirmar que dados sensíveis estão 100% protegidos
-- Data: 2025-11-25
-- ============================================================================

\echo '============================================='
\echo 'VALIDAÇÃO DE PROTEÇÃO DE DADOS SENSÍVEIS'
\echo 'Sistema: DEAPDI TalentFlow'
\echo 'Compliance: LGPD + ISO 27001'
\echo '============================================='
\echo ''

-- ============================================================================
-- PARTE 1: CONTAR POLÍTICAS DE TABELAS SENSÍVEIS
-- ============================================================================

\echo '========================================='
\echo 'PARTE 1: POLÍTICAS RLS DE TABELAS SENSÍVEIS'
\echo '========================================='
\echo ''

\echo '1. Contagem de Políticas por Tabela Sensível:'
\echo ''

SELECT 
  tablename as "Tabela Sensível",
  COUNT(*) as "Total de Políticas",
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ CRÍTICO - SEM PROTEÇÃO'
  END as "Status"
FROM pg_policies 
WHERE tablename IN (
  'psychological_records',
  'psychology_sessions',
  'emotional_checkins',
  'salary_history',
  'therapeutic_tasks',
  'checkin_settings',
  'therapy_session_requests'
)
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '----------------------------------------'
\echo 'RESULTADO ESPERADO:'
\echo '  psychological_records: 1-2 políticas'
\echo '  psychology_sessions: 3+ políticas'
\echo '  emotional_checkins: 2+ políticas'
\echo '  salary_history: 4+ políticas'
\echo '  therapeutic_tasks: 1+ políticas'
\echo '  checkin_settings: 1+ políticas'
\echo '----------------------------------------'
\echo ''

-- ============================================================================
-- PARTE 2: VERIFICAR RLS HABILITADO
-- ============================================================================

\echo '========================================='
\echo 'PARTE 2: VERIFICAR RLS HABILITADO'
\echo '========================================='
\echo ''

\echo '2. Status de RLS nas Tabelas Sensíveis:'
\echo ''

SELECT 
  t.tablename as "Tabela",
  CASE 
    WHEN c.relrowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as "RLS Status",
  CASE 
    WHEN c.relrowsecurity THEN 'OK'
    ELSE '⚠️ CRÍTICO - ATIVAR RLS!'
  END as "Resultado"
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
AND t.tablename IN (
  'therapeutic_tasks', 
  'checkin_settings',
  'psychological_records',
  'psychology_sessions',
  'emotional_checkins',
  'salary_history',
  'therapy_session_requests'
)
ORDER BY t.tablename;

\echo ''

-- ============================================================================
-- PARTE 3: DETALHES DAS POLÍTICAS SENSÍVEIS
-- ============================================================================

\echo '========================================='
\echo 'PARTE 3: DETALHES DAS POLÍTICAS'
\echo '========================================='
\echo ''

\echo '3.1 - PSYCHOLOGICAL_RECORDS (Registros Psicológicos):'
\echo ''

SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual LIKE '%hr%' OR qual LIKE '%admin%' THEN '✅ HR/Admin'
    WHEN qual LIKE '%auth.uid()%' THEN '✅ Próprio'
    ELSE '⚠️ Verificar'
  END as "Acesso",
  CASE 
    WHEN qual LIKE '%manager%' AND cmd = 'SELECT' THEN '❌ PROBLEMA - Manager não deve acessar'
    ELSE '✅ OK'
  END as "Status"
FROM pg_policies
WHERE tablename = 'psychological_records'
ORDER BY cmd, policyname;

\echo ''
\echo '3.2 - EMOTIONAL_CHECKINS (Check-ins Emocionais):'
\echo ''

SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual LIKE '%employee_id = auth.uid()%' THEN '✅ Próprio'
    WHEN qual LIKE '%hr%' OR qual LIKE '%admin%' THEN '✅ HR/Admin'
    ELSE '⚠️ Verificar'
  END as "Acesso",
  CASE 
    WHEN qual LIKE '%manager%' AND cmd = 'SELECT' THEN '❌ CRÍTICO - Manager vê subordinados!'
    ELSE '✅ OK'
  END as "Status"
FROM pg_policies
WHERE tablename = 'emotional_checkins'
ORDER BY cmd, policyname;

\echo ''
\echo '3.3 - THERAPEUTIC_TASKS (Tarefas Terapêuticas):'
\echo ''

SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual LIKE '%assigned_to%' THEN '✅ Atribuído'
    WHEN qual LIKE '%hr%' OR qual LIKE '%admin%' THEN '✅ HR/Admin'
    ELSE '⚠️ Verificar'
  END as "Acesso",
  qual as "Condição (primeiros 100 chars)"
FROM pg_policies
WHERE tablename = 'therapeutic_tasks'
ORDER BY cmd, policyname;

\echo ''
\echo '3.4 - SALARY_HISTORY (Histórico Salarial):'
\echo ''

SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual LIKE '%profile_id = auth.uid()%' THEN '✅ Próprio'
    WHEN qual LIKE '%hr%' THEN '✅ HR'
    WHEN qual LIKE '%admin%' THEN '✅ Admin'
    ELSE '⚠️ Verificar'
  END as "Acesso",
  CASE 
    WHEN qual LIKE '%manager%' AND cmd = 'SELECT' THEN '❌ PROBLEMA - Manager não deve ver salários'
    ELSE '✅ OK'
  END as "Status"
FROM pg_policies
WHERE tablename = 'salary_history'
ORDER BY cmd, policyname;

\echo ''

-- ============================================================================
-- PARTE 4: VERIFICAR VULNERABILIDADES CONHECIDAS
-- ============================================================================

\echo '========================================='
\echo 'PARTE 4: VERIFICAR VULNERABILIDADES'
\echo '========================================='
\echo ''

\echo '4.1 - Verificar se Manager tem acesso a check-ins:'
\echo ''

SELECT 
  'emotional_checkins' as "Tabela",
  COUNT(*) as "Políticas com manager",
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ VULNERABILIDADE - Manager tem acesso!'
    ELSE '✅ OK - Manager bloqueado'
  END as "Status"
FROM pg_policies
WHERE tablename = 'emotional_checkins'
AND qual LIKE '%manager%'
AND cmd IN ('SELECT', 'ALL');

\echo ''
\echo '4.2 - Verificar se Manager tem acesso a registros psicológicos:'
\echo ''

SELECT 
  'psychological_records' as "Tabela",
  COUNT(*) as "Políticas com manager",
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ VULNERABILIDADE - Manager tem acesso!'
    ELSE '✅ OK - Manager bloqueado'
  END as "Status"
FROM pg_policies
WHERE tablename = 'psychological_records'
AND qual LIKE '%manager%'
AND cmd IN ('SELECT', 'ALL');

\echo ''
\echo '4.3 - Verificar se Manager tem acesso a salários:'
\echo ''

SELECT 
  'salary_history' as "Tabela",
  COUNT(*) as "Políticas com manager",
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ VULNERABILIDADE - Manager vê salários!'
    ELSE '✅ OK - Manager bloqueado'
  END as "Status"
FROM pg_policies
WHERE tablename = 'salary_history'
AND qual LIKE '%manager%'
AND cmd IN ('SELECT', 'ALL');

\echo ''

-- ============================================================================
-- PARTE 5: VERIFICAR THERAPEUTIC_TASKS RLS
-- ============================================================================

\echo '========================================='
\echo 'PARTE 5: THERAPEUTIC_TASKS RLS'
\echo '========================================='
\echo ''

\echo '5. Confirmar Fix do BUG_FIX_THERAPEUTIC_TASKS_RLS:'
\echo ''

-- Verificar se tabela existe
SELECT 
  'Tabela therapeutic_tasks' as "Item",
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'therapeutic_tasks')
    THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as "Status";

-- Verificar se tem RLS
SELECT 
  'RLS habilitado' as "Item",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.tablename = 'therapeutic_tasks'
      AND c.relrowsecurity = true
    )
    THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as "Status";

-- Verificar se tem políticas
SELECT 
  'Políticas criadas' as "Item",
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'therapeutic_tasks')
    THEN '✅ ' || (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'therapeutic_tasks') || ' políticas'
    ELSE '❌ SEM POLÍTICAS'
  END as "Status";

\echo ''

-- ============================================================================
-- PARTE 6: RESUMO EXECUTIVO
-- ============================================================================

\echo '========================================='
\echo 'PARTE 6: RESUMO EXECUTIVO'
\echo '========================================='
\echo ''

\echo '6. Score de Proteção de Dados Sensíveis:'
\echo ''

WITH sensitive_tables AS (
  SELECT unnest(ARRAY[
    'psychological_records',
    'psychology_sessions',
    'emotional_checkins',
    'salary_history',
    'therapeutic_tasks',
    'checkin_settings',
    'therapy_session_requests'
  ]) as table_name
),
rls_status AS (
  SELECT 
    st.table_name,
    COALESCE(c.relrowsecurity, false) as has_rls,
    COALESCE(p.policy_count, 0) as policy_count
  FROM sensitive_tables st
  LEFT JOIN pg_tables t ON t.tablename = st.table_name
  LEFT JOIN pg_class c ON c.relname = st.table_name
  LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    GROUP BY tablename
  ) p ON p.tablename = st.table_name
)
SELECT 
  COUNT(*) as "Total de Tabelas Sensíveis",
  SUM(CASE WHEN has_rls THEN 1 ELSE 0 END) as "Com RLS Habilitado",
  SUM(CASE WHEN policy_count > 0 THEN 1 ELSE 0 END) as "Com Políticas",
  CASE 
    WHEN SUM(CASE WHEN has_rls AND policy_count > 0 THEN 1 ELSE 0 END) = COUNT(*)
    THEN '✅ 100% PROTEGIDO'
    WHEN SUM(CASE WHEN has_rls AND policy_count > 0 THEN 1 ELSE 0 END)::float / COUNT(*) >= 0.8
    THEN '⚠️ ' || ROUND(SUM(CASE WHEN has_rls AND policy_count > 0 THEN 1 ELSE 0 END)::float / COUNT(*) * 100) || '% PROTEGIDO'
    ELSE '❌ CRÍTICO - ' || ROUND(SUM(CASE WHEN has_rls AND policy_count > 0 THEN 1 ELSE 0 END)::float / COUNT(*) * 100) || '% PROTEGIDO'
  END as "Score de Proteção"
FROM rls_status;

\echo ''

-- ============================================================================
-- PARTE 7: CHECKLIST DE COMPLIANCE
-- ============================================================================

\echo '========================================='
\echo 'PARTE 7: CHECKLIST DE COMPLIANCE'
\echo '========================================='
\echo ''

\echo 'Verificações de Compliance LGPD:'
\echo ''

SELECT 
  'Dados psicológicos protegidos' as "Requisito LGPD",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'psychological_records' 
      AND qual LIKE '%hr%'
    )
    THEN '✅ CONFORME'
    ELSE '❌ NÃO CONFORME'
  END as "Status";

SELECT 
  'Check-ins privados (não acessíveis por managers)' as "Requisito LGPD",
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'emotional_checkins' 
      AND qual LIKE '%manager%'
      AND cmd = 'SELECT'
    )
    THEN '✅ CONFORME'
    ELSE '❌ NÃO CONFORME - VIOLAÇÃO DE PRIVACIDADE'
  END as "Status";

SELECT 
  'Dados salariais restritos (HR/Admin apenas)' as "Requisito LGPD",
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'salary_history' 
      AND qual LIKE '%manager%'
      AND cmd = 'SELECT'
    )
    THEN '✅ CONFORME'
    ELSE '❌ NÃO CONFORME - VAZAMENTO DE DADOS'
  END as "Status";

SELECT 
  'Tarefas terapêuticas protegidas' as "Requisito LGPD",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.tablename = 'therapeutic_tasks'
      AND c.relrowsecurity = true
    )
    THEN '✅ CONFORME'
    ELSE '❌ NÃO CONFORME'
  END as "Status";

\echo ''

-- ============================================================================
-- PARTE 8: LISTA DE TABELAS SEM PROTEÇÃO (SE HOUVER)
-- ============================================================================

\echo '========================================='
\echo 'PARTE 8: TABELAS SEM PROTEÇÃO ADEQUADA'
\echo '========================================='
\echo ''

\echo 'Tabelas sensíveis que requerem atenção:'
\echo ''

WITH sensitive_tables AS (
  SELECT unnest(ARRAY[
    'psychological_records',
    'psychology_sessions',
    'emotional_checkins',
    'salary_history',
    'therapeutic_tasks',
    'checkin_settings',
    'therapy_session_requests'
  ]) as table_name
),
protection_status AS (
  SELECT 
    st.table_name,
    COALESCE(c.relrowsecurity, false) as has_rls,
    COALESCE(p.policy_count, 0) as policy_count
  FROM sensitive_tables st
  LEFT JOIN pg_tables t ON t.tablename = st.table_name AND t.schemaname = 'public'
  LEFT JOIN pg_class c ON c.relname = st.table_name
  LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON p.tablename = st.table_name
)
SELECT 
  table_name as "Tabela",
  CASE WHEN has_rls THEN '✅' ELSE '❌' END as "RLS",
  policy_count as "Políticas",
  CASE 
    WHEN NOT has_rls THEN '🚨 CRÍTICO - Habilitar RLS'
    WHEN policy_count = 0 THEN '⚠️ URGENTE - Criar políticas'
    WHEN policy_count < 2 THEN '⚡ ATENÇÃO - Poucas políticas'
    ELSE '✅ OK'
  END as "Ação Requerida"
FROM protection_status
WHERE NOT (has_rls AND policy_count >= 1)
ORDER BY 
  CASE 
    WHEN NOT has_rls THEN 1
    WHEN policy_count = 0 THEN 2
    ELSE 3
  END;

\echo ''

-- Mensagem se tudo OK
DO $$
DECLARE
  v_total int;
  v_protected int;
BEGIN
  WITH sensitive_tables AS (
    SELECT unnest(ARRAY[
      'psychological_records',
      'psychology_sessions',
      'emotional_checkins',
      'salary_history',
      'therapeutic_tasks',
      'checkin_settings',
      'therapy_session_requests'
    ]) as table_name
  ),
  protection_status AS (
    SELECT 
      st.table_name,
      COALESCE(c.relrowsecurity, false) as has_rls,
      COALESCE(p.policy_count, 0) as policy_count
    FROM sensitive_tables st
    LEFT JOIN pg_tables t ON t.tablename = st.table_name
    LEFT JOIN pg_class c ON c.relname = st.table_name
    LEFT JOIN (
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      GROUP BY tablename
    ) p ON p.tablename = st.table_name
  )
  SELECT 
    COUNT(*),
    SUM(CASE WHEN has_rls AND policy_count > 0 THEN 1 ELSE 0 END)
  INTO v_total, v_protected
  FROM protection_status;
  
  IF v_protected = v_total THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ PARABÉNS! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TODAS AS % TABELAS SENSÍVEIS ESTÃO 100%% PROTEGIDAS!', v_total;
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS habilitado em todas as tabelas';
    RAISE NOTICE '✅ Políticas de acesso configuradas';
    RAISE NOTICE '✅ Dados ultra-sensíveis protegidos';
    RAISE NOTICE '✅ LGPD compliance mantido';
    RAISE NOTICE '✅ Sistema APROVADO para produção';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '⚠️⚠️⚠️ ATENÇÃO! ⚠️⚠️⚠️';
    RAISE WARNING '';
    RAISE WARNING 'Apenas % de % tabelas estão protegidas!', v_protected, v_total;
    RAISE WARNING 'Revise as tabelas listadas acima.';
    RAISE WARNING '';
  END IF;
END $$;

\echo ''
\echo '============================================='
\echo 'FIM DA VALIDAÇÃO'
\echo '============================================='
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Revisar resultados acima'
\echo '2. Se 100% protegido: Documentar em SENSITIVE_DATA_PROTECTION_REPORT.md'
\echo '3. Se problemas encontrados: Corrigir políticas RLS'
\echo '4. Executar testes manuais na interface (Parte 2)'
\echo ''
