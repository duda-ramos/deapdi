-- ══════════════════════════════════════════════════════════════════════════════
-- DEAPDI TALENTFLOW - SCRIPT DE CRIAÇÃO DE USUÁRIOS DE TESTE
-- ══════════════════════════════════════════════════════════════════════════════
--
-- IMPORTANTE: Este script deve ser executado APÓS a criação dos usuários no Auth
-- 
-- CONFIGURAÇÃO AUTH RECOMENDADA (Opção A):
-- ========================================
-- Dashboard: https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/settings
-- 1. Navegue até "Email" settings
-- 2. Encontre "Enable email confirmations"
-- 3. DESABILITE temporariamente (permite criar usuários sem validar email)
-- 4. Salve as alterações
--
-- ESTRUTURA DO SCRIPT:
-- ===================
-- Parte 1: Variáveis de UUIDs (preencher após criar no Dashboard)
-- Parte 2: Inserir profiles (10 usuários)
-- Parte 3: Inserir teams (2 departamentos)
-- Parte 4: Inserir competências base
-- Parte 5: Inserir PDIs com objetivos (12-18 PDIs)
-- Parte 6: Inserir avaliações de competências (18-30 avaliações)
-- Parte 7: Inserir grupos de ação e tarefas (2 grupos)
-- Parte 8: Inserir solicitações de mentoria (4-6 solicitações)
-- Parte 9: Inserir check-ins de saúde mental (6-12 check-ins)
-- Parte 10: Inserir notificações (15-20 notificações)
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- PARTE 1: CRIAR USUÁRIOS NO AUTH (VIA DASHBOARD)
-- ──────────────────────────────────────────────────────────────────────────────
--
-- ⚠️ EXECUTAR VIA DASHBOARD PRIMEIRO:
-- Dashboard → Auth → Users → Add user
-- Para cada usuário abaixo:
--   1. Clique em "Add user"
--   2. Preencha Email e Password
--   3. MARQUE "Auto Confirm User" (se confirmação está desabilitada)
--   4. Clique em "Create user"
--   5. COPIE o UUID gerado
--
-- CREDENCIAIS DOS USUÁRIOS:
-- ═════════════════════════════════════════════════════════════════════════════
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. ADMIN                                                                    │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: admin.teste@deapdi-test.local                                        │
-- │ Senha: Admin@2025!                                                          │
-- │ Nome: Alexandre Administrador                                               │
-- │ CPF: 123.456.789-09                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. RH                                                                       │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: rh.teste@deapdi-test.local                                           │
-- │ Senha: RH@2025!                                                             │
-- │ Nome: Rita Recursos Humanos                                                 │
-- │ CPF: 234.567.890-10                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. GESTOR MARKETING                                                         │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: gestor1.teste@deapdi-test.local                                      │
-- │ Senha: Gestor@2025!                                                         │
-- │ Nome: Gabriela Gestora Marketing                                            │
-- │ CPF: 345.678.901-21                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 4. GESTOR VENDAS                                                            │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: gestor2.teste@deapdi-test.local                                      │
-- │ Senha: Gestor@2025!                                                         │
-- │ Nome: Gustavo Gestor Vendas                                                 │
-- │ CPF: 456.789.012-32                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 5. COLABORADOR MARKETING 1                                                  │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: colab1.teste@deapdi-test.local                                       │
-- │ Senha: Colab@2025!                                                          │
-- │ Nome: Carlos Colaborador Marketing                                          │
-- │ CPF: 567.890.123-43                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 6. COLABORADOR MARKETING 2                                                  │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: colab2.teste@deapdi-test.local                                       │
-- │ Senha: Colab@2025!                                                          │
-- │ Nome: Marina Colaboradora Marketing                                         │
-- │ CPF: 678.901.234-54                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 7. COLABORADOR MARKETING 3                                                  │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: colab3.teste@deapdi-test.local                                       │
-- │ Senha: Colab@2025!                                                          │
-- │ Nome: Pedro Colaborador Marketing                                           │
-- │ CPF: 789.012.345-65                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 8. COLABORADOR VENDAS 1                                                     │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: colab4.teste@deapdi-test.local                                       │
-- │ Senha: Colab@2025!                                                          │
-- │ Nome: Ana Colaboradora Vendas                                               │
-- │ CPF: 890.123.456-76                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 9. COLABORADOR VENDAS 2                                                     │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: colab5.teste@deapdi-test.local                                       │
-- │ Senha: Colab@2025!                                                          │
-- │ Nome: Bruno Colaborador Vendas                                              │
-- │ CPF: 901.234.567-87                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 10. COLABORADOR VENDAS 3                                                    │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: colab6.teste@deapdi-test.local                                       │
-- │ Senha: Colab@2025!                                                          │
-- │ Nome: Juliana Colaboradora Vendas                                           │
-- │ CPF: 012.345.678-98                                                         │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- PASSO 1: PREENCHER OS UUIDs APÓS CRIAR NO DASHBOARD
-- ──────────────────────────────────────────────────────────────────────────────
--
-- ⚠️ SUBSTITUIR OS VALORES ABAIXO PELOS UUIDs REAIS:
--
-- DO $$ 
-- DECLARE
--   UUID_ADMIN uuid := '00000000-0000-0000-0000-000000000001'; -- ← SUBSTITUIR
--   UUID_RH uuid := '00000000-0000-0000-0000-000000000002'; -- ← SUBSTITUIR
--   UUID_GESTOR1 uuid := '00000000-0000-0000-0000-000000000003'; -- ← SUBSTITUIR
--   UUID_GESTOR2 uuid := '00000000-0000-0000-0000-000000000004'; -- ← SUBSTITUIR
--   UUID_COLAB1 uuid := '00000000-0000-0000-0000-000000000005'; -- ← SUBSTITUIR
--   UUID_COLAB2 uuid := '00000000-0000-0000-0000-000000000006'; -- ← SUBSTITUIR
--   UUID_COLAB3 uuid := '00000000-0000-0000-0000-000000000007'; -- ← SUBSTITUIR
--   UUID_COLAB4 uuid := '00000000-0000-0000-0000-000000000008'; -- ← SUBSTITUIR
--   UUID_COLAB5 uuid := '00000000-0000-0000-0000-000000000009'; -- ← SUBSTITUIR
--   UUID_COLAB6 uuid := '00000000-0000-0000-0000-000000000010'; -- ← SUBSTITUIR
--
-- (Comentado para evitar execução acidental - descomentar e preencher os UUIDs)
--
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 2: INSERIR TEAMS (DEPARTAMENTOS)
-- ══════════════════════════════════════════════════════════════════════════════

