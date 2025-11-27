# Sistema de Triggers para Notificações Automáticas

## Resumo da Implementação

Este documento descreve os triggers de banco de dados implementados para criar notificações automáticas no sistema.

**Migration:** `supabase/migrations/20251127000000_notification_triggers.sql`

---

## Triggers Implementados

### 1. PDI (Plano de Desenvolvimento Individual)

| Trigger | Evento | Notifica | Categoria |
|---------|--------|----------|-----------|
| `pdi_status_notification` | PDI aprovado (status → 'validated') | Dono do PDI | `pdi_approved` |
| `pdi_status_notification` | PDI rejeitado (status → 'in_progress') | Dono do PDI | `pdi_rejected` |

**Mensagens:**
- ✅ PDI Aprovado! → "Seu PDI '{title}' foi aprovado pelo gestor. Parabéns!"
- ⚠️ PDI Precisa de Ajustes → "Seu PDI '{title}' precisa de alguns ajustes. Verifique os comentários do gestor."

---

### 2. Tarefas

| Trigger | Evento | Notifica | Categoria |
|---------|--------|----------|-----------|
| `task_assigned_notification` | Nova tarefa criada | Assignee | `task_assigned` |

**Mensagem:**
- 📋 Nova Tarefa Atribuída → "Você recebeu uma nova tarefa: '{title}'. Prazo: {deadline}"

---

### 3. Conquistas

| Trigger | Evento | Notifica | Categoria |
|---------|--------|----------|-----------|
| `achievement_unlocked_notification` | Conquista desbloqueada | Dono do perfil | `achievement_unlocked` |

**Mensagem:**
- 🏆 Conquista Desbloqueada! → "Parabéns! Você desbloqueou a conquista: {achievement_name}"

---

### 4. Grupos de Ação

| Trigger | Evento | Notifica | Categoria |
|---------|--------|----------|-----------|
| `group_participant_added_notification` | Adicionado em grupo | Novo participante | `group_invitation` |
| `group_leader_promotion_notification` | Promovido a líder | Participante promovido | `group_leader` |

**Mensagens:**
- 👥 Você foi adicionado a um Grupo → "Você foi adicionado ao grupo '{group_title}'"
- ⭐ Você é agora Líder do Grupo → "Você foi promovido a líder do grupo '{group_title}'"

---

### 5. Mentoria

| Trigger | Evento | Notifica | Categoria |
|---------|--------|----------|-----------|
| `mentorship_request_notification` | Nova solicitação | Mentor | `mentorship_request` |
| `mentorship_accepted_notification` | Mentoria aceita | Mentee | `mentorship_accepted` |
| `mentorship_accepted_notification` | Mentoria recusada | Mentee | `mentorship_rejected` |
| `mentorship_session_scheduled_notification` | Sessão agendada | Mentor e Mentee | `mentorship_scheduled` |
| `mentorship_session_cancelled_notification` | Sessão cancelada | Mentor e Mentee | `mentorship_cancelled` |

**Mensagens:**
- 🎓 Nova Solicitação de Mentoria → "{mentee_name} solicitou mentoria com você"
- ✅ Mentoria Aceita! → "{mentor_name} aceitou sua solicitação de mentoria"
- ❌ Solicitação de Mentoria Recusada → "{mentor_name} não pôde aceitar sua solicitação de mentoria no momento"
- 📅 Sessão de Mentoria Agendada → "Sessão agendada com {name} para {date} às {time}"
- ❌ Sessão de Mentoria Cancelada → "A sessão de mentoria com {name} do dia {date} foi cancelada"

---

## Funções Auxiliares

### `check_notification_preference(profile_id, notification_type)`
Verifica se um tipo de notificação está habilitado para o usuário.

**Parâmetros:**
- `profile_id` (uuid) - ID do perfil
- `notification_type` (text) - Categoria da notificação

**Retorno:** `boolean`

### `create_notification_if_enabled(...)`
Cria uma notificação apenas se as preferências do usuário permitirem.

