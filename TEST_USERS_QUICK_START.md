# ⚡ QUICK START - Criação de Usuários de Teste
## DEAPDI TalentFlow

> **Tempo estimado:** 40-50 minutos  
> **Dificuldade:** ⭐⭐ Intermediário  
> **Pré-requisitos:** Acesso ao Dashboard Supabase

---

## 🚀 EXECUÇÃO RÁPIDA (3 PASSOS)

### PASSO 1: Configurar Auth (2 min)

```
1. Acesse: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/settings
2. Navegue até: Authentication → Settings → Email
3. DESABILITE: "Enable email confirmations"
4. Salve
```

✅ **Pronto!** Agora você pode criar usuários com qualquer email.

---

### PASSO 2: Criar 10 Usuários (20 min)

**Dashboard:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users

Para cada usuário da tabela abaixo:
1. Clique em `Add user`
2. Copie Email e Password
3. Marque `Auto Confirm User`
4. Clique em `Create user`
5. **⚠️ COPIE O UUID GERADO**

| # | Email | Password | Nome | UUID (anotar aqui) |
|---|-------|----------|------|-------------------|
| 1 | admin.teste@deapdi-test.local | Admin@2025! | Alexandre Administrador | _________________ |
| 2 | rh.teste@deapdi-test.local | RH@2025! | Rita Recursos Humanos | _________________ |
| 3 | gestor1.teste@deapdi-test.local | Gestor@2025! | Gabriela Gestora Marketing | _________________ |
| 4 | gestor2.teste@deapdi-test.local | Gestor@2025! | Gustavo Gestor Vendas | _________________ |
| 5 | colab1.teste@deapdi-test.local | Colab@2025! | Carlos Colaborador | _________________ |
| 6 | colab2.teste@deapdi-test.local | Colab@2025! | Marina Colaboradora | _________________ |
| 7 | colab3.teste@deapdi-test.local | Colab@2025! | Pedro Colaborador | _________________ |
| 8 | colab4.teste@deapdi-test.local | Colab@2025! | Ana Colaboradora | _________________ |
| 9 | colab5.teste@deapdi-test.local | Colab@2025! | Bruno Colaborador | _________________ |
| 10 | colab6.teste@deapdi-test.local | Colab@2025! | Juliana Colaboradora | _________________ |

---

### PASSO 3: Executar Script SQL (15 min)

1. **Abra:** `TEST_USERS_SEED_SCRIPT.sql`

2. **Substitua** todos os UUIDs:
   - Use Find & Replace (Ctrl+H)
   - Procure: `UUID_ADMIN_AQUI`
   - Substitua: UUID real do passo 2
   - Repita para todos os 10 usuários

3. **Descomente** os blocos SQL (remover `/*` e `*/`)

4. **Execute no Supabase:**
   - Dashboard → SQL Editor
   - Cole o script
   - Clique em `Run`

---

## ✅ VALIDAÇÃO RÁPIDA

Execute estas 3 queries para confirmar que tudo funcionou:

### Query 1: Verificar Usuários

```sql
SELECT COUNT(*) as total FROM profiles;
-- Esperado: 10
```

### Query 2: Verificar PDIs

```sql
SELECT COUNT(*) as total FROM pdis;
-- Esperado: 12-18
```

### Query 3: Verificar Grupos

```sql
SELECT COUNT(*) as total FROM action_groups WHERE status = 'active';
-- Esperado: 2
```

**✅ Se as 3 queries retornaram valores esperados, sucesso!**

---

## 🎭 TESTE RÁPIDO DE LOGIN

Teste login com 3 usuários para confirmar:

| Usuário | Email | Senha | Deve Ver |
|---------|-------|-------|----------|
| Admin | admin.teste@deapdi-test.local | Admin@2025! | Dashboard geral, todos os dados |
| Gestor | gestor1.teste@deapdi-test.local | Gestor@2025! | Equipe de 3 pessoas, PDIs para validar |
| Colaborador | colab1.teste@deapdi-test.local | Colab@2025! | Seus PDIs, grupo Black Friday, mentoria |

---

## 📊 DADOS CRIADOS - RESUMO

```
ESTRUTURA:
├── 10 Usuários
│   ├── 1 Admin
│   ├── 1 RH
│   ├── 2 Gestores (Marketing + Vendas)
│   └── 6 Colaboradores
│
├── 2 Departamentos
│   ├── Marketing (Gabriela + 3 colaboradores)
│   └── Vendas (Gustavo + 3 colaboradores)
│
├── 12-18 PDIs
│   ├── 1-2 por colaborador
│   └── Mix: em andamento, concluídos, validados
│
├── 18-30 Competências Avaliadas
│   ├── 3-5 por colaborador
│   └── Autoavaliação + avaliação do gestor
│
├── 2 Grupos de Ação
│   ├── Campanha Black Friday (Marketing - 5 tarefas)
│   └── Treinamento CRM (Vendas - 4 tarefas)
│
├── 4-6 Mentorias
│   ├── 2 ativas (com sessões)
│   └── 2 pendentes
│
├── 6-12 Check-ins Saúde Mental
│   ├── 1 recente por colaborador
│   └── Variação de scores (identificar Ana com estresse alto)
│
└── 15-20 Notificações
    ├── Mix de lidas e não lidas
    └── Tipos variados (sucesso, info, warning)
```

---

## 🎯 CASOS DE USO PARA TESTAR

### ✅ Fluxo 1: PDI (5 min)

