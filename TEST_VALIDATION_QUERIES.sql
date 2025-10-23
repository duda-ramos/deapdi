-- ══════════════════════════════════════════════════════════════════════════════
-- DEAPDI TALENTFLOW - QUERIES DE VALIDAÇÃO
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Execute estas queries APÓS inserir todos os dados de teste.
-- Cada query valida um aspecto diferente do sistema.
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 1: VERIFICAR USUÁRIOS CRIADOS
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Deve retornar 10 linhas
-- ✅ Deve mostrar hierarquia correta (gestores e colaboradores)

SELECT 
  p.name as "Nome",
  p.email as "Email",
  p.role as "Perfil",
  t.name as "Departamento",
  g.name as "Gestor",
  p.position as "Cargo",
  p.level as "Nível",
  p.points as "Pontos",
  p.status as "Status"
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN profiles g ON p.manager_id = g.id
ORDER BY 
  CASE p.role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
  END,
  p.name;

-- Resultado Esperado:
-- ┌─────────────────────────────┬────────────────────────┬──────────┬──────────┬──────────┬─────────────┬─────────┬────────┬────────┐
-- │ Nome                        │ Email                  │ Perfil   │ Depto    │ Gestor   │ Cargo       │ Nível   │ Pontos │ Status │
-- ├─────────────────────────────┼────────────────────────┼──────────┼──────────┼──────────┼─────────────┼─────────┼────────┼────────┤
-- │ Alexandre Administrador     │ admin.teste@...        │ admin    │ TI       │ NULL     │ Diretor TI  │ Diretor │ 500    │ active │
-- │ Rita Recursos Humanos       │ rh.teste@...           │ hr       │ RH       │ NULL     │ Gerente RH  │ Gerente │ 450    │ active │
-- │ Gabriela Gestora Marketing  │ gestor1.teste@...      │ manager  │ Marketing│ NULL     │ Gerente     │ Gerente │ 400    │ active │
-- │ Gustavo Gestor Vendas       │ gestor2.teste@...      │ manager  │ Vendas   │ NULL     │ Gerente Com.│ Gerente │ 420    │ active │
-- │ Carlos...                   │ colab1.teste@...       │ employee │ Marketing│ Gabriela │ Analista Jr │ Júnior  │ 150    │ active │
-- │ ...                         │ ...                    │ ...      │ ...      │ ...      │ ...         │ ...     │ ...    │ ...    │
-- └─────────────────────────────┴────────────────────────┴──────────┴──────────┴──────────┴─────────────┴─────────┴────────┴────────┘


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 2: VALIDAR PDIs POR COLABORADOR
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Deve retornar 6 colaboradores
-- ✅ Cada um deve ter 2-3 PDIs
-- ✅ Mix de status (em andamento, concluído, validado)

SELECT 
  p.name as "Colaborador",
  p.position as "Cargo",
  COUNT(DISTINCT pdi.id) as "Total PDIs",
  SUM(CASE WHEN pdi.status = 'pending' THEN 1 ELSE 0 END) as "Pendentes",
  SUM(CASE WHEN pdi.status = 'in-progress' THEN 1 ELSE 0 END) as "Em Andamento",
  SUM(CASE WHEN pdi.status = 'completed' THEN 1 ELSE 0 END) as "Concluídos",
  SUM(CASE WHEN pdi.status = 'validated' THEN 1 ELSE 0 END) as "Validados",
  SUM(pdi.points) as "Pontos PDIs"
FROM profiles p
LEFT JOIN pdis pdi ON pdi.profile_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name, p.position
ORDER BY p.name;

