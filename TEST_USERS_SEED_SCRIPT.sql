-- ══════════════════════════════════════════════════════════════════════════════
-- DEAPDI TALENTFLOW - SCRIPT DE CRIAÇÃO DE USUÁRIOS DEADESIGN
-- ══════════════════════════════════════════════════════════════════════════════
--
-- IMPORTANTE: Este script pode ser executado diretamente no Supabase SQL Editor
-- Os usuários do Auth serão criados automaticamente se não existirem
-- 
-- ESTRUTURA DO SCRIPT:
-- ===================
-- Parte 0: Validações e criação de usuários Auth (se necessário)
-- Parte 1: Inserir teams (4 departamentos)
-- Parte 2: Inserir profiles (10 usuários DeaDesign)
-- Parte 3: Inserir competências base
-- Parte 4: Inserir PDIs com objetivos
-- Parte 5: Inserir grupos de ação e tarefas
-- Parte 6: Inserir solicitações de mentoria
-- Parte 7: Inserir check-ins de saúde mental
-- Parte 8: Inserir notificações
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- CREDENCIAIS DOS USUÁRIOS DEADESIGN
-- ──────────────────────────────────────────────────────────────────────────────
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. ANA PAULA NEMOTO (Admin)                                                │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: anapaula@deadesign.com.br                                            │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: 0fbd25b0-ea9c-45e4-a19c-f1ea3403e445                                  │
-- │ Cargo: Diretora Executiva                                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. ALEXIA SOBREIRA (RH)                                                     │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: alexia@deadesign.com.br                                              │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: 55158bb7-b884-43ae-bf2e-953fc0cb0e4b                                  │
-- │ Cargo: Gerente de RH                                                        │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. NATHALIA FUJII (Gestora Design)                                         │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: nathalia@deadesign.com.br                                            │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: cebe7528-c574-43a2-b21d-7905b28ee9d1                                  │
-- │ Cargo: Gerente de Design                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 4. SILVIA KANAYAMA (Gestora Projetos)                                      │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: silvia@deadesign.com.br                                              │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: cad26b49-b723-46a4-a228-bd1a30c49287                                  │
-- │ Cargo: Gerente de Projetos                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 5. MARIA EDUARDA RAMOS (Designer Jr)                                       │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: mariaeduarda@deadesign.com.br                                        │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: 7278b804-6b4f-4e31-8b78-87aa2295d2c3                                  │
-- │ Cargo: Designer Júnior                                                      │
-- │ Gestora: Nathalia Fujii                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 6. JULIA RISSIN (Designer Pleno)                                           │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: julia@deadesign.com.br                                               │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: bb6d9b49-6cd0-40fa-ae38-0defcbce924c                                  │
-- │ Cargo: Designer Pleno                                                       │
-- │ Gestora: Silvia Kanayama                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 7. JULIANA HOBO (Designer Sr)                                              │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: juliana@deadesign.com.br                                             │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: a14bac90-ae64-404a-b559-da880aee9ca6                                  │
-- │ Cargo: Designer Sênior                                                      │
-- │ Gestora: Silvia Kanayama                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 8. PEDRO OLIVEIRA (GP Jr)                                                  │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: pedro@deadesign.com.br                                               │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: 27b1f282-8a89-4473-87d0-d5f589cda236                                  │
-- │ Cargo: Gerente de Projetos Jr                                               │
-- │ Gestora: Silvia Kanayama                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 9. LUCILA MURANAKA (Analista Sr)                                           │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: lucila@deadesign.com.br                                              │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: 6a4774f2-8418-49ff-a8b9-c24562846350                                  │
-- │ Cargo: Analista de Projetos Sr                                              │
-- │ Gestora: Silvia Kanayama                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 10. ROBERTO FAGARAZ (Desenvolvedor Sr)                                     │
-- ├─────────────────────────────────────────────────────────────────────────────┤
-- │ Email: roberto@deadesign.com.br                                             │
-- │ Senha: DEA@pdi                                                              │
-- │ UUID: e5561665-e906-4ed0-a3d0-40386db5cea0                                  │
-- │ Cargo: Desenvolvedor Sênior                                                 │
-- │ Gestora: Nathalia Fujii                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 0: VALIDAÇÕES E PREPARAÇÃO
-- ══════════════════════════════════════════════════════════════════════════════

-- Verificar se as tabelas necessárias existem
DO $$
DECLARE
  missing_tables text[];
  required_tables text[] := ARRAY[
    'teams', 'profiles', 'competencies', 'pdis', 'tasks',
    'action_groups', 'action_group_participants', 
    'mentorship_requests', 'mentorships', 'mentorship_sessions',
    'emotional_checkins', 'notifications'
  ];
  tbl text;
  table_exists boolean;
BEGIN
  FOREACH tbl IN ARRAY required_tables LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'ERRO: Tabelas faltando: %. Execute as migrations primeiro!', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'Validação OK: Todas as tabelas necessárias existem.';
  END IF;
END $$;

-- Verificar se os usuários Auth existem (informativo apenas)
DO $$
DECLARE
  missing_users text[];
  user_ids uuid[] := ARRAY[
    '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445'::uuid,
    '55158bb7-b884-43ae-bf2e-953fc0cb0e4b'::uuid,
    'cebe7528-c574-43a2-b21d-7905b28ee9d1'::uuid,
    'cad26b49-b723-46a4-a228-bd1a30c49287'::uuid,
    '7278b804-6b4f-4e31-8b78-87aa2295d2c3'::uuid,
    'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'::uuid,
    'a14bac90-ae64-404a-b559-da880aee9ca6'::uuid,
    '27b1f282-8a89-4473-87d0-d5f589cda236'::uuid,
    '6a4774f2-8418-49ff-a8b9-c24562846350'::uuid,
    'e5561665-e906-4ed0-a3d0-40386db5cea0'::uuid
  ];
  uid uuid;
  auth_exists boolean;
BEGIN
  -- Verificar quais usuários Auth não existem
  FOREACH uid IN ARRAY user_ids LOOP
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE id = uid
    ) INTO auth_exists;
    
    IF NOT auth_exists THEN
      missing_users := array_append(missing_users, uid::text);
    END IF;
  END LOOP;
  
  -- Avisar sobre usuários faltantes (mas não falhar)
  IF array_length(missing_users, 1) > 0 THEN
    RAISE NOTICE 'AVISO: % usuário(s) Auth não encontrado(s). Os perfis serão criados mesmo assim.', array_length(missing_users, 1);
    RAISE NOTICE 'Para criar os usuários Auth manualmente, use o Supabase Dashboard > Authentication > Users';
  ELSE
    RAISE NOTICE 'Todos os 10 usuários Auth foram encontrados. Continuando com a inserção de dados...';
  END IF;
END $$;

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 1: INSERIR TEAMS (DEPARTAMENTOS DEADESIGN)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO teams (id, name, description) VALUES
(gen_random_uuid(), 'Gestão', 'Gestão e Administração DeaDesign'),
(gen_random_uuid(), 'Design', 'Departamento de Design e Criação'),
(gen_random_uuid(), 'Projetos', 'Gestão de Projetos e Atendimento')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 2: INSERIR PROFILES - EQUIPE DEADESIGN
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ANA PAULA NEMOTO (Admin/Gestão)
-- ────────────────────────────────────────────────────────────────────────────
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
  '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445',
  'anapaula@deadesign.com.br',
  'Ana Paula Nemoto',
  'admin'::user_role,
  (SELECT id FROM teams WHERE name = 'Gestão' LIMIT 1),
  NULL,
  'Diretor',
  'Diretora Executiva',
  500,
  'Diretora executiva da DeaDesign, responsável pela gestão estratégica e desenvolvimento organizacional.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  team_id = EXCLUDED.team_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ALEXIA SOBREIRA (RH)
