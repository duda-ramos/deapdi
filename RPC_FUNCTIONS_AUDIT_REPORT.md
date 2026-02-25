# 📊 RELATÓRIO DE AUDITORIA - RPC FUNCTIONS

> **Data:** 2025-10-22  
> **Status do Banco:** 87% completo (45 tabelas)  
> **Objetivo:** Mapear, documentar e priorizar implementação de RPC Functions

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ Functions Implementadas: **29 functions**
### ❌ Functions Críticas Faltantes: **18 functions**
### ⏱️ Tempo Estimado Total: **24-32 horas**

---

## 🗂️ PARTE 1: FUNCTIONS EXISTENTES NO SUPABASE

### ✅ Functions Implementadas (29)

| # | Nome da Function | Parâmetros | Retorno | Security | Arquivo Migration |
|---|-----------------|-----------|---------|----------|-------------------|
| 1 | `handle_new_user` | - | trigger | DEFINER | pale_tower.sql |
| 2 | `handle_updated_at` | - | trigger | DEFINER | pale_tower.sql |
| 3 | `sync_user_role_to_jwt` | - | trigger | DEFINER | red_credit.sql |
| 4 | **`calculate_competency_progress`** | p_profile_id, p_stage | numeric | - | silent_lake.sql |
| 5 | **`calculate_pdi_progress`** | p_profile_id | numeric | - | silent_lake.sql |
| 6 | **`update_career_progress`** | p_profile_id | void | - | silent_lake.sql |
| 7 | `trigger_update_career_progress` | - | trigger | - | silent_lake.sql |
| 8 | `trigger_pdi_career_progress` | - | trigger | - | silent_lake.sql |
| 9 | **`update_career_progress_with_advancement`** | p_profile_id | void | - | pale_forest.sql |
| 10 | **`manual_career_progression_check`** | p_profile_id | jsonb | - | pale_forest.sql |
| 11 | **`unlock_achievement`** | p_profile_id, p_template_id | void | DEFINER | yellow_dawn.sql |
| 12 | **`check_and_unlock_achievements`** | p_profile_id, p_trigger_type | void | DEFINER | yellow_dawn.sql |
| 13 | **`manual_check_achievements`** | p_profile_id | jsonb | DEFINER | expand_achievement.sql |
| 14 | **`get_user_achievement_stats`** | p_profile_id | jsonb | DEFINER | damp_credit.sql |
| 15 | `trigger_check_pdi_achievements` | - | trigger | - | yellow_dawn.sql |
| 16 | `trigger_check_competency_achievements` | - | trigger | - | yellow_dawn.sql |
| 17 | `trigger_check_career_achievements` | - | trigger | - | yellow_dawn.sql |
| 18 | `trigger_check_task_achievements` | - | trigger | - | yellow_dawn.sql |
| 19 | `trigger_check_course_achievements` | - | trigger | - | expand_achievement.sql |
| 20 | `trigger_check_mentorship_achievements` | - | trigger | - | expand_achievement.sql |
| 21 | `trigger_check_action_group_achievements` | - | trigger | - | expand_achievement.sql |
| 22 | `trigger_check_wellness_achievements` | - | trigger | - | expand_achievement.sql |
| 23 | **`calculate_group_progress`** | group_id | numeric | - | lingering_shape.sql |
| 24 | **`update_group_progress`** | - | trigger | - | lingering_shape.sql |
| 25 | **`complete_action_group`** | group_id | json | - | lingering_shape.sql |
| 26 | **`get_group_member_contributions`** | group_id | json | - | lingering_shape.sql |
| 27 | **`calculate_course_completion`** | p_enrollment_id | void | - | smooth_lake.sql |
| 28 | **`generate_certificate`** | p_enrollment_id | void | - | smooth_lake.sql |
| 29 | **`update_competencies_from_course`** | p_enrollment_id | void | - | smooth_lake.sql |

### 📌 Functions de Calendário RH (6)

| # | Nome da Function | Parâmetros | Retorno | Security |
|---|-----------------|-----------|---------|----------|
| 30 | **`get_team_stats`** | - | json | DEFINER |
| 31 | **`check_vacation_eligibility`** | profile_id, request_start_date | json | DEFINER |
| 32 | **`validate_vacation_request`** | requester_id, start_date, end_date, days_requested | json | DEFINER |
| 33 | **`calculate_business_days`** | start_date, end_date | integer | - |
| 34 | **`create_birthday_events`** | - | integer | DEFINER |
| 35 | **`create_company_anniversary_events`** | - | integer | DEFINER |

### 🧠 Functions de Saúde Mental (4)