-- Resultado Esperado:
-- ┌────────────────────────┬──────────────┬────────────┬───────────┬──────────────┬────────────┬───────────┬─────────────┐
-- │ Colaborador            │ Cargo        │ Total PDIs │ Pendentes │ Em Andamento │ Concluídos │ Validados │ Pontos PDIs │
-- ├────────────────────────┼──────────────┼────────────┼───────────┼──────────────┼────────────┼───────────┼─────────────┤
-- │ Ana Colaboradora...    │ SDR Jr       │ 2          │ 0         │ 1            │ 0          │ 1         │ 200         │
-- │ Bruno Colaborador...   │ AE Pleno     │ 2          │ 0         │ 1            │ 0          │ 1         │ 200         │
-- │ Carlos Colaborador...  │ Analista Jr  │ 2          │ 0         │ 1            │ 0          │ 1         │ 200         │
-- │ ...                    │ ...          │ ...        │ ...       │ ...          │ ...        │ ...       │ ...         │
-- └────────────────────────┴──────────────┴────────────┴───────────┴──────────────┴────────────┴───────────┴─────────────┘


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 3: VALIDAR TAREFAS POR PDI
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Cada PDI deve ter 2-4 tarefas
-- ✅ Tarefas devem ter status variados

SELECT 
  p.name as "Colaborador",
  pdi.title as "PDI",
  pdi.status as "Status PDI",
  COUNT(t.id) as "Total Tarefas",
  SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as "A Fazer",
  SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as "Em Progresso",
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as "Concluídas",
  ROUND(
    (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)::numeric / 
     NULLIF(COUNT(t.id), 0) * 100), 1
  ) as "% Conclusão"
FROM profiles p
JOIN pdis pdi ON pdi.profile_id = p.id
LEFT JOIN tasks t ON t.pdi_id = pdi.id
WHERE p.role = 'employee'
GROUP BY p.name, pdi.id, pdi.title, pdi.status
ORDER BY p.name, pdi.title;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 4: VALIDAR COMPETÊNCIAS POR COLABORADOR
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Cada colaborador deve ter 3-5 competências
-- ✅ Deve haver avaliação própria e do gestor
-- ✅ Divergências indicam oportunidades de feedback

SELECT 
  p.name as "Colaborador",
  p.level as "Nível",
  COUNT(*) as "Total Competências",
  SUM(CASE WHEN c.type = 'hard' THEN 1 ELSE 0 END) as "Hard Skills",
  SUM(CASE WHEN c.type = 'soft' THEN 1 ELSE 0 END) as "Soft Skills",
  ROUND(AVG(c.self_rating::numeric), 2) as "Média Auto",
  ROUND(AVG(c.manager_rating::numeric), 2) as "Média Gestor",
  ROUND(AVG((c.manager_rating - c.self_rating)::numeric), 2) as "Divergência",
  ROUND(AVG(c.target_level::numeric), 1) as "Nível Alvo",
  CASE 
    WHEN AVG((c.manager_rating - c.self_rating)::numeric) > 0.5 THEN '✅ Subestima-se'
    WHEN AVG((c.manager_rating - c.self_rating)::numeric) < -0.5 THEN '⚠️ Superestima-se'
    ELSE '🟢 Alinhado'
  END as "Percepção"
FROM profiles p
LEFT JOIN competencies c ON c.profile_id = p.id
WHERE p.role = 'employee'
  AND c.self_rating IS NOT NULL 
  AND c.manager_rating IS NOT NULL
GROUP BY p.id, p.name, p.level
ORDER BY p.name;

-- Resultado Esperado:
-- Divergência positiva = gestor avalia melhor (colaborador se subestima)
-- Divergência negativa = colaborador se avalia melhor (pode precisar feedback)


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 5: VALIDAR GRUPOS DE AÇÃO
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Deve retornar 2 grupos
-- ✅ Grupo 1: Campanha Black Friday (Marketing - 5 tarefas)
-- ✅ Grupo 2: Treinamento CRM (Vendas - 4 tarefas)

