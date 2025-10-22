-- ============================================================================
-- CRITICAL RPC FUNCTIONS - IMPLEMENTATION
-- ============================================================================
-- 
-- Este arquivo contém as 5 funções RPC CRÍTICAS que devem ser implementadas
-- ANTES de ir para produção.
--
-- BLOQUEADORES:
-- 1. schedule_mentorship_session - Código TypeScript quebrado
-- 2. complete_mentorship_session - Código TypeScript quebrado
-- 3. get_user_dashboard_data - Performance ruim (N+1 queries)
-- 4. get_team_performance - Gestores sem visão de equipe
-- 5. complete_pdi_objetivo - Lógica de pontos extras faltando
--
-- Tempo estimado total: 14 horas
-- ============================================================================

-- ============================================================================
-- 1. SCHEDULE MENTORSHIP SESSION (2h)
-- ============================================================================
-- Prioridade: 🔥 P0 - CÓDIGO EM PRODUÇÃO QUEBRADO
-- Arquivo: src/services/mentorship.ts:140
-- Erro: Função chamada mas não existe no banco

CREATE OR REPLACE FUNCTION schedule_mentorship_session(
  mentorship_id_param uuid,
  scheduled_start_param timestamptz,
  duration_minutes_param integer,
  meeting_link_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_mentorship_record mentorships%ROWTYPE;
  v_mentor_name text;
  v_mentee_name text;
BEGIN
  -- Validar que mentorship existe
  SELECT * INTO v_mentorship_record
  FROM mentorships
  WHERE id = mentorship_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentoria não encontrada: %', mentorship_id_param;
  END IF;
  
  -- Buscar nomes para notificação
  SELECT name INTO v_mentor_name FROM profiles WHERE id = v_mentorship_record.mentor_id;
  SELECT name INTO v_mentee_name FROM profiles WHERE id = v_mentorship_record.mentee_id;
  
  -- Criar sessão
  INSERT INTO mentorship_sessions (
    mentorship_id,
    scheduled_start,
    duration_minutes,
    meeting_link,
    status
  ) VALUES (
    mentorship_id_param,
    scheduled_start_param,
    duration_minutes_param,
    meeting_link_param,
    'scheduled'
  ) RETURNING id INTO v_session_id;
  
  -- Notificar mentor
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    category,
    action_url,
    related_id
  ) VALUES (
    v_mentorship_record.mentor_id,
    'Nova Sessão de Mentoria Agendada',
    format('Sessão agendada com %s para %s', 
           v_mentee_name,
           to_char(scheduled_start_param, 'DD/MM/YYYY às HH24:MI')),
    'info',
    'mentorship',
    '/mentorship',
    v_session_id::text
  );
  
  -- Notificar mentorado
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    category,
    action_url,
    related_id
  ) VALUES (
    v_mentorship_record.mentee_id,
    'Nova Sessão de Mentoria Agendada',
    format('Sessão agendada com %s para %s', 
           v_mentor_name,
           to_char(scheduled_start_param, 'DD/MM/YYYY às HH24:MI')),
    'info',
    'mentorship',
    '/mentorship',
    v_session_id::text
  );
  
  RAISE NOTICE 'Sessão % agendada com sucesso para mentoria %', v_session_id, mentorship_id_param;
  
  RETURN v_session_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION schedule_mentorship_session(uuid, timestamptz, integer, text) TO authenticated;

COMMENT ON FUNCTION schedule_mentorship_session IS 'Agenda uma nova sessão de mentoria e notifica mentor e mentorado';

-- ============================================================================
-- 2. COMPLETE MENTORSHIP SESSION (1.5h)
-- ============================================================================
-- Prioridade: 🔥 P0 - CÓDIGO EM PRODUÇÃO QUEBRADO
-- Arquivo: src/services/mentorship.ts:164
-- Erro: Função chamada mas não existe no banco

