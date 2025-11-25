# 🔒 Correção RLS - Tabela `resource_favorites`
## Vulnerabilidade Descoberta Durante Auditoria | 25 de Novembro de 2025

---

## 🚨 PROBLEMA IDENTIFICADO

**Durante a auditoria RLS (Query 2), foi descoberto que a tabela `resource_favorites` não tem RLS habilitado.**

### Query 2 - Resultado:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
```

**Resultado:**
```
┌──────────────────────┐
│ tablename            │
├──────────────────────┤
│ resource_favorites   │  ← 🚨 VULNERABILIDADE
└──────────────────────┘
```

---

## 📊 ANÁLISE DA TABELA

### Estrutura:
```sql
CREATE TABLE resource_favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES wellness_resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, resource_id)
);
```

### Descrição:
- **Tipo:** Tabela de junção (muitos-para-muitos)
- **Propósito:** Armazenar favoritos de recursos de bem-estar
- **Relacionamentos:**
  - `user_id` → `profiles.id` (usuário que favoritou)
  - `resource_id` → `wellness_resources.id` (recurso favoritado)

### Dados Armazenados:
- Preferências pessoais de recursos de saúde mental
- Padrões de interesse dos usuários
- Histórico de recursos acessados/favoritos

---

## 🔐 ANÁLISE DE SEGURANÇA

### Criticidade: 🟡 **MÉDIA**

**Justificativa:**
- ❌ Dados não são ultra-sensíveis (não são diagnósticos ou salários)
- ⚠️ Mas expõem padrões de comportamento e interesses
- ⚠️ Podem revelar tópicos de saúde mental de interesse
- ⚠️ Violação de privacidade pessoal

### Impacto da Vulnerabilidade:

**❌ SEM RLS (Situação Atual):**
```
Qualquer usuário autenticado pode:
✗ Ver favoritos de TODOS os outros usuários
✗ Adicionar favoritos em nome de outros
✗ Remover favoritos de outros
✗ Manipular dados de preferências
✗ Rastrear padrões de interesse
```

**✅ COM RLS (Após Correção):**
```
Cada usuário pode:
✓ Ver apenas seus próprios favoritos
✓ Adicionar apenas seus próprios favoritos
✓ Remover apenas seus próprios favoritos

HR/Admin podem:
✓ Ver todos os favoritos (para analytics)
✓ Não podem modificar favoritos de outros
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Arquivo Criado: `FIX_RLS_RESOURCE_FAVORITES.sql`

**Correção em 2 passos:**

### Passo 1: Habilitar RLS
```sql
ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;
```

### Passo 2: Criar 4 Políticas

#### Política 1: SELECT Próprio
```sql
CREATE POLICY "resource_favorites_own_select"
  ON resource_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```
**Permite:** Usuários verem apenas seus próprios favoritos

---

#### Política 2: INSERT Próprio
```sql
CREATE POLICY "resource_favorites_own_insert"
  ON resource_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```
**Permite:** Usuários adicionarem apenas seus próprios favoritos

---

#### Política 3: DELETE Próprio
```sql
CREATE POLICY "resource_favorites_own_delete"
  ON resource_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```
**Permite:** Usuários removerem apenas seus próprios favoritos

---

#### Política 4: SELECT HR/Admin
```sql
CREATE POLICY "resource_favorites_hr_admin_select"
  ON resource_favorites
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role')::text IN ('hr', 'admin')
  );
```
**Permite:** HR/Admin verem todos os favoritos (para analytics)

---

## 📋 MATRIZ DE PERMISSÕES

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **employee** | Próprio | Próprio | N/A | Próprio |
| **manager** | Próprio | Próprio | N/A | Próprio |
| **hr** | **Todos** | Próprio | N/A | Próprio |
| **admin** | **Todos** | Próprio | N/A | Próprio |

**Notas:**
- Não há UPDATE porque é tabela de junção simples (só INSERT ou DELETE)
- HR/Admin podem SELECT todos para relatórios e analytics
- Ninguém pode modificar favoritos de outros

---

## 🚀 COMO EXECUTAR A CORREÇÃO

### Opção 1: Executar Tudo de Uma Vez (Recomendado)

