# 🔒 Guia de Execução - Auditoria Completa de Políticas RLS
## TalentFlow - Supabase Security Audit | 25 de Novembro de 2025

---

## 📋 RESUMO EXECUTIVO

**Objetivo:** Auditar todas as políticas Row Level Security (RLS) do Supabase para garantir que não há vulnerabilidades de segurança.

**Duração Estimada:** 15-20 minutos

**Pré-requisitos:**
- ✅ Acesso ao Dashboard do Supabase
- ✅ Permissões de execução SQL
- ✅ Arquivo `DATABASE_AUDIT_QUERIES.sql` disponível

**Resultado Esperado:**
- ✅ 42-46 tabelas com RLS habilitado
- ✅ Zero tabelas vulneráveis
- ✅ Todas as tabelas críticas com políticas adequadas

---

## 🚀 PASSO A PASSO

### PASSO 1: Acessar SQL Editor

1. **Abrir Dashboard do Supabase:**
   ```
   URL: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr
   ```

2. **Navegar para SQL Editor:**
   ```
   Menu lateral > SQL Editor > New Query
   ```

3. **Preparar o arquivo de queries:**
   - Abrir: `/workspace/DATABASE_AUDIT_QUERIES.sql`
   - Ter o arquivo disponível para copiar queries

---

### PASSO 2: Executar Query 1 - Status RLS de TODAS as Tabelas

**📝 Query 1: Verificar status RLS de TODAS as tabelas**

```sql
-- Query 1: Verificar status RLS de TODAS as tabelas
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ PROTEGIDO'
    ELSE '🚨 VULNERÁVEL'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;
```

**Como Executar:**
1. Copiar query acima do arquivo `DATABASE_AUDIT_QUERIES.sql` (linhas 11-20)
2. Colar no SQL Editor
3. Clicar em "Run" (ou Ctrl+Enter)
4. Aguardar resultado

**Resultado Esperado:**
```
┌─────────────────────────────┬─────────────┬─────────────────┐
│ tablename                   │ rowsecurity │ status          │
├─────────────────────────────┼─────────────┼─────────────────┤
│ profiles                    │ true        │ ✅ PROTEGIDO    │
│ teams                       │ true        │ ✅ PROTEGIDO    │
│ pdis                        │ true        │ ✅ PROTEGIDO    │
│ ... (40+ linhas)            │ true        │ ✅ PROTEGIDO    │
└─────────────────────────────┴─────────────┴─────────────────┘

Total de linhas: 42-46 (TODAS com rowsecurity = true)
```

**✅ VALIDAÇÃO:**
- ✅ Todas as linhas devem ter `status = '✅ PROTEGIDO'`
- ✅ Total de linhas: entre 42 e 46
- ❌ Se aparecer alguma linha com `🚨 VULNERÁVEL`: **CRÍTICO - documentar**

**📝 AÇÃO:**
- Copiar o resultado completo
- Colar em: `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção "QUERY 1")
- Anotar total de tabelas encontradas

---

### PASSO 3: Executar Query 2 - CRÍTICO: Tabelas SEM RLS

**📝 Query 2: Listar tabelas SEM RLS (CRÍTICO)**

```sql
-- Query 2: CRÍTICO - Listar tabelas SEM RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
```

**Como Executar:**
1. Copiar query acima do arquivo `DATABASE_AUDIT_QUERIES.sql` (linhas 22-25)
2. Colar no SQL Editor (limpar query anterior)
3. Clicar em "Run"
4. Aguardar resultado

**Resultado Esperado:**
```
┌─────────────┐
│ tablename   │
├─────────────┤
│ (0 rows)    │
└─────────────┘
```

**✅ VALIDAÇÃO:**
- ✅ **RESULTADO ESPERADO: Zero linhas (vazio)**
- ❌ **Se retornar tabelas: CRÍTICO**

**🚨 SE RETORNAR TABELAS:**
1. **DOCUMENTAR IMEDIATAMENTE** quais tabelas
2. Verificar se são tabelas:
   - **Críticas** (profiles, psychological_records, salary_history, etc.)
     - 🔴 **ALERTA MÁXIMO** - Dados sensíveis expostos
   - **Secundárias** (logs, cache, sessions temporárias)
     - 🟡 **ALERTA MÉDIO** - Risco moderado
3. Priorizar correção conforme criticidade
4. **NÃO CORRIGIR AGORA** (apenas auditar)

**📝 AÇÃO:**
- Copiar o resultado completo
- Colar em: `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção "QUERY 2")
- Se houver tabelas: listar TODAS e classificar por criticidade

