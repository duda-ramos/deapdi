# 🚀 Script Rápido de Testes Manuais - TalentFlow

## ⏱️ Tempo Estimado: 15 minutos

Este documento fornece um script passo a passo para executar testes manuais focados nas áreas críticas do sistema.

---

## 📋 PRÉ-REQUISITOS

- [ ] Servidor de desenvolvimento rodando
- [ ] Banco de dados com usuários de teste
- [ ] Navegador com DevTools aberto (F12)
- [ ] Usuários disponíveis (ver TEST_USERS_README.md)

### Iniciar Servidor:
```bash
cd /workspace
npm run dev
```

Aguarde a mensagem: `Local: http://localhost:5173/`

---

## 🧪 TESTE 1: LOGIN E LOGOUT (3 min)

### 1.1 Login com Colaborador
```
URL: http://localhost:5173
Email: julia@deadesign.com.br
Senha: DEA@pdi
```

**Passos:**
1. Inserir credenciais
2. Clicar em "Entrar"
3. ✅ **Verificar:** Redirecionamento para /dashboard
4. ✅ **Verificar:** Nome "Julia Rissin" no header
5. ✅ **Verificar:** Console sem erros

**Console Esperado:**
```
✅ 🔐 AuthService: Starting signin process
✅ 🔐 AuthService: Signin successful
✅ 🔐 Auth: User signed in
```

### 1.2 Persistência de Sessão
1. Pressionar F5 (recarregar página)
2. ✅ **Verificar:** Usuário continua logado
3. ✅ **Verificar:** Dashboard carrega normalmente

### 1.3 Logout
1. Clicar no botão "Sair" no header
2. ✅ **Verificar:** Redirecionamento para /login
3. ✅ **Verificar:** Console mostra "🔐 Auth: Signing out"
4. Tentar acessar http://localhost:5173/dashboard
5. ✅ **Verificar:** Redirecionamento automático para /login

**✅ TESTE 1 COMPLETO**

---

## 🧪 TESTE 2: INPUT FOCUS - BUG CRÍTICO (3 min)

### 2.1 Login Novamente
```
Email: julia@deadesign.com.br
Senha: DEA@pdi
```

### 2.2 Testar Campo de Bio no Perfil
1. Navegar para: `/profile`
2. Clicar no campo "Bio" ou "Sobre mim"
3. **Digitar rapidamente (sem parar):**
   ```
   Esta é minha biografia profissional com várias palavras e espaços múltiplos
   ```
4. ✅ **Verificar:** TODAS as palavras aparecem
5. ✅ **Verificar:** Campo NÃO perde foco após cada caractere
6. ✅ **Verificar:** Espaços são preservados

### 2.3 Testar em Campo de Descrição (PDI)
1. Navegar para: `/pdi`
2. Clicar em "Novo PDI" ou similar
3. No campo "Descrição", digitar rapidamente:
   ```
   Desenvolver habilidades técnicas avançadas em React, TypeScript e Node.js
   ```
4. ✅ **Verificar:** Digitação fluida sem interrupções
5. ✅ **Verificar:** Foco mantido durante toda a digitação

### 2.4 Testar Espaços Múltiplos
1. No mesmo campo, digitar:
   ```
   Teste    com    múltiplos    espaços
   ```
2. ✅ **Verificar:** Espaços preservados durante digitação
3. ⚠️ **Nota:** Espaços serão normalizados apenas no submit (comportamento esperado)

**✅ TESTE 2 COMPLETO - BUG RESOLVIDO**

---

## 🧪 TESTE 3: CRIAÇÃO DE TAREFAS - EMPLOYEE (3 min)

### 3.1 Navegar para Grupos de Ação
```
URL: /action-groups
```

### 3.2 Abrir um Grupo Existente
1. Clicar em um grupo onde Julia é participante
2. ✅ **Verificar:** Grupo abre corretamente
3. ✅ **Verificar:** Lista de tarefas é exibida

### 3.3 Criar Nova Tarefa
1. Clicar em "Adicionar Tarefa" ou "Nova Tarefa"
2. Preencher formulário:
   - **Título:** "Revisar documentação do projeto"
   - **Descrição:** "Atualizar README e documentação técnica"
   - **Assignee:** Selecionar outro participante do grupo
   - **Deadline:** Selecionar data futura (ex: 31/12/2025)
