# Checklist de Validação - Triggers de Notificação

**Data da Validação**: ____/____/________  
**Validador**: _________________________  
**Ambiente**: [ ] Dev  [ ] Staging  [ ] Produção

---

## 📋 Resumo Rápido

| Categoria | Total | ✅ | ❌ | Status |
|-----------|-------|----|----|--------|
| PDI | 4 | __ | __ | [ ] OK |
| Grupos | 4 | __ | __ | [ ] OK |
| Tarefas | 3 | __ | __ | [ ] OK |
| Mentoria | 6 | __ | __ | [ ] OK |
| Lembretes | 4 | __ | __ | [ ] OK |
| Preferências | 2 | __ | __ | [ ] OK |
| Estrutura | 4 | __ | __ | [ ] OK |
| **TOTAL** | **27** | __ | __ | [ ] **APROVADO** |

---

## 1️⃣ PRÉ-REQUISITOS

### Migration Executada
- [ ] Migration `20251201125732_notification_triggers.sql` executada
- [ ] Nenhum erro durante execução
- [ ] Validação pós-instalação executada

### Script de Validação
```sql
-- Execute no SQL Editor:
SELECT proname FROM pg_proc 
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
-- Esperado: 9 funções
```

Resultado: [ ] 9 funções encontradas  [ ] Faltando funções

---

## 2️⃣ TESTES DE PDI

### 2.1 PDI Aprovado ✅
- [ ] PDI com status `completed` → `validated`
- [ ] Notificação criada para profile_id do PDI
- [ ] Título: "✅ PDI Aprovado!"
- [ ] Tipo: `success`
- [ ] Categoria: `pdi_approved`
- [ ] related_id: ID do PDI
- [ ] action_url: `/pdi`
- [ ] Mensagem contém nome do PDI
- [ ] Aparece no NotificationCenter

### 2.2 PDI Rejeitado ⚠️
- [ ] PDI com status `completed` → `in-progress`
- [ ] Notificação criada
- [ ] Título: "⚠️ PDI Precisa de Ajustes"
- [ ] Tipo: `warning`
- [ ] Categoria: `pdi_rejected`
- [ ] related_id preenchido
- [ ] action_url: `/pdi`

---

## 3️⃣ TESTES DE TAREFAS

### 3.1 Tarefa Atribuída 📋
- [ ] Nova tarefa criada com `assignee_id`
- [ ] Notificação criada para assignee
- [ ] Título: "📋 Nova Tarefa Atribuída"
- [ ] Tipo: `info`
- [ ] Categoria: `task_assigned`
- [ ] Mensagem contém nome da tarefa
- [ ] Mensagem contém prazo (DD/MM/YYYY)
- [ ] action_url: `/groups` (se group_id) ou `/pdi`

### 3.2 Tarefa com Grupo
- [ ] Mensagem contém nome do grupo
- [ ] action_url: `/groups`

### 3.3 Tarefa sem Grupo (PDI)
- [ ] action_url: `/pdi`

---

## 4️⃣ TESTES DE GRUPOS

### 4.1 Participante Adicionado 👥
- [ ] INSERT em `action_group_participants`
- [ ] Notificação criada para novo participante
- [ ] Título: "👥 Você foi adicionado a um Grupo"
- [ ] Tipo: `info`
- [ ] Categoria: `group_invitation`
- [ ] related_id: ID do grupo
- [ ] Mensagem contém nome do grupo
- [ ] action_url: `/groups`

### 4.2 Promovido a Líder ⭐
- [ ] UPDATE role para `leader`
- [ ] Notificação criada
- [ ] Título: "⭐ Você é agora Líder do Grupo"
- [ ] Tipo: `success`
- [ ] Categoria: `group_leader`
- [ ] Mensagem contém nome do grupo

---

## 5️⃣ TESTES DE MENTORIA

### 5.1 Solicitação de Mentoria 🎓
- [ ] INSERT em `mentorships`
- [ ] Notificação criada para **mentor**
- [ ] Título: "🎓 Nova Solicitação de Mentoria"
- [ ] Tipo: `info`
- [ ] Categoria: `mentorship_request`
- [ ] Mensagem contém nome do mentee
- [ ] action_url: `/mentorship`

### 5.2 Mentoria Aceita ✅
- [ ] UPDATE status para `active`
- [ ] Notificação criada para **mentee**
- [ ] Título: "✅ Mentoria Aceita!"
- [ ] Tipo: `success`
- [ ] Categoria: `mentorship_accepted`
- [ ] Mensagem contém nome do mentor

### 5.3 Sessão Agendada - Mentor 📅
- [ ] INSERT em `mentorship_sessions`
- [ ] Notificação criada para mentor
- [ ] Título: "📅 Sessão de Mentoria Agendada"
- [ ] Tipo: `info`
- [ ] Categoria: `mentorship_scheduled`
- [ ] Mensagem contém data/hora (DD/MM/YYYY HH:MI)

