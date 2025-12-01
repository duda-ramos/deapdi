/*
  ============================================================================
  SCRIPT DE VALIDAÇÃO: Notification Triggers
  ============================================================================
  
  Execute este script após rodar a migration 20251201125732_notification_triggers.sql
  para verificar se todas as funções e triggers foram criados corretamente.
  
  Resultado esperado: Todas as verificações devem retornar TRUE
*/

-- ============================================================================
-- 1. VERIFICAR COLUNAS NA TABELA NOTIFICATIONS
-- ============================================================================

SELECT 
  'notifications.category' as check_item,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'category'
  ) as exists;

SELECT 
  'notifications.related_id' as check_item,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'related_id'
  ) as exists;

SELECT 
  'notifications.metadata' as check_item,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'metadata'
  ) as exists;

-- ============================================================================
-- 2. VERIFICAR FUNÇÕES CRIADAS
-- ============================================================================

SELECT 
  proname as function_name,
  TRUE as exists
FROM pg_proc 
WHERE proname IN (
  'create_notification_if_enabled',
  'notify_pdi_status_change',
  'notify_task_assigned',
  'notify_group_participant_added',
  'notify_group_leader_promoted',
  'notify_mentorship_request',
  'notify_mentorship_accepted',
  'notify_mentorship_session_scheduled',
  'send_deadline_reminders'
)
ORDER BY proname;

-- ============================================================================
-- 3. VERIFICAR TRIGGERS CRIADOS
-- ============================================================================

SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED (Origin)'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'ENABLED (Replica)'
    WHEN 'A' THEN 'ENABLED (Always)'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger 
WHERE tgname IN (
  'pdi_status_notification',
  'task_assigned_notification',
  'group_participant_added_notification',
  'group_leader_promoted_notification',
  'mentorship_request_notification',
  'mentorship_accepted_notification',
  'mentorship_session_scheduled_notification'
)
ORDER BY tgname;

-- ============================================================================
-- 4. VERIFICAR ÍNDICES CRIADOS
-- ============================================================================

SELECT 
  indexname,
  tablename,
  TRUE as exists
FROM pg_indexes 
WHERE indexname IN (
  'idx_notifications_profile_category',
  'idx_notifications_related_id',
  'idx_notifications_profile_unread',
  'idx_notifications_created_at_read'
)
ORDER BY indexname;

-- ============================================================================
-- 5. VERIFICAR TABELA NOTIFICATION_PREFERENCES
-- ============================================================================

SELECT 
  column_name,
  data_type,
  COALESCE(column_default, 'NULL') as default_value
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. CONTAGEM RESUMIDA
-- ============================================================================

SELECT 'RESUMO DA VALIDAÇÃO' as section;

SELECT 
  'Funções de notificação' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 9 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM pg_proc 
WHERE proname IN (
  'create_notification_if_enabled',
  'notify_pdi_status_change',
  'notify_task_assigned',
  'notify_group_participant_added',
  'notify_group_leader_promoted',
  'notify_mentorship_request',
  'notify_mentorship_accepted',
  'notify_mentorship_session_scheduled',
  'send_deadline_reminders'
);

SELECT 
  'Triggers de notificação' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 7 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM pg_trigger 
WHERE tgname LIKE '%notification%'
AND tgname NOT LIKE 'RI_%';  -- Excluir triggers de FK

SELECT 
  'Índices de notificação' as item,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ FALTANDO' END as status
FROM pg_indexes 
WHERE indexname LIKE 'idx_notifications%';

-- ============================================================================
-- 7. TESTE FUNCIONAL (OPCIONAL - REQUER USUÁRIO REAL)
-- ============================================================================

/*
  Para testar a função de criação de notificação, descomente e execute:
  
  -- Substitua 'SEU-USER-ID' pelo ID de um usuário real
  SELECT create_notification_if_enabled(
    'SEU-USER-ID'::uuid,
    '🧪 Teste de Validação',
    'Esta notificação foi criada pelo script de validação',
    'info',
    'general',
    NULL,
    '/profile'
  );
  
  -- Verificar se foi criada
  SELECT * FROM notifications 
  WHERE title = '🧪 Teste de Validação'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Limpar teste
  DELETE FROM notifications WHERE title = '🧪 Teste de Validação';
*/

-- ============================================================================
-- FIM DO SCRIPT DE VALIDAÇÃO
-- ============================================================================
