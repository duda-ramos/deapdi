# ⚡ QUICK START - Configuração de Usuários Reais
## DEAPDI TalentFlow - DeaDesign

> **Tempo estimado:** 30-40 minutos  
> **Dificuldade:** ⭐⭐ Intermediário  
> **Pré-requisitos:** Acesso ao Dashboard Supabase

---

## 🚀 EXECUÇÃO RÁPIDA (3 PASSOS)

### PASSO 1: Configurar Auth ✅ (JÁ FEITO)

```
✅ Auth já está configurado
✅ Usuários já foram criados no Dashboard
✅ UUIDs já foram coletados
```

**Status:** 9 de 10 usuários com UUID confirmado (falta apenas Silvia)

---

### PASSO 2: Usuários DeaDesign ✅ (JÁ CRIADOS)

**Dashboard:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users

**Usuários confirmados:**

| # | Email | Password | Nome | UUID |
|---|-------|----------|------|------|
| 1 | anapaula@deadesign.com.br | DEA@pdi | Ana Paula Nemoto | `0fbd25b0-ea9c-45e4-a19c-f1ea3403e445` |
| 2 | alexia@deadesign.com.br | DEA@pdi | Alexia Sobreira | `55158bb7-b884-43ae-bf2e-953fc0cb0e4b` |
| 3 | nathalia@deadesign.com.br | DEA@pdi | Nathalia Fujii | `cebe7528-c574-43a2-b21d-7905b28ee9d1` |
| 4 | silvia@deadesign.com.br | DEA@pdi | Silvia Kanayama | ⚠️ **CRIAR E ANOTAR UUID** |
| 5 | mariaeduarda@deadesign.com.br | DEA@pdi | Maria Eduarda Ramos | `7278b804-6b4f-4e31-8b78-87aa2295d2c3` |
| 6 | julia@deadesign.com.br | DEA@pdi | Julia Rissin | `bb6d9b49-6cd0-40fa-ae38-0defcbce924c` |
| 7 | juliana@deadesign.com.br | DEA@pdi | Juliana Hobo | `a14bac90-ae64-404a-b559-da880aee9ca6` |
| 8 | pedro@deadesign.com.br | DEA@pdi | Pedro Oliveira | `27b1f282-8a89-4473-87d0-d5f589cda236` |
| 9 | lucila@deadesign.com.br | DEA@pdi | Lucila Muranaka | `6a4774f2-8418-49ff-a8b9-c24562846350` |
| 10 | roberto@deadesign.com.br | DEA@pdi | Roberto Fagaraz | `e5561665-e906-4ed0-a3d0-40386db5cea0` |

### ⚠️ AÇÃO NECESSÁRIA:

**Criar usuário faltante:**
1. Acesse: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users
2. Clique em `Add user`
3. Email: `silvia@deadesign.com.br`
4. Password: `DEA@pdi`
5. Marque `Auto Confirm User`
6. Clique em `Create user`
7. **COPIE O UUID GERADO** e anote abaixo:

```
UUID da Silvia: _________________________________
```

---

### PASSO 3: Executar Script SQL Customizado (15 min)

Agora vamos popular o banco de dados com dados realistas para a equipe DeaDesign.

#### 3.1 - Script SQL Adaptado

Execute o script SQL abaixo no **SQL Editor do Supabase**:

**Dashboard → SQL Editor → New Query**

