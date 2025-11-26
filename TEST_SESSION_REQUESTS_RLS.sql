-- ============================================================================
-- TESTE DE RLS: session_requests
-- ============================================================================
-- Objetivo: Verificar se tabela existe e tem RLS configurado
-- Data: 2025-11-25
-- ============================================================================

\echo '============================================='
\echo 'TESTE RLS: session_requests'
\echo '============================================='
\echo ''

-- ============================================================================
-- PARTE 1: VERIFICAR SE TABELA EXISTE
-- ============================================================================

\echo '========================================='
\echo 'PARTE 1: VERIFICAR EXISTÊNCIA DA TABELA'
\echo '========================================='
\echo ''

DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'session_requests'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '✅ Tabela session_requests EXISTE';
  ELSE
    RAISE NOTICE '❌ Tabela session_requests NÃO EXISTE';
    RAISE NOTICE '';
    RAISE NOTICE 'Verificando variações do nome...';
  END IF;
END $$;

\echo ''

-- Procurar tabelas com nomes similares
\echo 'Tabelas com "session" no nome:'
\echo ''

SELECT 
  tablename as "Tabela Encontrada",
  'public' as "Schema"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%session%'
ORDER BY tablename;

\echo ''

-- Procurar tabelas com "request" no nome
\echo 'Tabelas com "request" no nome:'
\echo ''

SELECT 
  tablename as "Tabela Encontrada",
  'public' as "Schema"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%request%'
ORDER BY tablename;

\echo ''

-- ============================================================================
-- PARTE 2: VERIFICAR RLS (SE TABELA EXISTIR)
-- ============================================================================

\echo '========================================='
\echo 'PARTE 2: VERIFICAR RLS'
\echo '========================================='
\echo ''

DO $$
DECLARE
  v_exists boolean;
  v_rls_enabled boolean;
BEGIN
  -- Verificar se tabela existe
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_requests'
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Verificar RLS
    SELECT c.relrowsecurity
    INTO v_rls_enabled
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.tablename = 'session_requests';
    
    IF v_rls_enabled THEN
      RAISE NOTICE '✅ RLS HABILITADO em session_requests';
    ELSE
      RAISE NOTICE '❌ RLS DESABILITADO em session_requests';
      RAISE NOTICE '⚠️ AÇÃO REQUERIDA: Habilitar RLS';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Tabela session_requests não existe - pulando teste de RLS';
  END IF;
END $$;

\echo ''

-- Query detalhada de RLS
SELECT 
  t.tablename as "Tabela",
  CASE 
    WHEN c.relrowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as "RLS Status"
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename = 'session_requests';

\echo ''

-- ============================================================================
-- PARTE 3: VERIFICAR POLÍTICAS (SE TABELA EXISTIR)
-- ============================================================================

\echo '========================================='
\echo 'PARTE 3: VERIFICAR POLÍTICAS RLS'
\echo '========================================='
\echo ''

DO $$
DECLARE
  v_exists boolean;
  v_policy_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_requests'
  ) INTO v_exists;
  
  IF v_exists THEN
    SELECT COUNT(*)
    INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'session_requests';
    
    IF v_policy_count > 0 THEN
      RAISE NOTICE '✅ % política(s) encontrada(s)', v_policy_count;
    ELSE
      RAISE NOTICE '❌ NENHUMA política encontrada';
      RAISE NOTICE '⚠️ AÇÃO REQUERIDA: Criar políticas de acesso';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Tabela não existe - sem políticas para verificar';
  END IF;
END $$;

\echo ''

-- Listar políticas detalhadas
\echo 'Políticas Configuradas:'
\echo ''

SELECT 
  policyname as "Nome da Política",
  cmd as "Comando",
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN '✅ Próprio'
    WHEN qual LIKE '%hr%' OR qual LIKE '%admin%' THEN '✅ HR/Admin'
    WHEN qual LIKE '%manager%' THEN '⚠️ Manager'
    ELSE '❓ Verificar'
  END as "Tipo de Acesso",
  LEFT(qual, 100) as "Condição (primeiros 100 chars)"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'session_requests'
