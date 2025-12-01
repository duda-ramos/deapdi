-- =============================================================================
-- TalentFlow - Script de Validação de Backup/Restore
-- =============================================================================
-- 
-- Execute este script após um restore para validar integridade dos dados.
-- Pode ser executado no SQL Editor do Supabase ou via CLI.
--
-- Uso via CLI:
--   psql $DATABASE_URL < scripts/validate-backup.sql
--
-- =============================================================================

\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║         TalentFlow - Validação de Backup/Restore          ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- =============================================================================
-- 1. CONTAGEM DE REGISTROS POR TABELA
-- =============================================================================

\echo '📊 1. Contagem de Registros por Tabela'
\echo '────────────────────────────────────────────────────────────────'

SELECT 
    'user_profiles' as tabela, 
    COUNT(*) as registros,
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END as status
FROM user_profiles
UNION ALL
SELECT 'individual_development_plans', COUNT(*), 
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END
FROM individual_development_plans
UNION ALL
SELECT 'goals', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END
FROM goals
UNION ALL
SELECT 'competency_assessments', COUNT(*),
    CASE WHEN COUNT(*) >= 0 THEN '✓' ELSE '⚠' END
FROM competency_assessments
UNION ALL
SELECT 'notifications', COUNT(*),
    CASE WHEN COUNT(*) >= 0 THEN '✓' ELSE '⚠' END
FROM notifications
UNION ALL
SELECT 'resources', COUNT(*),
    CASE WHEN COUNT(*) >= 0 THEN '✓' ELSE '⚠' END
FROM resources
UNION ALL
SELECT 'departments', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END
FROM departments
ORDER BY tabela;

\echo ''

-- =============================================================================
-- 2. VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL
-- =============================================================================

\echo '🔗 2. Verificação de Integridade Referencial'
\echo '────────────────────────────────────────────────────────────────'

SELECT 
    'PDIs sem usuário válido' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '❌ ERRO' END as status
FROM individual_development_plans idp
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = idp.user_id
)
UNION ALL
SELECT 'Goals sem PDI válido', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '❌ ERRO' END
FROM goals g
WHERE pdi_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM individual_development_plans idp WHERE idp.id = g.pdi_id
)
UNION ALL
SELECT 'Notificações sem usuário', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '❌ ERRO' END
FROM notifications n
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = n.user_id
)
UNION ALL
SELECT 'Usuários sem departamento válido', COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '⚠ AVISO' END
FROM user_profiles up
WHERE department_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.id = up.department_id
);

\echo ''

-- =============================================================================
-- 3. VERIFICAÇÃO DE RLS POLICIES
-- =============================================================================

\echo '🔐 3. Verificação de RLS Policies'
\echo '────────────────────────────────────────────────────────────────'

SELECT 
    tablename as tabela,
    COUNT(*) as policies,
    CASE WHEN COUNT(*) > 0 THEN '✓ Protegida' ELSE '⚠ Sem RLS' END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- Tabelas sem RLS
\echo '⚠️  Tabelas sem RLS habilitado:'
SELECT 
    t.tablename,
    '❌ RLS desabilitado' as status
FROM pg_tables t
LEFT JOIN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND p.tablename IS NULL
AND t.tablename NOT LIKE 'pg_%'
AND t.tablename NOT LIKE '_prisma%'
ORDER BY t.tablename;

\echo ''

-- =============================================================================
-- 4. VERIFICAÇÃO DE FUNÇÕES CRÍTICAS
-- =============================================================================

\echo '⚙️  4. Verificação de Funções Críticas'
\echo '────────────────────────────────────────────────────────────────'

SELECT 
    routine_name as funcao,
    routine_type as tipo,
    '✓ Presente' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'sync_user_role',
    'get_user_role',
    'handle_new_user',
    'calculate_pdi_progress',
    'create_notification',
    'notify_pdi_created',
    'notify_goal_completed'
)
ORDER BY routine_name;

\echo ''

-- =============================================================================
-- 5. VERIFICAÇÃO DE TRIGGERS
-- =============================================================================

\echo '🔔 5. Verificação de Triggers'
\echo '────────────────────────────────────────────────────────────────'

SELECT 
    trigger_name,
    event_object_table as tabela,
    action_timing || ' ' || event_manipulation as evento,
    '✓ Ativo' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''

-- =============================================================================
-- 6. VERIFICAÇÃO DE ÍNDICES
-- =============================================================================

\echo '📇 6. Verificação de Índices Críticos'
\echo '────────────────────────────────────────────────────────────────'

SELECT 
    tablename as tabela,
    indexname as indice,
    '✓ Presente' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
    indexname LIKE '%pkey%'
    OR indexname LIKE '%user_id%'
    OR indexname LIKE '%created_at%'
)
ORDER BY tablename, indexname
LIMIT 20;

\echo ''

-- =============================================================================
-- 7. RESUMO
-- =============================================================================

\echo '════════════════════════════════════════════════════════════════'
\echo '📋 RESUMO DA VALIDAÇÃO'
\echo '════════════════════════════════════════════════════════════════'

SELECT 
    'Total de usuários' as metrica,
    COUNT(*)::text as valor
FROM user_profiles
UNION ALL
SELECT 'Total de PDIs', COUNT(*)::text FROM individual_development_plans
UNION ALL
SELECT 'Total de goals', COUNT(*)::text FROM goals
UNION ALL
SELECT 'Total de notificações', COUNT(*)::text FROM notifications
UNION ALL
SELECT 'Policies RLS ativas', COUNT(*)::text FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Funções públicas', COUNT(*)::text FROM information_schema.routines WHERE routine_schema = 'public'
UNION ALL
SELECT 'Triggers ativos', COUNT(*)::text FROM information_schema.triggers WHERE trigger_schema = 'public';

\echo ''
\echo '✅ Validação concluída!'
\echo ''
\echo 'Se todos os itens estão marcados com ✓, o backup foi restaurado corretamente.'
\echo 'Itens com ⚠ devem ser verificados manualmente.'
\echo 'Itens com ❌ indicam problemas que precisam ser corrigidos.'
\echo ''
