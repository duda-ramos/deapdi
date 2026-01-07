-- ══════════════════════════════════════════════════════════════════════════════
-- AUDITORIA DETALHADA DA ESTRUTURA DO BANCO DE DADOS
-- ══════════════════════════════════════════════════════════════════════════════
-- 
-- Projeto: fvobspjiujcurfugjsxr (TalentFlow)
-- Data: 2025-11-24
-- 
-- Este script coleta informações completas sobre:
-- 1. Políticas RLS por tabela
-- 2. RPC Functions disponíveis
-- 3. Triggers ativos
-- 4. Estrutura completa do banco
-- 
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 1: POLÍTICAS RLS POR TABELA
-- ══════════════════════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════'
\echo 'PARTE 1: POLÍTICAS RLS POR TABELA'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- 1.1: Resumo de políticas por tabela
SELECT 
  '📊 RESUMO: Políticas por Tabela' as secao,
  tablename,
  COUNT(*) as total_politicas,
  COUNT(DISTINCT cmd) as tipos_operacao,
  STRING_AGG(DISTINCT cmd::text, ', ' ORDER BY cmd::text) as operacoes
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_politicas DESC, tablename;

-- 1.2: Total geral de políticas
SELECT 
  '📈 TOTAL GERAL DE POLÍTICAS' as metrica,
  COUNT(*) as total,
  COUNT(DISTINCT tablename) as tabelas_com_politicas,
  ROUND(AVG(cnt), 2) as media_por_tabela,
  MIN(cnt) as minimo,
  MAX(cnt) as maximo
FROM (
  SELECT tablename, COUNT(*) as cnt
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) subq;

-- 1.3: Detalhamento completo de todas as políticas
SELECT 
  '📋 DETALHAMENTO COMPLETO DAS POLÍTICAS' as secao,
  schemaname as schema,
  tablename as tabela,
  policyname as politica,
  cmd as operacao,
  roles as roles,
  CASE 
    WHEN LENGTH(qual) > 100 THEN LEFT(qual, 100) || '...'
    ELSE qual
  END as condicao_using,
  CASE 
    WHEN LENGTH(with_check) > 100 THEN LEFT(with_check, 100) || '...'
    ELSE with_check
  END as condicao_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 1.4: Tabelas sem políticas (se houver)
SELECT 
  '⚠️ TABELAS SEM POLÍTICAS RLS' as alerta,
  t.tablename as tabela,
  'ATENÇÃO: Tabela não tem políticas RLS definidas!' as status
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- 1.5: Análise de políticas por operação
SELECT 
  '📊 POLÍTICAS POR TIPO DE OPERAÇÃO' as secao,
  cmd as operacao,
  COUNT(*) as total,
  COUNT(DISTINCT tablename) as tabelas_afetadas,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2) as percentual
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY cmd
ORDER BY total DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 2: RPC FUNCTIONS DISPONÍVEIS
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'PARTE 2: RPC FUNCTIONS DISPONÍVEIS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- 2.1: Lista completa de functions
SELECT 
  '🔧 LISTA COMPLETA DE FUNCTIONS' as secao,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as argumentos,
  pg_get_function_result(p.oid) as retorno,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatilidade,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as seguranca
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 2.2: Contagem total de functions
SELECT 
  '📈 TOTAL DE FUNCTIONS' as metrica,
  COUNT(*) as total_functions,
  COUNT(CASE WHEN prosecdef THEN 1 END) as security_definer,
  COUNT(CASE WHEN NOT prosecdef THEN 1 END) as security_invoker
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- 2.3: Verificação de functions necessárias
WITH functions_necessarias AS (
  SELECT unnest(ARRAY[
    'unlock_achievement',
    'check_and_unlock_achievements',
    'calculate_career_progress',
    'update_career_stage',
    'notify_career_progression',
    'calculate_course_completion',
    'generate_certificate',
    'update_competencies_from_course',
    'get_user_achievement_stats',
    'manual_check_achievements',
    'sync_user_role_to_jwt',
    'create_user_profile',
    'get_user_competencies',
    'get_team_members',
    'check_manager_access'
  ]) as funcao_necessaria
)
SELECT 
  '✅ STATUS DAS FUNCTIONS NECESSÁRIAS' as secao,
  fn.funcao_necessaria as funcao,
  CASE 
    WHEN p.proname IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Faltando'
  END as status,
  CASE 
    WHEN p.proname IS NOT NULL THEN pg_get_function_arguments(p.oid)
    ELSE 'N/A'
  END as argumentos
FROM functions_necessarias fn
LEFT JOIN pg_proc p ON p.proname = fn.funcao_necessaria
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid AND n.nspname = 'public'
ORDER BY status DESC, fn.funcao_necessaria;

