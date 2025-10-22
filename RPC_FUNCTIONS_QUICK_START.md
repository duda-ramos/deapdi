# 🚀 QUICK START - Implementar RPC Functions Críticas

> **Tempo total:** 14 horas  
> **Impacto:** Desbloqueia produção + corrige código quebrado

---

## ⚡ AÇÃO IMEDIATA

### 🔥 PROBLEMA CRÍTICO DETECTADO

O código TypeScript **chama 2 funções que NÃO EXISTEM no banco:**

```typescript
// src/services/mentorship.ts:140
await supabase.rpc('schedule_mentorship_session', { ... }) // ❌ NÃO EXISTE

// src/services/mentorship.ts:164  
await supabase.rpc('complete_mentorship_session', { ... }) // ❌ NÃO EXISTE
```

**Sistema de mentoria está COMPLETAMENTE QUEBRADO em produção!**

---

## 📝 PASSO A PASSO

### Passo 1: Aplicar Funções Críticas (2 min)

```bash
# No Supabase Dashboard > SQL Editor

# Copie e cole TODO o conteúdo de:
CRITICAL_RPC_FUNCTIONS.sql

# Clique em RUN
# Aguarde confirmação: "✅ Todas as 5 funções críticas foram criadas"
```

### Passo 2: Executar Testes (1 min)

```bash
# No Supabase Dashboard > SQL Editor

# Copie e cole TODO o conteúdo de:
CRITICAL_RPC_FUNCTIONS_TESTS.sql

# Clique em RUN
# Verifique que todos os testes passaram (✅ PASSOU)
```

### Passo 3: Testar no Aplicativo (5 min)

```bash
# 1. Testar Mentoria
- Criar nova mentoria
- Agendar sessão
- Completar sessão
- ✅ Verificar que não há erros

# 2. Testar Dashboard
- Abrir página principal
- ✅ Verificar carregamento rápido (< 2s)

# 3. Testar PDI
- Completar um PDI
- ✅ Verificar pontos atribuídos
- ✅ Verificar notificação ao gestor

# 4. Testar Visão de Gestor
- Login como gestor
- Abrir dashboard de equipe
- ✅ Verificar métricas exibidas
```

---

## 📊 O QUE FOI IMPLEMENTADO

### ✅ 5 Funções Críticas

| # | Função | Tempo | Status |
|---|--------|-------|--------|
| 1 | `schedule_mentorship_session` | 2h | 🆕 NOVA |
| 2 | `complete_mentorship_session` | 1.5h | 🆕 NOVA |
| 3 | `get_user_dashboard_data` | 4h | 🆕 NOVA |
| 4 | `get_team_performance` | 3h | 🆕 NOVA |
| 5 | `complete_pdi_objetivo` | 3.5h | 🆕 NOVA |

### 🎯 Benefícios Imediatos

**Antes:**
- ❌ Sistema de mentoria quebrado
- ❌ Dashboard lento (5-10s)
- ❌ Gestores sem visão de equipe
- ❌ Pontos de gamificação não atribuídos

**Depois:**
- ✅ Sistema de mentoria funcional
- ✅ Dashboard rápido (< 2s)
- ✅ Gestores com métricas completas
- ✅ Gamificação completa

---

## 📈 PRÓXIMAS IMPLEMENTAÇÕES (Sprint 2)

### 🟡 8 Funções Importantes (14h)

Melhoram UX mas não bloqueiam produção:

1. `create_action_group` (2h) - Transações atômicas
2. `get_department_analytics` (3h) - Métricas RH
3. `validate_pdi_objetivo` (2h) - Workflow completo
4. `get_user_pdis` (2h) - Query otimizada
5. `accept_mentorship` (2h) - Automação
6. `complete_group_task` (1.5h) - Notificações
7. `create_pdi_objetivo` (1h) - Status inteligente
8. `mark_notification_read` (30min) - Auditoria

---

## 🔍 COMO VERIFICAR SE FUNÇÕES EXISTEM

```sql
-- Executar no SQL Editor
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE p.prosecdef
    WHEN true THEN '🔒 SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_mode
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'schedule_mentorship_session',
    'complete_mentorship_session',
    'get_user_dashboard_data',
    'get_team_performance',
    'complete_pdi_objetivo'
  )
ORDER BY p.proname;

-- Deve retornar 5 linhas
-- Se retornar menos, alguma função não foi criada
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "function does not exist"

**Problema:** Função não foi criada  
**Solução:** Re-executar `CRITICAL_RPC_FUNCTIONS.sql`

### Erro: "permission denied"

**Problema:** Falta permissão GRANT  
**Solução:** Verificar se as linhas `GRANT EXECUTE` foram executadas

### Erro: "column does not exist"

**Problema:** Tabela falta coluna esperada  
**Solução:** 
1. Ver `DATABASE_AUDIT_REPORT.md`
2. Aplicar migrations faltantes

### Dashboard ainda lento

**Problema:** Cache do navegador  
**Solução:**
1. Ctrl+Shift+R (hard refresh)
2. Limpar cache do navegador

---

## 📞 SUPORTE

- **Relatório Completo:** `RPC_FUNCTIONS_AUDIT_REPORT.md`
- **Código SQL:** `CRITICAL_RPC_FUNCTIONS.sql`
- **Testes:** `CRITICAL_RPC_FUNCTIONS_TESTS.sql`
- **Auditoria DB:** `DATABASE_AUDIT_REPORT.md`

---

## ✅ CHECKLIST DE PRODUÇÃO

Antes de deploy para produção, confirmar:

- [ ] 5 funções críticas criadas e testadas
- [ ] Testes SQL passaram (todos ✅)
- [ ] Mentoria funcional no app
- [ ] Dashboard carrega em < 2s
- [ ] Gestor vê métricas de equipe
- [ ] Completar PDI atribui pontos
- [ ] Notificações sendo criadas

**Se todos os itens estiverem ✅ → PRONTO PARA PRODUÇÃO**

---

**Criado em:** 2025-10-22  
**Por:** Agent - Cursor Background Agent