ORDER BY cmd, policyname;

\echo ''

-- ============================================================================
-- PARTE 4: VERIFICAR ESTRUTURA DA TABELA (SE EXISTIR)
-- ============================================================================

\echo '========================================='
\echo 'PARTE 4: ESTRUTURA DA TABELA'
\echo '========================================='
\echo ''

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'session_requests') THEN
    RAISE NOTICE 'Estrutura da tabela session_requests:';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela não existe - sem estrutura para mostrar';
  END IF;
END $$;

\echo ''

SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  CASE 
    WHEN is_nullable = 'YES' THEN 'Null'
    ELSE 'Not Null'
  END as "Nullable",
  column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'session_requests'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- PARTE 5: ANÁLISE DE SEGURANÇA
-- ============================================================================

\echo '========================================='
\echo 'PARTE 5: ANÁLISE DE SEGURANÇA'
\echo '========================================='
\echo ''

DO $$
DECLARE
  v_exists boolean;
  v_rls_enabled boolean;
  v_policy_count integer;
  v_has_user_column boolean;
BEGIN
  -- Verificar existência
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_requests'
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'RESULTADO: TABELA NÃO EXISTE';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Status: ℹ️ Tabela session_requests não existe no banco';
    RAISE NOTICE '';
    RAISE NOTICE 'Possíveis cenários:';
    RAISE NOTICE '  1. Tabela tem outro nome (verificar tabelas com "session" ou "request")';
    RAISE NOTICE '  2. Tabela não foi criada ainda';
    RAISE NOTICE '  3. Migration pendente de aplicação';
    RAISE NOTICE '';
    RAISE NOTICE 'Ação: Verificar listagem de tabelas acima';
    RETURN;
  END IF;
  
  -- Tabela existe - verificar segurança
  SELECT c.relrowsecurity
  INTO v_rls_enabled
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.tablename = 'session_requests';
  
  SELECT COUNT(*)
  INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'session_requests';
  
  -- Verificar se tem coluna de usuário
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_requests'
    AND column_name IN ('user_id', 'employee_id', 'profile_id', 'created_by')
  ) INTO v_has_user_column;
  
  -- Resultado
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'ANÁLISE DE SEGURANÇA: session_requests';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabela existe: ✅ SIM';
  RAISE NOTICE 'RLS habilitado: %', CASE WHEN v_rls_enabled THEN '✅ SIM' ELSE '❌ NÃO' END;
  RAISE NOTICE 'Políticas criadas: % política(s)', v_policy_count;
  RAISE NOTICE 'Coluna de usuário: %', CASE WHEN v_has_user_column THEN '✅ SIM' ELSE '❌ NÃO' END;
  RAISE NOTICE '';
  
  -- Avaliação de segurança
  IF v_rls_enabled AND v_policy_count > 0 THEN
    RAISE NOTICE '✅ STATUS: PROTEGIDA';
    RAISE NOTICE 'Tabela tem RLS habilitado e políticas configuradas.';
  ELSIF v_rls_enabled AND v_policy_count = 0 THEN
    RAISE NOTICE '⚠️ STATUS: RLS SEM POLÍTICAS';
    RAISE NOTICE 'RLS está habilitado mas sem políticas - acesso bloqueado totalmente.';
    RAISE NOTICE 'Ação: Criar políticas de acesso.';
  ELSIF NOT v_rls_enabled THEN
    RAISE NOTICE '🚨 STATUS: VULNERÁVEL';
    RAISE NOTICE 'RLS NÃO está habilitado - dados podem estar expostos!';
    RAISE NOTICE 'Ação urgente: Habilitar RLS e criar políticas.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  
END $$;

\echo ''

-- ============================================================================
-- PARTE 6: TESTES DE VULNERABILIDADE
-- ============================================================================

\echo '========================================='
\echo 'PARTE 6: TESTES DE VULNERABILIDADE'
\echo '========================================='
\echo ''