-- ────────────────────────────────────────────────────────────────────────────
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
  '55158bb7-b884-43ae-bf2e-953fc0cb0e4b',
  'alexia@deadesign.com.br',
  'Alexia Sobreira',
  'hr'::user_role,
  (SELECT id FROM teams WHERE name = 'Gestão' LIMIT 1),
  NULL,
  'Gerente',
  'Gerente de RH',
  450,
  'Gerente de RH responsável pela gestão de pessoas, desenvolvimento organizacional e saúde mental da equipe.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. NATHALIA FUJII (Gestora Design)
-- ────────────────────────────────────────────────────────────────────────────
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
  'cebe7528-c574-43a2-b21d-7905b28ee9d1',
  'nathalia@deadesign.com.br',
  'Nathalia Fujii',
  'manager'::user_role,
  (SELECT id FROM teams WHERE name = 'Design' LIMIT 1),
  '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', -- Ana Paula como líder
  'Gerente',
  'Gerente de Design',
  400,
  'Gerente de design com expertise em gestão de equipes criativas e desenvolvimento de produtos.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 4. SILVIA KANAYAMA (Gestora Projetos)
-- ────────────────────────────────────────────────────────────────────────────
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
  'cad26b49-b723-46a4-a228-bd1a30c49287',
  'silvia@deadesign.com.br',
  'Silvia Kanayama',
  'manager'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', -- Ana Paula como líder
  'Gerente',
  'Gerente de Projetos',
  420,
  'Gerente de projetos com foco em entrega de resultados e gestão de equipes multidisciplinares.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. MARIA EDUARDA RAMOS (Designer Jr - Equipe Nathalia)
