/*
  # Script de Validação de Políticas RLS

  Este script valida que todas as políticas RLS estão funcionando corretamente
  e que não há brechas de segurança no sistema.

  Execute este script regularmente após mudanças no schema ou políticas.
*/

-- ============================================================================
-- SEÇÃO 1: VERIFICAÇÕES DE ESTRUTURA
-- ============================================================================

-- 1.1: Verificar que todas as tabelas têm RLS habilitado
SELECT
  'RLS Status Check' as test_name,
  CASE
    WHEN COUNT(CASE WHEN NOT rowsecurity THEN 1 END) = 0
    THEN '✅ PASS: Todas as tabelas têm RLS habilitado'
    ELSE '❌ FAIL: ' || COUNT(CASE WHEN NOT rowsecurity THEN 1 END) || ' tabelas sem RLS'
  END as result,
  STRING_AGG(
    CASE WHEN NOT rowsecurity THEN tablename END,
    ', '
  ) as tables_without_rls
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public';

-- 1.2: Verificar que todas as tabelas têm pelo menos uma política
SELECT
  'Policy Presence Check' as test_name,
  CASE
    WHEN COUNT(DISTINCT t.tablename) = COUNT(DISTINCT p.tablename)
    THEN '✅ PASS: Todas as tabelas têm políticas'
    ELSE '⚠️ WARNING: Algumas tabelas podem não ter políticas'
  END as result,
  COUNT(DISTINCT t.tablename) as total_tables,
  COUNT(DISTINCT p.tablename) as tables_with_policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public';

-- 1.3: Contar políticas por tabela
SELECT
  'Policy Count by Table' as test_name,
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- 1.4: Verificar que função de sincronização JWT existe
SELECT
  'JWT Sync Function Check' as test_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'sync_user_role_to_jwt'
    )
    THEN '✅ PASS: Função de sincronização JWT existe'
    ELSE '❌ FAIL: Função de sincronização JWT não encontrada'
  END as result;

-- 1.5: Verificar que trigger de sincronização está ativo
SELECT
  'JWT Sync Trigger Check' as test_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'sync_role_to_jwt_trigger'
    )
    THEN '✅ PASS: Trigger de sincronização ativo'
    ELSE '❌ FAIL: Trigger de sincronização não encontrado'
  END as result;

-- ============================================================================
-- SEÇÃO 2: VERIFICAÇÕES DE SEGURANÇA CRÍTICAS
-- ============================================================================

-- 2.1: Verificar que dados salariais estão protegidos
SELECT
  'Salary Protection Check' as test_name,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'salary_history'
      AND (
        (cmd = 'SELECT' AND qual LIKE '%manager%')
        OR (cmd = 'ALL' AND qual NOT LIKE '%hr%' AND qual NOT LIKE '%admin%')
      )
    )
    THEN '✅ PASS: Salary history protegido (apenas HR/Admin)'
    ELSE '⚠️ WARNING: Possível vazamento de dados salariais'
  END as result;

-- 2.2: Verificar que registros psicológicos estão ultra-protegidos
SELECT
  'Psychological Records Protection' as test_name,
  CASE
    WHEN COUNT(*) = 1 AND
         MAX(qual) LIKE '%hr%' AND
         MAX(qual) LIKE '%admin%'
    THEN '✅ PASS: Registros psicológicos ultra-protegidos'
    ELSE '⚠️ WARNING: Proteção de registros psicológicos pode estar comprometida'
  END as result
FROM pg_policies
WHERE tablename = 'psychological_records';

-- 2.3: Verificar que emotional_checkins não são acessíveis por managers
SELECT
  'Emotional Checkins Privacy' as test_name,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'emotional_checkins'
      AND qual LIKE '%manager%'
      AND cmd IN ('SELECT', 'ALL')
    )
    THEN '✅ PASS: Check-ins emocionais privados (managers não acessam)'
    ELSE '❌ FAIL: Managers podem acessar emotional_checkins!'
  END as result;

