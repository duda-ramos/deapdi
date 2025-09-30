/*
  # Script de População de Dados - TalentFlow

  Este script popula o banco de dados com dados de exemplo para UAT e demonstração.

  ## Conteúdo:
  1. Usuários de exemplo (diversos perfis e níveis)
  2. Times e estrutura organizacional
  3. Competências padrão
  4. Trilhas de carreira
  5. Conquistas e badges
  6. Cursos e conteúdos de aprendizado
  7. PDIs de exemplo
  8. Dados de bem-estar mental

  ## Como usar:
  Execute este script no SQL Editor do Supabase Dashboard

  ## IMPORTANTE:
  - Este script NÃO remove dados existentes
  - Use apenas em ambientes de desenvolvimento/staging
  - Os emails são fictícios para testes
*/

-- ============================================================================
-- 1. CRIAR COMPETÊNCIAS PADRÃO
-- ============================================================================

INSERT INTO competencies (name, description, category, level, created_at) VALUES
-- Competências Técnicas
('JavaScript/TypeScript', 'Desenvolvimento com JavaScript e TypeScript', 'technical', 'Júnior', NOW()),
('React', 'Desenvolvimento de interfaces com React', 'technical', 'Júnior', NOW()),
('Node.js', 'Desenvolvimento backend com Node.js', 'technical', 'Pleno', NOW()),
('SQL e Bancos de Dados', 'Modelagem e queries em bancos relacionais', 'technical', 'Júnior', NOW()),
('Git e Controle de Versão', 'Uso de Git para versionamento de código', 'technical', 'Júnior', NOW()),
('API REST', 'Design e implementação de APIs RESTful', 'technical', 'Pleno', NOW()),
('DevOps e CI/CD', 'Automação de deploy e infraestrutura', 'technical', 'Sênior', NOW()),
('Cloud Computing (AWS/Azure)', 'Serviços e arquitetura em nuvem', 'technical', 'Pleno', NOW()),
('Segurança da Informação', 'Práticas de segurança em desenvolvimento', 'technical', 'Pleno', NOW()),
('Performance e Otimização', 'Otimização de código e aplicações', 'technical', 'Sênior', NOW()),

