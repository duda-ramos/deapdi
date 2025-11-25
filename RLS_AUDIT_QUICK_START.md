# 🚀 Quick Start - Auditoria RLS TalentFlow
## Execução Rápida em 5 Passos | 15 minutos

---

## 📋 ANTES DE COMEÇAR

**Você vai precisar de:**
- ✅ Acesso ao Dashboard Supabase
- ✅ 15 minutos de tempo dedicado
- ✅ Os 3 arquivos preparados (veja abaixo)

---

## 📂 ARQUIVOS NECESSÁRIOS

```
/workspace/
├── DATABASE_AUDIT_QUERIES.sql           ✅ Queries SQL (10 queries)
├── RLS_AUDIT_EXECUTION_GUIDE.md         ✅ Guia detalhado (20 páginas)
└── RLS_AUDIT_EXECUTION_RESULTS.txt      ✅ Template para resultados
```

**Todos os arquivos estão prontos! 🎉**

---

## ⚡ 5 PASSOS RÁPIDOS

### 1️⃣ ABRIR DASHBOARD (1 min)

```
🌐 URL: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr

📍 Navegação: Menu lateral > SQL Editor > New Query
```

---

### 2️⃣ EXECUTAR QUERY 1 - Status RLS (3 min)

**Copiar do arquivo `DATABASE_AUDIT_QUERIES.sql` (linhas 11-20):**

```sql
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

**Executar:**
1. Colar no SQL Editor
2. Clicar "Run" (ou Ctrl+Enter)
3. Copiar resultado completo
4. Colar em `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção QUERY 1)

**✅ Validar:** Todas as linhas devem ter `status = '✅ PROTEGIDO'`

---

### 3️⃣ EXECUTAR QUERY 2 - Tabelas Vulneráveis (2 min)

**Copiar do arquivo `DATABASE_AUDIT_QUERIES.sql` (linhas 22-25):**

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
```

**Executar:**
1. Colar no SQL Editor (limpar query anterior)
2. Clicar "Run"
3. Copiar resultado
4. Colar em `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção QUERY 2)

**✅ Validar:** DEVE RETORNAR ZERO LINHAS (vazio)

**🚨 SE RETORNAR TABELAS:** Isso é CRÍTICO! Documente quais tabelas imediatamente.

---

### 4️⃣ EXECUTAR QUERY 3 - Políticas Críticas (5 min)

**Copiar esta query ATUALIZADA:**

```sql
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

**Executar:**
1. Colar no SQL Editor
2. Clicar "Run"
3. Copiar resultado completo
4. Colar em `RLS_AUDIT_EXECUTION_RESULTS.txt` (seção QUERY 3)

**✅ Validar:** Verificar que cada tabela crítica tem políticas:
- `psychological_records`: Apenas HR/Admin
- `salary_history`: Apenas HR/Admin
- `emotional_checkins`: Próprio + HR/Admin (NÃO manager)
- `audit_logs`: Apenas Admin

---

### 5️⃣ PREENCHER RESUMO (4 min)

**Abrir:** `RLS_AUDIT_EXECUTION_RESULTS.txt`

**Preencher seções:**
1. **Resumo da Query 1:**
   - Total de tabelas: _____
   - Tabelas com RLS: _____
   - Taxa de proteção: _____% 

2. **Resultado da Query 2:**
   - [ ] ✅ ZERO TABELAS (aprovado)
   - [ ] 🚨 TABELAS ENCONTRADAS (crítico)

3. **Validações Específicas da Query 3:**
   - Marcar ✅ ou 🚨 para cada tabela crítica

4. **Status Geral:**
   - [ ] ✅ APROVADO
   - [ ] ⚠️ ATENÇÃO
   - [ ] 🚨 CRÍTICO

5. **Conclusão (2-3 parágrafos)**

---

## 📊 RESULTADO ESPERADO

```
STATUS FINAL:           ✅ APROVADO

Total de tabelas:       42-46
Tabelas com RLS:        42-46 (100%)
Tabelas vulneráveis:    0
Total de políticas:     100-120

TABELAS CRÍTICAS:       ✅ Todas protegidas
ANOMALIAS:              Nenhuma
RECOMENDAÇÃO:           ✅ Aprovado para produção
```

---

## 🆘 AJUDA RÁPIDA

### ❓ Query não retorna nada?
1. Verificar se está no projeto correto (fvobspjiujcurfugjsxr)
2. Testar query simples: `SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';`
3. Recarregar página do SQL Editor

### ❓ Query 2 retornou tabelas?
1. **NÃO ENTRE EM PÂNICO** 😌
2. Listar quais tabelas
3. Verificar se são críticas ou secundárias
4. Documentar no relatório
5. **NÃO CORRIGIR AGORA** (apenas auditar)

### ❓ Erro de permissão?
1. Confirmar que está logado como owner do projeto
2. Usar painel "SQL Editor" (não "Database" > "Tables")
3. Se persistir: contatar suporte Supabase

---

## 📚 DOCUMENTAÇÃO COMPLETA

**Para instruções detalhadas:**
- Abrir: `RLS_AUDIT_EXECUTION_GUIDE.md` (20 páginas)
- Inclui: Troubleshooting completo, critérios de sucesso, referências

**Para entender o RLS:**
- Abrir: `RLS_SECURITY_DOCUMENTATION.md`
- Inclui: Matriz de permissões, hierarquia de roles, 42 tabelas

---

## ⏱️ CHECKLIST RÁPIDO

```
PREPARAÇÃO:
[ ] Arquivos verificados (DATABASE_AUDIT_QUERIES.sql, etc.)
[ ] Dashboard Supabase aberto
[ ] SQL Editor acessível

EXECUÇÃO:
[ ] Query 1 executada ✅
[ ] Query 2 executada ✅
[ ] Query 3 executada ✅
[ ] Resultados copiados para template ✅
[ ] Validações marcadas ✅

FINALIZAÇÃO:
[ ] Resumo preenchido ✅
[ ] Anomalias documentadas (se houver) ✅
[ ] Status final definido ✅
[ ] Arquivo de resultados salvo ✅
```

---

## 🎯 PRONTO!

**Tempo Total:** ~15 minutos  
**Resultado:** Relatório completo de auditoria RLS  
**Próximo Passo:** Revisar resultados e emitir recomendação

---

**IMPORTANTE:**
- ✅ Execute apenas queries SELECT (leitura)
- ❌ NÃO modifique políticas no dashboard
- ❌ NÃO desabilite RLS
- ✅ Documente TUDO

**Esta é uma AUDITORIA, não uma CORREÇÃO.**

---

**Boa sorte! 🔒**

**Preparado por:** Background Agent - Cursor AI  
**Data:** 25 de Novembro de 2025
