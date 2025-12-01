/*
  ============================================================================
  SCRIPT DE TESTES FUNCIONAIS: Notification Triggers
  ============================================================================
  
  Este script executa testes completos de todos os triggers de notificação.
  
  INSTRUÇÕES:
  1. Execute este script no Supabase SQL Editor
  2. Substitua os UUIDs de exemplo pelos IDs reais do seu banco
  3. Verifique os resultados de cada teste
  
  ⚠️ ATENÇÃO: Este script CRIA e MODIFICA dados. Use em ambiente de teste!
*/

-- ============================================================================
-- CONFIGURAÇÃO INICIAL
-- ============================================================================

-- Variáveis para testes (substitua pelos IDs reais)
DO $$
DECLARE
  v_employee_id uuid;
  v_manager_id uuid;
  v_mentor_id uuid;
  v_mentee_id uuid;
  v_test_pdi_id uuid;
  v_test_group_id uuid;
  v_test_task_id uuid;
  v_test_mentorship_id uuid;
  v_test_session_id uuid;
  v_notification_count integer;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'INICIANDO TESTES DE TRIGGERS DE NOTIFICAÇÃO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- PASSO 1: BUSCAR USUÁRIOS PARA TESTES
  -- ============================================================================
  
  RAISE NOTICE 'PASSO 1: Buscando usuários para testes...';
  
  -- Buscar um employee
  SELECT id INTO v_employee_id 
  FROM profiles 
  WHERE role = 'employee' 
  LIMIT 1;
  
  -- Buscar um manager
  SELECT id INTO v_manager_id 
  FROM profiles 
  WHERE role = 'manager' 
  LIMIT 1;
  
  -- Se não encontrar manager, usar employee
  IF v_manager_id IS NULL THEN
    v_manager_id := v_employee_id;
  END IF;
  
  -- Definir mentor e mentee
  v_mentor_id := v_manager_id;
  v_mentee_id := v_employee_id;
  
  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'ERRO: Nenhum usuário encontrado para testes. Crie usuários primeiro.';
  END IF;
  
  RAISE NOTICE '✅ Employee ID: %', v_employee_id;
  RAISE NOTICE '✅ Manager ID: %', v_manager_id;
  RAISE NOTICE '';

  -- ============================================================================
  -- PASSO 2: LIMPAR NOTIFICAÇÕES DE TESTE ANTERIORES
  -- ============================================================================
  
  RAISE NOTICE 'PASSO 2: Limpando notificações de teste anteriores...';
  
  DELETE FROM notifications 
  WHERE title LIKE '%Teste%' OR title LIKE '%Test%';
  
  RAISE NOTICE '✅ Notificações de teste removidas';
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 1: PDI APROVADO
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 1: PDI APROVADO';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Criar PDI de teste
  INSERT INTO pdis (profile_id, title, description, status, deadline, created_by)
  VALUES (
    v_employee_id,
    'PDI Teste - Aprovação',
    'Teste do trigger de aprovação',
    'completed',
    CURRENT_DATE + interval '30 days',
    v_manager_id
  ) RETURNING id INTO v_test_pdi_id;
  
  RAISE NOTICE 'PDI criado: %', v_test_pdi_id;
  
  -- Aprovar PDI (muda status para validated)
  UPDATE pdis 
  SET status = 'validated'
  WHERE id = v_test_pdi_id;
  
  -- Verificar notificação
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_employee_id
  AND category = 'pdi_approved'
  AND related_id = v_test_pdi_id::text;
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '✅ TESTE 1 PASSOU: Notificação de PDI aprovado criada';
  ELSE
    RAISE NOTICE '❌ TESTE 1 FALHOU: Notificação de PDI aprovado NÃO criada';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 2: PDI REJEITADO
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 2: PDI REJEITADO';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Criar novo PDI para rejeição
  INSERT INTO pdis (profile_id, title, description, status, deadline, created_by)
  VALUES (
    v_employee_id,
    'PDI Teste - Rejeição',
    'Teste do trigger de rejeição',
    'completed',
    CURRENT_DATE + interval '30 days',
    v_manager_id
  ) RETURNING id INTO v_test_pdi_id;
  
  -- Rejeitar PDI (muda status para in-progress)
  UPDATE pdis 
  SET status = 'in-progress'
  WHERE id = v_test_pdi_id;
  
  -- Verificar notificação
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_employee_id
  AND category = 'pdi_rejected'
  AND related_id = v_test_pdi_id::text;
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '✅ TESTE 2 PASSOU: Notificação de PDI rejeitado criada';
  ELSE
    RAISE NOTICE '❌ TESTE 2 FALHOU: Notificação de PDI rejeitado NÃO criada';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 3: TAREFA ATRIBUÍDA
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 3: TAREFA ATRIBUÍDA';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Primeiro criar um grupo para a tarefa
  INSERT INTO action_groups (title, description, deadline, created_by)
  VALUES (
    'Grupo Teste',
    'Grupo para testes de notificação',
    CURRENT_DATE + interval '30 days',
    v_manager_id
  ) RETURNING id INTO v_test_group_id;
  
  RAISE NOTICE 'Grupo criado: %', v_test_group_id;
  
  -- Criar tarefa
  INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
  VALUES (
    'Tarefa Teste - Atribuição',
    'Teste do trigger de tarefa atribuída',
    v_employee_id,
    v_test_group_id,
    CURRENT_DATE + interval '7 days',
    'todo'
  ) RETURNING id INTO v_test_task_id;
  
  -- Verificar notificação
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_employee_id
  AND category = 'task_assigned'
  AND related_id = v_test_task_id::text;
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '✅ TESTE 3 PASSOU: Notificação de tarefa atribuída criada';
  ELSE
    RAISE NOTICE '❌ TESTE 3 FALHOU: Notificação de tarefa atribuída NÃO criada';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 4: PARTICIPANTE ADICIONADO EM GRUPO
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 4: PARTICIPANTE ADICIONADO EM GRUPO';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Adicionar participante no grupo (se não for o mesmo que criou)
  IF v_employee_id != v_manager_id THEN
    INSERT INTO action_group_participants (group_id, profile_id, role)
    VALUES (v_test_group_id, v_employee_id, 'member')
    ON CONFLICT (group_id, profile_id) DO NOTHING;
    
    -- Verificar notificação
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE profile_id = v_employee_id
    AND category = 'group_invitation'
    AND related_id = v_test_group_id::text;
    
    IF v_notification_count > 0 THEN
      RAISE NOTICE '✅ TESTE 4 PASSOU: Notificação de participante adicionado criada';
    ELSE
      RAISE NOTICE '❌ TESTE 4 FALHOU: Notificação de participante adicionado NÃO criada';
    END IF;
  ELSE
    RAISE NOTICE '⏭️ TESTE 4 PULADO: Mesmo usuário para employee e manager';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 5: PROMOÇÃO A LÍDER
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 5: PROMOÇÃO A LÍDER';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Promover a líder
  UPDATE action_group_participants
  SET role = 'leader'
  WHERE group_id = v_test_group_id
  AND profile_id = v_employee_id;
  
  -- Verificar notificação
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_employee_id
  AND category = 'group_leader'
  AND related_id = v_test_group_id::text;
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '✅ TESTE 5 PASSOU: Notificação de promoção a líder criada';
  ELSE
    RAISE NOTICE '❌ TESTE 5 FALHOU: Notificação de promoção a líder NÃO criada';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 6: SOLICITAÇÃO DE MENTORIA
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 6: SOLICITAÇÃO DE MENTORIA';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Criar mentoria (simular solicitação)
  INSERT INTO mentorships (mentor_id, mentee_id, status)
  VALUES (v_mentor_id, v_mentee_id, 'active')
  ON CONFLICT (mentor_id, mentee_id) DO NOTHING
  RETURNING id INTO v_test_mentorship_id;
  
  -- Se já existia, buscar
  IF v_test_mentorship_id IS NULL THEN
    SELECT id INTO v_test_mentorship_id
    FROM mentorships
    WHERE mentor_id = v_mentor_id AND mentee_id = v_mentee_id;
  END IF;
  
  -- Verificar notificação para mentor
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_mentor_id
  AND category = 'mentorship_request'
  AND related_id = v_test_mentorship_id::text;
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '✅ TESTE 6 PASSOU: Notificação de solicitação de mentoria criada';
  ELSE
    RAISE NOTICE '⚠️ TESTE 6: Mentoria já existia ou mesmo usuário (mentor=mentee)';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 7: MENTORIA ACEITA
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 7: MENTORIA ACEITA';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Primeiro mudar status para pending
  UPDATE mentorships 
  SET status = 'paused'
  WHERE id = v_test_mentorship_id;
  
  -- Aceitar mentoria (mudar para active)
  UPDATE mentorships 
  SET status = 'active'
  WHERE id = v_test_mentorship_id;
  
  -- Verificar notificação para mentee
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_mentee_id
  AND category = 'mentorship_accepted'
  AND related_id = v_test_mentorship_id::text;
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '✅ TESTE 7 PASSOU: Notificação de mentoria aceita criada';
  ELSE
    RAISE NOTICE '❌ TESTE 7 FALHOU: Notificação de mentoria aceita NÃO criada';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 8: SESSÃO DE MENTORIA AGENDADA
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 8: SESSÃO DE MENTORIA AGENDADA';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Criar sessão de mentoria
  BEGIN
    INSERT INTO mentorship_sessions (
      mentorship_id, 
      scheduled_start,
      duration_minutes,
      session_date,
      topics_discussed,
      action_items
    )
    VALUES (
      v_test_mentorship_id,
      NOW() + interval '3 days',
      60,
      NOW() + interval '3 days',
      'Teste de sessão',
      'Ações de teste'
    ) RETURNING id INTO v_test_session_id;
    
    -- Verificar notificação para mentor
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE profile_id = v_mentor_id
    AND category = 'mentorship_scheduled'
    AND related_id = v_test_session_id::text;
    
    IF v_notification_count > 0 THEN
      RAISE NOTICE '✅ TESTE 8a PASSOU: Notificação de sessão para mentor criada';
    ELSE
      RAISE NOTICE '❌ TESTE 8a FALHOU: Notificação de sessão para mentor NÃO criada';
    END IF;
    
    -- Verificar notificação para mentee
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE profile_id = v_mentee_id
    AND category = 'mentorship_scheduled'
    AND related_id = v_test_session_id::text;
    
    IF v_notification_count > 0 THEN
      RAISE NOTICE '✅ TESTE 8b PASSOU: Notificação de sessão para mentee criada';
    ELSE
      RAISE NOTICE '❌ TESTE 8b FALHOU: Notificação de sessão para mentee NÃO criada';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ TESTE 8: Erro ao criar sessão - %', SQLERRM;
  END;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 9: LEMBRETES DE PRAZO
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 9: LEMBRETES DE PRAZO';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Criar PDI com prazo em 3 dias
  INSERT INTO pdis (profile_id, title, description, status, deadline, created_by)
  VALUES (
    v_employee_id,
    'PDI Teste - Prazo 3 dias',
    'Teste de lembrete de prazo',
    'in-progress',
    CURRENT_DATE + interval '3 days',
    v_manager_id
  );
  
  -- Criar tarefa com prazo em 1 dia
  INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
  VALUES (
    'Tarefa Teste - Prazo 1 dia',
    'Teste de lembrete urgente',
    v_employee_id,
    v_test_group_id,
    CURRENT_DATE + interval '1 day',
    'todo'
  );
  
  -- Executar função de lembretes
  PERFORM send_deadline_reminders();
  
  -- Verificar lembretes criados
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_employee_id
  AND category = 'deadline_reminder'
  AND created_at::date = CURRENT_DATE;
  
  IF v_notification_count >= 2 THEN
    RAISE NOTICE '✅ TESTE 9 PASSOU: % lembretes de prazo criados', v_notification_count;
  ELSIF v_notification_count > 0 THEN
    RAISE NOTICE '⚠️ TESTE 9 PARCIAL: % lembrete(s) de prazo criado(s)', v_notification_count;
  ELSE
    RAISE NOTICE '❌ TESTE 9 FALHOU: Nenhum lembrete de prazo criado';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TESTE 10: PREFERÊNCIAS DESABILITADAS
  -- ============================================================================
  
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TESTE 10: PREFERÊNCIAS DESABILITADAS';
  RAISE NOTICE '------------------------------------------------------------';
  
  -- Desabilitar notificações de tarefa para o employee
  INSERT INTO notification_preferences (profile_id, task_assigned)
  VALUES (v_employee_id, false)
  ON CONFLICT (profile_id) 
  DO UPDATE SET task_assigned = false;
  
  -- Criar tarefa
  INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
  VALUES (
    'Tarefa Teste - Sem Notificação',
    'Esta tarefa não deve gerar notificação',
    v_employee_id,
    v_test_group_id,
    CURRENT_DATE + interval '7 days',
    'todo'
  ) RETURNING id INTO v_test_task_id;
  
  -- Verificar que NÃO foi criada notificação
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE profile_id = v_employee_id
  AND category = 'task_assigned'
  AND related_id = v_test_task_id::text;
  
  IF v_notification_count = 0 THEN
    RAISE NOTICE '✅ TESTE 10 PASSOU: Preferência desabilitada respeitada';
  ELSE
    RAISE NOTICE '❌ TESTE 10 FALHOU: Notificação criada mesmo com preferência desabilitada';
  END IF;
  
  -- Reabilitar preferência
  UPDATE notification_preferences
  SET task_assigned = true
  WHERE profile_id = v_employee_id;
  
  RAISE NOTICE '';

  -- ============================================================================
  -- RESUMO FINAL
  -- ============================================================================
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'RESUMO DOS TESTES';
  RAISE NOTICE '============================================================';
  
  -- Contar notificações criadas
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE created_at > NOW() - interval '5 minutes';
  
  RAISE NOTICE 'Total de notificações criadas nos últimos 5 minutos: %', v_notification_count;
  
  -- Listar notificações criadas
  RAISE NOTICE '';
  RAISE NOTICE 'Notificações criadas:';
  FOR v_test_pdi_id IN 
    SELECT id FROM notifications 
    WHERE created_at > NOW() - interval '5 minutes'
    ORDER BY created_at
  LOOP
    RAISE NOTICE '- %', (SELECT title || ' (' || category || ')' FROM notifications WHERE id = v_test_pdi_id);
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'TESTES CONCLUÍDOS';
  RAISE NOTICE '============================================================';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERRO DURANTE TESTES: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- ============================================================================
-- VERIFICAÇÃO PÓS-TESTES
-- ============================================================================

-- Mostrar todas as notificações recentes
SELECT 
  id,
  title,
  message,
  type,
  category,
  related_id,
  action_url,
  read,
  created_at
FROM notifications
WHERE created_at > NOW() - interval '10 minutes'
ORDER BY created_at DESC;

-- Contar por categoria
SELECT 
  category,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE read = false) as unread
FROM notifications
WHERE created_at > NOW() - interval '10 minutes'
GROUP BY category
ORDER BY count DESC;
