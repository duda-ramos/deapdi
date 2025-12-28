-- ══════════════════════════════════════════════════════════════════════════════
-- SCRIPT DE VALIDAÇÃO DO PROJETO SUPABASE
-- ══════════════════════════════════════════════════════════════════════════════
-- 
-- Projeto: fvobspjiujcurfugjsxr
-- URL: https://fvobspjiujcurfugjsxr.supabase.co
-- 
-- Este script valida que o projeto Supabase está operacional e configurado
-- corretamente conforme especificações do plano.
--
-- Objetivo: Confirmar configuração, total de tabelas, RLS ativo e autenticação
-- 
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 1: TOTAL DE TABELAS NO SCHEMA PUBLIC
-- ══════════════════════════════════════════════════════════════════════════════
-- Esperado: Aproximadamente 42 tabelas

SELECT 
  '📊 VALIDAÇÃO 1: TOTAL DE TABELAS' as validacao,
  COUNT(*) as total_tabelas,
  CASE 
    WHEN COUNT(*) >= 40 AND COUNT(*) <= 45 THEN '✅ PASS - Total dentro do esperado (40-45 tabelas)'
    WHEN COUNT(*) >= 35 AND COUNT(*) < 40 THEN '⚠️ WARNING - Menos tabelas que o esperado (35-39)'
    WHEN COUNT(*) > 45 THEN '⚠️ WARNING - Mais tabelas que o esperado (>45)'
    ELSE '❌ FAIL - Total de tabelas significativamente diferente'
  END as resultado,
  '~42 tabelas esperadas' as esperado
FROM pg_tables
WHERE schemaname = 'public';

-- Listar todas as tabelas para conferência
SELECT 
  '📋 Lista Completa de Tabelas' as info,
  STRING_AGG(tablename, ', ' ORDER BY tablename) as tabelas
FROM pg_tables
WHERE schemaname = 'public';

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 2: RLS (ROW LEVEL SECURITY) ATIVO EM 100% DAS TABELAS
-- ══════════════════════════════════════════════════════════════════════════════
-- Esperado: 100% das tabelas com RLS habilitado

SELECT 
  '🔒 VALIDAÇÃO 2: STATUS RLS' as validacao,
  COUNT(*) as total_tabelas,
  COUNT(CASE WHEN c.relrowsecurity THEN 1 END) as tabelas_com_rls,
  COUNT(CASE WHEN NOT c.relrowsecurity THEN 1 END) as tabelas_sem_rls,
  ROUND(
    (COUNT(CASE WHEN c.relrowsecurity THEN 1 END)::numeric / 
     NULLIF(COUNT(*), 0) * 100), 2
  ) as percentual_rls,
  CASE 
    WHEN COUNT(CASE WHEN NOT c.relrowsecurity THEN 1 END) = 0 
    THEN '✅ PASS - RLS ativo em 100% das tabelas'
    WHEN COUNT(CASE WHEN NOT c.relrowsecurity THEN 1 END) <= 2
    THEN '⚠️ WARNING - ' || COUNT(CASE WHEN NOT c.relrowsecurity THEN 1 END) || ' tabela(s) sem RLS'
    ELSE '❌ FAIL - ' || COUNT(CASE WHEN NOT c.relrowsecurity THEN 1 END) || ' tabelas sem RLS'
  END as resultado,
  '100% esperado' as esperado
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Listar tabelas SEM RLS (se houver)
SELECT 
  '❌ Tabelas SEM RLS' as alerta,
  t.tablename,
  'ATENÇÃO: Esta tabela não tem Row Level Security habilitado!' as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT c.relrowsecurity;

-- Verificar total de políticas RLS criadas
SELECT 
  '📜 Total de Políticas RLS' as info,
  COUNT(*) as total_politicas,
  COUNT(DISTINCT tablename) as tabelas_com_politicas,
  ROUND(AVG(cnt), 2) as media_politicas_por_tabela
FROM (
  SELECT tablename, COUNT(*) as cnt
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) subq;

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 3: SISTEMA DE AUTENTICAÇÃO HABILITADO
-- ══════════════════════════════════════════════════════════════════════════════
-- Esperado: Schema auth.users existe e está acessível

