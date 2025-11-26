# 🚨 CORREÇÃO CRÍTICA: RLS para therapy_session_requests

## ⚠️ VULNERABILIDADE CRÍTICA DETECTADA

**Data de Detecção:** 2025-11-25  
**Severidade:** 🔴 CRÍTICA  
**Status:** ⚠️ CORREÇÃO CRIADA - AGUARDANDO APLICAÇÃO

---

## 🐛 PROBLEMA

### Vulnerabilidade Identificada

**Tabela:** `therapy_session_requests`

| Item | Status ANTES |
|------|--------------|
| RLS Habilitado | ❌ DESABILITADO |
| Políticas | ❌ 0 políticas |
| Ação Requerida | 🚨 CRÍTICO - Habilitar RLS |

### Impacto da Vulnerabilidade

**Sem RLS, a tabela `therapy_session_requests` está COMPLETAMENTE EXPOSTA:**

1. ❌ **Qualquer colaborador vê solicitações de terapia de todos os outros**
   - Exemplo: João pode ver que Maria solicitou terapia para ansiedade
   - Dados: Motivo, urgência, sintomas descritos

2. ❌ **Manager vê solicitações de terapia de subordinados**
   - Violação de privacidade psicológica
   - Possível discriminação no ambiente de trabalho
   - Quebra de sigilo terapêutico

3. ❌ **Dados podem ser modificados/deletados por qualquer um**
   - Solicitações podem ser canceladas por terceiros
   - Dados sensíveis podem ser alterados
   - Sem rastreabilidade de quem fez o quê

### Classificação de Dados

**Tipo de Dados Expostos:**
- 🔴 Dados de saúde mental (categoria especial LGPD)
- 🔴 Motivo da solicitação de terapia
- 🔴 Nível de urgência (inferência de gravidade)
- 🔴 Sintomas descritos pelo colaborador
- 🔴 Histórico de solicitações de cada pessoa

**Impacto Legal:**
- ❌ Violação LGPD Art. 7º, VII (tutela da saúde)
- ❌ Violação LGPD Art. 11 (dados sensíveis de saúde)
- ❌ Violação LGPD Art. 46 (medidas de segurança inadequadas)
- ❌ Quebra de sigilo médico/terapêutico
- ❌ Possível ação legal por danos morais

---

## 🛠️ SOLUÇÃO IMPLEMENTADA

### Migration Corretiva

**Arquivo:** `20251125000001_fix_therapy_session_requests_rls.sql`

**Localização:** `/workspace/supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql`

---

### PARTE 1: Habilitar RLS

```sql
ALTER TABLE therapy_session_requests ENABLE ROW LEVEL SECURITY;
```

**Resultado:** Tabela agora requer políticas explícitas para acesso.

---

### PARTE 2: Políticas de Acesso

#### Política 1: SELECT - Ver próprias solicitações

```sql
CREATE POLICY therapy_session_requests_own_read
  ON therapy_session_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Colaborador vê apenas próprias solicitações OU
    auth.uid() = employee_id OR
    -- HR/Admin vê todas (para gerenciamento e aprovação)
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );
```

**Regras:**
- ✅ Colaborador vê APENAS solicitações próprias
- ✅ HR vê todas (para aprovar/agendar)
- ✅ Admin vê todas (gestão)
- ❌ Manager NÃO vê solicitações de subordinados
- ❌ Outros colaboradores NÃO veem entre si

---

#### Política 2: INSERT/UPDATE - Gerenciar próprias solicitações

```sql
CREATE POLICY therapy_session_requests_own_manage
  ON therapy_session_requests
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = employee_id
  )
  WITH CHECK (
    auth.uid() = employee_id AND
    status IN ('pending', 'cancelled')
  );
```

**Regras:**
- ✅ Colaborador cria solicitações para si mesmo
- ✅ Colaborador pode cancelar próprias solicitações
- ✅ Status permitidos: `pending`, `cancelled`
- ❌ Colaborador NÃO pode modificar solicitações de outros
- ❌ Colaborador NÃO pode marcar como `approved`, `scheduled` (só HR)

---

#### Política 3: HR - Gestão completa

```sql
CREATE POLICY therapy_session_requests_hr_all
  ON therapy_session_requests
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );
```

**Regras:**
- ✅ HR/Admin veem todas as solicitações
- ✅ HR pode aprovar solicitações (`status = 'approved'`)
- ✅ HR pode agendar sessões (`status = 'scheduled'`)
- ✅ HR pode rejeitar solicitações (`status = 'rejected'`)
- ✅ HR tem controle total para gestão de terapia

