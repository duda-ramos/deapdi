/*
  # Career Track System Enhancements

  1. New Tables
    - `career_track_templates` - Templates de trilhas configuráveis pelo RH
    - `career_stage_competencies` - Competências requeridas por estágio
    - `career_stage_salary_ranges` - Faixas salariais por estágio

  2. Functions
    - `calculate_career_progress()` - Calcula progresso baseado em competências e PDIs
    - `check_stage_progression()` - Verifica se pode avançar de estágio
    - `update_career_progress()` - Atualiza progresso automaticamente

  3. Triggers
    - Trigger para atualizar progresso quando competências mudarem
    - Trigger para verificar progressão quando PDIs forem concluídos

  4. Security
    - RLS habilitado em todas as novas tabelas
    - Políticas específicas para RH gerenciar trilhas
*/

-- Career Track Templates (configuráveis pelo RH)
CREATE TABLE IF NOT EXISTS career_track_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  profession text NOT NULL,
  track_type track_type DEFAULT 'development',
  stages jsonb NOT NULL, -- Array de estágios com requisitos
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Competências requeridas por estágio
CREATE TABLE IF NOT EXISTS career_stage_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES career_track_templates(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  competency_name text NOT NULL,
  required_level integer NOT NULL CHECK (required_level >= 1 AND required_level <= 5),
  weight numeric DEFAULT 1.0 CHECK (weight > 0),
  created_at timestamptz DEFAULT now()
);

-- Faixas salariais por estágio
CREATE TABLE IF NOT EXISTS career_stage_salary_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES career_track_templates(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  min_salary numeric NOT NULL CHECK (min_salary > 0),
  max_salary numeric NOT NULL CHECK (max_salary >= min_salary),
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now()
);

-- Adicionar template_id à tabela career_tracks existente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_tracks' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE career_tracks ADD COLUMN template_id uuid REFERENCES career_track_templates(id);
  END IF;
END $$;

-- Adicionar campos para cálculo detalhado de progresso
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_tracks' AND column_name = 'competency_progress'
  ) THEN
    ALTER TABLE career_tracks ADD COLUMN competency_progress numeric DEFAULT 0 CHECK (competency_progress >= 0 AND competency_progress <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_tracks' AND column_name = 'pdi_progress'
  ) THEN
    ALTER TABLE career_tracks ADD COLUMN pdi_progress numeric DEFAULT 0 CHECK (pdi_progress >= 0 AND pdi_progress <= 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_tracks' AND column_name = 'last_progression_check'
  ) THEN
    ALTER TABLE career_tracks ADD COLUMN last_progression_check timestamptz DEFAULT now();
  END IF;
END $$;

-- Função para calcular progresso de competências
CREATE OR REPLACE FUNCTION calculate_competency_progress(p_profile_id uuid, p_stage text)
RETURNS numeric AS $$
DECLARE
  total_weight numeric := 0;
  achieved_weight numeric := 0;
  comp_record RECORD;
BEGIN
  -- Buscar competências requeridas para o estágio atual
  FOR comp_record IN
    SELECT 
      csc.competency_name,
      csc.required_level,
      csc.weight,
      COALESCE(c.self_rating, 0) as self_rating,
      COALESCE(c.manager_rating, 0) as manager_rating
    FROM career_stage_competencies csc
    LEFT JOIN competencies c ON (
      c.profile_id = p_profile_id AND 
      c.name = csc.competency_name
    )
    WHERE csc.stage_name = p_stage
  LOOP
    total_weight := total_weight + comp_record.weight;
    
    -- Usar a maior avaliação entre self e manager
    IF GREATEST(comp_record.self_rating, comp_record.manager_rating) >= comp_record.required_level THEN
      achieved_weight := achieved_weight + comp_record.weight;
    ELSE
      -- Progresso parcial baseado no nível atual
      achieved_weight := achieved_weight + (
        comp_record.weight * 
        (GREATEST(comp_record.self_rating, comp_record.manager_rating)::numeric / comp_record.required_level::numeric)
      );
    END IF;
  END LOOP;
  
  -- Retornar percentual (0-100)
  IF total_weight > 0 THEN
    RETURN LEAST(100, (achieved_weight / total_weight) * 100);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular progresso de PDIs
