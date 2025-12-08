# 🔥 SMOKE TESTS PÓS-DEPLOY
## TalentFlow - Validação Rápida de Produção
### Tempo Estimado: 15-20 minutos

---

## 📋 PRÉ-REQUISITOS

- [ ] Aplicação deployada e URL acessível
- [ ] Credenciais de teste disponíveis
- [ ] Acesso ao Supabase Dashboard
- [ ] Acesso ao Sentry (se configurado)

---

## 🧪 TESTE 1: ACESSO E LOGIN (3 min)

### 1.1 Acessibilidade
```
URL de Produção: ____________________
```

| Verificação | Status |
|-------------|--------|
| [ ] Site carrega sem erros | ⬜ |
| [ ] HTTPS ativo (cadeado verde) | ⬜ |
| [ ] Tempo de carregamento < 5s | ⬜ |
| [ ] Console sem erros críticos (F12) | ⬜ |

### 1.2 Login com Admin
```
Email: [Obter credenciais via canal seguro - ver documentação interna]
Senha: [Obter credenciais via canal seguro]
```

| Verificação | Status |
|-------------|--------|
| [ ] Login realizado com sucesso | ⬜ |
| [ ] Redirecionamento para Dashboard | ⬜ |
| [ ] Nome do usuário exibido no header | ⬜ |
| [ ] Menus de admin visíveis | ⬜ |

### 1.3 Login com HR
```
Email: [Obter credenciais via canal seguro - ver documentação interna]
Senha: [Obter credenciais via canal seguro]
```

| Verificação | Status |
|-------------|--------|
| [ ] Login realizado com sucesso | ⬜ |
| [ ] Módulo de RH acessível | ⬜ |
| [ ] Dashboard de saúde mental visível | ⬜ |

### 1.4 Login com Manager
```
Email: [Obter credenciais via canal seguro - ver documentação interna]
Senha: [Obter credenciais via canal seguro]
```

| Verificação | Status |
|-------------|--------|
| [ ] Login realizado com sucesso | ⬜ |
| [ ] Visão da equipe disponível | ⬜ |
| [ ] Pode ver PDIs dos subordinados | ⬜ |

### 1.5 Login com Employee
```
Email: [Obter credenciais via canal seguro - ver documentação interna]
Senha: [Obter credenciais via canal seguro]
```

| Verificação | Status |
|-------------|--------|
| [ ] Login realizado com sucesso | ⬜ |
| [ ] Dashboard pessoal carrega | ⬜ |
| [ ] Apenas dados próprios visíveis | ⬜ |

---

## 🧪 TESTE 2: CRIAÇÃO DE PDI (3 min)

**Usuário:** Employee (obter credenciais via canal seguro)

### 2.1 Criar Novo PDI
1. Navegar para `Desenvolvimento` → `Meu PDI`
2. Clicar em "Novo PDI"
3. Preencher:
   - **Título:** "Teste Smoke - Delete Me"
   - **Descrição:** "PDI criado para validação pós-deploy"
   - **Prazo:** 30 dias no futuro
   - **Mentor:** Silvia Kanayama
4. Salvar

| Verificação | Status |
|-------------|--------|
| [ ] Formulário abre corretamente | ⬜ |
| [ ] Campos aceitam texto sem perder foco | ⬜ |
| [ ] PDI criado com sucesso | ⬜ |
| [ ] PDI aparece na lista | ⬜ |
| [ ] Status inicial correto | ⬜ |

### 2.2 Verificar Persistência
1. Pressionar F5 (recarregar página)
2. Verificar se PDI ainda aparece

| Verificação | Status |
|-------------|--------|
| [ ] PDI persistido após refresh | ⬜ |

---

## 🧪 TESTE 3: CRIAÇÃO DE TAREFA (3 min)

**Usuário:** Manager (obter credenciais via canal seguro)

### 3.1 Criar Grupo de Ação
1. Navegar para `Grupos de Ação`
2. Clicar em "Novo Grupo"
3. Preencher:
   - **Título:** "Teste Smoke Group - Delete Me"
   - **Participantes:** Julia Rissin, Pedro Oliveira
4. Salvar

| Verificação | Status |
|-------------|--------|
| [ ] Grupo criado com sucesso | ⬜ |

### 3.2 Criar Tarefa no Grupo
1. Abrir o grupo criado
2. Clicar em "Nova Tarefa"
3. Preencher:
   - **Título:** "Tarefa de Teste"
   - **Assignee:** Julia Rissin
   - **Prazo:** 7 dias no futuro
4. Salvar

| Verificação | Status |
|-------------|--------|
| [ ] Tarefa criada com sucesso | ⬜ |
| [ ] Tarefa aparece na lista | ⬜ |
| [ ] Assignee correto exibido | ⬜ |

---