---

### PASSO 4: Executar Query 3 - Políticas de Tabelas Críticas

**📝 Query 3: Verificar políticas existentes nas tabelas críticas**

```sql
-- Query 3: Verificar políticas existentes nas tabelas críticas
SELECT 
  tablename, 
  policyname, 
  cmd as operacao,
  roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles',
    'psychological_records',
    'emotional_checkins',
    'salary_history',
    'audit_logs',
    'pdis',
    'tasks',
    'competencies',
    'psychology_sessions',
    'therapeutic_activities',
    'mental_health_alerts',
    'consent_records'
  )
ORDER BY tablename, cmd;
```

**Como Executar:**
1. Copiar query acima do arquivo `DATABASE_AUDIT_QUERIES.sql` (linhas 31-60)
   - **NOTA:** A query no arquivo pode ter nomes de tabelas antigos (pdi, pdi_objetivos, etc.)
   - Use a query ATUALIZADA acima com nomes corretos
2. Colar no SQL Editor
3. Clicar em "Run"
4. Aguardar resultado

**Resultado Esperado:**
```
┌────────────────────────────┬──────────────────────────────────┬──────────┬──────────────┐
│ tablename                  │ policyname                       │ operacao │ roles        │
├────────────────────────────┼──────────────────────────────────┼──────────┼──────────────┤
│ audit_logs                 │ audit_logs_admin_full_access     │ SELECT   │{authenticated}│
│ audit_logs                 │ audit_logs_admin_insert          │ INSERT   │{authenticated}│
│ competencies               │ competencies_own_access          │ SELECT   │{authenticated}│
│ competencies               │ competencies_hr_admin_manage     │ INSERT   │{authenticated}│
│ consent_records            │ consent_own_access               │ SELECT   │{authenticated}│
│ emotional_checkins         │ checkins_own_access              │ SELECT   │{authenticated}│
│ emotional_checkins         │ checkins_hr_admin_view           │ SELECT   │{authenticated}│
│ emotional_checkins         │ checkins_own_manage              │ INSERT   │{authenticated}│
│ ... (40+ linhas)           │ ...                              │ ...      │ ...          │
└────────────────────────────┴──────────────────────────────────┴──────────┴──────────────┘
```

**✅ VALIDAÇÃO:**

Para cada tabela crítica, verificar que existem políticas:

| Tabela | SELECT | INSERT | UPDATE | DELETE | Mínimo |
|--------|--------|--------|--------|--------|--------|
| **profiles** | ✅ | ✅ | ✅ | ❌ | 3 políticas |
| **psychological_records** | ✅ | ✅ | ❌ | ❌ | 2 políticas |
| **emotional_checkins** | ✅ | ✅ | ✅ | ✅ | 3 políticas |
| **salary_history** | ✅ | ✅ | ❌ | ❌ | 2 políticas |
| **audit_logs** | ✅ | ✅ | ❌ | ❌ | 2 políticas |
| **pdis** | ✅ | ✅ | ✅ | ✅ | 4 políticas |
| **tasks** | ✅ | ✅ | ✅ | ✅ | 4 políticas |
| **competencies** | ✅ | ✅ | ✅ | ❌ | 3 políticas |

**Verificações Específicas:**

1. **psychological_records:**
   ```
   ✅ Deve ter apenas políticas para HR/Admin
   ❌ NÃO deve ter políticas para manager ou employee direto
   ```

2. **salary_history:**
   ```
   ✅ Deve ter apenas políticas para HR/Admin
   ❌ NÃO deve ter políticas para manager
   ```