| # | Nome da Function | Parâmetros | Retorno | Security |
|---|-----------------|-----------|---------|----------|
| 36 | **`increment_resource_view_count`** | - | trigger | - |
| 37 | **`get_mental_health_analytics`** | start_date, end_date | json | - |
| 38 | **`check_alert_rules`** | - | void | - |
| 39 | **`get_mental_health_stats`** | - | json | - |

### 🔔 Functions de Notificações (3)

| # | Nome da Function | Parâmetros | Retorno | Security |
|---|-----------------|-----------|---------|----------|
| 40 | **`cleanup_old_notifications`** | - | integer | DEFINER |
| 41 | **`send_deadline_reminders`** | - | integer | DEFINER |
| 42 | **`create_system_notification`** | 7 params | uuid | DEFINER |

### 🧩 Functions de Migração (3 - Internas)

| # | Nome da Function | Parâmetros | Retorno |
|---|-----------------|-----------|---------|
| 43 | `check_migration_applied` | migration_version | boolean |
| 44 | `mark_migration_applied` | migration_version, description | void |
| 45 | `get_migration_status` | - | json |

---

## 🔍 PARTE 2: CHAMADAS RPC NO CÓDIGO

### Mapeamento de Chamadas Identificadas (15)

| Arquivo | Linha | Function RPC | Status |
|---------|-------|-------------|--------|
| `src/services/careerTrack.ts` | 254 | `update_career_progress_with_advancement` | ✅ Existe |
| `src/services/careerTrack.ts` | 264 | `manual_career_progression_check` | ✅ Existe |
| `src/services/database.ts` | 261 | `manual_check_achievements` | ✅ Existe |
| `src/services/mentalHealth.ts` | 1043 | `check_alert_rules` | ✅ Existe |
| `src/services/mentalHealth.ts` | 1051 | `get_mental_health_analytics` | ✅ Existe |
| `src/services/teams.ts` | 174 | `get_team_stats` | ✅ Existe |
| `src/services/mentorship.ts` | 140 | `schedule_mentorship_session` | ❌ **FALTA** |
| `src/services/mentorship.ts` | 164 | `complete_mentorship_session` | ❌ **FALTA** |
| `src/services/notifications.ts` | 506 | `cleanup_old_notifications` | ✅ Existe |
| `src/services/migrations.ts` | 47-85 | Funções de migração | ✅ Existe |

---

## ⚠️ PARTE 3: ANÁLISE DE FUNCTIONS ESPERADAS

### 🎯 CATEGORIA: PDI (Plano de Desenvolvimento Individual)

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `get_user_pdis` | ❌ FALTA | Query direta com filtros | 🔴 CRÍTICA |
| `create_pdi_objetivo` | ❌ FALTA | INSERT direto na tabela | 🟡 IMPORTANTE |
| `validate_pdi_objetivo` | ❌ FALTA | UPDATE manual de status | 🟡 IMPORTANTE |
| `complete_pdi_objetivo` | ❌ FALTA | Lógica no frontend | 🔴 CRÍTICA |
| `calculate_pdi_progress` | ✅ EXISTE | - | ✅ OK |

**Notas:**
- `calculate_pdi_progress` existe mas retorna apenas % geral
- Falta lógica de validação cruzada (colaborador ↔️ gestor)
- Falta cálculo de pontos extras ao concluir objetivos

---

### 🎯 CATEGORIA: COMPETÊNCIAS

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `calculate_competency_points` | ❌ FALTA | Cálculo no frontend | 🟡 IMPORTANTE |
| `calculate_competency_divergence` | ❌ FALTA | Comparação manual | 🟢 NICE-TO-HAVE |
| `update_career_progress` | ✅ EXISTE | - | ✅ OK |
| `get_competency_evolution` | ❌ FALTA | Query com GROUP BY | 🟢 NICE-TO-HAVE |
| `calculate_competency_progress` | ✅ EXISTE | - | ✅ OK |

**Notas:**
- `update_career_progress` existe e funciona bem
- Falta histórico temporal de competências
- Divergência auto vs gestor não é calculada automaticamente

---

### 🎯 CATEGORIA: GRUPOS DE AÇÃO

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `create_action_group` | ❌ FALTA | INSERT + loop de participantes | 🟡 IMPORTANTE |
| `assign_group_task` | ❌ FALTA | INSERT direto | 🟢 NICE-TO-HAVE |
| `calculate_group_progress` | ✅ EXISTE | - | ✅ OK |
| `complete_group_task` | ❌ FALTA | UPDATE manual | 🟡 IMPORTANTE |
| `complete_action_group` | ✅ EXISTE | - | ✅ OK |
| `get_group_member_contributions` | ✅ EXISTE | - | ✅ OK |

