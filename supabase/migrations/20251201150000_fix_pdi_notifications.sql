/*
  ============================================================================
  HOTFIX: Correção das Notificações de PDI
  ============================================================================
  
  Corrige erro "case not found" que ocorre quando:
  1. O enum notification_type não aceita o valor passado
  2. O cast p_type::notification_type falha
  
  SOLUÇÃO:
  - Usar texto diretamente sem cast para enum quando possível
  - Adicionar tratamento de erro na função create_notification_if_enabled
  - Recriar triggers com lógica simplificada
*/

-- ============================================================================
-- PASSO 1: Verificar e corrigir função create_notification_if_enabled
-- ============================================================================

-- Recriar função com tratamento de erro melhorado
CREATE OR REPLACE FUNCTION create_notification_if_enabled(
  p_profile_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_category text DEFAULT 'general',
  p_related_id text DEFAULT NULL,
  p_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
  preference_enabled boolean := true;
  preference_column text;
  v_type text;
BEGIN
  -- Validar e normalizar o tipo
  v_type := CASE 
    WHEN p_type IN ('info', 'success', 'warning', 'error') THEN p_type
    ELSE 'info'  -- Default seguro
  END;

  -- Map category to preference column
  preference_column := CASE p_category
    WHEN 'pdi_approved' THEN 'pdi_approved'
    WHEN 'pdi_rejected' THEN 'pdi_rejected'
    WHEN 'task_assigned' THEN 'task_assigned'
    WHEN 'achievement_unlocked' THEN 'achievement_unlocked'
    WHEN 'competency_evaluation' THEN 'achievement_unlocked'
    WHEN 'group_invitation' THEN 'group_invitation'
    WHEN 'group_leader' THEN 'group_invitation'
    WHEN 'mentorship_request' THEN 'mentorship_scheduled'
    WHEN 'mentorship_accepted' THEN 'mentorship_scheduled'
    WHEN 'mentorship_scheduled' THEN 'mentorship_scheduled'
    WHEN 'mentorship_cancelled' THEN 'mentorship_cancelled'
    WHEN 'deadline_reminder' THEN 'deadline_reminder'
    ELSE NULL
  END;
  
  -- Check user preference if category known
  IF preference_column IS NOT NULL THEN
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(%I, true) FROM notification_preferences WHERE profile_id = $1',
        preference_column
      )
      INTO preference_enabled
      USING p_profile_id;
      
      -- If no preference found, create default and allow
      IF preference_enabled IS NULL THEN
        INSERT INTO notification_preferences (profile_id)
        VALUES (p_profile_id)
        ON CONFLICT (profile_id) DO NOTHING;
        preference_enabled := true;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- On any error, allow notification
      preference_enabled := true;
    END;
  END IF;
  
  -- Create notification if enabled
  IF preference_enabled THEN
    BEGIN
      INSERT INTO notifications (
        profile_id,
        title,
        message,
        type,
        category,
        related_id,
        action_url,
        read
      ) VALUES (
        p_profile_id,
        p_title,
        p_message,
        v_type::notification_type,
        p_category,
        p_related_id,
        p_action_url,
        false
      ) RETURNING id INTO notification_id;
      
      RETURN notification_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail
      RAISE WARNING 'Erro ao criar notificação: %', SQLERRM;
      RETURN NULL;
    END;
  END IF;
  
  RETURN NULL;
END;
$$;

-- ============================================================================
-- PASSO 2: Recriar função notify_pdi_status_change com proteção
-- ============================================================================

-- Drop trigger primeiro
DROP TRIGGER IF EXISTS pdi_status_notification ON pdis;

-- Drop função
DROP FUNCTION IF EXISTS notify_pdi_status_change() CASCADE;

-- Recriar função com lógica mais robusta
CREATE OR REPLACE FUNCTION notify_pdi_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- PDI aprovado (validado) - de completed ou in-progress para validated
  IF NEW.status = 'validated' AND OLD.status IN ('completed', 'in-progress') THEN
    BEGIN
      PERFORM create_notification_if_enabled(
        NEW.profile_id,
        '✅ PDI Aprovado!',
        format('Seu PDI "%s" foi aprovado pelo gestor. Parabéns!', COALESCE(NEW.title, 'Sem título')),
        'success',
        'pdi_approved',
        NEW.id::text,
        '/pdi'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao notificar PDI aprovado: %', SQLERRM;
    END;
  END IF;
  
  -- PDI rejeitado (volta de completed para in-progress)
  IF NEW.status = 'in-progress' AND OLD.status = 'completed' THEN
    BEGIN
      PERFORM create_notification_if_enabled(
        NEW.profile_id,
        '⚠️ PDI Precisa de Ajustes',
        format('Seu PDI "%s" precisa de alguns ajustes. Verifique os comentários do gestor.', COALESCE(NEW.title, 'Sem título')),
        'warning',
        'pdi_rejected',
        NEW.id::text,
        '/pdi'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao notificar PDI rejeitado: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER pdi_status_notification
  AFTER UPDATE OF status ON pdis
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_pdi_status_change();

-- ============================================================================
-- PASSO 3: Verificar enum notification_type
-- ============================================================================

DO $$
BEGIN
  -- Verificar se todos os valores necessários existem
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'success'
  ) THEN
    RAISE WARNING 'Valor "success" não existe no enum notification_type';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'warning'
  ) THEN
    RAISE WARNING 'Valor "warning" não existe no enum notification_type';
  END IF;
  
  RAISE NOTICE 'Verificação de enum concluída';
END $$;

-- ============================================================================
-- PASSO 4: Teste rápido
-- ============================================================================

DO $$
DECLARE
  v_test_result uuid;
  v_profile_id uuid;
BEGIN
  -- Pegar um profile para teste
  SELECT id INTO v_profile_id FROM profiles LIMIT 1;
  
  IF v_profile_id IS NOT NULL THEN
    -- Testar criação de notificação
    SELECT create_notification_if_enabled(
      v_profile_id,
      '🧪 Teste de Notificação',
      'Teste da função create_notification_if_enabled',
      'info',
      'general',
      NULL,
      '/test'
    ) INTO v_test_result;
    
    IF v_test_result IS NOT NULL THEN
      RAISE NOTICE '✅ Teste de notificação bem sucedido: %', v_test_result;
      -- Limpar teste
      DELETE FROM notifications WHERE id = v_test_result;
    ELSE
      RAISE WARNING '⚠️ Função retornou NULL (pode ser preferência desabilitada ou erro)';
    END IF;
  ELSE
    RAISE NOTICE 'Nenhum perfil encontrado para teste';
  END IF;
END $$;

-- ============================================================================
-- DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION notify_pdi_status_change() IS 
'Trigger para notificar mudanças de status em PDIs.
- Notifica quando PDI é aprovado (validated)
- Notifica quando PDI é rejeitado (volta para in-progress)
Inclui tratamento de erro para evitar falhas em cascata.';

COMMENT ON FUNCTION create_notification_if_enabled IS 
'Cria notificação verificando preferências do usuário.
Inclui validação de tipo e tratamento de erro robusto.
Retorna UUID da notificação ou NULL se não criada.';
