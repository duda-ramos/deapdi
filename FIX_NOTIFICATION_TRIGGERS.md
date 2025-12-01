# Correção dos Triggers de Notificação

**Data**: 2024-12-01  
**Status**: Correção criada e pronta para aplicação  
**Problema**: 9 de 21 testes falharam (57.1% taxa de sucesso)

---

## 🔍 Diagnóstico do Problema

Após análise detalhada, identificamos os seguintes problemas:

### 1. Conflito de Tipo na Coluna `related_id`
- **Migration 20251127**: Define `related_id` como `uuid`
- **Migration 20251201**: Define `related_id` como `text`
- **Teste espera**: tipo `text` (usa `v_pdi_id::text`)
- **Solução**: Converter para `text` de forma segura

### 2. Conflito de Assinaturas de Funções
A função `create_notification_if_enabled` tinha duas versões incompatíveis:
```sql
-- Versão antiga (uuid):
create_notification_if_enabled(..., p_related_id uuid, ...)

-- Versão correta (text):
create_notification_if_enabled(..., p_related_id text, ...)
```

### 3. Inconsistência de Nomes de Funções
- **Migration 20251127**: `notify_group_leader_promotion()`
- **Migration 20251201**: `notify_group_leader_promoted()`
- **Trigger esperado**: `group_leader_promoted_notification`

### 4. Triggers Duplicados em Tabelas Diferentes
O trigger `mentorship_request_notification` existia em:
- Tabela `mentorships` (versão antiga)
- Tabela `mentorship_requests` (versão correta)

---

## 📁 Arquivos Criados

### 1. Migration de Correção
**Arquivo**: `supabase/migrations/20251201140000_fix_notification_triggers.sql`

Este script:
- ✅ Converte `related_id` de `uuid` para `text` (se necessário)
- ✅ Adiciona colunas faltantes (`category`, `metadata`, `action_url`)
- ✅ Cria tabela `notification_preferences` com RLS
- ✅ Remove todas as funções conflitantes
- ✅ Remove todos os triggers antigos
- ✅ Recria todas as funções com assinaturas corretas
- ✅ Recria todos os triggers nos locais corretos
- ✅ Cria índices de performance
- ✅ Configura permissões

### 2. Script de Diagnóstico
**Arquivo**: `supabase/migrations/tests/diagnose_and_fix_triggers.sql`

Este script verifica:
- Estrutura da tabela `notifications`
- Tabela `notification_preferences`
- Funções PL/pgSQL
- Triggers ativos
- Tabelas relacionadas
- Índices de performance
- Usuários de teste

### 3. Script de Validação (Atualizado)
**Arquivo**: `supabase/migrations/tests/complete_trigger_validation.sql`

Atualizações:
- Verifica se `mentorship_requests` existe antes de testar
- Corrige transições de status de PDI
- Melhor tratamento de erros

---

## 🚀 Instruções de Execução

### Passo 1: Executar Diagnóstico (Opcional)
```sql
-- Cole o conteúdo de diagnose_and_fix_triggers.sql no Supabase SQL Editor
-- Execute e verifique os resultados
```

### Passo 2: Aplicar Correção
```sql
-- Cole o conteúdo de 20251201140000_fix_notification_triggers.sql no Supabase SQL Editor
-- Execute (isso corrigirá todos os problemas)
```

### Passo 3: Validar Correção
```sql
-- Cole o conteúdo de complete_trigger_validation.sql no Supabase SQL Editor
-- Execute e verifique se todos os testes passam (100%)
```

---

## ✅ Resultado Esperado

Após aplicar a correção:
- **Taxa de sucesso**: 100% (21/21 testes)
- **Triggers funcionais**: 7
- **Funções funcionais**: 9
- **Índices criados**: 4

---

## 📋 Checklist de Verificação

### Antes de Aplicar
- [ ] Backup do banco de dados (recomendado)
- [ ] Executar diagnóstico para confirmar problemas

### Após Aplicar
- [ ] Todos os testes de validação passam
- [ ] Coluna `related_id` é tipo `text`
- [ ] Tabela `notification_preferences` existe
- [ ] Todos os 7 triggers estão ativos
- [ ] Todas as 9 funções existem

### Testes Manuais
- [ ] PDI aprovado → notificação criada
- [ ] PDI rejeitado → notificação criada
- [ ] Tarefa atribuída → notificação criada
- [ ] Participante adicionado em grupo → notificação criada
- [ ] Líder promovido → notificação criada
- [ ] Mentoria aceita → notificação criada
- [ ] Sessão agendada → notificação criada (mentor e mentee)

---

## ⚙️ Configuração do Cron Job

Para lembretes automáticos de prazo:

1. Acesse **Dashboard Supabase > Database > Cron Jobs**
2. Crie um novo job:
   - **Nome**: `daily_deadline_reminders`
   - **Schedule**: `0 9 * * *` (todos os dias às 9h)
   - **Statement**: `SELECT send_deadline_reminders();`

---

## 📊 Lista de Triggers por Tabela

| Tabela | Trigger | Evento |
|--------|---------|--------|
| `pdis` | `pdi_status_notification` | UPDATE status |
| `tasks` | `task_assigned_notification` | INSERT |
| `action_group_participants` | `group_participant_added_notification` | INSERT |
| `action_group_participants` | `group_leader_promoted_notification` | UPDATE role |
| `mentorships` | `mentorship_accepted_notification` | UPDATE status |
| `mentorship_sessions` | `mentorship_session_scheduled_notification` | INSERT |
| `mentorship_requests`* | `mentorship_request_notification` | INSERT |

*Se a tabela existir

---

## 🔄 Rollback (Se Necessário)

Se precisar reverter, execute:
```sql
-- Remover triggers
DROP TRIGGER IF EXISTS pdi_status_notification ON pdis;
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
-- ... (continuar para todos os triggers)

-- Remover funções
DROP FUNCTION IF EXISTS create_notification_if_enabled;
DROP FUNCTION IF EXISTS notify_pdi_status_change;
-- ... (continuar para todas as funções)
```

---

## 📧 Suporte

Se encontrar problemas:
1. Execute o script de diagnóstico novamente
2. Verifique os logs do Supabase
3. Confirme que as tabelas relacionadas existem (`pdis`, `tasks`, `mentorships`, etc.)