**Notas:**
- Funções de cálculo existem e são boas
- Falta atomicidade em criação de grupos (transações)
- Notificações são criadas manualmente

---

### 🎯 CATEGORIA: CONQUISTAS & GAMIFICAÇÃO

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `unlock_achievement` | ✅ EXISTE | - | ✅ OK |
| `check_and_unlock_achievements` | ✅ EXISTE | - | ✅ OK |
| `manual_check_achievements` | ✅ EXISTE | - | ✅ OK |
| `get_user_achievements` | ❌ FALTA | SELECT simples | 🟢 NICE-TO-HAVE |
| `calculate_user_score` | ❌ FALTA | SUM no frontend | 🟢 NICE-TO-HAVE |

**Notas:**
- Sistema de conquistas está **completo e robusto**
- Triggers automáticos funcionando
- Falta apenas query helper para exibição

---

### 🎯 CATEGORIA: NOTIFICAÇÕES

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `send_notification` / `create_system_notification` | ✅ EXISTE | - | ✅ OK |
| `mark_notification_read` | ❌ FALTA | UPDATE direto | 🟡 IMPORTANTE |
| `get_unread_count` | ❌ FALTA | COUNT no frontend | 🟢 NICE-TO-HAVE |
| `cleanup_old_notifications` | ✅ EXISTE | - | ✅ OK |
| `send_deadline_reminders` | ✅ EXISTE | - | ✅ OK |

**Notas:**
- Sistema de notificações está **bem implementado**
- Falta apenas função helper para marcar como lido com validação

---

### 🎯 CATEGORIA: RELATÓRIOS & ANALYTICS

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `get_team_performance` | ❌ FALTA | Múltiplas queries | 🔴 CRÍTICA |
| `get_department_analytics` | ❌ FALTA | Agregações no frontend | 🟡 IMPORTANTE |
| `get_user_dashboard_data` | ❌ FALTA | Múltiplas chamadas API | 🔴 CRÍTICA |
| `get_team_stats` | ✅ EXISTE (básico) | - | ⚠️ PARCIAL |
| `get_mental_health_analytics` | ✅ EXISTE | - | ✅ OK |

**Notas:**
- `get_team_stats` existe mas é **muito simples**
- Falta agregação de dados para dashboards
- Performance ruim: N+1 queries em dashboards

---

### 🎯 CATEGORIA: MENTORIA

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `request_mentorship` | ❌ FALTA | INSERT + notificação | 🟡 IMPORTANTE |
| `accept_mentorship` | ❌ FALTA | UPDATE + CREATE objetivo PDI | 🟡 IMPORTANTE |
| `schedule_mentorship_session` | ❌ **FALTA** | INSERT direto | 🔴 **CRÍTICA** |
| `complete_mentorship_session` | ❌ **FALTA** | UPDATE direto | 🔴 **CRÍTICA** |

**ALERTA CRÍTICO:** 
- O código **chama** `schedule_mentorship_session` e `complete_mentorship_session`
- Estas funções **NÃO EXISTEM** nas migrations ativas
- Funções estão apenas em `.bolt/supabase_discarded_migrations`
- **Sistema de mentoria está QUEBRADO**

---

### 🎯 CATEGORIA: SAÚDE MENTAL (RH)

| Function | Status | Workaround Atual | Prioridade |
|----------|--------|------------------|-----------|
| `create_psych_record` | ❌ FALTA | INSERT com RLS manual | 🟡 IMPORTANTE |
| `get_psych_records` | ❌ FALTA | SELECT com validação no código | 🟡 IMPORTANTE |
| `schedule_psych_meeting` | ❌ FALTA | INSERT + notificação | 🟢 NICE-TO-HAVE |
| `get_mental_health_analytics` | ✅ EXISTE | - | ✅ OK |
| `check_alert_rules` | ✅ EXISTE | - | ✅ OK |

**Notas:**
- Analytics e alertas estão implementados
- Falta criação e acesso a registros psicológicos
- RLS está configurado, mas falta abstração RPC

---

## 🚨 PARTE 4: FUNCTIONS CRÍTICAS FALTANTES

### ❌ BLOQUEADORES (Impedem funcionalidade essencial)

#### 1. `schedule_mentorship_session` 🔴 **CRÍTICO - CÓDIGO QUEBRADO**
**Tempo:** 2h  
**Motivo:** Código TypeScript chama esta função mas ela não existe no banco

