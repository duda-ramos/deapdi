-- ============================================
-- Migration: Add RLS to Critical Health Tables
-- ============================================
-- Descrição: Protege dados sensíveis de saúde mental
-- Tabelas: therapeutic_tasks, checkin_settings
-- Prioridade: CRÍTICA - LGPD compliance
-- Data: 2025-10-29
-- Baseado em: RLS_ANALYSIS.md

-- ============================================
-- PARTE 1: THERAPEUTIC_TASKS
-- ============================================
-- Contexto: Tarefas terapêuticas atribuídas a funcionários
-- Sensibilidade: ALTA (dados de intervenção terapêutica)
-- Risco sem RLS: Usuários veem tarefas/notas de outros

-- 1.1 Habilitar RLS (se ainda não estiver)
ALTER TABLE therapeutic_tasks ENABLE ROW LEVEL SECURITY;

-- 1.2 DROP políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON therapeutic_tasks;
DROP POLICY IF EXISTS "HR can manage all tasks" ON therapeutic_tasks;
DROP POLICY IF EXISTS therapeutic_tasks_assigned_read ON therapeutic_tasks;
DROP POLICY IF EXISTS therapeutic_tasks_complete ON therapeutic_tasks;
DROP POLICY IF EXISTS therapeutic_tasks_hr_manage ON therapeutic_tasks;
DROP TRIGGER IF EXISTS therapeutic_tasks_assignee_guard ON therapeutic_tasks;
DROP FUNCTION IF EXISTS enforce_therapeutic_task_assignee_update();

-- 1.3 Política SELECT: Ver apenas tarefas atribuídas
CREATE POLICY therapeutic_tasks_assigned_read
  ON therapeutic_tasks 
  FOR SELECT
  TO authenticated
  USING (
    -- Usuário está na lista de assigned_to OU
    auth.uid() = ANY(assigned_to) OR 
    -- É quem atribuiu a tarefa OU
    auth.uid() = assigned_by OR
    -- É HR/Admin (vê tudo para gestão)
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );

-- 1.4 Política UPDATE: Completar apenas próprias tarefas
CREATE POLICY therapeutic_tasks_complete
  ON therapeutic_tasks
  FOR UPDATE
  TO authenticated
  USING (
    -- Apenas quem está atribuído pode atualizar
    auth.uid() = ANY(assigned_to)
  )
  WITH CHECK (
    -- E só pode atualizar para status válidos
    auth.uid() = ANY(assigned_to) AND
    status IN ('in_progress', 'completed')
  );

-- 1.4.1 Trigger para impedir que colaboradores alterem atribuições ou campos sensíveis
CREATE OR REPLACE FUNCTION enforce_therapeutic_task_assignee_update()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- HR/Admin mantêm controle total
  IF COALESCE(auth.jwt() ->> 'user_role', '') NOT IN ('hr', 'admin') THEN
    -- Apenas usuários atribuídos podem atualizar
    IF auth.uid() IS NULL OR NOT auth.uid() = ANY(OLD.assigned_to) THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'Only assigned users can update this therapeutic task.';
    END IF;

    -- Bloquear alterações em campos sensíveis como assigned_to, title, due_date etc.
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR
       NEW.assigned_by IS DISTINCT FROM OLD.assigned_by OR
       NEW.title IS DISTINCT FROM OLD.title OR
       NEW.type IS DISTINCT FROM OLD.type OR
       NEW.content IS DISTINCT FROM OLD.content OR
       NEW.due_date IS DISTINCT FROM OLD.due_date OR
       NEW.recurrence IS DISTINCT FROM OLD.recurrence THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'Assigned collaborators may only update status, completion_notes, effectiveness_rating, or updated_at.';
    END IF;

    -- Garantir que status permaneça nos valores permitidos para colaboradores
    IF NEW.status NOT IN ('in_progress', 'completed') THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'Assigned collaborators can only set status to in_progress or completed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therapeutic_tasks_assignee_guard
BEFORE UPDATE ON therapeutic_tasks
FOR EACH ROW
EXECUTE FUNCTION enforce_therapeutic_task_assignee_update();

-- 1.5 Política INSERT/DELETE: Apenas HR/Admin gerencia
CREATE POLICY therapeutic_tasks_hr_manage
  ON therapeutic_tasks 
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );

-- 1.6 Índice para performance (campo array)
CREATE INDEX IF NOT EXISTS idx_therapeutic_tasks_assigned_to 
  ON therapeutic_tasks USING GIN (assigned_to);

-- 1.7 Comentários de documentação
COMMENT ON POLICY therapeutic_tasks_assigned_read ON therapeutic_tasks IS
  'Usuários veem apenas tarefas atribuídas a eles. HR/Admin vê tudo.';

COMMENT ON POLICY therapeutic_tasks_complete ON therapeutic_tasks IS
  'Usuários podem marcar como completa apenas suas próprias tarefas.';

COMMENT ON POLICY therapeutic_tasks_hr_manage ON therapeutic_tasks IS
  'Apenas HR/Admin podem criar, deletar e gerenciar tarefas terapêuticas.';

-- ============================================
-- PARTE 2: CHECKIN_SETTINGS  
-- ============================================
-- Contexto: Configurações pessoais de check-in emocional
-- Sensibilidade: MÉDIA-ALTA (preferências de saúde mental)
-- Risco sem RLS: Usuários veem horários/perguntas de outros

-- 2.1 Habilitar RLS (se ainda não estiver)
ALTER TABLE checkin_settings ENABLE ROW LEVEL SECURITY;

-- 2.2 DROP políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can manage their own settings" ON checkin_settings;
DROP POLICY IF EXISTS checkin_settings_own ON checkin_settings;
DROP POLICY IF EXISTS checkin_settings_hr_read ON checkin_settings;

-- 2.3 Política FOR ALL: Gerenciar apenas próprias configurações
CREATE POLICY checkin_settings_own
  ON checkin_settings 
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- 2.4 Política SELECT adicional: HR pode ver para analytics
CREATE POLICY checkin_settings_hr_read
  ON checkin_settings 
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );

-- 2.5 Índice para performance
CREATE INDEX IF NOT EXISTS idx_checkin_settings_user_id 
  ON checkin_settings (user_id);

-- 2.6 Comentários de documentação
COMMENT ON POLICY checkin_settings_own ON checkin_settings IS
  'Usuários gerenciam apenas suas próprias configurações de check-in emocional.';

COMMENT ON POLICY checkin_settings_hr_read ON checkin_settings IS
  'HR pode visualizar configurações para analytics agregados (sem modificar).';

-- ============================================
-- VALIDAÇÕES FINAIS
-- ============================================

-- Confirmar RLS habilitado
DO $$
BEGIN
  IF NOT (
    SELECT rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'therapeutic_tasks'
  ) THEN
    RAISE EXCEPTION 'RLS não habilitado em therapeutic_tasks';
  END IF;
  
  IF NOT (
    SELECT rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'checkin_settings'
  ) THEN
    RAISE EXCEPTION 'RLS não habilitado em checkin_settings';
  END IF;
  
  RAISE NOTICE '✅ RLS habilitado com sucesso em ambas as tabelas';
END $$;

-- Confirmar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('therapeutic_tasks', 'checkin_settings')
ORDER BY tablename, policyname;