3. **emotional_checkins:**
   ```
   ✅ Deve ter política para próprio usuário (auth.uid())
   ✅ Deve ter política para HR/Admin
   ❌ NÃO deve ter política para manager
   ```

4. **audit_logs:**
   ```
   ✅ Deve ter apenas políticas para Admin
   ❌ NÃO deve ter políticas para HR, manager ou employee
   ```

**📝 AÇÃO:**
- Copiar o resultado completo
- Colar em: `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção "QUERY 3")
- Marcar ✅ ou ❌ para cada validação específica acima

---

### PASSO 5: Executar Query 3B - Contagem de Políticas (OPCIONAL)

**📝 Query 3B: Contagem de políticas por tabela**

```sql
-- Query 3B: Contagem de políticas por tabela crítica
SELECT 
  tablename,
  COUNT(*) as total_politicas,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as politicas_select,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as politicas_insert,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as politicas_update,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as politicas_delete
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Como Executar:**
1. Copiar query acima do arquivo `DATABASE_AUDIT_QUERIES.sql` (linhas 62-73)
2. Colar no SQL Editor
3. Clicar em "Run"

**Resultado Esperado:**
```
┌────────────────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ tablename                  │ total_politicas │ politicas_select│ politicas_insert│ politicas_update│ politicas_delete│
├────────────────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ profiles                   │ 4               │ 2               │ 1               │ 1               │ 0               │
│ pdis                       │ 6               │ 2               │ 2               │ 1               │ 1               │
│ ... (40+ linhas)           │ ...             │ ...             │ ...             │ ...             │ ...             │
└────────────────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**✅ VALIDAÇÃO:**
- ✅ Cada tabela deve ter pelo menos 1-2 políticas
- ✅ Tabelas críticas devem ter 3+ políticas
- ⚠️ Se alguma tabela tem 0 políticas: investigar (pode ser tabela lookup/reference)

**📝 AÇÃO:**
- Copiar o resultado completo
- Colar em: `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção "QUERY 3B - OPCIONAL")

---

## 🎯 VALIDAÇÕES ESSENCIAIS - CHECKLIST

Após executar todas as queries, preencher este checklist:

### 1. Total de Tabelas com RLS

```
[ ] Total de tabelas: ______ (esperado: 42-46)
[ ] Tabelas com RLS: ______ (esperado: igual ao total)
[ ] Taxa de proteção: ______ (esperado: 100%)
```

**Fórmula:** `(Tabelas com RLS / Total de tabelas) * 100`

---

### 2. Tabelas Vulneráveis (Query 2)

```
[ ] Query 2 retornou: ______ linhas (esperado: 0)
[ ] Se > 0, listar tabelas vulneráveis:
    - _____________________________
    - _____________________________
    - _____________________________
```

**Se Query 2 retornou > 0 linhas:** 🚨 **CRÍTICO**

---

### 3. Tabelas Ultra-Sensíveis Protegidas

Marcar ✅ ou ❌ para cada tabela:

```
[ ] psychological_records
    [ ] RLS habilitado
    [ ] Políticas apenas para HR/Admin
    [ ] NÃO acessível por manager/employee

[ ] salary_history
    [ ] RLS habilitado
    [ ] Políticas apenas para HR/Admin
    [ ] NÃO acessível por manager

[ ] emotional_checkins
    [ ] RLS habilitado
    [ ] Próprio usuário pode ler/escrever
    [ ] HR/Admin podem ler
    [ ] NÃO acessível por manager

[ ] audit_logs
    [ ] RLS habilitado
    [ ] Políticas apenas para Admin
    [ ] NÃO acessível por HR/manager/employee

[ ] therapeutic_activities
    [ ] RLS habilitado
    [ ] Políticas implementadas

[ ] psychology_sessions
    [ ] RLS habilitado
    [ ] Políticas implementadas

[ ] consent_records
    [ ] RLS habilitado
    [ ] Políticas implementadas
```

---

### 4. Tabelas Críticas de Negócio

