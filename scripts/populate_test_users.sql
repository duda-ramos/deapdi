/*
  Script para Popular Usuários de Teste para UAT

  IMPORTANTE: Execute este script APENAS no ambiente de staging/test
  NÃO execute em produção!

  Este script cria 4 usuários de teste com diferentes papéis para validação UAT.
*/

-- ============================================================================
-- USUÁRIOS DE TESTE
-- ============================================================================

-- Nota: Os usuários precisam ser criados via auth.users primeiro
-- Depois os perfis serão sincronizados automaticamente

-- Para criar usuários, use o Supabase Dashboard ou a API de Auth:
-- 1. Vá em Authentication → Users
-- 2. Clique em "Add User"
-- 3. Use os emails abaixo

-- ============================================================================
-- CREDENCIAIS PARA CRIAÇÃO MANUAL
-- ============================================================================

/*
  ADMIN:
  Email: admin@empresa.com
  Password: admin123
  Role: admin

  HR:
  Email: rh@empresa.com
  Password: rh123456
  Role: hr

  MANAGER:
  Email: gestor@empresa.com
  Password: gestor123
  Role: manager

  EMPLOYEE:
  Email: colaborador@empresa.com
  Password: colab123
  Role: employee
*/

-- ============================================================================
-- APÓS CRIAR OS USUÁRIOS NO AUTH, EXECUTE ESTE SCRIPT
-- ============================================================================

-- Este script atualiza os perfis dos usuários de teste com informações completas

-- Buscar IDs dos usuários criados
DO $$
DECLARE
  admin_id uuid;
  hr_id uuid;
  manager_id uuid;
  employee_id uuid;
  test_team_id uuid;