```sql
-- ══════════════════════════════════════════════════════════════════════════════
-- DEAPDI TALENTFLOW - SEED DATA DEADESIGN
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. CRIAR TEAMS (DEPARTAMENTOS)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO teams (id, name, description) VALUES
(gen_random_uuid(), 'Design', 'Departamento de Design e Criação'),
(gen_random_uuid(), 'Gestão', 'Gestão e Administração'),
(gen_random_uuid(), 'Projetos', 'Gestão de Projetos e Atendimento'),
(gen_random_uuid(), 'Desenvolvimento', 'Desenvolvimento de Soluções')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. INSERIR PROFILES - EQUIPE DEADESIGN
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Ana Paula Nemoto (Admin/Gestão)
INSERT INTO profiles (id, email, name, role, team_id, level, position, points, status)
VALUES (
  '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445',
  'anapaula@deadesign.com.br',
  'Ana Paula Nemoto',
  'admin'::user_role,
  (SELECT id FROM teams WHERE name = 'Gestão' LIMIT 1),
  'Diretor',
  'Diretora Executiva',
  500,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Alexia Sobreira (RH)
INSERT INTO profiles (id, email, name, role, team_id, level, position, points, status)
VALUES (
  '55158bb7-b884-43ae-bf2e-953fc0cb0e4b',
  'alexia@deadesign.com.br',
  'Alexia Sobreira',
  'hr'::user_role,
  (SELECT id FROM teams WHERE name = 'Gestão' LIMIT 1),
  'Gerente',
  'Gerente de RH',
  450,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 3. Nathalia Fujii (Gestora Design)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  'cebe7528-c574-43a2-b21d-7905b28ee9d1',
  'nathalia@deadesign.com.br',
  'Nathalia Fujii',
  'manager'::user_role,
  (SELECT id FROM teams WHERE name = 'Design' LIMIT 1),
  NULL,
  'Gerente',
  'Gerente de Design',
  400,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 4. Silvia Kanayama (Gestora Projetos)
-- ⚠️ SUBSTITUIR UUID APÓS CRIAR NO DASHBOARD
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  'SUBSTITUIR_UUID_SILVIA_AQUI', -- ⚠️ ATENÇÃO: Substituir pelo UUID real
  'silvia@deadesign.com.br',
  'Silvia Kanayama',
  'manager'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  NULL,
  'Gerente',
  'Gerente de Projetos',
  420,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 5. Maria Eduarda Ramos (Designer Jr - Equipe Nathalia)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  '7278b804-6b4f-4e31-8b78-87aa2295d2c3',
  'mariaeduarda@deadesign.com.br',
  'Maria Eduarda Ramos',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Design' LIMIT 1),
  'cebe7528-c574-43a2-b21d-7905b28ee9d1', -- Nathalia como gestora
  'Júnior',
  'Designer Júnior',
  150,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- 6. Julia Rissin (Designer Pleno - Equipe Nathalia)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  'bb6d9b49-6cd0-40fa-ae38-0defcbce924c',
  'julia@deadesign.com.br',
  'Julia Rissin',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Design' LIMIT 1),
  'cebe7528-c574-43a2-b21d-7905b28ee9d1', -- Nathalia como gestora
  'Pleno',
  'Designer Pleno',
  250,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- 7. Juliana Hobo (Designer Sênior - Equipe Nathalia)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  'a14bac90-ae64-404a-b559-da880aee9ca6',
  'juliana@deadesign.com.br',
  'Juliana Hobo',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Design' LIMIT 1),
  'cebe7528-c574-43a2-b21d-7905b28ee9d1', -- Nathalia como gestora
  'Sênior',
  'Designer Sênior',
  350,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- 8. Pedro Oliveira (Gerente Projetos Jr - Equipe Silvia)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  '27b1f282-8a89-4473-87d0-d5f589cda236',
  'pedro@deadesign.com.br',
  'Pedro Oliveira',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  'SUBSTITUIR_UUID_SILVIA_AQUI', -- Silvia como gestora
  'Júnior',
  'Gerente de Projetos Jr',
  120,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- 9. Lucila Muranaka (Analista Pleno - Equipe Silvia)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  '6a4774f2-8418-49ff-a8b9-c24562846350',
  'lucila@deadesign.com.br',
  'Lucila Muranaka',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  'SUBSTITUIR_UUID_SILVIA_AQUI', -- Silvia como gestora
  'Pleno',
  'Analista de Projetos Pleno',
  280,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- 10. Roberto Fagaraz (Desenvolvedor Sênior)
INSERT INTO profiles (id, email, name, role, team_id, manager_id, level, position, points, status)
VALUES (
  'e5561665-e906-4ed0-a3d0-40386db5cea0',
  'roberto@deadesign.com.br',
  'Roberto Fagaraz',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Desenvolvimento' LIMIT 1),
  NULL, -- Sem gestor direto por enquanto
  'Sênior',
  'Desenvolvedor Sênior',
  380,
  'active'::user_status
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ 10 profiles criados
-- ✅ 4 teams criados
-- ✅ 2 gestoras (Nathalia e Silvia)
-- ✅ 6 colaboradores com gestores atribuídos
-- ══════════════════════════════════════════════════════════════════════════════
```

