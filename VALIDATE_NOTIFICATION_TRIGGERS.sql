-- ============================================================================
-- SCRIPT DE VALIDAÇÃO DOS TRIGGERS DE NOTIFICAÇÃO
-- ============================================================================
-- Este script testa todos os triggers implementados no sistema de notificações
-- Executar após aplicar a migration: 20251127000000_notification_triggers.sql
-- ============================================================================

-- ============================================================================
-- SEÇÃO 0: VERIFICAÇÃO PRÉVIA
-- ============================================================================

-- Verificar se todas as funções existem
SELECT 
  'check_notification_preference' as function_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'check_notification_preference') as exists
UNION ALL
SELECT 
  'create_notification_if_enabled',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'create_notification_if_enabled')
UNION ALL
SELECT 
  'notify_pdi_status_change',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_pdi_status_change')
UNION ALL
SELECT 
  'notify_task_assigned',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_task_assigned')
UNION ALL
SELECT 
  'notify_achievement_unlocked',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_achievement_unlocked')
UNION ALL
SELECT 
  'notify_group_participant_added',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_group_participant_added')
UNION ALL
SELECT 
  'notify_group_leader_promotion',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_group_leader_promotion')
UNION ALL
SELECT 
  'notify_mentorship_request',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_mentorship_request')
UNION ALL
SELECT 
  'notify_mentorship_accepted',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_mentorship_accepted')
UNION ALL
SELECT 
  'notify_mentorship_session_scheduled',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_mentorship_session_scheduled')
UNION ALL
SELECT 
  'notify_mentorship_session_cancelled',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_mentorship_session_cancelled')
UNION ALL
SELECT 
  'cleanup_old_notifications',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_notifications')
UNION ALL
SELECT 
  'get_notification_stats',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_notification_stats');

-- Verificar se todos os triggers existem
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname IN (
  'pdi_status_notification',
  'task_assigned_notification',
  'achievement_unlocked_notification',
  'group_participant_added_notification',
  'group_leader_promotion_notification',
  'mentorship_request_notification',
  'mentorship_accepted_notification',
  'mentorship_session_scheduled_notification',
  'mentorship_session_cancelled_notification'
)
ORDER BY tgname;

-- Verificar colunas adicionadas à tabela notifications
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name IN ('category', 'related_id', 'metadata')
ORDER BY column_name;

-- ============================================================================
-- SEÇÃO 1: PREPARAÇÃO - DADOS DE TESTE
-- ============================================================================

-- Criar usuários de teste se não existirem
DO $$
DECLARE
  v_test_user1_id uuid;
  v_test_user2_id uuid;
  v_test_manager_id uuid;
BEGIN
  -- Verificar/criar usuário de teste 1 (colaborador)
  SELECT id INTO v_test_user1_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  IF v_test_user1_id IS NULL THEN
    INSERT INTO profiles (id, name, email, role, position, department)
    VALUES (gen_random_uuid(), 'Usuário Teste Notif 1', 'test_notif_user1@example.com', 'collaborator', 'Developer', 'Engineering')
    RETURNING id INTO v_test_user1_id;
    RAISE NOTICE 'Criado usuário teste 1: %', v_test_user1_id;
  END IF;

  -- Verificar/criar usuário de teste 2 (colaborador)
  SELECT id INTO v_test_user2_id FROM profiles WHERE email = 'test_notif_user2@example.com';
  IF v_test_user2_id IS NULL THEN
    INSERT INTO profiles (id, name, email, role, position, department)
    VALUES (gen_random_uuid(), 'Usuário Teste Notif 2', 'test_notif_user2@example.com', 'collaborator', 'Designer', 'Design')
    RETURNING id INTO v_test_user2_id;
    RAISE NOTICE 'Criado usuário teste 2: %', v_test_user2_id;
  END IF;

  -- Verificar/criar gestor de teste
  SELECT id INTO v_test_manager_id FROM profiles WHERE email = 'test_notif_manager@example.com';
  IF v_test_manager_id IS NULL THEN
    INSERT INTO profiles (id, name, email, role, position, department)
    VALUES (gen_random_uuid(), 'Gestor Teste Notif', 'test_notif_manager@example.com', 'manager', 'Tech Lead', 'Engineering')
    RETURNING id INTO v_test_manager_id;
    RAISE NOTICE 'Criado gestor teste: %', v_test_manager_id;
  END IF;

  -- Criar preferências de notificação padrão para os usuários de teste
  INSERT INTO notification_preferences (profile_id, pdi_approved, pdi_rejected, task_assigned, 
    achievement_unlocked, mentorship_scheduled, mentorship_cancelled, group_invitation, deadline_reminder)
  VALUES 
    (v_test_user1_id, true, true, true, true, true, true, true, true),
    (v_test_user2_id, true, true, true, true, true, true, true, true),
    (v_test_manager_id, true, true, true, true, true, true, true, true)
  ON CONFLICT (profile_id) DO NOTHING;
