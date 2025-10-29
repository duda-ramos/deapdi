-- ============================================
-- Script de Validação de RLS - Tabelas Críticas
-- ============================================
-- Objetivo: Garantir isolamento de dados sensíveis
-- Tabelas: therapeutic_tasks, checkin_settings

-- ============================================
-- SETUP: Criar dados de teste
-- ============================================

DO $$
DECLARE
  user1_id UUID := '00000000-0000-0000-0000-000000000001';
  user2_id UUID := '00000000-0000-0000-0000-000000000002';
  hr_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Criar 3 perfis de teste
  INSERT INTO profiles (id, email, role, name, created_at, updated_at)
  VALUES 
    (user1_id, 'test.user1@deapdi.com', 'colaborador', 'Test User 1', NOW(), NOW()),
    (user2_id, 'test.user2@deapdi.com', 'colaborador', 'Test User 2', NOW(), NOW()),
    (hr_id, 'test.hr@deapdi.com', 'hr', 'Test HR', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Criar tarefa terapêutica para User1
  INSERT INTO therapeutic_tasks (
    id, title, type, assigned_to, assigned_by, 
    status, due_date, created_at, updated_at
  )
  VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Meditação Diária - User1',
    'meditation',
    ARRAY[user1_id],
    hr_id,
    'pending',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Criar configuração de checkin para User1
  INSERT INTO checkin_settings (
    user_id, frequency, reminder_time, reminder_enabled
  )
  VALUES (
    user1_id,
    'daily',
    '09:00:00',
    true
  ) ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Setup de teste completo';
END $$;

-- ============================================
-- TESTES DE ISOLAMENTO - THERAPEUTIC_TASKS
-- ============================================

\echo '\n=== TESTE 1: User1 vê apenas própria tarefa ==='
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASSOU - User1 vê 1 tarefa'
    ELSE '❌ FALHOU - User1 vê ' || COUNT(*) || ' tarefas (esperado: 1)'
  END as resultado
FROM therapeutic_tasks;

\echo '\n=== TESTE 2: User2 NÃO vê tarefa do User1 (ISOLAMENTO) ==='
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU - User2 não vê tarefas de User1'
    ELSE '❌ FALHOU CRÍTICO - VIOLAÇÃO DE PRIVACIDADE! User2 vê ' || COUNT(*) || ' tarefas'
  END as resultado
FROM therapeutic_tasks;

\echo '\n=== TESTE 3: HR vê todas as tarefas ==='
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000003", "user_role": "hr"}';

SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSOU - HR vê ' || COUNT(*) || ' tarefa(s)'
    ELSE '❌ FALHOU - HR não consegue visualizar tarefas'
  END as resultado
FROM therapeutic_tasks;

\echo '\n=== TESTE 4: User1 NÃO pode deletar tarefa ==='
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001", "user_role": "colaborador"}';

DO $$
BEGIN
  DELETE FROM therapeutic_tasks 
  WHERE id = '10000000-0000-0000-0000-000000000001';
  
  RAISE EXCEPTION 'FALHOU - User1 conseguiu deletar (não deveria)';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ PASSOU - User1 não pode deletar (correto)';
END $$;

-- ============================================
-- TESTES DE ISOLAMENTO - CHECKIN_SETTINGS
-- ============================================

\echo '\n=== TESTE 5: User1 vê apenas própria configuração ==='
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND user_id = '00000000-0000-0000-0000-000000000001' 
    THEN '✅ PASSOU - User1 vê apenas própria config'
    ELSE '❌ FALHOU - User1 vê configs incorretas'
  END as resultado
FROM checkin_settings;

\echo '\n=== TESTE 6: User2 NÃO vê config do User1 ==='
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU - User2 isolado de User1'
    ELSE '❌ FALHOU CRÍTICO - User2 vê ' || COUNT(*) || ' configs de outros'
  END as resultado
FROM checkin_settings;

\echo '\n=== TESTE 7: HR pode ver configs (analytics) ==='
SET LOCAL request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000003", "user_role": "hr"}';

SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSOU - HR vê ' || COUNT(*) || ' config(s)'
    ELSE '❌ FALHOU - HR sem acesso a analytics'
  END as resultado
FROM checkin_settings;

-- ============================================
-- CLEANUP
-- ============================================

RESET role;

DELETE FROM therapeutic_tasks WHERE id = '10000000-0000-0000-0000-000000000001';
DELETE FROM checkin_settings WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);
DELETE FROM profiles WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

\echo '\n✅ Cleanup completo - dados de teste removidos'
