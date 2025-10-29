# ✅ CHECKLIST DE VALIDAÇÃO - BUG #1: GESTÃO DE PESSOAS

## 🎯 Objetivo
Validar que a correção do bug na página de Gestão de Pessoas funciona corretamente.

## 📋 Pré-requisitos
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Banco de dados populado com dados de teste
- [ ] Pelo menos 10+ usuários no sistema
- [ ] Usuários com diferentes roles: Admin, RH, Manager, Employee
- [ ] DevTools do navegador aberto (Console + Network)

---

## 🧪 TESTE 1: Login como ADMIN

### Setup
```bash
Email: admin@test.com (ou similar)
Role: admin
```

### Passos
1. [ ] Fazer login como Admin
2. [ ] Navegar para `/people-management`
3. [ ] Aguardar carregamento da página

### ✅ Resultados Esperados
- [ ] Página carrega em **< 3 segundos**
- [ ] Lista de usuários é exibida corretamente
- [ ] Todos os usuários são visíveis
- [ ] Estatísticas no topo são exibidas (Total, Ativos, Gestores, etc.)
- [ ] Filtros funcionam sem delay
- [ ] Botão "Novo Colaborador" está visível

### 📊 Console (DevTools)
```
Deve aparecer:
✅ 🔄 PeopleManagement: Loading data... { userRole: 'admin', filterType: 'all' }
✅ 📊 PeopleManagement: Fetching all profiles (Admin/HR)
✅ 📊 PeopleManagement: Fetching teams and managers...
✅ ✅ PeopleManagement: Data loaded successfully { profiles: X, teams: Y, managers: Z }

NÃO deve aparecer:
❌ ⚠️ Already loading, skipping duplicate call (mais de 1 vez)
❌ Maximum update depth exceeded
❌ Too many re-renders
❌ Qualquer erro em vermelho
```

### 📡 Network (DevTools)
```
Deve aparecer apenas 3 chamadas:
✅ POST /rest/v1/rpc/... (getProfiles)
✅ POST /rest/v1/rpc/... (getTeams)
✅ POST /rest/v1/rpc/... (getProfiles - managers)

Total de chamadas: 3
```

### 🎨 UI
- [ ] Tabela renderiza sem travamentos
- [ ] Checkboxes funcionam
- [ ] Ações (Ver, Editar, Ativar/Desativar) funcionam
- [ ] Modal de detalhes abre corretamente
- [ ] Modal de edição abre corretamente
- [ ] Exportação funciona

---

## 🧪 TESTE 2: Login como RH (HR)

### Setup
```bash
Email: hr@test.com (ou similar)
Role: hr
```

### Passos
1. [ ] Fazer login como RH
2. [ ] Navegar para `/people-management`
3. [ ] Aguardar carregamento da página

### ✅ Resultados Esperados
- [ ] Página carrega em **< 3 segundos**
- [ ] Todos os usuários são visíveis
- [ ] Botão "Novo Colaborador" está visível
- [ ] Pode criar novos colaboradores
- [ ] Pode exportar dados

### 📊 Console (DevTools)
```
✅ 🔄 PeopleManagement: Loading data... { userRole: 'hr', filterType: 'all' }
✅ ✅ PeopleManagement: Data loaded successfully
```

### 📡 Network (DevTools)
```
Total de chamadas: 3 (mesmo do Admin)
```

---

## 🧪 TESTE 3: Login como MANAGER (Gestor)

### Setup
```bash
Email: manager@test.com (ou similar)
Role: manager
Manager_id: [ID do gestor]
```

### Passos
1. [ ] Fazer login como Gestor
2. [ ] Navegar para `/people-management`
3. [ ] Aguardar carregamento da página

### ✅ Resultados Esperados
- [ ] Página carrega em **< 3 segundos**
- [ ] **Apenas** membros da sua equipe são visíveis
- [ ] Título muda para "Minha Equipe"
- [ ] Botão "Novo Colaborador" **NÃO** está visível
- [ ] Pode editar perfis de sua equipe
- [ ] **NÃO** pode alterar roles

### 📊 Console (DevTools)
```
✅ 🔄 PeopleManagement: Loading data... { userRole: 'manager', filterType: 'filtered' }
✅ 📊 PeopleManagement: Fetching profiles for manager: [manager_id]
✅ ✅ PeopleManagement: Data loaded successfully { profiles: [apenas sua equipe] }
```

### 📡 Network (DevTools)
```
Total de chamadas: 3
Filtro aplicado client-side corretamente
```

---

## 🧪 TESTE 4: Teste de Performance

### Setup
```bash
# Abrir DevTools > Performance
# Começar gravação
```

### Passos
1. [ ] Fazer login como Admin
2. [ ] Iniciar gravação de performance
3. [ ] Navegar para `/people-management`
4. [ ] Aguardar carregamento completo
5. [ ] Parar gravação

### ✅ Resultados Esperados
- [ ] **Sem long tasks** > 100ms
- [ ] **Total load time** < 3s
- [ ] **Sem memory leaks** (usar Memory profiler)
- [ ] **FPS estável** durante uso

### 📊 Métricas Alvo
```
First Contentful Paint (FCP): < 1.5s
Largest Contentful Paint (LCP): < 2.5s
Time to Interactive (TTI): < 3.0s
Total Blocking Time (TBT): < 300ms
Cumulative Layout Shift (CLS): < 0.1
```

