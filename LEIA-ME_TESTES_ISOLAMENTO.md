# 🔐 GUIA DE INÍCIO RÁPIDO - TESTES DE ISOLAMENTO DE DADOS

## 📚 DOCUMENTAÇÃO CRIADA

Foi preparada uma suíte completa de documentação para validação de isolamento de dados entre roles:

### 1️⃣ Este arquivo (LEIA-ME_TESTES_ISOLAMENTO.md)
**Você está aqui!** Guia de navegação e início rápido.

### 2️⃣ ISOLATION_TEST_SUMMARY.md
**Visão Geral Completa** - Leia primeiro para entender toda a estratégia de testes.

### 3️⃣ VALIDATE_USER_ISOLATION_QUERY.sql
**Script SQL** - Valida usuários de teste e isolamento no banco de dados.

### 4️⃣ MANUAL_USER_ISOLATION_TEST_GUIDE.md
**Guia Passo a Passo** (~60 páginas) - Instruções detalhadas para cada teste.

### 5️⃣ QUICK_ISOLATION_TEST_CHECKLIST.md
**Checklist Rápido** (1 página) - Referência rápida durante a execução.

### 6️⃣ USER_ISOLATION_TEST_RESULTS.md
**Template de Resultados** - Documente aqui os resultados dos testes.

---

## ⚡ INÍCIO RÁPIDO (3 Passos)

### PASSO 1: Verificar Usuários de Teste

**Execute no terminal OU no Supabase SQL Editor:**

```bash
# Opção A: Terminal
psql "postgresql://..." -f VALIDATE_USER_ISOLATION_QUERY.sql

# Opção B: Supabase SQL Editor
# Copie o conteúdo de VALIDATE_USER_ISOLATION_QUERY.sql
# Cole no SQL Editor do Supabase
# Clique em "Run"
```

**Esperado:** Você deve ver pelo menos 1 usuário de cada role:
- ✅ 1 employee (ex: carlos@example.com ou colab1.teste@deapdi-test.local)
- ✅ 1 manager (ex: gabriela@example.com ou gestor1.teste@deapdi-test.local)
- ✅ 1 hr (ex: rita@example.com ou rh.teste@deapdi-test.local)
- ✅ 1 admin (ex: lucas@example.com ou admin.teste@deapdi-test.local)

**❌ Se não tiver usuários:**
- Consulte: `TEST_USERS_SETUP_GUIDE.md`
- Crie os usuários necessários
- Volte para o Passo 1

---

### PASSO 2: Iniciar Servidor

```bash
npm run dev
```

**Aguarde até ver:**
```
➜  Local:   http://localhost:5173/
```

---

### PASSO 3: Executar Testes

**3.1 - Abra os 3 documentos lado a lado:**

1. **Tela 1:** `MANUAL_USER_ISOLATION_TEST_GUIDE.md` (guia detalhado)
2. **Tela 2:** `QUICK_ISOLATION_TEST_CHECKLIST.md` (checklist rápido)
3. **Tela 3:** `USER_ISOLATION_TEST_RESULTS.md` (para preencher)

**3.2 - Abra 4 navegadores/janelas:**

- **Navegador 1:** Login como Employee
- **Navegador 2:** Login como Manager
- **Navegador 3:** Login como HR
- **Navegador 4:** Login como Admin

**3.3 - Execute os testes:**

Siga o `MANUAL_USER_ISOLATION_TEST_GUIDE.md` passo a passo, marcando no `QUICK_ISOLATION_TEST_CHECKLIST.md` e documentando resultados no `USER_ISOLATION_TEST_RESULTS.md`.

---

## 🎯 FLUXO DE TRABALHO

```
┌─────────────────────────────────────────────┐
│  1. PREPARAÇÃO (10 min)                     │
│  ✅ Executar VALIDATE_USER_ISOLATION_QUERY  │
│  ✅ Verificar usuários existem              │
│  ✅ Anotar credenciais                      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  2. SETUP (5 min)                           │
│  ✅ npm run dev                             │
│  ✅ Abrir 4 navegadores                     │
│  ✅ Fazer 4 logins simultâneos              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  3. TESTES (45-60 min)                      │
│  ✅ Employee (10 min)                       │
│  ✅ Manager (15 min) ⚠️ MAIS CRÍTICO        │
│  ✅ HR (10 min)                             │
│  ✅ Admin (5 min)                           │
│  ✅ Testes Cruzados (10 min)                │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  4. DOCUMENTAÇÃO (15 min)                   │
│  ✅ Preencher USER_ISOLATION_TEST_RESULTS   │
│  ✅ Capturar screenshots de problemas       │
│  ✅ Listar vulnerabilidades                 │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  5. DECISÃO                                 │
│  ✅ APROVADO                                │
│  ⚠️ APROVADO COM RESSALVAS                  │
│  ❌ REPROVADO (corrigir urgente)            │
└─────────────────────────────────────────────┘
```