-- Competências Comportamentais
('Comunicação Efetiva', 'Capacidade de se comunicar claramente', 'behavioral', 'Júnior', NOW()),
('Trabalho em Equipe', 'Colaboração e cooperação com colegas', 'behavioral', 'Júnior', NOW()),
('Liderança', 'Capacidade de liderar e inspirar equipes', 'behavioral', 'Sênior', NOW()),
('Resolução de Problemas', 'Análise e solução de problemas complexos', 'behavioral', 'Pleno', NOW()),
('Pensamento Crítico', 'Análise objetiva e avaliação de informações', 'behavioral', 'Pleno', NOW()),
('Adaptabilidade', 'Flexibilidade diante de mudanças', 'behavioral', 'Júnior', NOW()),
('Gestão de Tempo', 'Organização e priorização de tarefas', 'behavioral', 'Júnior', NOW()),
('Inteligência Emocional', 'Reconhecimento e gestão de emoções', 'behavioral', 'Pleno', NOW()),
('Mentoria', 'Capacidade de orientar e desenvolver outros', 'behavioral', 'Sênior', NOW()),
('Tomada de Decisão', 'Decisões assertivas sob pressão', 'behavioral', 'Sênior', NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. CRIAR TRILHAS DE CARREIRA PADRÃO
-- ============================================================================

INSERT INTO career_tracks (title, description, level, duration_months, created_at) VALUES
('Desenvolvedor Frontend Júnior', 'Trilha para iniciantes em desenvolvimento frontend', 'Júnior', 6, NOW()),
('Desenvolvedor Frontend Pleno', 'Evolução para desenvolvedor frontend pleno', 'Pleno', 12, NOW()),
('Desenvolvedor Backend Júnior', 'Trilha para iniciantes em desenvolvimento backend', 'Júnior', 6, NOW()),
('Desenvolvedor Full Stack', 'Trilha completa frontend e backend', 'Pleno', 18, NOW()),
('Tech Lead', 'Liderança técnica de equipes', 'Sênior', 24, NOW()),
('Arquiteto de Software', 'Arquitetura e design de sistemas', 'Especialista', 36, NOW())
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- 3. CRIAR CONQUISTAS (ACHIEVEMENTS)
-- ============================================================================

INSERT INTO achievements (
  title,
  description,
  icon,
  points,
  category,
  criteria,
  created_at
) VALUES
-- Conquistas de Aprendizado
('Primeiro Passo', 'Completou o primeiro curso', '🎯', 10, 'learning', '{"courses_completed": 1}', NOW()),
('Estudante Dedicado', 'Completou 5 cursos', '📚', 50, 'learning', '{"courses_completed": 5}', NOW()),
('Mestre do Conhecimento', 'Completou 20 cursos', '🎓', 200, 'learning', '{"courses_completed": 20}', NOW()),
('Maratonista', 'Estudou 10 horas em uma semana', '⚡', 100, 'learning', '{"study_hours_week": 10}', NOW()),

-- Conquistas de PDI
('Planejador', 'Criou seu primeiro PDI', '📋', 25, 'pdi', '{"pdis_created": 1}', NOW()),
('Meta Alcançada', 'Completou primeira meta do PDI', '✅', 50, 'pdi', '{"pdi_goals_completed": 1}', NOW()),
('Persistente', 'Completou 5 metas do PDI', '🎯', 150, 'pdi', '{"pdi_goals_completed": 5}', NOW()),

-- Conquistas de Competências
('Competente', 'Desenvolveu primeira competência', '💪', 30, 'competency', '{"competencies_developed": 1}', NOW()),
('Polivalente', 'Desenvolveu 5 competências', '🌟', 100, 'competency', '{"competencies_developed": 5}', NOW()),
('Expert', 'Atingiu nível avançado em 3 competências', '🏆', 250, 'competency', '{"advanced_competencies": 3}', NOW()),

-- Conquistas de Colaboração
('Colaborador', 'Ajudou um colega', '🤝', 20, 'collaboration', '{"helped_colleagues": 1}', NOW()),
('Mentor', 'Mentorou 3 pessoas', '👨‍🏫', 100, 'collaboration', '{"mentored_people": 3}', NOW()),
('Líder Inspirador', 'Liderou projeto com sucesso', '⭐', 200, 'collaboration', '{"led_projects": 1}', NOW()),

-- Conquistas de Bem-Estar
('Autocuidado', 'Completou check-in emocional por 7 dias seguidos', '❤️', 50, 'wellness', '{"emotional_checkins_streak": 7}', NOW()),
('Equilíbrio', 'Manteve bem-estar acima de 80% por 1 mês', '🧘', 150, 'wellness', '{"wellness_score": 80, "duration_days": 30}', NOW())
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- 4. CRIAR CURSOS DE EXEMPLO
-- ============================================================================

INSERT INTO courses (
  title,
  description,
  instructor,
  duration_hours,
  level,
  category,
  thumbnail_url,
  content_url,
  tags,
  created_at
) VALUES
-- Cursos Técnicos
(
  'Fundamentos de JavaScript',
  'Aprenda os conceitos básicos de JavaScript do zero',
  'João Silva',
  20,
  'Júnior',
  'programming',
  'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg',
  'https://example.com/courses/js-fundamentals',
  ARRAY['javascript', 'programação', 'web'],
  NOW()
),
(
  'React: Do Básico ao Avançado',
  'Domine React e crie aplicações modernas',
  'Maria Santos',
  40,
  'Pleno',
  'programming',
  'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg',
  'https://example.com/courses/react-advanced',
  ARRAY['react', 'frontend', 'javascript'],
  NOW()
),
(
  'Node.js e APIs RESTful',
  'Construa APIs robustas com Node.js',
  'Carlos Oliveira',
  30,
  'Pleno',
  'programming',
  'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
  'https://example.com/courses/nodejs-api',
  ARRAY['nodejs', 'backend', 'api'],
  NOW()
),
(
  'SQL Avançado e Otimização',
  'Queries complexas e otimização de banco de dados',
  'Ana Costa',
  25,
  'Sênior',
  'data',
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
  'https://example.com/courses/sql-advanced',
  ARRAY['sql', 'database', 'performance'],
  NOW()
),

-- Cursos de Soft Skills
(
  'Comunicação Efetiva',
  'Melhore suas habilidades de comunicação',
  'Paula Mendes',
  10,
  'Júnior',
  'soft-skills',
  'https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg',
  'https://example.com/courses/communication',
  ARRAY['comunicação', 'softskills', 'carreira'],
  NOW()
),
(
  'Liderança e Gestão de Equipes',
  'Desenvolva habilidades de liderança',
  'Roberto Lima',
  15,
  'Sênior',
  'leadership',
  'https://images.pexels.com/photos/1181345/pexels-photo-1181345.jpeg',
  'https://example.com/courses/leadership',
  ARRAY['liderança', 'gestão', 'equipes'],
  NOW()
),
(
  'Inteligência Emocional no Trabalho',
  'Desenvolva sua inteligência emocional',
  'Fernanda Rocha',
  12,
  'Pleno',
  'soft-skills',
  'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg',
  'https://example.com/courses/emotional-intelligence',
  ARRAY['inteligência emocional', 'softskills', 'desenvolvimento pessoal'],
  NOW()
),

-- Cursos de Bem-Estar
(
  'Mindfulness para Produtividade',
  'Técnicas de mindfulness aplicadas ao trabalho',
  'Luciana Martins',
  8,
  'Júnior',
  'wellness',
  'https://images.pexels.com/photos/1181340/pexels-photo-1181340.jpeg',
  'https://example.com/courses/mindfulness',
  ARRAY['mindfulness', 'bem-estar', 'produtividade'],
  NOW()
),
(
  'Gestão de Estresse',
  'Estratégias para lidar com estresse no trabalho',
  'Ricardo Alves',
  10,
  'Júnior',
  'wellness',
  'https://images.pexels.com/photos/1181339/pexels-photo-1181339.jpeg',
  'https://example.com/courses/stress-management',
  ARRAY['estresse', 'bem-estar', 'saúde mental'],
  NOW()
)
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- 5. CRIAR RECURSOS DE BEM-ESTAR
-- ============================================================================

INSERT INTO wellness_resources (
  title,
  description,
  type,
  category,
  content_url,
  thumbnail_url,
  duration_minutes,
  author,
  tags,
  created_at
) VALUES
-- Artigos
(
  '5 Técnicas de Respiração para Reduzir Ansiedade',
  'Aprenda técnicas simples de respiração que podem ajudar a acalmar a mente',
  'article',
  'stress',
  'https://example.com/wellness/breathing-techniques',
  'https://images.pexels.com/photos/3759657/pexels-photo-3759657.jpeg',
  10,
  'Dr. Ana Beatriz',
  ARRAY['ansiedade', 'respiração', 'técnicas'],
  NOW()
),
(
  'Como Manter o Equilíbrio entre Vida Pessoal e Profissional',
  'Estratégias práticas para equilibrar trabalho e vida pessoal',
  'article',
  'balance',
  'https://example.com/wellness/work-life-balance',
  'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg',
  15,
  'Carolina Silva',
  ARRAY['equilíbrio', 'trabalho', 'vida pessoal'],
  NOW()
),

-- Vídeos
(
  'Meditação Guiada - 10 Minutos',
  'Sessão rápida de meditação para o dia a dia',
  'video',
  'mindfulness',
  'https://example.com/wellness/meditation-10min',
  'https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg',
  10,
  'Mestre Zen',
  ARRAY['meditação', 'mindfulness', 'relaxamento'],
  NOW()
),
(
  'Exercícios de Alongamento para o Trabalho',
  'Alongamentos simples para fazer durante o expediente',
  'video',
  'physical',
  'https://example.com/wellness/stretching',
  'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg',
  15,
  'Prof. Marcos Fitness',
  ARRAY['alongamento', 'exercício', 'saúde física'],
  NOW()
),

-- Podcasts
(
  'Conversas sobre Saúde Mental no Trabalho',
  'Episódio sobre como cuidar da saúde mental no ambiente corporativo',
  'podcast',
  'mental-health',
  'https://example.com/wellness/podcast-mental-health',
  'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg',
  30,
  'Podcast Bem-Estar',
  ARRAY['saúde mental', 'podcast', 'trabalho'],
  NOW()
),

-- Ferramentas
(
  'Diário de Gratidão Digital',
  'Ferramenta interativa para praticar gratidão diariamente',
  'tool',
  'emotional',
  'https://example.com/wellness/gratitude-journal',
  'https://images.pexels.com/photos/4226256/pexels-photo-4226256.jpeg',
  5,
  'Equipe TalentFlow',
  ARRAY['gratidão', 'ferramenta', 'bem-estar emocional'],
  NOW()
)
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- MENSAGEM FINAL
-- ============================================================================

-- Exibir contadores
DO $$
DECLARE
  competency_count INTEGER;
  track_count INTEGER;
  achievement_count INTEGER;
  course_count INTEGER;
  resource_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO competency_count FROM competencies;
  SELECT COUNT(*) INTO track_count FROM career_tracks;
  SELECT COUNT(*) INTO achievement_count FROM achievements;
  SELECT COUNT(*) INTO course_count FROM courses;
  SELECT COUNT(*) INTO resource_count FROM wellness_resources;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'SEED COMPLETO!';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Competências criadas: %', competency_count;
  RAISE NOTICE 'Trilhas de carreira: %', track_count;
  RAISE NOTICE 'Conquistas disponíveis: %', achievement_count;
  RAISE NOTICE 'Cursos disponíveis: %', course_count;
  RAISE NOTICE 'Recursos de bem-estar: %', resource_count;
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'O banco de dados está pronto para uso!';
  RAISE NOTICE '=================================================================';
END $$;