-- 2.4: Functions faltantes (resumo)
WITH functions_necessarias AS (
  SELECT unnest(ARRAY[
    'unlock_achievement',
    'check_and_unlock_achievements',
    'calculate_career_progress',
    'update_career_stage',
    'notify_career_progression',
    'calculate_course_completion',
    'generate_certificate',
    'update_competencies_from_course',
    'get_user_achievement_stats',
    'manual_check_achievements',
    'sync_user_role_to_jwt',
    'create_user_profile',
    'get_user_competencies',
    'get_team_members',
    'check_manager_access'
  ]) as funcao_necessaria
)
SELECT 
  '⚠️ FUNCTIONS FALTANTES' as alerta,
  COUNT(*) as total_necessarias,
  COUNT(p.proname) as encontradas,
  COUNT(*) - COUNT(p.proname) as faltando,
  CASE 
    WHEN COUNT(*) = COUNT(p.proname) THEN '✅ Todas as functions necessárias estão presentes'
    ELSE '⚠️ ' || (COUNT(*) - COUNT(p.proname)) || ' function(s) faltando'
  END as resultado
FROM functions_necessarias fn
LEFT JOIN pg_proc p ON p.proname = fn.funcao_necessaria
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid AND n.nspname = 'public';

-- 2.5: Listar functions faltantes especificamente
WITH functions_necessarias AS (
  SELECT unnest(ARRAY[
    'unlock_achievement',
    'check_and_unlock_achievements',
    'calculate_career_progress',
    'update_career_stage',
    'notify_career_progression',
    'calculate_course_completion',
    'generate_certificate',
    'update_competencies_from_course',
    'get_user_achievement_stats',
    'manual_check_achievements'
  ]) as funcao_necessaria
)
SELECT 
  '❌ LISTA DE FUNCTIONS FALTANTES' as tipo,
  fn.funcao_necessaria as funcao_faltando,
  'Necessária para o sistema funcionar corretamente' as observacao
FROM functions_necessarias fn
LEFT JOIN pg_proc p ON p.proname = fn.funcao_necessaria
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid AND n.nspname = 'public'
WHERE p.proname IS NULL
ORDER BY fn.funcao_necessaria;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 3: TRIGGERS ATIVOS
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'PARTE 3: TRIGGERS ATIVOS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- 3.1: Lista completa de triggers
SELECT 
  '⚡ LISTA COMPLETA DE TRIGGERS' as secao,
  trigger_name as trigger,
  event_object_table as tabela,
  event_manipulation as evento,
  action_timing as timing,
  action_orientation as orientacao,
  CASE 
    WHEN LENGTH(action_statement) > 150 THEN LEFT(action_statement, 150) || '...'
    ELSE action_statement
  END as acao
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, event_manipulation, trigger_name;

-- 3.2: Contagem de triggers
SELECT 
  '📈 TOTAL DE TRIGGERS' as metrica,
  COUNT(*) as total_triggers,
  COUNT(DISTINCT event_object_table) as tabelas_com_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 3.3: Triggers por tabela
SELECT 
  '📊 TRIGGERS POR TABELA' as secao,
  event_object_table as tabela,
  COUNT(*) as total_triggers,
  STRING_AGG(DISTINCT event_manipulation, ', ' ORDER BY event_manipulation) as eventos,
  STRING_AGG(trigger_name, ', ' ORDER BY trigger_name) as lista_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
GROUP BY event_object_table
ORDER BY total_triggers DESC, tabela;

-- 3.4: Triggers por tipo de evento
SELECT 
  '📊 TRIGGERS POR TIPO DE EVENTO' as secao,
  event_manipulation as tipo_evento,
  action_timing as timing,
  COUNT(*) as total,
  COUNT(DISTINCT event_object_table) as tabelas_afetadas
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
GROUP BY event_manipulation, action_timing
ORDER BY total DESC;

-- 3.5: Verificar triggers críticos
WITH triggers_criticos AS (
  SELECT unnest(ARRAY[
    'sync_role_to_jwt_trigger',
    'update_updated_at',
    'on_auth_user_created',
    'create_profile_on_signup'
  ]) as trigger_necessario
)
SELECT 
  '🎯 STATUS DOS TRIGGERS CRÍTICOS' as secao,
  tc.trigger_necessario as trigger,
  CASE 
    WHEN t.trigger_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Faltando'
  END as status,
  COALESCE(t.event_object_table, 'N/A') as tabela,
  COALESCE(t.event_manipulation, 'N/A') as evento
FROM triggers_criticos tc
LEFT JOIN information_schema.triggers t 
  ON t.trigger_name = tc.trigger_necessario 
  AND t.trigger_schema = 'public'
ORDER BY status DESC, tc.trigger_necessario;

-- 3.6: Tabelas sem triggers (informativo)
SELECT 
  'ℹ️ TABELAS SEM TRIGGERS' as info,
  t.tablename as tabela,
  'Tabela não possui triggers (pode ser normal)' as observacao