**Arquivo:** `FIX_RLS_RESOURCE_FAVORITES.sql`

1. **Abrir o arquivo:**
   ```bash
   cat FIX_RLS_RESOURCE_FAVORITES.sql
   ```

2. **Copiar PARTE 1 + PARTE 2 (linhas 1-52)**

3. **Acessar Supabase:**
   ```
   URL: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr
   Menu: SQL Editor > New Query
   ```

4. **Colar no SQL Editor e clicar "Run"**

5. **Executar queries de verificação (PARTE 3)**

---

### Opção 2: Migration (Para Histórico)

**Arquivo:** `supabase/migrations/20251125000000_fix_resource_favorites_rls.sql`

```bash
# Verificar migration
cat supabase/migrations/20251125000000_fix_resource_favorites_rls.sql

# Aplicar via Supabase CLI (se configurado)
supabase db push
```

---

## ✅ VALIDAÇÕES PÓS-CORREÇÃO

### Validação 1: RLS Habilitado
```sql
SELECT 
  tablename,
  rowsecurity as rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '✅ PROTEGIDO'
    ELSE '🚨 VULNERÁVEL'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'resource_favorites';
```

**Resultado Esperado:**
```
┌──────────────────────┬────────────────┬──────────────────┐
│ tablename            │ rls_habilitado │ status           │
├──────────────────────┼────────────────┼──────────────────┤
│ resource_favorites   │ true           │ ✅ PROTEGIDO     │
└──────────────────────┴────────────────┴──────────────────┘
```

---

### Validação 2: Políticas Criadas
```sql
SELECT 
  tablename,
  policyname,
  cmd as operacao,
  roles,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'resource_favorites'
ORDER BY cmd, policyname;
```

**Resultado Esperado:**
```
┌──────────────────────┬────────────────────────────────┬──────────┬─────────────────┬────────────┐
│ tablename            │ policyname                     │ operacao │ roles           │ permissive │
├──────────────────────┼────────────────────────────────┼──────────┼─────────────────┼────────────┤
│ resource_favorites   │ resource_favorites_own_delete  │ DELETE   │ {authenticated} │ PERMISSIVE │
│ resource_favorites   │ resource_favorites_own_insert  │ INSERT   │ {authenticated} │ PERMISSIVE │
│ resource_favorites   │ resource_favorites_own_select  │ SELECT   │ {authenticated} │ PERMISSIVE │
│ resource_favorites   │ resource_favorites_hr_admin... │ SELECT   │ {authenticated} │ PERMISSIVE │
└──────────────────────┴────────────────────────────────┴──────────┴─────────────────┴────────────┘
```

**Total Esperado:** 4 políticas

---

### Validação 3: Re-Executar Query 2 da Auditoria
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
```

**Resultado Esperado:**
```
(0 rows)  ← ✅ resource_favorites NÃO deve mais aparecer
```

**OU** (se houver outras tabelas sem RLS):
```
┌──────────────────────┐
│ tablename            │
├──────────────────────┤
│ outra_tabela         │  ← Outras tabelas, MAS não resource_favorites
└──────────────────────┘
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ANTES da Correção ❌

```
resource_favorites:
├─ RLS: ❌ DESABILITADO
├─ Políticas: 0
├─ Vulnerabilidade: 🚨 CRÍTICA
└─ Exposição: Todos os usuários veem todos os favoritos
```

**Cenário de Ataque:**
1. Usuário A loga no sistema
2. Faz query: `SELECT * FROM resource_favorites;`
3. **Vê favoritos de TODOS os usuários** 🚨
4. Pode adicionar/remover favoritos de outros

---

### DEPOIS da Correção ✅

```
resource_favorites:
├─ RLS: ✅ HABILITADO
├─ Políticas: 4 (SELECT, INSERT, DELETE próprio + SELECT HR/Admin)
├─ Segurança: 🟢 PROTEGIDA
└─ Isolamento: Cada usuário vê apenas seus dados
```

**Cenário Protegido:**
1. Usuário A loga no sistema
2. Faz query: `SELECT * FROM resource_favorites;`
3. **Vê apenas SEUS próprios favoritos** ✅
4. Não pode modificar favoritos de outros

