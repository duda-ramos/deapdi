/*
  # Advanced Mental Health Features

  1. New Tables
    - `therapeutic_tasks` - Therapeutic tasks and assignments
    - `resource_favorites` - User favorites for wellness resources
    - `checkin_settings` - Customizable check-in configurations
    - `form_templates` - Dynamic form templates
    - `form_submissions` - Form submission responses
    - `alert_rules` - Configurable alert automation rules

  2. Enhanced Tables
    - Add missing columns to existing tables
    - Improve indexing for performance
    - Add proper constraints and validations

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
    - Ensure privacy compliance for mental health data

  4. Functions
    - Mental health analytics function
    - Alert automation triggers
    - Report generation utilities
*/

-- Therapeutic Tasks
CREATE TABLE IF NOT EXISTS therapeutic_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('formulario', 'meditacao', 'exercicio', 'leitura', 'reflexao', 'anotacao')),
  content JSONB DEFAULT '{}',
  instructions TEXT,
  assigned_to UUID[] NOT NULL DEFAULT '{}',
  assigned_by UUID NOT NULL,
  due_date DATE NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  completion_tracking JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE therapeutic_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage all therapeutic tasks"
  ON therapeutic_tasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Users can view assigned tasks"
  ON therapeutic_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(assigned_to));

CREATE POLICY "Users can update assigned tasks"
  ON therapeutic_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(assigned_to));

-- Resource Favorites
CREATE TABLE IF NOT EXISTS resource_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON resource_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Check-in Settings
CREATE TABLE IF NOT EXISTS checkin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  reminder_time TIME DEFAULT '09:00:00',
  reminder_enabled BOOLEAN DEFAULT true,
  custom_questions JSONB DEFAULT '[]',
  team_questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE checkin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checkin settings"
  ON checkin_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR can view all checkin settings"
  ON checkin_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

-- Form Templates (Dynamic Forms)
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  form_type TEXT NOT NULL CHECK (form_type IN ('auto_avaliacao', 'feedback_gestor', 'avaliacao_rh')),
  questions JSONB NOT NULL DEFAULT '[]',
  scoring_rules JSONB DEFAULT '{}',
  alert_thresholds JSONB DEFAULT '{}',
  target_audience TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage form templates"
  ON form_templates
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Users can view active templates"
  ON form_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL,
  submitted_by UUID NOT NULL,
  target_user UUID, -- For feedback forms (who the form is about)
  responses JSONB NOT NULL DEFAULT '{}',
  calculated_score NUMERIC,
  risk_level TEXT CHECK (risk_level IN ('baixo', 'medio', 'alto', 'critico')),
  auto_alerts_triggered BOOLEAN DEFAULT false,
  reviewed_by UUID,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('auto_avaliacao', 'feedback', 'avaliacao')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit own forms"
  ON form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view own submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = submitted_by OR auth.uid() = target_user);

CREATE POLICY "HR can view all submissions"
  ON form_submissions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

CREATE POLICY "Managers can view team submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = form_submissions.target_user 
    AND profiles.manager_id = auth.uid()
  ));

-- Alert Rules (Automation)
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('form_score', 'checkin_pattern', 'inactivity', 'manual')),
  trigger_conditions JSONB NOT NULL,
  alert_severity TEXT NOT NULL CHECK (alert_severity IN ('baixo', 'medio', 'alto', 'critico')),
  auto_actions JSONB DEFAULT '{}',
  target_audience TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage alert rules"
  ON alert_rules
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('hr', 'admin')
  ));

-- Add missing columns to wellness_resources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wellness_resources' AND column_name = 'content_text'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN content_text TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wellness_resources' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN target_audience TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wellness_resources' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wellness_resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE wellness_resources ADD COLUMN created_by UUID;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS therapeutic_tasks_assigned_to_idx ON therapeutic_tasks USING GIN (assigned_to);
CREATE INDEX IF NOT EXISTS therapeutic_tasks_due_date_idx ON therapeutic_tasks (due_date);
CREATE INDEX IF NOT EXISTS therapeutic_tasks_status_idx ON therapeutic_tasks (status);

CREATE INDEX IF NOT EXISTS form_submissions_template_idx ON form_submissions (template_id);
CREATE INDEX IF NOT EXISTS form_submissions_target_user_idx ON form_submissions (target_user);
CREATE INDEX IF NOT EXISTS form_submissions_risk_level_idx ON form_submissions (risk_level);
CREATE INDEX IF NOT EXISTS form_submissions_created_at_idx ON form_submissions (created_at);

CREATE INDEX IF NOT EXISTS resource_favorites_user_idx ON resource_favorites (user_id);
CREATE INDEX IF NOT EXISTS resource_favorites_resource_idx ON resource_favorites (resource_id);

