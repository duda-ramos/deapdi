# 🎯 GUIA COMPLETO DE CRIAÇÃO DE USUÁRIOS DE TESTE
## DEAPDI TalentFlow - Validação End-to-End

---

## 📋 ÍNDICE

1. [Configuração Auth](#1-configuração-auth)
2. [Credenciais dos Usuários](#2-credenciais-dos-usuários)
3. [Processo de Criação (Passo a Passo)](#3-processo-de-criação-passo-a-passo)
4. [Estrutura de Dados de Teste](#4-estrutura-de-dados-de-teste)
5. [Queries de Validação](#5-queries-de-validação)
6. [Checklist Final](#6-checklist-final)
7. [Casos de Uso para Testes](#7-casos-de-uso-para-testes)

---

## 1. CONFIGURAÇÃO AUTH

### ⚠️ PASSO CRÍTICO: Configurar Supabase Auth

**URL Dashboard:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/settings

### ✅ OPÇÃO A - Desabilitar Confirmação de Email (RECOMENDADO)

Esta é a opção mais rápida para ambiente de testes:

1. Acesse: **Authentication → Settings → Email**
2. Encontre: **"Enable email confirmations"**
3. **DESABILITE** o toggle
4. Clique em **Save**

**Vantagens:**
- Permite usar qualquer email (até domínios falsos)
- Usuários criados já ficam confirmados automaticamente
- Não precisa acessar caixa de email

**Desvantagens:**
- Menos realista (produção terá confirmação)
- Precisa lembrar de REABILITAR depois dos testes

---

### 📧 OPÇÃO B - Usar Emails Temporários Reais

Use serviços de email temporário:

**Serviços Recomendados:**
- [temp-mail.org](https://temp-mail.org)
- [guerrillamail.com](https://www.guerrillamail.com/)
- [10minutemail.com](https://10minutemail.com/)

**Processo:**
1. Abra o serviço de email temporário
2. Copie o email gerado
3. Use ao criar usuário no Supabase
4. Acesse a caixa de entrada para confirmar
5. Clique no link de confirmação

**Vantagens:**
- Mais realista (simula fluxo de produção)
- Testa o envio de emails

**Desvantagens:**
- Mais trabalhoso (precisa confirmar cada email)
- Emails podem expirar

---

### 🔒 OPÇÃO C - Configurar Domínio de Teste

Configure o Auth para aceitar domínio customizado:

1. Acesse: **Authentication → URL Configuration**
2. Em **"Redirect URLs"**, adicione:
   ```
   http://localhost:5173/**
   https://deapdi-test.local/**
   ```
3. Salve as alterações

**Nota:** Esta opção ainda requer Opção A ou B para emails.

---

## 📝 OPÇÃO ESCOLHIDA

**[ ] Opção A - Desabilitar confirmação** ← RECOMENDADO  
**[ ] Opção B - Emails temporários**  
**[ ] Opção C - Domínio customizado**

---

## 2. CREDENCIAIS DOS USUÁRIOS

### 🔐 Resumo de Todos os Usuários

| # | Nome | Email | Senha | Perfil | Departamento | Cargo |
|---|------|-------|-------|--------|--------------|-------|
| 1 | Alexandre Administrador | admin.teste@deapdi-test.local | Admin@2025! | admin | TI | Diretor de TI |
| 2 | Rita Recursos Humanos | rh.teste@deapdi-test.local | RH@2025! | hr | RH | Gerente de RH |
| 3 | Gabriela Gestora Marketing | gestor1.teste@deapdi-test.local | Gestor@2025! | manager | Marketing | Gerente de Marketing |
| 4 | Gustavo Gestor Vendas | gestor2.teste@deapdi-test.local | Gestor@2025! | manager | Vendas | Gerente Comercial |
| 5 | Carlos Colaborador Marketing | colab1.teste@deapdi-test.local | Colab@2025! | employee | Marketing | Analista Jr |
| 6 | Marina Colaboradora Marketing | colab2.teste@deapdi-test.local | Colab@2025! | employee | Marketing | Designer Pleno |
| 7 | Pedro Colaborador Marketing | colab3.teste@deapdi-test.local | Colab@2025! | employee | Marketing | Social Media Sr |
| 8 | Ana Colaboradora Vendas | colab4.teste@deapdi-test.local | Colab@2025! | employee | Vendas | SDR Jr |
| 9 | Bruno Colaborador Vendas | colab5.teste@deapdi-test.local | Colab@2025! | employee | Vendas | AE Pleno |
| 10 | Juliana Colaboradora Vendas | colab6.teste@deapdi-test.local | Colab@2025! | employee | Vendas | Closer Sr |

### 📊 Hierarquia Organizacional

```
DEAPDI TalentFlow
│
├── TI
│   └── Alexandre (Admin)
│
├── RH
│   └── Rita (HR)
│
├── Marketing
│   ├── Gabriela (Gestora) ⭐
│   │   ├── Carlos (Jr)
│   │   ├── Marina (Pleno)
│   │   └── Pedro (Sr)
│   
└── Vendas
    ├── Gustavo (Gestor) ⭐
    │   ├── Ana (Jr)
    │   ├── Bruno (Pleno)
    │   └── Juliana (Sr)
```

---

## 3. PROCESSO DE CRIAÇÃO (PASSO A PASSO)

### 📍 FASE 1: Criar Usuários no Auth (Dashboard)

**Para cada um dos 10 usuários:**

1. **Acesse:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users

2. **Clique em:** `Add user` (botão verde no canto superior direito)

3. **Preencha o formulário:**
   - **Email:** [copiar da tabela acima]
   - **Password:** [copiar da tabela acima]
   - **Auto Confirm User:** ✅ **MARCAR** (se Opção A ativada)

4. **Clique em:** `Create user`

5. **⚠️ IMPORTANTE:** Assim que criar, **COPIE o UUID** gerado

6. **Cole o UUID** no documento de controle (próxima seção)

---

### 📝 DOCUMENTO DE CONTROLE DE UUIDs

**Mantenha este documento atualizado enquanto cria os usuários:**

```sql
-- ══════════════════════════════════════════════════════════
-- TABELA DE UUIDs - PREENCHER ENQUANTO CRIA OS USUÁRIOS
-- ══════════════════════════════════════════════════════════

-- 1. ADMIN
-- Email: admin.teste@deapdi-test.local
-- UUID: ________________________________

-- 2. RH
-- Email: rh.teste@deapdi-test.local
-- UUID: ________________________________

-- 3. GESTOR MARKETING
-- Email: gestor1.teste@deapdi-test.local
-- UUID: ________________________________

-- 4. GESTOR VENDAS
-- Email: gestor2.teste@deapdi-test.local
-- UUID: ________________________________

-- 5. COLAB MARKETING 1 (Carlos)
-- Email: colab1.teste@deapdi-test.local
-- UUID: ________________________________

-- 6. COLAB MARKETING 2 (Marina)
-- Email: colab2.teste@deapdi-test.local
-- UUID: ________________________________

-- 7. COLAB MARKETING 3 (Pedro)
-- Email: colab3.teste@deapdi-test.local
-- UUID: ________________________________

-- 8. COLAB VENDAS 1 (Ana)
-- Email: colab4.teste@deapdi-test.local
-- UUID: ________________________________

-- 9. COLAB VENDAS 2 (Bruno)
-- Email: colab5.teste@deapdi-test.local
-- UUID: ________________________________

-- 10. COLAB VENDAS 3 (Juliana)
-- Email: colab6.teste@deapdi-test.local
-- UUID: ________________________________
```

---

### 📍 FASE 2: Editar e Executar SQL Script

1. **Abra o arquivo:** `TEST_USERS_SEED_SCRIPT.sql`

2. **Substitua TODOS os UUIDs** nos comandos SQL:
   - Busque por: `UUID_ADMIN_AQUI`
   - Substitua por: UUID real copiado
   - Repita para todos os 10 usuários

3. **Descomente os blocos SQL** (remover `/*` e `*/`):
   - Profiles (10 INSERTs)
   - Competências (6 blocos)
   - PDIs (6 blocos)
   - Grupos de Ação (2 blocos)
   - Mentorias (4-6 blocos)
   - Check-ins (6 blocos)
   - Notificações (15-20 INSERTs)

4. **Execute no SQL Editor do Supabase:**
   - Dashboard → SQL Editor
   - Copie o script editado
   - Clique em `Run`

---

### ⏱️ Estimativa de Tempo

| Fase | Atividade | Tempo Estimado |
|------|-----------|----------------|
| 0 | Configurar Auth | 2 min |
| 1 | Criar 10 usuários no Dashboard | 15-20 min |
| 2 | Copiar e organizar UUIDs | 5 min |
| 3 | Editar script SQL | 10-15 min |
| 4 | Executar script no Supabase | 2 min |
| 5 | Validar com queries | 5 min |
| **TOTAL** | | **~40-50 min** |

---

## 4. ESTRUTURA DE DADOS DE TESTE

### 📊 Visão Geral dos Dados

```
10 USUÁRIOS
├── 1 Admin
├── 1 RH
├── 2 Gestores (1 Marketing + 1 Vendas)
└── 6 Colaboradores (3 Marketing + 3 Vendas)

DADOS GERADOS:
├── 18-24 Competências avaliadas
├── 12-18 PDIs com objetivos
├── 2 Grupos de Ação
│   ├── Grupo 1: Campanha Black Friday (Marketing - 5 tarefas)
│   └── Grupo 2: Treinamento CRM (Vendas - 4 tarefas)
├── 4-6 Solicitações de Mentoria
│   ├── 2 aceitas e ativas (com sessões)
│   └── 2 pendentes
├── 6-12 Check-ins de Saúde Mental
│   ├── 1 recente por colaborador
│   └── 1 histórico por colaborador
└── 15-20 Notificações variadas
```

---

### 🎯 PDIs por Colaborador

#### Marketing

**Carlos (Júnior)**
- PDI 1: "Dominar Google Analytics 4" (em andamento)
  - 3 tarefas: curso, dashboard, apresentação
- PDI 2: "Fundamentos de Marketing Digital" (validado)
  - 2 tarefas concluídas

**Marina (Pleno)**
- PDI 1: "Design System Avançado" (em andamento)
  - 4 tarefas: pesquisa, paleta, componentes, docs
- PDI 2: "UX Research Fundamentals" (completo)
  - 2 tarefas concluídas

**Pedro (Sênior)**
- PDI 1: "Liderança de Equipe" (em andamento)
- PDI 2: "Estratégias Avançadas de Growth" (validado)

#### Vendas

**Ana (Júnior)**
- PDI 1: "Dominar Prospecção B2B" (em andamento)
- PDI 2: "Fundamentos de Vendas" (completo)

**Bruno (Pleno)**
- PDI 1: "Vendas Consultivas Avançadas" (em andamento)
- PDI 2: "Gestão de Pipeline" (validado)

**Juliana (Sênior)**
- PDI 1: "Negociação Estratégica" (em andamento)
- PDI 2: "Mentor de Vendedores" (validado)

---

### 👥 Grupos de Ação

#### 🎨 Grupo 1: Campanha Black Friday

**Líder:** Gabriela (Gestora Marketing)  
**Membros:** Carlos, Marina, Pedro  
**Prazo:** 30/11/2025  
**Status:** Ativo

**Tarefas:**
1. ✅ Definir estratégia de descontos (Gabriela) - CONCLUÍDA
2. ✅ Criar artes para redes sociais (Marina) - CONCLUÍDA
3. 🔄 Configurar campanhas de email (Carlos) - EM ANDAMENTO
4. 🔄 Agendar posts nas redes (Pedro) - EM ANDAMENTO
5. 📋 Monitorar métricas durante campanha (Carlos) - PENDENTE

---

#### 💼 Grupo 2: Treinamento Novo CRM

**Líder:** Gustavo (Gestor Vendas)  
**Membros:** Ana, Bruno, Juliana  
**Prazo:** 15/11/2025  
**Status:** Ativo

**Tarefas:**
1. ✅ Completar curso Salesforce (Gustavo) - CONCLUÍDA
2. 🔄 Migrar leads do CRM antigo (Bruno) - EM ANDAMENTO
3. 🔄 Configurar pipelines de vendas (Juliana) - EM ANDAMENTO
4. 🔄 Testar automações de follow-up (Ana) - EM ANDAMENTO

---

### 🤝 Mentorias

#### Ativas

**1. Pedro → Carlos**
- Tema: Gestão de Redes Sociais
- Sessões: 2 realizadas
- Status: Ativo

**2. Juliana → Bruno**
- Tema: Técnicas de Fechamento
- Sessões: 1 realizada
- Status: Ativo

#### Pendentes

**3. Juliana ← Marina**
- Tema: Apresentação para Clientes
- Status: Aguardando aceite

**4. Bruno ← Ana**
- Tema: Gestão de Pipeline
- Status: Aguardando aceite

---

### 💚 Check-ins de Saúde Mental

| Colaborador | Último Check-in | Humor | Estresse | Energia | Observação |
|-------------|-----------------|-------|----------|---------|------------|
| Carlos | Há 3 dias | 7/10 | 5/10 | 7/10 | Bom estado |
| Marina | Há 1 dia | 8/10 | 4/10 | 8/10 | Excelente |
| Pedro | Há 2 dias | 8/10 | 5/10 | 8/10 | Muito bem |
| Ana | Há 4 dias | 6/10 | 7/10 | 5/10 | ⚠️ Atenção |
| Bruno | Há 5 dias | 7/10 | 5/10 | 7/10 | Bom estado |
| Juliana | Há 1 dia | 9/10 | 3/10 | 9/10 | Excelente |

**⚠️ Alertas:** Ana apresentou níveis elevados de estresse. RH deve monitorar.

---

## 5. QUERIES DE VALIDAÇÃO

### ✅ Executar APÓS inserir todos os dados

#### Query 1: Verificar Usuários Criados

```sql
SELECT 
  p.name as nome,
  p.email,
  p.role as perfil,
  t.name as departamento,
  g.name as gestor,
  p.position as cargo,
  p.points as pontos
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN profiles g ON p.manager_id = g.id
ORDER BY 
  CASE p.role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
  END,
  p.name;
```

**✅ Resultado Esperado:** 10 linhas

---

#### Query 2: Validar PDIs

```sql
SELECT 
  p.name as colaborador,
  COUNT(DISTINCT pdi.id) as total_pdis,
  SUM(CASE WHEN pdi.status = 'in-progress' THEN 1 ELSE 0 END) as em_andamento,
  SUM(CASE WHEN pdi.status = 'completed' THEN 1 ELSE 0 END) as concluidos,
  SUM(CASE WHEN pdi.status = 'validated' THEN 1 ELSE 0 END) as validados
FROM profiles p
LEFT JOIN pdis pdi ON pdi.profile_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name
ORDER BY p.name;
```

**✅ Resultado Esperado:** 6 colaboradores, cada um com 2-3 PDIs

---

#### Query 3: Validar Competências

```sql
SELECT 
  p.name as colaborador,
  COUNT(*) as total_competencias,
  ROUND(AVG(c.self_rating::numeric), 2) as media_auto,
  ROUND(AVG(c.manager_rating::numeric), 2) as media_gestor,
  ROUND(AVG((c.manager_rating - c.self_rating)::numeric), 2) as divergencia
FROM profiles p
LEFT JOIN competencies c ON c.profile_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name
ORDER BY p.name;
```

**✅ Resultado Esperado:** 6 colaboradores com 3-5 competências cada

---

#### Query 4: Validar Grupos de Ação

```sql
SELECT 
  ag.title as grupo,
  p.name as criador,
  ag.deadline as prazo,
  COUNT(DISTINCT agp.profile_id) as participantes,
  COUNT(DISTINCT t.id) as total_tarefas,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as concluidas
FROM action_groups ag
JOIN profiles p ON ag.created_by = p.id
LEFT JOIN action_group_participants agp ON agp.group_id = ag.id
LEFT JOIN tasks t ON t.group_id = ag.id
GROUP BY ag.id, ag.title, ag.deadline, p.name;
```

**✅ Resultado Esperado:** 2 grupos com tarefas

---

#### Query 5: Validar Mentorias

```sql
SELECT 
  mentor.name as mentor,
  mentee.name as mentorado,
  mr.status as status,
  COUNT(ms.id) as sessoes
FROM mentorship_requests mr
JOIN profiles mentor ON mr.mentor_id = mentor.id
JOIN profiles mentee ON mr.mentee_id = mentee.id
LEFT JOIN mentorships m ON m.mentor_id = mr.mentor_id 
  AND m.mentee_id = mr.mentee_id
LEFT JOIN mentorship_sessions ms ON ms.mentorship_id = m.id
GROUP BY mentor.name, mentee.name, mr.status
ORDER BY mr.status, mentor.name;
```

**✅ Resultado Esperado:** 4-6 solicitações (2 aceitas, 2 pendentes)

---

#### Query 6: Dashboard de Saúde Mental

```sql
SELECT 
  p.name as colaborador,
  COUNT(ec.id) as checkins,
  ROUND(AVG(ec.mood_rating::numeric), 1) as humor_medio,
  ROUND(AVG(ec.stress_level::numeric), 1) as estresse_medio,
  MAX(ec.checkin_date) as ultimo_checkin,
  CASE 
    WHEN AVG(ec.stress_level) >= 7 THEN '⚠️ Atenção'
    WHEN AVG(ec.stress_level) >= 5 THEN '⚡ Moderado'
    ELSE '✅ Saudável'
  END as status
FROM profiles p
LEFT JOIN emotional_checkins ec ON ec.employee_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name
ORDER BY estresse_medio DESC;
```

**✅ Resultado Esperado:** 6 colaboradores com 1-2 check-ins cada

---

#### Query 7: Notificações Não Lidas

```sql
SELECT 
  p.name as usuario,
  COUNT(*) as total,
  SUM(CASE WHEN n.read = false THEN 1 ELSE 0 END) as nao_lidas
FROM profiles p
LEFT JOIN notifications n ON n.profile_id = p.id
GROUP BY p.id, p.name
HAVING COUNT(*) > 0
ORDER BY nao_lidas DESC;
```

**✅ Resultado Esperado:** Todos os usuários com notificações, maioria com não lidas

---

#### Query 8: Resumo Executivo

```sql
SELECT 
  'Total de Usuários' as metrica,
  COUNT(*)::text as valor
FROM profiles
UNION ALL
SELECT 'Total de PDIs', COUNT(*)::text FROM pdis
UNION ALL
SELECT 'Competências Avaliadas', COUNT(*)::text 
FROM competencies WHERE manager_rating IS NOT NULL
UNION ALL
SELECT 'Grupos Ativos', COUNT(*)::text 
FROM action_groups WHERE status = 'active'
UNION ALL
SELECT 'Mentorias Ativas', COUNT(*)::text 
FROM mentorships WHERE status = 'active'
UNION ALL
SELECT 'Check-ins (7 dias)', COUNT(*)::text 
FROM emotional_checkins 
WHERE checkin_date >= CURRENT_DATE - 7
UNION ALL
SELECT 'Notificações Não Lidas', COUNT(*)::text 
FROM notifications WHERE read = false;
```

**✅ Resultado Esperado:**
- 10 usuários
- 12-18 PDIs
- 18-30 competências
- 2 grupos ativos
- 2 mentorias ativas
- 6 check-ins recentes
- 10-15 notificações não lidas

---

## 6. CHECKLIST FINAL

### ✅ Configuração Inicial

- [ ] Auth configurado (Opção A, B ou C escolhida)
- [ ] Estrutura do banco verificada (tabelas existem)
- [ ] SQL Editor do Supabase acessível

---

### ✅ Criação de Usuários (Dashboard)

- [ ] 1. Admin criado - UUID anotado
- [ ] 2. RH criado - UUID anotado
- [ ] 3. Gestor Marketing criado - UUID anotado
- [ ] 4. Gestor Vendas criado - UUID anotado
- [ ] 5. Colaborador Marketing 1 criado - UUID anotado
- [ ] 6. Colaborador Marketing 2 criado - UUID anotado
- [ ] 7. Colaborador Marketing 3 criado - UUID anotado
- [ ] 8. Colaborador Vendas 1 criado - UUID anotado
- [ ] 9. Colaborador Vendas 2 criado - UUID anotado
- [ ] 10. Colaborador Vendas 3 criado - UUID anotado

---

### ✅ Execução do Script SQL

- [ ] Todos os UUIDs substituídos no script
- [ ] Bloco de Teams descomentado e executado
- [ ] Bloco de Profiles descomentado e executado
- [ ] Bloco de Competências descomentado e executado
- [ ] Bloco de PDIs descomentado e executado
- [ ] Bloco de Grupos de Ação descomentado e executado
- [ ] Bloco de Mentorias descomentado e executado
- [ ] Bloco de Check-ins descomentado e executado
- [ ] Bloco de Notificações descomentado e executado
- [ ] Script executado sem erros

---

### ✅ Validação dos Dados

- [ ] Query 1: 10 usuários confirmados
- [ ] Query 2: PDIs distribuídos corretamente
- [ ] Query 3: Competências avaliadas
- [ ] Query 4: 2 grupos de ação ativos
- [ ] Query 5: Mentorias ativas e pendentes
- [ ] Query 6: Check-ins de saúde mental presentes
- [ ] Query 7: Notificações criadas
- [ ] Query 8: Resumo executivo confere

---

### ✅ Testes de Login

- [ ] Login com Admin (admin.teste@...) - OK
- [ ] Login com RH (rh.teste@...) - OK
- [ ] Login com Gestor Marketing (gestor1.teste@...) - OK
- [ ] Login com Gestor Vendas (gestor2.teste@...) - OK
- [ ] Login com pelo menos 1 Colaborador - OK

---

### ✅ Testes Funcionais Básicos

- [ ] Admin vê dashboard geral
- [ ] RH acessa módulo de saúde mental
- [ ] Gestor vê equipe e PDIs para validar
- [ ] Colaborador vê seus PDIs
- [ ] Colaborador vê grupos de ação
- [ ] Notificações aparecem no sino
- [ ] Check-ins de saúde mental acessíveis
- [ ] Mentorias aparecem para mentor/mentorado

---

## 7. CASOS DE USO PARA TESTES

### 🎭 Persona 1: Admin (Alexandre)

**Login:** `admin.teste@deapdi-test.local` / `Admin@2025!`

**Testes Recomendados:**
1. ✅ Ver dashboard com estatísticas globais
2. ✅ Acessar lista de todos os usuários
3. ✅ Visualizar todos os PDIs do sistema
4. ✅ Ver todos os grupos de ação
5. ✅ Acessar configurações do sistema
6. ✅ Testar permissões de admin (criar/editar/deletar)

**Resultado Esperado:**
- Acesso completo a todas as funcionalidades
- Visão 360° de toda a organização

---

### 🎭 Persona 2: RH (Rita)

**Login:** `rh.teste@deapdi-test.local` / `RH@2025!`

**Testes Recomendados:**
1. ✅ Acessar dashboard de saúde mental
2. ✅ Ver alertas de colaboradores (Ana com estresse alto)
3. ✅ Ver todas as solicitações de sessão de psicologia
4. ✅ Acessar registros psicológicos confidenciais
5. ✅ Ver estatísticas de check-ins emocionais
6. ✅ Visualizar todos os PDIs para overview de desenvolvimento
7. ✅ Gerar relatórios de engajamento

**Resultado Esperado:**
- Dashboard de saúde mental completo
- Alertas de Ana (estresse 7/10)
- 2 solicitações de sessão pendentes
- Acesso a dados confidenciais

---

### 🎭 Persona 3: Gestora Marketing (Gabriela)

**Login:** `gestor1.teste@deapdi-test.local` / `Gestor@2025!`

**Testes Recomendados:**
1. ✅ Ver equipe (Carlos, Marina, Pedro)
2. ✅ Visualizar PDIs da equipe aguardando validação
3. ✅ Validar PDI de Carlos ou Marina
4. ✅ Avaliar competências da equipe
5. ✅ Ver grupo "Campanha Black Friday" que criou
6. ✅ Atribuir/atualizar tarefas do grupo
7. ✅ Ver notificações de validações pendentes
8. ✅ Acompanhar métricas de performance da equipe

**Resultado Esperado:**
- Dashboard com 3 colaboradores
- PDIs pendentes de validação
- Grupo Black Friday com 5 tarefas
- Notificações de tarefas e PDIs

---

### 🎭 Persona 4: Gestor Vendas (Gustavo)

**Login:** `gestor2.teste@deapdi-test.local` / `Gestor@2025!`

**Testes Recomendados:**
1. ✅ Ver equipe (Ana, Bruno, Juliana)
2. ✅ Ver grupo "Treinamento CRM" que criou
3. ✅ Acompanhar progresso das tarefas do grupo
4. ✅ Avaliar competências de vendas da equipe
5. ✅ Ver PDIs de desenvolvimento
6. ✅ Validar PDIs concluídos
7. ✅ Receber alertas sobre Ana (estresse alto no RH)

**Resultado Esperado:**
- Dashboard com 3 vendedores
- Grupo CRM com 4 tarefas em andamento
- PDIs da equipe visíveis
- Competências de vendas avaliadas

---

### 🎭 Persona 5: Colaborador Jr (Carlos)

**Login:** `colab1.teste@deapdi-test.local` / `Colab@2025!`

**Testes Recomendados:**
1. ✅ Ver PDI "Dominar Google Analytics 4" em andamento
2. ✅ Atualizar progresso de tarefas do PDI
3. ✅ Ver participação no grupo "Campanha Black Friday"
4. ✅ Marcar tarefa de email marketing como concluída
5. ✅ Ver mentoria com Pedro (Social Media)
6. ✅ Agendar próxima sessão de mentoria
7. ✅ Realizar check-in de saúde mental
8. ✅ Ver notificação de PDI validado
9. ✅ Ver suas competências e autoavaliação
10. ✅ Comparar autoavaliação com avaliação da Gabriela

**Resultado Esperado:**
- 2 PDIs (1 validado, 1 em andamento)
- Tarefa no grupo Black Friday atribuída
- Mentoria ativa com Pedro com 2 sessões
- 1 check-in recente (humor 7, estresse 5)
- 3 notificações (1 não lida)

---

### 🎭 Persona 6: Colaboradora Pleno (Marina)

**Login:** `colab2.teste@deapdi-test.local` / `Colab@2025!`

**Testes Recomendados:**
1. ✅ Ver PDI "Design System Avançado"
2. ✅ Ver tarefa "Criar artes Black Friday" concluída
3. ✅ Ver solicitação de mentoria para Juliana (pendente)
4. ✅ Ver competências de design avaliadas com nota 5
5. ✅ Realizar novo check-in emocional
6. ✅ Ver pontos acumulados (250 pts)

**Resultado Esperado:**
- PDI em andamento com 4 tarefas
- Tarefa do grupo concluída
- Mentoria pendente de aceite
- Competências bem avaliadas
- Check-in positivo (humor 8)

---

### 🎭 Persona 7: Colaborador Sr (Pedro)

**Login:** `colab3.teste@deapdi-test.local` / `Colab@2025!`

**Testes Recomendados:**
1. ✅ Ver perfil de mentor
2. ✅ Ver Carlos como mentorado
3. ✅ Acessar histórico de 2 sessões realizadas
4. ✅ Adicionar feedback da próxima sessão
5. ✅ Ver tarefa "Agendar posts" no grupo
6. ✅ Ver competências sênior (todas nota 4-5)
7. ✅ Ver pontos acumulados (350 pts)

**Resultado Esperado:**
- 1 mentorado ativo (Carlos)
- 2 sessões de mentoria registradas
- Tarefa no grupo em andamento
- Competências de nível sênior

---

### 🎭 Persona 8: Colaboradora Jr (Ana)

**Login:** `colab4.teste@deapdi-test.local` / `Colab@2025!`

**Testes Recomendados:**
1. ✅ Ver PDI de prospecção B2B
2. ✅ Ver tarefa no grupo "Treinamento CRM"
3. ✅ Ver solicitação de mentoria para Bruno (pendente)
4. ✅ **IMPORTANTE:** Ver check-in com estresse 7/10
5. ✅ Ver competências em desenvolvimento (notas 2-3)
6. ✅ Criar nova solicitação de sessão com psicóloga

**Resultado Esperado:**
- PDI em andamento
- Tarefa de CRM atribuída
- Check-in indica estresse elevado
- Solicitação de mentoria pendente
- Alerta de RH deve aparecer para Rita

---

### 🎭 Persona 9: Colaborador Pleno (Bruno)

**Login:** `colab5.teste@deapdi-test.local` / `Colab@2025!`

**Testes Recomendados:**
1. ✅ Ver mentoria com Juliana (1 sessão realizada)
2. ✅ Ver aplicação do framework SPIN Selling
3. ✅ Ver tarefa "Migrar leads CRM" em andamento
4. ✅ Solicitar ser mentor de Ana (nova solicitação)
5. ✅ Ver competências pleno (notas 4-5)
6. ✅ Ver check-in positivo

**Resultado Esperado:**
- Mentoria ativa com Juliana
- Tarefa crítica em andamento
- 1 solicitação recebida de mentoria
- Competências evoluídas

---

### 🎭 Persona 10: Colaboradora Sr (Juliana)

**Login:** `colab6.teste@deapdi-test.local` / `Colab@2025!`

**Testes Recomendados:**
1. ✅ Ver 2 solicitações de mentoria pendentes
2. ✅ Aceitar/rejeitar solicitação de Marina
3. ✅ Ver Bruno como mentorado ativo
4. ✅ Ver tarefa "Configurar pipelines CRM"
5. ✅ Ver conquista "Mentor Expert" desbloqueada
6. ✅ Ver competências sênior (todas nota 5)
7. ✅ Ver check-in excelente (humor 9)
8. ✅ Ver pontos acumulados (380 pts - maior da equipe)

**Resultado Esperado:**
- Top performer da equipe
- 1 mentorado ativo + 2 solicitações
- Conquista de mentoria desbloqueada
- Competências máximas
- Bem-estar mental excelente

---

## 🎯 CENÁRIOS DE TESTE END-TO-END

### Cenário 1: Fluxo Completo de PDI

1. **Carlos** cria novo PDI
2. Sistema notifica **Gabriela**
3. **Gabriela** valida o PDI
4. Sistema notifica **Carlos**
5. **Carlos** atualiza tarefa do PDI
6. **Gabriela** acompanha progresso
7. PDI é marcado como concluído
8. Pontos são atribuídos a Carlos

---

### Cenário 2: Fluxo de Mentoria

1. **Ana** solicita mentoria para **Bruno**
2. **Bruno** recebe notificação
3. **Bruno** aceita a solicitação
4. Sistema cria mentoria ativa
5. **Bruno** agenda primeira sessão
6. Ambos recebem notificações
7. Após sessão, **Bruno** adiciona feedback
8. **Ana** visualiza progresso

---

### Cenário 3: Fluxo de Grupo de Ação

1. **Gabriela** cria novo grupo
2. Adiciona **Carlos**, **Marina**, **Pedro**
3. Todos recebem notificação de convite
4. **Gabriela** cria tarefas e atribui
5. Colaboradores recebem notificações
6. **Marina** marca tarefa como concluída
7. **Gabriela** acompanha progresso
8. Sistema calcula % de conclusão

---

### Cenário 4: Alerta de Saúde Mental

1. **Ana** faz check-in com estresse 7/10
2. Sistema detecta padrão de risco
3. **Rita** (RH) recebe alerta
4. **Rita** visualiza histórico de Ana
5. **Rita** agenda sessão de psicologia
6. **Ana** recebe notificação de agendamento
7. **Rita** acompanha evolução nos próximos check-ins

---

## 📊 MÉTRICAS DE SUCESSO

Após completar todos os testes, você deve conseguir:

### ✅ Métricas de Sistema

- [ ] 100% dos usuários conseguem fazer login
- [ ] 100% dos perfis foram criados corretamente
- [ ] 100% das relações hierárquicas funcionam (gestor-colaborador)
- [ ] 0 erros de permissão RLS

### ✅ Métricas de Dados

- [ ] 10 usuários ativos no sistema
- [ ] 12-18 PDIs criados
- [ ] 18-30 competências avaliadas
- [ ] 2 grupos de ação ativos
- [ ] 4-6 solicitações de mentoria
- [ ] 6-12 check-ins registrados
- [ ] 15-20 notificações geradas

### ✅ Métricas de Experiência

- [ ] Todos os dashboards carregam < 2s
- [ ] Notificações aparecem em tempo real
- [ ] Navegação é intuitiva em todos os perfis
- [ ] Dados são consistentes entre views

---

## 🚨 TROUBLESHOOTING

### Problema: "Email already registered"

**Solução:**
1. Verifique se o usuário já existe no Dashboard Auth
2. Delete o usuário existente
3. Tente criar novamente

---

### Problema: "UUID not found" ao executar SQL

**Solução:**
1. Verifique se substituiu TODOS os UUIDs
2. Use Find & Replace no editor
3. Busque por `UUID_` e veja se restou algum

---

### Problema: Foreign key violation em `manager_id`

**Solução:**
1. Crie os gestores ANTES dos colaboradores
2. Verifique se o UUID do gestor existe
3. Execute INSERTs na ordem: Admin → RH → Gestores → Colaboradores

---

### Problema: Notificações não aparecem

**Solução:**
1. Verifique se `profile_id` está correto
2. Teste query: `SELECT * FROM notifications WHERE profile_id = 'UUID'`
3. Verifique se RLS permite leitura

---

### Problema: Check-in não salva

**Solução:**
1. Verifique constraint de UNIQUE(employee_id, checkin_date)
2. Não pode ter 2 check-ins no mesmo dia
3. Use datas diferentes para testes

---

## 📝 NOTAS FINAIS

### Lembre-se de:

1. **Documentar os UUIDs** - Você vai precisar deles!
2. **Executar queries de validação** - Confirme que tudo funcionou
3. **Testar login de cada perfil** - Garanta que Auth está OK
4. **Explorar o sistema** - Use os cenários de teste
5. **Anotar bugs encontrados** - Para corrigir depois

### Próximos Passos:

Após validar os dados de teste:

1. [ ] Executar testes E2E automatizados (Cypress)
2. [ ] Testar fluxos críticos manualmente
3. [ ] Validar performance com carga
4. [ ] Documentar casos de uso reais
5. [ ] Preparar para UAT (User Acceptance Testing)

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Todos os 10 usuários criados e validados
- [ ] Todos os dados de teste inseridos
- [ ] Todas as queries de validação executadas com sucesso
- [ ] Pelo menos 5 personas testadas manualmente
- [ ] Pelo menos 2 cenários end-to-end validados
- [ ] Troubleshooting documentado (se necessário)
- [ ] Sistema pronto para validação formal

---

**Data de Criação:** 2025-10-22  
**Última Atualização:** 2025-10-22  
**Versão:** 1.0  
**Responsável:** Background Agent  

---

**🎉 BOA SORTE COM OS TESTES! 🎉**
