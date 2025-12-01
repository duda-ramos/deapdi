/*
  ============================================================================
  VALIDAÇÃO COMPLETA: Triggers de Notificação
  ============================================================================
  
  Este script realiza validação completa de todos os triggers de notificação.
  
  EXECUÇÃO:
  1. Cole este script no Supabase SQL Editor
  2. Execute e verifique os resultados
  3. Documente qualquer falha encontrada
  
  TRIGGERS VALIDADOS:
  1. PDI Aprovado (pdi_status_notification)
  2. PDI Rejeitado (pdi_status_notification)
  3. Tarefa Atribuída (task_assigned_notification)
  4. Participante Adicionado (group_participant_added_notification)
  5. Líder Promovido (group_leader_promoted_notification)
  6. Solicitação Mentoria (mentorship_request_notification)
  7. Mentoria Aceita (mentorship_accepted_notification)
  8. Sessão Agendada - Mentor (mentorship_session_scheduled_notification)
  9. Sessão Agendada - Mentee (mentorship_session_scheduled_notification)
  10. Lembrete PDI (send_deadline_reminders)
  11. Lembrete Tarefa (send_deadline_reminders)
  12. Preferências Desabilitadas (create_notification_if_enabled)
  
  ⚠️ ATENÇÃO: Este script modifica dados. Use em ambiente de teste!
*/

-- ============================================================================
-- TABELA DE RESULTADOS DOS TESTES
-- ============================================================================

DROP TABLE IF EXISTS _test_results;
CREATE TEMP TABLE _test_results (
  test_id serial PRIMARY KEY,
  test_name text NOT NULL,
  test_category text NOT NULL,
  expected text NOT NULL,
  actual text,
  passed boolean DEFAULT false,
  error_message text,
  executed_at timestamptz DEFAULT now()
);

-- ============================================================================
-- FUNÇÃO AUXILIAR PARA REGISTRAR RESULTADOS
-- ============================================================================