END $$;

-- Mostrar usuários de teste criados
SELECT id, name, email, role FROM profiles 
WHERE email LIKE 'test_notif_%@example.com';

-- ============================================================================
-- SEÇÃO 2: TESTES DOS TRIGGERS
-- ============================================================================

-- Limpar notificações anteriores dos usuários de teste
DELETE FROM notifications 
WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test_notif_%@example.com'
);

-- ----------------------------------------
-- TESTE 2.1: PDI Status Change (Aprovação)
-- ----------------------------------------
DO $$
DECLARE
  v_user_id uuid;
  v_pdi_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar PDI
  INSERT INTO pdis (id, profile_id, title, status, start_date, end_date)
  VALUES (gen_random_uuid(), v_user_id, 'PDI Teste Aprovação', 'completed', now(), now() + interval '90 days')
  RETURNING id INTO v_pdi_id;
  
  -- Simular aprovação (mudar status para validated)
  UPDATE pdis SET status = 'validated' WHERE id = v_pdi_id;
  
  -- Verificar notificação criada
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_user_id 
    AND category = 'pdi_approved'
    AND title LIKE '%PDI Aprovado%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.1 PASSOU: Notificação de PDI aprovado criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.1 FALHOU: Notificação de PDI aprovado NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM pdis WHERE id = v_pdi_id;
END $$;

-- ----------------------------------------
-- TESTE 2.2: PDI Status Change (Rejeição)
-- ----------------------------------------
DO $$
DECLARE
  v_user_id uuid;
  v_pdi_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar PDI já completado
  INSERT INTO pdis (id, profile_id, title, status, start_date, end_date)
  VALUES (gen_random_uuid(), v_user_id, 'PDI Teste Rejeição', 'completed', now(), now() + interval '90 days')
  RETURNING id INTO v_pdi_id;
  
  -- Simular rejeição (mudar status de volta para in_progress)
  UPDATE pdis SET status = 'in_progress' WHERE id = v_pdi_id;
  
  -- Verificar notificação criada
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_user_id 
    AND category = 'pdi_rejected'
    AND title LIKE '%Ajustes%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.2 PASSOU: Notificação de PDI rejeitado criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.2 FALHOU: Notificação de PDI rejeitado NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM pdis WHERE id = v_pdi_id;
END $$;

-- ----------------------------------------
-- TESTE 2.3: Task Assigned
-- ----------------------------------------
DO $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_task_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar grupo de ação primeiro (necessário para task)
  INSERT INTO action_groups (id, title, description, created_by)
  VALUES (gen_random_uuid(), 'Grupo Teste Task', 'Grupo para testar tasks', v_user_id)
  RETURNING id INTO v_group_id;
  
  -- Criar tarefa atribuída ao usuário
  INSERT INTO tasks (id, group_id, title, description, assignee_id, deadline, status)
  VALUES (gen_random_uuid(), v_group_id, 'Tarefa Teste Notificação', 'Descrição da tarefa', v_user_id, now() + interval '7 days', 'todo')
  RETURNING id INTO v_task_id;
  
  -- Verificar notificação criada
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_user_id 
    AND category = 'task_assigned'
    AND title LIKE '%Nova Tarefa%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.3 PASSOU: Notificação de tarefa atribuída criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.3 FALHOU: Notificação de tarefa atribuída NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM tasks WHERE id = v_task_id;
  DELETE FROM action_groups WHERE id = v_group_id;
END $$;

-- ----------------------------------------
-- TESTE 2.4: Group Participant Added
-- ----------------------------------------
DO $$
DECLARE
  v_user1_id uuid;
  v_user2_id uuid;
  v_group_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_user1_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  SELECT id INTO v_user2_id FROM profiles WHERE email = 'test_notif_user2@example.com';
  
  -- Criar grupo de ação
  INSERT INTO action_groups (id, title, description, created_by)
  VALUES (gen_random_uuid(), 'Grupo Teste Participante', 'Grupo para testar convite', v_user1_id)
  RETURNING id INTO v_group_id;
  
  -- Adicionar participante
  INSERT INTO action_group_participants (group_id, profile_id, role)
  VALUES (v_group_id, v_user2_id, 'member');
  
  -- Verificar notificação criada
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_user2_id 
    AND category = 'group_invitation'
    AND title LIKE '%adicionado%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.4 PASSOU: Notificação de adição em grupo criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.4 FALHOU: Notificação de adição em grupo NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM action_group_participants WHERE group_id = v_group_id;
  DELETE FROM action_groups WHERE id = v_group_id;