---

### PARTE 3: Índices de Performance

```sql
-- Índice em employee_id (queries frequentes)
CREATE INDEX idx_therapy_session_requests_employee_id 
  ON therapy_session_requests (employee_id);

-- Índice em status (filtragem comum)
CREATE INDEX idx_therapy_session_requests_status 
  ON therapy_session_requests (status);

-- Índice composto para queries HR
CREATE INDEX idx_therapy_session_requests_status_date 
  ON therapy_session_requests (status, created_at DESC);
```

**Benefícios:**
- ⚡ Queries rápidas por colaborador
- ⚡ Filtragem eficiente por status
- ⚡ HR pode listar solicitações pendentes rapidamente

---

## ✅ COMO APLICAR A CORREÇÃO

### Opção A: Via Supabase Dashboard (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
2. Copie todo o conteúdo de `20251125000001_fix_therapy_session_requests_rls.sql`
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Verifique mensagens de sucesso no output

**Mensagem esperada:**
```
✅ RLS habilitado com sucesso em therapy_session_requests
✅ 3 políticas criadas com sucesso
✅ Teste de segurança concluído

═══════════════════════════════════════════════════════
✅ CORREÇÃO APLICADA COM SUCESSO!
═══════════════════════════════════════════════════════
```

---

### Opção B: Via Terminal

```bash
psql "postgresql://..." -f supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql
```

---

### Opção C: Via Supabase CLI

```bash
supabase db push
```

---

## ✅ VALIDAÇÃO DA CORREÇÃO

### Validação SQL (Executar após aplicar)

```sql
-- 1. Verificar RLS habilitado
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'therapy_session_requests';

-- ESPERADO: ✅ HABILITADO

-- 2. Contar políticas
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'therapy_session_requests';

-- ESPERADO: 3 políticas

-- 3. Listar políticas criadas
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'therapy_session_requests'
ORDER BY cmd, policyname;

-- ESPERADO:
-- therapy_session_requests_own_read     | SELECT
-- therapy_session_requests_own_manage   | ALL
-- therapy_session_requests_hr_all       | ALL
```

---

### Validação Manual (Interface)

#### Teste 1: Employee vê apenas próprias solicitações

1. Login como `colab1.teste@deapdi-test.local`
2. Navegar para área de solicitações de terapia
3. **ESPERADO:** Ver apenas solicitações próprias
4. Tentar acessar URL direta de solicitação de outro
5. **ESPERADO:** Erro 403 ou redirecionamento

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

#### Teste 2: Manager NÃO vê solicitações de subordinados

1. Login como `gestor1.teste@deapdi-test.local`
2. Tentar acessar solicitações de subordinados
3. **ESPERADO:** NÃO conseguir ver (dados são confidenciais)

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

#### Teste 3: HR vê e gerencia todas as solicitações

1. Login como `rh.teste@deapdi-test.local`
2. Acessar área de gestão de solicitações de terapia
3. **ESPERADO:** Ver todas as solicitações
4. Testar aprovação de uma solicitação
5. **ESPERADO:** Conseguir aprovar/agendar

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

## 🔄 REVALIDAÇÃO COMPLETA DO SISTEMA

Após aplicar esta correção, **EXECUTAR NOVAMENTE:**

```bash
psql "..." -f FINAL_SENSITIVE_DATA_VALIDATION.sql
```

**Resultado esperado (APÓS correção):**

| Tabela | RLS | Políticas | Status |
|--------|-----|-----------|--------|
| therapy_session_requests | ✅ | 3 | ✅ OK |

**Score esperado:** 100% (7/7 tabelas protegidas)

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ANTES da Correção ❌

| Aspecto | Status |
|---------|--------|
| RLS Habilitado | ❌ NÃO |
| Políticas | ❌ 0 |
| Colaborador vê solicitações de outros | ❌ SIM (BUG) |
| Manager vê subordinados | ❌ SIM (BUG) |
| HR gerencia todas | ⚠️ SIM (mas sem controle) |
| Dados protegidos | ❌ NÃO |
| Compliance LGPD | ❌ VIOLAÇÃO |
| Risco legal | 🔴 ALTO |

---

### DEPOIS da Correção ✅

