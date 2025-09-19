/*
  # Sistema de Progresso em Cursos e Certificados

  1. New Tables
    - `courses` - Catálogo de cursos disponíveis
    - `course_modules` - Módulos/lições de cada curso
    - `course_enrollments` - Inscrições dos usuários em cursos
    - `course_progress` - Progresso detalhado por módulo
    - `certificates` - Certificados emitidos

  2. Security
    - Enable RLS on all new tables
    - Add policies for course access and progress tracking
    - Restrict certificate generation to completed courses

  3. Functions
    - Function to calculate course completion percentage
    - Function to generate certificate when course is completed
    - Function to update competencies based on course completion

  4. Triggers
    - Auto-update enrollment progress when module is completed
    - Auto-generate certificate when course reaches 100%
    - Auto-update competencies when course with competency mapping is completed
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  level text NOT NULL DEFAULT 'beginner',
  duration_minutes integer NOT NULL DEFAULT 60,
  instructor text NOT NULL,
  thumbnail_url text,
  points integer NOT NULL DEFAULT 100,
  competency_mappings jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text DEFAULT 'video',
  duration_minutes integer DEFAULT 15,
  order_index integer NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  progress_percentage numeric DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_module_id uuid REFERENCES course_modules(id),
  status text DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in-progress', 'completed', 'dropped')),
  UNIQUE(course_id, profile_id)
);

-- Create course progress table
CREATE TABLE IF NOT EXISTS course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE CASCADE,
  module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  time_spent_minutes integer DEFAULT 0,
  UNIQUE(enrollment_id, module_id)
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now(),
  pdf_url text,
  verification_code text UNIQUE NOT NULL,
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can read active courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "HR can manage courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

-- RLS Policies for course_modules
CREATE POLICY "Users can read course modules"
  ON course_modules
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_modules.course_id 
    AND courses.is_active = true
  ));

CREATE POLICY "HR can manage course modules"
  ON course_modules
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

-- RLS Policies for course_enrollments
CREATE POLICY "Users can read own enrollments"
  ON course_enrollments
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create own enrollments"
  ON course_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own enrollments"
  ON course_enrollments
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "HR can read all enrollments"
  ON course_enrollments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin', 'manager')
  ));

-- RLS Policies for course_progress
CREATE POLICY "Users can manage own progress"
  ON course_progress
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_enrollments.id = course_progress.enrollment_id 
    AND course_enrollments.profile_id = auth.uid()
  ));

CREATE POLICY "HR can read all progress"
  ON course_progress
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin', 'manager')
  ));

-- RLS Policies for certificates
CREATE POLICY "Users can read own certificates"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "System can create certificates"
  ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "HR can read all certificates"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

-- Function to calculate course completion percentage
CREATE OR REPLACE FUNCTION calculate_course_completion(p_enrollment_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total_modules integer;
  v_completed_modules integer;
  v_percentage numeric;
BEGIN
  -- Get total required modules for the course
  SELECT COUNT(*)
  INTO v_total_modules
  FROM course_modules cm
  JOIN course_enrollments ce ON ce.course_id = cm.course_id
  WHERE ce.id = p_enrollment_id AND cm.is_required = true;
  
  -- Get completed modules
  SELECT COUNT(*)
  INTO v_completed_modules
  FROM course_progress cp
  JOIN course_modules cm ON cm.id = cp.module_id
  WHERE cp.enrollment_id = p_enrollment_id AND cm.is_required = true;
  
  -- Calculate percentage
  IF v_total_modules > 0 THEN
    v_percentage := (v_completed_modules::numeric / v_total_modules::numeric) * 100;
  ELSE
    v_percentage := 0;
  END IF;
  
  -- Update enrollment progress
  UPDATE course_enrollments 
  SET 
    progress_percentage = v_percentage,
    status = CASE 
      WHEN v_percentage = 100 THEN 'completed'
      WHEN v_percentage > 0 THEN 'in-progress'
      ELSE 'enrolled'
    END,
    completed_at = CASE WHEN v_percentage = 100 THEN now() ELSE NULL END,
    started_at = CASE WHEN started_at IS NULL AND v_percentage > 0 THEN now() ELSE started_at END
  WHERE id = p_enrollment_id;
  
  RETURN v_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate certificate
CREATE OR REPLACE FUNCTION generate_certificate(p_enrollment_id uuid)
RETURNS uuid AS $$
DECLARE
  v_enrollment record;
  v_course record;
  v_profile record;
  v_certificate_id uuid;
  v_certificate_number text;
  v_verification_code text;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM course_enrollments
  WHERE id = p_enrollment_id AND status = 'completed';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found or not completed';
  END IF;
  
  -- Get course details
  SELECT * INTO v_course
  FROM courses
  WHERE id = v_enrollment.course_id;
  
  -- Get profile details
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_enrollment.profile_id;
  
  -- Generate certificate number and verification code
  v_certificate_number := 'CERT-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('certificate_sequence')::text, 6, '0');
  v_verification_code := upper(substring(gen_random_uuid()::text from 1 for 8));
  
  -- Create certificate
  INSERT INTO certificates (
    profile_id,
    course_id,
    enrollment_id,
    certificate_number,
    verification_code
  ) VALUES (
    v_enrollment.profile_id,
    v_enrollment.course_id,
    p_enrollment_id,
    v_certificate_number,
    v_verification_code
  ) RETURNING id INTO v_certificate_id;
  
  -- Award points to profile
  UPDATE profiles 
  SET points = points + v_course.points
  WHERE id = v_enrollment.profile_id;
  
  -- Create notification
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    v_enrollment.profile_id,
    'Certificado Emitido! 🎓',
    'Parabéns! Você concluiu o curso "' || v_course.title || '" e ganhou ' || v_course.points || ' pontos!',
    'success',
    '/learning/certificates/' || v_certificate_id
  );
  
  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update competencies based on course completion
CREATE OR REPLACE FUNCTION update_competencies_from_course(p_enrollment_id uuid)
RETURNS void AS $$
DECLARE
  v_enrollment record;
  v_course record;
  v_mapping jsonb;
  v_competency_name text;
  v_rating_boost numeric;
BEGIN
  -- Get enrollment and course details
  SELECT ce.*, c.competency_mappings
  INTO v_enrollment
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE ce.id = p_enrollment_id AND ce.status = 'completed';
  
  IF NOT FOUND OR v_enrollment.competency_mappings IS NULL THEN
    RETURN;
  END IF;
  
  -- Process each competency mapping
  FOR v_mapping IN SELECT * FROM jsonb_array_elements(v_enrollment.competency_mappings)
  LOOP
    v_competency_name := v_mapping->>'competency';
    v_rating_boost := (v_mapping->>'rating_boost')::numeric;
    
    -- Update or create competency
    INSERT INTO competencies (
      profile_id,
      name,
      type,
      stage,
      self_rating,
      target_level
    ) VALUES (
      v_enrollment.profile_id,
      v_competency_name,
      'hard',
      'Pleno',
      LEAST(5, v_rating_boost),
      5
    )
    ON CONFLICT (profile_id, name) DO UPDATE SET
      self_rating = LEAST(5, COALESCE(competencies.self_rating, 0) + v_rating_boost),
      updated_at = now();
  END LOOP;
  
  -- Create notification about competency improvement
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type
  ) VALUES (
    v_enrollment.profile_id,
    'Competências Atualizadas! 📈',
    'Suas competências foram atualizadas com base no curso concluído.',
    'info'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create certificate sequence
CREATE SEQUENCE IF NOT EXISTS certificate_sequence START 1000;

-- Trigger to update course progress
CREATE OR REPLACE FUNCTION trigger_update_course_progress()
RETURNS trigger AS $$
BEGIN
  -- Calculate and update progress
  PERFORM calculate_course_completion(NEW.enrollment_id);
  
  -- Check if course is now completed
  IF (SELECT progress_percentage FROM course_enrollments WHERE id = NEW.enrollment_id) = 100 THEN
    -- Generate certificate
    PERFORM generate_certificate(NEW.enrollment_id);
    
    -- Update competencies
    PERFORM update_competencies_from_course(NEW.enrollment_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS course_progress_update ON course_progress;
CREATE TRIGGER course_progress_update
  AFTER INSERT ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_progress();

-- Insert sample courses with modules
INSERT INTO courses (title, description, category, level, duration_minutes, instructor, points, competency_mappings) VALUES
('React Avançado: Hooks e Context API', 'Aprenda os conceitos avançados do React, incluindo hooks customizados e gerenciamento de estado.', 'technical', 'advanced', 180, 'Ana Silva', 150, '[{"competency": "React", "rating_boost": 1.0}, {"competency": "JavaScript", "rating_boost": 0.5}]'::jsonb),
('Liderança e Gestão de Equipes', 'Desenvolva habilidades essenciais para liderar equipes de alta performance.', 'leadership', 'intermediate', 120, 'Carlos Mendes', 200, '[{"competency": "Liderança", "rating_boost": 1.5}, {"competency": "Gestão de Pessoas", "rating_boost": 1.0}]'::jsonb),
('Comunicação Eficaz no Ambiente Corporativo', 'Melhore suas habilidades de comunicação verbal e escrita no contexto profissional.', 'soft-skills', 'beginner', 90, 'Maria Santos', 100, '[{"competency": "Comunicação", "rating_boost": 1.0}]'::jsonb),
('TypeScript para Desenvolvedores', 'Domine o TypeScript e melhore a qualidade do seu código JavaScript.', 'technical', 'intermediate', 150, 'João Oliveira', 120, '[{"competency": "TypeScript", "rating_boost": 1.5}, {"competency": "JavaScript", "rating_boost": 0.5}]'::jsonb),
('LGPD e Proteção de Dados', 'Entenda as principais diretrizes da LGPD e como aplicá-las no dia a dia.', 'compliance', 'beginner', 60, 'Dra. Patricia Lima', 80, '[{"competency": "Compliance", "rating_boost": 1.0}]'::jsonb),
('Metodologias Ágeis: Scrum e Kanban', 'Aprenda as principais metodologias ágeis e como implementá-las em projetos.', 'technical', 'intermediate', 135, 'Roberto Costa', 130, '[{"competency": "Scrum", "rating_boost": 1.0}, {"competency": "Gestão de Projetos", "rating_boost": 1.0}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample modules for React course
DO $$
DECLARE
  v_react_course_id uuid;
BEGIN
  SELECT id INTO v_react_course_id FROM courses WHERE title = 'React Avançado: Hooks e Context API' LIMIT 1;
  
  IF v_react_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, duration_minutes, order_index) VALUES
    (v_react_course_id, 'Introdução aos Hooks', 'Conceitos básicos e useState, useEffect', 30, 1),
    (v_react_course_id, 'Hooks Avançados', 'useContext, useReducer, useMemo', 45, 2),
    (v_react_course_id, 'Custom Hooks', 'Criando seus próprios hooks reutilizáveis', 35, 3),
    (v_react_course_id, 'Context API', 'Gerenciamento de estado global', 40, 4),
    (v_react_course_id, 'Performance e Otimização', 'React.memo, useCallback, useMemo', 30, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert sample modules for TypeScript course
DO $$
DECLARE
  v_ts_course_id uuid;
BEGIN
  SELECT id INTO v_ts_course_id FROM courses WHERE title = 'TypeScript para Desenvolvedores' LIMIT 1;
  
  IF v_ts_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, duration_minutes, order_index) VALUES
    (v_ts_course_id, 'Fundamentos do TypeScript', 'Tipos básicos e configuração', 25, 1),
    (v_ts_course_id, 'Interfaces e Types', 'Definindo contratos de dados', 30, 2),
    (v_ts_course_id, 'Generics', 'Tipos genéricos e reutilizáveis', 35, 3),
    (v_ts_course_id, 'Decorators e Metadata', 'Funcionalidades avançadas', 30, 4),
    (v_ts_course_id, 'TypeScript com React', 'Integração prática', 30, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert sample modules for Leadership course
DO $$
DECLARE
  v_leadership_course_id uuid;
BEGIN
  SELECT id INTO v_leadership_course_id FROM courses WHERE title = 'Liderança e Gestão de Equipes' LIMIT 1;
  
  IF v_leadership_course_id IS NOT NULL THEN
    INSERT INTO course_modules (course_id, title, description, duration_minutes, order_index) VALUES
    (v_leadership_course_id, 'Fundamentos da Liderança', 'Estilos e teorias de liderança', 30, 1),
    (v_leadership_course_id, 'Comunicação de Líderes', 'Como se comunicar efetivamente', 25, 2),
    (v_leadership_course_id, 'Gestão de Conflitos', 'Resolução de problemas em equipe', 35, 3),
    (v_leadership_course_id, 'Motivação e Engajamento', 'Como manter a equipe motivada', 30, 4)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS course_enrollments_profile_id_idx ON course_enrollments(profile_id);
CREATE INDEX IF NOT EXISTS course_enrollments_course_id_idx ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS course_enrollments_status_idx ON course_enrollments(status);
CREATE INDEX IF NOT EXISTS course_progress_enrollment_id_idx ON course_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS course_progress_module_id_idx ON course_progress(module_id);
CREATE INDEX IF NOT EXISTS certificates_profile_id_idx ON certificates(profile_id);
CREATE INDEX IF NOT EXISTS certificates_verification_code_idx ON certificates(verification_code);

-- Add updated_at triggers
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();