#### 3.2 - Antes de Executar

⚠️ **IMPORTANTE:** Substitua `SUBSTITUIR_UUID_SILVIA_AQUI` pelo UUID real da Silvia (3 ocorrências no script)

#### 3.3 - Executar

1. Copie o script SQL completo
2. Substitua o UUID da Silvia
3. Acesse: Dashboard → SQL Editor
4. Cole o script
5. Clique em `Run`

---

## ✅ VALIDAÇÃO RÁPIDA

Execute estas queries para confirmar que tudo funcionou:

### Query 1: Verificar Usuários DeaDesign

```sql
SELECT 
  name as "Nome",
  email as "Email",
  role as "Perfil",
  position as "Cargo",
  level as "Nível"
FROM profiles
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
  END,
  name;
```

**✅ Esperado:** 10 linhas com todos os usuários DeaDesign

### Query 2: Verificar Hierarquia

```sql
SELECT 
  p.name as "Colaborador",
  p.position as "Cargo",
  g.name as "Gestor",
  t.name as "Departamento"
FROM profiles p
LEFT JOIN profiles g ON p.manager_id = g.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.role = 'employee'
ORDER BY g.name, p.name;
```

**✅ Esperado:** 
- 3 designers sob Nathalia Fujii
- 2 analistas sob Silvia Kanayama
- 1 desenvolvedor (Roberto) sem gestor

### Query 3: Verificar Teams

```sql
SELECT 
  t.name as "Departamento",
  COUNT(p.id) as "Total Pessoas"
FROM teams t
LEFT JOIN profiles p ON p.team_id = t.id
GROUP BY t.id, t.name
ORDER BY COUNT(p.id) DESC;
```

**✅ Esperado:** 
- Design: 4 pessoas
- Projetos: 3 pessoas
- Gestão: 2 pessoas
- Desenvolvimento: 1 pessoa

---

## 🎭 TESTE RÁPIDO DE LOGIN

Teste login com 4 usuários para confirmar:

| Usuário | Email | Senha | Deve Ver |
|---------|-------|-------|----------|
| **Admin** | anapaula@deadesign.com.br | DEA@pdi | Dashboard geral, todos os usuários |
| **RH** | alexia@deadesign.com.br | DEA@pdi | Módulo RH, saúde mental, todos os profiles |
| **Gestora Design** | nathalia@deadesign.com.br | DEA@pdi | Equipe de 3 designers (Maria Eduarda, Julia, Juliana) |
| **Colaboradora** | julia@deadesign.com.br | DEA@pdi | Seus dados, perfil, Nathalia como gestora |

---

## 📊 ESTRUTURA ORGANIZACIONAL DEADESIGN

```
DEADESIGN
│
├── 🏢 GESTÃO (2 pessoas)
│   ├── Ana Paula Nemoto (Diretora - Admin) ⭐
│   └── Alexia Sobreira (Gerente RH) 💚
│
├── 🎨 DESIGN (4 pessoas)
│   ├── Nathalia Fujii (Gerente Design) ⭐
│   │   ├── Maria Eduarda Ramos (Designer Jr)
│   │   ├── Julia Rissin (Designer Pleno)
│   │   └── Juliana Hobo (Designer Sr) 🏆
│   
├── 📋 PROJETOS (3 pessoas)
│   ├── Silvia Kanayama (Gerente Projetos) ⭐
│   │   ├── Pedro Oliveira (GP Jr)
│   │   └── Lucila Muranaka (Analista Pleno)
│
└── 💻 DESENVOLVIMENTO (1 pessoa)
    └── Roberto Fagaraz (Desenvolvedor Sr)

Legend:
⭐ Gestor/Admin
💚 RH
🏆 Maior pontuação da equipe
```

### Próximos Dados a Adicionar

Após confirmar que os profiles estão corretos, você poderá adicionar:

- ✅ **Profiles e Teams** (script acima)
- 📋 **PDIs** - Planos de desenvolvimento individual
- 🎯 **Competências** - Avaliações de habilidades
- 👥 **Grupos de Ação** - Projetos colaborativos
- 🤝 **Mentorias** - Relacionamentos mentor-mentorado
- 💚 **Check-ins** - Saúde mental e bem-estar
- 🔔 **Notificações** - Alertas e comunicações