```sql
CREATE OR REPLACE FUNCTION schedule_mentorship_session(
  p_mentorship_id uuid,
  p_scheduled_start timestamptz,
  p_duration_minutes integer,
  p_meeting_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Validar que mentorship existe
  IF NOT EXISTS (SELECT 1 FROM mentorships WHERE id = p_mentorship_id) THEN
    RAISE EXCEPTION 'Mentoria não encontrada';
  END IF;
  
  -- Criar sessão
  INSERT INTO mentorship_sessions (
    mentorship_id,
    scheduled_start,
    duration_minutes,
    meeting_link,
    status
  ) VALUES (
    p_mentorship_id,
    p_scheduled_start,
    p_duration_minutes,
    p_meeting_link,
    'scheduled'
  ) RETURNING id INTO v_session_id;
  
  -- Notificar mentor e mentorado
  INSERT INTO notifications (profile_id, title, message, type, action_url)
  SELECT 
    m.mentee_id,
    'Nova Sessão de Mentoria Agendada',
    'Sua sessão de mentoria foi agendada para ' || to_char(p_scheduled_start, 'DD/MM/YYYY HH24:MI'),
    'info',
    '/mentorship'
  FROM mentorships m WHERE m.id = p_mentorship_id;
  
  RETURN v_session_id;
END;
$$;
```

**Testes:**
```sql
-- Deve criar sessão e retornar UUID
SELECT schedule_mentorship_session(
  'uuid-mentorship',
  '2025-11-01 10:00:00+00',
  60,
  'https://meet.google.com/abc'
);

-- Deve falhar: mentorship não existe
SELECT schedule_mentorship_session(
  gen_random_uuid(),
  now(),
  60,
  NULL
);
```

---

#### 2. `complete_mentorship_session` 🔴 **CRÍTICO - CÓDIGO QUEBRADO**
**Tempo:** 1.5h  
**Motivo:** Código TypeScript chama esta função mas ela não existe no banco

```sql
CREATE OR REPLACE FUNCTION complete_mentorship_session(
  p_session_id uuid,
  p_session_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentorship_id uuid;
  v_mentor_id uuid;
  v_mentee_id uuid;
BEGIN
  -- Buscar dados da sessão
  SELECT ms.mentorship_id, m.mentor_id, m.mentee_id
  INTO v_mentorship_id, v_mentor_id, v_mentee_id
  FROM mentorship_sessions ms
  JOIN mentorships m ON m.id = ms.mentorship_id
  WHERE ms.id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão de mentoria não encontrada';
  END IF;
  
  -- Atualizar sessão
  UPDATE mentorship_sessions
  SET 
    status = 'completed',
    completed_at = now(),
    notes = p_session_notes
  WHERE id = p_session_id;
  
  -- Atualizar contadores de mentoria
  UPDATE mentorships
  SET 
    sessions_completed = sessions_completed + 1,
    last_session_at = now()
  WHERE id = v_mentorship_id;
  
  -- Trigger de conquistas (já existe)
  -- Será disparado automaticamente
  
  RAISE NOTICE 'Sessão % concluída com sucesso', p_session_id;
END;
$$;
```

---

#### 3. `get_user_dashboard_data` 🔴 **CRÍTICA - PERFORMANCE**
**Tempo:** 4h  
**Motivo:** Dashboards fazem N+1 queries, causando lentidão

```sql
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
  v_pending_validations jsonb;
BEGIN
  -- Dados base (todos os perfis)
  SELECT jsonb_build_object(
    'pdis', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'status', status,
          'deadline', deadline,
          'progress', progress
        )
      )
      FROM pdis
      WHERE profile_id = p_profile_id
      AND status NOT IN ('completed', 'cancelled')
      ORDER BY deadline ASC
      LIMIT 5
    ),
    'competencies', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'self_rating', self_rating,
          'manager_rating', manager_rating,
          'last_updated', updated_at
        )
      )
      FROM competencies
      WHERE profile_id = p_profile_id
      ORDER BY updated_at DESC
      LIMIT 5
    ),
    'unread_notifications', (
      SELECT COUNT(*) FROM notifications
      WHERE profile_id = p_profile_id AND read = false
    ),
    'active_groups', (
      SELECT COUNT(DISTINCT agp.group_id)
      FROM action_group_participants agp
      JOIN action_groups ag ON ag.id = agp.group_id
      WHERE agp.profile_id = p_profile_id
      AND ag.status = 'active'
    ),
    'achievements_unlocked', (
      SELECT COUNT(*) FROM achievements
      WHERE profile_id = p_profile_id
    ),
    'total_points', (
      SELECT COALESCE(points, 0) FROM profiles
      WHERE id = p_profile_id
    )
  ) INTO v_result;
  
  -- Dados de gestor
  IF p_user_role IN ('manager', 'gestor') THEN
    SELECT jsonb_build_object(
      'team_members', (
        SELECT COUNT(*) FROM profiles
        WHERE manager_id = p_profile_id
        AND status = 'active'
      ),
      'pending_pdi_validations', (
        SELECT COUNT(*) FROM pdis
        WHERE manager_id = p_profile_id
        AND status = 'aguardando_validacao_gestor'
      ),
      'team_performance_avg', (
        SELECT COALESCE(AVG(ct.progress), 0)
        FROM career_tracks ct
        JOIN profiles p ON p.id = ct.profile_id
        WHERE p.manager_id = p_profile_id
      )
    ) INTO v_team_data;
    
    v_result := v_result || v_team_data;
  END IF;
  
  -- Dados de RH
  IF p_user_role IN ('hr', 'rh') THEN
    v_result := v_result || jsonb_build_object(
      'total_employees', (SELECT COUNT(*) FROM profiles WHERE status = 'active'),
      'mental_health_alerts', (
        SELECT COUNT(*) FROM mental_health_alerts
        WHERE acknowledged_at IS NULL
      ),
      'pending_vacation_requests', (
        SELECT COUNT(*) FROM calendar_requests
        WHERE event_type = 'ferias'
        AND status = 'pending'
      )
    );
  END IF;
  
  RETURN v_result;
END;
$$;
```

