-- ============================================
-- Script de Validação de RLS - Tabelas Críticas
-- ============================================
-- Objetivo: Garantir isolamento de dados sensíveis
-- Tabelas: therapeutic_tasks, checkin_settings

-- ============================================
-- SETUP: Criar dados de teste
-- ============================================

-- Criar 3 perfis de teste
INSERT INTO profiles (id, email, role, name, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test.user1@deapdi.com', 'colaborador', 'Test User 1', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'test.user2@deapdi.com', 'colaborador', 'Test User 2', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'test.hr@deapdi.com', 'hr', 'Test HR', NOW(), NOW())
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
  ARRAY['00000000-0000-0000-0000-000000000001'::uuid],
  '00000000-0000-0000-0000-000000000003'::uuid,
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
  '00000000-0000-0000-0000-000000000001',
  'daily',
  '09:00:00',
  true
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- TESTES DE ISOLAMENTO - THERAPEUTIC_TASKS
-- ============================================

-- TESTE 1: User1 vê apenas própria tarefa
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASSOU - User1 vê 1 tarefa'
    ELSE '❌ FALHOU - User1 vê ' || COUNT(*) || ' tarefas (esperado: 1)'
  END as test_1_user1_sees_own_task
FROM therapeutic_tasks;

-- TESTE 2: User2 NÃO vê tarefa do User1 (ISOLAMENTO)
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU - User2 não vê tarefas de User1'
    ELSE '❌ FALHOU CRÍTICO - VIOLAÇÃO DE PRIVACIDADE! User2 vê ' || COUNT(*) || ' tarefas'
  END as test_2_user2_isolation
FROM therapeutic_tasks;

-- TESTE 3: HR vê todas as tarefas
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000003", "user_role": "hr"}';

SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSOU - HR vê ' || COUNT(*) || ' tarefa(s)'
    ELSE '❌ FALHOU - HR não consegue visualizar tarefas'
  END as test_3_hr_sees_all_tasks
FROM therapeutic_tasks;

-- TESTE 4: User1 NÃO pode deletar tarefa (skip for now - requires exception handling)
-- This test requires DO block which may not be supported in all test runners
-- Manual verification recommended

-- ============================================
-- TESTES DE ISOLAMENTO - CHECKIN_SETTINGS
-- ============================================

-- TESTE 5: User1 vê apenas própria configuração
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND user_id = '00000000-0000-0000-0000-000000000001' 
    THEN '✅ PASSOU - User1 vê apenas própria config'
    ELSE '❌ FALHOU - User1 vê configs incorretas'
  END as test_5_user1_sees_own_config
FROM checkin_settings;

-- TESTE 6: User2 NÃO vê config do User1
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000002", "user_role": "colaborador"}';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU - User2 isolado de User1'
    ELSE '❌ FALHOU CRÍTICO - User2 vê ' || COUNT(*) || ' configs de outros'
  END as test_6_user2_isolation
FROM checkin_settings;

-- TESTE 7: HR pode ver configs (analytics)
SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000003", "user_role": "hr"}';

SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSOU - HR vê ' || COUNT(*) || ' config(s)'
    ELSE '❌ FALHOU - HR sem acesso a analytics'
  END as test_7_hr_sees_all_configs
FROM checkin_settings;

-- ============================================
-- CLEANUP
-- ============================================

RESET request.jwt.claims;
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
