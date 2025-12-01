# Triggers de Notificações Automáticas

## Status: ✅ IMPLEMENTADO

Migration criada: `supabase/migrations/20251201125732_notification_triggers.sql`

---

## 📋 Resumo

Este migration implementa triggers de banco de dados que geram notificações automaticamente quando eventos específicos ocorrem no sistema.

---

## 🔔 Triggers Implementados

### PDI (Plano de Desenvolvimento Individual)

| Trigger | Evento | Notificação |
|---------|--------|-------------|
| `pdi_status_notification` | Status muda para `validated` | "✅ PDI Aprovado!" |
| `pdi_status_notification` | Status volta para `in-progress` | "⚠️ PDI Precisa de Ajustes" |

### Tarefas

| Trigger | Evento | Notificação |
|---------|--------|-------------|
| `task_assigned_notification` | Nova tarefa criada | "📋 Nova Tarefa Atribuída" |

### Grupos de Ação

| Trigger | Evento | Notificação |
|---------|--------|-------------|
| `group_participant_added_notification` | Usuário adicionado | "👥 Você foi adicionado a um Grupo" |
| `group_leader_promoted_notification` | Promovido a líder | "⭐ Você é agora Líder do Grupo" |

### Mentoria

| Trigger | Evento | Notificação |
|---------|--------|-------------|
| `mentorship_request_notification` | Nova solicitação | "🎓 Nova Solicitação de Mentoria" |
| `mentorship_accepted_notification` | Mentoria aceita | "✅ Mentoria Aceita!" |
| `mentorship_session_scheduled_notification` | Sessão agendada | "📅 Sessão de Mentoria Agendada/Confirmada" |

### Lembretes de Prazo

| Função | Descrição |
|--------|-----------|
| `send_deadline_reminders()` | Envia lembretes para PDIs (7, 3, 1 dia) e tarefas (3, 1 dia) |

---

## ⚙️ Funções Criadas

### `create_notification_if_enabled()`

Função auxiliar que cria notificações respeitando as preferências do usuário.

```sql
SELECT create_notification_if_enabled(
  'user-uuid-here',           -- profile_id
  '📢 Título',                -- title
  'Mensagem da notificação',  -- message
  'info',                     -- type: info, success, warning, error
  'task_assigned',            -- category (mapeada para preferência)
  'related-uuid',             -- related_id (opcional)
  '/dashboard'                -- action_url (opcional)
);
```

### `send_deadline_reminders()`

Função para enviar lembretes de prazo. Configure como cron job diário.

```sql
-- Executar manualmente
SELECT send_deadline_reminders();

-- Retorna: número de lembretes enviados
```

---

## 🔗 Mapeamento de Categorias → Preferências

| Categoria | Coluna em notification_preferences |
|-----------|-------------------------------------|
| `pdi_approved` | `pdi_approved` |
| `pdi_rejected` | `pdi_rejected` |
| `task_assigned` | `task_assigned` |
| `achievement_unlocked` | `achievement_unlocked` |
| `competency_evaluation` | `achievement_unlocked` |
| `group_invitation` | `group_invitation` |
| `group_leader` | `group_invitation` |
| `mentorship_request` | `mentorship_scheduled` |
| `mentorship_accepted` | `mentorship_scheduled` |
| `mentorship_scheduled` | `mentorship_scheduled` |
| `deadline_reminder` | `deadline_reminder` |

---

## 📦 Colunas Adicionadas

A migration adiciona automaticamente (se não existirem):

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `category` | text | 'general' | Categoria da notificação |
| `related_id` | text | NULL | ID do item relacionado |
| `metadata` | jsonb | '{}' | Dados adicionais |

---

## 🚀 Instalação

### 1. Executar Migration

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor no Dashboard
# Cole o conteúdo de: supabase/migrations/20251201125732_notification_triggers.sql
```

### 2. Configurar Cron Job (Lembretes de Prazo)

No Supabase Dashboard:
1. Vá em **Database → Cron Jobs**
2. Crie um novo job:
   - **Nome**: `daily_deadline_reminders`
   - **Schedule**: `0 9 * * *` (todos os dias às 9h)
   - **Command**: `SELECT send_deadline_reminders();`

---

## ✅ Validação

Execute o script de validação após a instalação:

```sql
-- Arquivo: supabase/migrations/tests/validate_notification_triggers.sql
```

### Verificação Rápida

```sql
-- Verificar funções criadas
SELECT proname FROM pg_proc 
WHERE proname LIKE 'notify_%' OR proname = 'create_notification_if_enabled';

-- Verificar triggers criados
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%notification%';

-- Testar criação manual
SELECT create_notification_if_enabled(
  'SEU-USER-ID'::uuid,
  '🧪 Teste',
  'Notificação de teste',
  'info',
  'general'
);
```

---

## 🧪 Testes Manuais

### 1. PDI Aprovado
```sql
UPDATE pdis SET status = 'validated' WHERE id = 'pdi-uuid';
-- Verificar: SELECT * FROM notifications WHERE category = 'pdi_approved';
```

### 2. Nova Tarefa
```sql
INSERT INTO tasks (title, assignee_id, deadline, group_id) 
VALUES ('Teste', 'user-uuid', CURRENT_DATE + 7, 'group-uuid');
-- Verificar: SELECT * FROM notifications WHERE category = 'task_assigned';
```

### 3. Participante de Grupo
```sql
INSERT INTO action_group_participants (group_id, profile_id, role)
VALUES ('group-uuid', 'user-uuid', 'member');
-- Verificar: SELECT * FROM notifications WHERE category = 'group_invitation';
```

### 4. Lembretes de Prazo
```sql
SELECT send_deadline_reminders();
-- Verificar: SELECT * FROM notifications WHERE category = 'deadline_reminder';
```

---

## 🔒 Segurança

- Todas as funções usam `SECURITY DEFINER`
- `search_path` definido como `public` para evitar ataques
- Preferências do usuário são sempre verificadas
- Triggers só executam para eventos específicos

---

## 📊 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20251201125732_notification_triggers.sql` | Migration principal |
| `supabase/migrations/tests/validate_notification_triggers.sql` | Script de validação |
| `src/services/notifications.ts` | Service de notificações (frontend) |
| `src/components/NotificationCenter.tsx` | Componente de UI |

---

## ⚠️ Troubleshooting

### Notificações não aparecem

1. Verifique se a migration foi executada
2. Verifique preferências do usuário: `SELECT * FROM notification_preferences WHERE profile_id = 'user-uuid'`
3. Verifique se o trigger está habilitado: `SELECT tgenabled FROM pg_trigger WHERE tgname = 'trigger_name'`

### Erro "function does not exist"

Execute a migration novamente ou verifique erros no log do Supabase.

### Duplicação de notificações

O sistema usa `related_id` para evitar duplicatas em lembretes. Para outros casos, verifique se o trigger não está sendo executado múltiplas vezes.

---

## ✅ Checklist de Implementação

- [x] Migration criada com timestamp correto
- [x] Função `create_notification_if_enabled()` implementada
- [x] 7 triggers implementados:
  - [x] PDI aprovado/rejeitado
  - [x] Tarefa atribuída
  - [x] Participante adicionado em grupo
  - [x] Promovido a líder
  - [x] Solicitação de mentoria
  - [x] Mentoria aceita
  - [x] Sessão de mentoria agendada
- [x] Função `send_deadline_reminders()` implementada
- [x] Índices de performance criados
- [x] Script de validação criado
- [x] Documentação completa

---

**Próximo passo**: Executar a migration no Supabase Dashboard.