---

#### 4. `get_team_performance` 🔴 **CRÍTICA - GESTORES**
**Tempo:** 3h  
**Motivo:** Gestores precisam de visão consolidada da equipe

```sql
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
    'team_size', (
      SELECT COUNT(*) FROM profiles
      WHERE manager_id = p_manager_id
      AND status = 'active'
    ),
    'avg_career_progress', (
      SELECT COALESCE(AVG(ct.progress), 0)
      FROM career_tracks ct
      JOIN profiles p ON p.id = ct.profile_id
      WHERE p.manager_id = p_manager_id
    ),
    'completed_pdis', (
      SELECT COUNT(*)
      FROM pdis
      WHERE manager_id = p_manager_id
      AND status IN ('completed', 'validated')
      AND updated_at >= v_start_date
    ),
    'pending_validations', (
      SELECT COUNT(*)
      FROM pdis
      WHERE manager_id = p_manager_id
      AND status = 'aguardando_validacao_gestor'
    ),
    'top_performers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', p.name,
          'progress', COALESCE(ct.progress, 0),
          'points', COALESCE(p.points, 0)
        )
      )
      FROM profiles p
      LEFT JOIN career_tracks ct ON ct.profile_id = p.id
      WHERE p.manager_id = p_manager_id
      AND p.status = 'active'
      ORDER BY COALESCE(p.points, 0) DESC
      LIMIT 5
    ),
    'competency_gaps', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'competency_name', c.name,
          'avg_rating', AVG(GREATEST(
            COALESCE(c.self_rating, 0),
            COALESCE(c.manager_rating, 0)
          )),
          'employees_below_3', COUNT(*) FILTER (
            WHERE GREATEST(
              COALESCE(c.self_rating, 0),
              COALESCE(c.manager_rating, 0)
            ) < 3
          )
        )
      )
      FROM competencies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE p.manager_id = p_manager_id
      GROUP BY c.name
      HAVING AVG(GREATEST(
        COALESCE(c.self_rating, 0),
        COALESCE(c.manager_rating, 0)
      )) < 3
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;
```

---

#### 5. `complete_pdi_objetivo` 🔴 **CRÍTICA - LÓGICA DE NEGÓCIO**
**Tempo:** 3h  
**Motivo:** Falta automação de pontos extras e desbloqueio de conquistas

```sql
CREATE OR REPLACE FUNCTION complete_pdi_objetivo(
  p_objetivo_id uuid,
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
  v_objetivo_title text;
  v_competency_name text;
  v_bonus_points integer := 50; -- Pontos extras por conclusão
  v_result jsonb;
BEGIN
  -- Buscar PDI e objetivo
  SELECT * INTO v_pdi_record
  FROM pdis
  WHERE id = p_objetivo_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PDI não encontrado';
  END IF;
  
  -- Validar que usuário pode completar
  IF v_pdi_record.profile_id != p_completed_by THEN
    RAISE EXCEPTION 'Apenas o dono do PDI pode marcá-lo como concluído';
  END IF;
  
  -- Marcar como concluído (aguardando validação do gestor)
  UPDATE pdis
  SET 
    status = 'aguardando_validacao_gestor',
    completed_at = now(),
    completion_notes = p_completion_notes
  WHERE id = p_objetivo_id;
  
  -- Extrair competência relacionada (se houver)
  v_competency_name := v_pdi_record.related_competency;
  
  -- Adicionar pontos extras à competência relacionada
  IF v_competency_name IS NOT NULL THEN
    INSERT INTO competency_bonus_points (
      profile_id,
      competency_name,
      points,
      source,
      source_id,
      created_at
    ) VALUES (
      v_pdi_record.profile_id,
      v_competency_name,
      v_bonus_points,
      'pdi_completion',
      p_objetivo_id,
      now()
    );
  END IF;
  
  -- Notificar gestor
  INSERT INTO notifications (
    profile_id,
    title,
    message,
    type,
    action_url,
    related_id
  ) VALUES (
    v_pdi_record.manager_id,
    'PDI Concluído - Validação Necessária',
    v_pdi_record.profile_name || ' concluiu o PDI: ' || v_pdi_record.title,
    'info',
    '/pdi',
    p_objetivo_id::text
  );
  
  -- Trigger de conquistas será disparado automaticamente
  
  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'objetivo_id', p_objetivo_id,
    'status', 'aguardando_validacao_gestor',
    'bonus_points', v_bonus_points,
    'competency_boosted', v_competency_name
  );
  
  RETURN v_result;
END;
$$;
```