3. ✅ **Verificar:** Campos de texto não perdem foco durante digitação
4. Clicar em "Salvar" ou "Criar"
5. ✅ **Verificar:** Tarefa criada com sucesso
6. ✅ **Verificar:** Tarefa aparece na lista
7. ✅ **Verificar:** Console sem erros

**Console Esperado:**
```
✅ 📝 ActionGroups: Creating task
✅ Task created successfully
```

**❌ Se falhar, verificar:**
- Console mostra erro de RLS?
- Migration `20251029000000_fix_task_creation_rls.sql` foi aplicada?

**✅ TESTE 3 COMPLETO**

---

## 🧪 TESTE 4: CRIAÇÃO DE TAREFAS - MANAGER (3 min)

### 4.1 Logout e Login como Gestor
```
Email: silvia@deadesign.com.br
Senha: DEA@pdi
```

### 4.2 Navegar para Grupos de Ação
```
URL: /action-groups
```

### 4.3 Abrir Grupo como Líder
1. Clicar em um grupo onde Silvia é líder
2. ✅ **Verificar:** Grupo abre

### 4.4 Criar Múltiplas Tarefas
**Tarefa 1:**
- Título: "Planejar sprint"
- Assignee: Pedro Oliveira
- Deadline: Data futura
- Clicar em "Criar"
- ✅ **Verificar:** Tarefa 1 criada

**Tarefa 2:**
- Título: "Revisar código"
- Assignee: Lucila Muranaka
- Deadline: Data futura
- Clicar em "Criar"
- ✅ **Verificar:** Tarefa 2 criada

**Tarefa 3:**
- Título: "Atualizar design"
- Assignee: Julia Rissin
- Deadline: Data futura
- Clicar em "Criar"
- ✅ **Verificar:** Tarefa 3 criada

### 4.5 Editar Tarefa (Apenas Líder)
1. Clicar em "Editar" em uma das tarefas
2. Alterar título para: "Planejar sprint Q4"
3. Salvar
4. ✅ **Verificar:** Edição bem-sucedida

### 4.6 Deletar Tarefa (Apenas Líder)
1. Clicar em "Deletar" em uma tarefa de teste
2. Confirmar exclusão
3. ✅ **Verificar:** Tarefa removida da lista

**✅ TESTE 4 COMPLETO**

---

## 🧪 TESTE 5: MENTORIA (2 min)

### 5.1 Login como Colaborador
```
Email: julia@deadesign.com.br
Senha: DEA@pdi
```

### 5.2 Solicitar Mentoria
1. Navegar para: `/mentorship`
2. Clicar em "Solicitar Mentoria" ou "Nova Solicitação"
3. Selecionar mentor: Juliana Hobo (ou outro disponível)
4. No campo "Mensagem", digitar:
   ```
   Gostaria de desenvolver minhas habilidades em liderança e gestão de projetos
   ```
5. ✅ **Verificar:** Digitação fluida sem perder foco
6. Clicar em "Enviar Solicitação"
7. ✅ **Verificar:** Solicitação enviada
8. ✅ **Verificar:** Modal fecha automaticamente

**✅ TESTE 5 COMPLETO**

---

## 🧪 TESTE 6: PDI COM MÚLTIPLAS TAREFAS (3 min)

### 6.1 Criar PDI
1. Navegar para: `/pdi`
2. Clicar em "Novo PDI"
3. Preencher:
   - **Título:** "Desenvolvimento em React Avançado"
   - **Descrição:** "Aprofundar conhecimentos em React, TypeScript e arquitetura de componentes"
   - **Deadline:** 31/12/2025
   - **Mentor:** Selecionar Silvia Kanayama
4. ✅ **Verificar:** Campos não perdem foco
5. Clicar em "Criar PDI"
6. ✅ **Verificar:** PDI criado com sucesso

### 6.2 Criar Action Group Vinculado
1. Navegar para: `/action-groups`
2. Clicar em "Novo Grupo"
3. Preencher:
   - **Título:** "Tarefas do PDI: React Avançado"
   - **Descrição:** "Grupo para organizar tarefas do PDI"
   - **PDI Vinculado:** Selecionar o PDI recém-criado
   - **Participantes:** Julia + Silvia
   - **Deadline:** 31/12/2025
4. Clicar em "Criar Grupo"
5. ✅ **Verificar:** Grupo criado e vinculado ao PDI

### 6.3 Adicionar Múltiplas Tarefas

**Tarefa 1:**
- Título: "Completar curso React Hooks"
- Descrição: "Estudar useState, useEffect, useContext, useReducer"
- Assignee: Julia Rissin (você)
- Deadline: 30/11/2025
- ✅ **Verificar:** Criada