CREATE OR REPLACE FUNCTION calculate_pdi_progress(p_profile_id uuid)
RETURNS numeric AS $$
DECLARE
  total_pdis integer := 0;
  completed_pdis integer := 0;
BEGIN
  -- Contar PDIs dos últimos 12 meses
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('completed', 'validated'))
  INTO total_pdis, completed_pdis
  FROM pdis 
  WHERE profile_id = p_profile_id 
    AND created_at >= now() - interval '12 months';
  
  -- Retornar percentual (0-100)
  IF total_pdis > 0 THEN
    RETURN (completed_pdis::numeric / total_pdis::numeric) * 100;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função principal para atualizar progresso da trilha
CREATE OR REPLACE FUNCTION update_career_progress(p_profile_id uuid)
RETURNS void AS $$
DECLARE
  track_record RECORD;
  comp_progress numeric;
  pdi_progress numeric;
  total_progress numeric;
  can_advance boolean := false;
BEGIN
  -- Buscar trilha atual
  SELECT * INTO track_record
  FROM career_tracks 
  WHERE profile_id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calcular progresso de competências
  comp_progress := calculate_competency_progress(p_profile_id, track_record.current_stage);
  
  -- Calcular progresso de PDIs
  pdi_progress := calculate_pdi_progress(p_profile_id);
  
  -- Fórmula ponderada: competências 70% + PDIs 30%
  total_progress := (comp_progress * 0.7) + (pdi_progress * 0.3);
  
  -- Verificar se pode avançar (80% de progresso)
  IF total_progress >= 80 AND track_record.next_stage IS NOT NULL THEN
    can_advance := true;
  END IF;
  
  -- Atualizar registro
  UPDATE career_tracks 
  SET 
    progress = total_progress,
    competency_progress = comp_progress,
    pdi_progress = pdi_progress,
    last_progression_check = now(),
    -- Avançar estágio se possível
    current_stage = CASE 
      WHEN can_advance THEN track_record.next_stage 
      ELSE track_record.current_stage 
    END,
    next_stage = CASE 
      WHEN can_advance THEN (
        CASE track_record.next_stage
          WHEN 'Assistente' THEN 'Júnior'
          WHEN 'Júnior' THEN 'Pleno'
          WHEN 'Pleno' THEN 'Sênior'
          WHEN 'Sênior' THEN 'Especialista'
          WHEN 'Especialista' THEN 'Principal'
          ELSE NULL
        END
      )
      ELSE track_record.next_stage
    END,
    updated_at = now()
  WHERE profile_id = p_profile_id;
  
  -- Criar notificação se avançou de estágio
  IF can_advance THEN
    INSERT INTO notifications (profile_id, title, message, type)
    VALUES (
      p_profile_id,
      'Parabéns! Você avançou de estágio!',
      format('Você progrediu de %s para %s na sua trilha de carreira!', 
             track_record.current_stage, track_record.next_stage),
      'success'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso quando competências mudarem
CREATE OR REPLACE FUNCTION trigger_update_career_progress()
RETURNS trigger AS $$
BEGIN
  -- Atualizar progresso da trilha
  PERFORM update_career_progress(NEW.profile_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'competencies_career_progress_update'
  ) THEN
    CREATE TRIGGER competencies_career_progress_update
      AFTER UPDATE OF self_rating, manager_rating ON competencies
      FOR EACH ROW
      EXECUTE FUNCTION trigger_update_career_progress();
  END IF;
END $$;

-- Trigger para atualizar progresso quando PDIs forem concluídos
CREATE OR REPLACE FUNCTION trigger_pdi_career_progress()
RETURNS trigger AS $$
BEGIN
  -- Atualizar progresso quando PDI for concluído ou validado
  IF NEW.status IN ('completed', 'validated') AND OLD.status NOT IN ('completed', 'validated') THEN
    PERFORM update_career_progress(NEW.profile_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'pdis_career_progress_update'
  ) THEN
    CREATE TRIGGER pdis_career_progress_update
      AFTER UPDATE OF status ON pdis
      FOR EACH ROW
      EXECUTE FUNCTION trigger_pdi_career_progress();
  END IF;
END $$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE career_track_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_stage_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_stage_salary_ranges ENABLE ROW LEVEL SECURITY;

-- Políticas para career_track_templates
CREATE POLICY "HR can manage career track templates"
  ON career_track_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Users can read career track templates"
  ON career_track_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para career_stage_competencies
CREATE POLICY "HR can manage stage competencies"
  ON career_stage_competencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Users can read stage competencies"
  ON career_stage_competencies
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para career_stage_salary_ranges
CREATE POLICY "HR can manage salary ranges"
  ON career_stage_salary_ranges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Managers and HR can read salary ranges"
  ON career_stage_salary_ranges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'admin', 'manager')
    )
  );