---

### 🟡 IMPORTANTES (Melhoram UX mas têm workaround)

#### 6. `create_action_group` 🟡
**Tempo:** 2h  
**Motivo:** Criar grupo + participantes de forma atômica

```sql
CREATE OR REPLACE FUNCTION create_action_group(
  p_title text,
  p_description text,
  p_created_by uuid,
  p_participant_ids uuid[],
  p_linked_pdi_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_participant_id uuid;
BEGIN
  -- Criar grupo
  INSERT INTO action_groups (
    title,
    description,
    created_by,
    linked_pdi_id,
    status
  ) VALUES (
    p_title,
    p_description,
    p_created_by,
    p_linked_pdi_id,
    'active'
  ) RETURNING id INTO v_group_id;
  
  -- Adicionar criador como líder
  INSERT INTO action_group_participants (
    group_id,
    profile_id,
    role
  ) VALUES (
    v_group_id,
    p_created_by,
    'leader'
  );
  
  -- Adicionar demais participantes
  FOREACH v_participant_id IN ARRAY p_participant_ids
  LOOP
    IF v_participant_id != p_created_by THEN
      INSERT INTO action_group_participants (
        group_id,
        profile_id,
        role
      ) VALUES (
        v_group_id,
        v_participant_id,
        'member'
      );
      
      -- Notificar participante
      INSERT INTO notifications (
        profile_id,
        title,
        message,
        type,
        action_url
      ) VALUES (
        v_participant_id,
        'Você foi adicionado a um Grupo de Ação',
        'Você foi convidado para o grupo: ' || p_title,
        'info',
        '/groups'
      );
    END IF;
  END LOOP;
  
  RETURN v_group_id;
END;
$$;
```

---

#### 7. `mark_notification_read` 🟡
**Tempo:** 30min  
**Motivo:** Validação + auditoria em uma chamada

```sql
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que notificação pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE id = p_notification_id
    AND profile_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Notificação não encontrada ou sem permissão';
  END IF;
  
  -- Marcar como lida
  UPDATE notifications
  SET 
    read = true,
    read_at = now()
  WHERE id = p_notification_id;
  
  RETURN true;
END;
$$;
```

---

#### 8. `get_department_analytics` 🟡
**Tempo:** 3h  
**Motivo:** RH precisa de visão por departamento

```sql
CREATE OR REPLACE FUNCTION get_department_analytics(
  p_department_id uuid,
  p_period text DEFAULT 'month'
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
  v_start_date := CASE p_period
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  SELECT jsonb_build_object(
    'department_id', p_department_id,
    'total_employees', (
      SELECT COUNT(*) FROM profiles
      WHERE department_id = p_department_id
      AND status = 'active'
    ),
    'avg_career_progress', (
      SELECT COALESCE(AVG(ct.progress), 0)
      FROM career_tracks ct
      JOIN profiles p ON p.id = ct.profile_id
      WHERE p.department_id = p_department_id
    ),
    'pdis_completed', (
      SELECT COUNT(*)
      FROM pdis pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE p.department_id = p_department_id
      AND pd.status IN ('completed', 'validated')
      AND pd.updated_at >= v_start_date
    ),
    'competency_distribution', (
      SELECT jsonb_object_agg(
        competency_name,
        jsonb_build_object(
          'avg_rating', avg_rating,
          'employee_count', employee_count
        )
      )
      FROM (
        SELECT 
          c.name as competency_name,
          AVG(GREATEST(
            COALESCE(c.self_rating, 0),
            COALESCE(c.manager_rating, 0)
          )) as avg_rating,
          COUNT(DISTINCT c.profile_id) as employee_count
        FROM competencies c
        JOIN profiles p ON p.id = c.profile_id
        WHERE p.department_id = p_department_id
        GROUP BY c.name
      ) comp_stats
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;
```

