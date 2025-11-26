# ⚡ GUIA RÁPIDO - VALIDAÇÃO FINAL DE DADOS SENSÍVEIS

## 🎯 OBJETIVO

Confirmar que dados ultra-sensíveis estão 100% protegidos por RLS antes de aprovar para produção.

**Tempo estimado:** 20-30 minutos

---

## 📋 PRÉ-REQUISITOS

- [ ] Acesso ao banco de dados (Supabase ou PostgreSQL)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Usuários de teste existentes (verificar com `VALIDATE_USER_ISOLATION_QUERY.sql`)
- [ ] Navegador com DevTools

---

## ⚡ PARTE 1: VALIDAÇÃO SQL (10 min)

### Passo 1.1: Executar Script de Validação

**Opção A: Terminal**
```bash
psql "postgresql://..." -f FINAL_SENSITIVE_DATA_VALIDATION.sql > validation_results.txt
```

**Opção B: Supabase SQL Editor**
1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
2. Copie o conteúdo de `FINAL_SENSITIVE_DATA_VALIDATION.sql`
3. Cole e clique em `Run`
4. Salve os resultados

### Passo 1.2: Verificar Resultados Críticos

**Procure por estas mensagens no output:**

✅ **Sucesso:**
```
✅✅✅ PARABÉNS! ✅✅✅
🎉 TODAS AS 7 TABELAS SENSÍVEIS ESTÃO 100% PROTEGIDAS!
✅ Sistema APROVADO para produção
```

❌ **Problema:**
```
⚠️⚠️⚠️ ATENÇÃO! ⚠️⚠️⚠️
Apenas X de 7 tabelas estão protegidas!
```

### Passo 1.3: Validar Testes Críticos

**Verificar NO OUTPUT:**

| Teste | Resultado Esperado | Seu Resultado |
|-------|-------------------|---------------|
| Manager acessa emotional_checkins | ✅ 0 políticas | ___ |
| Manager acessa psychological_records | ✅ 0 políticas | ___ |
| Manager acessa salary_history | ✅ 0 políticas | ___ |
| RLS habilitado em therapeutic_tasks | ✅ HABILITADO | ___ |
| RLS habilitado em checkin_settings | ✅ HABILITADO | ___ |

**Status SQL:** ⬜ ✅ APROVADO | ⬜ ❌ REPROVADO

---

## 🧪 PARTE 2: TESTES NA INTERFACE (10 min)

### Setup Rápido

```bash
# Iniciar servidor
npm run dev

# Abrir 2 navegadores:
# Navegador 1: Manager (gestor1.teste@deapdi-test.local / Gestor@2025!)
# Navegador 2: Employee (colab1.teste@deapdi-test.local / Colab@2025!)
```

---

### TESTE CRÍTICO 1: Manager NÃO vê check-ins de subordinados

**No navegador do MANAGER:**

1. Login como `gestor1.teste@deapdi-test.local`
2. Navegar: `Saúde Mental` → `Check-ins` ou `Dashboard`
3. **VERIFICAR:**
   - [ ] Não aparece lista de check-ins de subordinados?
   - [ ] Não aparece estatística da equipe?
   - [ ] Não aparece alerta de estresse de subordinados?

4. **TESTE DE URL DIRETA:**
   - No navegador do HR, acesse um check-in e copie a URL
   - Cole no navegador do Manager
   - **ESPERADO:** ❌ Erro 403, tela vazia, ou redirecionamento

**Resultado:** ⬜ ✅ PASS | ⬜ ❌ FAIL - VULNERABILIDADE CRÍTICA

---

### TESTE CRÍTICO 2: Employee NÃO vê dados de colegas

**No navegador do EMPLOYEE:**

1. Login como `colab1.teste@deapdi-test.local`
2. Navegar: `Desenvolvimento` → `PDIs`
3. **VERIFICAR:**
   - [ ] Aparecem apenas PDIs próprios?
   - [ ] Não aparecem PDIs de outros employees?

4. **TESTE DE URL DIRETA:**
   - Tente acessar: `/pdis/<uuid_de_outro_employee>`
   - **ESPERADO:** ❌ Erro 403 ou redirecionamento

**Resultado:** ⬜ ✅ PASS | ⬜ ❌ FAIL - VAZAMENTO DE DADOS

---

### TESTE CRÍTICO 3: API não retorna dados extras

**No navegador do EMPLOYEE (DevTools F12):**

1. Abra DevTools → Network → XHR/Fetch
2. Navegue pela aplicação (PDIs, favoritos, etc.)
3. Clique em requisições de API
4. **VERIFICAR JSON:**
   - [ ] Contém apenas dados do usuário logado?
   - [ ] Não contém arrays com múltiplos usuários?
   - [ ] profile_id/user_id corresponde ao usuário logado?

**Resultado:** ⬜ ✅ PASS | ⬜ ❌ FAIL - VAZAMENTO VIA API

---

## 📝 PARTE 3: DOCUMENTAÇÃO (5-10 min)

### Preencher Relatórios

1. **Abrir:** `SENSITIVE_DATA_PROTECTION_REPORT.md`

2. **Preencher Seções:**
   - ✅ PARTE 1: Colar resultados do SQL
   - ✅ PARTE 2: Documentar resultados dos testes manuais
   - ✅ PARTE 4: Atualizar score de compliance
   - ✅ PARTE 6: Marcar decisão final