SELECT 
  ag.title as "Grupo de Ação",
  p.name as "Criador",
  t.name as "Departamento",
  ag.deadline as "Prazo",
  ag.status as "Status",
  COUNT(DISTINCT agp.profile_id) as "Participantes",
  COUNT(DISTINCT tk.id) as "Total Tarefas",
  SUM(CASE WHEN tk.status = 'done' THEN 1 ELSE 0 END) as "Concluídas",
  SUM(CASE WHEN tk.status = 'in-progress' THEN 1 ELSE 0 END) as "Em Progresso",
  SUM(CASE WHEN tk.status = 'todo' THEN 1 ELSE 0 END) as "Pendentes",
  ROUND(
    (SUM(CASE WHEN tk.status = 'done' THEN 1 ELSE 0 END)::numeric / 
     NULLIF(COUNT(tk.id), 0) * 100), 1
  ) as "% Conclusão",
  CASE 
    WHEN ag.deadline < CURRENT_DATE THEN '🔴 Atrasado'
    WHEN ag.deadline < CURRENT_DATE + INTERVAL '7 days' THEN '🟡 Urgente'
    ELSE '🟢 No Prazo'
  END as "Situação"
FROM action_groups ag
JOIN profiles p ON ag.created_by = p.id
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN action_group_participants agp ON agp.group_id = ag.id
LEFT JOIN tasks tk ON tk.group_id = ag.id
GROUP BY ag.id, ag.title, ag.deadline, ag.status, p.name, t.name
ORDER BY ag.deadline;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 6: DETALHES DOS PARTICIPANTES DOS GRUPOS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  ag.title as "Grupo",
  p.name as "Participante",
  agp.role as "Papel",
  COUNT(DISTINCT t.id) as "Tarefas Atribuídas",
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as "Concluídas"
FROM action_groups ag
JOIN action_group_participants agp ON agp.group_id = ag.id
JOIN profiles p ON agp.profile_id = p.id
LEFT JOIN tasks t ON t.group_id = ag.id AND t.assignee_id = p.id
GROUP BY ag.title, p.name, agp.role
ORDER BY ag.title, agp.role DESC, p.name;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 7: VALIDAR MENTORIAS
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Deve retornar 4-6 solicitações
-- ✅ Pelo menos 2 aceitas (com mentorships criadas)
-- ✅ Pelo menos 2 pendentes

SELECT 
  mentor.name as "Mentor",
  mentor.position as "Cargo Mentor",
  mentee.name as "Mentorado",
  mentee.position as "Cargo Mentorado",
  mr.message as "Mensagem",
  mr.status as "Status Solicitação",
  m.status as "Status Mentoria",
  COUNT(ms.id) as "Sessões Realizadas",
  m.started_at as "Início Mentoria",
  CASE 
    WHEN mr.status = 'accepted' AND COUNT(ms.id) = 0 THEN '⚠️ Sem sessões ainda'
    WHEN mr.status = 'accepted' AND COUNT(ms.id) >= 2 THEN '✅ Ativa e produtiva'
    WHEN mr.status = 'accepted' AND COUNT(ms.id) = 1 THEN '🟡 1 sessão realizada'
    WHEN mr.status = 'pending' THEN '⏳ Aguardando aceite'
    ELSE '❓ Verificar'
  END as "Situação"
FROM mentorship_requests mr
JOIN profiles mentor ON mr.mentor_id = mentor.id
JOIN profiles mentee ON mr.mentee_id = mentee.id
LEFT JOIN mentorships m ON m.mentor_id = mr.mentor_id AND m.mentee_id = mr.mentee_id
LEFT JOIN mentorship_sessions ms ON ms.mentorship_id = m.id
GROUP BY 
  mentor.name, mentor.position, 
  mentee.name, mentee.position, 
  mr.message, mr.status, 
  m.status, m.started_at
ORDER BY mr.status, mentor.name;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 8: DETALHES DAS SESSÕES DE MENTORIA
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  mentor.name as "Mentor",
  mentee.name as "Mentorado",
  ms.session_date as "Data Sessão",
  ms.duration_minutes as "Duração (min)",
  ms.topics_discussed as "Tópicos Discutidos",
  ms.action_items as "Ações Combinadas",
  CASE 
    WHEN ms.mentor_feedback IS NOT NULL THEN '✅'
    ELSE '⏳'
  END as "Feedback Mentor",
  CASE 
    WHEN ms.mentee_feedback IS NOT NULL THEN '✅'
    ELSE '⏳'
  END as "Feedback Mentorado"
