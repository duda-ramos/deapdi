-- Migration: Advanced Mental Health Features
-- Adds comprehensive tables for digital records, wellness resources, and automation

-- Enhanced wellness_resources table with view tracking
ALTER TABLE wellness_resources 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Create therapeutic_tasks table for task management
CREATE TABLE IF NOT EXISTS therapeutic_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('form', 'meditation', 'exercise', 'reading', 'reflection')),
  content JSONB DEFAULT '{}'::jsonb,
  assigned_to UUID[] DEFAULT array[]::uuid[],
  assigned_by UUID REFERENCES profiles(id),
  due_date DATE,
  recurrence VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  completion_notes TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create resource_favorites table
CREATE TABLE IF NOT EXISTS resource_favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES wellness_resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, resource_id)
);

-- Create checkin_settings table
CREATE TABLE IF NOT EXISTS checkin_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  frequency VARCHAR(50) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  reminder_time TIME DEFAULT '09:00',
  custom_questions JSONB DEFAULT '[]'::jsonb,
  reminder_enabled BOOLEAN DEFAULT true,
  weekly_reminder_day INTEGER CHECK (weekly_reminder_day >= 0 AND weekly_reminder_day <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create form_templates table for dynamic forms
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  form_type VARCHAR(50) NOT NULL CHECK (form_type IN ('auto_avaliacao', 'feedback_gestor', 'avaliacao_rh', 'custom')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  scoring_rules JSONB DEFAULT '{}'::jsonb,
  alert_thresholds JSONB DEFAULT '{}'::jsonb,
  target_audience TEXT[] DEFAULT array[]::text[],
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(100),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create alert_rules table for automation
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('form_score', 'checkin_pattern', 'inactivity', 'manual')),
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  alert_severity VARCHAR(20) NOT NULL CHECK (alert_severity IN ('baixo', 'medio', 'alto', 'critico')),
  auto_actions JSONB DEFAULT '{}'::jsonb,
  target_audience TEXT[] DEFAULT array[]::text[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create view_logs table for tracking resource views
CREATE TABLE IF NOT EXISTS view_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES wellness_resources(id) ON DELETE CASCADE,
  view_duration INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapeutic_tasks_assigned_to ON therapeutic_tasks USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_therapeutic_tasks_status ON therapeutic_tasks(status);
CREATE INDEX IF NOT EXISTS idx_therapeutic_tasks_due_date ON therapeutic_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_resource_favorites_user ON resource_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_favorites_resource ON resource_favorites(resource_id);
CREATE INDEX IF NOT EXISTS idx_checkin_settings_frequency ON checkin_settings(frequency);
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON form_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON form_templates(form_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_view_logs_user ON view_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_resource ON view_logs(resource_id);

-- Create RLS policies for therapeutic_tasks
ALTER TABLE therapeutic_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their assigned tasks" ON therapeutic_tasks
  FOR SELECT USING (
    auth.uid() = ANY(assigned_to) OR 
    auth.uid() = assigned_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'hr'
    )
  );

CREATE POLICY "HR can manage all tasks" ON therapeutic_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'hr'
    )
  );

-- Create RLS policies for resource_favorites
ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" ON resource_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for checkin_settings
ALTER TABLE checkin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON checkin_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for form_templates
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage form templates" ON form_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'hr'
    )
  );

CREATE POLICY "Users can view active templates" ON form_templates
  FOR SELECT USING (is_active = true);

-- Create RLS policies for alert_rules
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage alert rules" ON alert_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'hr'
    )
  );

-- Create RLS policies for view_logs
ALTER TABLE view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own view logs" ON view_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create view logs" ON view_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update view count
CREATE OR REPLACE FUNCTION increment_resource_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wellness_resources 
  SET view_count = view_count + 1 
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view count
CREATE TRIGGER trigger_increment_view_count
  AFTER INSERT ON view_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_resource_view_count();

