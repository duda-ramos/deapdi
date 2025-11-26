# 🚨 AÇÃO URGENTE REQUERIDA

## ⚠️ VULNERABILIDADE CRÍTICA DETECTADA

**Data:** 2025-11-25  
**Severidade:** 🔴 CRÍTICA  
**Status:** ⚠️ CORREÇÃO PRONTA - APLICAR AGORA

---

## 🐛 PROBLEMA

```
| Tabela                   | RLS | Políticas | Status                     |
| ------------------------ | --- | --------- | -------------------------- |
| therapy_session_requests | ❌   | 0         | 🚨 CRÍTICO - Habilitar RLS |
```

**Dados ultra-sensíveis de solicitações de terapia estão EXPOSTOS!**

- ❌ Qualquer colaborador vê solicitações de terapia de todos
- ❌ Manager vê solicitações de subordinados (violação de privacidade)
- ❌ Dados podem ser modificados/deletados por qualquer um
- ❌ Violação LGPD Art. 11 (dados sensíveis de saúde)

---

## ⚡ AÇÃO IMEDIATA (5 minutos)

### PASSO 1: Aplicar Correção (2 min)

**Opção A: Supabase Dashboard** ⭐ RECOMENDADO

1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
2. Abra o arquivo: `supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"**

**Opção B: Terminal**

```bash
psql "postgresql://..." -f supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql
```

**Resultado esperado:**
```
✅ RLS habilitado com sucesso em therapy_session_requests
✅ 3 políticas criadas com sucesso
✅ CORREÇÃO APLICADA COM SUCESSO!
```

---

### PASSO 2: Validar Correção (2 min)

```bash
psql "postgresql://..." -f FINAL_SENSITIVE_DATA_VALIDATION.sql
```

**OU no Supabase SQL Editor:**

```sql
-- Verificar RLS
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESABILITADO' END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'therapy_session_requests';

-- Contar políticas
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'therapy_session_requests';
-- ESPERADO: 3
```

**Resultado esperado:**
```
therapy_session_requests | ✅ HABILITADO
total_policies: 3
```

---

### PASSO 3: Confirmar Proteção (1 min)

```sql
-- Score final de proteção
SELECT 
  COUNT(*) as total_tables,
  SUM(CASE WHEN c.relrowsecurity THEN 1 ELSE 0 END) as protected,
  ROUND(SUM(CASE WHEN c.relrowsecurity THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as score
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename IN (
  'psychological_records',
  'psychology_sessions',
  'emotional_checkins',
  'salary_history',
  'therapeutic_tasks',
  'checkin_settings',
  'therapy_session_requests'
);
```

**Resultado esperado:**
```
total_tables: 7
protected: 7
score: 100%
```

---

## ✅ CHECKLIST RÁPIDO

- [ ] Correção aplicada: `20251125000001_fix_therapy_session_requests_rls.sql`
- [ ] RLS habilitado: ✅
- [ ] Políticas criadas: 3
- [ ] Score de proteção: 100% (7/7 tabelas)
- [ ] Sistema aprovado para produção

---

## 📋 ARQUIVOS CRIADOS

### 1. **Migration de Correção** ⭐ APLICAR PRIMEIRO
`supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql`

**O que faz:**
- ✅ Habilita RLS em `therapy_session_requests`
- ✅ Cria 3 políticas de proteção
- ✅ Cria índices de performance
- ✅ Valida que correção foi aplicada

---

### 2. **Documentação da Vulnerabilidade**
`CRITICAL_FIX_THERAPY_SESSION_REQUESTS.md`

**Conteúdo:**
- 🐛 Descrição do problema
- 🛠️ Solução implementada
- ✅ Como aplicar
- ✅ Como validar
- 📊 Antes vs Depois

---

### 3. **Este Guia de Ação**
`URGENT_ACTION_REQUIRED.md`

**Uso:** Guia rápido de 5 minutos para aplicar correção.

---

## 🎯 POLÍTICAS CRIADAS

### Política 1: Ver próprias solicitações

```sql
CREATE POLICY therapy_session_requests_own_read
  ON therapy_session_requests FOR SELECT
  USING (
    auth.uid() = employee_id OR
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );
```

**Regras:**
- ✅ Colaborador vê apenas próprias solicitações
- ✅ HR/Admin vê todas (para aprovação)
- ❌ Manager NÃO vê subordinados
- ❌ Outros colaboradores NÃO veem entre si

---

### Política 2: Gerenciar próprias solicitações

```sql
CREATE POLICY therapy_session_requests_own_manage
  ON therapy_session_requests FOR ALL
  USING (auth.uid() = employee_id)
  WITH CHECK (
    auth.uid() = employee_id AND
    status IN ('pending', 'cancelled')
  );
```

**Regras:**
- ✅ Colaborador cria solicitações
- ✅ Colaborador cancela próprias solicitações
- ❌ Colaborador NÃO modifica de outros

---

### Política 3: HR gestão completa

```sql
CREATE POLICY therapy_session_requests_hr_all
  ON therapy_session_requests FOR ALL
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));
```

**Regras:**
- ✅ HR aprova solicitações
- ✅ HR agenda sessões
- ✅ HR gerencia status

---

## 📊 IMPACTO DA CORREÇÃO

### Antes ❌

- ❌ Dados expostos para todos
- ❌ Violação de privacidade
- ❌ Não conforme LGPD
- ❌ Risco legal ALTO

### Depois ✅

- ✅ Dados protegidos por RLS
- ✅ Isolamento total entre colaboradores
- ✅ Manager bloqueado (privacidade)
- ✅ HR controla aprovações
- ✅ Conforme LGPD
- ✅ Risco legal mitigado

---

## 🚫 NÃO FAZER DEPLOY ATÉ

- [ ] ✅ Correção aplicada
- [ ] ✅ RLS habilitado confirmado
- [ ] ✅ 3 políticas criadas
- [ ] ✅ Score 100% (7/7 tabelas)
- [ ] ✅ Testes manuais OK
- [ ] ✅ Documentação atualizada

---

## 📞 SUPORTE

**Migration:** `/workspace/supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql`

**Documentação completa:** `CRITICAL_FIX_THERAPY_SESSION_REQUESTS.md`

**Validação:** `FINAL_SENSITIVE_DATA_VALIDATION.sql`

**Relatório:** `SENSITIVE_DATA_PROTECTION_REPORT.md`

---

## ⏱️ TEMPO TOTAL: 5 MINUTOS

| Passo | Tempo |
|-------|-------|
| Aplicar correção | 2 min |
| Validar | 2 min |
| Confirmar | 1 min |
| **TOTAL** | **5 min** |

---

## ✅ CONCLUSÃO

**Esta correção é OBRIGATÓRIA antes de qualquer deploy.**

```bash
# EXECUTAR AGORA:
psql "..." -f supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql

# VALIDAR:
psql "..." -f FINAL_SENSITIVE_DATA_VALIDATION.sql

# CONFIRMAR:
# Score deve ser 100% (7/7 tabelas)
```

---

**🚨 AÇÃO URGENTE - NÃO IGNORE!**

**🔒 Dados de saúde mental são sagrados!**

---

_Criado em: 2025-11-25_  
_Prioridade: 🔴 CRÍTICA_