## 🧪 TESTE 4: DASHBOARDS (2 min)

### 4.1 Dashboard Principal
**Usuário:** Qualquer

| Verificação | Status |
|-------------|--------|
| [ ] Dashboard carrega < 3s | ⬜ |
| [ ] Gráficos renderizam | ⬜ |
| [ ] Cards com métricas visíveis | ⬜ |
| [ ] Sem erros no console | ⬜ |

### 4.2 Dashboard de Competências
1. Navegar para `Competências`

| Verificação | Status |
|-------------|--------|
| [ ] Página carrega corretamente | ⬜ |
| [ ] Lista de competências visível | ⬜ |

### 4.3 Dashboard de Saúde Mental (HR)
**Usuário:** HR (obter credenciais via canal seguro)

1. Navegar para `Saúde Mental`

| Verificação | Status |
|-------------|--------|
| [ ] Dashboard acessível | ⬜ |
| [ ] Estatísticas agregadas visíveis | ⬜ |

---

## 🧪 TESTE 5: LOGOUT E SESSÃO (2 min)

### 5.1 Logout
1. Clicar em "Sair" no header

| Verificação | Status |
|-------------|--------|
| [ ] Logout executado | ⬜ |
| [ ] Redirecionamento para login | ⬜ |

### 5.2 Proteção de Rotas
1. Tentar acessar `/dashboard` diretamente (sem login)

| Verificação | Status |
|-------------|--------|
| [ ] Redirecionado para login | ⬜ |
| [ ] Sessão não persistiu após logout | ⬜ |

---

## 🧪 TESTE 6: RESPONSIVIDADE (2 min)

### 6.1 Mobile (F12 → Toggle Device)
Simular iPhone ou Android (375px width)

| Verificação | Status |
|-------------|--------|
| [ ] Login funciona em mobile | ⬜ |
| [ ] Menu mobile funciona | ⬜ |
| [ ] Dashboard renderiza | ⬜ |
| [ ] Formulários usáveis | ⬜ |

---

## 🧪 TESTE 7: VERIFICAÇÃO DE ERROS (2 min)

### 7.1 Console do Navegador
1. Abrir DevTools (F12)
2. Ir na aba "Console"
3. Navegar por várias páginas

| Verificação | Status |
|-------------|--------|
| [ ] Sem erros em vermelho | ⬜ |
| [ ] Sem warnings críticos | ⬜ |
| [ ] Sem "Maximum update depth exceeded" | ⬜ |

### 7.2 Network Tab
1. Ir na aba "Network"
2. Filtrar por "XHR"
3. Navegar por várias páginas

| Verificação | Status |
|-------------|--------|
| [ ] Sem requests falhando (vermelho) | ⬜ |
| [ ] Responses corretos (200, 201) | ⬜ |
| [ ] Tempo de resposta < 1s | ⬜ |

---

## 📊 RESULTADO FINAL

### Resumo dos Testes

| Teste | Passou | Falhou | Total |
|-------|--------|--------|-------|
| 1. Login | /5 | | 5 |
| 2. PDI | /6 | | 6 |
| 3. Tarefa | /4 | | 4 |
| 4. Dashboards | /6 | | 6 |
| 5. Logout | /3 | | 3 |
| 6. Responsividade | /4 | | 4 |
| 7. Erros | /5 | | 5 |
| **TOTAL** | **/33** | | 33 |

### Critério de Aprovação

| Taxa | Status |
|------|--------|
| 100% (33/33) | ✅ APROVADO |
| 90-99% | ⚠️ APROVADO COM RESSALVAS |
| < 90% | ❌ FALHOU - INVESTIGAR |

---

## 🐛 BUGS ENCONTRADOS

### Bug 1: (Se houver)
- **Página:** 
- **Descrição:** 
- **Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo
- **Screenshot:** 

### Bug 2: (Se houver)
- **Página:** 
- **Descrição:** 
- **Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo
- **Screenshot:** 

---

## 📋 LIMPEZA PÓS-TESTE

Após completar os testes, limpar dados de teste:

1. [ ] Deletar PDI "Teste Smoke - Delete Me"
2. [ ] Deletar Grupo de Ação "Teste Smoke Group - Delete Me"
3. [ ] Deletar tarefas de teste

---

## ✅ ASSINATURA

**Data:** _______________  
**Testado por:** _______________  
**Ambiente:** [ ] Staging [ ] Production  
**URL:** _______________  
**Status Final:** [ ] ✅ APROVADO [ ] ⚠️ RESSALVAS [ ] ❌ FALHOU

**Observações:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**Próximos Passos (se aprovado):**
1. Comunicar stakeholders sobre deploy bem-sucedido
2. Monitorar Sentry/Analytics por 24h
3. Coletar feedback inicial de usuários
4. Documentar baseline de performance