-- 2.4: Verificar que system_config é apenas para admin
SELECT
  'System Config Admin Only' as test_name,
  CASE
    WHEN COUNT(*) = 1 AND
         MAX(qual) LIKE '%admin%' AND
         MAX(qual) NOT LIKE '%hr%'
    THEN '✅ PASS: system_config restrito a admin'
    ELSE '⚠️ WARNING: system_config pode ser acessível por não-admins'
  END as result
FROM pg_policies
WHERE tablename = 'system_config';

-- 2.5: Verificar que profiles não tem recursão
SELECT
  'Profiles No Recursion Check' as test_name,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'profiles'
      AND (
        qual LIKE '%FROM profiles%'
        OR with_check LIKE '%FROM profiles%'
      )
      AND policyname NOT LIKE '%manager_team_read%' -- Exception: esta política usa profiles corretamente
    )
    THEN '✅ PASS: Políticas de profiles sem recursão'
    ELSE '⚠️ WARNING: Possível recursão em políticas de profiles'
  END as result;

-- ============================================================================
-- SEÇÃO 3: VERIFICAÇÕES DE ÍNDICES
-- ============================================================================

-- 3.1: Verificar índices críticos existem
WITH required_indexes AS (
  SELECT unnest(ARRAY[
    'idx_profiles_manager_id',
    'idx_profiles_role',
    'idx_action_groups_created_by',
    'idx_tasks_assignee',
    'idx_competencies_profile',
    'idx_pdis_profile',
    'idx_salary_profile'
  ]) as index_name
)
SELECT
  'Critical Indexes Check' as test_name,
  CASE
    WHEN COUNT(DISTINCT ri.index_name) = COUNT(DISTINCT i.indexname)
    THEN '✅ PASS: Todos os índices críticos existem'
    ELSE '⚠️ WARNING: ' || (COUNT(DISTINCT ri.index_name) - COUNT(DISTINCT i.indexname)) || ' índices faltando'
  END as result,
  STRING_AGG(
    CASE WHEN i.indexname IS NULL THEN ri.index_name END,
    ', '
  ) as missing_indexes
FROM required_indexes ri
LEFT JOIN pg_indexes i ON i.indexname = ri.index_name AND i.schemaname = 'public';

-- ============================================================================
-- SEÇÃO 4: VERIFICAÇÕES DE PADRÕES DE POLÍTICA
-- ============================================================================

-- 4.1: Verificar uso de JWT para roles
SELECT
  'JWT Usage for Roles' as test_name,
  COUNT(CASE WHEN qual LIKE '%auth.jwt()%user_role%' THEN 1 END) as policies_using_jwt,
  COUNT(CASE WHEN qual LIKE '%profiles.role%' AND qual LIKE '%FROM profiles%' THEN 1 END) as policies_with_subquery,
  CASE
    WHEN COUNT(CASE WHEN qual LIKE '%auth.jwt()%user_role%' THEN 1 END) >
         COUNT(CASE WHEN qual LIKE '%profiles.role%' AND qual LIKE '%FROM profiles%' THEN 1 END)
    THEN '✅ PASS: Maioria das políticas usa JWT (melhor performance)'
    ELSE '⚠️ WARNING: Muitas políticas com subqueries (pode causar problemas)'
  END as result
FROM pg_policies
WHERE schemaname = 'public';

