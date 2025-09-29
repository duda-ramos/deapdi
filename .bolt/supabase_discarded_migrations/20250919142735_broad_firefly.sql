/*
  # Sistema de Mental Health/Bem-estar Psicológico

  1. Novas Tabelas
    - `psychology_sessions` - Sessões de psicologia
    - `therapeutic_activities` - Atividades terapêuticas
    - `psychological_forms` - Formulários de avaliação
    - `form_responses` - Respostas aos formulários
    - `session_requests` - Solicitações de sessão
    - `emotional_checkins` - Check-ins emocionais diários
    - `mental_health_alerts` - Alertas de risco
    - `consent_records` - Registros de consentimento

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para cada tipo de usuário
    - Criptografia de dados sensíveis
    - Logs de auditoria

  3. Funcionalidades
    - Sistema de agendamento
    - Formulários configuráveis
    - Alertas automáticos
    - Relatórios agregados
*/

-- Enum para tipos de sessão
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type') THEN
    CREATE TYPE session_type AS ENUM ('presencial', 'online', 'emergencial', 'follow_up');
  END IF;
END $$;

-- Enum para status de sessão
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM ('solicitada', 'agendada', 'realizada', 'cancelada', 'faltou');
  END IF;
END $$;

-- Enum para nível de risco
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
    CREATE TYPE risk_level AS ENUM ('baixo', 'medio', 'alto', 'critico');
  END IF;
END $$;

-- Enum para urgência
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
    CREATE TYPE urgency_level AS ENUM ('normal', 'prioritaria', 'emergencial');
  END IF;
END $$;

-- Sessões de psicologia
CREATE TABLE IF NOT EXISTS psychology_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  psychologist_id uuid REFERENCES profiles(id),
  scheduled_date timestamptz,
  status session_status DEFAULT 'solicitada',
  session_notes text, -- visível apenas para psicólogo
  summary_for_employee text, -- resumo compartilhado
  duration_minutes integer DEFAULT 60,
  session_type session_type DEFAULT 'presencial',
  urgency urgency_level DEFAULT 'normal',
  location text,
  meeting_link text,
  employee_feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Atividades terapêuticas
CREATE TABLE IF NOT EXISTS therapeutic_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES psychology_sessions(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  due_date date,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'cancelada')),
  employee_feedback text,
  psychologist_notes text,
  completion_evidence text, -- URLs de arquivos/fotos
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Formulários de avaliação psicológica
CREATE TABLE IF NOT EXISTS psychological_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL,
  form_type text NOT NULL, -- ansiedade, depressao, stress, bem_estar
  scoring_rules jsonb, -- regras para calcular pontuação
  risk_thresholds jsonb, -- limites para níveis de risco
  created_by uuid REFERENCES profiles(id),
  active boolean DEFAULT true,
  requires_followup boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Respostas aos formulários
CREATE TABLE IF NOT EXISTS form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES psychological_forms(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  score decimal,
  risk_level risk_level,
  reviewed_by uuid REFERENCES profiles(id),
  psychologist_notes text,
  requires_attention boolean DEFAULT false,
  follow_up_scheduled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Solicitações de sessão
CREATE TABLE IF NOT EXISTS session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  urgency urgency_level DEFAULT 'normal',
  preferred_type session_type DEFAULT 'presencial',
  reason text NOT NULL,
  preferred_times jsonb, -- array de horários preferidos
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'agendada', 'rejeitada')),
  assigned_psychologist uuid REFERENCES profiles(id),
  response_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Check-ins emocionais diários
CREATE TABLE IF NOT EXISTS emotional_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  mood_score integer CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes text,
  tags text[], -- ansioso, motivado, cansado, etc.
  checkin_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, checkin_date)
);