CREATE INDEX IF NOT EXISTS checkin_settings_user_idx ON checkin_settings (user_id);

-- Foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'therapeutic_tasks_assigned_by_fkey'
  ) THEN
    ALTER TABLE therapeutic_tasks 
    ADD CONSTRAINT therapeutic_tasks_assigned_by_fkey 
    FOREIGN KEY (assigned_by) REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'resource_favorites_user_id_fkey'
  ) THEN
    ALTER TABLE resource_favorites 
    ADD CONSTRAINT resource_favorites_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'resource_favorites_resource_id_fkey'
  ) THEN
    ALTER TABLE resource_favorites 
    ADD CONSTRAINT resource_favorites_resource_id_fkey 
    FOREIGN KEY (resource_id) REFERENCES wellness_resources(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'checkin_settings_user_id_fkey'
  ) THEN
    ALTER TABLE checkin_settings 
    ADD CONSTRAINT checkin_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'form_templates_created_by_fkey'
  ) THEN
    ALTER TABLE form_templates 
    ADD CONSTRAINT form_templates_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'form_submissions_template_id_fkey'
  ) THEN
    ALTER TABLE form_submissions 
    ADD CONSTRAINT form_submissions_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'form_submissions_submitted_by_fkey'
  ) THEN
    ALTER TABLE form_submissions 
    ADD CONSTRAINT form_submissions_submitted_by_fkey 
    FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'form_submissions_target_user_fkey'
  ) THEN
    ALTER TABLE form_submissions 
    ADD CONSTRAINT form_submissions_target_user_fkey 
    FOREIGN KEY (target_user) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'alert_rules_created_by_fkey'
  ) THEN
    ALTER TABLE alert_rules 
    ADD CONSTRAINT alert_rules_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'therapeutic_tasks_updated_at'
  ) THEN
    CREATE TRIGGER therapeutic_tasks_updated_at
      BEFORE UPDATE ON therapeutic_tasks
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'checkin_settings_updated_at'
  ) THEN
    CREATE TRIGGER checkin_settings_updated_at
      BEFORE UPDATE ON checkin_settings
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'form_templates_updated_at'
  ) THEN
    CREATE TRIGGER form_templates_updated_at
      BEFORE UPDATE ON form_templates
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'form_submissions_updated_at'
  ) THEN
    CREATE TRIGGER form_submissions_updated_at
      BEFORE UPDATE ON form_submissions
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'alert_rules_updated_at'
  ) THEN
    CREATE TRIGGER alert_rules_updated_at
      BEFORE UPDATE ON alert_rules
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Mental Health Analytics Function
CREATE OR REPLACE FUNCTION get_mental_health_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  mood_trend JSONB;
  engagement_stats JSONB;
  alert_stats JSONB;