-- Create function for mental health analytics
CREATE OR REPLACE FUNCTION get_mental_health_analytics(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_dt DATE := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_dt DATE := COALESCE(end_date, CURRENT_DATE);
BEGIN
  SELECT json_build_object(
    'total_employees_participating', (
      SELECT COUNT(DISTINCT employee_id) 
      FROM emotional_checkins 
      WHERE checkin_date >= start_dt AND checkin_date <= end_dt
    ),
    'average_mood_score', (
      SELECT ROUND(AVG(mood_rating)::numeric, 2)
      FROM emotional_checkins 
      WHERE checkin_date >= start_dt AND checkin_date <= end_dt
    ),
    'sessions_this_month', (
      SELECT COUNT(*) 
      FROM psychology_sessions 
      WHERE scheduled_date >= start_dt AND scheduled_date <= end_dt
    ),
    'high_risk_responses', (
      SELECT COUNT(*) 
      FROM form_responses 
      WHERE score >= 60 AND created_at >= start_dt AND created_at <= end_dt
    ),
    'active_alerts', (
      SELECT COUNT(*) 
      FROM mental_health_alerts 
      WHERE acknowledged_at IS NULL
    ),
    'wellness_resources_accessed', (
      SELECT COUNT(DISTINCT resource_id) 
      FROM view_logs 
      WHERE created_at >= start_dt AND created_at <= end_dt
    ),
    'mood_trend', (
      SELECT json_agg(
        json_build_object(
          'date', checkin_date,
          'average_mood', ROUND(AVG(mood_rating)::numeric, 2)
        )
      )
      FROM emotional_checkins 
      WHERE checkin_date >= start_dt AND checkin_date <= end_dt
      GROUP BY checkin_date
      ORDER BY checkin_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to check alert rules
CREATE OR REPLACE FUNCTION check_alert_rules()
RETURNS VOID AS $$
DECLARE
  rule_record RECORD;
  condition_met BOOLEAN;
BEGIN
  FOR rule_record IN 
    SELECT * FROM alert_rules WHERE is_active = true
  LOOP
    -- Check different trigger types
    CASE rule_record.trigger_type
      WHEN 'form_score' THEN
        -- Check for high-risk form responses
        SELECT EXISTS(
          SELECT 1 FROM form_responses 
          WHERE score >= (rule_record.trigger_conditions->>'min_score')::integer
          AND created_at >= NOW() - INTERVAL '1 hour'
        ) INTO condition_met;
        
      WHEN 'checkin_pattern' THEN
        -- Check for concerning check-in patterns
        SELECT EXISTS(
          SELECT 1 FROM emotional_checkins 
          WHERE mood_rating <= (rule_record.trigger_conditions->>'max_mood')::integer
          AND checkin_date >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY employee_id
          HAVING COUNT(*) >= (rule_record.trigger_conditions->>'consecutive_days')::integer
        ) INTO condition_met;
        
      WHEN 'inactivity' THEN
        -- Check for user inactivity
        SELECT EXISTS(
          SELECT 1 FROM emotional_checkins 
          WHERE checkin_date < CURRENT_DATE - INTERVAL '7 days'
          AND employee_id NOT IN (
            SELECT DISTINCT employee_id 
            FROM emotional_checkins 
            WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days'
          )
        ) INTO condition_met;
        
      ELSE
        condition_met := false;
    END CASE;
    
    -- Create alert if condition is met
    IF condition_met THEN
      INSERT INTO mental_health_alerts (
        employee_id,
        alert_type,
        severity,
        title,
        description,
        triggered_by
      ) VALUES (
        (SELECT id FROM profiles WHERE role = 'hr' LIMIT 1), -- Default to HR user
        rule_record.trigger_type,
        rule_record.alert_severity,
        rule_record.name,
        rule_record.description,
        rule_record.id::text
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample wellness resources
INSERT INTO wellness_resources (title, description, resource_type, category, tags, content_text, created_by) VALUES
('Técnicas de Respiração para Ansiedade', 'Exercícios simples e eficazes para reduzir ansiedade e estresse no trabalho', 'exercise', 'anxiety', ARRAY['ansiedade', 'respiração', 'relaxamento'], 
'<h3>Exercício 4-7-8</h3><p>1. Inspire pelo nariz contando até 4</p><p>2. Segure a respiração contando até 7</p><p>3. Expire pela boca contando até 8</p><p>Repita 4 vezes.</p>', 
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),
('Meditação Guiada - 5 Minutos', 'Sessão rápida de mindfulness para o meio do dia', 'audio', 'mindfulness', ARRAY['meditação', 'mindfulness', 'relaxamento'],
'<h3>Meditação de 5 minutos</h3><p>Encontre um local tranquilo, sente-se confortavelmente e siga as instruções de respiração guiada.</p>',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),
('Dicas para Melhor Sono', 'Estratégias comprovadas para melhorar a qualidade do sono', 'article', 'sleep', ARRAY['sono', 'bem-estar', 'saúde'],
'<h3>Higiene do Sono</h3><ul><li>Mantenha horários regulares</li><li>Evite telas 1h antes de dormir</li><li>Crie um ambiente escuro e fresco</li><li>Evite cafeína após 14h</li></ul>',
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1));

-- Insert sample form templates
INSERT INTO form_templates (title, description, form_type, questions, scoring_rules, alert_thresholds, target_audience, created_by) VALUES
('GAD-7 - Ansiedade', 'Questionário de Ansiedade Generalizada', 'auto_avaliacao', 
'[{"id":"q1","question":"Sentir-se nervoso, ansioso ou muito preocupado","type":"scale","options":[{"value":0,"label":"Nenhum dia"},{"value":1,"label":"Vários dias"},{"value":2,"label":"Mais da metade dos dias"},{"value":3,"label":"Quase todos os dias"}]},{"id":"q2","question":"Não conseguir parar ou controlar a preocupação","type":"scale","options":[{"value":0,"label":"Nenhum dia"},{"value":1,"label":"Vários dias"},{"value":2,"label":"Mais da metade dos dias"},{"value":3,"label":"Quase todos os dias"}]}]',
'{"total_score": "sum", "max_score": 21}',
'{"alto": 10, "critico": 15}',
ARRAY['all'],
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),
('PHQ-9 - Depressão', 'Questionário de Saúde do Paciente', 'auto_avaliacao',
'[{"id":"q1","question":"Pouco interesse ou prazer em fazer coisas","type":"scale","options":[{"value":0,"label":"Nenhum dia"},{"value":1,"label":"Vários dias"},{"value":2,"label":"Mais da metade dos dias"},{"value":3,"label":"Quase todos os dias"}]}]',
'{"total_score": "sum", "max_score": 27}',
'{"alto": 10, "critico": 15}',
ARRAY['all'],
(SELECT id FROM profiles WHERE role = 'hr' LIMIT 1));

-- Insert sample alert rules
INSERT INTO alert_rules (name, description, trigger_type, trigger_conditions, alert_severity, target_audience, created_by) VALUES
('Alto Risco - Formulários', 'Alerta quando formulários indicam alto risco', 'form_score', '{"min_score": 15}', 'alto', ARRAY['hr'], (SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),
('Inatividade - Check-ins', 'Alerta quando funcionário não faz check-in há 7 dias', 'inactivity', '{"days": 7}', 'medio', ARRAY['hr'], (SELECT id FROM profiles WHERE role = 'hr' LIMIT 1)),
('Padrão de Humor Baixo', 'Alerta quando humor baixo por 3 dias consecutivos', 'checkin_pattern', '{"max_mood": 4, "consecutive_days": 3}', 'alto', ARRAY['hr'], (SELECT id FROM profiles WHERE role = 'hr' LIMIT 1));