```
[ ] profiles: _____ políticas (esperado: 4+)
[ ] pdis: _____ políticas (esperado: 4+)
[ ] tasks: _____ políticas (esperado: 4+)
[ ] competencies: _____ políticas (esperado: 3+)
[ ] action_groups: _____ políticas (esperado: 3+)
[ ] mentorships: _____ políticas (esperado: 3+)
```

---

## 📊 TEMPLATE DE RESULTADOS

Criar arquivo: **`RLS_AUDIT_EXECUTION_RESULTS.txt`**

```
═══════════════════════════════════════════════════════════════
  RESULTADOS DA AUDITORIA RLS - TALENTFLOW
  Data: [DATA_EXECUÇÃO]
  Executor: [SEU_NOME]
  Projeto Supabase: fvobspjiujcurfugjsxr
═══════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY 1 - STATUS RLS DE TODAS AS TABELAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[COLAR RESULTADO COMPLETO DA QUERY 1 AQUI]

RESUMO:
- Total de tabelas: _______
- Tabelas com RLS: _______
- Taxa de proteção: _______ %

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY 2 - CRÍTICO: TABELAS SEM RLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[COLAR RESULTADO COMPLETO DA QUERY 2 AQUI]

RESULTADO: [ ] ZERO TABELAS (✅ PASS)  [ ] TABELAS ENCONTRADAS (🚨 CRÍTICO)

SE TABELAS VULNERÁVEIS FORAM ENCONTRADAS:
1. _____________________________ (Criticidade: ALTA/MÉDIA/BAIXA)
2. _____________________________ (Criticidade: ALTA/MÉDIA/BAIXA)
3. _____________________________ (Criticidade: ALTA/MÉDIA/BAIXA)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY 3 - POLÍTICAS DE TABELAS CRÍTICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[COLAR RESULTADO COMPLETO DA QUERY 3 AQUI]

VALIDAÇÕES ESPECÍFICAS:

psychological_records:
  [ ] Apenas HR/Admin podem acessar
  [ ] Nenhuma política para manager/employee

salary_history:
  [ ] Apenas HR/Admin podem acessar
  [ ] Nenhuma política para manager

emotional_checkins:
  [ ] Próprio usuário pode acessar
  [ ] HR/Admin podem acessar
  [ ] Nenhuma política para manager

audit_logs:
  [ ] Apenas Admin pode acessar
  [ ] Nenhuma política para HR/manager/employee

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUERY 3B - CONTAGEM DE POLÍTICAS (OPCIONAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[COLAR RESULTADO COMPLETO DA QUERY 3B AQUI - SE EXECUTADO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESUMO EXECUTIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS GERAL: [ ] ✅ APROVADO  [ ] ⚠️ ATENÇÃO  [ ] 🚨 CRÍTICO

ESTATÍSTICAS:
- Total de tabelas: _____ / 42-46
- Tabelas com RLS: _____ / _____
- Taxa de proteção: _____ %
- Tabelas vulneráveis: _____
- Total de políticas: _____

TABELAS CRÍTICAS:
- psychological_records: [ ] ✅  [ ] ⚠️  [ ] 🚨
- salary_history: [ ] ✅  [ ] ⚠️  [ ] 🚨
- emotional_checkins: [ ] ✅  [ ] ⚠️  [ ] 🚨
- audit_logs: [ ] ✅  [ ] ⚠️  [ ] 🚨

ANOMALIAS ENCONTRADAS:
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________

PRÓXIMOS PASSOS:
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________

CONCLUSÃO:
[Escrever conclusão geral da auditoria - 2-3 parágrafos]

═══════════════════════════════════════════════════════════════
  FIM DO RELATÓRIO DE AUDITORIA
  Executado em: [DATA_HORA]
═══════════════════════════════════════════════════════════════
```

---

## 🔍 TROUBLESHOOTING

### Problema 1: Query não retorna nada

**Sintoma:** Query executou, mas não aparece nenhum resultado

**Possíveis Causas:**
1. Nenhuma tabela existe no schema 'public'
2. Query tem erro de sintaxe
3. Timeout do SQL Editor

**Solução:**
1. Verificar se está no projeto correto
2. Testar query simples: `SELECT * FROM pg_tables WHERE schemaname = 'public' LIMIT 5;`
3. Aumentar timeout se necessário

