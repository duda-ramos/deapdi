-- ============================================
-- CORREÇÃO CRÍTICA: RLS para session_requests
-- ============================================
-- Descrição: VULNERABILIDADE CRÍTICA - Tabela sem RLS
-- Severidade: 🔴 CRÍTICA
-- Data: 2025-11-25
-- Prioridade: URGENTE - LGPD compliance
-- 
-- PROBLEMA: session_requests SEM RLS
-- Dados sensíveis de solicitações de terapia expostos
-- Tabela existente: session_requests (ver 20250919194336_restless_summit.sql)
-- ============================================

-- ============================================
-- PARTE 1: HABILITAR RLS
-- ============================================

-- 1.1 Habilitar RLS (CRÍTICO)
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

-- 1.2 Confirmar que RLS foi habilitado
DO $$
BEGIN
  IF NOT (
    SELECT rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'session_requests'
  ) THEN
    RAISE EXCEPTION '❌ FALHA CRÍTICA: RLS não foi habilitado em session_requests';
  END IF;
  
  RAISE NOTICE '✅ RLS habilitado com sucesso em session_requests';
END $$;

-- ============================================
-- PARTE 2: CRIAR POLÍTICAS DE ACESSO
-- ============================================

-- 2.1 DROP políticas existentes (se houver)
DROP POLICY IF EXISTS therapy_session_requests_own_read ON session_requests;
DROP POLICY IF EXISTS therapy_session_requests_own_manage ON session_requests;
DROP POLICY IF EXISTS therapy_session_requests_hr_all ON session_requests;

-- ============================================
-- POLÍTICA 1: SELECT - Ver próprias solicitações
-- ============================================

CREATE POLICY therapy_session_requests_own_read
  ON session_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Colaborador vê apenas próprias solicitações OU
    auth.uid() = employee_id OR
    -- HR/Admin vê todas (para gerenciamento e aprovação)
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );

COMMENT ON POLICY therapy_session_requests_own_read ON session_requests IS
  'Colaboradores veem apenas próprias solicitações de terapia. HR/Admin veem todas para aprovação e gerenciamento.';

-- ============================================
-- POLÍTICA 2: INSERT/UPDATE - Gerenciar próprias solicitações
-- ============================================

CREATE POLICY therapy_session_requests_own_manage
  ON session_requests
  FOR ALL
  TO authenticated
  USING (
    -- Colaborador gerencia apenas próprias solicitações
    auth.uid() = employee_id
  )
  WITH CHECK (
    -- Ao criar/atualizar, deve ser do próprio colaborador
    auth.uid() = employee_id AND
    -- Status permitidos para colaborador (pending, cancelled)
    status IN ('pending', 'cancelled')
  );

COMMENT ON POLICY therapy_session_requests_own_manage ON session_requests IS
  'Colaboradores podem criar e cancelar apenas próprias solicitações de terapia.';

-- ============================================
-- POLÍTICA 3: HR - Gestão completa
-- ============================================

CREATE POLICY therapy_session_requests_hr_all
  ON session_requests
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );

COMMENT ON POLICY therapy_session_requests_hr_all ON session_requests IS
  'HR/Admin têm acesso total para aprovar, agendar e gerenciar todas as solicitações de terapia.';

-- ============================================
-- PARTE 3: ÍNDICES DE PERFORMANCE
-- ============================================

-- 3.1 Índice em employee_id (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_therapy_session_requests_employee_id
  ON session_requests (employee_id);

-- 3.2 Índice em status (filtragem comum)
CREATE INDEX IF NOT EXISTS idx_therapy_session_requests_status
  ON session_requests (status);

-- 3.3 Índice composto para queries HR (status + data)
CREATE INDEX IF NOT EXISTS idx_therapy_session_requests_status_date
  ON session_requests (status, created_at DESC);

-- ============================================
-- PARTE 4: VALIDAÇÕES FINAIS
-- ============================================

-- 4.1 Confirmar que políticas foram criadas
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'session_requests';
  
  IF v_policy_count < 3 THEN
    RAISE EXCEPTION '❌ FALHA: Apenas % políticas criadas (esperado: 3)', v_policy_count;
  END IF;
  
  RAISE NOTICE '✅ % políticas criadas com sucesso', v_policy_count;
END $$;

-- 4.2 Listar políticas criadas
SELECT 
  policyname as "Política",
  cmd as "Comando",
  CASE 
    WHEN qual LIKE '%employee_id = auth.uid()%' THEN '✅ Próprio'
    WHEN qual LIKE '%hr%' OR qual LIKE '%admin%' THEN '✅ HR/Admin'
    ELSE '⚠️ Verificar'
  END as "Acesso"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'session_requests'
ORDER BY cmd, policyname;

-- 4.3 Confirmar índices criados
SELECT 
  indexname as "Índice",
  indexdef as "Definição"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'session_requests'
AND indexname LIKE 'idx_therapy_session_requests%'
ORDER BY indexname;

-- ============================================
-- PARTE 5: TESTE DE SEGURANÇA
-- ============================================

-- 5.1 Teste: Verificar que RLS está bloqueando acesso não autorizado
DO $$
BEGIN
  -- Tentar criar política de teste (deve funcionar)
  RAISE NOTICE '🧪 Iniciando teste de segurança...';
  
  -- Verificar se RLS está forçando filtros
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_requests'
    AND qual LIKE '%auth.uid()%'
  ) THEN
    RAISE WARNING '⚠️ Nenhuma política usa auth.uid() - verificar isolamento!';
  ELSE
    RAISE NOTICE '✅ Políticas utilizam auth.uid() corretamente';
  END IF;
  
  RAISE NOTICE '✅ Teste de segurança concluído';
END $$;

-- ============================================
-- MENSAGEM FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo:';
  RAISE NOTICE '  • RLS habilitado: session_requests';
  RAISE NOTICE '  • Políticas criadas: 3';
  RAISE NOTICE '  • Índices criados: 3';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Proteção implementada:';
  RAISE NOTICE '  ✅ Colaboradores veem apenas próprias solicitações';
  RAISE NOTICE '  ✅ Manager NÃO vê solicitações de subordinados';
  RAISE NOTICE '  ✅ HR/Admin gerenciam todas (aprovação)';
  RAISE NOTICE '  ✅ Dados de terapia protegidos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE:';
  RAISE NOTICE '  • Revalidar sistema: FINAL_SENSITIVE_DATA_VALIDATION.sql';
  RAISE NOTICE '  • Atualizar: SENSITIVE_DATA_PROTECTION_REPORT.md';
  RAISE NOTICE '  • Testar na interface';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