-- Verificar se Manager tem acesso
\echo 'Teste 1: Manager tem acesso a session_requests?'
\echo ''

SELECT 
  'Manager Access Check' as "Teste",
  COUNT(*) as "Políticas com Manager",
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Manager bloqueado'
    ELSE '⚠️ Manager tem acesso (' || COUNT(*) || ' política(s))'
  END as "Resultado"
FROM pg_policies
WHERE tablename = 'session_requests'
AND qual LIKE '%manager%'
AND cmd IN ('SELECT', 'ALL');

\echo ''

-- Verificar se tem política de isolamento por usuário
\echo 'Teste 2: Isolamento por usuário configurado?'
\echo ''

SELECT 
  'User Isolation Check' as "Teste",
  COUNT(*) as "Políticas com auth.uid()",
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Isolamento configurado'
    ELSE '❌ Sem isolamento - todos veem tudo'
  END as "Resultado"
FROM pg_policies
WHERE tablename = 'session_requests'
AND qual LIKE '%auth.uid()%';

\echo ''

-- Verificar se HR/Admin tem acesso total
\echo 'Teste 3: HR/Admin tem acesso total?'
\echo ''

SELECT 
  'HR/Admin Access Check' as "Teste",
  COUNT(*) as "Políticas HR/Admin",
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HR/Admin configurado'
    ELSE '⚠️ HR/Admin sem acesso explícito'
  END as "Resultado"
FROM pg_policies
WHERE tablename = 'session_requests'
AND (qual LIKE '%hr%' OR qual LIKE '%admin%');

\echo ''

-- ============================================================================
-- PARTE 7: RECOMENDAÇÕES
-- ============================================================================

\echo '========================================='
\echo 'PARTE 7: RECOMENDAÇÕES'
\echo '========================================='
\echo ''

DO $$
DECLARE
  v_exists boolean;
  v_rls_enabled boolean;
  v_policy_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'session_requests'
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE NOTICE 'RECOMENDAÇÃO: Nenhuma ação necessária (tabela não existe)';
    RAISE NOTICE '';
    RAISE NOTICE 'Se a tabela deveria existir:';
    RAISE NOTICE '  1. Verificar se migration foi aplicada';
    RAISE NOTICE '  2. Verificar nome correto da tabela';
    RAISE NOTICE '  3. Criar tabela se necessário';
    RETURN;
  END IF;
  
  -- Verificar RLS e políticas
  SELECT c.relrowsecurity
  INTO v_rls_enabled
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.tablename = 'session_requests';
  
  SELECT COUNT(*)
  INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'session_requests';
  
  RAISE NOTICE 'RECOMENDAÇÕES PARA session_requests:';
  RAISE NOTICE '';
  
  IF NOT v_rls_enabled THEN
    RAISE NOTICE '🚨 CRÍTICO: Habilitar RLS';
    RAISE NOTICE '   Execute: ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '';
  END IF;
  
  IF v_policy_count = 0 THEN
    RAISE NOTICE '⚠️ URGENTE: Criar políticas de acesso';
    RAISE NOTICE '   Políticas recomendadas:';
    RAISE NOTICE '   1. SELECT - Usuário vê apenas próprios registros';
    RAISE NOTICE '   2. INSERT - Usuário cria apenas para si';
    RAISE NOTICE '   3. UPDATE - Usuário atualiza apenas próprios';
    RAISE NOTICE '   4. ALL - HR/Admin acesso total';
    RAISE NOTICE '';
  END IF;
  
  IF v_rls_enabled AND v_policy_count > 0 THEN
    RAISE NOTICE '✅ Tabela está protegida!';
    RAISE NOTICE '';
    RAISE NOTICE 'Monitoramento recomendado:';
    RAISE NOTICE '  - Revisar políticas mensalmente';
    RAISE NOTICE '  - Testar isolamento na interface';
    RAISE NOTICE '  - Verificar logs de acesso';
    RAISE NOTICE '';
  END IF;
  
END $$;

\echo ''
\echo '============================================='
\echo 'FIM DO TESTE'
\echo '============================================='
\echo ''