FROM mentorship_sessions ms
JOIN mentorships m ON ms.mentorship_id = m.id
JOIN profiles mentor ON m.mentor_id = mentor.id
JOIN profiles mentee ON m.mentee_id = mentee.id
ORDER BY ms.session_date DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 9: VALIDAR CHECK-INS DE SAÚDE MENTAL
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Cada colaborador deve ter 1-2 check-ins
-- ✅ Deve haver variação de scores (identificar alertas)

SELECT 
  p.name as "Colaborador",
  p.position as "Cargo",
  COUNT(ec.id) as "Check-ins",
  ROUND(AVG(ec.mood_rating::numeric), 1) as "Humor Médio",
  ROUND(AVG(ec.stress_level::numeric), 1) as "Estresse Médio",
  ROUND(AVG(ec.energy_level::numeric), 1) as "Energia Média",
  ROUND(AVG(ec.sleep_quality::numeric), 1) as "Sono Médio",
  MAX(ec.checkin_date) as "Último Check-in",
  MIN(ec.mood_rating) as "Pior Humor",
  MAX(ec.stress_level) as "Maior Estresse",
  CASE 
    WHEN AVG(ec.stress_level) >= 7 THEN '🔴 ALERTA - Estresse Alto'
    WHEN AVG(ec.stress_level) >= 5 THEN '🟡 Atenção - Estresse Moderado'
    WHEN AVG(ec.mood_rating) >= 8 THEN '🟢 Excelente'
    ELSE '🟢 Saudável'
  END as "Status Saúde Mental"
FROM profiles p
LEFT JOIN emotional_checkins ec ON ec.employee_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name, p.position
ORDER BY AVG(ec.stress_level) DESC NULLS LAST;

-- Resultado Esperado:
-- Ana deve aparecer com alerta (estresse 7/10)
-- Juliana e Marina devem estar "Excelente"


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 10: HISTÓRICO DETALHADO DE CHECK-INS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  p.name as "Colaborador",
  ec.checkin_date as "Data",
  ec.mood_rating as "😊 Humor",
  ec.stress_level as "😰 Estresse",
  ec.energy_level as "⚡ Energia",
  ec.sleep_quality as "😴 Sono",
  ec.notes as "Observações",
  CASE 
    WHEN ec.stress_level >= 7 OR ec.mood_rating <= 4 THEN '🔴 ALERTA'
    WHEN ec.stress_level >= 5 OR ec.mood_rating <= 6 THEN '🟡 Atenção'
    ELSE '🟢 OK'
  END as "Flag"
FROM emotional_checkins ec
JOIN profiles p ON ec.employee_id = p.id
ORDER BY ec.checkin_date DESC, p.name;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 11: VALIDAR NOTIFICAÇÕES
-- ══════════════════════════════════════════════════════════════════════════════
-- ✅ Todos os usuários devem ter notificações
-- ✅ Deve haver mix de lidas e não lidas
-- ✅ Gestores devem ter notificações de validação pendente

SELECT 
  p.name as "Usuário",
  p.role as "Perfil",
  COUNT(*) as "Total",
  SUM(CASE WHEN n.read = true THEN 1 ELSE 0 END) as "Lidas",
  SUM(CASE WHEN n.read = false THEN 1 ELSE 0 END) as "Não Lidas",
  SUM(CASE WHEN n.type = 'success' THEN 1 ELSE 0 END) as "🟢 Sucesso",
  SUM(CASE WHEN n.type = 'info' THEN 1 ELSE 0 END) as "🔵 Info",
  SUM(CASE WHEN n.type = 'warning' THEN 1 ELSE 0 END) as "🟡 Avisos",
  SUM(CASE WHEN n.type = 'error' THEN 1 ELSE 0 END) as "🔴 Erros",
  MAX(n.created_at) as "Última Notificação"