**TEMPO TOTAL:** ~1h30min

---

## 🚨 TESTES MAIS CRÍTICOS

### ⚠️ PRIORIDADE #1: Manager NÃO deve ver check-ins de subordinados

**Por quê?** Violação GRAVE de privacidade. Dados psicológicos são confidenciais.

**Como testar:**
1. Login como manager
2. Navegar: `Saúde Mental` → `Check-ins`
3. **ESPERADO:** NÃO mostrar subordinados
4. Copiar URL de check-in de subordinado (obtida do HR)
5. Colar no navegador do manager
6. **ESPERADO:** Erro 403 ou bloqueio

**Se falhar:** 🚨 **BLOQUEAR DEPLOY IMEDIATAMENTE**

---

### ⚠️ PRIORIDADE #2: Employee NÃO deve ver dados de colegas

**Por quê?** Vazamento de dados pessoais e profissionais.

**Como testar:**
1. Login como employee
2. Navegar: `Desenvolvimento` → `PDIs`
3. **ESPERADO:** Ver apenas PDIs próprios
4. Copiar URL de PDI de outro employee
5. Colar no navegador
6. **ESPERADO:** Erro 403 ou bloqueio

**Se falhar:** 🚨 **VULNERABILIDADE CRÍTICA**

---

### ⚠️ PRIORIDADE #3: APIs não devem retornar dados extras

**Por quê?** Mesmo que UI não mostre, dados podem ser extraídos.

**Como testar:**
1. Abrir DevTools (F12) → Network
2. Fazer requisições (listar PDIs, check-ins, etc.)
3. Inspecionar JSON das respostas
4. **ESPERADO:** Apenas dados autorizados

**Se falhar:** 🔧 **CORRIGIR BACKEND**

---

## 📊 CREDENCIAIS DOS USUÁRIOS DE TESTE

### Domínio @deapdi-test.local (RECOMENDADO)

| Role | Email | Senha |
|------|-------|-------|
| Employee | colab1.teste@deapdi-test.local | `Colab@2025!` |
| Manager | gestor1.teste@deapdi-test.local | `Gestor@2025!` |
| HR | rh.teste@deapdi-test.local | `RH@2025!` |
| Admin | admin.teste@deapdi-test.local | `Admin@2025!` |

### Domínio @example.com (Alternativo)

| Role | Email | Senha |
|------|-------|-------|
| Employee | carlos@example.com | (verificar no banco) |
| Manager | gabriela@example.com | (verificar no banco) |
| HR | rita@example.com | (verificar no banco) |
| Admin | lucas@example.com | (verificar no banco) |

**💡 Dica:** Se não souber as senhas do @example.com, use @deapdi-test.local.

---

## 📖 COMO NAVEGAR NA DOCUMENTAÇÃO

### Se você é...

#### 👤 TESTADOR NOVATO
**Comece por:**
1. ✅ `ISOLATION_TEST_SUMMARY.md` (visão geral)
2. ✅ `MANUAL_USER_ISOLATION_TEST_GUIDE.md` (guia detalhado)
3. ✅ Siga passo a passo, sem pular etapas

#### 👤 TESTADOR EXPERIENTE
**Comece por:**
1. ✅ `QUICK_ISOLATION_TEST_CHECKLIST.md` (checklist rápido)
2. ✅ Consulte `MANUAL_USER_ISOLATION_TEST_GUIDE.md` se tiver dúvidas
3. ✅ Documente em `USER_ISOLATION_TEST_RESULTS.md`

#### 👤 DESENVOLVEDOR (CORRIGINDO BUG)
**Veja:**
1. ✅ `USER_ISOLATION_TEST_RESULTS.md` (vulnerabilidades encontradas)
2. ✅ `VALIDATE_USER_ISOLATION_QUERY.sql` (validações SQL)
3. ✅ Seção de "Vulnerabilidades" no guide

#### 👤 GESTOR/PRODUCT OWNER
**Veja:**
1. ✅ `ISOLATION_TEST_SUMMARY.md` (visão geral estratégica)
2. ✅ `USER_ISOLATION_TEST_RESULTS.md` (após testes, ver conclusão)
3. ✅ Seção "Resumo Executivo" e "Recomendações"

---

## ✅ CHECKLIST DE PRÉ-REQUISITOS

Antes de começar, certifique-se que tem:

- [ ] Acesso ao banco de dados (Supabase ou PostgreSQL)
- [ ] Node.js e npm instalados
- [ ] Projeto clonado e dependências instaladas (`npm install`)
- [ ] Pelo menos 2 navegadores diferentes instalados
- [ ] 1-2 horas disponíveis para execução completa
- [ ] Permissão para criar issues se encontrar bugs
- [ ] Contato do time de dev (caso encontre problemas críticos)