### 5.4 Sessão Agendada - Mentee 📅
- [ ] Notificação criada para mentee
- [ ] Título: "📅 Sessão de Mentoria Confirmada"
- [ ] Tipo: `success`
- [ ] Categoria: `mentorship_scheduled`
- [ ] Mensagem contém data/hora

---

## 6️⃣ TESTES DE LEMBRETES

### 6.1 Função send_deadline_reminders()
- [ ] Função executou sem erro
- [ ] Retornou número de lembretes

### 6.2 Lembrete de PDI ⏰
- [ ] PDI com prazo em 7, 3 ou 1 dia
- [ ] Lembrete criado
- [ ] Título: "⏰ Lembrete de Prazo - PDI"
- [ ] Tipo: `warning` (1 dia) ou `info` (3+ dias)
- [ ] Categoria: `deadline_reminder`
- [ ] action_url: `/pdi`

### 6.3 Lembrete de Tarefa ⏰
- [ ] Tarefa com prazo em 3 ou 1 dia
- [ ] Lembrete criado
- [ ] Título: "⏰ Lembrete de Prazo - Tarefa"
- [ ] action_url: `/groups` ou `/pdi`

### 6.4 Sem Duplicação
- [ ] Segunda execução no mesmo dia
- [ ] Retornou 0 lembretes adicionais

---

## 7️⃣ TESTES DE PREFERÊNCIAS

### 7.1 Categoria Desabilitada 🚫
- [ ] Preferência task_assigned = false
- [ ] Criar tarefa
- [ ] Notificação **NÃO** foi criada

### 7.2 Categoria Reabilitada
- [ ] Preferência task_assigned = true
- [ ] Criar tarefa
- [ ] Notificação **FOI** criada

---

## 8️⃣ VALIDAÇÃO DE ESTRUTURA

### 8.1 Colunas da Tabela notifications
- [ ] `category` existe (text)
- [ ] `related_id` existe (text)
- [ ] `action_url` existe (text)
- [ ] `metadata` existe (jsonb)

### 8.2 Índices
- [ ] `idx_notifications_profile_category`
- [ ] `idx_notifications_related_id`
- [ ] `idx_notifications_profile_unread`
- [ ] `idx_notifications_created_at_read`

---

## 9️⃣ VALIDAÇÃO DE UI

### 9.1 NotificationCenter
- [ ] Badge contador atualiza
- [ ] Indicador de conexão funciona
- [ ] Lista notificações corretamente
- [ ] Emojis renderizam (✅, ⚠️, 📋, etc.)
- [ ] Ícones por categoria funcionam
- [ ] Timestamp formatado (pt-BR)

### 9.2 Interações
- [ ] Marcar como lida funciona
- [ ] Marcar todas como lidas funciona
- [ ] Excluir notificação funciona
- [ ] "Ver detalhes" navega para action_url

### 9.3 Preferências (Modal)
- [ ] Abre corretamente
- [ ] Toggle switches funcionam
- [ ] Preferências são salvas
- [ ] Afeta criação de notificações

---

## 🔟 PERFORMANCE

### 10.1 Tempo de Execução
- [ ] Trigger < 100ms
- [ ] send_deadline_reminders() < 5s (para 100+ itens)

### 10.2 Query Plan
```sql
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE profile_id = 'user-id'
AND read = false
ORDER BY created_at DESC
LIMIT 10;
```
- [ ] Usa índice `idx_notifications_profile_unread`

---

## 1️⃣1️⃣ CRON JOB

### Configuração
- [ ] Cron job criado no Supabase
- [ ] Nome: `daily_deadline_reminders`
- [ ] Schedule: `0 9 * * *`
- [ ] Comando: `SELECT send_deadline_reminders();`
- [ ] Status: Ativo

### Teste Manual
```sql
SELECT send_deadline_reminders();
```
- [ ] Executou com sucesso
- [ ] Retornou número de lembretes

---

## 📝 NOTAS E OBSERVAÇÕES

### Issues Encontrados
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Melhorias Sugeridas
1. _________________________________________________
2. _________________________________________________

### Próximos Passos
1. _________________________________________________
2. _________________________________________________

---

## ✅ APROVAÇÃO FINAL

| Critério | Status |
|----------|--------|
| Todos os 12 tipos de notificação funcionam | [ ] |
| Preferências do usuário respeitadas | [ ] |
| Sem notificações duplicadas | [ ] |
| Mensagens em português correto | [ ] |
| Emojis renderizam na UI | [ ] |
| Action URLs navegam corretamente | [ ] |
| Tipos (success/warning/info) corretos | [ ] |
| NotificationCenter funciona | [ ] |
| Performance adequada | [ ] |
| Cron job configurado | [ ] |

### Resultado Final

- [ ] **APROVADO** - Todos os critérios atendidos
- [ ] **APROVADO COM RESSALVAS** - Funciona com issues menores
- [ ] **REPROVADO** - Issues críticos encontrados

---

**Assinatura**: _________________________  
**Data**: ____/____/________