FROM pg_tables t
LEFT JOIN information_schema.triggers tr 
  ON tr.event_object_table = t.tablename 
  AND tr.trigger_schema = 'public'
WHERE t.schemaname = 'public'
  AND tr.trigger_name IS NULL
ORDER BY t.tablename;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 4: ANÁLISE DE RELACIONAMENTOS (FOREIGN KEYS)
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'PARTE 4: FOREIGN KEYS E RELACIONAMENTOS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- 4.1: Lista completa de foreign keys
SELECT 
  '🔗 LISTA COMPLETA DE FOREIGN KEYS' as secao,
  tc.table_name as tabela_origem,
  kcu.column_name as coluna_origem,
  ccu.table_name as tabela_destino,
  ccu.column_name as coluna_destino,
  rc.delete_rule as on_delete,
  rc.update_rule as on_update
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4.2: Contagem de foreign keys
SELECT 
  '📈 TOTAL DE FOREIGN KEYS' as metrica,
  COUNT(*) as total_fks,
  COUNT(DISTINCT tc.table_name) as tabelas_com_fks
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- 4.3: Foreign keys por tabela
SELECT 
  '📊 FOREIGN KEYS POR TABELA' as secao,
  tc.table_name as tabela,
  COUNT(*) as total_fks,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.column_name) as colunas_fk
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY total_fks DESC, tabela;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 5: ÍNDICES
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'PARTE 5: ÍNDICES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- 5.1: Lista de índices
SELECT 
  '📇 LISTA DE ÍNDICES' as secao,
  schemaname as schema,
  tablename as tabela,
  indexname as indice,
  indexdef as definicao
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5.2: Contagem de índices
SELECT 
  '📈 TOTAL DE ÍNDICES' as metrica,
  COUNT(*) as total_indices,
  COUNT(DISTINCT tablename) as tabelas_com_indices
FROM pg_indexes
WHERE schemaname = 'public';

-- 5.3: Índices por tabela
SELECT 
  '📊 ÍNDICES POR TABELA' as secao,
  tablename as tabela,
  COUNT(*) as total_indices,
  STRING_AGG(indexname, ', ' ORDER BY indexname) as lista_indices
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_indices DESC, tabela;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 6: RESUMO EXECUTIVO
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'PARTE 6: RESUMO EXECUTIVO'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  '╔══════════════════════════════════════════════════════╗' as linha
UNION ALL
SELECT '║  RESUMO EXECUTIVO DA AUDITORIA                   ║'
UNION ALL
SELECT '╠══════════════════════════════════════════════════════╣'
UNION ALL
SELECT '║  Projeto: fvobspjiujcurfugjsxr (TalentFlow)     ║'
UNION ALL
SELECT '║  Data: ' || CURRENT_DATE::text || '                              ║'
UNION ALL
SELECT '╚══════════════════════════════════════════════════════╝';

-- Métricas principais
SELECT 
  '📊 MÉTRICAS PRINCIPAIS' as categoria,
  'Tabelas no Schema Public' as metrica,
  COUNT(*)::text as valor
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
  '📊 MÉTRICAS PRINCIPAIS',
  'Políticas RLS Ativas',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  '📊 MÉTRICAS PRINCIPAIS',
  'RPC Functions',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
UNION ALL
SELECT 
  '📊 MÉTRICAS PRINCIPAIS',
  'Triggers Ativos',
  COUNT(*)::text
FROM information_schema.triggers
WHERE trigger_schema = 'public'
UNION ALL
SELECT 
  '📊 MÉTRICAS PRINCIPAIS',
  'Foreign Keys',
  COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
UNION ALL
SELECT 
  '📊 MÉTRICAS PRINCIPAIS',
  'Índices Criados',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public';

-- Status de validação
SELECT 
  '✅ VALIDAÇÃO' as categoria,
  'RLS em 100% das tabelas' as criterio,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND NOT c.relrowsecurity
    ) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
UNION ALL
SELECT 
  '✅ VALIDAÇÃO',
  'Políticas RLS (~110 esperadas)',
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 100
    THEN '✅ PASS (' || (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public') || ')'
    ELSE '⚠️ WARNING (' || (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public') || ')'
  END
UNION ALL
SELECT 
  '✅ VALIDAÇÃO',
  'RPC Functions (≥10 esperadas)',
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    ) >= 10
    THEN '✅ PASS (' || (
      SELECT COUNT(*)::text 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    ) || ')'
    ELSE '⚠️ WARNING (' || (
      SELECT COUNT(*)::text 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    ) || ')'
  END
UNION ALL
SELECT 
  '✅ VALIDAÇÃO',
  'Triggers de sincronização auth',
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%sync%'
    )
    THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END;

-- ══════════════════════════════════════════════════════════════════════════════
-- FIM DA AUDITORIA
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'AUDITORIA CONCLUÍDA'
\echo 'Revise os resultados acima para identificar issues'
\echo '═══════════════════════════════════════════════════════════════'