BEGIN
  -- Check if user has HR/Admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('hr', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: HR/Admin role required';
  END IF;

  -- Calculate mood trends
  SELECT jsonb_build_object(
    'average_mood', COALESCE(AVG(mood_score), 0),
    'average_stress', COALESCE(AVG(stress_level), 0),
    'average_energy', COALESCE(AVG(energy_level), 0),
    'average_sleep', COALESCE(AVG(sleep_quality), 0),
    'total_checkins', COUNT(*),
    'unique_participants', COUNT(DISTINCT employee_id)
  ) INTO mood_trend
  FROM emotional_checkins
  WHERE checkin_date BETWEEN start_date AND end_date;

  -- Calculate engagement stats
  SELECT jsonb_build_object(
    'sessions_scheduled', COUNT(*) FILTER (WHERE status = 'agendada'),
    'sessions_completed', COUNT(*) FILTER (WHERE status = 'realizada'),
    'sessions_cancelled', COUNT(*) FILTER (WHERE status = 'cancelada'),
    'average_rating', COALESCE(AVG(rating), 0),
    'total_session_time', COALESCE(SUM(duration_minutes), 0)
  ) INTO engagement_stats
  FROM psychology_sessions
  WHERE DATE(scheduled_date) BETWEEN start_date AND end_date;

  -- Calculate alert stats
  SELECT jsonb_build_object(
    'total_alerts', COUNT(*),
    'critical_alerts', COUNT(*) FILTER (WHERE severity = 'critico'),
    'high_alerts', COUNT(*) FILTER (WHERE severity = 'alto'),
    'resolved_alerts', COUNT(*) FILTER (WHERE acknowledged_at IS NOT NULL),
    'average_resolution_time', COALESCE(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))/3600), 0)
  ) INTO alert_stats
  FROM mental_health_alerts
  WHERE DATE(created_at) BETWEEN start_date AND end_date;

  -- Combine all stats
  result := jsonb_build_object(
    'period', jsonb_build_object('start', start_date, 'end', end_date),
    'mood_trends', mood_trend,
    'engagement', engagement_stats,
    'alerts', alert_stats,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- Alert Automation Function
CREATE OR REPLACE FUNCTION check_alert_rules()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  user_record RECORD;
  condition JSONB;
  should_trigger BOOLEAN;
BEGIN
  -- Process each active alert rule
  FOR rule_record IN 
    SELECT * FROM alert_rules WHERE is_active = true
  LOOP
    -- Check each user against this rule
    FOR user_record IN 
      SELECT id FROM profiles WHERE status = 'active'
    LOOP
      should_trigger := false;
      
      -- Check trigger conditions based on type
      CASE rule_record.trigger_type
        WHEN 'form_score' THEN
          -- Check if recent form scores meet threshold
          SELECT EXISTS (
            SELECT 1 FROM form_submissions 
            WHERE target_user = user_record.id 
            AND calculated_score <= (rule_record.trigger_conditions->>'min_score')::NUMERIC
            AND created_at >= now() - INTERVAL '7 days'
          ) INTO should_trigger;
          
        WHEN 'checkin_pattern' THEN
          -- Check for concerning check-in patterns
          SELECT EXISTS (
            SELECT 1 FROM emotional_checkins 
            WHERE employee_id = user_record.id 
            AND mood_score <= (rule_record.trigger_conditions->>'max_mood')::INTEGER
            AND stress_level >= (rule_record.trigger_conditions->>'min_stress')::INTEGER
            AND checkin_date >= CURRENT_DATE - INTERVAL '3 days'
            GROUP BY employee_id
            HAVING COUNT(*) >= (rule_record.trigger_conditions->>'min_occurrences')::INTEGER
          ) INTO should_trigger;
          
        WHEN 'inactivity' THEN
          -- Check for lack of engagement
          SELECT NOT EXISTS (
            SELECT 1 FROM emotional_checkins 
            WHERE employee_id = user_record.id 
            AND checkin_date >= CURRENT_DATE - (rule_record.trigger_conditions->>'days')::INTEGER
          ) INTO should_trigger;
      END CASE;
      
      -- Create alert if conditions are met
      IF should_trigger THEN
        INSERT INTO mental_health_alerts (
          employee_id,
          alert_type,
          severity,
          title,
          description,
          triggered_by,
          metadata
        ) VALUES (
          user_record.id,
          rule_record.trigger_type,
          rule_record.alert_severity,
          rule_record.name,
          rule_record.description,
          'automation',
          jsonb_build_object('rule_id', rule_record.id, 'triggered_at', now())
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Sample data for wellness resources
INSERT INTO wellness_resources (title, description, resource_type, category, content_text, tags, active, created_by) VALUES
('Técnicas de Respiração para Ansiedade', 'Aprenda técnicas simples de respiração para controlar a ansiedade no trabalho', 'article', 'anxiety', 
'## Técnicas de Respiração para Ansiedade

### 1. Respiração 4-7-8
- Inspire por 4 segundos
- Segure por 7 segundos  
- Expire por 8 segundos
- Repita 4 vezes

### 2. Respiração Diafragmática
- Coloque uma mão no peito e outra no abdômen
- Respire lentamente pelo nariz
- Certifique-se de que apenas a mão do abdômen se move
- Expire lentamente pela boca

### 3. Respiração Quadrada
- Inspire por 4 segundos
- Segure por 4 segundos
- Expire por 4 segundos
- Segure vazio por 4 segundos

**Dica**: Pratique essas técnicas diariamente, mesmo quando não estiver ansioso, para que se tornem naturais em momentos de estresse.', 
'{"ansiedade", "respiracao", "tecnicas", "relaxamento"}', true, 
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),

('Mindfulness: 5 Minutos de Meditação', 'Exercício rápido de mindfulness para o dia a dia', 'exercise', 'mindfulness',
'## Meditação de 5 Minutos

### Preparação
1. Encontre um local silencioso
2. Sente-se confortavelmente
3. Feche os olhos ou mantenha um olhar suave

### Exercício
1. **Minuto 1**: Foque na sua respiração natural
2. **Minuto 2**: Observe as sensações do corpo
3. **Minuto 3**: Note os pensamentos sem julgá-los
4. **Minuto 4**: Volte a atenção para a respiração
5. **Minuto 5**: Abra os olhos lentamente

### Benefícios
- Reduz estresse e ansiedade
- Melhora foco e concentração
- Aumenta autoconsciência
- Promove bem-estar geral',
'{"mindfulness", "meditacao", "estresse", "foco"}', true,
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),

('Higiene do Sono para Melhor Descanso', 'Dicas práticas para melhorar a qualidade do seu sono', 'article', 'sleep',
'## Higiene do Sono

### Antes de Dormir
- Evite telas 1 hora antes de dormir
- Mantenha o quarto escuro e fresco
- Estabeleça uma rotina relaxante
- Evite cafeína após 14h

### Durante o Dia
- Exponha-se à luz natural pela manhã
- Pratique exercícios regularmente
- Evite cochilos longos após 15h
- Mantenha horários regulares

### Ambiente Ideal
- Temperatura entre 18-22°C
- Colchão e travesseiros confortáveis
- Ruído mínimo ou ruído branco
- Escuridão total ou máscara de dormir

### Se Não Conseguir Dormir
- Levante-se após 20 minutos
- Faça uma atividade calma
- Volte para cama quando sentir sono
- Não force o sono',
'{"sono", "descanso", "higiene", "qualidade"}', true,
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1));

-- Sample form templates
INSERT INTO form_templates (title, description, form_type, questions, scoring_rules, alert_thresholds, created_by) VALUES
('Avaliação de Bem-estar Semanal', 'Formulário semanal para monitorar bem-estar geral', 'auto_avaliacao',
'[
  {
    "id": "mood_week",
    "question": "Como você avaliaria seu humor geral esta semana?",
    "type": "scale",
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "stress_work",
    "question": "Qual foi seu nível de estresse relacionado ao trabalho?",
    "type": "scale", 
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "work_satisfaction",
    "question": "Quão satisfeito você está com seu trabalho atual?",
    "type": "scale",
    "min": 1, 
    "max": 10,
    "required": true
  },
  {
    "id": "support_needed",
    "question": "Você sente que precisa de algum tipo de suporte?",
    "type": "multiple_choice",
    "options": [
      {"value": "nao", "label": "Não, estou bem"},
      {"value": "conversa", "label": "Gostaria de conversar com alguém"},
      {"value": "sessao", "label": "Gostaria de agendar uma sessão"},
      {"value": "recursos", "label": "Preciso de recursos de bem-estar"}
    ],
    "required": true
  }
]',
'{"total_score": "mood_week + (11 - stress_work) + work_satisfaction", "max_score": 30}',
'{"low": 15, "medium": 20, "high": 25, "critical": 30}',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),