FROM profiles p
LEFT JOIN notifications n ON n.profile_id = p.id
GROUP BY p.id, p.name, p.role
HAVING COUNT(*) > 0
ORDER BY SUM(CASE WHEN n.read = false THEN 1 ELSE 0 END) DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 12: DETALHES DAS NOTIFICAÇÕES NÃO LIDAS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  p.name as "Usuário",
  n.title as "Título",
  n.message as "Mensagem",
  n.type as "Tipo",
  n.created_at as "Criada Em",
  n.action_url as "Link Ação",
  CASE 
    WHEN n.created_at > NOW() - INTERVAL '1 day' THEN '🆕 Nova'
    WHEN n.created_at > NOW() - INTERVAL '3 days' THEN '📅 Recente'
    ELSE '⏰ Antiga'
  END as "Idade"
FROM notifications n
JOIN profiles p ON n.profile_id = p.id
WHERE n.read = false
ORDER BY n.created_at DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 13: RESUMO EXECUTIVO - VISÃO GERAL DO SISTEMA
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  '👥 Total de Usuários' as "Métrica",
  COUNT(*)::text as "Valor",
  '10 usuários (1 admin, 1 hr, 2 gestores, 6 colaboradores)' as "Esperado"
FROM profiles
UNION ALL
SELECT 
  '📋 Total de PDIs',
  COUNT(*)::text,
  '12-18 PDIs'
FROM pdis
UNION ALL
SELECT 
  '✅ PDIs Validados',
  COUNT(*)::text,
  '6 validados (1 por colaborador)'
FROM pdis
WHERE status = 'validated'
UNION ALL
SELECT 
  '🎯 Competências Avaliadas',
  COUNT(*)::text,
  '18-30 competências'
FROM competencies
WHERE manager_rating IS NOT NULL
UNION ALL
SELECT 
  '👥 Grupos de Ação Ativos',
  COUNT(*)::text,
  '2 grupos'
FROM action_groups
WHERE status = 'active'
UNION ALL
SELECT 
  '📝 Tarefas em Grupos',
  COUNT(*)::text,
  '9 tarefas (5 Black Friday + 4 CRM)'
FROM tasks
WHERE group_id IS NOT NULL
UNION ALL
SELECT 
  '🤝 Mentorias Ativas',
  COUNT(*)::text,
  '2 mentorias'
FROM mentorships
WHERE status = 'active'
UNION ALL
SELECT 
  '🎓 Sessões de Mentoria',
  COUNT(*)::text,
  '3 sessões (2 Pedro-Carlos + 1 Juliana-Bruno)'
FROM mentorship_sessions
UNION ALL
SELECT 
  '💚 Check-ins (Última Semana)',
  COUNT(*)::text,
  '6 check-ins'
FROM emotional_checkins
WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  '🔴 Alertas de Saúde Mental',
  COUNT(*)::text,
  '1 alerta (Ana com estresse alto)'
FROM emotional_checkins
WHERE stress_level >= 7
  AND checkin_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  '🔔 Notificações Não Lidas',
  COUNT(*)::text,
  '10-15 notificações'
FROM notifications
WHERE read = false
UNION ALL
SELECT 
  '📊 Taxa de Engajamento PDI',
  ROUND(
    (COUNT(CASE WHEN status IN ('in-progress', 'completed', 'validated') THEN 1 END)::numeric / 
     NULLIF(COUNT(*), 0) * 100), 1
  )::text || '%',
  '> 80%'
FROM pdis;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 14: RANKING DE COLABORADORES POR PONTOS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  ROW_NUMBER() OVER (ORDER BY p.points DESC) as "🏆 Posição",
  p.name as "Colaborador",
  p.level as "Nível",
  p.position as "Cargo",
  p.points as "Pontos",
  COUNT(DISTINCT pdi.id) as "PDIs",
  COUNT(DISTINCT c.id) as "Competências",
  COUNT(DISTINCT m_mentor.id) as "Mentorados",
  CASE 
    WHEN p.points >= 350 THEN '🥇 Top Performer'
    WHEN p.points >= 250 THEN '🥈 Alto Desempenho'
    WHEN p.points >= 150 THEN '🥉 Bom Desempenho'
    ELSE '⭐ Em Desenvolvimento'
  END as "Categoria"