END $$;

-- ----------------------------------------
-- TESTE 2.5: Group Leader Promotion
-- ----------------------------------------
DO $$
DECLARE
  v_user1_id uuid;
  v_user2_id uuid;
  v_group_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_user1_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  SELECT id INTO v_user2_id FROM profiles WHERE email = 'test_notif_user2@example.com';
  
  -- Criar grupo de ação
  INSERT INTO action_groups (id, title, description, created_by)
  VALUES (gen_random_uuid(), 'Grupo Teste Líder', 'Grupo para testar promoção', v_user1_id)
  RETURNING id INTO v_group_id;
  
  -- Adicionar participante como membro
  INSERT INTO action_group_participants (group_id, profile_id, role)
  VALUES (v_group_id, v_user2_id, 'member');
  
  -- Limpar notificação de adição
  DELETE FROM notifications WHERE profile_id = v_user2_id AND category = 'group_invitation';
  
  -- Promover a líder
  UPDATE action_group_participants 
  SET role = 'leader' 
  WHERE group_id = v_group_id AND profile_id = v_user2_id;
  
  -- Verificar notificação criada
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_user2_id 
    AND category = 'group_leader'
    AND title LIKE '%Líder%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.5 PASSOU: Notificação de promoção a líder criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.5 FALHOU: Notificação de promoção a líder NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM action_group_participants WHERE group_id = v_group_id;
  DELETE FROM action_groups WHERE id = v_group_id;
END $$;

-- ----------------------------------------
-- TESTE 2.6: Mentorship Request
-- ----------------------------------------
DO $$
DECLARE
  v_mentor_id uuid;
  v_mentee_id uuid;
  v_mentorship_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_mentor_id FROM profiles WHERE email = 'test_notif_manager@example.com';
  SELECT id INTO v_mentee_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar solicitação de mentoria
  INSERT INTO mentorships (id, mentor_id, mentee_id, status, notes)
  VALUES (gen_random_uuid(), v_mentor_id, v_mentee_id, 'pending', 'Mentoria teste')
  RETURNING id INTO v_mentorship_id;
  
  -- Verificar notificação criada para o mentor
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_mentor_id 
    AND category = 'mentorship_request'
    AND title LIKE '%Solicitação%Mentoria%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.6 PASSOU: Notificação de solicitação de mentoria criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.6 FALHOU: Notificação de solicitação de mentoria NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM mentorships WHERE id = v_mentorship_id;
END $$;

-- ----------------------------------------
-- TESTE 2.7: Mentorship Accepted
-- ----------------------------------------
DO $$
DECLARE
  v_mentor_id uuid;
  v_mentee_id uuid;
  v_mentorship_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_mentor_id FROM profiles WHERE email = 'test_notif_manager@example.com';
  SELECT id INTO v_mentee_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar mentoria pendente
  INSERT INTO mentorships (id, mentor_id, mentee_id, status, notes)
  VALUES (gen_random_uuid(), v_mentor_id, v_mentee_id, 'pending', 'Mentoria para aceitar')
  RETURNING id INTO v_mentorship_id;
  
  -- Limpar notificação de solicitação
  DELETE FROM notifications WHERE profile_id = v_mentor_id AND category = 'mentorship_request';
  
  -- Aceitar mentoria
  UPDATE mentorships SET status = 'active' WHERE id = v_mentorship_id;
  
  -- Verificar notificação criada para o mentee
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_mentee_id 
    AND category = 'mentorship_accepted'
    AND title LIKE '%Mentoria Aceita%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.7 PASSOU: Notificação de mentoria aceita criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.7 FALHOU: Notificação de mentoria aceita NÃO foi criada';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM mentorships WHERE id = v_mentorship_id;
END $$;

-- ----------------------------------------
-- TESTE 2.8: Mentorship Session Scheduled
-- ----------------------------------------
DO $$
DECLARE
  v_mentor_id uuid;
  v_mentee_id uuid;
  v_mentorship_id uuid;
  v_session_id uuid;
  v_notif_count_mentor integer;
  v_notif_count_mentee integer;