CREATE OR REPLACE FUNCTION _log_test_result(
  p_test_name text,
  p_category text,
  p_expected text,
  p_actual text,
  p_passed boolean,
  p_error text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO _test_results (test_name, test_category, expected, actual, passed, error_message)
  VALUES (p_test_name, p_category, p_expected, p_actual, p_passed, p_error);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INÍCIO DOS TESTES
-- ============================================================================

DO $$
DECLARE
  v_user1_id uuid;
  v_user2_id uuid;
  v_pdi_id uuid;
  v_group_id uuid;
  v_task_id uuid;
  v_mentorship_id uuid;
  v_session_id uuid;
  v_participant_id uuid;
  v_notification_id uuid;
  v_notification_count integer;
  v_notification_record record;
  v_start_time timestamptz := now();
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   VALIDAÇÃO COMPLETA DE TRIGGERS DE NOTIFICAÇÃO             ║';
  RAISE NOTICE '║   Data: %                                    ║', to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';

  -- ========================================================================
  -- PREPARAÇÃO: Buscar/Criar usuários de teste
  -- ========================================================================
  
  RAISE NOTICE '📋 PREPARAÇÃO: Buscando usuários de teste...';
  
  -- Buscar dois usuários diferentes
  SELECT id INTO v_user1_id FROM profiles WHERE role = 'employee' LIMIT 1;
  SELECT id INTO v_user2_id FROM profiles WHERE role IN ('manager', 'hr', 'admin') AND id != v_user1_id LIMIT 1;
  
  IF v_user1_id IS NULL THEN
    SELECT id INTO v_user1_id FROM profiles LIMIT 1;
  END IF;
  
  IF v_user2_id IS NULL THEN
    v_user2_id := v_user1_id;
  END IF;
  
  IF v_user1_id IS NULL THEN
    RAISE EXCEPTION '❌ ERRO CRÍTICO: Nenhum usuário encontrado. Crie usuários primeiro.';
  END IF;
  
  RAISE NOTICE '   ✓ Usuário 1: %', v_user1_id;
  RAISE NOTICE '   ✓ Usuário 2: %', v_user2_id;
  
  -- Limpar notificações de teste anteriores
  DELETE FROM notifications WHERE title LIKE '%Teste%' OR title LIKE '%Test%';
  RAISE NOTICE '   ✓ Notificações de teste anteriores removidas';
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 1: VERIFICAÇÃO DE FUNÇÕES
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 1: VERIFICAÇÃO DE FUNÇÕES E TRIGGERS';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  -- Verificar função create_notification_if_enabled
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_notification_if_enabled') THEN
    PERFORM _log_test_result('Função create_notification_if_enabled', 'SETUP', 'Existe', 'Existe', true);
    RAISE NOTICE '   ✅ create_notification_if_enabled() existe';
  ELSE
    PERFORM _log_test_result('Função create_notification_if_enabled', 'SETUP', 'Existe', 'Não existe', false, 'Função não encontrada');
    RAISE NOTICE '   ❌ create_notification_if_enabled() NÃO existe';
  END IF;
  
  -- Verificar função send_deadline_reminders
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_deadline_reminders') THEN
    PERFORM _log_test_result('Função send_deadline_reminders', 'SETUP', 'Existe', 'Existe', true);
    RAISE NOTICE '   ✅ send_deadline_reminders() existe';
  ELSE
    PERFORM _log_test_result('Função send_deadline_reminders', 'SETUP', 'Existe', 'Não existe', false, 'Função não encontrada');
    RAISE NOTICE '   ❌ send_deadline_reminders() NÃO existe';
  END IF;
  
  -- Verificar triggers
  FOR v_notification_record IN 
    SELECT tgname FROM pg_trigger 
    WHERE tgname IN (
      'pdi_status_notification',
      'task_assigned_notification',
      'group_participant_added_notification',
      'group_leader_promoted_notification',
      'mentorship_request_notification',
      'mentorship_accepted_notification',
      'mentorship_session_scheduled_notification'
    )
  LOOP
    PERFORM _log_test_result('Trigger ' || v_notification_record.tgname, 'SETUP', 'Existe', 'Existe', true);
    RAISE NOTICE '   ✅ Trigger % existe', v_notification_record.tgname;
  END LOOP;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 2: PDI APROVADO
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 2: PDI APROVADO';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Criar PDI com status completed
    INSERT INTO pdis (profile_id, title, description, status, deadline, created_by)
    VALUES (v_user1_id, 'PDI Teste Aprovação', 'Teste trigger', 'completed', CURRENT_DATE + 30, v_user2_id)
    RETURNING id INTO v_pdi_id;
    
    -- Aprovar PDI
    UPDATE pdis SET status = 'validated' WHERE id = v_pdi_id;
    
    -- Verificar notificação
    SELECT id, title, type, category, action_url INTO v_notification_record
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'pdi_approved'
    AND related_id = v_pdi_id::text
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_notification_record.id IS NOT NULL THEN
      PERFORM _log_test_result('PDI Aprovado - Notificação criada', 'PDI', 'Notificação criada', 'Notificação criada', true);
      RAISE NOTICE '   ✅ Notificação criada: %', v_notification_record.title;
      
      -- Validar campos
      IF v_notification_record.title = '✅ PDI Aprovado!' THEN
        PERFORM _log_test_result('PDI Aprovado - Título', 'PDI', '✅ PDI Aprovado!', v_notification_record.title, true);
        RAISE NOTICE '   ✅ Título correto';
      ELSE
        PERFORM _log_test_result('PDI Aprovado - Título', 'PDI', '✅ PDI Aprovado!', v_notification_record.title, false);
        RAISE NOTICE '   ❌ Título incorreto: %', v_notification_record.title;
      END IF;
      
      IF v_notification_record.type = 'success' THEN
        PERFORM _log_test_result('PDI Aprovado - Tipo', 'PDI', 'success', v_notification_record.type::text, true);
        RAISE NOTICE '   ✅ Tipo correto: success';
      ELSE
        PERFORM _log_test_result('PDI Aprovado - Tipo', 'PDI', 'success', v_notification_record.type::text, false);
        RAISE NOTICE '   ❌ Tipo incorreto: %', v_notification_record.type;
      END IF;
      
      IF v_notification_record.action_url = '/pdi' THEN
        PERFORM _log_test_result('PDI Aprovado - Action URL', 'PDI', '/pdi', v_notification_record.action_url, true);
        RAISE NOTICE '   ✅ Action URL correto: /pdi';
      ELSE
        PERFORM _log_test_result('PDI Aprovado - Action URL', 'PDI', '/pdi', COALESCE(v_notification_record.action_url, 'NULL'), false);
        RAISE NOTICE '   ❌ Action URL incorreto: %', v_notification_record.action_url;
      END IF;
    ELSE
      PERFORM _log_test_result('PDI Aprovado - Notificação criada', 'PDI', 'Notificação criada', 'Não criada', false, 'Trigger não executou');
      RAISE NOTICE '   ❌ Notificação NÃO foi criada';
    END IF;
    
    -- Cleanup
    DELETE FROM pdis WHERE id = v_pdi_id;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('PDI Aprovado', 'PDI', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 3: PDI REJEITADO
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 3: PDI REJEITADO';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Criar PDI com status completed
    INSERT INTO pdis (profile_id, title, description, status, deadline, created_by)
    VALUES (v_user1_id, 'PDI Teste Rejeição', 'Teste trigger', 'completed', CURRENT_DATE + 30, v_user2_id)
    RETURNING id INTO v_pdi_id;
    
    -- Rejeitar PDI (voltar para in-progress)
    UPDATE pdis SET status = 'in-progress' WHERE id = v_pdi_id;
    
    -- Verificar notificação
    SELECT id, title, type, category INTO v_notification_record
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'pdi_rejected'
    AND related_id = v_pdi_id::text
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_notification_record.id IS NOT NULL THEN
      PERFORM _log_test_result('PDI Rejeitado - Notificação criada', 'PDI', 'Notificação criada', 'Notificação criada', true);
      RAISE NOTICE '   ✅ Notificação criada: %', v_notification_record.title;
      
      IF v_notification_record.type = 'warning' THEN
        PERFORM _log_test_result('PDI Rejeitado - Tipo', 'PDI', 'warning', v_notification_record.type::text, true);
        RAISE NOTICE '   ✅ Tipo correto: warning';
      ELSE
        PERFORM _log_test_result('PDI Rejeitado - Tipo', 'PDI', 'warning', v_notification_record.type::text, false);
        RAISE NOTICE '   ❌ Tipo incorreto: %', v_notification_record.type;
      END IF;
    ELSE
      PERFORM _log_test_result('PDI Rejeitado - Notificação criada', 'PDI', 'Notificação criada', 'Não criada', false);
      RAISE NOTICE '   ❌ Notificação NÃO foi criada';
    END IF;
    
    -- Cleanup
    DELETE FROM pdis WHERE id = v_pdi_id;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('PDI Rejeitado', 'PDI', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 4: TAREFA ATRIBUÍDA
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 4: TAREFA ATRIBUÍDA';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Criar grupo primeiro
    INSERT INTO action_groups (title, description, deadline, created_by)
    VALUES ('Grupo Teste', 'Teste trigger', CURRENT_DATE + 30, v_user2_id)
    RETURNING id INTO v_group_id;
    
    -- Criar tarefa
    INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
    VALUES ('Tarefa Teste', 'Teste trigger', v_user1_id, v_group_id, CURRENT_DATE + 7, 'todo')
    RETURNING id INTO v_task_id;
    
    -- Verificar notificação
    SELECT id, title, type, category, message INTO v_notification_record
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'task_assigned'
    AND related_id = v_task_id::text
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_notification_record.id IS NOT NULL THEN
      PERFORM _log_test_result('Tarefa Atribuída - Notificação criada', 'TASK', 'Notificação criada', 'Notificação criada', true);
      RAISE NOTICE '   ✅ Notificação criada: %', v_notification_record.title;
      
      IF v_notification_record.title = '📋 Nova Tarefa Atribuída' THEN
        PERFORM _log_test_result('Tarefa Atribuída - Título', 'TASK', '📋 Nova Tarefa Atribuída', v_notification_record.title, true);
        RAISE NOTICE '   ✅ Título correto';
      END IF;
      
      IF v_notification_record.message LIKE '%Grupo Teste%' THEN
        PERFORM _log_test_result('Tarefa Atribuída - Mensagem com grupo', 'TASK', 'Contém nome do grupo', 'Contém', true);
        RAISE NOTICE '   ✅ Mensagem contém nome do grupo';
      ELSE
        PERFORM _log_test_result('Tarefa Atribuída - Mensagem com grupo', 'TASK', 'Contém nome do grupo', 'Não contém', false);
        RAISE NOTICE '   ⚠️ Mensagem não contém nome do grupo';
      END IF;
      
      IF v_notification_record.message LIKE '%/%/%' THEN
        PERFORM _log_test_result('Tarefa Atribuída - Mensagem com prazo', 'TASK', 'Contém prazo formatado', 'Contém', true);
        RAISE NOTICE '   ✅ Mensagem contém prazo formatado (DD/MM/YYYY)';
      END IF;
    ELSE
      PERFORM _log_test_result('Tarefa Atribuída - Notificação criada', 'TASK', 'Notificação criada', 'Não criada', false);
      RAISE NOTICE '   ❌ Notificação NÃO foi criada';
    END IF;
    
    -- Cleanup
    DELETE FROM tasks WHERE id = v_task_id;
    DELETE FROM action_groups WHERE id = v_group_id;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Tarefa Atribuída', 'TASK', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 5: PARTICIPANTE ADICIONADO EM GRUPO
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 5: PARTICIPANTE ADICIONADO EM GRUPO';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Criar grupo
    INSERT INTO action_groups (title, description, deadline, created_by)
    VALUES ('Grupo Teste Participante', 'Teste trigger', CURRENT_DATE + 30, v_user2_id)
    RETURNING id INTO v_group_id;
    
    -- Adicionar participante
    INSERT INTO action_group_participants (group_id, profile_id, role)
    VALUES (v_group_id, v_user1_id, 'member')
    RETURNING id INTO v_participant_id;
    
    -- Verificar notificação
    SELECT id, title, type, category, message INTO v_notification_record
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'group_invitation'
    AND related_id = v_group_id::text
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_notification_record.id IS NOT NULL THEN
      PERFORM _log_test_result('Participante Adicionado - Notificação criada', 'GROUP', 'Notificação criada', 'Notificação criada', true);
      RAISE NOTICE '   ✅ Notificação criada: %', v_notification_record.title;
      
      IF v_notification_record.title = '👥 Você foi adicionado a um Grupo' THEN
        PERFORM _log_test_result('Participante Adicionado - Título', 'GROUP', 'Título correto', 'Título correto', true);
        RAISE NOTICE '   ✅ Título correto';
      END IF;
      
      IF v_notification_record.message LIKE '%Grupo Teste Participante%' THEN
        PERFORM _log_test_result('Participante Adicionado - Nome do grupo', 'GROUP', 'Contém nome', 'Contém nome', true);
        RAISE NOTICE '   ✅ Mensagem contém nome do grupo';
      END IF;
    ELSE
      PERFORM _log_test_result('Participante Adicionado - Notificação criada', 'GROUP', 'Notificação criada', 'Não criada', false);
      RAISE NOTICE '   ❌ Notificação NÃO foi criada';
    END IF;
    
    -- Cleanup será feito no teste seguinte
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Participante Adicionado', 'GROUP', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 6: PROMOVIDO A LÍDER
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 6: PROMOVIDO A LÍDER';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Usar grupo e participante do teste anterior
    IF v_group_id IS NOT NULL THEN
      -- Promover a líder
      UPDATE action_group_participants 
      SET role = 'leader' 
      WHERE group_id = v_group_id AND profile_id = v_user1_id;
      
      -- Verificar notificação
      SELECT id, title, type, category INTO v_notification_record
      FROM notifications
      WHERE profile_id = v_user1_id
      AND category = 'group_leader'
      AND related_id = v_group_id::text
      ORDER BY created_at DESC LIMIT 1;
      
      IF v_notification_record.id IS NOT NULL THEN
        PERFORM _log_test_result('Promovido a Líder - Notificação criada', 'GROUP', 'Notificação criada', 'Notificação criada', true);
        RAISE NOTICE '   ✅ Notificação criada: %', v_notification_record.title;
        
        IF v_notification_record.type = 'success' THEN
          PERFORM _log_test_result('Promovido a Líder - Tipo', 'GROUP', 'success', 'success', true);
          RAISE NOTICE '   ✅ Tipo correto: success';
        END IF;
      ELSE
        PERFORM _log_test_result('Promovido a Líder - Notificação criada', 'GROUP', 'Notificação criada', 'Não criada', false);
        RAISE NOTICE '   ❌ Notificação NÃO foi criada';
      END IF;
      
      -- Cleanup
      DELETE FROM action_group_participants WHERE group_id = v_group_id;
      DELETE FROM action_groups WHERE id = v_group_id;
    ELSE
      RAISE NOTICE '   ⏭️ Pulado - grupo não disponível do teste anterior';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Promovido a Líder', 'GROUP', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 7: SOLICITAÇÃO DE MENTORIA
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 7: SOLICITAÇÃO DE MENTORIA';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Verificar se já existe mentoria entre esses usuários
    DELETE FROM mentorships WHERE mentor_id = v_user2_id AND mentee_id = v_user1_id;
    
    -- Criar mentoria (simula solicitação)
    INSERT INTO mentorships (mentor_id, mentee_id, status)
    VALUES (v_user2_id, v_user1_id, 'active')
    RETURNING id INTO v_mentorship_id;
    
    -- Verificar notificação para mentor
    SELECT id, title, type, category INTO v_notification_record
    FROM notifications
    WHERE profile_id = v_user2_id
    AND category = 'mentorship_request'
    AND related_id = v_mentorship_id::text
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_notification_record.id IS NOT NULL THEN
      PERFORM _log_test_result('Solicitação Mentoria - Notificação criada', 'MENTORSHIP', 'Notificação criada', 'Notificação criada', true);
      RAISE NOTICE '   ✅ Notificação para mentor criada: %', v_notification_record.title;
      
      IF v_notification_record.title = '🎓 Nova Solicitação de Mentoria' THEN
        PERFORM _log_test_result('Solicitação Mentoria - Título', 'MENTORSHIP', 'Título correto', 'Título correto', true);
        RAISE NOTICE '   ✅ Título correto';
      END IF;
    ELSE
      PERFORM _log_test_result('Solicitação Mentoria - Notificação criada', 'MENTORSHIP', 'Notificação criada', 'Não criada', false);
      RAISE NOTICE '   ❌ Notificação NÃO foi criada';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Solicitação Mentoria', 'MENTORSHIP', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 8: MENTORIA ACEITA
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 8: MENTORIA ACEITA';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    IF v_mentorship_id IS NOT NULL THEN
      -- Mudar status para paused primeiro
      UPDATE mentorships SET status = 'paused' WHERE id = v_mentorship_id;
      
      -- Aceitar mentoria
      UPDATE mentorships SET status = 'active' WHERE id = v_mentorship_id;
      
      -- Verificar notificação para mentee
      SELECT id, title, type, category INTO v_notification_record
      FROM notifications
      WHERE profile_id = v_user1_id
      AND category = 'mentorship_accepted'
      AND related_id = v_mentorship_id::text
      ORDER BY created_at DESC LIMIT 1;
      
      IF v_notification_record.id IS NOT NULL THEN
        PERFORM _log_test_result('Mentoria Aceita - Notificação criada', 'MENTORSHIP', 'Notificação criada', 'Notificação criada', true);
        RAISE NOTICE '   ✅ Notificação para mentee criada: %', v_notification_record.title;
        
        IF v_notification_record.type = 'success' THEN
          PERFORM _log_test_result('Mentoria Aceita - Tipo', 'MENTORSHIP', 'success', 'success', true);
          RAISE NOTICE '   ✅ Tipo correto: success';
        END IF;
      ELSE
        PERFORM _log_test_result('Mentoria Aceita - Notificação criada', 'MENTORSHIP', 'Notificação criada', 'Não criada', false);
        RAISE NOTICE '   ❌ Notificação NÃO foi criada';
      END IF;
    ELSE
      RAISE NOTICE '   ⏭️ Pulado - mentoria não disponível';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Mentoria Aceita', 'MENTORSHIP', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 9: SESSÃO DE MENTORIA AGENDADA
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 9: SESSÃO DE MENTORIA AGENDADA';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    IF v_mentorship_id IS NOT NULL THEN
      -- Criar sessão
      INSERT INTO mentorship_sessions (
        mentorship_id, 
        session_date,
        duration_minutes,
        topics_discussed,
        action_items
      )
      VALUES (
        v_mentorship_id,
        NOW() + interval '3 days',
        60,
        'Teste de sessão',
        'Ações de teste'
      )
      RETURNING id INTO v_session_id;
      
      -- Verificar notificação para mentor
      SELECT id, title, type INTO v_notification_record
      FROM notifications
      WHERE profile_id = v_user2_id
      AND category = 'mentorship_scheduled'
      AND related_id = v_session_id::text
      ORDER BY created_at DESC LIMIT 1;
      
      IF v_notification_record.id IS NOT NULL THEN
        PERFORM _log_test_result('Sessão Agendada - Mentor', 'MENTORSHIP', 'Notificação criada', 'Notificação criada', true);
        RAISE NOTICE '   ✅ Notificação para mentor criada: %', v_notification_record.title;
        
        IF v_notification_record.type = 'info' THEN
          PERFORM _log_test_result('Sessão Agendada Mentor - Tipo', 'MENTORSHIP', 'info', 'info', true);
          RAISE NOTICE '   ✅ Tipo correto (mentor): info';
        END IF;
      ELSE
        PERFORM _log_test_result('Sessão Agendada - Mentor', 'MENTORSHIP', 'Notificação criada', 'Não criada', false);
        RAISE NOTICE '   ❌ Notificação para mentor NÃO foi criada';
      END IF;
      
      -- Verificar notificação para mentee
      SELECT id, title, type INTO v_notification_record
      FROM notifications
      WHERE profile_id = v_user1_id
      AND category = 'mentorship_scheduled'
      AND related_id = v_session_id::text
      ORDER BY created_at DESC LIMIT 1;
      
      IF v_notification_record.id IS NOT NULL THEN
        PERFORM _log_test_result('Sessão Agendada - Mentee', 'MENTORSHIP', 'Notificação criada', 'Notificação criada', true);
        RAISE NOTICE '   ✅ Notificação para mentee criada: %', v_notification_record.title;
        
        IF v_notification_record.type = 'success' THEN
          PERFORM _log_test_result('Sessão Agendada Mentee - Tipo', 'MENTORSHIP', 'success', 'success', true);
          RAISE NOTICE '   ✅ Tipo correto (mentee): success';
        END IF;
      ELSE
        PERFORM _log_test_result('Sessão Agendada - Mentee', 'MENTORSHIP', 'Notificação criada', 'Não criada', false);
        RAISE NOTICE '   ❌ Notificação para mentee NÃO foi criada';
      END IF;
      
      -- Cleanup
      DELETE FROM mentorship_sessions WHERE id = v_session_id;
    ELSE
      RAISE NOTICE '   ⏭️ Pulado - mentoria não disponível';
    END IF;
    
    -- Cleanup mentoria
    IF v_mentorship_id IS NOT NULL THEN
      DELETE FROM mentorships WHERE id = v_mentorship_id;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Sessão Agendada', 'MENTORSHIP', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 10: LEMBRETES DE PRAZO
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 10: LEMBRETES DE PRAZO';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Criar PDI com prazo em 3 dias
    INSERT INTO pdis (profile_id, title, description, status, deadline, created_by)
    VALUES (v_user1_id, 'PDI Teste Lembrete', 'Teste lembrete', 'in-progress', CURRENT_DATE + interval '3 days', v_user2_id)
    RETURNING id INTO v_pdi_id;
    
    -- Criar grupo para tarefa
    INSERT INTO action_groups (title, description, deadline, created_by)
    VALUES ('Grupo Teste Lembrete', 'Teste', CURRENT_DATE + 30, v_user2_id)
    RETURNING id INTO v_group_id;
    
    -- Criar tarefa com prazo em 1 dia
    INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
    VALUES ('Tarefa Teste Lembrete', 'Teste', v_user1_id, v_group_id, CURRENT_DATE + interval '1 day', 'todo')
    RETURNING id INTO v_task_id;
    
    -- Executar função de lembretes
    SELECT send_deadline_reminders() INTO v_notification_count;
    
    PERFORM _log_test_result('Lembretes - Função executada', 'REMINDER', 'Retornou número', v_notification_count::text, true);
    RAISE NOTICE '   ✅ send_deadline_reminders() executou e criou % lembrete(s)', v_notification_count;
    
    -- Verificar lembrete de PDI
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'deadline_reminder'
    AND related_id = v_pdi_id::text;
    
    IF v_notification_count > 0 THEN
      PERFORM _log_test_result('Lembrete PDI - Criado', 'REMINDER', 'Criado', 'Criado', true);
      RAISE NOTICE '   ✅ Lembrete de PDI criado';
    ELSE
      PERFORM _log_test_result('Lembrete PDI - Criado', 'REMINDER', 'Criado', 'Não criado', false);
      RAISE NOTICE '   ❌ Lembrete de PDI NÃO criado';
    END IF;
    
    -- Verificar lembrete de tarefa
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'deadline_reminder'
    AND related_id = v_task_id::text;
    
    IF v_notification_count > 0 THEN
      PERFORM _log_test_result('Lembrete Tarefa - Criado', 'REMINDER', 'Criado', 'Criado', true);
      RAISE NOTICE '   ✅ Lembrete de tarefa criado';
    ELSE
      PERFORM _log_test_result('Lembrete Tarefa - Criado', 'REMINDER', 'Criado', 'Não criado', false);
      RAISE NOTICE '   ❌ Lembrete de tarefa NÃO criado';
    END IF;
    
    -- Testar que não duplica
    SELECT send_deadline_reminders() INTO v_notification_count;
    RAISE NOTICE '   ℹ️ Segunda execução criou % lembrete(s) adicionais (esperado: 0)', v_notification_count;
    
    IF v_notification_count = 0 THEN
      PERFORM _log_test_result('Lembretes - Sem duplicação', 'REMINDER', 'Não duplicou', 'Não duplicou', true);
      RAISE NOTICE '   ✅ Não houve duplicação';
    END IF;
    
    -- Cleanup
    DELETE FROM tasks WHERE id = v_task_id;
    DELETE FROM action_groups WHERE id = v_group_id;
    DELETE FROM pdis WHERE id = v_pdi_id;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Lembretes', 'REMINDER', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 11: PREFERÊNCIAS DESABILITADAS
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 11: PREFERÊNCIAS DESABILITADAS';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  BEGIN
    -- Criar grupo
    INSERT INTO action_groups (title, description, deadline, created_by)
    VALUES ('Grupo Teste Preferência', 'Teste', CURRENT_DATE + 30, v_user2_id)
    RETURNING id INTO v_group_id;
    
    -- Desabilitar notificações de tarefa
    INSERT INTO notification_preferences (profile_id, task_assigned)
    VALUES (v_user1_id, false)
    ON CONFLICT (profile_id) DO UPDATE SET task_assigned = false;
    
    RAISE NOTICE '   ℹ️ Preferência task_assigned desabilitada para usuário';
    
    -- Criar tarefa
    INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status)
    VALUES ('Tarefa Teste Preferência', 'Não deve gerar notificação', v_user1_id, v_group_id, CURRENT_DATE + 7, 'todo')
    RETURNING id INTO v_task_id;
    
    -- Verificar que NÃO foi criada
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE profile_id = v_user1_id
    AND category = 'task_assigned'
    AND related_id = v_task_id::text;
    
    IF v_notification_count = 0 THEN
      PERFORM _log_test_result('Preferências - Respeitada', 'PREFERENCES', 'Não criou', 'Não criou', true);
      RAISE NOTICE '   ✅ Preferência respeitada - notificação NÃO foi criada';
    ELSE
      PERFORM _log_test_result('Preferências - Respeitada', 'PREFERENCES', 'Não criou', 'Criou', false);
      RAISE NOTICE '   ❌ Preferência NÃO respeitada - notificação FOI criada';
    END IF;
    
    -- Reabilitar
    UPDATE notification_preferences SET task_assigned = true WHERE profile_id = v_user1_id;
    RAISE NOTICE '   ℹ️ Preferência reabilitada';
    
    -- Cleanup
    DELETE FROM tasks WHERE id = v_task_id;
    DELETE FROM action_groups WHERE id = v_group_id;
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM _log_test_result('Preferências', 'PREFERENCES', 'Sucesso', 'Erro', false, SQLERRM);
    RAISE NOTICE '   ❌ ERRO: %', SQLERRM;
  END;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- TESTE 12: VALIDAÇÃO DE ESTRUTURA DAS NOTIFICAÇÕES
  -- ========================================================================
  
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'TESTE 12: VALIDAÇÃO DE ESTRUTURA';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  
  -- Verificar colunas na tabela
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    PERFORM _log_test_result('Estrutura - Coluna category', 'STRUCTURE', 'Existe', 'Existe', true);
    RAISE NOTICE '   ✅ Coluna category existe';
  ELSE
    PERFORM _log_test_result('Estrutura - Coluna category', 'STRUCTURE', 'Existe', 'Não existe', false);
    RAISE NOTICE '   ❌ Coluna category NÃO existe';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'related_id'
  ) THEN
    PERFORM _log_test_result('Estrutura - Coluna related_id', 'STRUCTURE', 'Existe', 'Existe', true);
    RAISE NOTICE '   ✅ Coluna related_id existe';
  ELSE
    PERFORM _log_test_result('Estrutura - Coluna related_id', 'STRUCTURE', 'Existe', 'Não existe', false);
    RAISE NOTICE '   ❌ Coluna related_id NÃO existe';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    PERFORM _log_test_result('Estrutura - Coluna action_url', 'STRUCTURE', 'Existe', 'Existe', true);
    RAISE NOTICE '   ✅ Coluna action_url existe';
  ELSE
    PERFORM _log_test_result('Estrutura - Coluna action_url', 'STRUCTURE', 'Existe', 'Não existe', false);
    RAISE NOTICE '   ❌ Coluna action_url NÃO existe';
  END IF;
  
  -- Verificar índices
  SELECT COUNT(*) INTO v_notification_count
  FROM pg_indexes
  WHERE tablename = 'notifications'
  AND indexname LIKE 'idx_notifications%';
  
  PERFORM _log_test_result('Estrutura - Índices', 'STRUCTURE', '4 índices', v_notification_count::text, v_notification_count >= 4);
  RAISE NOTICE '   ℹ️ % índices de notificação encontrados', v_notification_count;
  
  RAISE NOTICE '';

  -- ========================================================================
  -- RELATÓRIO FINAL
  -- ========================================================================
  
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                    RELATÓRIO FINAL                           ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  -- Tempo total
  RAISE NOTICE 'Tempo de execução: % segundos', EXTRACT(EPOCH FROM (now() - v_start_time))::numeric(10,2);
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- EXIBIR RESULTADOS
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT 'RESUMO DOS TESTES' as title;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  test_category as "Categoria",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE passed) as "✅ Passou",
  COUNT(*) FILTER (WHERE NOT passed) as "❌ Falhou"
FROM _test_results
GROUP BY test_category
ORDER BY test_category;

SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  CASE WHEN passed THEN '✅' ELSE '❌' END as "Status",
  test_name as "Teste",
  expected as "Esperado",
  actual as "Resultado",
  COALESCE(error_message, '-') as "Erro"
FROM _test_results
ORDER BY test_id;

SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  'TOTAL' as "Categoria",
  COUNT(*) as "Testes",
  COUNT(*) FILTER (WHERE passed) as "Passou",
  COUNT(*) FILTER (WHERE NOT passed) as "Falhou",
  ROUND(100.0 * COUNT(*) FILTER (WHERE passed) / NULLIF(COUNT(*), 0), 1) || '%' as "Taxa de Sucesso"
FROM _test_results;

-- Limpar
DROP FUNCTION IF EXISTS _log_test_result;