SELECT 
  '🔐 VALIDAÇÃO 3: SISTEMA DE AUTENTICAÇÃO' as validacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'auth' 
      AND table_name = 'users'
    )
    THEN '✅ PASS - Sistema de autenticação habilitado'
    ELSE '❌ FAIL - Sistema de autenticação não encontrado'
  END as resultado,
  'Schema auth.users ativo' as esperado;

-- Verificar tabelas de autenticação disponíveis
SELECT 
  '🔐 Tabelas de Autenticação' as info,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tabelas_auth
FROM information_schema.tables
WHERE table_schema = 'auth'
  AND table_type = 'BASE TABLE';

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 4: VERIFICAÇÃO DE TABELAS CRÍTICAS
-- ══════════════════════════════════════════════════════════════════════════════
-- Verificar existência das tabelas mais importantes do sistema

WITH tabelas_criticas AS (
  SELECT unnest(ARRAY[
    'profiles',
    'teams',
    'pdis',
    'competencies',
    'action_groups',
    'tasks',
    'emotional_checkins',
    'psychology_sessions',
    'psychological_records',
    'mentorships',
    'mentorship_sessions',
    'notifications',
    'achievements',
    'courses',
    'calendar_events',
    'salary_history',
    'audit_logs',
    'system_config'
  ]) as tabela_esperada
)
SELECT 
  '🎯 VALIDAÇÃO 4: TABELAS CRÍTICAS' as validacao,
  COUNT(*) as total_esperadas,
  COUNT(t.tablename) as total_encontradas,
  COUNT(*) - COUNT(t.tablename) as faltando,
  CASE 
    WHEN COUNT(*) = COUNT(t.tablename) 
    THEN '✅ PASS - Todas as tabelas críticas existem'
    WHEN COUNT(t.tablename)::numeric / COUNT(*) >= 0.9
    THEN '⚠️ WARNING - ' || (COUNT(*) - COUNT(t.tablename)) || ' tabela(s) crítica(s) faltando'
    ELSE '❌ FAIL - Várias tabelas críticas faltando'
  END as resultado
FROM tabelas_criticas tc
LEFT JOIN pg_tables t ON t.tablename = tc.tabela_esperada AND t.schemaname = 'public';

-- Listar quais tabelas críticas estão faltando (se houver)
WITH tabelas_criticas AS (
  SELECT unnest(ARRAY[
    'profiles',
    'teams',
    'pdis',
    'competencies',
    'action_groups',
    'tasks',
    'emotional_checkins',
    'psychology_sessions',
    'psychological_records',
    'mentorships',
    'mentorship_sessions',
    'notifications',
    'achievements',
    'courses',
    'calendar_events',
    'salary_history',
    'audit_logs',
    'system_config'
  ]) as tabela_esperada
)
SELECT 
  '❌ Tabelas Críticas Faltando' as alerta,
  tc.tabela_esperada as tabela,
  'Esta tabela é essencial para o funcionamento do sistema!' as status
FROM tabelas_criticas tc
LEFT JOIN pg_tables t ON t.tablename = tc.tabela_esperada AND t.schemaname = 'public'
WHERE t.tablename IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 5: VERIFICAÇÃO DE FUNÇÕES RPC ESSENCIAIS
-- ══════════════════════════════════════════════════════════════════════════════

WITH funcoes_essenciais AS (
  SELECT unnest(ARRAY[
    'sync_user_role_to_jwt',
    'create_user_profile',
    'get_user_competencies',
    'get_team_members',
    'check_manager_access'
  ]) as funcao_esperada
)
SELECT 
  '⚙️ VALIDAÇÃO 5: FUNÇÕES RPC ESSENCIAIS' as validacao,
  COUNT(*) as total_esperadas,
  COUNT(p.proname) as total_encontradas,
  CASE 
    WHEN COUNT(p.proname) >= 3
    THEN '✅ PASS - Funções essenciais encontradas'
    WHEN COUNT(p.proname) >= 1
    THEN '⚠️ WARNING - Algumas funções faltando'
    ELSE '❌ FAIL - Funções essenciais não encontradas'
  END as resultado