**Tarefa 2:**
- Título: "Desenvolver projeto prático"
- Descrição: "Criar aplicação CRUD usando React + TypeScript"
- Assignee: Julia Rissin (você)
- Deadline: 15/12/2025
- ✅ **Verificar:** Criada

**Tarefa 3:**
- Título: "Code review com mentor"
- Descrição: "Revisão de código e boas práticas"
- Assignee: Silvia Kanayama
- Deadline: 20/12/2025
- ✅ **Verificar:** Criada

### 6.4 Verificar Vinculação
1. Voltar para `/pdi`
2. Abrir o PDI "Desenvolvimento em React Avançado"
3. ✅ **Verificar:** Grupo de ação aparece vinculado
4. ✅ **Verificar:** 3 tarefas listadas
5. ✅ **Verificar:** Progresso do PDI calculado corretamente

**✅ TESTE 6 COMPLETO**

---

## 📊 CHECKLIST FINAL

### Resultados Esperados:

| Teste | Descrição | Status |
|-------|-----------|--------|
| 1 | Login, persistência, logout | [ ] ✅ |
| 2 | Input focus - digitação fluida | [ ] ✅ |
| 3 | Criação de tarefas - Employee | [ ] ✅ |
| 4 | Criação de tarefas - Manager | [ ] ✅ |
| 5 | Formulário de mentoria | [ ] ✅ |
| 6 | PDI com múltiplas tarefas | [ ] ✅ |

### Console DevTools - Verificações:

Durante TODOS os testes, o console deve estar:
- ✅ **SEM** erros em vermelho
- ✅ **SEM** "Maximum update depth exceeded"
- ✅ **SEM** "Too many re-renders"
- ✅ **COM** logs de sucesso (🔐, ✅, 📝, etc.)

### Network Tab - Verificações:

1. Abrir DevTools > Network
2. Durante criação de tarefas:
   - ✅ Deve haver POST para `/rest/v1/tasks`
   - ✅ Status 201 (Created)
   - ✅ Response com dados da tarefa criada

---

## 🐛 TROUBLESHOOTING

### Problema: Tarefa não é criada (403 Forbidden)

**Solução:**
1. Verificar se migration RLS foi aplicada:
```sql
-- No SQL Editor do Supabase
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY cmd, policyname;
```

2. Deve aparecer:
```
tasks_group_participants_insert | INSERT
tasks_group_leaders_manage      | UPDATE
tasks_group_leaders_delete      | DELETE
```

3. Se não aparecer, executar:
```bash
cd /workspace
supabase db push
```

### Problema: Input perde foco após digitação

**Solução:**
1. Verificar se arquivos foram atualizados:
   - `src/utils/security.ts` (sem .trim() durante input)
   - `src/components/ui/Input.tsx` (com useCallback)
   - `src/components/ui/Textarea.tsx` (com useCallback)

2. Recarregar página completamente (Ctrl+Shift+R)

### Problema: Usuários de teste não existem

**Solução:**
1. Ver `TEST_USERS_README.md`
2. Criar usuários no Supabase Auth
3. Executar seed script no SQL Editor

---

## 📄 DOCUMENTAÇÃO RELACIONADA

- [MANUAL_VALIDATION_REPORT.md](./MANUAL_VALIDATION_REPORT.md) - Relatório completo de validação
- [BUG_FIX_SINGLE_CHARACTER_INPUT_FINAL.md](./BUG_FIX_SINGLE_CHARACTER_INPUT_FINAL.md) - Detalhes do bug de input
- [BUG3_SUMMARY.md](./BUG3_SUMMARY.md) - Bug de criação de tarefas
- [TEST_USERS_README.md](./TEST_USERS_README.md) - Usuários de teste

---

## ✅ CONCLUSÃO

Após completar todos os 6 testes:

**Se TODOS passaram:**
- ✅ Sistema está funcionando corretamente
- ✅ Bugs críticos foram resolvidos
- ✅ Pronto para deploy

**Se algum falhou:**
- ⚠️ Consultar seção de Troubleshooting
- ⚠️ Verificar migrations do banco
- ⚠️ Revisar console para erros específicos
- ⚠️ Consultar MANUAL_VALIDATION_REPORT.md

---

**Data:** 25 de Novembro de 2025  
**Versão:** 1.0  
**Tempo Total Estimado:** 15 minutos