3. **Confirmar Fix Aplicado:**
   - ✅ Verificar seção "Confirmação de Fix Aplicado"
   - ✅ Marcar checkboxes se migration foi aplicada
   - ✅ Confirmar RLS funcionando

---

## ✅ DECISÃO FINAL

### Critérios de Aprovação

**✅ APROVAR SE:**
- ✅ Validação SQL: 7/7 tabelas protegidas (100%)
- ✅ Manager NÃO vê check-ins de subordinados
- ✅ Employee NÃO vê dados de outros employees
- ✅ APIs retornam apenas dados autorizados
- ✅ Score de compliance LGPD: 100%

**❌ REPROVAR SE:**
- ❌ Qualquer tabela sensível sem RLS
- ❌ Manager consegue ver check-ins de subordinados
- ❌ Employee consegue ver dados de outros
- ❌ APIs retornam dados não autorizados
- ❌ Score de compliance < 80%

---

## 🎯 AÇÕES PÓS-VALIDAÇÃO

### Se APROVADO ✅

```bash
# 1. Marcar decisão no relatório
# Edite: SENSITIVE_DATA_PROTECTION_REPORT.md
# Marque: ✅ APROVADO - Sistema 100% Protegido

# 2. Arquivar documentação
mkdir -p docs/security-audits
cp SENSITIVE_DATA_PROTECTION_REPORT.md docs/security-audits/
cp BUG_FIX_THERAPEUTIC_TASKS_RLS.md docs/security-audits/

# 3. Criar tag de release (opcional)
git tag -a v1.0-security-approved -m "Security audit passed - RLS 100%"
```

**Próximos passos:**
- ✅ Sistema aprovado para produção
- ✅ Seguir para testes de performance
- ✅ Agendar revisão periódica (mensal)

---

### Se REPROVADO ❌

```bash
# 1. BLOQUEAR DEPLOY
echo "🚨 DEPLOY BLOQUEADO - Vulnerabilidades críticas encontradas" > DEPLOY_BLOCKED.txt

# 2. Documentar vulnerabilidades
# Preencha detalhadamente a seção de vulnerabilidades no relatório

# 3. Criar issues
# Para cada vulnerabilidade crítica, criar issue no GitHub/Jira

# 4. Notificar
# - Time de desenvolvimento
# - DPO (Data Protection Officer)
# - Product Owner
```

**Próximos passos:**
- 🚨 Corrigir vulnerabilidades críticas
- 🚨 Revalidar 100% após correções
- 🚨 Considerar audit de segurança externo

---

## 📊 CHECKLIST FINAL

Antes de finalizar, confirmar:

- [ ] Script SQL executado e resultados salvos
- [ ] Teste 1: Manager NÃO vê check-ins (PASS)
- [ ] Teste 2: Employee isolado (PASS)
- [ ] Teste 3: APIs não vazam dados (PASS)
- [ ] `SENSITIVE_DATA_PROTECTION_REPORT.md` preenchido
- [ ] Decisão final marcada (APROVADO/REPROVADO)
- [ ] Se APROVADO: Documentação arquivada
- [ ] Se REPROVADO: Issues criadas e notificações enviadas

---

## 🔧 COMANDOS ÚTEIS

### Verificar se migration foi aplicada

```sql
SELECT * FROM public.schema_migrations 
WHERE version = '20251029010000';
-- Deve retornar 1 linha
```

### Ver políticas de uma tabela específica

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'emotional_checkins'
ORDER BY cmd, policyname;
```

### Verificar RLS de múltiplas tabelas

```sql
SELECT 
  t.tablename,
  c.relrowsecurity as rls_enabled,
  COALESCE(p.policy_count, 0) as policies
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN (
  'psychological_records',
  'emotional_checkins',
  'salary_history',
  'therapeutic_tasks',
  'checkin_settings'
)
ORDER BY t.tablename;
```

---

## 📞 REFERÊNCIAS

**Documentação Completa:**
- `SENSITIVE_DATA_PROTECTION_REPORT.md` - Relatório principal
- `BUG_FIX_THERAPEUTIC_TASKS_RLS.md` - Detalhes do fix aplicado
- `FINAL_SENSITIVE_DATA_VALIDATION.sql` - Script de validação
- `MANUAL_USER_ISOLATION_TEST_GUIDE.md` - Guia completo de testes

**Credenciais de Teste:**
- Manager: `gestor1.teste@deapdi-test.local` / `Gestor@2025!`
- Employee: `colab1.teste@deapdi-test.local` / `Colab@2025!`
- HR: `rh.teste@deapdi-test.local` / `RH@2025!`

**Suporte:**
- Migration: `/workspace/supabase/migrations/20251029010000_add_rls_critical_tables.sql`
- Supabase Dashboard: https://supabase.com/dashboard/project/[PROJECT_ID]

---

## ⏱️ RESUMO DE TEMPO

| Etapa | Tempo |
|-------|-------|
| Validação SQL | 10 min |
| Testes na Interface | 10 min |
| Documentação | 5-10 min |
| **TOTAL** | **25-30 min** |

---

**🔒 LEMBRE-SE: Dados sensíveis são prioridade #1!**

**⚠️ NÃO pule etapas. Cada teste é crítico para compliance LGPD.**

---

_Última atualização: 2025-11-25_  
_Versão: 1.0_