BEGIN
  -- Buscar os IDs dos usuários pelo email
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@empresa.com';
  SELECT id INTO hr_id FROM profiles WHERE email = 'rh@empresa.com';
  SELECT id INTO manager_id FROM profiles WHERE email = 'gestor@empresa.com';
  SELECT id INTO employee_id FROM profiles WHERE email = 'colaborador@empresa.com';

  -- Verificar se os usuários existem
  IF admin_id IS NULL OR hr_id IS NULL OR manager_id IS NULL OR employee_id IS NULL THEN
    RAISE NOTICE 'ATENÇÃO: Nem todos os usuários foram encontrados. Crie-os primeiro no Authentication.';
    RAISE NOTICE 'Admin: %, HR: %, Manager: %, Employee: %', admin_id, hr_id, manager_id, employee_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Usuários encontrados. Atualizando perfis...';

  -- Criar um time de teste
  INSERT INTO teams (name, description, leader_id)
  VALUES ('Time de Testes UAT', 'Time para testes de aceitação do usuário', manager_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_team_id;

  -- Se o time já existe, buscar seu ID
  IF test_team_id IS NULL THEN
    SELECT id INTO test_team_id FROM teams WHERE name = 'Time de Testes UAT';
  END IF;

  -- Atualizar perfil do ADMIN
  UPDATE profiles SET
    name = 'Administrador Sistema',
    role = 'admin',
    position = 'Administrador',
    level = 'Principal',
    bio = 'Administrador do sistema TalentFlow para testes',
    status = 'active',
    is_onboarded = true,
    admission_date = CURRENT_DATE - INTERVAL '2 years',
    area = 'TI',
    phone = '(11) 99999-0001',
    location = 'São Paulo, SP',
    hard_skills = ARRAY['Gestão de Sistemas', 'Segurança', 'Administração'],
    soft_skills = ARRAY['Liderança', 'Comunicação', 'Resolução de Problemas'],
    career_objectives = 'Garantir a segurança e estabilidade do sistema',
    mentorship_availability = true,
    updated_at = NOW()
  WHERE id = admin_id;

  -- Atualizar perfil do HR
  UPDATE profiles SET
    name = 'RH Recursos Humanos',
    role = 'hr',
    position = 'Analista de RH',
    level = 'Pleno',
    bio = 'Responsável pela gestão de pessoas e talentos',
    status = 'active',
    is_onboarded = true,
    team_id = test_team_id,
    admission_date = CURRENT_DATE - INTERVAL '1 year',
    area = 'Recursos Humanos',
    phone = '(11) 99999-0002',
    location = 'São Paulo, SP',
    hard_skills = ARRAY['Recrutamento', 'Avaliação de Desempenho', 'People Analytics'],
    soft_skills = ARRAY['Empatia', 'Comunicação', 'Gestão de Conflitos'],
    career_objectives = 'Desenvolver programas de desenvolvimento de talentos',
    mentorship_availability = true,
    updated_at = NOW()
  WHERE id = hr_id;

  -- Atualizar perfil do MANAGER
  UPDATE profiles SET
    name = 'Gestor Líder',
    role = 'manager',
    position = 'Gerente de Projetos',
    level = 'Sênior',
    bio = 'Gestor responsável por liderar equipes de alta performance',
    status = 'active',
    is_onboarded = true,
    team_id = test_team_id,
    admission_date = CURRENT_DATE - INTERVAL '3 years',
    area = 'Projetos',
    phone = '(11) 99999-0003',
    location = 'São Paulo, SP',
    hard_skills = ARRAY['Gestão de Projetos', 'Metodologias Ágeis', 'Planejamento Estratégico'],
    soft_skills = ARRAY['Liderança', 'Visão Estratégica', 'Tomada de Decisão'],
    career_objectives = 'Desenvolver líderes de alta performance',
    mentorship_availability = true,
    updated_at = NOW()
  WHERE id = manager_id;

  -- Atualizar perfil do EMPLOYEE
  UPDATE profiles SET
    name = 'Colaborador Exemplo',
    role = 'employee',
    position = 'Desenvolvedor Full Stack',
    level = 'Júnior',
    bio = 'Desenvolvedor em busca de crescimento profissional',
    status = 'active',
    is_onboarded = true,
    team_id = test_team_id,
    manager_id = manager_id,
    admission_date = CURRENT_DATE - INTERVAL '6 months',
    area = 'Tecnologia',
    phone = '(11) 99999-0004',
    location = 'São Paulo, SP',
    hard_skills = ARRAY['JavaScript', 'React', 'Node.js', 'SQL'],
    soft_skills = ARRAY['Trabalho em Equipe', 'Proatividade', 'Aprendizado Rápido'],
    career_objectives = 'Tornar-se desenvolvedor sênior em 3 anos',
    mentorship_availability = false,
    development_interests = ARRAY['Arquitetura de Software', 'Cloud Computing', 'DevOps'],
    updated_at = NOW()
  WHERE id = employee_id;

  RAISE NOTICE '✅ Perfis atualizados com sucesso!';
  RAISE NOTICE 'Admin ID: %', admin_id;
  RAISE NOTICE 'HR ID: %', hr_id;
  RAISE NOTICE 'Manager ID: %', manager_id;
  RAISE NOTICE 'Employee ID: %', employee_id;
  RAISE NOTICE 'Test Team ID: %', test_team_id;

END $$;

-- ============================================================================
-- DADOS DE EXEMPLO PARA TESTES
-- ============================================================================

-- Inserir algumas competências de exemplo
INSERT INTO competencies (name, description, category, level, department, status)
VALUES
  ('React Avançado', 'Desenvolvimento avançado com React', 'technical', 'advanced', 'Tecnologia', 'active'),
  ('Liderança', 'Capacidade de liderar equipes', 'behavioral', 'intermediate', 'Geral', 'active'),
  ('Comunicação Efetiva', 'Comunicação clara e assertiva', 'behavioral', 'basic', 'Geral', 'active'),
  ('SQL', 'Consultas e modelagem de banco de dados', 'technical', 'intermediate', 'Tecnologia', 'active'),
  ('Gestão de Projetos', 'Planejamento e execução de projetos', 'technical', 'advanced', 'Projetos', 'active')
ON CONFLICT (name) DO NOTHING;

-- Inserir alguns templates de conquistas
INSERT INTO achievement_templates (
  title,
  description,
  icon,
  points,
  category,
  criteria,
  is_active
)
VALUES
  ('Primeiro PDI', 'Criou seu primeiro PDI', '🎯', 50, 'milestone', '{"action": "create_pdi", "count": 1}', true),
  ('Autoavaliação Completa', 'Completou autoavaliação de competências', '📊', 100, 'competency', '{"action": "self_assessment", "min_competencies": 5}', true),
  ('Mentor Ativo', 'Realizou 5 sessões de mentoria', '👨‍🏫', 200, 'mentorship', '{"action": "mentor_sessions", "count": 5}', true),
  ('Trabalho em Equipe', 'Participou de 3 grupos de ação', '🤝', 150, 'collaboration', '{"action": "join_groups", "count": 3}', true),
  ('Aprendizado Contínuo', 'Completou 3 cursos', '📚', 300, 'learning', '{"action": "complete_courses", "count": 3}', true)
ON CONFLICT (title) DO NOTHING;

-- Criar um PDI de exemplo para o colaborador
DO $$
DECLARE
  employee_id uuid;
  example_pdi_id uuid;
BEGIN
  SELECT id INTO employee_id FROM profiles WHERE email = 'colaborador@empresa.com';

  IF employee_id IS NOT NULL THEN
    INSERT INTO pdis (
      user_id,
      title,
      description,
      target_date,
      status,
      priority
    )
    VALUES (
      employee_id,
      'Aprimorar Conhecimentos em React',
      'Estudar hooks avançados, context API e performance optimization',
      CURRENT_DATE + INTERVAL '3 months',
      'in_progress',
      'high'
    )
    RETURNING id INTO example_pdi_id;

    RAISE NOTICE '✅ PDI de exemplo criado: %', example_pdi_id;
  END IF;
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT
  '✅ RESUMO DOS USUÁRIOS DE TESTE' as status,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'hr' THEN 1 END) as hrs,
  COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
  COUNT(CASE WHEN role = 'employee' THEN 1 END) as employees
FROM profiles
WHERE email IN ('admin@empresa.com', 'rh@empresa.com', 'gestor@empresa.com', 'colaborador@empresa.com');

-- Listar os usuários criados
SELECT
  name,
  email,
  role,
  position,
  level,
  status,
  is_onboarded,
  CASE
    WHEN team_id IS NOT NULL THEN '✅ Em time'
    ELSE '⚠️ Sem time'
  END as team_status
FROM profiles
WHERE email IN ('admin@empresa.com', 'rh@empresa.com', 'gestor@empresa.com', 'colaborador@empresa.com')
ORDER BY role;

RAISE NOTICE '✅ Script concluído!';
RAISE NOTICE '📋 Próximos passos:';
RAISE NOTICE '1. Verifique se os usuários aparecem na tabela acima';
RAISE NOTICE '2. Teste o login com cada uma das credenciais';
RAISE NOTICE '3. Execute os cenários de UAT documentados';