CREATE OR REPLACE FUNCTION complete_mentorship_session(
  session_id uuid,
  session_notes_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_record mentorship_sessions%ROWTYPE;
  v_mentorship_record mentorships%ROWTYPE;
  v_mentor_name text;
  v_mentee_name text;
BEGIN
  -- Buscar dados da sessão
  SELECT * INTO v_session_record
  FROM mentorship_sessions
  WHERE id = session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão de mentoria não encontrada: %', session_id;
  END IF;
  
  -- Validar que sessão não está já concluída
  IF v_session_record.status = 'completed' THEN
    RAISE NOTICE 'Sessão % já estava concluída', session_id;
    RETURN;
  END IF;
  
  -- Buscar dados da mentoria
  SELECT * INTO v_mentorship_record
  FROM mentorships
  WHERE id = v_session_record.mentorship_id;
  
  -- Buscar nomes
  SELECT name INTO v_mentor_name FROM profiles WHERE id = v_mentorship_record.mentor_id;
  SELECT name INTO v_mentee_name FROM profiles WHERE id = v_mentorship_record.mentee_id;
  
  -- Atualizar sessão
  UPDATE mentorship_sessions
  SET 
    status = 'completed',
    completed_at = now(),
    notes = session_notes_param
  WHERE id = session_id;
  
  -- Atualizar contadores de mentoria
  UPDATE mentorships
  SET 
    sessions_completed = COALESCE(sessions_completed, 0) + 1,
    last_session_at = now(),
    updated_at = now()
  WHERE id = v_session_record.mentorship_id;
  
  -- Notificar mentor
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    category,
    action_url
  ) VALUES (
    v_mentorship_record.mentor_id,
    'Sessão de Mentoria Concluída',
    format('Sessão com %s foi marcada como concluída', v_mentee_name),
    'success',
    'mentorship',
    '/mentorship'
  );
  
  -- Notificar mentorado
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    category,
    action_url
  ) VALUES (
    v_mentorship_record.mentee_id,
    'Sessão de Mentoria Concluída',
    format('Sessão com %s foi marcada como concluída', v_mentor_name),
    'success',
    'mentorship',
    '/mentorship'
  );
  
  -- Trigger de conquistas será disparado automaticamente
  -- (trigger_check_mentorship_achievements já existe)
  
  RAISE NOTICE 'Sessão % concluída com sucesso', session_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_mentorship_session(uuid, text) TO authenticated;

COMMENT ON FUNCTION complete_mentorship_session IS 'Marca uma sessão de mentoria como concluída, atualiza contadores e notifica participantes';

-- ============================================================================
-- 3. GET USER DASHBOARD DATA (4h)
-- ============================================================================
-- Prioridade: 🔴 P1 - PERFORMANCE RUIM
-- Problema: Dashboards fazem N+1 queries, causando lentidão (5-10s)
-- Solução: Uma única query agregada