1. Login como **Carlos** (colab1.teste@...)
2. Ver PDI "Dominar Google Analytics 4"
3. Marcar tarefa como concluída
4. Logout

5. Login como **Gabriela** (gestor1.teste@...)
6. Ver notificação de PDI atualizado
7. Validar PDI de Carlos
8. Verificar pontos atribuídos

### ✅ Fluxo 2: Mentoria (5 min)

1. Login como **Pedro** (colab3.teste@...)
2. Ver Carlos como mentorado
3. Ver 2 sessões realizadas
4. Agendar próxima sessão

5. Login como **Carlos**
6. Ver notificação de sessão agendada
7. Ver histórico de mentorias

### ✅ Fluxo 3: Grupo de Ação (5 min)

1. Login como **Gabriela**
2. Ver grupo "Campanha Black Friday"
3. Ver 4 participantes
4. Ver tarefas (2 concluídas, 2 em andamento, 1 pendente)
5. Atribuir nova tarefa para Marina

6. Login como **Marina** (colab2.teste@...)
7. Ver notificação de nova tarefa
8. Ver grupo com tarefa atribuída

### ✅ Fluxo 4: Saúde Mental (5 min)

1. Login como **Rita** (rh.teste@...)
2. Ver dashboard de saúde mental
3. Ver alerta de **Ana** (estresse 7/10)
4. Ver solicitações de sessão de psicologia (2 pendentes)
5. Atribuir sessão para Ana

6. Login como **Ana** (colab4.teste@...)
7. Ver notificação de sessão agendada
8. Fazer novo check-in emocional

---

## 📋 CHECKLIST COMPLETO

### Configuração

- [ ] Auth configurado (email confirmation desabilitada)
- [ ] Dashboard Supabase acessível
- [ ] SQL Editor disponível

### Criação de Usuários

- [ ] 10 usuários criados no Auth
- [ ] 10 UUIDs copiados e anotados
- [ ] Todos os emails únicos e válidos

### Execução do Script

- [ ] Script SQL editado com UUIDs reais
- [ ] Blocos descomentados
- [ ] Script executado sem erros
- [ ] Teams criados (4 departamentos)
- [ ] Profiles criados (10 usuários)
- [ ] Competências inseridas (18-30)
- [ ] PDIs inseridos (12-18)
- [ ] Grupos de ação criados (2)
- [ ] Mentorias inseridas (4-6)
- [ ] Check-ins inseridos (6-12)
- [ ] Notificações criadas (15-20)

### Validação

- [ ] Query 1: 10 usuários confirmados
- [ ] Query 2: 12-18 PDIs confirmados
- [ ] Query 3: 2 grupos ativos confirmados
- [ ] Login Admin funcionando
- [ ] Login Gestor funcionando
- [ ] Login Colaborador funcionando

### Testes Funcionais

- [ ] Fluxo de PDI testado
- [ ] Fluxo de Mentoria testado
- [ ] Fluxo de Grupo de Ação testado
- [ ] Fluxo de Saúde Mental testado

---

## 🚨 PROBLEMAS COMUNS

### "Email already registered"

**Causa:** Usuário já existe  
**Solução:** Delete o usuário existente no Dashboard Auth

---

### "Foreign key violation"

**Causa:** UUID de gestor não encontrado  
**Solução:** Verifique se criou gestores antes dos colaboradores

---

### "Check constraint violation"

**Causa:** Valor inválido (ex: rating > 5)  
**Solução:** Revise os valores inseridos nas competências

---

### Notificações não aparecem

**Causa:** RLS bloqueando  
**Solução:** Verifique se `profile_id` está correto

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para detalhes completos, consulte:

1. **`TEST_USERS_SETUP_GUIDE.md`** - Guia completo passo a passo
2. **`TEST_USERS_SEED_SCRIPT.sql`** - Script SQL com todos os dados
3. **`TEST_VALIDATION_QUERIES.sql`** - 18 queries de validação

---

## ⏱️ CRONOGRAMA SUGERIDO

| Horário | Atividade | Duração |
|---------|-----------|---------|
| 00:00 | Configurar Auth | 2 min |
| 00:02 | Criar 10 usuários no Dashboard | 20 min |
| 00:22 | Copiar e organizar UUIDs | 5 min |
| 00:27 | Editar script SQL | 10 min |
| 00:37 | Executar script SQL | 2 min |
| 00:39 | Validar com queries | 5 min |
| 00:44 | Testar login (3 usuários) | 5 min |
| 00:49 | ✅ **COMPLETO!** | |

---

## 🎉 SUCESSO!

Se você chegou até aqui e todos os checkboxes estão marcados:

✅ **Parabéns!** Seu ambiente de teste está pronto para validação end-to-end.

### Próximos Passos:

1. Executar testes E2E automatizados (Cypress)
2. Realizar UAT (User Acceptance Testing)
3. Documentar bugs encontrados
4. Preparar para produção

---

**Criado em:** 2025-10-22  
**Versão:** 1.0  
**Suporte:** Consulte documentação completa em `TEST_USERS_SETUP_GUIDE.md`

---

## 📞 SUPORTE RÁPIDO

**Dúvidas frequentes:**

- ❓ Esqueci o UUID de um usuário → Acesse Dashboard Auth e copie novamente
- ❓ Script SQL deu erro → Verifique Query 17 (integridade) para identificar
- ❓ Não consigo fazer login → Verifique se email está confirmado no Auth
- ❓ Dashboard vazio após login → Execute queries de validação para verificar dados

---

**🚀 Bons testes!**