FROM funcoes_essenciais fe
LEFT JOIN pg_proc p ON p.proname = fe.funcao_esperada;

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 6: VERIFICAÇÃO DE ÍNDICES CRÍTICOS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  '📇 VALIDAÇÃO 6: ÍNDICES PARA PERFORMANCE' as validacao,
  COUNT(*) as total_indices,
  CASE 
    WHEN COUNT(*) >= 100 THEN '✅ PASS - Boa cobertura de índices (≥100)'
    WHEN COUNT(*) >= 50 THEN '⚠️ WARNING - Cobertura moderada de índices (50-99)'
    ELSE '❌ FAIL - Poucos índices criados (<50)'
  END as resultado,
  '100+ índices esperados' as esperado
FROM pg_indexes
WHERE schemaname = 'public';

-- ══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 7: VERIFICAÇÃO DE TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  '⚡ VALIDAÇÃO 7: TRIGGERS ATIVOS' as validacao,
  COUNT(*) as total_triggers,
  COUNT(CASE WHEN tgenabled = 'O' THEN 1 END) as triggers_ativos,
  COUNT(CASE WHEN tgenabled != 'O' THEN 1 END) as triggers_desabilitados,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✅ PASS - Boa cobertura de triggers (≥30)'
    WHEN COUNT(*) >= 15 THEN '⚠️ WARNING - Cobertura moderada (15-29)'
    ELSE '❌ FAIL - Poucos triggers (<15)'
  END as resultado,
  '30+ triggers esperados' as esperado
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal;

-- ══════════════════════════════════════════════════════════════════════════════
-- RESUMO FINAL DA VALIDAÇÃO
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══════════════════════════════════════' as separador,
  '📊 RESUMO DA VALIDAÇÃO DO PROJETO' as titulo,
  '═══════════════════════════════════════' as separador2;

SELECT 
  'Projeto Supabase' as item,
  'fvobspjiujcurfugjsxr' as valor;

SELECT 
  'URL' as item,
  'https://fvobspjiujcurfugjsxr.supabase.co' as valor;

SELECT 
  'Data da Validação' as item,
  CURRENT_TIMESTAMP::text as valor;

-- Contagem de recursos principais
SELECT 
  '📦 RECURSOS DO BANCO' as categoria,
  'Tabelas' as recurso,
  COUNT(*)::text as quantidade
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
  '📦 RECURSOS DO BANCO',
  'Políticas RLS',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  '📦 RECURSOS DO BANCO',
  'Funções RPC',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
UNION ALL
SELECT 
  '📦 RECURSOS DO BANCO',
  'Índices',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  '📦 RECURSOS DO BANCO',
  'Triggers',
  COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal;

-- ══════════════════════════════════════════════════════════════════════════════
-- INSTRUÇÕES DE USO
-- ══════════════════════════════════════════════════════════════════════════════
/*

COMO EXECUTAR ESTE SCRIPT:

1. Via Supabase Dashboard (Recomendado):
   - Acesse: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/sql
   - Cole todo este script no editor SQL
   - Clique em "Run" para executar
   - Analise os resultados de cada validação

2. Via psql (Terminal):
   psql "postgresql://postgres:[SUA-SENHA]@db.fvobspjiujcurfugjsxr.supabase.co:5432/postgres" -f SUPABASE_PROJECT_VALIDATION.sql

3. Via Cliente SQL (DBeaver, pgAdmin, etc):
   - Conecte ao banco usando as credenciais do Supabase
   - Abra este arquivo e execute

INTERPRETAÇÃO DOS RESULTADOS:

✅ PASS = Tudo funcionando conforme esperado
⚠️ WARNING = Funcional, mas pode ter problemas menores
❌ FAIL = Problema crítico que precisa ser corrigido

PRÓXIMOS PASSOS:

Se todas as validações passarem:
- O projeto Supabase está corretamente configurado
- O sistema está pronto para desenvolvimento/testes
- Pode prosseguir com as migrações e dados de teste

Se houver falhas:
- Revisar as migrações SQL em /supabase/migrations/
- Executar migrações faltantes
- Verificar permissões e configurações do projeto

*/