**Parâmetros:**
- `p_profile_id` (uuid) - ID do perfil
- `p_title` (text) - Título da notificação
- `p_message` (text) - Mensagem da notificação
- `p_type` (text) - Tipo: 'info', 'success', 'warning', 'error'
- `p_category` (text) - Categoria para filtrar preferências
- `p_related_id` (uuid) - ID do recurso relacionado
- `p_action_url` (text) - URL para navegação
- `p_metadata` (jsonb) - Dados adicionais

**Retorno:** `uuid` do notification criado ou `NULL`

### `cleanup_old_notifications()`
Remove notificações antigas:
- Lidas há mais de 30 dias
- Todas com mais de 90 dias

### `get_notification_stats(profile_id)`
Retorna estatísticas de notificações para um usuário.

---

## Colunas Adicionadas

A migration adiciona as seguintes colunas à tabela `notifications`:

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `category` | text | 'general' | Categoria para filtrar preferências |
| `related_id` | uuid | NULL | ID do recurso relacionado |
| `metadata` | jsonb | '{}' | Dados adicionais em JSON |

---

## Preferências de Notificação

O sistema respeita as seguintes preferências na tabela `notification_preferences`:

| Preferência | Categorias Afetadas |
|-------------|---------------------|
| `pdi_approved` | pdi_approved |
| `pdi_rejected` | pdi_rejected |
| `task_assigned` | task_assigned |
| `achievement_unlocked` | achievement_unlocked |
| `mentorship_scheduled` | mentorship_scheduled, mentorship_request, mentorship_accepted |
| `mentorship_cancelled` | mentorship_cancelled, mentorship_rejected |
| `group_invitation` | group_invitation, group_leader |
| `deadline_reminder` | deadline_reminder |

---

## Validação

Para validar os triggers, execute o script:

```sql
\i VALIDATE_NOTIFICATION_TRIGGERS.sql
```

### Checklist de Validação

- [ ] Todas as 12 funções criadas
- [ ] Todos os 9 triggers ativos
- [ ] Colunas category, related_id, metadata existem
- [ ] Notificação de PDI aprovado funciona
- [ ] Notificação de PDI rejeitado funciona
- [ ] Notificação de tarefa atribuída funciona
- [ ] Notificação de conquista funciona
- [ ] Notificação de adição em grupo funciona
- [ ] Notificação de promoção a líder funciona
- [ ] Notificação de solicitação de mentoria funciona
- [ ] Notificação de mentoria aceita funciona
- [ ] Notificação de sessão agendada funciona (mentor e mentee)
- [ ] Notificação de sessão cancelada funciona (mentor e mentee)
- [ ] Preferências desabilitadas são respeitadas
- [ ] Função get_notification_stats funciona
- [ ] Nenhuma notificação duplicada

---

## Índices de Performance

A migration cria os seguintes índices para otimizar queries:

```sql
CREATE INDEX idx_notifications_profile_category ON notifications(profile_id, category);
CREATE INDEX idx_notifications_profile_read ON notifications(profile_id, read);
CREATE INDEX idx_notifications_created_at_read ON notifications(created_at, read);
CREATE INDEX idx_notifications_profile_created_desc ON notifications(profile_id, created_at DESC);
```

---

## Troubleshooting

### Notificação não criada

1. Verificar se o trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'nome_do_trigger';
   ```

2. Verificar preferências do usuário:
   ```sql
   SELECT * FROM notification_preferences WHERE profile_id = 'uuid';
   ```

3. Verificar se a função existe:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'nome_da_funcao';
   ```

### Erro de coluna não existe

Executar novamente a seção 0 da migration para adicionar colunas:
```sql
\i supabase/migrations/20251127000000_notification_triggers.sql
```

---

## Triggers NÃO Implementados

Os seguintes triggers foram mencionados no escopo original mas **não foram implementados**:

1. **Avaliação de Competências**
   - Tabela `competency_evaluations` pode não existir
   - Requer análise do esquema existente

2. **Prazo de Tarefa Próximo (Deadline Reminder)**
   - Requer cron job, não é um trigger simples
   - Pode ser implementado com pg_cron ou scheduler externo

---

## Próximos Passos

1. Implementar cron job para lembretes de prazo
2. Adicionar triggers para competências (se tabela existir)
3. Monitorar performance dos triggers em produção
4. Ajustar intervalos de cleanup conforme necessário