-- Criar departamentos (teams são referenciados em profiles)
INSERT INTO teams (id, name, description) VALUES
(gen_random_uuid(), 'Marketing', 'Departamento de Marketing e Comunicação'),
(gen_random_uuid(), 'Vendas', 'Departamento Comercial e Vendas'),
(gen_random_uuid(), 'TI', 'Departamento de Tecnologia da Informação'),
(gen_random_uuid(), 'RH', 'Recursos Humanos');

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 3: INSERIR PROFILES
-- ══════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ IMPORTANTE: Substituir os UUIDs abaixo pelos valores reais do Auth!
--
-- TEMPLATE POR USUÁRIO:
-- ────────────────────────────────────────────────────────────────────────────
--
-- INSERT INTO profiles (
--   id,                    -- UUID do auth.users
--   email,
--   name,
--   role,                  -- 'admin' | 'hr' | 'manager' | 'employee'
--   team_id,               -- UUID do time
--   manager_id,            -- UUID do gestor (NULL para admin/hr/gestores)
--   level,                 -- Nível hierárquico
--   position,              -- Cargo
--   points,
--   bio,
--   status,
--   created_at,
--   updated_at
-- ) VALUES (
--   'UUID_DO_AUTH',
--   'email@dominio.com',
--   'Nome Completo',
--   'role'::user_role,
--   (SELECT id FROM teams WHERE name = 'Departamento'),
--   NULL,
--   'Nível',
--   'Cargo',
--   0,
--   'Bio do usuário',
--   'active'::user_status,
--   NOW(),
--   NOW()
-- );
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ADMIN
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID ABAIXO
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_ADMIN_AQUI', -- ← SUBSTITUIR
  'admin.teste@deapdi-test.local',
  'Alexandre Administrador',
  'admin'::user_role,
  (SELECT id FROM teams WHERE name = 'TI'),
  NULL,
  'Diretor',
  'Diretor de TI',
  500,
  'Responsável pela gestão da plataforma e administração do sistema.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 2. RH
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID ABAIXO
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_RH_AQUI', -- ← SUBSTITUIR
  'rh.teste@deapdi-test.local',
  'Rita Recursos Humanos',
  'hr'::user_role,
  (SELECT id FROM teams WHERE name = 'RH'),
  NULL,
  'Gerente',
  'Gerente de RH',
  450,
  'Responsável pela gestão de pessoas, desenvolvimento organizacional e saúde mental.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 3. GESTOR MARKETING
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID ABAIXO
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_GESTOR1_AQUI', -- ← SUBSTITUIR
  'gestor1.teste@deapdi-test.local',
  'Gabriela Gestora Marketing',
  'manager'::user_role,
  (SELECT id FROM teams WHERE name = 'Marketing'),
  NULL,
  'Gerente',
  'Gerente de Marketing',
  400,
  'Gerente de marketing com experiência em estratégias digitais e gestão de equipes.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 4. GESTOR VENDAS
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID ABAIXO
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_GESTOR2_AQUI', -- ← SUBSTITUIR
  'gestor2.teste@deapdi-test.local',
  'Gustavo Gestor Vendas',
  'manager'::user_role,
  (SELECT id FROM teams WHERE name = 'Vendas'),
  NULL,
  'Gerente',
  'Gerente Comercial',
  420,
  'Gestor comercial com foco em resultados e desenvolvimento da equipe de vendas.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 5. COLABORADOR MARKETING 1
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs ABAIXO (id e manager_id)
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_COLAB1_AQUI', -- ← SUBSTITUIR
  'colab1.teste@deapdi-test.local',
  'Carlos Colaborador Marketing',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Marketing'),
  'UUID_GESTOR1_AQUI', -- ← SUBSTITUIR (mesmo UUID do gestor 1)
  'Júnior',
  'Analista de Marketing Jr',
  150,
  'Analista júnior focado em crescimento profissional e aprendizado contínuo.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 6. COLABORADOR MARKETING 2
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs ABAIXO (id e manager_id)
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_COLAB2_AQUI', -- ← SUBSTITUIR
  'colab2.teste@deapdi-test.local',
  'Marina Colaboradora Marketing',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Marketing'),
  'UUID_GESTOR1_AQUI', -- ← SUBSTITUIR (mesmo UUID do gestor 1)
  'Pleno',
  'Designer Pleno',
  250,
  'Designer criativa com experiência em branding e identidade visual.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 7. COLABORADOR MARKETING 3
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs ABAIXO (id e manager_id)
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_COLAB3_AQUI', -- ← SUBSTITUIR
  'colab3.teste@deapdi-test.local',
  'Pedro Colaborador Marketing',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Marketing'),
  'UUID_GESTOR1_AQUI', -- ← SUBSTITUIR (mesmo UUID do gestor 1)
  'Sênior',
  'Social Media Sr',
  350,
  'Especialista em redes sociais com foco em engajamento e crescimento de audiência.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 8. COLABORADOR VENDAS 1
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs ABAIXO (id e manager_id)
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_COLAB4_AQUI', -- ← SUBSTITUIR
  'colab4.teste@deapdi-test.local',
  'Ana Colaboradora Vendas',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Vendas'),
  'UUID_GESTOR2_AQUI', -- ← SUBSTITUIR (mesmo UUID do gestor 2)
  'Júnior',
  'SDR Jr',
  120,
  'SDR com foco em prospecção e qualificação de leads.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 9. COLABORADOR VENDAS 2
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs ABAIXO (id e manager_id)
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_COLAB5_AQUI', -- ← SUBSTITUIR
  'colab5.teste@deapdi-test.local',
  'Bruno Colaborador Vendas',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Vendas'),
  'UUID_GESTOR2_AQUI', -- ← SUBSTITUIR (mesmo UUID do gestor 2)
  'Pleno',
  'Account Executive Pleno',
  280,
  'AE com experiência em fechamento de vendas complexas e gestão de contas.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 10. COLABORADOR VENDAS 3
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs ABAIXO (id e manager_id)
/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  team_id,
  manager_id,
  level,
  position,
  points,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  'UUID_COLAB6_AQUI', -- ← SUBSTITUIR
  'colab6.teste@deapdi-test.local',
  'Juliana Colaboradora Vendas',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Vendas'),
  'UUID_GESTOR2_AQUI', -- ← SUBSTITUIR (mesmo UUID do gestor 2)
  'Sênior',
  'Closer Sr',
  380,
  'Closer com alto índice de conversão e expertise em negociações estratégicas.',
  'active'::user_status,
  NOW(),
  NOW()
);
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 4: INSERIR COMPETÊNCIAS BASE (CATALOG)
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Competências genéricas que podem ser atribuídas aos colaboradores
--
-- ⚠️ NOTA: Verificar se as competências devem ser por usuário ou catálogo global
-- ⚠️ A tabela competencies tem profile_id, então são POR USUÁRIO
--
-- Template:
-- ────────────────────────────────────────────────────────────────────────────
-- INSERT INTO competencies (
--   id,
--   name,
--   type,                  -- 'hard' | 'soft'
--   stage,                 -- Estágio da carreira
--   self_rating,           -- 1-5
--   manager_rating,        -- 1-5
--   target_level,          -- 1-5
--   profile_id,
--   created_at,
--   updated_at
-- ) VALUES (...);
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- COMPETÊNCIAS - CARLOS (Marketing Jr)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID_COLAB1_AQUI