---

### 🟢 NICE-TO-HAVE (Otimizações futuras)

#### 9. `calculate_competency_divergence` 🟢
**Tempo:** 1h

```sql
CREATE OR REPLACE FUNCTION calculate_competency_divergence(
  p_profile_id uuid,
  p_competency_name text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_self_rating integer;
  v_manager_rating integer;
  v_divergence numeric;
BEGIN
  SELECT 
    self_rating,
    manager_rating
  INTO v_self_rating, v_manager_rating
  FROM competencies
  WHERE profile_id = p_profile_id
  AND name = p_competency_name;
  
  v_divergence := ABS(COALESCE(v_self_rating, 0) - COALESCE(v_manager_rating, 0));
  
  RETURN jsonb_build_object(
    'competency', p_competency_name,
    'self_rating', v_self_rating,
    'manager_rating', v_manager_rating,
    'divergence', v_divergence,
    'status', CASE
      WHEN v_divergence = 0 THEN 'aligned'
      WHEN v_divergence <= 1 THEN 'minor_difference'
      WHEN v_divergence >= 2 THEN 'major_difference'
    END
  );
END;
$$;
```

---

## 📊 PARTE 5: PRIORIZAÇÃO

### 🔴 CRÍTICAS (Bloqueiam funcionalidade essencial) - **5 functions** - **14h**

1. ✅ **`schedule_mentorship_session`** (2h) - Código TypeScript quebrado
2. ✅ **`complete_mentorship_session`** (1.5h) - Código TypeScript quebrado
3. ✅ **`get_user_dashboard_data`** (4h) - Performance ruim (N+1 queries)
4. ✅ **`get_team_performance`** (3h) - Gestores sem visão de equipe
5. ✅ **`complete_pdi_objetivo`** (3.5h) - Lógica de pontos extras faltando

**Justificativa:** 
- #1 e #2: Código em produção chama funções inexistentes → ERRO
- #3: Dashboards lentos → UX ruim
- #4: Gestores não conseguem gerenciar equipe
- #5: Sistema de gamificação incompleto

---

### 🟡 IMPORTANTES (Melhoram UX mas têm workaround) - **8 functions** - **14h**

6. ✅ **`create_action_group`** (2h) - Atomicidade em criação de grupos
7. ✅ **`mark_notification_read`** (30min) - Validação + auditoria
8. ✅ **`get_department_analytics`** (3h) - RH precisa de métricas
9. ✅ **`validate_pdi_objetivo`** (2h) - Workflow colaborador ↔️ gestor
10. ✅ **`get_user_pdis`** (2h) - Query otimizada com filtros de role
11. ✅ **`accept_mentorship`** (2h) - Aceitar + criar objetivo PDI automaticamente
12. ✅ **`complete_group_task`** (1.5h) - Atualizar progresso + notificar
13. ✅ **`create_pdi_objetivo`** (1h) - Criar com status baseado em role

---

### 🟢 NICE-TO-HAVE (Otimizações/futuro) - **5 functions** - **5.5h**

14. ✅ **`calculate_competency_divergence`** (1h) - Análise auto vs gestor
15. ✅ **`get_competency_evolution`** (1h) - Histórico temporal
16. ✅ **`calculate_user_score`** (1h) - Pontuação total agregada
17. ✅ **`get_unread_count`** (30min) - Helper para badge de notificações
18. ✅ **`get_user_achievements`** (1h) - Query helper para exibição

---

## 📈 RESUMO EXECUTIVO FINAL

### ✅ Functions Existentes: **45 de 63 esperadas (71%)**

**Categorias Completas:**
- ✅ Sistema de Conquistas (100% - robusto e automatizado)
- ✅ Calendário RH (100% - todas as validações implementadas)
- ✅ Saúde Mental Analytics (90% - falta apenas criação de registros)
- ✅ Notificações (80% - falta apenas helper de leitura)

**Categorias Incompletas:**
- ⚠️ Mentoria (0% - **CRÍTICO - CÓDIGO QUEBRADO**)
- ⚠️ PDI (40% - falta workflow de validação)
- ⚠️ Analytics/Dashboards (25% - performance ruim)
- ⚠️ Grupos de Ação (60% - falta atomicidade)

---

### 🚨 BLOQUEADORES CRÍTICOS - **5 functions** - **14h**

**Sprint Atual (Antes da Produção):**

| Prioridade | Function | Tempo | Impacto |
|-----------|----------|-------|---------|
| 🔥 P0 | `schedule_mentorship_session` | 2h | Código em produção quebrado |
| 🔥 P0 | `complete_mentorship_session` | 1.5h | Código em produção quebrado |
| 🔴 P1 | `get_user_dashboard_data` | 4h | Performance ruim nos dashboards |
| 🔴 P1 | `get_team_performance` | 3h | Gestores sem visão de equipe |
| 🔴 P1 | `complete_pdi_objetivo` | 3.5h | Gamificação incompleta |

