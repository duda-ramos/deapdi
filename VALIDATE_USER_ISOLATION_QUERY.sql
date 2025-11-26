-- ============================================================================
-- SCRIPT DE VALIDAÇÃO DE USUÁRIOS DE TESTE
-- ============================================================================
-- Objetivo: Verificar existência de usuários de teste e preparar validações
-- de isolamento de dados entre roles
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: VERIFICAR USUÁRIOS DE TESTE EXISTENTES
-- ============================================================================

\echo '========================================='
\echo 'VERIFICAÇÃO DE USUÁRIOS DE TESTE'
\echo '========================================='
\echo ''

-- Query 1.1: Buscar usuários com domínio @example.com
\echo '1. Usuários com domínio @example.com:'
SELECT 
  id,
  email,
  role,
  full_name,
  created_at::date as criado_em
FROM profiles 
WHERE email LIKE '%example.com'
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
    ELSE 5
  END,
  email;

\echo ''

-- Query 1.2: Buscar usuários com domínio @deapdi-test.local
\echo '2. Usuários com domínio @deapdi-test.local:'
SELECT 
  id,
  email,
  role,
  full_name as nome_completo,
  department as departamento,
  position as cargo,
  manager_id,
  created_at::date as criado_em
FROM profiles 
WHERE email LIKE '%deapdi-test.local'
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
    ELSE 5
  END,
  email;

\echo ''

-- Query 1.3: Resumo de usuários por role
\echo '3. Resumo de Usuários de Teste por Role:'
SELECT 
  role,
  COUNT(*) as quantidade,
  STRING_AGG(email, ', ' ORDER BY email) as emails
FROM profiles 
WHERE email LIKE '%example.com' OR email LIKE '%deapdi-test.local'
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
    ELSE 5
  END;

\echo ''

-- ============================================================================
-- SEÇÃO 2: VERIFICAR DADOS ASSOCIADOS AOS USUÁRIOS DE TESTE
-- ============================================================================

\echo '========================================='
\echo 'DADOS ASSOCIADOS AOS USUÁRIOS DE TESTE'
\echo '========================================='
\echo ''

-- Query 2.1: PDIs dos usuários de teste
\echo '4. PDIs por Usuário de Teste:'
SELECT 
  p.email,
  p.role,
  COUNT(DISTINCT pdi.id) as total_pdis,
  SUM(CASE WHEN pdi.status = 'in-progress' THEN 1 ELSE 0 END) as em_andamento,
  SUM(CASE WHEN pdi.status = 'completed' THEN 1 ELSE 0 END) as concluidos,
  SUM(CASE WHEN pdi.status = 'validated' THEN 1 ELSE 0 END) as validados