/*
INSERT INTO competencies (name, type, stage, self_rating, manager_rating, target_level, profile_id) VALUES
('Google Analytics', 'hard'::competency_type, 'Júnior', 3, 3, 4, 'UUID_COLAB1_AQUI'),
('SEO/SEM', 'hard'::competency_type, 'Júnior', 2, 2, 4, 'UUID_COLAB1_AQUI'),
('Comunicação', 'soft'::competency_type, 'Júnior', 4, 4, 5, 'UUID_COLAB1_AQUI'),
('Trabalho em Equipe', 'soft'::competency_type, 'Júnior', 4, 5, 5, 'UUID_COLAB1_AQUI');
*/

-- ────────────────────────────────────────────────────────────────────────────
-- COMPETÊNCIAS - MARINA (Designer Pleno)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID_COLAB2_AQUI

/*
INSERT INTO competencies (name, type, stage, self_rating, manager_rating, target_level, profile_id) VALUES
('Adobe Creative Suite', 'hard'::competency_type, 'Pleno', 4, 5, 5, 'UUID_COLAB2_AQUI'),
('Figma/Sketch', 'hard'::competency_type, 'Pleno', 5, 5, 5, 'UUID_COLAB2_AQUI'),
('Design Thinking', 'hard'::competency_type, 'Pleno', 3, 4, 5, 'UUID_COLAB2_AQUI'),
('Criatividade', 'soft'::competency_type, 'Pleno', 5, 5, 5, 'UUID_COLAB2_AQUI'),
('Atenção aos Detalhes', 'soft'::competency_type, 'Pleno', 4, 4, 5, 'UUID_COLAB2_AQUI');
*/

-- ────────────────────────────────────────────────────────────────────────────
-- COMPETÊNCIAS - PEDRO (Social Media Sr)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID_COLAB3_AQUI

/*
INSERT INTO competencies (name, type, stage, self_rating, manager_rating, target_level, profile_id) VALUES
('Gestão de Redes Sociais', 'hard'::competency_type, 'Sênior', 5, 5, 5, 'UUID_COLAB3_AQUI'),
('Meta Ads', 'hard'::competency_type, 'Sênior', 4, 5, 5, 'UUID_COLAB3_AQUI'),
('Copywriting', 'hard'::competency_type, 'Sênior', 4, 4, 5, 'UUID_COLAB3_AQUI'),
('Liderança', 'soft'::competency_type, 'Sênior', 3, 4, 5, 'UUID_COLAB3_AQUI'),
('Análise de Métricas', 'soft'::competency_type, 'Sênior', 5, 5, 5, 'UUID_COLAB3_AQUI');
*/

-- ────────────────────────────────────────────────────────────────────────────
-- COMPETÊNCIAS - ANA (SDR Jr)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID_COLAB4_AQUI

/*
INSERT INTO competencies (name, type, stage, self_rating, manager_rating, target_level, profile_id) VALUES
('Prospecção B2B', 'hard'::competency_type, 'Júnior', 3, 3, 5, 'UUID_COLAB4_AQUI'),
('CRM (Salesforce)', 'hard'::competency_type, 'Júnior', 2, 3, 4, 'UUID_COLAB4_AQUI'),
('Comunicação Telefônica', 'soft'::competency_type, 'Júnior', 4, 4, 5, 'UUID_COLAB4_AQUI'),
('Resiliência', 'soft'::competency_type, 'Júnior', 3, 4, 5, 'UUID_COLAB4_AQUI');
*/

-- ────────────────────────────────────────────────────────────────────────────
-- COMPETÊNCIAS - BRUNO (AE Pleno)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID_COLAB5_AQUI

/*
INSERT INTO competencies (name, type, stage, self_rating, manager_rating, target_level, profile_id) VALUES
('Vendas Consultivas', 'hard'::competency_type, 'Pleno', 4, 4, 5, 'UUID_COLAB5_AQUI'),
('Negociação', 'hard'::competency_type, 'Pleno', 4, 5, 5, 'UUID_COLAB5_AQUI'),
('Gestão de Pipeline', 'hard'::competency_type, 'Pleno', 3, 4, 5, 'UUID_COLAB5_AQUI'),
('Persuasão', 'soft'::competency_type, 'Pleno', 5, 5, 5, 'UUID_COLAB5_AQUI'),
('Empatia', 'soft'::competency_type, 'Pleno', 4, 4, 5, 'UUID_COLAB5_AQUI');
*/

-- ────────────────────────────────────────────────────────────────────────────
-- COMPETÊNCIAS - JULIANA (Closer Sr)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUID_COLAB6_AQUI