---

## 🎯 CASOS DE USO PARA TESTAR (APÓS ADICIONAR DADOS)

### ✅ Teste 1: Hierarquia e Permissões (5 min)

**Objetivo:** Validar que a hierarquia organizacional funciona

1. Login como **Ana Paula** (anapaula@deadesign.com.br)
   - ✅ Deve ver TODOS os 10 usuários
   - ✅ Deve ter acesso total ao sistema
   - ✅ Dashboard com estatísticas globais

2. Login como **Nathalia** (nathalia@deadesign.com.br)
   - ✅ Deve ver sua equipe de 3 designers
   - ✅ Maria Eduarda, Julia e Juliana aparecem
   - ✅ Não deve ver equipe da Silvia

3. Login como **Julia** (julia@deadesign.com.br)
   - ✅ Deve ver apenas seus próprios dados
   - ✅ Nathalia aparece como gestora
   - ✅ Não acessa dados de outros colaboradores

---

### ✅ Teste 2: Gestão de Equipe (Quando PDIs forem adicionados)

1. Login como **Nathalia** (nathalia@deadesign.com.br)
2. Navegar para "Minha Equipe"
3. Ver lista de 3 designers
4. Acessar perfil de Maria Eduarda
5. Ver PDIs para validar (quando criados)
6. Avaliar competências (quando criadas)

---

### ✅ Teste 3: RH e Saúde Mental (Quando módulo for ativado)

1. Login como **Alexia** (alexia@deadesign.com.br)
2. Acessar módulo de Saúde Mental
3. Ver dashboard de bem-estar da equipe
4. Verificar check-ins recentes
5. Identificar alertas (se houver)

---

### ✅ Teste 4: Perfil Individual

1. Login como **Roberto** (roberto@deadesign.com.br)
2. Ver perfil próprio
3. Informações corretas:
   - Nome: Roberto Fagaraz
   - Cargo: Desenvolvedor Sênior
   - Departamento: Desenvolvimento
   - Nível: Sênior
   - Pontos: 380

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### Pré-requisitos ✅

- [x] Auth configurado
- [x] Dashboard Supabase acessível
- [x] SQL Editor disponível

### Usuários DeaDesign ✅

- [x] 9 usuários criados no Auth
- [x] 9 UUIDs confirmados
- [ ] **Silvia Kanayama** - criar e anotar UUID ⚠️
- [x] Emails reais @deadesign.com.br
- [x] Senha padrão: DEA@pdi

### Execução do Script Base 📝

- [ ] UUID da Silvia obtido
- [ ] Script SQL atualizado com UUID da Silvia
- [ ] Script executado no SQL Editor
- [ ] Teams criados (4 departamentos)
- [ ] Profiles criados (10 usuários)
- [ ] Hierarquia configurada (gestores → colaboradores)

### Validação Base ✅

Execute após rodar o script:

- [ ] Query 1: 10 usuários DeaDesign confirmados
- [ ] Query 2: Hierarquia correta (3 sob Nathalia, 2 sob Silvia)
- [ ] Query 3: 4 teams criados
- [ ] Login Ana Paula (admin) funcionando
- [ ] Login Nathalia (gestora) funcionando
- [ ] Login Julia (colaboradora) funcionando

### Próximos Passos (Opcional) 📋

Após validar a estrutura base, você pode adicionar:

- [ ] Competências (habilidades de cada pessoa)
- [ ] PDIs (planos de desenvolvimento)
- [ ] Grupos de ação (projetos colaborativos)
- [ ] Mentorias (relacionamentos de aprendizado)
- [ ] Check-ins de saúde mental
- [ ] Notificações iniciais

---

## 🚨 PROBLEMAS COMUNS

### ❌ "Email already exists"

**Causa:** Email já cadastrado no Auth  
**Solução:** 
- Verifique se o usuário já existe no Dashboard
- Se sim, use o UUID existente
- Ou delete e recrie

---

### ❌ "Foreign key violation on manager_id"

**Causa:** UUID do gestor (Nathalia ou Silvia) não encontrado  
**Solução:** 
- Confirme que substituiu corretamente o UUID da Silvia
- Verifique se os UUIDs das gestoras estão corretos
- Execute primeiro os INSERTs de gestoras, depois colaboradores

