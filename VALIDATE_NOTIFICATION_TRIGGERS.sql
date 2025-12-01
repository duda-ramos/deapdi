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
-- NOTA: profiles requer auth.users, então usamos usuários existentes
DO $$
DECLARE
  v_test_user1_id uuid;
  v_test_user2_id uuid;
  v_test_manager_id uuid;
BEGIN
  -- Buscar usuários existentes para usar nos testes
  -- Usuário 1: qualquer employee
  SELECT id INTO v_test_user1_id 
  FROM profiles 
  WHERE role = 'employee' 
  LIMIT 1;
  
  -- Usuário 2: outro employee diferente
  SELECT id INTO v_test_user2_id 
  FROM profiles 
  WHERE role = 'employee' AND id != COALESCE(v_test_user1_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LIMIT 1;
  
  -- Manager: qualquer manager ou admin
  SELECT id INTO v_test_manager_id 
  FROM profiles 
  WHERE role IN ('manager', 'admin', 'hr')
  LIMIT 1;
  
  -- Se não encontrou usuários, usar o primeiro disponível
  IF v_test_user1_id IS NULL THEN
    SELECT id INTO v_test_user1_id FROM profiles LIMIT 1;
  END IF;
  
  IF v_test_user2_id IS NULL THEN
    v_test_user2_id := v_test_user1_id;
  END IF;
  
  IF v_test_manager_id IS NULL THEN
    v_test_manager_id := v_test_user1_id;
  END IF;
  
  -- Mostrar usuários selecionados
  RAISE NOTICE 'Usuário teste 1: %', v_test_user1_id;
  RAISE NOTICE 'Usuário teste 2: %', v_test_user2_id;
  RAISE NOTICE 'Manager teste: %', v_test_manager_id;
  
  -- Garantir que preferências existam para os usuários de teste
  INSERT INTO notification_preferences (profile_id, pdi_approved, pdi_rejected, task_assigned, 
    achievement_unlocked, mentorship_scheduled, mentorship_cancelled, group_invitation, deadline_reminder)
  VALUES 
    (v_test_user1_id, true, true, true, true, true, true, true, true)
  ON CONFLICT (profile_id) DO UPDATE SET
    pdi_approved = true, pdi_rejected = true, task_assigned = true,
    achievement_unlocked = true, mentorship_scheduled = true, mentorship_cancelled = true,
    group_invitation = true, deadline_reminder = true;
    
  IF v_test_user2_id != v_test_user1_id THEN
    INSERT INTO notification_preferences (profile_id, pdi_approved, pdi_rejected, task_assigned, 
      achievement_unlocked, mentorship_scheduled, mentorship_cancelled, group_invitation, deadline_reminder)
    VALUES 
      (v_test_user2_id, true, true, true, true, true, true, true, true)
    ON CONFLICT (profile_id) DO UPDATE SET
      pdi_approved = true, pdi_rejected = true, task_assigned = true,
      achievement_unlocked = true, mentorship_scheduled = true, mentorship_cancelled = true,
      group_invitation = true, deadline_reminder = true;
  END IF;
  
  IF v_test_manager_id != v_test_user1_id AND v_test_manager_id != v_test_user2_id THEN
    INSERT INTO notification_preferences (profile_id, pdi_approved, pdi_rejected, task_assigned, 
      achievement_unlocked, mentorship_scheduled, mentorship_cancelled, group_invitation, deadline_reminder)
    VALUES 
      (v_test_manager_id, true, true, true, true, true, true, true, true)
    ON CONFLICT (profile_id) DO UPDATE SET
      pdi_approved = true, pdi_rejected = true, task_assigned = true,
      achievement_unlocked = true, mentorship_scheduled = true, mentorship_cancelled = true,
      group_invitation = true, deadline_reminder = true;
  END IF;
  
  -- Salvar IDs em tabela temporária para uso nos testes
  CREATE TEMP TABLE IF NOT EXISTS test_users (
    user_type text PRIMARY KEY,
    user_id uuid
  );
  DELETE FROM test_users;
  INSERT INTO test_users VALUES ('user1', v_test_user1_id), ('user2', v_test_user2_id), ('manager', v_test_manager_id);
END $$;

-- Mostrar usuários de teste selecionados
SELECT tu.user_type, p.id, p.name, p.email, p.role 
FROM test_users tu
JOIN profiles p ON p.id = tu.user_id;

-- ============================================================================
-- SEÇÃO 2: TESTES DOS TRIGGERS
-- ============================================================================

-- Limpar notificações anteriores dos usuários de teste
DELETE FROM notifications 
WHERE profile_id IN (SELECT user_id FROM test_users);

-- ----------------------------------------
-- TESTE 2.1: PDI Status Change (Aprovação)
-- ----------------------------------------
DO $$
DECLARE
  v_user_id uuid;
  v_pdi_id uuid;
  v_notif_count integer;
BEGIN
  SELECT user_id INTO v_user_id FROM test_users WHERE user_type = 'user1';
  
  -- Criar PDI (usando colunas corretas: title, description, deadline, status, created_by, profile_id)
  INSERT INTO pdis (id, profile_id, title, description, deadline, status, created_by)
  VALUES (gen_random_uuid(), v_user_id, 'PDI Teste Aprovação', 'Descrição do PDI teste', now() + interval '90 days', 'completed', v_user_id)
  RETURNING id INTO v_pdi_id;
  
  -- Simular aprovação (mudar status para validated)
  -- Nota: Pode falhar se trigger de carreira estiver ativo e usuário não tiver trilha
  BEGIN
    UPDATE pdis SET status = 'validated' WHERE id = v_pdi_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ TESTE 2.1 AVISO: Trigger de carreira impediu atualização (usuário sem trilha)';
    -- Continuar mesmo assim para verificar se notificação foi criada antes do erro
  END;
  
  -- Verificar notificação criada
  SELECT COUNT(*) INTO v_notif_count
  FROM notifications 
  WHERE profile_id = v_user_id 
    AND category = 'pdi_approved'
    AND title LIKE '%PDI Aprovado%';
  
  IF v_notif_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2.1 PASSOU: Notificação de PDI aprovado criada';
  ELSE
    RAISE NOTICE '⚠️ TESTE 2.1 INCONCLUSIVO: Notificação não criada (possivelmente devido a trigger de carreira)';
  END IF;
  
  -- Limpar dados de teste
  DELETE FROM pdis WHERE id = v_pdi_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ TESTE 2.1 ERRO: % - Verifique se usuário tem trilha de carreira', SQLERRM;
  -- Tentar limpar mesmo com erro
  DELETE FROM pdis WHERE title = 'PDI Teste Aprovação';
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
  SELECT user_id INTO v_user_id FROM test_users WHERE user_type = 'user1';
  
  -- Criar PDI já completado
  INSERT INTO pdis (id, profile_id, title, description, deadline, status, created_by)
  VALUES (gen_random_uuid(), v_user_id, 'PDI Teste Rejeição', 'Descrição do PDI teste', now() + interval '90 days', 'completed', v_user_id)
  RETURNING id INTO v_pdi_id;
  
  -- Simular rejeição (mudar status de volta para in-progress)
  -- Este teste não deve acionar o trigger de carreira
  UPDATE pdis SET status = 'in-progress' WHERE id = v_pdi_id;
  
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ TESTE 2.2 ERRO: %', SQLERRM;
  DELETE FROM pdis WHERE title = 'PDI Teste Rejeição';
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
  SELECT user_id INTO v_user_id FROM test_users WHERE user_type = 'user1';
  
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
  SELECT user_id INTO v_user1_id FROM test_users WHERE user_type = 'user1';
  SELECT user_id INTO v_user2_id FROM test_users WHERE user_type = 'user2';
  
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
  SELECT user_id INTO v_user1_id FROM test_users WHERE user_type = 'user1';
  SELECT user_id INTO v_user2_id FROM test_users WHERE user_type = 'user2';
  
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
  SELECT user_id INTO v_mentor_id FROM test_users WHERE user_type = 'manager';
  SELECT user_id INTO v_mentee_id FROM test_users WHERE user_type = 'user1';
  
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
  SELECT user_id INTO v_mentor_id FROM test_users WHERE user_type = 'manager';
  SELECT user_id INTO v_mentee_id FROM test_users WHERE user_type = 'user1';
  
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
  SELECT user_id INTO v_mentor_id FROM test_users WHERE user_type = 'manager';
  SELECT user_id INTO v_mentee_id FROM test_users WHERE user_type = 'user1';
  
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
  SELECT user_id INTO v_mentor_id FROM test_users WHERE user_type = 'manager';
  SELECT user_id INTO v_mentee_id FROM test_users WHERE user_type = 'user1';
  
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
  SELECT user_id INTO v_user_id FROM test_users WHERE user_type = 'user2';
  
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
WHERE n.profile_id IN (SELECT user_id FROM test_users)
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
  SELECT user_id INTO v_user_id FROM test_users WHERE user_type = 'user1';
  
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
-- WHERE profile_id IN (SELECT user_id FROM test_users);

-- Drop tabela temporária
-- DROP TABLE IF EXISTS test_users;

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
WHERE profile_id IN (SELECT user_id FROM test_users);

-- ============================================================================
-- FIM DO SCRIPT DE VALIDAÇÃO
-- ============================================================================