/*
INSERT INTO competencies (name, type, stage, self_rating, manager_rating, target_level, profile_id) VALUES
('Fechamento de Vendas Complexas', 'hard'::competency_type, 'Sênior', 5, 5, 5, 'UUID_COLAB6_AQUI'),
('Estratégia Comercial', 'hard'::competency_type, 'Sênior', 4, 5, 5, 'UUID_COLAB6_AQUI'),
('Gestão de Contas Estratégicas', 'hard'::competency_type, 'Sênior', 4, 4, 5, 'UUID_COLAB6_AQUI'),
('Liderança', 'soft'::competency_type, 'Sênior', 4, 4, 5, 'UUID_COLAB6_AQUI'),
('Inteligência Emocional', 'soft'::competency_type, 'Sênior', 5, 5, 5, 'UUID_COLAB6_AQUI');
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 5: INSERIR PDIs COM OBJETIVOS (12-18 PDIs)
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Cada colaborador terá 2-3 PDIs:
-- - 1 PDI em andamento (in-progress)
-- - 1 PDI concluído (completed)
-- - 1 PDI aguardando validação (validated) - opcional
--
-- Cada PDI terá tasks (objetivos) vinculados
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- PDIs - CARLOS (Marketing Jr)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs: COLAB1, GESTOR1

/*
-- PDI 1: Em andamento
INSERT INTO pdis (id, title, description, deadline, status, mentor_id, points, created_by, profile_id)
VALUES (
  gen_random_uuid(),
  'Dominar Google Analytics 4',
  'Aprofundar conhecimentos em GA4 para análise de campanhas de marketing digital.',
  CURRENT_DATE + INTERVAL '60 days',
  'in-progress'::pdi_status,
  'UUID_GESTOR1_AQUI', -- Gabriela como mentora
  100,
  'UUID_COLAB1_AQUI',
  'UUID_COLAB1_AQUI'
) RETURNING id;
-- Anotar ID retornado para criar tasks

-- Tarefas do PDI 1 (Carlos)
INSERT INTO tasks (title, description, assignee_id, pdi_id, deadline, status) VALUES
('Completar curso Google Analytics Academy', 'Finalizar módulos do curso oficial', 'UUID_COLAB1_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '30 days', 'in-progress'::task_status),
('Criar dashboard de métricas', 'Montar dashboard customizado no GA4', 'UUID_COLAB1_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '45 days', 'todo'::task_status),
('Apresentar relatório mensal', 'Apresentar análise de tráfego à equipe', 'UUID_COLAB1_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '60 days', 'todo'::task_status);

-- PDI 2: Concluído
INSERT INTO pdis (id, title, description, deadline, status, mentor_id, points, created_by, validated_by, profile_id)
VALUES (
  gen_random_uuid(),
  'Fundamentos de Marketing Digital',
  'Desenvolver conhecimentos básicos de marketing digital e redes sociais.',
  CURRENT_DATE - INTERVAL '30 days',
  'validated'::pdi_status,
  'UUID_GESTOR1_AQUI',
  100,
  'UUID_COLAB1_AQUI',
  'UUID_GESTOR1_AQUI', -- Validado pela Gabriela
  'UUID_COLAB1_AQUI'
) RETURNING id;

-- Tarefas do PDI 2 (Carlos) - todas concluídas
INSERT INTO tasks (title, description, assignee_id, pdi_id, deadline, status) VALUES
('Curso de Introdução ao Marketing Digital', 'Completar curso online', 'UUID_COLAB1_AQUI', 'PDI_ID_AQUI', CURRENT_DATE - INTERVAL '60 days', 'done'::task_status),
('Criar primeira campanha no Facebook Ads', 'Lançar campanha de teste', 'UUID_COLAB1_AQUI', 'PDI_ID_AQUI', CURRENT_DATE - INTERVAL '45 days', 'done'::task_status);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- PDIs - MARINA (Designer Pleno)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs: COLAB2, GESTOR1

/*
-- PDI 1: Em andamento
INSERT INTO pdis (title, description, deadline, status, mentor_id, points, created_by, profile_id)
VALUES (
  'Design System Avançado',
  'Criar e documentar design system completo para a empresa.',
  CURRENT_DATE + INTERVAL '90 days',
  'in-progress'::pdi_status,
  'UUID_GESTOR1_AQUI',
  150,
  'UUID_COLAB2_AQUI',
  'UUID_COLAB2_AQUI'
) RETURNING id;

-- Tarefas PDI Marina
INSERT INTO tasks (title, description, assignee_id, pdi_id, deadline, status) VALUES
('Pesquisar design systems de referência', 'Estudar sistemas como Material Design, Ant Design', 'UUID_COLAB2_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '20 days', 'done'::task_status),
('Definir paleta de cores e tipografia', 'Estabelecer guia de estilo visual', 'UUID_COLAB2_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '40 days', 'in-progress'::task_status),
('Criar biblioteca de componentes no Figma', 'Montar todos os componentes reutilizáveis', 'UUID_COLAB2_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '70 days', 'todo'::task_status),
('Documentar guia de uso', 'Escrever documentação para desenvolvedores', 'UUID_COLAB2_AQUI', 'PDI_ID_AQUI', CURRENT_DATE + INTERVAL '90 days', 'todo'::task_status);

-- PDI 2: Concluído
INSERT INTO pdis (title, description, deadline, status, mentor_id, points, created_by, validated_by, profile_id)
VALUES (
  'UX Research Fundamentals',
  'Desenvolver habilidades de pesquisa com usuários.',
  CURRENT_DATE - INTERVAL '45 days',
  'completed'::pdi_status,
  'UUID_GESTOR1_AQUI',
  100,
  'UUID_COLAB2_AQUI',
  'UUID_GESTOR1_AQUI',
  'UUID_COLAB2_AQUI'
) RETURNING id;

INSERT INTO tasks (title, description, assignee_id, pdi_id, deadline, status) VALUES
('Realizar 5 entrevistas com usuários', 'Conduzir entrevistas de descoberta', 'UUID_COLAB2_AQUI', 'PDI_ID_AQUI', CURRENT_DATE - INTERVAL '60 days', 'done'::task_status),
('Criar personas baseadas em dados', 'Documentar 3 personas principais', 'UUID_COLAB2_AQUI', 'PDI_ID_AQUI', CURRENT_DATE - INTERVAL '50 days', 'done'::task_status);
*/

-- Continuar para os outros colaboradores...
-- (Os demais PDIs seguem o mesmo padrão)

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 6: INSERIR GRUPOS DE AÇÃO E TAREFAS
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- GRUPO 1: Campanha Black Friday (Marketing)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs

/*
INSERT INTO action_groups (id, title, description, deadline, status, created_by)
VALUES (
  gen_random_uuid(),
  'Campanha Black Friday 2025',
  'Planejamento e execução da campanha de Black Friday com foco em redes sociais e email marketing.',
  '2025-11-30'::date,
  'active'::group_status,
  'UUID_GESTOR1_AQUI' -- Gabriela criou
) RETURNING id;
-- Anotar ID do grupo

-- Participantes do grupo
INSERT INTO action_group_participants (group_id, profile_id, role) VALUES
('GRUPO_ID_AQUI', 'UUID_GESTOR1_AQUI', 'leader'),
('GRUPO_ID_AQUI', 'UUID_COLAB1_AQUI', 'member'), -- Carlos
('GRUPO_ID_AQUI', 'UUID_COLAB2_AQUI', 'member'), -- Marina
('GRUPO_ID_AQUI', 'UUID_COLAB3_AQUI', 'member'); -- Pedro

-- Tarefas do grupo
INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status) VALUES
('Definir estratégia de descontos', 'Criar matriz de descontos por categoria de produto', 'UUID_GESTOR1_AQUI', 'GRUPO_ID_AQUI', '2025-10-31'::date, 'done'::task_status),
('Criar artes para redes sociais', 'Produzir 15 posts para Instagram, Facebook e LinkedIn', 'UUID_COLAB2_AQUI', 'GRUPO_ID_AQUI', '2025-11-15'::date, 'done'::task_status),
('Configurar campanhas de email marketing', 'Segmentar base e criar 5 fluxos de emails', 'UUID_COLAB1_AQUI', 'GRUPO_ID_AQUI', '2025-11-20'::date, 'in-progress'::task_status),
('Agendar posts nas redes sociais', 'Programar postagens para semana da Black Friday', 'UUID_COLAB3_AQUI', 'GRUPO_ID_AQUI', '2025-11-25'::date, 'in-progress'::task_status),
('Monitorar métricas durante campanha', 'Acompanhar performance em tempo real', 'UUID_COLAB1_AQUI', 'GRUPO_ID_AQUI', '2025-11-30'::date, 'todo'::task_status);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- GRUPO 2: Treinamento Novo CRM (Vendas)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs

/*
INSERT INTO action_groups (id, title, description, deadline, status, created_by)
VALUES (
  gen_random_uuid(),
  'Treinamento Novo CRM - Salesforce',
  'Migração e treinamento completo da equipe de vendas no novo CRM Salesforce.',
  '2025-11-15'::date,
  'active'::group_status,
  'UUID_GESTOR2_AQUI' -- Gustavo criou
) RETURNING id;

-- Participantes
INSERT INTO action_group_participants (group_id, profile_id, role) VALUES
('GRUPO_ID_AQUI', 'UUID_GESTOR2_AQUI', 'leader'),
('GRUPO_ID_AQUI', 'UUID_COLAB4_AQUI', 'member'), -- Ana
('GRUPO_ID_AQUI', 'UUID_COLAB5_AQUI', 'member'), -- Bruno
('GRUPO_ID_AQUI', 'UUID_COLAB6_AQUI', 'member'); -- Juliana

-- Tarefas
INSERT INTO tasks (title, description, assignee_id, group_id, deadline, status) VALUES
('Completar curso Salesforce Fundamentals', 'Todos devem finalizar curso online oficial', 'UUID_GESTOR2_AQUI', 'GRUPO_ID_AQUI', '2025-10-31'::date, 'done'::task_status),
('Migrar leads do CRM antigo', 'Importar e validar todos os leads existentes', 'UUID_COLAB5_AQUI', 'GRUPO_ID_AQUI', '2025-11-05'::date, 'in-progress'::task_status),
('Configurar pipelines de vendas', 'Customizar funis para cada tipo de venda', 'UUID_COLAB6_AQUI', 'GRUPO_ID_AQUI', '2025-11-10'::date, 'in-progress'::task_status),
('Testar automações de follow-up', 'Validar fluxos automatizados de comunicação', 'UUID_COLAB4_AQUI', 'GRUPO_ID_AQUI', '2025-11-12'::date, 'in-progress'::task_status);
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 7: INSERIR SOLICITAÇÕES DE MENTORIA (4-6 SOLICITAÇÕES)
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- MENTORIAS ACEITAS (ATIVAS)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs

/*
-- Mentoria 1: Pedro mentorando Carlos (ambos Marketing)
INSERT INTO mentorship_requests (mentor_id, mentee_id, message, status)
VALUES (
  'UUID_COLAB3_AQUI', -- Pedro (Social Media Sr)
  'UUID_COLAB1_AQUI', -- Carlos (Analista Jr)
  'Olá Pedro! Gostaria de aprender mais sobre gestão de redes sociais e estratégias de engajamento. Poderia me mentorar?',
  'accepted'::request_status
);

-- Criar mentoria ativa correspondente
INSERT INTO mentorships (mentor_id, mentee_id, status, notes)
VALUES (
  'UUID_COLAB3_AQUI',
  'UUID_COLAB1_AQUI',
  'active'::mentorship_status,
  'Focando em estratégias de redes sociais e criação de conteúdo.'
) RETURNING id;

-- Sessões da mentoria (2 sessões já realizadas)
INSERT INTO mentorship_sessions (mentorship_id, session_date, duration_minutes, topics_discussed, action_items, mentor_feedback, mentee_feedback)
VALUES (
  'MENTORSHIP_ID_AQUI',
  CURRENT_TIMESTAMP - INTERVAL '14 days',
  60,
  'Introdução ao planejamento de conteúdo para redes sociais',
  'Carlos: estudar calendário editorial de 3 marcas de referência',
  'Carlos demonstrou interesse e fez boas perguntas. Precisa desenvolver visão estratégica.',
  'Sessão muito produtiva! Pedro compartilhou casos reais que ajudaram muito.'
);

INSERT INTO mentorship_sessions (mentorship_id, session_date, duration_minutes, topics_discussed, action_items, mentor_feedback, mentee_feedback)
VALUES (
  'MENTORSHIP_ID_AQUI',
  CURRENT_TIMESTAMP - INTERVAL '7 days',
  45,
  'Análise de métricas e KPIs de social media',
  'Carlos: criar dashboard de acompanhamento de métricas usando Google Analytics',
  'Evolução clara no entendimento de métricas. Próximo passo: análise preditiva.',
  'As dicas de ferramentas de análise foram valiosas!'
);

-- Mentoria 2: Juliana mentorando Bruno (ambos Vendas)
INSERT INTO mentorship_requests (mentor_id, mentee_id, message, status)
VALUES (
  'UUID_COLAB6_AQUI', -- Juliana (Closer Sr)
  'UUID_COLAB5_AQUI', -- Bruno (AE Pleno)
  'Juliana, admiro muito sua habilidade de fechamento. Gostaria de aprender suas técnicas de negociação em vendas complexas.',
  'accepted'::request_status
);

INSERT INTO mentorships (mentor_id, mentee_id, status, notes)
VALUES (
  'UUID_COLAB6_AQUI',
  'UUID_COLAB5_AQUI',
  'active'::mentorship_status,
  'Desenvolvendo técnicas avançadas de fechamento e gestão de objeções.'
) RETURNING id;

-- Sessão da mentoria
INSERT INTO mentorship_sessions (mentorship_id, session_date, duration_minutes, topics_discussed, action_items, mentor_feedback)
VALUES (
  'MENTORSHIP_ID_AQUI',
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  75,
  'Técnicas de superação de objeções e fechamento consultivo',
  'Bruno: aplicar framework SPIN Selling em próximas 5 reuniões',
  'Bruno tem potencial para se tornar top closer. Precisa ganhar mais confiança nas negociações.'
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- MENTORIAS PENDENTES
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️ SUBSTITUIR UUIDs

/*
-- Solicitação pendente 1: Marina pedindo mentoria para Juliana
INSERT INTO mentorship_requests (mentor_id, mentee_id, message, status)
VALUES (
  'UUID_COLAB6_AQUI', -- Juliana
  'UUID_COLAB2_AQUI', -- Marina
  'Olá Juliana! Gostaria de desenvolver minhas habilidades de apresentação para clientes. Vi que você é excelente nisso!',
  'pending'::request_status
);

-- Solicitação pendente 2: Ana pedindo mentoria para Bruno
INSERT INTO mentorship_requests (mentor_id, mentee_id, message, status)
VALUES (
  'UUID_COLAB5_AQUI', -- Bruno
  'UUID_COLAB4_AQUI', -- Ana
  'Bruno, como AE pleno você tem muita experiência com gestão de pipeline. Poderia me ajudar a melhorar minha organização?',
  'pending'::request_status
);
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 8: INSERIR CHECK-INS DE SAÚDE MENTAL (6-12 CHECK-INS)
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Cada colaborador terá 1-2 check-ins:
-- - 1 check-in recente (última semana)
-- - 1 check-in anterior (mês passado) - opcional
--
-- Variação de scores para demonstrar diferentes estados emocionais
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ⚠️ SUBSTITUIR UUIDs dos colaboradores

/*
-- Check-ins - CARLOS (scores médios/bons)
INSERT INTO emotional_checkins (employee_id, checkin_date, mood_rating, stress_level, energy_level, sleep_quality, notes)
VALUES 
('UUID_COLAB1_AQUI', CURRENT_DATE - 3, 7, 5, 7, 8, 'Semana produtiva! Aprendi muito com o Pedro nas sessões de mentoria.'),
('UUID_COLAB1_AQUI', CURRENT_DATE - 31, 6, 6, 6, 6, 'Estava um pouco ansioso com os novos desafios do PDI, mas agora me sinto mais confiante.');

-- Check-ins - MARINA (scores bons)
INSERT INTO emotional_checkins (employee_id, checkin_date, mood_rating, stress_level, energy_level, sleep_quality, notes)
VALUES 
('UUID_COLAB2_AQUI', CURRENT_DATE - 1, 8, 4, 8, 9, 'Muito animada com o projeto do design system! Criatividade fluindo bem.'),
('UUID_COLAB2_AQUI', CURRENT_DATE - 28, 8, 3, 8, 8, 'Gosto muito do clima da equipe de marketing.');

-- Check-ins - PEDRO (scores bons, líder)
INSERT INTO emotional_checkins (employee_id, checkin_date, mood_rating, stress_level, energy_level, sleep_quality, notes)
VALUES 
('UUID_COLAB3_AQUI', CURRENT_DATE - 2, 8, 5, 8, 7, 'Satisfeito em poder ajudar o Carlos a crescer. Mentoria está sendo gratificante.'),
('UUID_COLAB3_AQUI', CURRENT_DATE - 30, 7, 6, 7, 7, 'Semana intensa com a campanha Black Friday, mas tudo sob controle.');

-- Check-ins - ANA (scores médios, em desenvolvimento)
INSERT INTO emotional_checkins (employee_id, checkin_date, mood_rating, stress_level, energy_level, sleep_quality, notes)
VALUES 
('UUID_COLAB4_AQUI', CURRENT_DATE - 4, 6, 7, 5, 6, 'Adaptação ao Salesforce está desafiadora, mas estou perseverando.'),
('UUID_COLAB4_AQUI', CURRENT_DATE - 29, 5, 8, 5, 5, 'Semana difícil com rejeições, mas faz parte do aprendizado.');

-- Check-ins - BRUNO (scores bons)
INSERT INTO emotional_checkins (employee_id, checkin_date, mood_rating, stress_level, energy_level, sleep_quality, notes)
VALUES 
('UUID_COLAB5_AQUI', CURRENT_DATE - 5, 7, 5, 7, 8, 'Fechei 2 vendas importantes! As técnicas da Juliana estão funcionando.'),
('UUID_COLAB5_AQUI', CURRENT_DATE - 27, 7, 6, 7, 7, 'Pipeline organizado, me sinto no controle dos processos.');

-- Check-ins - JULIANA (scores excelentes)
INSERT INTO emotional_checkins (employee_id, checkin_date, mood_rating, stress_level, energy_level, sleep_quality, notes)
VALUES 
('UUID_COLAB6_AQUI', CURRENT_DATE - 1, 9, 3, 9, 9, 'Excelente mês! Bater a meta e ainda mentorar o Bruno está sendo muito gratificante.'),
('UUID_COLAB6_AQUI', CURRENT_DATE - 26, 8, 4, 8, 8, 'Energia alta, focada em resultados.');
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 9: INSERIR NOTIFICAÇÕES (15-20 NOTIFICAÇÕES)
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Mix de notificações lidas e não lidas
-- Tipos variados: PDI validado, avaliação recebida, tarefa atribuída, etc.
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ⚠️ SUBSTITUIR UUIDs

/*
-- Notificações - CARLOS
INSERT INTO notifications (profile_id, title, message, type, read, action_url) VALUES
('UUID_COLAB1_AQUI', 'PDI Validado! 🎉', 'Seu PDI "Fundamentos de Marketing Digital" foi validado pela Gabriela. Você ganhou 100 pontos!', 'success'::notification_type, true, '/pdi'),
('UUID_COLAB1_AQUI', 'Nova Tarefa Atribuída', 'Você foi atribuído à tarefa "Configurar campanhas de email marketing" no grupo Campanha Black Friday.', 'info'::notification_type, false, '/grupos-acao'),
('UUID_COLAB1_AQUI', 'Próxima Sessão de Mentoria', 'Sua sessão de mentoria com Pedro está agendada para amanhã às 14h.', 'info'::notification_type, false, '/mentorias');

-- Notificações - MARINA
INSERT INTO notifications (profile_id, title, message, type, read, action_url) VALUES
('UUID_COLAB2_AQUI', 'Tarefa Concluída', 'Sua tarefa "Criar artes para redes sociais" foi marcada como concluída. Ótimo trabalho!', 'success'::notification_type, true, '/grupos-acao'),
('UUID_COLAB2_AQUI', 'Avaliação de Competência', 'Gabriela avaliou sua competência "Adobe Creative Suite" com nota 5. Parabéns!', 'success'::notification_type, true, '/competencias'),
('UUID_COLAB2_AQUI', 'Solicitação de Mentoria Enviada', 'Sua solicitação de mentoria para Juliana foi enviada. Aguarde resposta.', 'info'::notification_type, false, '/mentorias');

-- Notificações - PEDRO
INSERT INTO notifications (profile_id, title, message, type, read, action_url) VALUES
('UUID_COLAB3_AQUI', 'Novo Mentorado', 'Carlos aceitou sua mentoria! Agende a primeira sessão.', 'success'::notification_type, true, '/mentorias'),
('UUID_COLAB3_AQUI', 'Tarefa Atribuída', 'Nova tarefa no grupo Campanha Black Friday: "Agendar posts nas redes sociais"', 'info'::notification_type, false, '/grupos-acao');

-- Notificações - ANA
INSERT INTO notifications (profile_id, title, message, type, read, action_url) VALUES
('UUID_COLAB4_AQUI', 'Bem-vinda ao Grupo!', 'Você foi adicionada ao grupo "Treinamento Novo CRM - Salesforce"', 'info'::notification_type, true, '/grupos-acao'),
('UUID_COLAB4_AQUI', 'Tarefa Próxima do Prazo', 'A tarefa "Testar automações de follow-up" vence em 3 dias.', 'warning'::notification_type, false, '/grupos-acao'),
('UUID_COLAB4_AQUI', 'Solicitação de Mentoria Enviada', 'Você solicitou mentoria para Bruno. Aguardando resposta.', 'info'::notification_type, false, '/mentorias');

-- Notificações - BRUNO
INSERT INTO notifications (profile_id, title, message, type, read, action_url) VALUES
('UUID_COLAB5_AQUI', 'Mentoria Aceita', 'Juliana aceitou ser sua mentora! Primeira sessão agendada.', 'success'::notification_type, true, '/mentorias'),
('UUID_COLAB5_AQUI', 'Tarefa em Andamento', 'Não esqueça de atualizar o progresso da tarefa "Migrar leads do CRM antigo"', 'info'::notification_type, false, '/grupos-acao'),
('UUID_COLAB5_AQUI', 'Novo Pedido de Mentoria', 'Ana solicitou sua mentoria. Revise a solicitação.', 'info'::notification_type, false, '/mentorias');

-- Notificações - JULIANA
INSERT INTO notifications (profile_id, title, message, type, read, action_url) VALUES
('UUID_COLAB6_AQUI', 'Conquista Desbloqueada! 🏆', 'Você desbloqueou a conquista "Mentor Expert" por mentorar 2 pessoas simultaneamente!', 'success'::notification_type, true, '/conquistas'),
('UUID_COLAB6_AQUI', '2 Solicitações de Mentoria', 'Você tem 2 solicitações de mentoria pendentes de Marina e Juliana.', 'info'::notification_type, false, '/mentorias'),
('UUID_COLAB6_AQUI', 'Tarefa Atribuída', 'Nova tarefa: "Configurar pipelines de vendas" no grupo Treinamento CRM', 'info'::notification_type, false, '/grupos-acao');

-- Notificações - GESTORES
INSERT INTO notifications (profile_id, title, message, type, read) VALUES
('UUID_GESTOR1_AQUI', '3 PDIs Aguardando Validação', 'Você tem 3 PDIs da sua equipe aguardando validação.', 'warning'::notification_type, false),
('UUID_GESTOR1_AQUI', '5 Avaliações Pendentes', 'Há 5 competências da equipe aguardando sua avaliação.', 'warning'::notification_type, false),
('UUID_GESTOR2_AQUI', 'Grupo de Ação Próximo do Prazo', 'O grupo "Treinamento Novo CRM" tem prazo em 15 dias. 3 tarefas ainda pendentes.', 'warning'::notification_type, false);

-- Notificações - RH
INSERT INTO notifications (profile_id, title, message, type, read) VALUES
('UUID_RH_AQUI', '2 Alertas de Saúde Mental', 'Ana apresentou scores baixos nos últimos check-ins. Considere agendar uma conversa.', 'warning'::notification_type, false),
('UUID_RH_AQUI', 'Relatório Mensal Disponível', 'O relatório de engajamento e saúde mental de outubro está pronto.', 'info'::notification_type, false);
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 10: DADOS ADICIONAIS PARA TESTES
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- SOLICITAÇÕES DE SESSÃO DE PSICOLOGIA (para testar módulo RH)
-- ────────────────────────────────────────────────────────────────────────────

-- ⚠️ SUBSTITUIR UUIDs

/*
-- Solicitação 1: Ana (scores baixos de saúde mental)
INSERT INTO session_requests (employee_id, urgency, preferred_type, reason, preferred_times, status, assigned_psychologist)
VALUES (
  'UUID_COLAB4_AQUI',
  'alta'::session_urgency,
  'online'::session_type,
  'Tenho sentido muita ansiedade com as metas de vendas e gostaria de conversar sobre estratégias de gestão de estresse.',
  ARRAY['manhã', 'tarde'],
  'pendente'::session_request_status,
  'UUID_RH_AQUI' -- Rita do RH atribuída
);

-- Solicitação 2: Carlos (preventivo)
INSERT INTO session_requests (employee_id, urgency, preferred_type, reason, preferred_times, status)
VALUES (
  'UUID_COLAB1_AQUI',
  'normal'::session_urgency,
  'presencial'::session_type,
  'Gostaria de fazer uma avaliação preventiva para desenvolver melhor equilíbrio entre vida pessoal e profissional.',
  ARRAY['tarde'],
  'pendente'::session_request_status
);
*/