**Total Bloqueadores:** **14 horas de desenvolvimento**

---

### 🟡 IMPORTANTES PARA SPRINT 2 - **8 functions** - **14h**

Recomendadas mas não bloqueantes para produção inicial:

1. `create_action_group` (2h) - Transações atômicas
2. `get_department_analytics` (3h) - Métricas RH
3. `validate_pdi_objetivo` (2h) - Workflow completo
4. `get_user_pdis` (2h) - Performance otimizada
5. `accept_mentorship` (2h) - Automação de processo
6. `complete_group_task` (1.5h) - Notificações automáticas
7. `create_pdi_objetivo` (1h) - Status inteligente
8. `mark_notification_read` (30min) - Auditoria

---

### 🟢 BACKLOG PÓS-PRODUÇÃO - **5 functions** - **5.5h**

Podem ser implementadas depois do lançamento:

1. `calculate_competency_divergence` (1h) - Analytics avançado
2. `get_competency_evolution` (1h) - Histórico temporal
3. `calculate_user_score` (1h) - Pontuação agregada
4. `get_unread_count` (30min) - Helper UI
5. `get_user_achievements` (1h) - Helper UI

---

## 🎯 RECOMENDAÇÃO FINAL

### ⚡ Ação Imediata (Esta Sprint)

**Implementar as 5 funções CRÍTICAS (14h):**

1. Migrar `schedule_mentorship_session` e `complete_mentorship_session` de discarded_migrations
2. Criar `get_user_dashboard_data` para otimizar dashboards
3. Criar `get_team_performance` para visão de gestores
4. Criar `complete_pdi_objetivo` para gamificação completa

**Risco de NÃO implementar:**
- ❌ Sistema de mentoria completamente quebrado
- ❌ Dashboards lentos (5-10s de carregamento)
- ❌ Gestores sem ferramentas de gestão
- ❌ Gamificação sem sentido (pontos não são atribuídos)

---

### 📅 Roadmap Sugerido

**Sprint Atual (Antes de Produção):**
- [x] Auditoria de RPC Functions (ESTE DOCUMENTO)
- [ ] Implementar 5 functions críticas (14h)
- [ ] Testar integração com código existente (4h)
- [ ] Deploy e validação (2h)

**Sprint 2 (Pós-lançamento imediato):**
- [ ] Implementar 8 functions importantes (14h)
- [ ] Refatorar código para usar novas RPCs (6h)
- [ ] Testes de carga e otimização (4h)

**Sprint 3 (Melhorias):**
- [ ] Implementar 5 functions nice-to-have (5.5h)
- [ ] Analytics avançados
- [ ] Documentação completa de APIs

---

## 📝 PRÓXIMOS PASSOS

### ✅ Tarefa 1: Restaurar Functions de Mentoria
```bash
# Copiar de discarded_migrations para migrations ativas
cp .bolt/supabase_discarded_migrations/20250930150000_create_rpc_functions.sql \
   supabase/migrations/20251022_restore_mentorship_rpcs.sql

# Editar para incluir apenas:
# - schedule_mentorship_session
# - complete_mentorship_session
```

### ✅ Tarefa 2: Criar Migration de Dashboard
```bash
# Criar nova migration
supabase migration new create_dashboard_functions

# Incluir:
# - get_user_dashboard_data
# - get_team_performance
```

### ✅ Tarefa 3: Criar Migration de PDI
```bash
# Criar nova migration
supabase migration new complete_pdi_workflow

# Incluir:
# - complete_pdi_objetivo
# - validate_pdi_objetivo (Sprint 2)
# - create_pdi_objetivo (Sprint 2)
```

### ✅ Tarefa 4: Testar Functions
```bash
# Criar arquivo de testes
supabase/tests/rpc_functions_test.sql

# Executar testes
psql -f supabase/tests/rpc_functions_test.sql
```

---

## 🔗 ARQUIVOS RELACIONADOS

- **Migrations Ativas:** `/workspace/supabase/migrations/`
- **Migrations Descartadas:** `/workspace/.bolt/supabase_discarded_migrations/`
- **Serviços TypeScript:** `/workspace/src/services/`
- **Auditoria do Banco:** `/workspace/DATABASE_AUDIT_REPORT.md`

---

**Relatório gerado em:** 2025-10-22  
**Por:** Agent - Cursor Background Agent  
**Baseado em:** 51 migrations SQL + 22 arquivos de serviço TypeScript