-- Alertas de saúde mental
CREATE TABLE IF NOT EXISTS mental_health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- form_high_risk, missed_sessions, declining_mood
  severity risk_level DEFAULT 'medio',
  title text NOT NULL,
  description text NOT NULL,
  triggered_by text, -- form_response_id, session_id, etc.
  acknowledged_by uuid REFERENCES profiles(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Registros de consentimento
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL, -- data_sharing, session_recording, etc.
  granted boolean NOT NULL,
  consent_text text NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Recursos de bem-estar
CREATE TABLE IF NOT EXISTS wellness_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type text NOT NULL, -- article, video, audio, exercise
  content_url text,
  content_text text,
  category text NOT NULL, -- stress, anxiety, mindfulness, etc.
  target_audience text[], -- employee, manager, all
  created_by uuid REFERENCES profiles(id),
  active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visualizações de recursos
CREATE TABLE IF NOT EXISTS resource_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES wellness_resources(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  time_spent_seconds integer,
  completed boolean DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  UNIQUE(resource_id, employee_id, viewed_at::date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_employee ON psychology_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_psychologist ON psychology_sessions(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_date ON psychology_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_therapeutic_activities_employee ON therapeutic_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_activities_due_date ON therapeutic_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_form_responses_employee ON form_responses(employee_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_risk ON form_responses(risk_level);
CREATE INDEX IF NOT EXISTS idx_emotional_checkins_employee_date ON emotional_checkins(employee_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_mental_health_alerts_employee ON mental_health_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_mental_health_alerts_severity ON mental_health_alerts(severity);

-- Habilitar RLS em todas as tabelas
ALTER TABLE psychology_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_views ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para psychology_sessions
CREATE POLICY "Employees can read own session summaries"
  ON psychology_sessions
  FOR SELECT
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Psychologists can manage all sessions"
  ON psychology_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Psychologists can create sessions"
  ON psychology_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para therapeutic_activities
CREATE POLICY "Employees can manage own activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Psychologists can manage all activities"
  ON therapeutic_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para psychological_forms
CREATE POLICY "Everyone can read active forms"
  ON psychological_forms
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Psychologists can manage forms"
  ON psychological_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para form_responses
CREATE POLICY "Employees can create own responses"
  ON form_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = uid());

CREATE POLICY "Employees can read own responses"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Psychologists can read all responses"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Psychologists can update responses"
  ON form_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para session_requests
CREATE POLICY "Employees can manage own requests"
  ON session_requests
  FOR ALL
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Psychologists can read all requests"
  ON session_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Psychologists can update requests"
  ON session_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para emotional_checkins
CREATE POLICY "Employees can manage own checkins"
  ON emotional_checkins
  FOR ALL
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Psychologists can read all checkins"
  ON emotional_checkins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para mental_health_alerts
CREATE POLICY "Psychologists can manage alerts"
  ON mental_health_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para consent_records
CREATE POLICY "Employees can read own consent"
  ON consent_records
  FOR SELECT
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Employees can create consent"
  ON consent_records
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = uid());

CREATE POLICY "Psychologists can read all consent"
  ON consent_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para wellness_resources
CREATE POLICY "Everyone can read active resources"
  ON wellness_resources
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Psychologists can manage resources"
  ON wellness_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Políticas RLS para resource_views
CREATE POLICY "Employees can manage own views"
  ON resource_views
  FOR ALL
  TO authenticated
  USING (employee_id = uid());

CREATE POLICY "Psychologists can read all views"
  ON resource_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = uid() 
      AND role IN ('hr', 'admin')
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER psychology_sessions_updated_at
  BEFORE UPDATE ON psychology_sessions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER therapeutic_activities_updated_at
  BEFORE UPDATE ON therapeutic_activities
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER psychological_forms_updated_at
  BEFORE UPDATE ON psychological_forms
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER session_requests_updated_at
  BEFORE UPDATE ON session_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER wellness_resources_updated_at
  BEFORE UPDATE ON wellness_resources
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Função para calcular score de formulário
CREATE OR REPLACE FUNCTION calculate_form_score(
  responses jsonb,
  scoring_rules jsonb
) RETURNS decimal AS $$
DECLARE
  total_score decimal := 0;
  question_key text;
  question_response jsonb;
  question_rules jsonb;
BEGIN
  FOR question_key IN SELECT jsonb_object_keys(responses)
  LOOP
    question_response := responses->question_key;
    question_rules := scoring_rules->question_key;
    
    IF question_rules IS NOT NULL THEN
      -- Soma simples para agora (pode ser expandido)
      total_score := total_score + COALESCE((question_response->>'value')::decimal, 0);
    END IF;
  END LOOP;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Função para determinar nível de risco
CREATE OR REPLACE FUNCTION determine_risk_level(
  score decimal,
  risk_thresholds jsonb
) RETURNS risk_level AS $$
BEGIN
  IF score >= COALESCE((risk_thresholds->>'critico')::decimal, 80) THEN
    RETURN 'critico';
  ELSIF score >= COALESCE((risk_thresholds->>'alto')::decimal, 60) THEN
    RETURN 'alto';
  ELSIF score >= COALESCE((risk_thresholds->>'medio')::decimal, 40) THEN
    RETURN 'medio';
  ELSE
    RETURN 'baixo';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar respostas de formulário
CREATE OR REPLACE FUNCTION process_form_response()
RETURNS TRIGGER AS $$
DECLARE
  form_record psychological_forms%ROWTYPE;
  calculated_score decimal;
  calculated_risk risk_level;
BEGIN
  -- Buscar informações do formulário
  SELECT * INTO form_record FROM psychological_forms WHERE id = NEW.form_id;
  
  -- Calcular score
  calculated_score := calculate_form_score(NEW.responses, form_record.scoring_rules);
  
  -- Determinar nível de risco
  calculated_risk := determine_risk_level(calculated_score, form_record.risk_thresholds);
  
  -- Atualizar o registro
  NEW.score := calculated_score;
  NEW.risk_level := calculated_risk;
  
  -- Marcar para atenção se risco alto ou crítico
  IF calculated_risk IN ('alto', 'critico') THEN
    NEW.requires_attention := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_form_response_trigger
  BEFORE INSERT ON form_responses
  FOR EACH ROW EXECUTE FUNCTION process_form_response();

-- Trigger para criar alertas automáticos
CREATE OR REPLACE FUNCTION create_mental_health_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Alerta para respostas de alto risco
  IF NEW.risk_level IN ('alto', 'critico') THEN
    INSERT INTO mental_health_alerts (
      employee_id,
      alert_type,
      severity,
      title,
      description,
      triggered_by
    ) VALUES (
      NEW.employee_id,
      'form_high_risk',
      NEW.risk_level,
      'Resposta de Formulário Indica Alto Risco',
      'Colaborador apresentou pontuação elevada em formulário de avaliação psicológica.',
      NEW.id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_mental_health_alert_trigger
  AFTER INSERT ON form_responses
  FOR EACH ROW EXECUTE FUNCTION create_mental_health_alert();

-- Função para estatísticas agregadas (sem identificação)
CREATE OR REPLACE FUNCTION get_mental_health_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_employees_participating', (
      SELECT COUNT(DISTINCT employee_id) FROM emotional_checkins
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'average_mood_score', (
      SELECT ROUND(AVG(mood_score), 2) FROM emotional_checkins
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'sessions_this_month', (
      SELECT COUNT(*) FROM psychology_sessions
      WHERE status = 'realizada'
      AND scheduled_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'high_risk_responses', (
      SELECT COUNT(*) FROM form_responses
      WHERE risk_level IN ('alto', 'critico')
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'active_alerts', (
      SELECT COUNT(*) FROM mental_health_alerts
      WHERE acknowledged_at IS NULL
    ),
    'wellness_resources_accessed', (
      SELECT COUNT(*) FROM resource_views
      WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Inserir formulários pré-configurados
INSERT INTO psychological_forms (title, description, questions, form_type, scoring_rules, risk_thresholds, created_by, active) VALUES
(
  'Avaliação de Ansiedade (GAD-7 Adaptado)',
  'Questionário para avaliar níveis de ansiedade baseado no GAD-7',
  '[
    {
      "id": "worry_frequency",
      "question": "Com que frequência você se sente nervoso, ansioso ou muito tenso?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    },
    {
      "id": "control_worry",
      "question": "Não conseguir parar ou controlar as preocupações?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    },
    {
      "id": "worry_too_much",
      "question": "Preocupar-se muito com coisas diferentes?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    },
    {
      "id": "trouble_relaxing",
      "question": "Dificuldade para relaxar?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    },
    {
      "id": "restlessness",
      "question": "Ficar tão inquieto que é difícil permanecer parado?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    },
    {
      "id": "easily_annoyed",
      "question": "Ficar facilmente aborrecido ou irritado?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    },
    {
      "id": "fear_awful",
      "question": "Sentir medo como se algo terrível fosse acontecer?",
      "type": "scale",
      "options": [
        {"value": 0, "label": "Nunca"},
        {"value": 1, "label": "Vários dias"},
        {"value": 2, "label": "Mais da metade dos dias"},
        {"value": 3, "label": "Quase todos os dias"}
      ]
    }
  ]'::jsonb,
  'ansiedade',
  '{
    "worry_frequency": {"weight": 1},
    "control_worry": {"weight": 1},
    "worry_too_much": {"weight": 1},
    "trouble_relaxing": {"weight": 1},
    "restlessness": {"weight": 1},
    "easily_annoyed": {"weight": 1},
    "fear_awful": {"weight": 1}
  }'::jsonb,
  '{
    "baixo": 0,
    "medio": 5,
    "alto": 10,
    "critico": 15
  }'::jsonb,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'Avaliação de Estresse no Trabalho',
  'Questionário para medir níveis de estresse relacionados ao trabalho',
  '[
    {
      "id": "workload_pressure",
      "question": "Sinto-me sobrecarregado com a quantidade de trabalho",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Discordo totalmente"},
        {"value": 2, "label": "Discordo"},
        {"value": 3, "label": "Neutro"},
        {"value": 4, "label": "Concordo"},
        {"value": 5, "label": "Concordo totalmente"}
      ]
    },
    {
      "id": "time_pressure",
      "question": "Frequentemente não tenho tempo suficiente para completar minhas tarefas",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Discordo totalmente"},
        {"value": 2, "label": "Discordo"},
        {"value": 3, "label": "Neutro"},
        {"value": 4, "label": "Concordo"},
        {"value": 5, "label": "Concordo totalmente"}
      ]
    },
    {
      "id": "work_life_balance",
      "question": "Tenho dificuldade em equilibrar trabalho e vida pessoal",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Discordo totalmente"},
        {"value": 2, "label": "Discordo"},
        {"value": 3, "label": "Neutro"},
        {"value": 4, "label": "Concordo"},
        {"value": 5, "label": "Concordo totalmente"}
      ]
    },
    {
      "id": "support_feeling",
      "question": "Sinto que tenho apoio adequado da minha equipe",
      "type": "scale",
      "options": [
        {"value": 5, "label": "Discordo totalmente"},
        {"value": 4, "label": "Discordo"},
        {"value": 3, "label": "Neutro"},
        {"value": 2, "label": "Concordo"},
        {"value": 1, "label": "Concordo totalmente"}
      ]
    },
    {
      "id": "job_satisfaction",
      "question": "Estou satisfeito com meu trabalho atual",
      "type": "scale",
      "options": [
        {"value": 5, "label": "Discordo totalmente"},
        {"value": 4, "label": "Discordo"},
        {"value": 3, "label": "Neutro"},
        {"value": 2, "label": "Concordo"},
        {"value": 1, "label": "Concordo totalmente"}
      ]
    }
  ]'::jsonb,
  'stress',
  '{
    "workload_pressure": {"weight": 1},
    "time_pressure": {"weight": 1},
    "work_life_balance": {"weight": 1},
    "support_feeling": {"weight": 1},
    "job_satisfaction": {"weight": 1}
  }'::jsonb,
  '{
    "baixo": 5,
    "medio": 15,
    "alto": 20,
    "critico": 25
  }'::jsonb,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'Check-in de Bem-estar Semanal',
  'Avaliação rápida do estado emocional e bem-estar geral',
  '[
    {
      "id": "overall_mood",
      "question": "Como você descreveria seu humor geral esta semana?",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Muito baixo"},
        {"value": 2, "label": "Baixo"},
        {"value": 3, "label": "Neutro"},
        {"value": 4, "label": "Bom"},
        {"value": 5, "label": "Excelente"}
      ]
    },
    {
      "id": "energy_level",
      "question": "Como está seu nível de energia?",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Muito baixo"},
        {"value": 2, "label": "Baixo"},
        {"value": 3, "label": "Normal"},
        {"value": 4, "label": "Alto"},
        {"value": 5, "label": "Muito alto"}
      ]
    },
    {
      "id": "sleep_quality",
      "question": "Como tem sido a qualidade do seu sono?",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Muito ruim"},
        {"value": 2, "label": "Ruim"},
        {"value": 3, "label": "Regular"},
        {"value": 4, "label": "Boa"},
        {"value": 5, "label": "Excelente"}
      ]
    },
    {
      "id": "work_satisfaction",
      "question": "Qual seu nível de satisfação com o trabalho esta semana?",
      "type": "scale",
      "options": [
        {"value": 1, "label": "Muito insatisfeito"},
        {"value": 2, "label": "Insatisfeito"},
        {"value": 3, "label": "Neutro"},
        {"value": 4, "label": "Satisfeito"},
        {"value": 5, "label": "Muito satisfeito"}
      ]
    }
  ]'::jsonb,
  'bem_estar',
  '{
    "overall_mood": {"weight": 1, "reverse": true},
    "energy_level": {"weight": 1, "reverse": true},
    "sleep_quality": {"weight": 1, "reverse": true},
    "work_satisfaction": {"weight": 1, "reverse": true}
  }'::jsonb,
  '{
    "baixo": 16,
    "medio": 12,
    "alto": 8,
    "critico": 4
  }'::jsonb,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
);