-- ────────────────────────────────────────────────────────────────────────────
-- REGISTROS PSICOLÓGICOS (confidenciais - apenas RH)
-- ────────────────────────────────────────────────────────────────────────────

-- ⚠️ SUBSTITUIR UUIDs

/*
INSERT INTO psychological_records (profile_id, record_type, title, content, confidential, created_by)
VALUES (
  'UUID_COLAB4_AQUI',
  'note'::record_type,
  'Primeira consulta - Ansiedade de Performance',
  'Colaboradora relatou dificuldade em lidar com pressão de metas. Demonstrou autocrítica excessiva. Orientada sobre técnicas de mindfulness e gestão de expectativas. Agendar sessão de follow-up em 2 semanas.',
  true,
  'UUID_RH_AQUI'
);
*/

-- ──────────────────────────────────────────────────────────────────────────────
-- FIM DO SCRIPT BASE
-- ──────────────────────────────────────────────────────────────────────────────

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- QUERIES DE VALIDAÇÃO
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Executar APÓS inserir todos os dados para validar:
--
-- ══════════════════════════════════════════════════════════════════════════════

/*
-- ────────────────────────────────────────────────────────────────────────────
-- Query 1: Confirmar todos os usuários criados (deve retornar 10 linhas)
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- Query 2: Validar PDIs por colaborador (deve mostrar 2-3 PDIs cada)
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- Query 3: Validar competências por colaborador
-- ────────────────────────────────────────────────────────────────────────────
SELECT 
  p.name as colaborador,
  COUNT(*) as total_competencias,
  SUM(CASE WHEN c.type = 'hard' THEN 1 ELSE 0 END) as hard_skills,
  SUM(CASE WHEN c.type = 'soft' THEN 1 ELSE 0 END) as soft_skills,
  ROUND(AVG(c.self_rating::numeric), 2) as media_autoavaliacao,
  ROUND(AVG(c.manager_rating::numeric), 2) as media_avaliacao_gestor
FROM profiles p
LEFT JOIN competencies c ON c.profile_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name
ORDER BY p.name;

-- ────────────────────────────────────────────────────────────────────────────
-- Query 4: Validar grupos de ação com participantes e tarefas
-- ────────────────────────────────────────────────────────────────────────────
SELECT 
  ag.title as grupo,
  p.name as criador,
  ag.deadline as prazo,
  COUNT(DISTINCT agp.profile_id) as total_participantes,
  COUNT(DISTINCT t.id) as total_tarefas,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as concluidas,
  SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as em_andamento,
  SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as pendentes
FROM action_groups ag
JOIN profiles p ON ag.created_by = p.id
LEFT JOIN action_group_participants agp ON agp.group_id = ag.id
LEFT JOIN tasks t ON t.group_id = ag.id
GROUP BY ag.id, ag.title, ag.deadline, p.name
ORDER BY ag.title;

-- ────────────────────────────────────────────────────────────────────────────
-- Query 5: Validar mentorias ativas e pendentes
-- ────────────────────────────────────────────────────────────────────────────
SELECT 
  mentor.name as mentor,
  mentee.name as mentorado,
  mr.status as status_solicitacao,
  m.status as status_mentoria,
  COUNT(ms.id) as sessoes_realizadas
FROM mentorship_requests mr
JOIN profiles mentor ON mr.mentor_id = mentor.id
JOIN profiles mentee ON mr.mentee_id = mentee.id
LEFT JOIN mentorships m ON m.mentor_id = mr.mentor_id AND m.mentee_id = mr.mentee_id
LEFT JOIN mentorship_sessions ms ON ms.mentorship_id = m.id
GROUP BY mentor.name, mentee.name, mr.status, m.status
ORDER BY mr.status, mentor.name;

-- ────────────────────────────────────────────────────────────────────────────
-- Query 6: Validar check-ins de saúde mental
-- ────────────────────────────────────────────────────────────────────────────
SELECT 
  p.name as colaborador,
  COUNT(ec.id) as total_checkins,
  ROUND(AVG(ec.mood_rating::numeric), 1) as media_humor,
  ROUND(AVG(ec.stress_level::numeric), 1) as media_estresse,
  ROUND(AVG(ec.energy_level::numeric), 1) as media_energia,
  MAX(ec.checkin_date) as ultimo_checkin
FROM profiles p
LEFT JOIN emotional_checkins ec ON ec.employee_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name
ORDER BY media_estresse DESC;

-- ────────────────────────────────────────────────────────────────────────────
-- Query 7: Validar notificações não lidas por usuário
-- ────────────────────────────────────────────────────────────────────────────
SELECT 
  p.name as usuario,
  p.role as perfil,
  COUNT(*) as total_notificacoes,
  SUM(CASE WHEN n.read = false THEN 1 ELSE 0 END) as nao_lidas,
  SUM(CASE WHEN n.type = 'success' THEN 1 ELSE 0 END) as sucesso,
  SUM(CASE WHEN n.type = 'warning' THEN 1 ELSE 0 END) as avisos,
  SUM(CASE WHEN n.type = 'info' THEN 1 ELSE 0 END) as informativas
FROM profiles p
LEFT JOIN notifications n ON n.profile_id = p.id
GROUP BY p.id, p.name, p.role
ORDER BY nao_lidas DESC;

-- ────────────────────────────────────────────────────────────────────────────
-- Query 8: Visão geral do sistema (resumo executivo)
-- ────────────────────────────────────────────────────────────────────────────
SELECT 
  'Total de Usuários' as metrica,
  COUNT(*)::text as valor
FROM profiles
UNION ALL
SELECT 
  'Total de PDIs',
  COUNT(*)::text
FROM pdis
UNION ALL
SELECT 
  'Total de Competências Avaliadas',
  COUNT(*)::text
FROM competencies
WHERE manager_rating IS NOT NULL
UNION ALL
SELECT 
  'Grupos de Ação Ativos',
  COUNT(*)::text
FROM action_groups
WHERE status = 'active'
UNION ALL
SELECT 
  'Mentorias Ativas',
  COUNT(*)::text
FROM mentorships
WHERE status = 'active'
UNION ALL
SELECT 
  'Check-ins Última Semana',
  COUNT(*)::text
FROM emotional_checkins
WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'Notificações Não Lidas',
  COUNT(*)::text
FROM notifications
WHERE read = false;
*/