FROM profiles p
LEFT JOIN pdis pdi ON pdi.profile_id = p.id
LEFT JOIN competencies c ON c.profile_id = p.id
LEFT JOIN mentorships m_mentor ON m_mentor.mentor_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.name, p.level, p.position, p.points
ORDER BY p.points DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 15: DASHBOARD DO GESTOR (GABRIELA - MARKETING)
-- ══════════════════════════════════════════════════════════════════════════════
-- Esta query mostra o que Gabriela vê ao fazer login

SELECT 
  '📊 Dashboard - Gabriela Gestora Marketing' as "Seção",
  '' as "Métrica",
  '' as "Valor";

-- Equipe
SELECT 
  '👥 EQUIPE' as "Seção",
  p.name as "Métrica",
  p.position || ' - ' || p.points || ' pts' as "Valor"
FROM profiles p
WHERE p.manager_id = (
  SELECT id FROM profiles WHERE email = 'gestor1.teste@deapdi-test.local'
)
ORDER BY p.points DESC;

-- PDIs aguardando validação
SELECT 
  '⏳ PDIS PARA VALIDAR' as "Seção",
  p.name || ': ' || pdi.title as "Métrica",
  'Prazo: ' || pdi.deadline::text as "Valor"
FROM pdis pdi
JOIN profiles p ON pdi.profile_id = p.id
WHERE p.manager_id = (
  SELECT id FROM profiles WHERE email = 'gestor1.teste@deapdi-test.local'
)
  AND pdi.status IN ('pending', 'completed')
ORDER BY pdi.deadline;

-- Competências para avaliar
SELECT 
  '🎯 COMPETÊNCIAS SEM AVALIAÇÃO' as "Seção",
  p.name || ': ' || c.name as "Métrica",
  'Auto: ' || c.self_rating || '/5' as "Valor"
FROM competencies c
JOIN profiles p ON c.profile_id = p.id
WHERE p.manager_id = (
  SELECT id FROM profiles WHERE email = 'gestor1.teste@deapdi-test.local'
)
  AND c.manager_rating IS NULL;

-- Grupos de ação
SELECT 
  '👥 GRUPOS DE AÇÃO' as "Seção",
  ag.title as "Métrica",
  COUNT(DISTINCT t.id)::text || ' tarefas, ' || 
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)::text || ' concluídas' as "Valor"
FROM action_groups ag
LEFT JOIN tasks t ON t.group_id = ag.id
WHERE ag.created_by = (
  SELECT id FROM profiles WHERE email = 'gestor1.teste@deapdi-test.local'
)
GROUP BY ag.id, ag.title;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 16: DASHBOARD DO RH (RITA)
-- ══════════════════════════════════════════════════════════════════════════════

SELECT 
  '💚 SAÚDE MENTAL - RESUMO' as "Categoria",
  'Colaboradores com Check-ins Recentes' as "Métrica",
  COUNT(DISTINCT ec.employee_id)::text || ' de 6' as "Valor"
FROM emotional_checkins ec
WHERE ec.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  '💚 SAÚDE MENTAL - RESUMO',
  'Média de Humor Geral',
  ROUND(AVG(ec.mood_rating::numeric), 1)::text || '/10'
FROM emotional_checkins ec
WHERE ec.checkin_date >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
  '💚 SAÚDE MENTAL - RESUMO',
  'Média de Estresse Geral',
  ROUND(AVG(ec.stress_level::numeric), 1)::text || '/10'
FROM emotional_checkins ec
WHERE ec.checkin_date >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
  '🔴 ALERTAS',
  'Colaboradores com Estresse Alto (≥7)',
  COUNT(DISTINCT ec.employee_id)::text
FROM emotional_checkins ec
WHERE ec.stress_level >= 7
  AND ec.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  '🔴 ALERTAS',
  'Colaboradores com Humor Baixo (≤4)',
  COUNT(DISTINCT ec.employee_id)::text
FROM emotional_checkins ec
WHERE ec.mood_rating <= 4
  AND ec.checkin_date >= CURRENT_DATE - INTERVAL '7 days';

-- Colaboradores que precisam de atenção
SELECT 
  '⚠️ ATENÇÃO NECESSÁRIA' as "Categoria",
  p.name as "Métrica",
  'Estresse: ' || ROUND(AVG(ec.stress_level), 1)::text || 
  ' | Humor: ' || ROUND(AVG(ec.mood_rating), 1)::text as "Valor"