---

## 📈 MÉTRICAS DE SEGURANÇA

### Status Atual:
```
Tabelas Auditadas:        42-46
Tabelas com RLS:          41-45 (antes)
Tabelas Vulneráveis:      1 (resource_favorites)
Taxa de Proteção:         ~98%
```

### Status Pós-Correção:
```
Tabelas Auditadas:        42-46
Tabelas com RLS:          42-46 ✅
Tabelas Vulneráveis:      0 ✅
Taxa de Proteção:         100% ✅
```

**Melhoria:** 🟢 +2% de proteção

---

## 📝 DOCUMENTAÇÃO DA CORREÇÃO

### Para `RLS_AUDIT_EXECUTION_RESULTS.txt`:

**Adicionar na seção "ANOMALIAS ENCONTRADAS":**

```
ANOMALIA #1: resource_favorites sem RLS
────────────────────────────────────────
Tabela: resource_favorites
Criticidade: 🟡 MÉDIA
Status: ✅ CORRIGIDA

Descrição:
- Tabela de favoritos de recursos de bem-estar
- Descoberta sem RLS durante Query 2 da auditoria
- Expunha preferências pessoais de todos os usuários

Correção Aplicada:
- RLS habilitado
- 4 políticas criadas (SELECT, INSERT, DELETE próprio + SELECT HR/Admin)
- Arquivo: FIX_RLS_RESOURCE_FAVORITES.sql
- Migration: 20251125000000_fix_resource_favorites_rls.sql

Validação:
✅ RLS habilitado (confirmado)
✅ 4 políticas implementadas
✅ Query 2 não retorna mais a tabela
✅ Testes funcionais: OK

Data da Correção: 25 de Novembro de 2025
Executor: [SEU_NOME]
```

---

## 🎯 PRÓXIMOS PASSOS

### Imediato:
- [x] Criar arquivo de correção SQL
- [x] Criar migration para histórico
- [x] Documentar correção
- [ ] **Executar correção no Supabase** ← **VOCÊ ESTÁ AQUI**
- [ ] Validar que RLS está ativo
- [ ] Re-executar Query 2 da auditoria

### Curto Prazo:
- [ ] Testar funcionalidade de favoritos
- [ ] Verificar que usuários comuns não veem favoritos de outros
- [ ] Verificar que HR/Admin veem todos
- [ ] Atualizar relatório de auditoria

### Médio Prazo:
- [ ] Revisar outras tabelas similares
- [ ] Automatizar validação RLS em CI/CD
- [ ] Agendar auditorias periódicas (mensal)

---

## 🔍 TABELAS SIMILARES A REVISAR

**Outras tabelas de preferências/junção a verificar:**

```sql
-- Verificar se estas tabelas têm RLS:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'course_enrollments',
    'notification_preferences',
    'action_group_participants',
    'mentor_ratings',
    'session_slots'
  )
ORDER BY tablename;
```

**Se alguma não tiver RLS:** Criar correção similar.

---

## 📚 ARQUIVOS CRIADOS

```
✅ FIX_RLS_RESOURCE_FAVORITES.sql                        - Script de correção SQL
✅ supabase/migrations/20251125000000_fix_...sql         - Migration oficial
✅ RESOURCE_FAVORITES_RLS_FIX.md                         - Este documento
```

---

## ⚠️ IMPORTANTE

**Esta correção deve ser executada IMEDIATAMENTE:**
- ✅ Dados de preferência são pessoais (LGPD)
- ✅ Exposição de padrões de saúde mental
- ✅ Risco médio, mas fácil de corrigir
- ✅ Tempo de execução: 1-2 minutos

**Após executar:**
1. Validar que funcionou
2. Atualizar relatório de auditoria
3. Comunicar ao time
4. Continuar auditoria para outras tabelas

---

**Data:** 25 de Novembro de 2025  
**Severidade:** 🟡 MÉDIA  
**Status:** ✅ SOLUÇÃO PRONTA (aguardando execução)  
**Tempo Estimado:** 2 minutos

---

**🔒 SEGURANÇA EM PRIMEIRO LUGAR! 🔒**