-- Inserir dados iniciais de template
INSERT INTO career_track_templates (name, description, profession, track_type, stages, created_by)
VALUES (
  'Trilha de Desenvolvimento - Tecnologia',
  'Trilha padrão para profissionais de tecnologia',
  'Desenvolvedor',
  'development',
  '[
    {"name": "Estagiário", "level": 1, "description": "Início da jornada profissional"},
    {"name": "Assistente", "level": 2, "description": "Desenvolvimento de habilidades básicas"},
    {"name": "Júnior", "level": 3, "description": "Autonomia em tarefas simples"},
    {"name": "Pleno", "level": 4, "description": "Responsabilidade por projetos completos"},
    {"name": "Sênior", "level": 5, "description": "Especialista técnico ou líder"},
    {"name": "Especialista", "level": 6, "description": "Referência técnica na área"},
    {"name": "Principal", "level": 7, "description": "Liderança estratégica"}
  ]'::jsonb,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Inserir competências por estágio
INSERT INTO career_stage_competencies (template_id, stage_name, competency_name, required_level, weight)
SELECT 
  t.id,
  stage_data.stage_name,
  comp_data.competency_name,
  comp_data.required_level,
  comp_data.weight
FROM career_track_templates t,
LATERAL (VALUES 
  ('Estagiário', 'JavaScript', 2, 1.0),
  ('Estagiário', 'HTML/CSS', 3, 1.0),
  ('Assistente', 'JavaScript', 3, 1.0),
  ('Assistente', 'React', 2, 1.0),
  ('Júnior', 'React', 3, 1.2),
  ('Júnior', 'TypeScript', 2, 1.0),
  ('Pleno', 'React', 4, 1.2),
  ('Pleno', 'TypeScript', 3, 1.1),
  ('Pleno', 'Liderança', 2, 0.8),
  ('Sênior', 'React', 5, 1.0),
  ('Sênior', 'TypeScript', 4, 1.0),
  ('Sênior', 'Liderança', 4, 1.2)
) AS comp_data(stage_name, competency_name, required_level, weight),
LATERAL (VALUES (comp_data.stage_name)) AS stage_data(stage_name)
WHERE t.name = 'Trilha de Desenvolvimento - Tecnologia'
ON CONFLICT DO NOTHING;

-- Inserir faixas salariais
INSERT INTO career_stage_salary_ranges (template_id, stage_name, min_salary, max_salary)
SELECT 
  t.id,
  salary_data.stage_name,
  salary_data.min_salary,
  salary_data.max_salary
FROM career_track_templates t,
LATERAL (VALUES 
  ('Estagiário', 1500, 2500),
  ('Assistente', 2500, 3500),
  ('Júnior', 3500, 5500),
  ('Pleno', 5500, 8500),
  ('Sênior', 8500, 12000),
  ('Especialista', 12000, 18000),
  ('Principal', 18000, 25000)
) AS salary_data(stage_name, min_salary, max_salary)
WHERE t.name = 'Trilha de Desenvolvimento - Tecnologia'
ON CONFLICT DO NOTHING;