CREATE OR REPLACE FUNCTION get_user_dashboard_data(
  p_profile_id uuid,
  p_user_role text DEFAULT 'colaborador'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_team_data jsonb;
  v_hr_data jsonb;
BEGIN
  -- Validar autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  
  -- Validar que usuário pode acessar dados
  IF auth.uid() != p_profile_id AND p_user_role NOT IN ('admin', 'hr') THEN
    -- Permitir se for gestor do perfil
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = p_profile_id
      AND manager_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Sem permissão para acessar dados deste perfil';
    END IF;
  END IF;
  
  -- ============================================
  -- DADOS BASE (todos os perfis)
  -- ============================================
  SELECT jsonb_build_object(
    -- PDIs ativos
    'pdis', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'status', status,
          'deadline', deadline,
          'progress', COALESCE(progress, 0),
          'created_at', created_at
        ) ORDER BY deadline ASC NULLS LAST
      )
      FROM pdis
      WHERE profile_id = p_profile_id
      AND status NOT IN ('completed', 'cancelled', 'validated')
      LIMIT 5
    ), '[]'::jsonb),
    
    -- Competências recentes
    'competencies', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'self_rating', self_rating,
          'manager_rating', manager_rating,
          'last_updated', updated_at
        ) ORDER BY updated_at DESC
      )
      FROM competencies
      WHERE profile_id = p_profile_id
      LIMIT 5
    ), '[]'::jsonb),
    
    -- Trilha de carreira
    'career_track', (
      SELECT jsonb_build_object(
        'current_stage', current_stage,
        'next_stage', next_stage,
        'progress', COALESCE(progress, 0),
        'competency_progress', COALESCE(competency_progress, 0),
        'pdi_progress', COALESCE(pdi_progress, 0)
      )
      FROM career_tracks
      WHERE profile_id = p_profile_id
      LIMIT 1
    ),
    
    -- Notificações não lidas
    'unread_notifications', (
      SELECT COUNT(*) FROM notifications
      WHERE profile_id = p_profile_id AND read = false
    ),
    
    -- Grupos de ação ativos
    'active_groups', (
      SELECT COUNT(DISTINCT agp.group_id)
      FROM action_group_participants agp
      JOIN action_groups ag ON ag.id = agp.group_id
      WHERE agp.profile_id = p_profile_id
      AND ag.status = 'active'
    ),
    
    -- Tarefas pendentes
    'pending_tasks', (
      SELECT COUNT(*)
      FROM tasks
      WHERE assignee_id = p_profile_id
      AND status IN ('todo', 'in-progress')
    ),
    
    -- Conquistas desbloqueadas
    'achievements', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM achievements WHERE profile_id = p_profile_id),
      'recent', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'title', title,
            'icon', icon,
            'points', points,
            'unlocked_at', unlocked_at
          ) ORDER BY unlocked_at DESC
        )
        FROM achievements
        WHERE profile_id = p_profile_id
        LIMIT 3
      ), '[]'::jsonb)
    ),
    
    -- Pontuação total
    'total_points', (
      SELECT COALESCE(points, 0) FROM profiles WHERE id = p_profile_id
    ),
    
    -- Próximos eventos
    'upcoming_events', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'start_date', start_date,
          'type', type
        ) ORDER BY start_date ASC
      )
      FROM calendar_events
      WHERE user_id = p_profile_id
      AND start_date >= CURRENT_DATE
      LIMIT 5
    ), '[]'::jsonb)
  ) INTO v_result;
  
  -- ============================================
  -- DADOS DE GESTOR
  -- ============================================
  IF p_user_role IN ('manager', 'gestor') THEN
    SELECT jsonb_build_object(
      'team_size', (
        SELECT COUNT(*) FROM profiles
        WHERE manager_id = p_profile_id
        AND status = 'active'
      ),
      
      'pending_pdi_validations', (
        SELECT COUNT(*) FROM pdis
        WHERE manager_id = p_profile_id
        AND status = 'aguardando_validacao_gestor'
      ),
      
      'team_avg_progress', (
        SELECT COALESCE(AVG(ct.progress), 0)
        FROM career_tracks ct
        JOIN profiles p ON p.id = ct.profile_id
        WHERE p.manager_id = p_profile_id
        AND p.status = 'active'
      ),
      
      'top_performers', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'avatar_url', p.avatar_url,
            'points', COALESCE(p.points, 0)
          ) ORDER BY COALESCE(p.points, 0) DESC
        )
        FROM profiles p
        WHERE p.manager_id = p_profile_id
        AND p.status = 'active'
        LIMIT 3
      ), '[]'::jsonb),
      
      'team_alerts', (
        SELECT COUNT(*)
        FROM pdis
        WHERE manager_id = p_profile_id
        AND deadline < CURRENT_DATE + INTERVAL '7 days'
        AND status NOT IN ('completed', 'cancelled', 'validated')
      )
    ) INTO v_team_data;
    
    v_result := v_result || v_team_data;
  END IF;
  
  -- ============================================
  -- DADOS DE RH
  -- ============================================
  IF p_user_role IN ('hr', 'rh', 'admin') THEN
    SELECT jsonb_build_object(
      'total_employees', (
        SELECT COUNT(*) FROM profiles WHERE status = 'active'
      ),
      
      'mental_health_alerts', (
        SELECT COUNT(*) FROM mental_health_alerts
        WHERE acknowledged_at IS NULL
      ),
      
      'pending_vacation_requests', (
        SELECT COUNT(*) FROM calendar_requests
        WHERE event_type = 'ferias'
        AND status = 'pending'
      ),
      
      'avg_company_progress', (
        SELECT COALESCE(AVG(progress), 0)
        FROM career_tracks
      ),
      
      'recent_hires', (
        SELECT COUNT(*)
        FROM profiles
        WHERE admission_date >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'active'
      ),
      
      'upcoming_birthdays', (
        SELECT COUNT(*)
        FROM profiles
        WHERE birth_date IS NOT NULL
        AND EXTRACT(MONTH FROM birth_date::date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM birth_date::date) >= EXTRACT(DAY FROM CURRENT_DATE)
      )
    ) INTO v_hr_data;
    
    v_result := v_result || v_hr_data;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_user_dashboard_data IS 'Retorna todos os dados necessários para o dashboard do usuário em uma única query otimizada';