---

## 🆘 TROUBLESHOOTING

### Problema: "Usuários de teste não existem"
**Solução:**
1. Consulte `TEST_USERS_SETUP_GUIDE.md`
2. Crie os usuários via Supabase Dashboard
3. Execute o script de seed se disponível
4. Volte para o Passo 1

---

### Problema: "Não sei qual senha dos usuários @example.com"
**Solução:**
1. Use usuários @deapdi-test.local (senhas documentadas)
2. OU redefina senha no Supabase Dashboard → Auth → Users
3. OU crie novos usuários conforme `TEST_USERS_SETUP_GUIDE.md`

---

### Problema: "npm run dev não inicia"
**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev

# Se ainda falhar, verificar .env
# Consultar SETUP_INSTRUCTIONS.md
```

---

### Problema: "Login não funciona"
**Solução:**
1. Verificar email confirmado no Supabase Dashboard
2. Verificar RLS da tabela `profiles`
3. Verificar se JWT está sincronizado
4. Tentar reset de senha

---

### Problema: "Encontrei vulnerabilidade crítica, e agora?"
**Ação:**
1. 🚨 DOCUMENTAR IMEDIATAMENTE em `USER_ISOLATION_TEST_RESULTS.md`
2. 🚨 Capturar screenshot
3. 🚨 Marcar como CRÍTICA
4. 🚨 Notificar time de desenvolvimento
5. 🚨 BLOQUEAR deploy se for para produção
6. 🔧 Aguardar correção e revalidar

---

## 📞 SUPORTE E REFERÊNCIAS

### Documentação Adicional do Projeto

- `TEST_USERS_SETUP_GUIDE.md` - Criação de usuários
- `SETUP_INSTRUCTIONS.md` - Setup inicial do projeto
- `TEST_USERS_QUICK_START.md` - Guia rápido de usuários
- `RLS_VALIDATION_SCRIPT.sql` - Validação de políticas RLS

### Links Úteis

- Supabase Dashboard: https://supabase.com/dashboard/project/[PROJECT_ID]
- Documentação RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## 🎯 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

### Se APROVADO ✅
1. ✅ Marcar milestone de segurança como concluída
2. ✅ Arquivar documentação dos testes
3. ✅ Seguir para testes de performance
4. ✅ Deploy para staging/produção

### Se REPROVADO ❌
1. 🚨 Bloquear deploy
2. 🔧 Corrigir vulnerabilidades (ordem de prioridade)
3. ✅ Revalidar 100% após correções
4. ✅ Considerar audit de segurança externo

---

## 📊 MATRIZ RÁPIDA DE DECISÃO

| Situação | Ação |
|----------|------|
| Nenhuma vulnerabilidade | ✅ **APROVADO** - Seguir em frente |
| Vulnerabilidades baixas/médias | ⚠️ **APROVAR COM RESSALVAS** - Criar issues |
| Manager vê check-ins de subordinados | 🚨 **REPROVADO** - Bloquear deploy |
| Employee vê dados de outros | 🚨 **REPROVADO** - Bloquear deploy |
| APIs retornam dados extras | 🚨 **REPROVADO** - Corrigir backend |
| Escalação de privilégios possível | 🚨 **REPROVADO** - Problema gravíssimo |

---

## 🔥 RESUMO EXECUTIVO

### O que foi criado?
✅ 6 arquivos de documentação completa para testes de isolamento de dados

### Quanto tempo leva?
⏱️ ~1h30min (preparação + execução + documentação)

### Qual o foco principal?
🎯 Garantir que cada role (employee, manager, hr, admin) só vê dados autorizados

### Qual o teste mais crítico?
⚠️ Verificar que **manager NÃO vê check-ins emocionais de subordinados**

### O que fazer se encontrar bugs?
📝 Documentar em `USER_ISOLATION_TEST_RESULTS.md` e notificar time

### Posso modificar código durante testes?
❌ **NÃO!** Apenas observar e documentar comportamentos

---

## ✅ COMEÇAR AGORA

**Você está pronto para começar!**

1. ✅ Execute: `psql "..." -f VALIDATE_USER_ISOLATION_QUERY.sql`
2. ✅ Execute: `npm run dev`
3. ✅ Abra: `MANUAL_USER_ISOLATION_TEST_GUIDE.md`
4. ✅ Siga o guia passo a passo
5. ✅ Documente tudo em `USER_ISOLATION_TEST_RESULTS.md`

---

**🔒 BOA SORTE COM OS TESTES!**

**📝 LEMBRE-SE: Segurança é prioridade máxima. Não pule etapas!**

---

_Última atualização: 2025-11-25_  
_Versão da documentação: 1.0_