FROM emotional_checkins ec
JOIN profiles p ON ec.employee_id = p.id
WHERE ec.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.name
HAVING AVG(ec.stress_level) >= 6 OR AVG(ec.mood_rating) <= 5
ORDER BY AVG(ec.stress_level) DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 17: VERIFICAÇÃO DE INTEGRIDADE DE DADOS
-- ══════════════════════════════════════════════════════════════════════════════
-- Esta query identifica possíveis problemas nos dados

-- Usuários sem profile completo
SELECT 
  '⚠️ INTEGRIDADE' as "Tipo Erro",
  'Usuários sem departamento' as "Descrição",
  COUNT(*)::text as "Quantidade"
FROM profiles
WHERE team_id IS NULL
  AND role IN ('manager', 'employee')
UNION ALL
-- Colaboradores sem gestor
SELECT 
  '⚠️ INTEGRIDADE',
  'Colaboradores sem gestor',
  COUNT(*)::text
FROM profiles
WHERE manager_id IS NULL
  AND role = 'employee'
UNION ALL
-- PDIs sem tarefas
SELECT 
  '⚠️ INTEGRIDADE',
  'PDIs sem tarefas',
  COUNT(DISTINCT pdi.id)::text
FROM pdis pdi
LEFT JOIN tasks t ON t.pdi_id = pdi.id
WHERE t.id IS NULL
UNION ALL
-- Competências sem avaliação do gestor
SELECT 
  '⚠️ INTEGRIDADE',
  'Competências sem avaliação do gestor',
  COUNT(*)::text
FROM competencies
WHERE manager_rating IS NULL
  AND profile_id IN (SELECT id FROM profiles WHERE role = 'employee')
UNION ALL
-- Mentorias aceitas sem sessões
SELECT 
  '⚠️ INTEGRIDADE',
  'Mentorias ativas sem sessões',
  COUNT(DISTINCT m.id)::text
FROM mentorships m
LEFT JOIN mentorship_sessions ms ON ms.mentorship_id = m.id
WHERE m.status = 'active'
  AND ms.id IS NULL
UNION ALL
-- Grupos sem participantes
SELECT 
  '⚠️ INTEGRIDADE',
  'Grupos sem participantes',
  COUNT(DISTINCT ag.id)::text
FROM action_groups ag
LEFT JOIN action_group_participants agp ON agp.group_id = ag.id
WHERE agp.id IS NULL;


-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY 18: TESTES DE RLS (ROW LEVEL SECURITY)
-- ══════════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: Executar estas queries logado como usuários diferentes

-- Como CARLOS (colaborador), deve ver:
-- ✅ Apenas seus próprios PDIs
-- ✅ Apenas suas próprias competências
-- ✅ Apenas check-ins próprios
-- ❌ NÃO deve ver PDIs de outros colaboradores
-- ❌ NÃO deve ver dados psicológicos de outros

-- Como GABRIELA (gestora), deve ver:
-- ✅ Todos os PDIs da sua equipe (Carlos, Marina, Pedro)
-- ✅ Todas as competências da sua equipe
-- ❌ NÃO deve ver PDIs da equipe de Vendas
-- ❌ NÃO deve ver dados psicológicos confidenciais

-- Como RITA (RH), deve ver:
-- ✅ TODOS os PDIs de todos os colaboradores
-- ✅ TODOS os check-ins emocionais
-- ✅ Registros psicológicos confidenciais


-- ══════════════════════════════════════════════════════════════════════════════
-- CONCLUSÃO
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Após executar todas estas queries:
--
-- ✅ Se todos os resultados conferem, os dados estão corretos
-- ✅ Se alguma query retorna 0 linhas onde deveria ter dados, revisar script
-- ✅ Se há avisos de integridade (Query 17), corrigir antes de continuar
--
-- Próximo passo: Testar login e navegação manual com cada persona
--
-- ══════════════════════════════════════════════════════════════════════════════
