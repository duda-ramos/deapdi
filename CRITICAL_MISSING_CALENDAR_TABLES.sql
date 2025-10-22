-- ═══════════════════════════════════════════════════════════
-- MIGRAÇÃO CRÍTICA: Criação de Tabelas de Calendário
-- ═══════════════════════════════════════════════════════════
-- 
-- PROBLEMA IDENTIFICADO:
-- As tabelas calendar_events e calendar_requests são referenciadas
-- em políticas RLS e no código TypeScript, mas não têm CREATE TABLE
-- nas migrações do repositório.
-- 
-- AÇÃO: Execute este script APENAS se as tabelas não existirem
-- ═══════════════════════════════════════════════════════════

-- Verificar se as tabelas existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events') THEN
    RAISE NOTICE '⚠️ ATENÇÃO: Tabela calendar_events NÃO existe. Criando...';
  ELSE
    RAISE NOTICE '✅ OK: Tabela calendar_events já existe.';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_requests') THEN
    RAISE NOTICE '⚠️ ATENÇÃO: Tabela calendar_requests NÃO existe. Criando...';
  ELSE
    RAISE NOTICE '✅ OK: Tabela calendar_requests já existe.';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- Criar calendar_events (se não existir)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('ferias', 'feriado', 'evento', 'aniversario', 'day-off', 'aniversario_empresa')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  category text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  is_public boolean DEFAULT false,
  color text,
  recurring_rule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- Criar calendar_requests (se não existir)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS calendar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ferias', 'day-off', 'licenca')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  days_requested integer NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  manager_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- Habilitar RLS (as políticas já existem em outra migração)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_requests ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- Criar índices para performance
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id 
  ON calendar_events(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by 
  ON calendar_events(created_by);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date 
  ON calendar_events(start_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_type 
  ON calendar_events(type);

CREATE INDEX IF NOT EXISTS idx_calendar_events_public 
  ON calendar_events(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_calendar_requests_requester 
  ON calendar_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_status 
  ON calendar_requests(status);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_start_date 
  ON calendar_requests(start_date);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_type 
  ON calendar_requests(type);

-- ═══════════════════════════════════════════════════════════
-- Adicionar triggers de updated_at
-- ═══════════════════════════════════════════════════════════

-- Função já existe: handle_updated_at()

CREATE TRIGGER calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER calendar_requests_updated_at 
  BEFORE UPDATE ON calendar_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Verificação final
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  events_count integer;
  requests_count integer;
  events_policies integer;
  requests_policies integer;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO events_count
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'calendar_events';
  
  SELECT COUNT(*) INTO requests_count
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'calendar_requests';
  
  -- Contar políticas RLS
  SELECT COUNT(*) INTO events_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'calendar_events';
  
  SELECT COUNT(*) INTO requests_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'calendar_requests';
  
  -- Relatório
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'VERIFICAÇÃO DE TABELAS DE CALENDÁRIO';
  RAISE NOTICE '════════════════════════════════════════';
  
  IF events_count = 1 THEN
    RAISE NOTICE '✅ calendar_events: CRIADA';
    RAISE NOTICE '   Políticas RLS: %', events_policies;
  ELSE
    RAISE WARNING '🚨 calendar_events: NÃO ENCONTRADA';
  END IF;
  
  IF requests_count = 1 THEN
    RAISE NOTICE '✅ calendar_requests: CRIADA';
    RAISE NOTICE '   Políticas RLS: %', requests_policies;
  ELSE
    RAISE WARNING '🚨 calendar_requests: NÃO ENCONTRADA';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
  
  IF events_count = 1 AND requests_count = 1 AND events_policies >= 3 AND requests_policies >= 3 THEN
    RAISE NOTICE '✅ SUCESSO: Tabelas de calendário configuradas corretamente!';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: Verificar configuração de políticas RLS';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- NOTAS IMPORTANTES
-- ═══════════════════════════════════════════════════════════
-- 
-- As políticas RLS para estas tabelas já foram criadas na migração:
-- 20250930133808_violet_voice.sql
-- 
-- Políticas existentes:
-- - calendar_events_own_access
-- - calendar_events_hr_admin_jwt  
-- - calendar_events_public_read
-- - calendar_requests_own_access
-- - calendar_requests_hr_admin_jwt
-- - calendar_requests_manager_jwt
-- 
-- Este script cria APENAS as tabelas e índices.
-- ═══════════════════════════════════════════════════════════
