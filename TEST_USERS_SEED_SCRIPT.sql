-- ══════════════════════════════════════════════════════════════════════════════
-- DEAPDI TALENTFLOW - SCRIPT DE CRIAÇÃO DE USUÁRIOS DEADESIGN
-- ══════════════════════════════════════════════════════════════════════════════
--
-- IMPORTANTE: Este script deve ser executado APÓS a criação dos usuários no Auth
-- 
-- ESTRUTURA DO SCRIPT:
-- ===================
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

-- ══════════════════════════════════════════════════════════════════════════════
-- QUERIES DE VALIDAÇÃO
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
