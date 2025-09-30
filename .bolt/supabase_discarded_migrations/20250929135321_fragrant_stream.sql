/*
  # Create missing course and learning tables

  1. New Tables
    - `courses` (if not exists)
    - `course_modules` (if not exists)
    - `course_enrollments` (already exists)
    - `course_progress` (already exists)
    - `certificates` (already exists)

  2. Security
    - Enable RLS on all tables
    - Appropriate policies for course access

  3. Indexes
    - Add indexes for performance optimization
*/

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('technical', 'soft-skills', 'leadership', 'compliance', 'general')),
  level text DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer DEFAULT 60 CHECK (duration_minutes > 0),
  instructor text NOT NULL,
  thumbnail_url text,
  points integer DEFAULT 100 CHECK (points >= 0),
  competency_mappings jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'quiz', 'assignment')),
  duration_minutes integer DEFAULT 15 CHECK (duration_minutes > 0),
  order_index integer NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

-- Courses Policies
CREATE POLICY "Users can read active courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR can manage courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Course Modules Policies
CREATE POLICY "Users can read course modules for active courses"
  ON course_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.is_active = true
    )
  );

CREATE POLICY "HR can manage course modules"
  ON course_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS courses_category_idx ON courses(category);
CREATE INDEX IF NOT EXISTS courses_level_idx ON courses(level);
CREATE INDEX IF NOT EXISTS courses_active_idx ON courses(is_active);
CREATE INDEX IF NOT EXISTS courses_created_at_idx ON courses(created_at);

CREATE INDEX IF NOT EXISTS course_modules_course_id_idx ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS course_modules_order_idx ON course_modules(order_index);

-- Triggers
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert sample courses
INSERT INTO courses (title, description, category, level, duration_minutes, instructor, points, competency_mappings) VALUES
('Fundamentos de React', 'Aprenda os conceitos básicos do React, incluindo componentes, props, state e hooks.', 'technical', 'beginner', 180, 'Ana Silva', 150, '[{"competency": "React", "rating_boost": 1}]'),
('Liderança Eficaz', 'Desenvolva habilidades de liderança e gestão de equipes.', 'leadership', 'intermediate', 240, 'Carlos Santos', 200, '[{"competency": "Liderança", "rating_boost": 2}]'),
('Comunicação Assertiva', 'Melhore suas habilidades de comunicação no ambiente de trabalho.', 'soft-skills', 'beginner', 120, 'Maria Oliveira', 100, '[{"competency": "Comunicação", "rating_boost": 1}]'),
('TypeScript Avançado', 'Domine conceitos avançados de TypeScript para desenvolvimento profissional.', 'technical', 'advanced', 300, 'João Pereira', 250, '[{"competency": "TypeScript", "rating_boost": 2}]'),
('Gestão de Projetos Ágeis', 'Aprenda metodologias ágeis para gestão eficiente de projetos.', 'leadership', 'intermediate', 200, 'Fernanda Costa', 180, '[{"competency": "Gestão de Projetos", "rating_boost": 2}]')
ON CONFLICT DO NOTHING;

-- Insert sample course modules for React course
DO $$
DECLARE
  react_course_id uuid;
BEGIN
  SELECT id INTO react_course_id FROM courses WHERE title = 'Fundamentos de React' LIMIT 1;
  
  IF react_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, content_type, duration_minutes, order_index) VALUES
    (react_course_id, 'Introdução ao React', 'Conceitos básicos e configuração do ambiente', 'video', 30, 1),
    (react_course_id, 'Componentes e JSX', 'Criando seus primeiros componentes', 'video', 45, 2),
    (react_course_id, 'Props e State', 'Gerenciamento de dados em componentes', 'video', 40, 3),
    (react_course_id, 'Hooks Essenciais', 'useState, useEffect e outros hooks', 'video', 50, 4),
    (react_course_id, 'Projeto Prático', 'Construindo uma aplicação completa', 'assignment', 60, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;