# 📚 Documentação - Usuários DeaDesign
## DEAPDI TalentFlow - Guia de Navegação

---

## 🗂️ ARQUIVOS ATUALIZADOS

Este conjunto de documentação contém **os dados reais da equipe DeaDesign** para o sistema DEAPDI TalentFlow.

---

### 1️⃣ `TEST_USERS_QUICK_START.md` ⚡

**📄 Tipo:** Guia de Execução Rápida  
**⏱️ Tempo:** 5 minutos  
**🎯 Objetivo:** Validar usuários e executar script SQL

**O que contém:**
- Lista completa dos 10 usuários DeaDesign
- UUIDs confirmados
- Hierarquia organizacional
- 2 queries de validação
- Teste de login rápido

**Use para:** Executar rapidamente após criar usuários no Auth

---

### 2️⃣ `TEST_USERS_SEED_SCRIPT.sql` 📝

**📄 Tipo:** Script SQL Principal  
**⏱️ Tempo de execução:** 2-5 segundos  
**🎯 Objetivo:** Inserir dados reais da DeaDesign no banco

**O que contém:**
- 10 profiles com UUIDs reais
- 3 teams (Gestão, Design, Projetos)
- Hierarquia organizacional completa
- Queries de validação incluídas
- ON CONFLICT para segurança

**Como usar:**
1. Abra o arquivo no editor
2. Copie todo o conteúdo
3. Acesse SQL Editor do Supabase
4. Cole e execute

---

### 3️⃣ Fixtures Cypress

**📄 Tipo:** Dados de teste para E2E  
**🎯 Objetivo:** Testes automatizados

Arquivos atualizados:
- `cypress/fixtures/hr/profiles.json` - 10 usuários reais

---

## 👥 EQUIPE DEADESIGN

### Estrutura Organizacional Real

```
DeaDesign (10 pessoas)
│
├── 🏢 GESTÃO (2 pessoas)
│   ├── Ana Paula Nemoto (Diretora/Admin) ⭐
│   │   └── Maria Eduarda Ramos (Analista Jr)
│   └── Alexia Sobreira (Gerente RH) 💚
│
├── 🎨 DESIGN (2 pessoas)
│   ├── Nathalia Fujii (Gerente) ⭐
│   │   └── Roberto Fagaraz (Desenvolvedor Sr)
│
└── 📋 PROJETOS (5 pessoas)
    ├── Silvia Kanayama (Gerente) ⭐
    │   ├── Pedro Oliveira (GP Jr)
    │   ├── Lucila Muranaka (Analista Sr)
    │   ├── Julia Rissin (Designer Pleno)
    │   └── Juliana Hobo (Designer Sr)

Legenda:
⭐ Gestor/Admin
💚 RH
```

---

## 🔐 CREDENCIAIS

**Domínio:** @deadesign.com.br  
**Senha padrão:** DEA@pdi  
**Total:** 10 usuários

### Lista Completa

| # | Nome | Email | Cargo |
|---|------|-------|-------|
| 1 | Ana Paula Nemoto | anapaula@ | Diretora Executiva |
| 2 | Alexia Sobreira | alexia@ | Gerente de RH |
| 3 | Nathalia Fujii | nathalia@ | Gerente de Design |
| 4 | Silvia Kanayama | silvia@ | Gerente de Projetos |
| 5 | Maria Eduarda Ramos | mariaeduarda@ | Analista Jr |
| 6 | Julia Rissin | julia@ | Designer Pleno |
| 7 | Juliana Hobo | juliana@ | Designer Sr |
| 8 | Pedro Oliveira | pedro@ | GP Jr |
| 9 | Lucila Muranaka | lucila@ | Analista Sr |
| 10 | Roberto Fagaraz | roberto@ | Desenvolvedor Sr |

---

## 🚀 FLUXO DE EXECUÇÃO RÁPIDA

```
1. VERIFICAR USUÁRIOS NO AUTH ✅
   └─> Todos já criados com UUIDs confirmados
   └─> Tempo: 0 min (já feito)

2. EXECUTAR SCRIPT SQL ⚡
   └─> Copiar TEST_USERS_SEED_SCRIPT.sql
   └─> Colar no SQL Editor
   └─> Executar
   └─> Tempo: 2-5 segundos

3. VALIDAR DADOS ✅
   └─> Query 1: Verificar 10 usuários
   └─> Query 2: Verificar hierarquia
   └─> Tempo: 2 minutos

4. TESTAR LOGIN 🎭
   └─> Ana Paula (admin)
   └─> Silvia (gestora)
   └─> Julia (colaboradora)
   └─> Tempo: 3 minutos

✅ TOTAL: ~7 minutos
```