-- ============================================================================
-- 4. GET TEAM PERFORMANCE (3h)
-- ============================================================================
-- Prioridade: 🔴 P1 - GESTORES SEM VISÃO DE EQUIPE
-- Problema: Gestores não conseguem acompanhar performance da equipe
-- Solução: Relatório agregado de performance

CREATE OR REPLACE FUNCTION get_team_performance(
  p_manager_id uuid,
  p_period text DEFAULT 'month' -- 'week', 'month', 'quarter', 'year'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_start_date date;
BEGIN
  -- Validar autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  
  -- Validar permissão (gestor vendo própria equipe ou HR/Admin)
  IF auth.uid() != p_manager_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('hr', 'admin')
    ) THEN
      RAISE EXCEPTION 'Sem permissão para ver dados desta equipe';
    END IF;
  END IF;
  
  -- Calcular data inicial baseado no período
  v_start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  SELECT jsonb_build_object(
    'period', p_period,
    'start_date', v_start_date,
    'end_date', CURRENT_DATE,
    
    -- Tamanho da equipe
    'team_size', (
      SELECT COUNT(*) FROM profiles
      WHERE manager_id = p_manager_id
      AND status = 'active'
    ),
    
    -- Progresso médio na trilha
    'avg_career_progress', ROUND((
      SELECT COALESCE(AVG(ct.progress), 0)
      FROM career_tracks ct
      JOIN profiles p ON p.id = ct.profile_id
      WHERE p.manager_id = p_manager_id
      AND p.status = 'active'
    )::numeric, 2),
    
    -- PDIs concluídos no período
    'pdis_completed', (
      SELECT COUNT(*)
      FROM pdis
      WHERE manager_id = p_manager_id
      AND status IN ('completed', 'validated')
      AND updated_at::date >= v_start_date
    ),
    
    -- PDIs pendentes de validação
    'pdis_pending_validation', (
      SELECT COUNT(*)
      FROM pdis
      WHERE manager_id = p_manager_id
      AND status = 'aguardando_validacao_gestor'
    ),
    
    -- Tarefas concluídas pela equipe
    'tasks_completed', (
      SELECT COUNT(*)
      FROM tasks t
      JOIN profiles p ON p.id = t.assignee_id
      WHERE p.manager_id = p_manager_id
      AND t.status = 'done'
      AND t.updated_at::date >= v_start_date
    ),
    
    -- Top performers (top 5 por pontos)
    'top_performers', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar_url', p.avatar_url,
          'points', COALESCE(p.points, 0),
          'career_progress', COALESCE(ct.progress, 0),
          'role', p.role
        ) ORDER BY COALESCE(p.points, 0) DESC
      )
      FROM (
        SELECT * FROM profiles
        WHERE manager_id = p_manager_id
        AND status = 'active'
        ORDER BY COALESCE(points, 0) DESC
        LIMIT 5
      ) p
      LEFT JOIN career_tracks ct ON ct.profile_id = p.id
    ), '[]'::jsonb),
    
    -- Competências com gaps (média < 3)
    'competency_gaps', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'competency_name', comp_name,
          'avg_rating', ROUND(avg_rating::numeric, 2),
          'employees_count', employees_count,
          'employees_below_3', employees_below_3
        ) ORDER BY avg_rating ASC
      )
      FROM (
        SELECT 
          c.name as comp_name,
          AVG(GREATEST(
            COALESCE(c.self_rating, 0),
            COALESCE(c.manager_rating, 0)
          )) as avg_rating,
          COUNT(DISTINCT c.profile_id) as employees_count,
          COUNT(*) FILTER (
            WHERE GREATEST(
              COALESCE(c.self_rating, 0),
              COALESCE(c.manager_rating, 0)
            ) < 3
          ) as employees_below_3
        FROM competencies c
        JOIN profiles p ON p.id = c.profile_id
        WHERE p.manager_id = p_manager_id
        AND p.status = 'active'
        GROUP BY c.name
        HAVING AVG(GREATEST(
          COALESCE(c.self_rating, 0),
          COALESCE(c.manager_rating, 0)
        )) < 3
      ) gaps
    ), '[]'::jsonb),
    
    -- Alertas (PDIs vencendo em 7 dias)
    'alerts', jsonb_build_object(
      'pdis_expiring_soon', (
        SELECT COUNT(*)
        FROM pdis
        WHERE manager_id = p_manager_id
        AND status NOT IN ('completed', 'cancelled', 'validated')
        AND deadline < CURRENT_DATE + INTERVAL '7 days'
      ),
      'overdue_pdis', (
        SELECT COUNT(*)
        FROM pdis
        WHERE manager_id = p_manager_id
        AND status NOT IN ('completed', 'cancelled', 'validated')
        AND deadline < CURRENT_DATE
      )
    ),
    
    -- Distribuição de progresso (quantos em cada faixa)
    'progress_distribution', (
      SELECT jsonb_build_object(
        '0-25', COUNT(*) FILTER (WHERE COALESCE(ct.progress, 0) BETWEEN 0 AND 25),
        '26-50', COUNT(*) FILTER (WHERE COALESCE(ct.progress, 0) BETWEEN 26 AND 50),
        '51-75', COUNT(*) FILTER (WHERE COALESCE(ct.progress, 0) BETWEEN 51 AND 75),
        '76-100', COUNT(*) FILTER (WHERE COALESCE(ct.progress, 0) BETWEEN 76 AND 100)
      )
      FROM profiles p
      LEFT JOIN career_tracks ct ON ct.profile_id = p.id
      WHERE p.manager_id = p_manager_id
      AND p.status = 'active'
    ),
    
    -- Engajamento (atividade recente)
    'engagement', jsonb_build_object(
      'active_last_week', (
        SELECT COUNT(DISTINCT p.id)
        FROM profiles p
        WHERE p.manager_id = p_manager_id
        AND p.status = 'active'
        AND (
          EXISTS (
            SELECT 1 FROM pdis
            WHERE profile_id = p.id
            AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
          )
          OR EXISTS (
            SELECT 1 FROM tasks
            WHERE assignee_id = p.id
            AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
          )
          OR EXISTS (
            SELECT 1 FROM emotional_checkins
            WHERE profile_id = p.id
            AND checkin_date >= CURRENT_DATE - INTERVAL '7 days'
          )
        )
      ),
      'total_team', (
        SELECT COUNT(*) FROM profiles
        WHERE manager_id = p_manager_id
        AND status = 'active'
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_team_performance(uuid, text) TO authenticated;

COMMENT ON FUNCTION get_team_performance IS 'Retorna métricas agregadas de performance da equipe para gestores';

-- ============================================================================
-- 5. COMPLETE PDI OBJETIVO (3.5h)
-- ============================================================================
-- Prioridade: 🔴 P1 - LÓGICA DE NEGÓCIO INCOMPLETA
-- Problema: Pontos extras não são atribuídos, sem desbloqueio de conquistas
-- Solução: Função completa com toda a lógica de gamificação

CREATE OR REPLACE FUNCTION complete_pdi_objetivo(
  p_pdi_id uuid,
  p_completed_by uuid,
  p_completion_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pdi_record pdis%ROWTYPE;
  v_related_competency text;
  v_bonus_points integer := 50; -- Pontos extras por conclusão
  v_result jsonb;
  v_profile_name text;
  v_manager_name text;
BEGIN
  -- Validar autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  
  -- Buscar PDI
  SELECT * INTO v_pdi_record
  FROM pdis
  WHERE id = p_pdi_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PDI não encontrado: %', p_pdi_id;
  END IF;
  
  -- Validar que usuário pode completar (apenas o dono)
  IF v_pdi_record.profile_id != p_completed_by THEN
    RAISE EXCEPTION 'Apenas o dono do PDI pode marcá-lo como concluído';
  END IF;
  
  -- Validar que PDI não está já concluído
  IF v_pdi_record.status IN ('completed', 'validated') THEN
    RAISE EXCEPTION 'PDI já está concluído';
  END IF;
  
  -- Buscar nomes
  SELECT name INTO v_profile_name FROM profiles WHERE id = v_pdi_record.profile_id;
  SELECT name INTO v_manager_name FROM profiles WHERE id = v_pdi_record.manager_id;
  
  -- Atualizar PDI (aguarda validação do gestor)
  UPDATE pdis
  SET 
    status = 'aguardando_validacao_gestor',
    completed_at = now(),
    progress = 100,
    updated_at = now()
  WHERE id = p_pdi_id;
  
  -- Adicionar nota de conclusão se fornecida
  IF p_completion_notes IS NOT NULL THEN
    UPDATE pdis
    SET completion_notes = p_completion_notes
    WHERE id = p_pdi_id;
  END IF;
  
  -- Extrair competência relacionada
  v_related_competency := v_pdi_record.related_competency;
  
  -- Adicionar pontos extras à competência (se houver)
  -- Nota: Supondo que existe uma coluna bonus_points em competencies
  -- Caso não exista, esta parte deve ser adaptada
  IF v_related_competency IS NOT NULL THEN
    -- Tentar atualizar competência existente
    UPDATE competencies
    SET 
      bonus_points = COALESCE(bonus_points, 0) + v_bonus_points,
      updated_at = now()
    WHERE profile_id = v_pdi_record.profile_id
    AND name = v_related_competency;
    
    -- Se não existir, criar
    IF NOT FOUND THEN
      INSERT INTO competencies (
        profile_id,
        name,
        bonus_points
      ) VALUES (
        v_pdi_record.profile_id,
        v_related_competency,
        v_bonus_points
      );
    END IF;
  END IF;
  
  -- Adicionar pontos ao perfil
  UPDATE profiles
  SET 
    points = COALESCE(points, 0) + v_bonus_points,
    updated_at = now()
  WHERE id = v_pdi_record.profile_id;
  
  -- Notificar gestor para validação
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    category,
    action_url,
    related_id
  ) VALUES (
    v_pdi_record.manager_id,
    'PDI Concluído - Validação Necessária',
    format('%s concluiu o PDI "%s". Clique para validar.', 
           v_profile_name, 
           v_pdi_record.title),
    'info',
    'pdi',
    '/pdi',
    p_pdi_id::text
  );
  
  -- Notificar colaborador
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    category,
    action_url
  ) VALUES (
    v_pdi_record.profile_id,
    'PDI Enviado para Validação',
    format('Seu PDI "%s" foi enviado para validação de %s. Você ganhou +%s pontos!',
           v_pdi_record.title,
           v_manager_name,
           v_bonus_points),
    'success',
    'pdi',
    '/pdi'
  );
  
  -- Trigger de conquistas será disparado automaticamente
  -- (trigger_check_pdi_achievements já existe)
  
  -- Atualizar progresso da trilha de carreira
  PERFORM update_career_progress(v_pdi_record.profile_id);
  
  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'pdi_id', p_pdi_id,
    'status', 'aguardando_validacao_gestor',
    'bonus_points', v_bonus_points,
    'competency_boosted', v_related_competency,
    'awaiting_validation_from', v_manager_name
  );
  
  RAISE NOTICE 'PDI % concluído com sucesso, +% pontos atribuídos', p_pdi_id, v_bonus_points;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_pdi_objetivo(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION complete_pdi_objetivo IS 'Marca um PDI como concluído, atribui pontos extras, notifica gestor e atualiza trilha de carreira';

-- ============================================================================
-- FIM DAS FUNÇÕES CRÍTICAS
-- ============================================================================

-- Verificar que todas as funções foram criadas
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'schedule_mentorship_session',
    'complete_mentorship_session',
    'get_user_dashboard_data',
    'get_team_performance',
    'complete_pdi_objetivo'
  );
  
  IF v_count = 5 THEN
    RAISE NOTICE '✅ Todas as 5 funções críticas foram criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Apenas % de 5 funções foram criadas', v_count;
  END IF;
END $$;