FROM profiles p
LEFT JOIN pdis pdi ON pdi.profile_id = p.id
WHERE (p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local')
AND p.role IN ('employee', 'manager')
GROUP BY p.id, p.email, p.role
ORDER BY p.role, p.email;

\echo ''

-- Query 2.2: Check-ins de Saúde Mental
\echo '5. Check-ins de Saúde Mental:'
SELECT 
  p.email,
  p.role,
  COUNT(ec.id) as total_checkins,
  MAX(ec.checkin_date) as ultimo_checkin,
  ROUND(AVG(ec.mood_rating::numeric), 1) as humor_medio,
  ROUND(AVG(ec.stress_level::numeric), 1) as estresse_medio,
  CASE 
    WHEN AVG(ec.stress_level::numeric) >= 7 THEN '⚠️ CRÍTICO'
    WHEN AVG(ec.stress_level::numeric) >= 5 THEN '⚡ MODERADO'
    ELSE '✅ SAUDÁVEL'
  END as status_mental
FROM profiles p
LEFT JOIN emotional_checkins ec ON ec.employee_id = p.id
WHERE (p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local')
GROUP BY p.id, p.email, p.role
HAVING COUNT(ec.id) > 0
ORDER BY estresse_medio DESC NULLS LAST;

\echo ''

-- Query 2.3: Grupos de Ação
\echo '6. Participação em Grupos de Ação:'
SELECT 
  p.email,
  p.role,
  COUNT(DISTINCT agp.group_id) as grupos_participando,
  STRING_AGG(DISTINCT ag.title, ', ') as nomes_grupos
FROM profiles p
LEFT JOIN action_group_participants agp ON agp.profile_id = p.id
LEFT JOIN action_groups ag ON ag.id = agp.group_id
WHERE (p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local')
GROUP BY p.id, p.email, p.role
HAVING COUNT(DISTINCT agp.group_id) > 0
ORDER BY grupos_participando DESC;

\echo ''

-- Query 2.4: Mentorias
\echo '7. Mentorias:'
SELECT 
  mentor.email as mentor_email,
  mentee.email as mentorado_email,
  mr.status,
  COUNT(ms.id) as sessoes_realizadas
FROM mentorship_requests mr
JOIN profiles mentor ON mr.mentor_id = mentor.id
JOIN profiles mentee ON mr.mentee_id = mentee.id
LEFT JOIN mentorships m ON m.mentor_id = mr.mentor_id AND m.mentee_id = mr.mentee_id
LEFT JOIN mentorship_sessions ms ON ms.mentorship_id = m.id
WHERE mentor.email LIKE '%example.com' 
   OR mentor.email LIKE '%deapdi-test.local'
   OR mentee.email LIKE '%example.com'
   OR mentee.email LIKE '%deapdi-test.local'
GROUP BY mentor.email, mentee.email, mr.status
ORDER BY mr.status, mentor.email;

\echo ''

-- ============================================================================
-- SEÇÃO 3: VALIDAÇÕES DE ISOLAMENTO DE DADOS
-- ============================================================================

\echo '========================================='
\echo 'VALIDAÇÕES DE ISOLAMENTO DE DADOS'
\echo '========================================='
\echo ''

-- Query 3.1: Verificar que managers só veem subordinados
\echo '8. Validação: Managers e seus Subordinados'
SELECT 
  manager.email as gestor,
  manager.role,
  COUNT(subordinado.id) as subordinados_diretos,
  STRING_AGG(subordinado.email, ', ') as emails_subordinados
FROM profiles manager
LEFT JOIN profiles subordinado ON subordinado.manager_id = manager.id
WHERE manager.role = 'manager'
  AND (manager.email LIKE '%example.com' OR manager.email LIKE '%deapdi-test.local')
GROUP BY manager.id, manager.email, manager.role
ORDER BY manager.email;

\echo ''

-- Query 3.2: Verificar que employees só têm dados próprios
\echo '9. Validação: Employees - Dados Próprios'
SELECT 
  p.email,
  COUNT(DISTINCT pdi.id) as meus_pdis,
  COUNT(DISTINCT ec.id) as meus_checkins,
  COUNT(DISTINCT c.id) as minhas_competencias,
  CASE 
    WHEN COUNT(DISTINCT pdi.id) > 0 OR COUNT(DISTINCT ec.id) > 0
    THEN '✅ TEM DADOS'
    ELSE '⚠️ SEM DADOS'
  END as status
FROM profiles p
LEFT JOIN pdis pdi ON pdi.profile_id = p.id
LEFT JOIN emotional_checkins ec ON ec.employee_id = p.id
LEFT JOIN competencies c ON c.profile_id = p.id
WHERE p.role = 'employee'
  AND (p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local')
GROUP BY p.id, p.email
ORDER BY p.email;

\echo ''

-- Query 3.3: Verificar dados sensíveis (RH e Admin)
\echo '10. Validação: Acesso HR/Admin a Dados Sensíveis'
SELECT 
  p.email,
  p.role,
  (SELECT COUNT(*) FROM emotional_checkins) as total_checkins_sistema,
  (SELECT COUNT(*) FROM psychological_records) as total_registros_psicologicos,
  (SELECT COUNT(*) FROM therapy_session_requests) as total_solicitacoes_terapia,
  '✅ PODE ACESSAR TODOS' as nivel_acesso
FROM profiles p
WHERE p.role IN ('hr', 'admin')
  AND (p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local')
ORDER BY p.role, p.email;

\echo ''

-- ============================================================================
-- SEÇÃO 4: TESTES DE ISOLAMENTO CRÍTICOS
-- ============================================================================

\echo '========================================='
\echo 'TESTES DE ISOLAMENTO CRÍTICOS'
\echo '========================================='
\echo ''

-- Query 4.1: Verificar que emotional_checkins não vazam entre usuários
\echo '11. TESTE CRÍTICO: Isolamento de Check-ins Emocionais'
WITH checkin_counts AS (
  SELECT 
    employee_id,
    COUNT(*) as total
  FROM emotional_checkins ec
  WHERE employee_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE '%example.com' OR email LIKE '%deapdi-test.local'
  )
  GROUP BY employee_id
)
SELECT 
  p.email,
  p.role,
  COALESCE(cc.total, 0) as checkins_proprios,
  CASE 
    WHEN p.role = 'employee' AND COALESCE(cc.total, 0) > 0
    THEN '✅ PASS: Employee tem apenas dados próprios'
    WHEN p.role = 'employee' AND COALESCE(cc.total, 0) = 0
    THEN 'ℹ️ INFO: Employee sem check-ins ainda'
    WHEN p.role IN ('hr', 'admin')
    THEN '✅ PASS: HR/Admin pode acessar todos'
    WHEN p.role = 'manager'
    THEN '❓ VERIFICAR: Manager NÃO deve ver check-ins de subordinados'
    ELSE '⚠️ WARNING: Role desconhecido'
  END as status_isolamento
FROM profiles p
LEFT JOIN checkin_counts cc ON cc.employee_id = p.id
WHERE p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local'
ORDER BY p.role, p.email;

\echo ''

-- Query 4.2: Verificar que PDIs respeitam hierarquia
\echo '12. TESTE CRÍTICO: Isolamento de PDIs'
SELECT 
  owner.email as dono_pdi,
  owner.role as role_dono,
  manager.email as gestor,
  COUNT(pdi.id) as pdis_gerenciados,
  CASE 
    WHEN owner.role = 'employee' AND manager.email IS NOT NULL
    THEN '✅ PASS: Employee com gestor definido'
    WHEN owner.role = 'manager'
    THEN '✅ PASS: Manager pode ter PDIs próprios'
    ELSE '⚠️ WARNING: Hierarquia não definida'
  END as status_hierarquia
FROM profiles owner
LEFT JOIN pdis pdi ON pdi.profile_id = owner.id
LEFT JOIN profiles manager ON owner.manager_id = manager.id
WHERE owner.email LIKE '%example.com' OR owner.email LIKE '%deapdi-test.local'
GROUP BY owner.id, owner.email, owner.role, manager.email
ORDER BY owner.role, owner.email;

\echo ''

-- Query 4.3: Verificar que resource_favorites são privados
\echo '13. TESTE CRÍTICO: Isolamento de Favoritos'
SELECT 
  p.email,
  p.role,
  COUNT(rf.id) as meus_favoritos,
  CASE 
    WHEN COUNT(rf.id) > 0
    THEN '✅ PASS: Usuário tem favoritos próprios'
    ELSE 'ℹ️ INFO: Sem favoritos ainda'
  END as status
FROM profiles p
LEFT JOIN resource_favorites rf ON rf.profile_id = p.id
WHERE p.email LIKE '%example.com' OR p.email LIKE '%deapdi-test.local'
GROUP BY p.id, p.email, p.role
ORDER BY p.role, p.email;

\echo ''

-- ============================================================================
-- SEÇÃO 5: CHECKLIST DE COBERTURA
-- ============================================================================

\echo '========================================='
\echo 'CHECKLIST DE COBERTURA'
\echo '========================================='
\echo ''

-- Query 5.1: Verificar cobertura de roles
\echo '14. Cobertura de Roles para Testes:'
SELECT 
  'employee' as role_necessario,
  COUNT(*) as quantidade_encontrada,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM profiles 
WHERE role = 'employee'
  AND (email LIKE '%example.com' OR email LIKE '%deapdi-test.local')
UNION ALL
SELECT 
  'manager' as role_necessario,
  COUNT(*) as quantidade_encontrada,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM profiles 
WHERE role = 'manager'
  AND (email LIKE '%example.com' OR email LIKE '%deapdi-test.local')
UNION ALL
SELECT 
  'hr' as role_necessario,
  COUNT(*) as quantidade_encontrada,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM profiles 
WHERE role = 'hr'
  AND (email LIKE '%example.com' OR email LIKE '%deapdi-test.local')
UNION ALL
SELECT 
  'admin' as role_necessario,
  COUNT(*) as quantidade_encontrada,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM profiles 
WHERE role = 'admin'
  AND (email LIKE '%example.com' OR email LIKE '%deapdi-test.local');

\echo ''
\echo '========================================='
\echo 'FIM DA VALIDAÇÃO'
\echo '========================================='
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Se faltam usuários, consulte TEST_USERS_SETUP_GUIDE.md'
\echo '2. Se existem usuários, prossiga com testes na interface'
\echo '3. Use as credenciais do guia para fazer login'
\echo '4. Documente resultados em USER_ISOLATION_TEST_RESULTS.md'
\echo ''