| Aspecto | Status |
|---------|--------|
| RLS Habilitado | ✅ SIM |
| Políticas | ✅ 3 |
| Colaborador vê solicitações de outros | ✅ NÃO |
| Manager vê subordinados | ✅ NÃO |
| HR gerencia todas | ✅ SIM (com política explícita) |
| Dados protegidos | ✅ SIM |
| Compliance LGPD | ✅ CONFORME |
| Risco legal | ✅ MITIGADO |

---

## 📋 CHECKLIST DE APLICAÇÃO

Antes de marcar como concluído:

- [ ] Migration criada: `20251125000001_fix_therapy_session_requests_rls.sql`
- [ ] Migration aplicada no banco
- [ ] RLS habilitado confirmado
- [ ] 3 políticas criadas confirmadas
- [ ] 3 índices criados confirmados
- [ ] Teste SQL: Employee vê apenas próprios (PASS)
- [ ] Teste SQL: Manager NÃO vê subordinados (PASS)
- [ ] Teste SQL: HR vê todas (PASS)
- [ ] Teste manual: Employee isolado (PASS)
- [ ] Teste manual: Manager bloqueado (PASS)
- [ ] Teste manual: HR gerencia todas (PASS)
- [ ] Revalidação completa: `FINAL_SENSITIVE_DATA_VALIDATION.sql` executado
- [ ] Score de proteção: 100% (7/7 tabelas)
- [ ] `SENSITIVE_DATA_PROTECTION_REPORT.md` atualizado
- [ ] Decisão final: ✅ APROVADO

---

## 🚨 AÇÃO URGENTE REQUERIDA

### Status Atual

⚠️ **VULNERABILIDADE ATIVA** - Dados de saúde mental expostos

### Ação Imediata

```bash
# 1. APLICAR CORREÇÃO AGORA
psql "sua_connection_string" -f supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql

# 2. VALIDAR
psql "sua_connection_string" -f FINAL_SENSITIVE_DATA_VALIDATION.sql

# 3. CONFIRMAR
# Score deve ser 100% (7/7 tabelas protegidas)
```

### Prioridade

🔴 **CRÍTICA - APLICAR IMEDIATAMENTE**

**Não fazer deploy para produção até que:**
1. ✅ Esta correção seja aplicada
2. ✅ Validação SQL confirme 100%
3. ✅ Testes manuais confirmem proteção
4. ✅ Relatório seja atualizado e aprovado

---

## 🎯 PRÓXIMOS PASSOS

### Passo 1: Aplicar Correção (AGORA)

```bash
psql "..." -f supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql
```

### Passo 2: Revalidar Sistema

```bash
psql "..." -f FINAL_SENSITIVE_DATA_VALIDATION.sql
```

### Passo 3: Atualizar Documentação

1. Abrir: `SENSITIVE_DATA_PROTECTION_REPORT.md`
2. Atualizar tabela de status:
   - `therapy_session_requests`: ✅ RLS = HABILITADO
   - `therapy_session_requests`: ✅ Políticas = 3
3. Atualizar score: 100% (7/7)
4. Marcar decisão: ✅ APROVADO

### Passo 4: Aprovar para Produção

- ✅ Todas as 7 tabelas protegidas
- ✅ Score: 100%
- ✅ Compliance LGPD: OK
- ✅ Sistema aprovado para produção

---

## 📞 SUPORTE

**Migration:** `/workspace/supabase/migrations/20251125000001_fix_therapy_session_requests_rls.sql`

**Documentação:**
- Este arquivo: `CRITICAL_FIX_THERAPY_SESSION_REQUESTS.md`
- Validação: `FINAL_SENSITIVE_DATA_VALIDATION.sql`
- Relatório: `SENSITIVE_DATA_PROTECTION_REPORT.md`

**Comandos úteis:**
```sql
-- Ver status RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'therapy_session_requests';

-- Ver políticas
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'therapy_session_requests';

-- Contar políticas
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'therapy_session_requests';
```

---

## ✅ CONCLUSÃO

Esta correção é **OBRIGATÓRIA** e **URGENTE** para:
- ✅ Proteger dados de saúde mental dos colaboradores
- ✅ Cumprir LGPD
- ✅ Eliminar risco legal
- ✅ Aprovar sistema para produção

**Status:** ⚠️ CORREÇÃO CRIADA - **APLICAR IMEDIATAMENTE**

---

**🔒 Dados de saúde mental são sagrados. Proteja-os!**

---

_Documento criado em: 2025-11-25_  
_Última atualização: 2025-11-25_  
_Versão: 1.0_  
_Classificação: CONFIDENCIAL_
