-- ═══════════════════════════════════════════════════════════════════
-- QUERIES CORRIGIDAS PARA AUDITORIA RLS - TALENTFLOW
-- Copie e cole diretamente no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- QUERY 1 - STATUS RLS DE TODAS AS TABELAS (ESSENCIAL)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ PROTEGIDO'
    ELSE '🚨 VULNERÁVEL'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- QUERY 2 - TABELAS SEM RLS - VULNERABILIDADES (CRÍTICO)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- QUERY 3 - POLÍTICAS DE TABELAS CRÍTICAS (CRÍTICO)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  tablename, 
  policyname, 
  cmd as operacao,
  roles,
  permissive
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles',
    'psychological_records',
    'emotional_checkins',
    'salary_history',
    'audit_logs',
    'pdis',
    'tasks',
    'competencies',
    'psychology_sessions',
    'therapeutic_activities',
    'mental_health_alerts',
    'consent_records',
    'action_groups',
    'mentorships',
    'mentorship_sessions'
  )
ORDER BY tablename, cmd, policyname;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- QUERY 3B - CONTAGEM DE POLÍTICAS POR TABELA (OPCIONAL)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  tablename,
  COUNT(*) as total_politicas,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as politicas_select,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as politicas_insert,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as politicas_update,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as politicas_delete,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as politicas_all
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- QUERY 4 - TODAS AS POLÍTICAS (OVERVIEW COMPLETO)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  tablename,
  policyname,
  cmd as operacao,
  CASE cmd
    WHEN 'SELECT' THEN '🔍 Leitura'
    WHEN 'INSERT' THEN '➕ Inserção'
    WHEN 'UPDATE' THEN '✏️ Atualização'
    WHEN 'DELETE' THEN '🗑️ Exclusão'
    WHEN 'ALL' THEN '🔓 Todas'
    ELSE cmd
  END as tipo_operacao,
  roles,
  permissive as tipo_politica
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ═══════════════════════════════════════════════════════════════════
-- FIM DAS QUERIES ESSENCIAIS
-- ═══════════════════════════════════════════════════════════════════

/*
INSTRUÇÕES DE USO:

1. Copie a QUERY 1 (linhas 10-18)
2. Cole no SQL Editor do Supabase
3. Clique "Run" ou pressione Ctrl+Enter
4. Copie o resultado completo
5. Cole em RLS_AUDIT_EXECUTION_RESULTS.txt (seção QUERY 1)

6. Repita para QUERY 2 (linhas 25-27)
7. Repita para QUERY 3 (linhas 34-57)
8. Opcionalmente execute QUERY 3B e QUERY 4

VALIDAÇÕES ESPERADAS:

QUERY 1:
✅ Todas as linhas devem ter status = '✅ PROTEGIDO'
✅ Total esperado: 42-46 tabelas
❌ Se alguma linha tem '🚨 VULNERÁVEL': CRÍTICO

QUERY 2:
✅ Deve retornar ZERO LINHAS (vazio)
🚨 Se retornar tabelas: CRÍTICO - documentar imediatamente

QUERY 3:
✅ Cada tabela crítica deve ter pelo menos 2-4 políticas
✅ psychological_records: apenas HR/Admin
✅ salary_history: apenas HR/Admin
✅ emotional_checkins: próprio + HR/Admin (NÃO manager)
✅ audit_logs: apenas Admin
*/