-- ────────────────────────────────────────────────────────────────────────────
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
  '7278b804-6b4f-4e31-8b78-87aa2295d2c3',
  'mariaeduarda@deadesign.com.br',
  'Maria Eduarda Ramos',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Gestão' LIMIT 1),
  '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', -- Ana Paula como gestora
  'Júnior',
  'Analista Júnior',
  150,
  'Designer júnior focada em crescimento profissional e aprendizado contínuo.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 3: INSERIR COMPETÊNCIAS BASE
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO competencies (
  id,
  name,
  type,
  stage,
  self_rating,
  manager_rating,
  target_level,
  profile_id
) VALUES
  ('812b7c65-cc00-49a8-8a0a-20141b3dbdd1', 'Pesquisa com Usuários', 'soft', 'Fundamental', 3, 4, 5, '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('e2d3af42-2646-47fe-b8c2-8d371e2a4498', 'Design de Interfaces', 'hard', 'Intermediário', 4, 4, 5, '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('cda4ff9c-f05a-4e2f-b727-cca6a749dbbd', 'Comunicação Visual', 'soft', 'Intermediário', 4, 5, 5, '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('6ebfd6a0-8b07-43b6-9c0f-d315f2b0d113', 'Prototipagem Rápida', 'hard', 'Fundamental', 3, 3, 4, '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('8b6ceaee-f74e-4415-aed4-15e32e4bbaef', 'Pesquisa Qualitativa', 'soft', 'Intermediário', 4, 4, 5, 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('abd8e00c-2043-43b6-9427-08d19306b0b2', 'Gestão de Stakeholders', 'soft', 'Avançado', 4, 5, 5, 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('af108328-b11e-4728-a1e8-8e3bce5159ca', 'Design System', 'hard', 'Intermediário', 3, 4, 5, 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('55aeaabf-7c8f-442b-9e94-b2e24a658b3a', 'Mentoria de Equipe', 'soft', 'Avançado', 4, 5, 5, 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('0cc66934-eec7-4497-9f4a-4e40635c9a25', 'Branding Estratégico', 'hard', 'Avançado', 5, 5, 5, 'a14bac90-ae64-404a-b559-da880aee9ca6'),
  ('258afe65-5d04-469d-bb97-938083afb3eb', 'Facilitação de Workshops', 'soft', 'Avançado', 4, 5, 5, 'a14bac90-ae64-404a-b559-da880aee9ca6'),
  ('19774456-b3ba-4168-9f9f-639af515c92f', 'Storytelling Visual', 'soft', 'Avançado', 5, 5, 5, 'a14bac90-ae64-404a-b559-da880aee9ca6'),
  ('947efbea-6136-400c-9827-3a5408f6b760', 'Pesquisa Quantitativa', 'hard', 'Intermediário', 3, 4, 4, 'a14bac90-ae64-404a-b559-da880aee9ca6'),
  ('c4e3bf3f-59eb-4487-9c6b-f6a2c5f25ff3', 'Gestão de Cronogramas', 'soft', 'Intermediário', 3, 4, 5, '27b1f282-8a89-4473-87d0-d5f589cda236'),
  ('da6305c0-bf14-4b0d-9adf-da73b440ef68', 'Planejamento de Projetos', 'hard', 'Intermediário', 3, 4, 5, '27b1f282-8a89-4473-87d0-d5f589cda236'),
  ('f4be0b49-de5b-4c62-9301-293ddd13a6a8', 'Comunicação com Clientes', 'soft', 'Fundamental', 4, 4, 5, '27b1f282-8a89-4473-87d0-d5f589cda236'),
  ('131e13e2-b84a-44fa-964c-111c7f22de25', 'Análise de Riscos', 'hard', 'Fundamental', 3, 3, 4, '27b1f282-8a89-4473-87d0-d5f589cda236'),
  ('5e240645-46d4-487f-a709-048915bbb78a', 'Gestão de Processos', 'hard', 'Avançado', 4, 5, 5, '6a4774f2-8418-49ff-a8b9-c24562846350'),
  ('73263c77-dc73-4582-89de-c76c3dac35da', 'Análise de Dados', 'hard', 'Intermediário', 3, 4, 5, '6a4774f2-8418-49ff-a8b9-c24562846350'),
  ('788878bc-5d62-4110-9757-bdee05e81b4a', 'Liderança Técnica', 'soft', 'Intermediário', 4, 4, 5, '6a4774f2-8418-49ff-a8b9-c24562846350'),
  ('87ba482f-0352-4e26-8c7c-d50f73fd9463', 'Gestão de Mudanças', 'soft', 'Intermediário', 3, 4, 5, '6a4774f2-8418-49ff-a8b9-c24562846350'),
  ('6db1fa88-e507-4ac5-b8bd-19fa51ba6cc0', 'Arquitetura Front-end', 'hard', 'Avançado', 4, 5, 5, 'e5561665-e906-4ed0-a3d0-40386db5cea0'),
  ('d7819f05-3c28-42db-b605-ba5138bb9382', 'Mentoria Técnica', 'soft', 'Avançado', 4, 5, 5, 'e5561665-e906-4ed0-a3d0-40386db5cea0'),
  ('6aeefc09-3fa9-46f1-9380-414f76085e86', 'Automação de Testes', 'hard', 'Intermediário', 3, 4, 5, 'e5561665-e906-4ed0-a3d0-40386db5cea0'),
  ('a812b645-cfce-4281-8710-78f186264622', 'Comunicação Técnica', 'soft', 'Intermediário', 4, 4, 5, 'e5561665-e906-4ed0-a3d0-40386db5cea0')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  stage = EXCLUDED.stage,
  self_rating = EXCLUDED.self_rating,
  manager_rating = EXCLUDED.manager_rating,
  target_level = EXCLUDED.target_level,
  profile_id = EXCLUDED.profile_id,
  updated_at = NOW();

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 4: INSERIR PDIs COM OBJETIVOS E TAREFAS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO pdis (
  id,
  title,
  description,
  deadline,
  status,
  mentor_id,
  points,
  created_by,
  validated_by,
  profile_id
) VALUES
  ('ee774b4a-a6ff-4c7d-9fc5-19b223e00eb2', 'Dominar fluxos de entrega contínua', 'Estruturar fluxo completo de entrega, incluindo handoff para desenvolvimento e QA.', '2024-12-01', 'in-progress', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', 160, '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', NULL, '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('29494d48-3f63-4a76-bdfa-43ae26a3b1da', 'Fortalecer pesquisa estratégica', 'Planejar e executar ciclos completos de discovery trimestrais.', '2025-02-15', 'pending', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 140, '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', NULL, '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('a19e8700-b853-4fa2-8e7f-f3fa878a2183', 'Consolidar design system da DeaDesign', 'Publicar documentação completa do design system com guidelines e componentes reutilizáveis.', '2024-08-30', 'validated', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 180, '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', '7278b804-6b4f-4e31-8b78-87aa2295d2c3'),
  ('052b5082-c01e-449b-8021-ee8aa4397e89', 'Elevar maturidade do time de design', 'Construir trilhas de desenvolvimento e rituais de feedback mensal.', '2024-07-30', 'completed', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 220, 'cad26b49-b723-46a4-a228-bd1a30c49287', 'cad26b49-b723-46a4-a228-bd1a30c49287', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('2351b80b-940b-411b-953d-698de1820afa', 'Estruturar programa de mentoria interna', 'Criar pares de mentoria, acompanhamentos e métricas de evolução para o time.', '2024-11-15', 'in-progress', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 200, 'cad26b49-b723-46a4-a228-bd1a30c49287', NULL, 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('d8b34bb1-d883-4374-8f7e-d03a720153dc', 'Implementar métricas de impacto de design', 'Definir KPIs e relatórios mensais de impacto das iniciativas de design.', '2025-03-01', 'pending', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 180, 'cad26b49-b723-46a4-a228-bd1a30c49287', NULL, 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c'),
  ('6dd61962-19b8-4cf2-8df7-ebaf7fbbb0ff', 'Conduzir programa de especialização', 'Desenvolver trilha avançada de facilitação e alinhamento com negócios.', '2024-06-30', 'validated', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 210, 'cad26b49-b723-46a4-a228-bd1a30c49287', 'cad26b49-b723-46a4-a228-bd1a30c49287', 'a14bac90-ae64-404a-b559-da880aee9ca6'),
  ('a4644caa-9f6d-488e-bd1b-02083027d415', 'Aprimorar facilitação híbrida', 'Testar e documentar novos formatos de colaboração remota para workshops complexos.', '2024-12-20', 'in-progress', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 170, 'cad26b49-b723-46a4-a228-bd1a30c49287', NULL, 'a14bac90-ae64-404a-b559-da880aee9ca6'),
  ('59c8cba3-4f27-45d8-a93e-4b2be11c31eb', 'Padronizar ritos de kickoff', 'Criar playbook com artefatos mínimos e checklists para kickoff de projetos.', '2024-10-05', 'in-progress', 'cad26b49-b723-46a4-a228-bd1a30c49287', 150, 'cad26b49-b723-46a4-a228-bd1a30c49287', NULL, '27b1f282-8a89-4473-87d0-d5f589cda236'),
  ('3abd9eba-e6dd-4de4-b9c8-c061ef39af66', 'Implantar CRM colaborativo', 'Mapear integrações e treinar equipe para uso do CRM em projetos.', '2025-01-10', 'pending', 'cad26b49-b723-46a4-a228-bd1a30c49287', 130, 'cad26b49-b723-46a4-a228-bd1a30c49287', NULL, '27b1f282-8a89-4473-87d0-d5f589cda236'),
  ('c3621bde-b318-43ed-ac20-01d345edc6c9', 'Otimizar gestão de portfólio', 'Criar dashboards e rotinas de priorização quinzenais com stakeholders.', '2024-09-15', 'completed', 'cad26b49-b723-46a4-a228-bd1a30c49287', 190, 'cad26b49-b723-46a4-a228-bd1a30c49287', 'cad26b49-b723-46a4-a228-bd1a30c49287', '6a4774f2-8418-49ff-a8b9-c24562846350'),
  ('e9096b96-d741-43eb-9786-b2d81eda915a', 'Automatizar relatórios operacionais', 'Construir scripts para consolidar dados de projetos e resultados em tempo real.', '2024-11-30', 'in-progress', 'e5561665-e906-4ed0-a3d0-40386db5cea0', 180, 'cad26b49-b723-46a4-a228-bd1a30c49287', NULL, '6a4774f2-8418-49ff-a8b9-c24562846350'),
  ('e3265604-6765-44f1-a3a3-fe212666c2eb', 'Escalar arquitetura front-end', 'Documentar padrões e criar bibliotecas compartilhadas com o time de engenharia.', '2024-07-15', 'validated', 'cad26b49-b723-46a4-a228-bd1a30c49287', 220, 'cebe7528-c574-43a2-b21d-7905b28ee9d1', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', 'e5561665-e906-4ed0-a3d0-40386db5cea0'),
  ('81806eeb-8cbf-4a0e-9bd3-4267a6ed57ad', 'Evoluir pipeline de CI/CD', 'Implementar testes automatizados e monitoramento contínuo para os produtos críticos.', '2024-12-10', 'in-progress', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', 200, 'cebe7528-c574-43a2-b21d-7905b28ee9d1', NULL, 'e5561665-e906-4ed0-a3d0-40386db5cea0'),
  ('5209737a-7c92-4a20-aabd-9c3fb04f4d8f', 'Desenvolver trilha de liderança técnica', 'Criar conteúdos e trilhas de estudo para novos líderes técnicos.', '2025-02-28', 'pending', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 190, 'cebe7528-c574-43a2-b21d-7905b28ee9d1', NULL, 'e5561665-e906-4ed0-a3d0-40386db5cea0')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  deadline = EXCLUDED.deadline,
  status = EXCLUDED.status,
  mentor_id = EXCLUDED.mentor_id,
  points = EXCLUDED.points,
  created_by = EXCLUDED.created_by,
  validated_by = EXCLUDED.validated_by,
  profile_id = EXCLUDED.profile_id,
  updated_at = NOW();

INSERT INTO tasks (
  id,
  title,
  description,
  assignee_id,
  group_id,
  pdi_id,
  deadline,
  status
) VALUES
  ('0705dc4d-5e59-415b-93b4-baecff0f89c2', 'Mapear fluxo atual de entrega', 'Reunir informações com desenvolvimento e QA para mapear processo atual.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, 'ee774b4a-a6ff-4c7d-9fc5-19b223e00eb2', '2024-10-25', 'in-progress'),
  ('5697f643-d479-42db-b684-efba063e0fb7', 'Definir métricas de handoff', 'Criar indicadores de qualidade para medir entregas de design.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, 'ee774b4a-a6ff-4c7d-9fc5-19b223e00eb2', '2024-11-05', 'todo'),
  ('33fff2b3-ad36-41c3-8059-5e55f3b61388', 'Documentar fluxo ideal', 'Produzir documentação final validada pelo time de engenharia.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, 'ee774b4a-a6ff-4c7d-9fc5-19b223e00eb2', '2024-11-30', 'done'),
  ('511cfcd9-ef1c-41c1-8f8c-b3c02efc6119', 'Planejar calendário de discovery', 'Definir temas prioritários e agenda de entrevistas para o próximo trimestre.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, '29494d48-3f63-4a76-bdfa-43ae26a3b1da', '2024-12-15', 'todo'),
  ('e925b5ce-49f8-4e36-8547-9ba106f58ba1', 'Criar kit de pesquisa reutilizável', 'Preparar roteiros, consentimentos e templates para pesquisas estratégicas.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, '29494d48-3f63-4a76-bdfa-43ae26a3b1da', '2025-01-31', 'in-progress'),
  ('bf5955e7-7db1-4ee1-aefc-42f16cd2f203', 'Auditar componentes existentes', 'Revisar componentes atuais e mapear gaps em relação ao padrão desejado.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, 'a19e8700-b853-4fa2-8e7f-f3fa878a2183', '2024-06-10', 'done'),
  ('171df9a4-f665-4d65-a1eb-a1135f6dd06e', 'Publicar guidelines finais', 'Disponibilizar documentação revisada no portal interno.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', NULL, 'a19e8700-b853-4fa2-8e7f-f3fa878a2183', '2024-08-15', 'done'),
  ('c3709a22-2840-495b-a2ec-bcd1c0a29135', 'Mapear trilhas de carreira', 'Coletar expectativas e níveis de proficiência do time de design.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, '052b5082-c01e-449b-8021-ee8aa4397e89', '2024-05-20', 'done'),
  ('39e5532f-d660-4595-af3b-f02cbae1ca81', 'Estruturar rituais de feedback', 'Agendar e conduzir encontros mensais com todo o time.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, '052b5082-c01e-449b-8021-ee8aa4397e89', '2024-06-30', 'done'),
  ('e2b5cf63-7324-4185-aa18-76f472bb5054', 'Compartilhar resultados com diretoria', 'Apresentar evolução do time e próximos passos.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, '052b5082-c01e-449b-8021-ee8aa4397e89', '2024-07-25', 'done'),
  ('78d4ab0a-b3da-4f3d-a987-78a97e93866b', 'Levantar pares de mentoria', 'Selecionar mentores e mentorados e validar disponibilidade.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, '2351b80b-940b-411b-953d-698de1820afa', '2024-10-05', 'in-progress'),
  ('2c624a85-3705-4f9a-80c9-45a652b74eca', 'Criar plano de acompanhamento', 'Definir metas, cadência e métricas para as duplas de mentoria.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, '2351b80b-940b-411b-953d-698de1820afa', '2024-11-10', 'todo'),
  ('24fae207-878d-47c9-88a5-30bd088b11b8', 'Lançar programa piloto', 'Executar piloto com 3 duplas e coletar feedback.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, '2351b80b-940b-411b-953d-698de1820afa', '2024-12-01', 'done'),
  ('b3a687e4-692c-46a4-b51f-dc95f766c2c3', 'Mapear indicadores de impacto', 'Definir KPIs que conectem design aos resultados de negócio.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, 'd8b34bb1-d883-4374-8f7e-d03a720153dc', '2025-01-20', 'todo'),
  ('f273b43a-27a3-420f-a944-d0878403ee78', 'Configurar dashboards mensais', 'Criar dashboards automatizados no Looker Studio.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', NULL, 'd8b34bb1-d883-4374-8f7e-d03a720153dc', '2025-02-15', 'todo'),
  ('f4e7eada-bfdf-4154-8044-709349c47a5b', 'Desenhar jornadas avançadas', 'Criar frameworks de jornadas e exercícios de co-criação.', 'a14bac90-ae64-404a-b559-da880aee9ca6', NULL, '6dd61962-19b8-4cf2-8df7-ebaf7fbbb0ff', '2024-04-30', 'done'),
  ('49a46127-be4a-49d2-83c3-ba81348cf046', 'Treinar líderes em facilitação', 'Conduzir workshop avançado com líderes das áreas parceiras.', 'a14bac90-ae64-404a-b559-da880aee9ca6', NULL, '6dd61962-19b8-4cf2-8df7-ebaf7fbbb0ff', '2024-06-20', 'done'),
  ('484c190b-9241-490a-86b5-2243bc891ac0', 'Testar plataformas colaborativas', 'Comparar recursos de Miro, FigJam e Mural para sessões híbridas.', 'a14bac90-ae64-404a-b559-da880aee9ca6', NULL, 'a4644caa-9f6d-488e-bd1b-02083027d415', '2024-11-05', 'in-progress'),
  ('45882033-a459-409a-a9b1-911df7a2d646', 'Documentar boas práticas híbridas', 'Registrar padrões de facilitação remota em playbook visual.', 'a14bac90-ae64-404a-b559-da880aee9ca6', NULL, 'a4644caa-9f6d-488e-bd1b-02083027d415', '2024-12-10', 'todo'),
  ('6daa5fba-4b51-47ac-b1d4-159bea4f3018', 'Rodar piloto com clientes', 'Executar workshop híbrido com cliente estratégico e coletar feedback.', 'a14bac90-ae64-404a-b559-da880aee9ca6', NULL, 'a4644caa-9f6d-488e-bd1b-02083027d415', '2024-12-18', 'in-progress'),
  ('c0e8a889-3c12-4bc0-a2bb-34c4e3741aaa', 'Revisar materiais de kickoff', 'Atualizar templates e agenda padrão dos kickoffs.', '27b1f282-8a89-4473-87d0-d5f589cda236', NULL, '59c8cba3-4f27-45d8-a93e-4b2be11c31eb', '2024-09-20', 'in-progress'),
  ('ad6cc3ec-5e74-49ad-8191-c8f71be8a92b', 'Conduzir sessão piloto', 'Rodar kickoff com novo formato e validar com stakeholders.', '27b1f282-8a89-4473-87d0-d5f589cda236', NULL, '59c8cba3-4f27-45d8-a93e-4b2be11c31eb', '2024-10-02', 'todo'),
  ('9755cd78-4462-4062-ad6b-21835046b506', 'Ajustar checklist de risco', 'Incluir validações técnicas e comerciais antes do kickoff.', '27b1f282-8a89-4473-87d0-d5f589cda236', NULL, '59c8cba3-4f27-45d8-a93e-4b2be11c31eb', '2024-10-04', 'in-progress'),
  ('20d1b21e-4fbe-4f78-8061-ad139bb6cb5d', 'Mapear integrações necessárias', 'Identificar integrações e dependências para rollout do CRM.', '27b1f282-8a89-4473-87d0-d5f589cda236', NULL, '3abd9eba-e6dd-4de4-b9c8-c061ef39af66', '2024-12-05', 'todo'),
  ('f2f4c9c2-4db0-4948-afae-6d2a08800a33', 'Desenhar trilha de treinamento', 'Criar materiais de treinamento e agenda de capacitação.', '27b1f282-8a89-4473-87d0-d5f589cda236', NULL, '3abd9eba-e6dd-4de4-b9c8-c061ef39af66', '2025-01-08', 'todo'),
  ('72cb5e60-8bec-42d6-825e-e4bf72b9e820', 'Implantar dashboard executivo', 'Construir visão consolidada dos projetos em andamento.', '6a4774f2-8418-49ff-a8b9-c24562846350', NULL, 'c3621bde-b318-43ed-ac20-01d345edc6c9', '2024-08-15', 'done'),
  ('76861ae9-1643-4c14-bbe8-5862e4d3ec25', 'Padronizar rituais de priorização', 'Definir cerimônia quinzenal com líderes de contas.', '6a4774f2-8418-49ff-a8b9-c24562846350', NULL, 'c3621bde-b318-43ed-ac20-01d345edc6c9', '2024-09-05', 'done'),
  ('992dd573-c100-47df-ba72-adf818979e64', 'Treinar equipe em novos indicadores', 'Conduzir workshop com PMs e GPs sobre o novo modelo.', '6a4774f2-8418-49ff-a8b9-c24562846350', NULL, 'c3621bde-b318-43ed-ac20-01d345edc6c9', '2024-09-12', 'in-progress'),
  ('2e1cd60d-421a-4517-822b-1e82926b324e', 'Mapear fontes de dados', 'Identificar sistemas e acessos necessários para automação.', '6a4774f2-8418-49ff-a8b9-c24562846350', NULL, 'e9096b96-d741-43eb-9786-b2d81eda915a', '2024-10-25', 'todo'),
  ('59234fcf-75cf-43db-8461-e45d3c038567', 'Construir scripts de consolidação', 'Criar scripts em Python para compilar dados de projeto.', '6a4774f2-8418-49ff-a8b9-c24562846350', NULL, 'e9096b96-d741-43eb-9786-b2d81eda915a', '2024-11-20', 'in-progress'),
  ('2587f45f-08e9-41ef-9426-d09b1b25f131', 'Documentar padrões de arquitetura', 'Redigir documentação oficial da arquitetura front-end.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, 'e3265604-6765-44f1-a3a3-fe212666c2eb', '2024-05-30', 'done'),
  ('a1531864-d687-49a6-b1cd-88c7e71ec857', 'Realizar revisão técnica cruzada', 'Revisar com pares para garantir aderência aos padrões.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, 'e3265604-6765-44f1-a3a3-fe212666c2eb', '2024-06-20', 'done'),
  ('a3d5018f-5c24-445d-ad80-170eeff79f3f', 'Apresentar arquitetura para o time', 'Rodar sessão de alinhamento com desenvolvedores.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, 'e3265604-6765-44f1-a3a3-fe212666c2eb', '2024-07-05', 'done'),
  ('f1e875ea-685d-4af0-b3c7-0c743fe72c4f', 'Mapear gargalos do pipeline', 'Analisar tempo de build e etapas manuais do pipeline atual.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, '81806eeb-8cbf-4a0e-9bd3-4267a6ed57ad', '2024-10-20', 'in-progress'),
  ('16fa6831-ad2f-4990-9e29-69d2a21e1425', 'Implantar testes automatizados críticos', 'Criar suíte mínima de testes automatizados de regressão.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, '81806eeb-8cbf-4a0e-9bd3-4267a6ed57ad', '2024-11-30', 'todo'),
  ('bd24b59f-4500-43bd-ad85-0d20041d1d43', 'Monitorar métricas de implantação', 'Configurar alertas de falha e tempo médio de deploy.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, '81806eeb-8cbf-4a0e-9bd3-4267a6ed57ad', '2024-12-05', 'todo'),
  ('c4142a00-9e6d-4d91-8e05-e36941dbf04b', 'Desenhar trilha de estudos', 'Selecionar conteúdos base de liderança técnica e arquitetura.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, '5209737a-7c92-4a20-aabd-9c3fb04f4d8f', '2024-12-20', 'in-progress'),
  ('92c35e8c-14fc-4b99-89d4-082bee7c08b0', 'Criar calendário de mentoria técnica', 'Definir encontros mensais e temas principais.', 'e5561665-e906-4ed0-a3d0-40386db5cea0', NULL, '5209737a-7c92-4a20-aabd-9c3fb04f4d8f', '2025-01-30', 'todo')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  assignee_id = EXCLUDED.assignee_id,
  group_id = EXCLUDED.group_id,
  pdi_id = EXCLUDED.pdi_id,
  deadline = EXCLUDED.deadline,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 5: INSERIR GRUPOS DE AÇÃO E TAREFAS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO action_groups (
  id,
  title,
  description,
  deadline,
  status,
  created_by
) VALUES
  ('28f8d530-9757-443d-95ca-0bd33063881b', 'Campanha Black Friday 2024', 'Coordenação da campanha Black Friday com foco em branding e lançamentos.', '2024-11-20', 'active', 'cad26b49-b723-46a4-a228-bd1a30c49287'),
  ('cff647cf-30e5-4066-8017-4a92e2728880', 'Treinamento CRM Omnichannel', 'Treinamento completo do time comercial para o novo CRM integrado.', '2024-10-30', 'active', '27b1f282-8a89-4473-87d0-d5f589cda236')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  deadline = EXCLUDED.deadline,
  status = EXCLUDED.status,
  created_by = EXCLUDED.created_by,
  updated_at = NOW();

INSERT INTO action_group_participants (id, group_id, profile_id, role) VALUES
  ('b3009418-9ff9-4504-b166-9add6d8aef5d', '28f8d530-9757-443d-95ca-0bd33063881b', 'cad26b49-b723-46a4-a228-bd1a30c49287', 'leader'),
  ('ef8fba31-cc69-4cb0-ab4d-ef022d947cbb', '28f8d530-9757-443d-95ca-0bd33063881b', 'a14bac90-ae64-404a-b559-da880aee9ca6', 'member'),
  ('13cfd97e-0f38-4e27-92d9-72da6f7de766', '28f8d530-9757-443d-95ca-0bd33063881b', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'member'),
  ('fb8c3437-768c-4e4a-85fd-433cba64e257', '28f8d530-9757-443d-95ca-0bd33063881b', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', 'member'),
  ('128aca32-9a5f-4b4d-8596-e993419b8f33', '28f8d530-9757-443d-95ca-0bd33063881b', 'e5561665-e906-4ed0-a3d0-40386db5cea0', 'member'),
  ('8bb0beea-69df-45ef-a38b-9c1959be867d', 'cff647cf-30e5-4066-8017-4a92e2728880', '27b1f282-8a89-4473-87d0-d5f589cda236', 'leader'),
  ('5ab0e35f-9b7a-43ff-b55e-dd202eb23f86', 'cff647cf-30e5-4066-8017-4a92e2728880', '6a4774f2-8418-49ff-a8b9-c24562846350', 'member'),
  ('705e8cc1-8808-4df7-b498-93104e70bcf5', 'cff647cf-30e5-4066-8017-4a92e2728880', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 'member'),
  ('826f6dee-9b01-4456-9f42-9bba0c132e91', 'cff647cf-30e5-4066-8017-4a92e2728880', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', 'member'),
  ('0563943c-3098-4d0c-85cf-ca23fbea0d9c', 'cff647cf-30e5-4066-8017-4a92e2728880', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'member')
ON CONFLICT (id) DO UPDATE SET
  group_id = EXCLUDED.group_id,
  profile_id = EXCLUDED.profile_id,
  role = EXCLUDED.role;

INSERT INTO tasks (
  id,
  title,
  description,
  assignee_id,
  group_id,
  pdi_id,
  deadline,
  status
) VALUES
  ('ad024757-e876-47b9-b64c-2b048b367845', 'Planejar campanha multicanal', 'Consolidar cronograma e orçamentos com marketing e produto.', 'cad26b49-b723-46a4-a228-bd1a30c49287', '28f8d530-9757-443d-95ca-0bd33063881b', NULL, '2024-10-10', 'in-progress'),
  ('0d0bfea1-dce2-413a-b930-d0882da82ef4', 'Produzir peças-chave', 'Coordenar criação de landing page, emails e peças sociais.', 'a14bac90-ae64-404a-b559-da880aee9ca6', '28f8d530-9757-443d-95ca-0bd33063881b', NULL, '2024-10-25', 'todo'),
  ('beb09fb6-1e2d-4c01-adad-ecf4e04e7e04', 'Validar experiência mobile', 'Executar testes de usabilidade e ajustes em dispositivos móveis.', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', '28f8d530-9757-443d-95ca-0bd33063881b', NULL, '2024-11-05', 'in-progress'),
  ('a780df70-6aae-4a33-92eb-8f554f209662', 'Preparar monitoramento em tempo real', 'Configurar painéis de acompanhamento durante a campanha.', '6a4774f2-8418-49ff-a8b9-c24562846350', '28f8d530-9757-443d-95ca-0bd33063881b', NULL, '2024-11-15', 'todo'),
  ('976c7a2f-515c-4090-8cc5-5a22bc3e08be', 'Apresentar resultados parciais', 'Compartilhar aprendizados do pré-lançamento com diretoria.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', '28f8d530-9757-443d-95ca-0bd33063881b', NULL, '2024-11-18', 'done'),
  ('b8d71c42-d548-49c3-ab81-a4c2b453d0ff', 'Mapear necessidades do time comercial', 'Identificar lacunas de conhecimento e expectativas da equipe.', '27b1f282-8a89-4473-87d0-d5f589cda236', 'cff647cf-30e5-4066-8017-4a92e2728880', NULL, '2024-09-25', 'done'),
  ('f8f20b4a-a52e-4e57-83c3-624899e997d8', 'Produzir trilha prática do CRM', 'Criar módulos com fluxos reais e exercícios guiados.', '6a4774f2-8418-49ff-a8b9-c24562846350', 'cff647cf-30e5-4066-8017-4a92e2728880', NULL, '2024-10-05', 'in-progress'),
  ('3ed77346-49f7-48aa-9178-e929aa210732', 'Conduzir workshop piloto', 'Rodar turma piloto com avaliação de satisfação e dúvidas.', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 'cff647cf-30e5-4066-8017-4a92e2728880', NULL, '2024-10-15', 'todo'),
  ('4276e484-a5d9-41c1-b025-363e422e132f', 'Ajustar materiais pós-piloto', 'Incorporar feedbacks coletados e preparar rollout geral.', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'cff647cf-30e5-4066-8017-4a92e2728880', NULL, '2024-10-25', 'todo')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  assignee_id = EXCLUDED.assignee_id,
  group_id = EXCLUDED.group_id,
  pdi_id = EXCLUDED.pdi_id,
  deadline = EXCLUDED.deadline,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 6: INSERIR SOLICITAÇÕES E PROGRAMAS DE MENTORIA
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO mentorship_requests (
  id,
  mentor_id,
  mentee_id,
  message,
  status
) VALUES
  ('d7dcc4d2-3343-4668-882b-fe4e26ded5ed', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', 'Gostaria de mentoria em discovery avançado e priorização de backlog.', 'accepted'),
  ('e77f7bee-d1de-43da-b131-76a93b6c1df6', 'cad26b49-b723-46a4-a228-bd1a30c49287', '27b1f282-8a89-4473-87d0-d5f589cda236', 'Preciso de apoio para conduzir ritos de projetos com clientes estratégicos.', 'accepted'),
  ('7a862aa1-d2d5-4c1d-b6f5-48b4da6b2831', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 'e5561665-e906-4ed0-a3d0-40386db5cea0', 'Quero evoluir competências de liderança técnica e gestão de portfólio.', 'pending'),
  ('94beae8d-7d14-4019-89e3-e3387e06beb6', 'a14bac90-ae64-404a-b559-da880aee9ca6', '6a4774f2-8418-49ff-a8b9-c24562846350', 'Busco orientação sobre facilitação de workshops com foco em operações.', 'pending'),
  ('cffb3658-af4f-4d07-849d-d0f137a6f4fd', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'Gostaria de mentoria para estruturar trilhas de carreira e sucessão.', 'accepted')
ON CONFLICT (id) DO UPDATE SET
  mentor_id = EXCLUDED.mentor_id,
  mentee_id = EXCLUDED.mentee_id,
  message = EXCLUDED.message,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO mentorships (
  id,
  mentor_id,
  mentee_id,
  status,
  started_at
) VALUES
  ('ecb833bc-a8ab-47e2-bf1c-f782c2bf0940', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', 'active', '2024-08-20'),
  ('2ea7c580-0f58-4e7e-b6fb-7e3697390c96', 'cad26b49-b723-46a4-a228-bd1a30c49287', '27b1f282-8a89-4473-87d0-d5f589cda236', 'active', '2024-09-05'),
  ('d13347a2-7821-4b12-adb0-ea2fe62bd145', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'active', '2024-07-15')
ON CONFLICT (id) DO UPDATE SET
  mentor_id = EXCLUDED.mentor_id,
  mentee_id = EXCLUDED.mentee_id,
  status = EXCLUDED.status,
  started_at = EXCLUDED.started_at,
  updated_at = NOW();

INSERT INTO mentorship_sessions (
  id,
  mentorship_id,
  session_date,
  duration_minutes,
  topics_discussed,
  action_items,
  mentor_feedback,
  mentee_feedback
) VALUES
  ('d362befb-3861-4484-8786-64de1b9af786', 'ecb833bc-a8ab-47e2-bf1c-f782c2bf0940', '2024-09-02 14:00:00+00', 60, 'Planejamento de discovery e definição de métricas.', 'Mapear stakeholders e preparar roteiro para entrevistas.', 'Ótimo avanço na clareza dos objetivos.', 'Sinto-me mais confiante para conduzir entrevistas.'),
  ('a280c7ae-5c41-4cfd-ab1d-84c522dbd0fd', 'ecb833bc-a8ab-47e2-bf1c-f782c2bf0940', '2024-09-23 14:00:00+00', 55, 'Análise de entrevistas e priorização de insights.', 'Criar matriz de impacto e definir próximos experimentos.', 'Excelente síntese dos achados.', 'Feedback direcionado e aplicável de imediato.'),
  ('5622c8c3-6390-41e7-b07b-3320fb1c9dfa', '2ea7c580-0f58-4e7e-b6fb-7e3697390c96', '2024-09-18 16:00:00+00', 50, 'Roteiro de kickoff e gestão de expectativas.', 'Preparar checklist de kickoff e comunicar ao time.', 'Pedro evoluiu bastante desde o último ciclo.', 'Ferramentas compartilhadas facilitaram a implementação.')
ON CONFLICT (id) DO UPDATE SET
  mentorship_id = EXCLUDED.mentorship_id,
  session_date = EXCLUDED.session_date,
  duration_minutes = EXCLUDED.duration_minutes,
  topics_discussed = EXCLUDED.topics_discussed,
  action_items = EXCLUDED.action_items,
  mentor_feedback = EXCLUDED.mentor_feedback,
  mentee_feedback = EXCLUDED.mentee_feedback;

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 7: INSERIR CHECK-INS DE SAÚDE MENTAL
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO emotional_checkins (
  id,
  employee_id,
  checkin_date,
  mood_rating,
  stress_level,
  energy_level,
  sleep_quality,
  notes
) VALUES
  ('a6706ed2-9af9-4378-8954-4e55283867b3', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', (CURRENT_DATE - INTERVAL '6 days')::date, 5, 7, 4, 5, 'Semana intensa com entregas simultâneas, alinhando suporte com mentora.'),
  ('ab63dc31-ba08-49bb-b271-08cd1db4e650', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', (CURRENT_DATE - INTERVAL '2 days')::date, 6, 6, 6, 6, 'Aplicando práticas de respiração e delegando melhor tarefas.'),
  ('ef154bfe-e8bf-46fe-882f-990251cc00f8', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', (CURRENT_DATE - INTERVAL '5 days')::date, 8, 4, 7, 7, 'Semana produtiva revisando mentoria e estrutura do time.'),
  ('c1c16fb0-3c1b-49ee-84d5-a800005c59fc', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', (CURRENT_DATE - INTERVAL '1 day')::date, 7, 3, 7, 6, 'Preparando novos materiais de carreira; sensação de progresso.'),
  ('65d7c323-75b3-48ff-b254-d38f4a21ec38', 'a14bac90-ae64-404a-b559-da880aee9ca6', (CURRENT_DATE - INTERVAL '4 days')::date, 9, 3, 8, 7, 'Concluí workshop avançado; energia alta e feedback positivo.'),
  ('5ab4bc92-080b-4cca-bc98-24d28475263b', 'a14bac90-ae64-404a-b559-da880aee9ca6', (CURRENT_DATE - INTERVAL '1 day')::date, 8, 3, 7, 7, 'Mantendo rotina equilibrada entre entregas e mentorias.'),
  ('d0343a65-c3a2-46f2-b2f8-95ed2b039c6a', '27b1f282-8a89-4473-87d0-d5f589cda236', (CURRENT_DATE - INTERVAL '3 days')::date, 6, 5, 6, 6, 'Organizando treinamentos e lidando com demandas de clientes.'),
  ('9cfdde41-8027-46d8-9ac8-b2605175f21d', '27b1f282-8a89-4473-87d0-d5f589cda236', (CURRENT_DATE - INTERVAL '1 day')::date, 7, 4, 7, 7, 'Mentoria ajudou na priorização do plano de rollout.'),
  ('dd415057-a3d2-4127-8181-f0e1ad3f0998', '6a4774f2-8418-49ff-a8b9-c24562846350', (CURRENT_DATE - INTERVAL '5 days')::date, 6, 5, 6, 6, 'Alta demanda de relatórios, mas suporte do time mitigou pressão.'),
  ('04931d4e-c09a-4d50-9188-97433b0572cf', '6a4774f2-8418-49ff-a8b9-c24562846350', (CURRENT_DATE - INTERVAL '2 days')::date, 7, 4, 7, 7, 'Automação de relatórios em andamento, sensação de evolução.'),
  ('2a2d5fb7-36d3-44cc-878c-7de16d352ef9', 'e5561665-e906-4ed0-a3d0-40386db5cea0', (CURRENT_DATE - INTERVAL '4 days')::date, 7, 5, 7, 6, 'Pipeline de CI/CD exigiu ajustes, mas time colaborou bem.'),
  ('13fb5cca-a73a-4876-bce4-1fe644033a3a', 'e5561665-e906-4ed0-a3d0-40386db5cea0', (CURRENT_DATE - INTERVAL '1 day')::date, 8, 4, 8, 7, 'Mentorias renderam bons insights e evolução da trilha técnica.')
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  checkin_date = EXCLUDED.checkin_date,
  mood_rating = EXCLUDED.mood_rating,
  stress_level = EXCLUDED.stress_level,
  energy_level = EXCLUDED.energy_level,
  sleep_quality = EXCLUDED.sleep_quality,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTE 8: INSERIR NOTIFICAÇÕES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO notifications (
  id,
  profile_id,
  title,
  message,
  type,
  read,
  action_url,
  created_at
) VALUES
  ('98c5e901-3425-4e23-96cf-eabfc34051be', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 'Validação pendente de PDI', 'Maria aguarda sua validação do PDI "Fortalecer pesquisa estratégica".', 'error', false, 'https://app.deapdi.local/pdis/29494d48-3f63-4a76-bdfa-43ae26a3b1da', NOW() - INTERVAL '6 hours'),
  ('b0b294a6-f83a-4daf-99fe-c44c105233ac', '0fbd25b0-ea9c-45e4-a19c-f1ea3403e445', 'Mentoria concluída', 'Mentoria de Maria com Nathalia foi concluída e registrada.', 'info', true, NULL, NOW() - INTERVAL '1 day'),
  ('385a40df-1157-43f7-88a3-4176cb3162b6', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 'Novo pedido de mentoria', 'Julia solicitou mentoria sobre trilhas de carreira.', 'warning', false, 'https://app.deapdi.local/mentorias', NOW() - INTERVAL '5 hours'),
  ('fc0b6b53-5148-41db-a1cb-45ed7dc8400b', '55158bb7-b884-43ae-bf2e-953fc0cb0e4b', 'Sessão piloto agendada', 'Workshop piloto do CRM foi agendado para 15/10.', 'success', true, NULL, NOW() - INTERVAL '12 hours'),
  ('10c0e906-320a-4abe-81c0-85bc2653dc1e', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', 'Feedback da mentoria', 'Maria registrou feedback positivo na última sessão.', 'success', false, 'https://app.deapdi.local/mentorias/feedback', NOW() - INTERVAL '4 hours'),
  ('cdab6e7f-6193-4711-955f-53440e71c04e', 'cebe7528-c574-43a2-b21d-7905b28ee9d1', 'PDI validado', 'PDI "Escalar arquitetura front-end" foi validado com sucesso.', 'info', true, NULL, NOW() - INTERVAL '2 days'),
  ('efadcc9a-42ef-42ca-b891-0edb8cc8114d', 'cad26b49-b723-46a4-a228-bd1a30c49287', 'Check-in com alto estresse', 'Maria registrou estresse elevado no último check-in.', 'warning', false, 'https://app.deapdi.local/wellness', NOW() - INTERVAL '3 hours'),
  ('2c58c37a-f4b0-47ed-9da8-2894ea9675fc', 'cad26b49-b723-46a4-a228-bd1a30c49287', 'Grupo Black Friday atualizado', '3 tarefas concluídas no grupo de ação Black Friday.', 'success', true, 'https://app.deapdi.local/action-groups/28f8d530-9757-443d-95ca-0bd33063881b', NOW() - INTERVAL '8 hours'),
  ('edf58d68-5d1a-4d1f-a2cd-fdfad2be1cce', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', 'Mentoria confirmada', 'Sua sessão com Nathalia está confirmada para 23/09 às 14h.', 'info', false, NULL, NOW() - INTERVAL '10 hours'),
  ('361973ae-a67e-4060-be3f-2b6850d5e80a', '7278b804-6b4f-4e31-8b78-87aa2295d2c3', 'Tarefa concluída', 'Você concluiu "Documentar fluxo ideal" e ganhou 30 pontos.', 'success', true, NULL, NOW() - INTERVAL '1 day'),
  ('cb377d8b-a12f-41d8-8d73-c844a230d7d2', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'Alerta de equipe', 'Pedro ainda não finalizou o checklist de risco do kickoff.', 'warning', false, 'https://app.deapdi.local/pdis/59c8cba3-4f27-45d8-a93e-4b2be11c31eb', NOW() - INTERVAL '7 hours'),
  ('646684d8-7222-45aa-b98c-bc9655978c52', 'bb6d9b49-6cd0-40fa-ae38-0defcbce924c', 'Feedback recebido', 'Equipe avaliou positivamente o programa de mentoria piloto.', 'info', true, NULL, NOW() - INTERVAL '16 hours'),
  ('deeb5ba9-178a-4657-868e-a9e5b57694b7', 'a14bac90-ae64-404a-b559-da880aee9ca6', 'Nova tarefa atribuída', 'Você foi atribuída à tarefa "Preparar monitoramento em tempo real".', 'info', false, 'https://app.deapdi.local/action-groups/28f8d530-9757-443d-95ca-0bd33063881b', NOW() - INTERVAL '6 hours'),
  ('3e18744c-b964-4eba-975e-a92806852da0', 'a14bac90-ae64-404a-b559-da880aee9ca6', 'Mentoria confirmada', 'Lucila solicitou acompanhamento para facilitação híbrida.', 'success', true, NULL, NOW() - INTERVAL '20 hours'),
  ('e2bea810-7304-4496-b0e2-8767c3eeab22', '27b1f282-8a89-4473-87d0-d5f589cda236', 'Checklist pendente', 'Finalize o checklist de risco antes do kickoff de 02/10.', 'warning', false, 'https://app.deapdi.local/pdis/59c8cba3-4f27-45d8-a93e-4b2be11c31eb', NOW() - INTERVAL '9 hours'),
  ('cee1b40f-ce38-416c-af39-2de1140c38f0', '27b1f282-8a89-4473-87d0-d5f589cda236', 'Trilha CRM atualizada', 'Novos materiais de apoio estão disponíveis para download.', 'success', true, NULL, NOW() - INTERVAL '18 hours'),
  ('c14eb4e1-e4cb-4dcf-8015-8dfafb6bcace', '6a4774f2-8418-49ff-a8b9-c24562846350', 'Novo roteiro de dados', 'Revise o roteiro de integrações antes do workshop de automação.', 'info', false, 'https://app.deapdi.local/pdis/e9096b96-d741-43eb-9786-b2d81eda915a', NOW() - INTERVAL '11 hours'),
  ('9a6bfd50-4862-4b9e-b224-941defc971af', '6a4774f2-8418-49ff-a8b9-c24562846350', 'Dashboard entregue', 'Dashboard executivo foi publicado e compartilhado com stakeholders.', 'success', true, NULL, NOW() - INTERVAL '2 days'),
  ('84014ab4-6827-4822-8c94-bb31a3405a87', 'e5561665-e906-4ed0-a3d0-40386db5cea0', 'Atualização no pipeline', 'Nova etapa de testes automatizados adicionada à esteira.', 'info', false, 'https://app.deapdi.local/pdis/81806eeb-8cbf-4a0e-9bd3-4267a6ed57ad', NOW() - INTERVAL '3 hours'),
  ('e58440b8-cd15-4e4e-a4af-863b5b48ce1e', 'e5561665-e906-4ed0-a3d0-40386db5cea0', 'Feedback do time de engenharia', 'Time destacou evolução da documentação de arquitetura.', 'warning', true, NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  profile_id = EXCLUDED.profile_id,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  type = EXCLUDED.type,
  read = EXCLUDED.read,
  action_url = EXCLUDED.action_url,
  created_at = EXCLUDED.created_at;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. JULIA RISSIN (Designer Pleno - Equipe Silvia)
-- ────────────────────────────────────────────────────────────────────────────
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
  'bb6d9b49-6cd0-40fa-ae38-0defcbce924c',
  'julia@deadesign.com.br',
  'Julia Rissin',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  'cad26b49-b723-46a4-a228-bd1a30c49287', -- Silvia como gestora
  'Pleno',
  'Designer Pleno',
  250,
  'Designer pleno com experiência em branding e identidade visual.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 7. JULIANA HOBO (Designer Sr - Equipe Silvia)
-- ────────────────────────────────────────────────────────────────────────────
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
  'a14bac90-ae64-404a-b559-da880aee9ca6',
  'juliana@deadesign.com.br',
  'Juliana Hobo',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  'cad26b49-b723-46a4-a228-bd1a30c49287', -- Silvia como gestora
  'Sênior',
  'Designer Sênior',
  350,
  'Designer sênior com expertise em projetos complexos e liderança técnica.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 8. PEDRO OLIVEIRA (GP Jr - Equipe Silvia)
-- ────────────────────────────────────────────────────────────────────────────
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
  '27b1f282-8a89-4473-87d0-d5f589cda236',
  'pedro@deadesign.com.br',
  'Pedro Oliveira',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  'cad26b49-b723-46a4-a228-bd1a30c49287', -- Silvia como gestora
  'Júnior',
  'Gerente de Projetos Jr',
  120,
  'Gerente de projetos júnior focado em desenvolvimento de habilidades de gestão.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 9. LUCILA MURANAKA (Analista Sr - Equipe Silvia)
-- ────────────────────────────────────────────────────────────────────────────
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
  '6a4774f2-8418-49ff-a8b9-c24562846350',
  'lucila@deadesign.com.br',
  'Lucila Muranaka',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Projetos' LIMIT 1),
  'cad26b49-b723-46a4-a228-bd1a30c49287', -- Silvia como gestora
  'Sênior',
  'Analista de Projetos Sr',
  280,
  'Analista de projetos sênior com expertise em gestão de processos.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 10. ROBERTO FAGARAZ (Desenvolvedor Sr - Equipe Nathalia)
-- ────────────────────────────────────────────────────────────────────────────
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
  'e5561665-e906-4ed0-a3d0-40386db5cea0',
  'roberto@deadesign.com.br',
  'Roberto Fagaraz',
  'employee'::user_role,
  (SELECT id FROM teams WHERE name = 'Design' LIMIT 1),
  'cebe7528-c574-43a2-b21d-7905b28ee9d1', -- Nathalia como gestora
  'Sênior',
  'Desenvolvedor Sênior',
  380,
  'Desenvolvedor sênior com expertise em soluções técnicas e inovação.',
  'active'::user_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id,
  updated_at = NOW();

COMMIT;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'SUCESSO! Dados dos usuários DeaDesign inseridos com sucesso!';
  RAISE NOTICE '══════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Verifique os usuários criados executando as queries de validação abaixo';
  RAISE NOTICE '2. Se os usuários Auth não existirem, crie-os no Supabase Dashboard';
  RAISE NOTICE '3. Use a senha padrão: DEA@pdi para todos os usuários';
  RAISE NOTICE '';
  RAISE NOTICE 'Para criar usuários Auth manualmente:';
  RAISE NOTICE '- Acesse: Supabase Dashboard > Authentication > Add User';
  RAISE NOTICE '- Use os emails e UUIDs listados no início deste script';
  RAISE NOTICE '══════════════════════════════════════════════════════════════════════════════';
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- QUERIES DE VALIDAÇÃO
-- ══════════════════════════════════════════════════════════════════════════════
--
-- DESCOMENTE AS QUERIES ABAIXO PARA VALIDAR OS DADOS INSERIDOS
-- ══════════════════════════════════════════════════════════════════════════════

-- Query 1: Verificar todos os usuários DeaDesign
/*
SELECT 
  p.name as "Nome",
  p.email as "Email",
  p.role as "Perfil",
  p.position as "Cargo",
  p.level as "Nível",
  t.name as "Departamento",
  g.name as "Gestor"
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN profiles g ON p.manager_id = g.id
WHERE p.email LIKE '%@deadesign.com.br'
ORDER BY 
  CASE p.role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
  END,
  p.name;
*/

-- Query 2: Verificar hierarquia organizacional
/*
SELECT 
  g.name as "Gestora",
  COUNT(p.id) as "Total na Equipe",
  STRING_AGG(p.name || ' (' || p.level || ')', ', ') as "Membros"
FROM profiles p
JOIN profiles g ON p.manager_id = g.id
WHERE p.role = 'employee'
  AND p.email LIKE '%@deadesign.com.br'
GROUP BY g.id, g.name
ORDER BY g.name;
*/

-- Query 3: Resumo por departamento
/*
SELECT 
  t.name as "Departamento",
  COUNT(p.id) as "Total Pessoas",
  STRING_AGG(p.name || ' (' || p.position || ')', ', ') as "Equipe"
FROM teams t
LEFT JOIN profiles p ON p.team_id = t.id
WHERE p.email LIKE '%@deadesign.com.br' OR p.email IS NULL
GROUP BY t.id, t.name
ORDER BY COUNT(p.id) DESC;
*/

-- Query 4: Verificar usuários Auth vs Profiles
/*
SELECT 
  p.id,
  p.name,
  p.email,
  CASE 
    WHEN au.id IS NOT NULL THEN '✓ Existe'
    ELSE '✗ Faltando'
  END as "Status Auth"
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.email LIKE '%@deadesign.com.br'
ORDER BY p.name;
*/

-- Query 5: Resumo de dados inseridos
/*
SELECT 
  'Profiles' as "Tabela",
  COUNT(*) as "Total DeaDesign",
  COUNT(*) FILTER (WHERE role = 'admin') as "Admin",
  COUNT(*) FILTER (WHERE role = 'hr') as "RH",
  COUNT(*) FILTER (WHERE role = 'manager') as "Gestores",
  COUNT(*) FILTER (WHERE role = 'employee') as "Funcionários"
FROM profiles
WHERE email LIKE '%@deadesign.com.br'
UNION ALL
SELECT 
  'PDIs',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'pending'),
  COUNT(*) FILTER (WHERE status = 'in-progress'),
  COUNT(*) FILTER (WHERE status = 'validated'),
  COUNT(*) FILTER (WHERE status = 'completed')
FROM pdis
WHERE profile_id IN (SELECT id FROM profiles WHERE email LIKE '%@deadesign.com.br')
UNION ALL
SELECT 
  'Tasks',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'todo'),
  COUNT(*) FILTER (WHERE status = 'in-progress'),
  COUNT(*) FILTER (WHERE status = 'done'),
  NULL
FROM tasks
WHERE assignee_id IN (SELECT id FROM profiles WHERE email LIKE '%@deadesign.com.br')
UNION ALL
SELECT 
  'Competências',
  COUNT(*),
  COUNT(*) FILTER (WHERE type = 'soft'),
  COUNT(*) FILTER (WHERE type = 'hard'),
  NULL,
  NULL
FROM competencies
WHERE profile_id IN (SELECT id FROM profiles WHERE email LIKE '%@deadesign.com.br')
UNION ALL
SELECT 
  'Mentorias',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'active'),
  COUNT(*) FILTER (WHERE status = 'completed'),
  NULL,
  NULL
FROM mentorships
WHERE mentor_id IN (SELECT id FROM profiles WHERE email LIKE '%@deadesign.com.br')
   OR mentee_id IN (SELECT id FROM profiles WHERE email LIKE '%@deadesign.com.br')
UNION ALL
SELECT 
  'Check-ins',
  COUNT(*),
  ROUND(AVG(mood_rating), 1),
  ROUND(AVG(stress_level), 1),
  ROUND(AVG(energy_level), 1),
  ROUND(AVG(sleep_quality), 1)
FROM emotional_checkins
WHERE employee_id IN (SELECT id FROM profiles WHERE email LIKE '%@deadesign.com.br');
*/