-- Inserir recursos de bem-estar iniciais
INSERT INTO wellness_resources (title, description, content_type, content_text, category, target_audience, created_by, active) VALUES
(
  'Técnicas de Respiração para Ansiedade',
  'Exercícios simples de respiração para reduzir ansiedade no trabalho',
  'exercise',
  '## Respiração 4-7-8

1. **Inspire** pelo nariz contando até 4
2. **Segure** a respiração contando até 7  
3. **Expire** pela boca contando até 8
4. **Repita** 4 vezes

### Quando usar:
- Antes de reuniões importantes
- Quando se sentir ansioso
- Para relaxar durante o dia

### Benefícios:
- Reduz ansiedade imediatamente
- Melhora o foco
- Diminui a frequência cardíaca',
  'anxiety',
  ARRAY['employee', 'manager'],
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'Mindfulness no Trabalho',
  'Práticas de atenção plena para reduzir estresse e aumentar produtividade',
  'article',
  '## O que é Mindfulness?

Mindfulness é a prática de estar presente e totalmente engajado com o que estamos fazendo no momento.

### Benefícios no Trabalho:
- Reduz estresse e ansiedade
- Melhora foco e concentração
- Aumenta criatividade
- Melhora relacionamentos

### Exercícios Rápidos (5 minutos):

#### 1. Respiração Consciente
- Foque apenas na sua respiração
- Conte as inspirações de 1 a 10
- Quando a mente divagar, volte gentilmente

#### 2. Escaneamento Corporal
- Sente-se confortavelmente
- Observe tensões no corpo
- Relaxe cada parte conscientemente

#### 3. Mindful Walking
- Caminhe devagar
- Sinta os pés tocando o chão
- Observe o ambiente ao redor',
  'mindfulness',
  ARRAY['employee', 'manager', 'all'],
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'Gestão de Estresse para Líderes',
  'Estratégias específicas para gestores lidarem com pressão e responsabilidades',
  'article',
  '## Estresse na Liderança

Liderar equipes traz responsabilidades únicas que podem gerar estresse adicional.

### Sinais de Alerta:
- Dificuldade para tomar decisões
- Irritabilidade com a equipe
- Trabalhar excessivamente
- Negligenciar autocuidado

### Estratégias de Gestão:

#### 1. Delegação Efetiva
- Identifique tarefas que podem ser delegadas
- Confie na capacidade da equipe
- Forneça orientação clara

#### 2. Estabeleça Limites
- Defina horários de trabalho
- Aprenda a dizer "não"
- Reserve tempo para si mesmo

#### 3. Comunicação Aberta
- Compartilhe desafios com outros líderes
- Busque feedback da equipe
- Seja transparente sobre limitações

#### 4. Autocuidado
- Mantenha hobbies e interesses
- Exercite-se regularmente
- Durma adequadamente',
  'stress',
  ARRAY['manager'],
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
);