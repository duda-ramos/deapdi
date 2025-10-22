-- ═══════════════════════════════════════════════════════════
-- SCRIPT DE AUDITORIA COMPLETA DO BANCO DE DADOS
-- Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- PARTE 1: VALIDAÇÃO CRÍTICA DE RLS (MÁXIMA PRIORIDADE)
-- ═══════════════════════════════════════════════════════════

-- Query 1: Verificar status RLS de TODAS as tabelas
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

-- Query 2: CRÍTICO - Listar tabelas SEM RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- ═══════════════════════════════════════════════════════════
-- PARTE 2: VALIDAR POLÍTICAS RLS DAS TABELAS CRÍTICAS
-- ═══════════════════════════════════════════════════════════

-- Query 3: Verificar políticas existentes nas tabelas críticas
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd as operacao,
  CASE cmd
    WHEN 'SELECT' THEN '🔍 Leitura'
    WHEN 'INSERT' THEN '➕ Inserção'
    WHEN 'UPDATE' THEN '✏️ Atualização'
    WHEN 'DELETE' THEN '🗑️ Exclusão'
    ELSE cmd
  END as tipo_operacao
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles',
    'users_extended',
    'psychological_records',
    'reunioes_psicologia',
    'audit_logs',
    'pdi',
    'pdi_objetivos',
    'avaliacoes_competencias',
    'grupos_acao',
    'notificacoes'
  )
ORDER BY tablename, cmd, policyname;

-- Query 3B: Contagem de políticas por tabela crítica
SELECT 
  tablename,
  COUNT(*) as total_politicas,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as politicas_select,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as politicas_insert,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as politicas_update,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as politicas_delete
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════
-- PARTE 3: VERIFICAR INTEGRIDADE REFERENCIAL
-- ═══════════════════════════════════════════════════════════

-- Query 4: Mapear todas as foreign keys
SELECT
  tc.table_name as tabela_origem,
  kcu.column_name as coluna_origem,
  ccu.table_name as tabela_destino,
  ccu.column_name as coluna_destino,
  rc.update_rule as ao_atualizar,
  rc.delete_rule as ao_deletar
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ═══════════════════════════════════════════════════════════
-- PARTE 4: VERIFICAR ÍNDICES DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════

-- Query 5: Listar índices existentes em tabelas críticas
SELECT
  t.relname as tabela,
  i.relname as indice,
  array_agg(a.attname ORDER BY a.attnum) as colunas,
  CASE 
    WHEN ix.indisunique THEN 'UNIQUE'
    WHEN ix.indisprimary THEN 'PRIMARY KEY'
    ELSE 'INDEX'
  END as tipo
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relkind = 'r'
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND t.relname IN (
    'profiles',
    'pdi',
    'pdi_objetivos',
    'avaliacoes_competencias',
    'grupos_acao',
    'tarefas_grupos',
    'notificacoes',
    'psychological_records',
    'reunioes_psicologia'
  )
GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
ORDER BY t.relname, i.relname;

-- Query 5B: Tabelas sem índices adequados em foreign keys
SELECT DISTINCT
  kcu.table_name as tabela,
  kcu.column_name as coluna_fk,
  'Falta índice em FK' as aviso
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc 
  ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relname = kcu.table_name
      AND a.attname = kcu.column_name
  )
ORDER BY kcu.table_name, kcu.column_name;

-- ═══════════════════════════════════════════════════════════
-- PARTE 5: VALIDAR TRIGGERS E AUTOMAÇÕES
-- ═══════════════════════════════════════════════════════════

-- Query 6: Listar todos os triggers
SELECT
  event_object_table as tabela,
  trigger_name,
  event_manipulation as evento,
  action_timing as momento,
  action_statement as acao
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ═══════════════════════════════════════════════════════════
-- PARTE 6: ANÁLISE DE FUNÇÕES E PROCEDURES
-- ═══════════════════════════════════════════════════════════

-- Query 7: Listar funções personalizadas
SELECT 
  n.nspname as schema,
  p.proname as funcao,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  CASE 
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    WHEN p.provolatile = 'v' THEN 'VOLATILE'
  END as volatilidade,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as seguranca
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ═══════════════════════════════════════════════════════════
-- PARTE 7: VERIFICAÇÃO DE CONSTRAINTS
-- ═══════════════════════════════════════════════════════════

-- Query 8: Listar todas as constraints
SELECT
  tc.table_name as tabela,
  tc.constraint_name as constraint,
  tc.constraint_type as tipo,
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN '🔑 Chave Primária'
    WHEN 'FOREIGN KEY' THEN '🔗 Chave Estrangeira'
    WHEN 'UNIQUE' THEN '✨ Único'
    WHEN 'CHECK' THEN '✓ Validação'
    ELSE tc.constraint_type
  END as tipo_descricao,
  kcu.column_name as coluna
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ═══════════════════════════════════════════════════════════
-- PARTE 8: ANÁLISE DE STORAGE (BUCKETS)
-- ═══════════════════════════════════════════════════════════

-- Query 9: Verificar buckets de storage
SELECT 
  id,
  name,
  public,
  CASE 
    WHEN public THEN '⚠️ PÚBLICO'
    ELSE '🔒 PRIVADO'
  END as acesso,
  created_at
FROM storage.buckets
ORDER BY name;

-- Query 10: Verificar políticas de storage
SELECT 
  bucket_id,
  name as policy_name,
  definition
FROM storage.policies
ORDER BY bucket_id, name;