---

## 🧪 TESTE 5: Teste de Filtros

### Passos
1. [ ] Login como Admin
2. [ ] Navegar para `/people-management`
3. [ ] Testar cada filtro:
   - [ ] Busca por nome
   - [ ] Filtro por time
   - [ ] Filtro por role
   - [ ] Filtro por nível
   - [ ] Filtro por status
   - [ ] Filtro por gestor

### ✅ Resultados Esperados
- [ ] Filtros aplicam **instantaneamente** (< 100ms)
- [ ] Combinação de filtros funciona
- [ ] Botão "Limpar" reseta todos os filtros
- [ ] Estatísticas atualizam conforme filtros
- [ ] Sem erros no console

---

## 🧪 TESTE 6: Teste de Ações em Massa

### Passos
1. [ ] Login como Admin
2. [ ] Navegar para `/people-management`
3. [ ] Selecionar 3+ usuários com checkboxes
4. [ ] Clicar em "Ações em Massa"
5. [ ] Testar cada ação:
   - [ ] Alterar Time
   - [ ] Alterar Status
   - [ ] Alterar Gestor
   - [ ] Alterar Role (apenas Admin)

### ✅ Resultados Esperados
- [ ] Modal abre corretamente
- [ ] Lista de selecionados está correta
- [ ] Ações aplicam sem erros
- [ ] Página recarrega automaticamente
- [ ] Mudanças são persistidas no banco

---

## 🧪 TESTE 7: Teste de Modals

### Passos
1. [ ] Clicar em "Ver Detalhes" (ícone de olho)
   - [ ] Modal abre com informações completas
   - [ ] Dados carregam corretamente
   - [ ] Botão "Editar Perfil" funciona
   
2. [ ] Clicar em "Editar" (ícone de lápis)
   - [ ] Modal abre com formulário preenchido
   - [ ] Campos são editáveis
   - [ ] Salvar persiste mudanças
   
3. [ ] Clicar em "Novo Colaborador"
   - [ ] Modal abre com formulário vazio
   - [ ] Validações funcionam
   - [ ] Criar funciona e adiciona usuário

### ✅ Resultados Esperados
- [ ] Modals abrem sem delay
- [ ] Formulários funcionam corretamente
- [ ] Validações são aplicadas
- [ ] Salvar/Criar persiste dados
- [ ] Fechar modal não causa erros

---

## 🧪 TESTE 8: Teste de Exportação

### Passos
1. [ ] Login como Admin
2. [ ] Navegar para `/people-management`
3. [ ] Aplicar alguns filtros (opcional)
4. [ ] Clicar em "Exportar"

### ✅ Resultados Esperados
- [ ] Download inicia imediatamente
- [ ] Arquivo CSV é gerado
- [ ] Dados no CSV estão corretos
- [ ] Apenas dados filtrados são exportados (se filtros ativos)

---

## 🧪 TESTE 9: Teste de Edge Cases

### Cenário 1: Banco Vazio
```bash
# Limpar dados de teste
# Fazer login como Admin
```
- [ ] Mensagem apropriada é exibida
- [ ] Não há erros no console
- [ ] Botão "Novo Colaborador" funciona

### Cenário 2: Gestor sem Equipe
```bash
# Fazer login como Manager sem team members
```
- [ ] Mensagem "Você ainda não possui uma equipe atribuída"
- [ ] Não há erros no console

### Cenário 3: Erro de Rede
```bash
# Simular offline no DevTools
# Navegar para /people-management
```
- [ ] Mensagem de erro apropriada
- [ ] Botão "Tentar Novamente" funciona
- [ ] Não trava a aplicação

---

## 📊 RESULTADO FINAL

### Critérios de Aprovação
Para o bug ser considerado **CORRIGIDO**, **TODOS** os itens abaixo devem estar OK:

- [ ] ✅ Todos os testes passaram sem erros
- [ ] ✅ Tempo de carregamento < 3s em todos os casos
- [ ] ✅ Console limpo (sem errors ou warnings)
- [ ] ✅ Apenas 3 chamadas de API na carga inicial
- [ ] ✅ Sem loops infinitos ou re-renders excessivos
- [ ] ✅ Filtros funcionam instantaneamente
- [ ] ✅ Todas as roles funcionam corretamente
- [ ] ✅ Performance é aceitável (métricas dentro do alvo)

### Status
- [ ] ✅ **APROVADO** - Pronto para merge
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Pequenos ajustes necessários
- [ ] ❌ **REPROVADO** - Necessita correções adicionais

---

## 📝 Observações Adicionais

```
Adicione aqui quaisquer observações encontradas durante os testes:

Data: _____________________
Testador: _____________________
Ambiente: _____________________

Bugs encontrados:
-

Melhorias sugeridas:
-

Performance observada:
-
```

---

## 🚀 Próximos Passos

Após validação completa:
1. [ ] Documentar resultados neste checklist
2. [ ] Criar PR com descrição detalhada
3. [ ] Solicitar code review
4. [ ] Aguardar aprovação
5. [ ] Merge para branch principal
6. [ ] Deploy para staging
7. [ ] Validar em staging
8. [ ] Deploy para produção
9. [ ] Monitorar logs em produção

---

**Última atualização:** 2025-10-29
**Versão:** 1.0