---

### Problema 2: Erro "permission denied for schema public"

**Sintoma:** Query retorna erro de permissão

**Solução:**
1. Verificar que está logado como owner do projeto
2. Usar painel "SQL Editor" (não "Database" > "Tables")
3. Se persistir: contatar suporte Supabase

---

### Problema 3: Muitas tabelas sem RLS (Query 2 retorna >10 tabelas)

**Sintoma:** Query 2 retorna muitas tabelas vulneráveis

**Causa:** Migrations RLS podem não ter sido executadas

**Solução:**
1. **NÃO CORRIGIR AGORA** (apenas documentar)
2. Verificar se migration `20250930140232_complete_rls_consolidation.sql` foi executada
3. Priorizar por criticidade de dados
4. Documentar todas as tabelas no relatório

---

### Problema 4: Tabela crítica sem políticas (Query 3 vazia para tabela X)

**Sintoma:** Tabela crítica existe, mas não aparece em Query 3

**Possíveis Causas:**
1. Nome da tabela mudou (ex: `pdi` → `pdis`)
2. Tabela não tem políticas implementadas (vulnerabilidade)

**Solução:**
1. Verificar nome correto da tabela: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
2. Se nome estiver correto e não tem políticas: **CRÍTICO - documentar**
3. Atualizar Query 3 com nome correto se necessário

---

## 📚 REFERÊNCIAS

### Documentação do Projeto:
- `RLS_SECURITY_DOCUMENTATION.md` - Documentação completa das políticas RLS
- `DATABASE_AUDIT_QUERIES.sql` - Arquivo com todas as queries de auditoria
- `RLS_VALIDATION_SCRIPT.sql` - Script de validação automatizada
- `supabase/migrations/20250930140232_complete_rls_consolidation.sql` - Migration de consolidação RLS

### Documentação Supabase:
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SQL Editor](https://supabase.com/docs/guides/database/overview#the-sql-editor)

---

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

### ✅ FAÇA:
- Execute as queries na ordem
- Copie os resultados completos
- Documente todas as anomalias
- Marque os checklists
- Priorize vulnerabilidades por criticidade

### ❌ NÃO FAÇA:
- **NÃO CRIE** novas políticas RLS
- **NÃO MODIFIQUE** políticas existentes
- **NÃO DESABILITE** RLS em nenhuma tabela
- **NÃO DELETE** políticas
- **NÃO EXECUTE** comandos que não sejam SELECT

**Esta é uma AUDITORIA de segurança, não uma correção.**

**Qualquer correção deve ser feita via migrations SQL no código, NÃO diretamente no dashboard.**

---

## 🎯 CRITÉRIOS DE SUCESSO

### ✅ AUDITORIA APROVADA SE:
- ✅ 100% das tabelas têm RLS habilitado
- ✅ Zero tabelas vulneráveis (Query 2 vazia)
- ✅ Todas as tabelas críticas têm políticas adequadas
- ✅ psychological_records: apenas HR/Admin
- ✅ salary_history: apenas HR/Admin
- ✅ emotional_checkins: próprio usuário + HR/Admin
- ✅ audit_logs: apenas Admin

### ⚠️ ATENÇÃO SE:
- ⚠️ 95-99% das tabelas têm RLS (1-2 tabelas sem RLS)
- ⚠️ Tabelas sem RLS são secundárias (logs, cache)
- ⚠️ Algumas tabelas críticas têm políticas, mas podem ser melhoradas

### 🚨 CRÍTICO SE:
- 🚨 < 95% das tabelas têm RLS
- 🚨 Tabelas críticas SEM RLS (psychological_records, salary_history, etc.)
- 🚨 Tabelas sensíveis acessíveis por roles incorretos
- 🚨 Políticas com USING (true) sem restrições

---

**Data de Criação:** 25 de Novembro de 2025  
**Versão:** 1.0  
**Última Atualização:** 25 de Novembro de 2025  
**Preparado por:** Background Agent - Cursor AI

---

**BOA AUDITORIA! 🔒**
