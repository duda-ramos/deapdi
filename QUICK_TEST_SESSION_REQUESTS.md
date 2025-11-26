# ⚡ TESTE RÁPIDO: RLS para session_requests

## 🎯 OBJETIVO

Testar se a tabela `session_requests` existe e tem RLS configurado adequadamente.

**Tempo estimado:** 2-3 minutos

---

## 🚀 EXECUTAR TESTE

### Opção A: Terminal

```bash
psql "postgresql://..." -f TEST_SESSION_REQUESTS_RLS.sql
```

### Opção B: Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
2. Copie o conteúdo de `TEST_SESSION_REQUESTS_RLS.sql`
3. Cole no SQL Editor
4. Clique em **"Run"**

---

## 📊 CENÁRIOS POSSÍVEIS

### Cenário 1: Tabela NÃO existe

**Resultado esperado:**
```
❌ Tabela session_requests NÃO EXISTE
ℹ️ Status: Tabela não existe no banco
```

**Ação:**
- ✅ Nenhuma ação necessária (sem dados para proteger)
- ℹ️ Verificar se tabela tem outro nome
- ℹ️ Ver lista de tabelas com "session" ou "request" no nome

**Status:** ✅ OK (não há vulnerabilidade)

---

### Cenário 2: Tabela existe SEM RLS

**Resultado esperado:**
```
✅ Tabela session_requests EXISTE
❌ RLS DESABILITADO
❌ NENHUMA política encontrada
🚨 STATUS: VULNERÁVEL
```

**Ação URGENTE:**
```sql
-- 1. Habilitar RLS
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas (exemplo básico)
CREATE POLICY session_requests_own_read
  ON session_requests FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'user_role') IN ('hr', 'admin'));

CREATE POLICY session_requests_own_manage
  ON session_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY session_requests_hr_all
  ON session_requests FOR ALL
  USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));
```

**Status:** 🚨 CRÍTICO - Corrigir imediatamente

---

### Cenário 3: Tabela existe COM RLS e políticas

**Resultado esperado:**
```
✅ Tabela session_requests EXISTE
✅ RLS HABILITADO
✅ 3 política(s) encontrada(s)
✅ STATUS: PROTEGIDA
```

**Ação:**
- ✅ Nenhuma ação urgente
- ✅ Validar políticas estão corretas
- ✅ Testar isolamento na interface

**Status:** ✅ OK

---

## 🧪 TESTES DE VALIDAÇÃO

### Se tabela EXISTIR, verificar:

#### Teste 1: Manager bloqueado?

**Query:**
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'session_requests'
AND qual LIKE '%manager%'
AND cmd IN ('SELECT', 'ALL');
```

**Esperado:** 0 (manager não deve ter acesso a solicitações de outros)

---

#### Teste 2: Isolamento por usuário?

**Query:**
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'session_requests'
AND qual LIKE '%auth.uid()%';
```

**Esperado:** ≥1 (deve ter política de isolamento)

---

#### Teste 3: HR/Admin tem acesso?

**Query:**
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'session_requests'
AND (qual LIKE '%hr%' OR qual LIKE '%admin%');
```

**Esperado:** ≥1 (HR deve poder gerenciar)

---

## 📋 CHECKLIST DE SEGURANÇA

Se tabela existir, deve ter:

- [ ] RLS habilitado
- [ ] Pelo menos 2 políticas
- [ ] Política de isolamento (auth.uid())
- [ ] Política para HR/Admin
- [ ] Manager NÃO deve ter acesso direto
- [ ] Coluna de usuário (user_id, employee_id, etc.)

---

## 🔍 ANALISAR ESTRUTURA

### Verificar colunas importantes:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'session_requests'
ORDER BY ordinal_position;
```

**Procurar por:**
- `user_id` ou `employee_id` → Identificador do solicitante
- `status` → Estado da solicitação
- `created_at` → Data de criação

---

## 📊 INTERPRETAÇÃO DE RESULTADOS

### Se output mostrar:

**"Tabela não existe"**
```
✅ OK - Nenhuma ação necessária
ℹ️ Verificar se nome está correto
```

**"RLS DESABILITADO"**
```
🚨 CRÍTICO - Habilitar RLS urgente
⚠️ Dados podem estar expostos
```

**"RLS sem políticas"**
```
⚠️ Acesso totalmente bloqueado
⚡ Criar políticas de acesso
```

**"RLS + políticas"**
```
✅ Protegida
✅ Validar políticas estão corretas
```

---

## 🎯 PRÓXIMOS PASSOS

### Se tabela NÃO existe:
1. ✅ Confirmar que não há dados para proteger
2. ℹ️ Verificar lista de tabelas similares
3. ✅ Nenhuma vulnerabilidade

### Se tabela existe SEM RLS:
1. 🚨 Habilitar RLS imediatamente
2. 🚨 Criar políticas de acesso
3. 🚨 Revalidar sistema
4. 🚨 Não fazer deploy até corrigir

### Se tabela existe COM RLS:
1. ✅ Validar políticas estão corretas
2. ✅ Testar na interface
3. ✅ Documentar em relatório
4. ✅ Sistema pode prosseguir

---

## 📞 COMANDOS ÚTEIS

### Verificar existência rápida:

```sql
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE tablename = 'session_requests'
);
```

### Ver RLS status:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'session_requests';
```

### Listar políticas:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'session_requests';
```

---

## ⏱️ TEMPO ESTIMADO

| Etapa | Tempo |
|-------|-------|
| Executar script | 30 seg |
| Analisar resultados | 1 min |
| Ação (se necessário) | 1-2 min |
| **TOTAL** | **2-3 min** |

---

**🔍 Execute o teste e reporte os resultados!**

**Arquivo:** `TEST_SESSION_REQUESTS_RLS.sql`