BEGIN
  SELECT id INTO v_mentor_id FROM profiles WHERE email = 'test_notif_manager@example.com';
  SELECT id INTO v_mentee_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar mentoria ativa
  INSERT INTO mentorships (id, mentor_id, mentee_id, status, notes)
  VALUES (gen_random_uuid(), v_mentor_id, v_mentee_id, 'active', 'Mentoria para sessão')
  RETURNING id INTO v_mentorship_id;
  
  -- Agendar sessão
  INSERT INTO mentorship_sessions (id, mentorship_id, session_date, scheduled_start, duration_minutes, topics_discussed, action_items)
  VALUES (gen_random_uuid(), v_mentorship_id, now() + interval '7 days', now() + interval '7 days', 60, 'Tópicos de teste', 'Ações de teste')
  RETURNING id INTO v_session_id;
  
  -- Verificar notificação criada para o mentor
  SELECT COUNT(*) INTO v_notif_count_mentor
  FROM notifications 
  WHERE profile_id = v_mentor_id 
    AND category = 'mentorship_scheduled'
    AND title LIKE '%Sessão%Agendada%';
  
  -- Verificar notificação criada para o mentee
  SELECT COUNT(*) INTO v_notif_count_mentee
  FROM notifications 
  WHERE profile_id = v_mentee_id 
    AND category = 'mentorship_scheduled'
    AND title LIKE '%Sessão%Confirmada%';
  
  IF v_notif_count_mentor > 0 AND v_notif_count_mentee > 0 THEN
    RAISE NOTICE '✅ TESTE 2.8 PASSOU: Notificações de sessão agendada criadas para mentor e mentee';
  ELSIF v_notif_count_mentor > 0 THEN
    RAISE NOTICE '⚠️ TESTE 2.8 PARCIAL: Apenas notificação do mentor criada';
  ELSIF v_notif_count_mentee > 0 THEN
    RAISE NOTICE '⚠️ TESTE 2.8 PARCIAL: Apenas notificação do mentee criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.8 FALHOU: Notificações de sessão agendada NÃO foram criadas';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM mentorship_sessions WHERE id = v_session_id;
  DELETE FROM mentorships WHERE id = v_mentorship_id;
END $$;

-- ----------------------------------------
-- TESTE 2.9: Mentorship Session Cancelled
-- ----------------------------------------
DO $$
DECLARE
  v_mentor_id uuid;
  v_mentee_id uuid;
  v_mentorship_id uuid;
  v_session_id uuid;
  v_notif_count integer;
BEGIN
  SELECT id INTO v_mentor_id FROM profiles WHERE email = 'test_notif_manager@example.com';
  SELECT id INTO v_mentee_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Criar mentoria ativa
  INSERT INTO mentorships (id, mentor_id, mentee_id, status, notes)
  VALUES (gen_random_uuid(), v_mentor_id, v_mentee_id, 'active', 'Mentoria para cancelar')
  RETURNING id INTO v_mentorship_id;
  
  -- Criar sessão agendada
  INSERT INTO mentorship_sessions (id, mentorship_id, session_date, scheduled_start, duration_minutes, topics_discussed, action_items, status)
  VALUES (gen_random_uuid(), v_mentorship_id, now() + interval '7 days', now() + interval '7 days', 60, 'Tópicos', 'Ações', 'scheduled')
  RETURNING id INTO v_session_id;
  
  -- Limpar notificações anteriores
  DELETE FROM notifications 
  WHERE profile_id IN (v_mentor_id, v_mentee_id) 
    AND category IN ('mentorship_scheduled', 'mentorship_cancelled');
  
  -- Cancelar sessão
  UPDATE mentorship_sessions SET status = 'cancelled' WHERE id = v_session_id;
  
  -- Verificar notificações criadas
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id IN (v_mentor_id, v_mentee_id) 
    AND category = 'mentorship_cancelled'
    AND title LIKE '%Cancelada%';
  
  IF v_notif_count >= 2 THEN
    RAISE NOTICE '✅ TESTE 2.9 PASSOU: Notificações de sessão cancelada criadas para ambos';
  ELSIF v_notif_count = 1 THEN
    RAISE NOTICE '⚠️ TESTE 2.9 PARCIAL: Apenas uma notificação de cancelamento criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2.9 FALHOU: Notificações de sessão cancelada NÃO foram criadas';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM mentorship_sessions WHERE id = v_session_id;
  DELETE FROM mentorships WHERE id = v_mentorship_id;
END $$;

-- ============================================================================
-- SEÇÃO 3: TESTE DE PREFERÊNCIAS
-- ============================================================================