('Feedback de Performance e Bem-estar', 'Avaliação do gestor sobre performance e sinais de bem-estar', 'feedback_gestor',
'[
  {
    "id": "performance_quality",
    "question": "Como você avalia a qualidade do trabalho deste colaborador?",
    "type": "scale",
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "engagement_level",
    "question": "Qual o nível de engajamento observado?",
    "type": "scale",
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "stress_signs",
    "question": "Você observou sinais de estresse ou sobrecarga?",
    "type": "multiple_choice",
    "options": [
      {"value": "nenhum", "label": "Nenhum sinal preocupante"},
      {"value": "leve", "label": "Sinais leves de estresse"},
      {"value": "moderado", "label": "Estresse moderado"},
      {"value": "alto", "label": "Alto nível de estresse"}
    ],
    "required": true
  },
  {
    "id": "support_recommendation",
    "question": "Você recomendaria algum tipo de suporte para este colaborador?",
    "type": "multiple_choice",
    "options": [
      {"value": "nenhum", "label": "Nenhum suporte necessário"},
      {"value": "mentoria", "label": "Mentoria profissional"},
      {"value": "treinamento", "label": "Treinamento adicional"},
      {"value": "psicologico", "label": "Suporte psicológico"}
    ],
    "required": true
  }
]',
'{"performance_score": "(performance_quality + engagement_level) / 2"}',
'{"needs_attention": "stress_signs IN (moderado, alto) OR support_recommendation = psicologico"}',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1));

-- Sample alert rules
INSERT INTO alert_rules (name, description, trigger_type, trigger_conditions, alert_severity, auto_actions, created_by) VALUES
('Humor Baixo Persistente', 'Detecta colaboradores com humor baixo por 3 dias consecutivos', 'checkin_pattern',
'{"max_mood": 4, "min_stress": 7, "min_occurrences": 3}', 'alto',
'{"notify_hr": true, "suggest_resources": ["mindfulness", "stress"], "schedule_checkin": true}',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),

('Inatividade no Programa', 'Detecta colaboradores que não fazem check-in há mais de 7 dias', 'inactivity',
'{"days": 7}', 'medio',
'{"send_reminder": true, "notify_manager": false}',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),

('Score Crítico em Formulário', 'Alerta quando formulário indica risco alto', 'form_score',
'{"min_score": 10, "form_types": ["auto_avaliacao", "feedback_gestor"]}', 'critico',
'{"notify_hr": true, "schedule_session": true, "priority": "emergencial"}',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1));