-- 4.2: Verificar separação de SELECT vs INSERT/UPDATE/DELETE
SELECT
  'Policy Operation Separation' as test_name,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as all_operations,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_only,
  COUNT(CASE WHEN cmd IN ('INSERT', 'UPDATE', 'DELETE') THEN 1 END) as specific_operations,
  CASE
    WHEN COUNT(CASE WHEN cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') THEN 1 END) >
         COUNT(CASE WHEN cmd = 'ALL' THEN 1 END)
    THEN '✅ PASS: Boa separação de operações'
    ELSE '⚠️ INFO: Muitas políticas ALL (considere separar)'
  END as result
FROM pg_policies
WHERE schemaname = 'public';

-- 4.3: Identificar políticas com USING (true) - potencialmente perigosas
SELECT
  'Open Access Policies' as test_name,
  tablename,
  policyname,
  cmd,
  '⚠️ WARNING: Política com acesso aberto' as status
FROM pg_policies
WHERE schemaname = 'public'
AND qual = 'true'
AND policyname NOT LIKE '%system%'
AND policyname NOT LIKE '%read_all%'
AND policyname NOT LIKE '%public%'
ORDER BY tablename;

-- ============================================================================
-- SEÇÃO 5: MATRIZ DE PERMISSÕES (SUMMARY)
-- ============================================================================

-- 5.1: Resumo de permissões por role
SELECT
  'Permission Matrix Summary' as test_name,
  tablename,
  BOOL_OR(qual LIKE '%auth.uid()%') as has_own_access,
  BOOL_OR(qual LIKE '%manager%') as has_manager_access,
  BOOL_OR(qual LIKE '%hr%') as has_hr_access,
  BOOL_OR(qual LIKE '%admin%') as has_admin_access,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SEÇÃO 6: VERIFICAÇÃO DE SINCRONIZAÇÃO JWT
-- ============================================================================

-- 6.1: Verificar se todos os profiles têm role sincronizado no JWT
-- NOTA: Este teste só funciona se houver usuários no sistema
SELECT
  'JWT Role Sync Check' as test_name,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN u.raw_app_meta_data->>'user_role' IS NOT NULL THEN 1 END) as synced_profiles,
  CASE
    WHEN COUNT(*) = COUNT(CASE WHEN u.raw_app_meta_data->>'user_role' IS NOT NULL THEN 1 END)
    THEN '✅ PASS: Todos os profiles têm role sincronizado no JWT'
    WHEN COUNT(*) = 0
    THEN 'ℹ️ INFO: Nenhum usuário no sistema ainda'
    ELSE '⚠️ WARNING: ' || (COUNT(*) - COUNT(CASE WHEN u.raw_app_meta_data->>'user_role' IS NOT NULL THEN 1 END)) || ' profiles sem role no JWT'
  END as result
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id;

-- ============================================================================
-- SEÇÃO 7: RECOMENDAÇÕES FINAIS
-- ============================================================================

SELECT
  '=== RELATÓRIO DE VALIDAÇÃO RLS ===' as section_title,
  'Execute este script após qualquer mudança em políticas' as recommendation_1,
  'Monitore logs de acesso negado (PGRST301)' as recommendation_2,
  'Teste cada role manualmente após deploy' as recommendation_3,
  'Revise políticas sensíveis mensalmente' as recommendation_4;

-- ============================================================================
-- COMANDOS ÚTEIS PARA DEBUG
-- ============================================================================

/*
-- Ver política específica em detalhe
SELECT * FROM pg_policies
WHERE tablename = 'table_name'
AND policyname = 'policy_name';

-- Ver todas as políticas de uma tabela
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'table_name'
ORDER BY cmd, policyname;

-- Testar se user tem role no JWT (substitua user_id)
SELECT
  p.id,
  p.email,
  p.role as profile_role,
  u.raw_app_meta_data->>'user_role' as jwt_role,
  CASE
    WHEN p.role::text = u.raw_app_meta_data->>'user_role'
    THEN '✅ SYNCED'
    ELSE '❌ OUT OF SYNC'
  END as sync_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = 'user-uuid-here';

-- Forçar sincronização de um usuário específico
UPDATE profiles
SET role = role
WHERE id = 'user-uuid-here';

-- Ver todas as tables sem RLS
SELECT tablename
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND NOT rowsecurity;

-- Contar total de políticas no sistema
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
*/