---

## 📊 DADOS CRIADOS

### Quantitativo

- ✅ **10 profiles** (todos com UUIDs reais)
- ✅ **3 teams** (Gestão, Design, Projetos)
- ✅ **3 gestoras** (Ana Paula, Nathalia, Silvia)
- ✅ **6 colaboradores** distribuídos nas equipes
- ✅ **Hierarquia completa** configurada

### Hierarquia Validada

**Ana Paula (Admin):**
- Reporta: Maria Eduarda (1 pessoa)

**Nathalia (Gestora Design):**
- Reporta: Roberto (1 pessoa)

**Silvia (Gestora Projetos):**
- Reporta: Pedro, Lucila, Julia, Juliana (4 pessoas)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Pré-requisitos
- [x] 10 usuários criados no Auth
- [x] UUIDs coletados e confirmados
- [x] Acesso ao SQL Editor

### Execução
- [ ] Script SQL executado sem erros
- [ ] Query 1: 10 usuários confirmados
- [ ] Query 2: Hierarquia correta
- [ ] Login Ana Paula funciona
- [ ] Login Silvia funciona  
- [ ] Login Julia funciona

### Resultado Esperado
- [ ] Todos fazem login com DEA@pdi
- [ ] Gestoras veem suas equipes
- [ ] Colaboradores veem seus gestores
- [ ] Dashboards carregam corretamente

---

## 🎯 CASOS DE USO

### 1. Admin (Ana Paula)
**Login:** anapaula@deadesign.com.br / DEA@pdi

**Deve ver:**
- Dashboard completo
- Todos os 10 usuários
- Estatísticas globais
- Acesso total ao sistema

---

### 2. RH (Alexia)
**Login:** alexia@deadesign.com.br / DEA@pdi

**Deve ver:**
- Módulo de RH
- Saúde mental da equipe
- Todos os profiles
- Relatórios de desenvolvimento

---

### 3. Gestora (Silvia)
**Login:** silvia@deadesign.com.br / DEA@pdi

**Deve ver:**
- Sua equipe (4 pessoas)
- PDIs para validar (quando criados)
- Competências para avaliar
- Dashboard da equipe

---

### 4. Colaboradora (Julia)
**Login:** julia@deadesign.com.br / DEA@pdi

**Deve ver:**
- Seu perfil próprio
- Silvia como gestora
- Seus PDIs e competências
- Seus grupos de ação

---

## 📋 PRÓXIMOS PASSOS

Após validar a estrutura base:

1. **Adicionar Competências** (opcional)
   - Habilidades de cada pessoa
   - Avaliações gestor + auto

2. **Criar PDIs** (opcional)
   - Planos de desenvolvimento
   - Tarefas e objetivos

3. **Configurar Mentorias** (opcional)
   - Ex: Juliana mentorando Julia
   - Roberto mentorando Pedro

4. **Adicionar Grupos de Ação** (opcional)
   - Projetos reais da DeaDesign
   - Tarefas colaborativas

5. **Ativar Check-ins** (opcional)
   - Saúde mental da equipe
   - Alertas para RH

---

## 🔗 LINKS ÚTEIS

- **Dashboard:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr
- **SQL Editor:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/sql
- **Auth Users:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users

---

## 🎉 STATUS

**✅ COMPLETO E PRONTO PARA USO**

**O que foi feito:**
- ✅ Dados reais da DeaDesign
- ✅ UUIDs confirmados
- ✅ Script SQL pronto
- ✅ Hierarquia correta
- ✅ Fixtures atualizados

**O que fazer agora:**
1. Abra `TEST_USERS_QUICK_START.md`
2. Execute o script SQL
3. Valide com as queries
4. Teste login com 3+ usuários

---

**📅 Atualizado:** 2025-10-22  
**✍️ Versão:** 3.0 - DeaDesign Real Data  
**🏢 Empresa:** DeaDesign  
**🎯 Status:** ✅ Pronto para executar

---

**🚀 Comece agora abrindo TEST_USERS_QUICK_START.md!**