-- ----------------------------------------
-- TESTE 3.1: Preferência Desabilitada
-- ----------------------------------------
DO $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_notif_count_before integer;
  v_notif_count_after integer;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test_notif_user2@example.com';
  
  -- Contar notificações antes
  SELECT COUNT(*) INTO v_notif_count_before
  FROM notifications WHERE profile_id = v_user_id AND category = 'group_invitation';
  
  -- Desabilitar preferência de convite de grupo
  UPDATE notification_preferences 
  SET group_invitation = false 
  WHERE profile_id = v_user_id;
  
  -- Criar grupo e adicionar usuário
  INSERT INTO action_groups (id, title, description, created_by)
  VALUES (gen_random_uuid(), 'Grupo Teste Pref Desab', 'Teste preferência', v_user_id)
  RETURNING id INTO v_group_id;
  
  -- Adicionar participante (não deve gerar notificação)
  INSERT INTO action_group_participants (group_id, profile_id, role)
  VALUES (v_group_id, v_user_id, 'member');
  
  -- Contar notificações depois
  SELECT COUNT(*) INTO v_notif_count_after
  FROM notifications WHERE profile_id = v_user_id AND category = 'group_invitation';
  
  IF v_notif_count_before = v_notif_count_after THEN
    RAISE NOTICE '✅ TESTE 3.1 PASSOU: Preferência desabilitada respeitada (notificação NÃO criada)';
  ELSE
    RAISE NOTICE '❌ TESTE 3.1 FALHOU: Notificação foi criada mesmo com preferência desabilitada';
  END IF;
  
  -- Restaurar preferência
  UPDATE notification_preferences 
  SET group_invitation = true 
  WHERE profile_id = v_user_id;
  
  -- Limpar dados de teste
  DELETE FROM action_group_participants WHERE group_id = v_group_id;
  DELETE FROM action_groups WHERE id = v_group_id;
END $$;

-- ============================================================================
-- SEÇÃO 4: VERIFICAÇÃO DE ESTRUTURA DAS NOTIFICAÇÕES
-- ============================================================================

-- Mostrar todas as notificações criadas durante os testes
SELECT 
  n.id,
  p.name as user_name,
  n.title,
  n.message,
  n.type,
  n.category,
  n.related_id IS NOT NULL as has_related_id,
  n.action_url,
  n.metadata,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.profile_id
WHERE p.email LIKE 'test_notif_%@example.com'
ORDER BY n.created_at DESC
LIMIT 20;

-- ============================================================================
-- SEÇÃO 5: ESTATÍSTICAS E FUNÇÕES AUXILIARES
-- ============================================================================

-- Testar função get_notification_stats
DO $$
DECLARE
  v_user_id uuid;
  v_stats record;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'test_notif_user1@example.com';
  
  -- Obter estatísticas
  SELECT * INTO v_stats FROM get_notification_stats(v_user_id);
  
  IF v_stats IS NOT NULL THEN
    RAISE NOTICE '✅ Função get_notification_stats funcionando:';
    RAISE NOTICE '   - Total: %, Não lidas: %, Hoje: %', 
      v_stats.total_notifications, 
      v_stats.unread_notifications, 
      v_stats.notifications_today;
  ELSE
    RAISE NOTICE '❌ Função get_notification_stats retornou NULL';
  END IF;
END $$;

-- ============================================================================
-- SEÇÃO 6: LIMPEZA (OPCIONAL - DESCOMENTE SE DESEJAR LIMPAR)
-- ============================================================================

-- Limpar todas as notificações de teste
-- DELETE FROM notifications 
-- WHERE profile_id IN (
--   SELECT id FROM profiles WHERE email LIKE 'test_notif_%@example.com'
-- );

-- Limpar usuários de teste (cuidado!)
-- DELETE FROM notification_preferences WHERE profile_id IN (
--   SELECT id FROM profiles WHERE email LIKE 'test_notif_%@example.com'
-- );
-- DELETE FROM profiles WHERE email LIKE 'test_notif_%@example.com';

-- ============================================================================
-- SEÇÃO 7: RESUMO DOS TESTES
-- ============================================================================

SELECT '============================================' as separator;
SELECT 'RESUMO DOS TRIGGERS DE NOTIFICAÇÃO' as title;
SELECT '============================================' as separator;

SELECT 
  'Total de triggers implementados' as metric,
  COUNT(*)::text as value
FROM pg_trigger 
WHERE tgname LIKE '%_notification%'
  AND tgname NOT LIKE 'RI_%'

UNION ALL

SELECT 
  'Funções de notificação criadas',
  COUNT(*)::text
FROM pg_proc 
WHERE proname LIKE 'notify_%' OR proname IN ('check_notification_preference', 'create_notification_if_enabled')

UNION ALL

SELECT
  'Notificações geradas nos testes',
  COUNT(*)::text
FROM notifications 
WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test_notif_%@example.com'
);

-- ============================================================================
-- FIM DO SCRIPT DE VALIDAÇÃO
-- ============================================================================