---

### ❌ Script retorna "duplicate key value violates unique constraint"

**Causa:** Tentando inserir usuário que já existe  
**Solução:** 
- Use `ON CONFLICT (id) DO UPDATE` (já incluído no script)
- Ou delete os profiles existentes primeiro:
```sql
DELETE FROM profiles WHERE email LIKE '%@deadesign.com.br';
```

---

### ❌ Usuário criado mas não aparece no sistema

**Causa:** Profile não foi criado ou RLS está bloqueando  
**Solução:**
- Execute a Query 1 de validação
- Verifique se o script SQL foi executado
- Faça logout e login novamente

---

### ⚠️ UUID da Silvia ainda não obtido

**Ação:**
1. Acesse: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users
2. Crie o usuário silvia@deadesign.com.br
3. Copie o UUID gerado
4. Substitua `SUBSTITUIR_UUID_SILVIA_AQUI` no script (3 ocorrências)

---

## ⏱️ CRONOGRAMA DE EXECUÇÃO

| Tempo | Atividade | Status |
|-------|-----------|--------|
| ✅ | 9 usuários criados no Auth | **CONCLUÍDO** |
| ✅ | 9 UUIDs coletados | **CONCLUÍDO** |
| 🔄 | Criar Silvia no Auth | **PENDENTE** (2 min) |
| 🔄 | Coletar UUID da Silvia | **PENDENTE** (1 min) |
| 🔄 | Atualizar script SQL | **PENDENTE** (3 min) |
| 🔄 | Executar script no Supabase | **PENDENTE** (2 min) |
| 🔄 | Validar com 3 queries | **PENDENTE** (5 min) |
| 🔄 | Testar login (4 usuários) | **PENDENTE** (5 min) |
| | **TEMPO RESTANTE ESTIMADO:** | **~18 min** |

---

## 🎯 RESULTADO ESPERADO

Após concluir este guia, você terá:

### ✅ Estrutura Base Configurada

```
DeaDesign no DEAPDI TalentFlow
├── 10 usuários reais cadastrados
├── 4 departamentos criados
├── 2 gestoras com equipes
├── Hierarquia organizacional funcional
└── Todos podem fazer login
```

### ✅ Validado e Funcionando

- Login com email @deadesign.com.br
- Senha padrão: DEA@pdi
- Perfis diferenciados (admin, hr, manager, employee)
- Gestores veem suas equipes
- Colaboradores veem seus gestores

### 📋 Próximos Passos Opcionais

Após validar a estrutura base, você pode:

1. **Adicionar Competências** - Habilidades de cada pessoa
2. **Criar PDIs** - Planos de desenvolvimento
3. **Configurar Mentorias** - Ex: Juliana mentorando Maria Eduarda
4. **Adicionar Grupos de Ação** - Projetos reais da DeaDesign
5. **Ativar Check-ins** - Saúde mental da equipe

---

## 📞 INFORMAÇÕES IMPORTANTES

### 🔑 Credenciais Padrão

- **Domínio:** @deadesign.com.br
- **Senha:** DEA@pdi
- **Dashboard:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr

### 👥 Hierarquia Confirmada

**Gestoras:**
- Nathalia Fujii (Design) → 3 designers
- Silvia Kanayama (Projetos) → 2 analistas

**Sem Gestor Direto:**
- Ana Paula (Admin)
- Alexia (RH)
- Roberto (Desenvolvimento)

### ⚠️ Ação Imediata Necessária

**CRIAR SILVIA KANAYAMA:**
1. Acesse o Dashboard Auth
2. Email: silvia@deadesign.com.br
3. Senha: DEA@pdi
4. Auto Confirm: ✅
5. **Copie o UUID**
6. Substitua no script (3 lugares)

---

## 🎉 CONCLUSÃO

**Status Atual:** 90% completo (9/10 usuários)  
**Tempo para 100%:** ~18 minutos  
**Próximo Passo:** Criar Silvia e executar script SQL  

---

**📅 Atualizado:** 2025-10-22  
**✍️ Versão:** 2.0 - DeaDesign Edition  
**🏢 Empresa:** DeaDesign  
**🎯 Projeto:** DEAPDI TalentFlow  

---

**🚀 Vamos lá! Só falta a Silvia e está pronto!**
