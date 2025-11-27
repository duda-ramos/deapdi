-- ============================================
-- PERFORMANCE VALIDATION QUERIES
-- TalentFlow System
-- ============================================
-- Execute no Supabase SQL Editor
-- Data: 26/11/2025
-- ============================================

-- ============================================
-- SEÇÃO 1: DIAGNÓSTICO GERAL
-- ============================================

-- 1.1 Verificar uso de índices em tabelas principais
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as "Times Used",
  pg_size_pretty(pg_relation_size(indexrelid)) as "Size"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- ESPERADO: Todos os índices críticos com idx_scan > 0


-- 1.2 Cache hit ratio (deve ser > 95%)
SELECT 
  'Index Cache Hit Rate' as metric,
  ROUND(sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0) * 100, 2) as percentage
FROM pg_statio_user_indexes
UNION ALL
SELECT 
  'Table Cache Hit Rate' as metric,
  ROUND(sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2) as percentage
FROM pg_statio_user_tables;

-- ESPERADO: Ambos > 95%
-- SE < 90%: Problema de memória, aumentar shared_buffers


-- 1.3 Tabelas com mais sequential scans (candidatas para índices)
SELECT 
  schemaname,
  tablename,
  seq_scan as "Sequential Scans",
  seq_tup_read as "Rows Read",
  idx_scan as "Index Scans",
  ROUND((idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) as "Index Usage %",
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Table Size"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 15;

-- ESPERADO: Index Usage % > 80% para tabelas grandes
-- SE < 50%: Avaliar criação de índices


-- 1.4 Database size e crescimento
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as "Database Size",
  (SELECT count(*) FROM profiles) as "Total Users",
  (SELECT count(*) FROM pdis) as "Total PDIs",
  (SELECT count(*) FROM tasks) as "Total Tasks",
  (SELECT count(*) FROM notifications) as "Total Notifications";


-- ============================================
-- SEÇÃO 2: VERIFICAÇÃO DE ÍNDICES CRÍTICOS
-- ============================================

-- 2.1 Verificar existência dos índices essenciais
SELECT 
  'idx_notifications_profile' as index_name,
  CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_profile') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'idx_pdis_profile',
  CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pdis_profile') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'idx_tasks_assignee',
  CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_assignee') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'idx_competencies_profile',
  CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_competencies_profile') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'idx_profiles_manager_id',
  CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_manager_id') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'idx_action_group_participants_lookup',
  CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_action_group_participants_lookup') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END;


-- 2.2 Listar TODOS os índices do sistema
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================
-- SEÇÃO 3: QUERIES CRÍTICAS - EXPLAIN ANALYZE
-- ============================================

-- 3.1 Query Crítica #1: Listagem de PDIs
-- Substitua USER_ID_HERE por um UUID real de teste
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  pdis.*,
  mentor.name as mentor_name,
  mentor.email as mentor_email,
  created_by_profile.name as created_by_name
FROM pdis
LEFT JOIN profiles mentor ON pdis.mentor_id = mentor.id
LEFT JOIN profiles created_by_profile ON pdis.created_by = created_by_profile.id
WHERE pdis.profile_id = (SELECT id FROM profiles WHERE role = 'employee' LIMIT 1)
ORDER BY pdis.created_at DESC
LIMIT 20;

-- ESPERADO: 
-- - Planning Time: < 5ms
-- - Execution Time: < 50ms
-- - Index Scan usando idx_pdis_profile
-- - Nested Loop para JOINs


-- 3.2 Query Crítica #2: Dashboard de Gestor
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  p.id,
  p.name,
  p.email,
  p.position,
  p.level,
  p.points,
  t.name as team_name,
  m.name as manager_name
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN profiles m ON p.manager_id = m.id
WHERE p.manager_id = (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1)
AND p.status = 'active'
ORDER BY p.name;

-- ESPERADO:
-- - Execution Time: < 100ms para 50 subordinados
-- - Index Scan usando idx_profiles_manager_id


-- 3.3 Query Crítica #3: Notificações Não Lidas
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  title,
  message,
  type,
  created_at,
  read,
  link
FROM notifications
WHERE profile_id = (SELECT id FROM profiles LIMIT 1)
AND read = false
ORDER BY created_at DESC
LIMIT 20;

-- ESPERADO:
-- - Execution Time: < 30ms
-- - Index Scan usando idx_notifications_profile
-- NOTA: Se Sequential Scan, criar índice composto recomendado


-- 3.4 Query Crítica #4: Competências por Usuário
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  name,
  description,
  category,
  self_rating,
  manager_rating,
  target_level,
  created_at,
  updated_at
FROM competencies
WHERE profile_id = (SELECT id FROM profiles LIMIT 1)
ORDER BY name;

-- ESPERADO:
-- - Execution Time: < 30ms
-- - Index Scan usando idx_competencies_profile


-- 3.5 Query Crítica #5: Tasks de Grupos de Ação
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.deadline,
  t.assignee_id,
  t.group_id
FROM tasks t
INNER JOIN action_group_participants agp 
  ON t.group_id = agp.group_id
WHERE agp.profile_id = (SELECT id FROM profiles LIMIT 1)
AND t.status = 'done'
ORDER BY t.completed_at DESC;

-- ESPERADO:
-- - Execution Time: < 80ms
-- - Index Scan em idx_action_group_participants_lookup
-- - Index Scan em idx_tasks_group


-- ============================================
-- SEÇÃO 4: RPC FUNCTIONS PERFORMANCE
-- ============================================

-- 4.1 Achievement Stats Function
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_user_achievement_stats(
  (SELECT id FROM profiles LIMIT 1)
);

-- ESPERADO: < 200ms


-- 4.2 Manual Check Achievements
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM manual_check_achievements(
  (SELECT id FROM profiles LIMIT 1)
);

-- ESPERADO: < 500ms (executa múltiplas verificações)


-- ============================================
-- SEÇÃO 5: BLOAT E OTIMIZAÇÃO
-- ============================================

-- 5.1 Table bloat (excesso de espaço não utilizado)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Total Size",
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Table Size",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "Indexes Size",
  ROUND((pg_total_relation_size(schemaname||'.'||tablename)::numeric / NULLIF(pg_relation_size(schemaname||'.'||tablename), 0)), 2) as "Bloat Factor"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 15;

-- ESPERADO: Bloat Factor < 5
-- SE > 10: VACUUM FULL recomendado


-- 5.2 Índices não utilizados (candidatos para remoção)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as "Index Size"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- AÇÃO: Avaliar remoção se Size > 1MB e sem uso por 30+ dias


-- ============================================
-- SEÇÃO 6: LOCKS E DEADLOCKS
-- ============================================

-- 6.1 Active locks
SELECT 
  locktype,
  relation::regclass,
  mode,
  granted,
  pid
FROM pg_locks
WHERE NOT granted
ORDER BY relation;

-- ESPERADO: Nenhum resultado (sem locks não-granted)


-- 6.2 Deadlocks histórico
SELECT 
  datname,
  deadlocks,
  conflicts,
  temp_files,
  temp_bytes
FROM pg_stat_database
WHERE datname = current_database();

-- ESPERADO: deadlocks = 0


-- ============================================
-- SEÇÃO 7: SLOW QUERIES (se pg_stat_statements habilitado)
-- ============================================

-- 7.1 Habilitar pg_stat_statements (executar uma vez)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 7.2 Top 10 queries mais lentas
SELECT 
  calls,
  ROUND(mean_exec_time::numeric, 2) as "Avg Time (ms)",
  ROUND(max_exec_time::numeric, 2) as "Max Time (ms)",
  ROUND((total_exec_time / 1000)::numeric, 2) as "Total Time (s)",
  LEFT(query, 100) as "Query Preview"
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ESPERADO: mean_exec_time < 500ms para queries principais


-- 7.3 Queries mais executadas
SELECT 
  calls,
  ROUND(mean_exec_time::numeric, 2) as "Avg Time (ms)",
  ROUND((total_exec_time / 1000)::numeric, 2) as "Total Time (s)",
  LEFT(query, 100) as "Query Preview"
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 10;


-- ============================================
-- SEÇÃO 8: RLS POLICIES PERFORMANCE
-- ============================================

-- 8.1 Verificar políticas RLS habilitadas
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ESPERADO: Todas as tabelas com RLS Enabled = true


-- 8.2 Contar políticas por tabela
SELECT 
  schemaname,
  tablename,
  count(*) as "Number of Policies"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY count(*) DESC;


-- 8.3 Listar políticas recursivas (deve retornar vazio)
SELECT 
  schemaname,
  tablename,
  policyname,
  definition
FROM pg_policies
WHERE schemaname = 'public'
AND definition LIKE '%RECURSIVE%';

-- ESPERADO: 0 resultados (RLS não-recursivo)


-- ============================================
-- SEÇÃO 9: ÍNDICES RECOMENDADOS (CRIAR SE NECESSÁRIO)
-- ============================================

-- 9.1 Índice composto para notificações não lidas
-- Cria índice parcial para otimizar query mais comum
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_profile_unread 
ON notifications(profile_id, created_at DESC)
WHERE read = false;

-- Benefício: 40-60% melhoria em query de notificações não lidas


-- 9.2 Índice composto para tasks por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_status 
ON tasks(assignee_id, status, deadline);

-- Benefício: 30% melhoria em dashboard de tasks


-- 9.3 Índice para course progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_progress_enrollment
ON course_progress(enrollment_id, completed_at);

-- Benefício: Dashboard de aprendizado mais rápido


-- 9.4 Índice para achievements por data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_profile_unlocked
ON achievements(profile_id, unlocked_at DESC);

-- Benefício: Listagem de conquistas mais rápida


-- ============================================
-- SEÇÃO 10: VERIFICAÇÃO FINAL
-- ============================================

-- 10.1 Summary Report
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
  'Total Tables',
  count(*)::text
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total Indexes',
  count(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Tables with RLS',
  count(*)::text
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
UNION ALL
SELECT 
  'Total RLS Policies',
  count(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Cache Hit Rate',
  ROUND(sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2)::text || '%'
FROM pg_statio_user_tables;


-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
-- 1. Execute cada seção separadamente no Supabase SQL Editor
-- 2. Documente os resultados de cada query
-- 3. Compare com valores esperados indicados nos comentários
-- 4. Seção 9 contém índices recomendados - executar se necessário
-- 5. CONCURRENTLY permite criar índices sem lock de tabela
-- 6. Substitua USER_ID_HERE por UUIDs reais de teste
-- ============================================

-- RESULTADO ESPERADO GERAL:
-- ✅ Cache hit rate > 95%
-- ✅ Index usage > 80% em tabelas principais
-- ✅ Query times < 500ms
-- ✅ Zero deadlocks
-- ✅ Bloat factor < 5
-- ✅ RLS habilitado em todas as tabelas
-- ============================================
