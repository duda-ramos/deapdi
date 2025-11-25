-- ═══════════════════════════════════════════════════════════════════
-- CORREÇÃO RLS: resource_favorites
-- Tabela descoberta sem RLS durante auditoria
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PARTE 1: HABILITAR RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PARTE 2: CRIAR POLÍTICAS RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Política 1: Usuários podem ver seus próprios favoritos
CREATE POLICY "resource_favorites_own_select"
  ON resource_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- Política 2: Usuários podem adicionar seus próprios favoritos
CREATE POLICY "resource_favorites_own_insert"
  ON resource_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- Política 3: Usuários podem remover seus próprios favoritos
CREATE POLICY "resource_favorites_own_delete"
  ON resource_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- Política 4: HR/Admin podem ver todos os favoritos (para analytics)
CREATE POLICY "resource_favorites_hr_admin_select"
  ON resource_favorites
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role')::text IN ('hr', 'admin')
  );


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PARTE 3: VERIFICAR RESULTADO
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '✅ PROTEGIDO'
    ELSE '🚨 VULNERÁVEL'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'resource_favorites';


-- Verificar políticas criadas
SELECT 
  tablename,
  policyname,
  cmd as operacao,
  roles,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'resource_favorites'
ORDER BY cmd, policyname;


-- ═══════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
-- ═══════════════════════════════════════════════════════════════════
--
-- Query 1 (Verificar RLS):
-- ┌──────────────────────┬────────────────┬──────────────────┐
-- │ tablename            │ rls_habilitado │ status           │
-- ├──────────────────────┼────────────────┼──────────────────┤
-- │ resource_favorites   │ true           │ ✅ PROTEGIDO     │
-- └──────────────────────┴────────────────┴──────────────────┘
--
-- Query 2 (Verificar Políticas):
-- ┌──────────────────────┬────────────────────────────────┬──────────┬─────────────────┬────────────┐
-- │ tablename            │ policyname                     │ operacao │ roles           │ permissive │
-- ├──────────────────────┼────────────────────────────────┼──────────┼─────────────────┼────────────┤
-- │ resource_favorites   │ resource_favorites_own_delete  │ DELETE   │ {authenticated} │ PERMISSIVE │
-- │ resource_favorites   │ resource_favorites_own_insert  │ INSERT   │ {authenticated} │ PERMISSIVE │
-- │ resource_favorites   │ resource_favorites_own_select  │ SELECT   │ {authenticated} │ PERMISSIVE │
-- │ resource_favorites   │ resource_favorites_hr_admin... │ SELECT   │ {authenticated} │ PERMISSIVE │
-- └──────────────────────┴────────────────────────────────┴──────────┴─────────────────┴────────────┘
--
-- Total esperado: 4 políticas
--
-- ═══════════════════════════════════════════════════════════════════


/*
═══════════════════════════════════════════════════════════════════
📋 INSTRUÇÕES DE USO
═══════════════════════════════════════════════════════════════════

OPÇÃO 1: EXECUTAR TUDO DE UMA VEZ (Recomendado)
------------------------------------------------
1. Copiar TODA a PARTE 1 + PARTE 2 (linhas 1-52)
2. Colar no SQL Editor do Supabase
3. Clicar "Run"
4. Copiar e executar as queries de verificação (PARTE 3)


OPÇÃO 2: EXECUTAR PASSO A PASSO
---------------------------------
1. Copiar PARTE 1 (linha 11: ALTER TABLE...)
2. Executar no SQL Editor
3. Copiar PARTE 2 completa (linhas 18-52)
4. Executar no SQL Editor
5. Executar queries de verificação (PARTE 3)


VALIDAÇÕES:
-----------
✅ Query 1 deve mostrar: rls_habilitado = true
✅ Query 2 deve mostrar: 4 políticas
✅ Query 2 da auditoria principal não deve mais listar resource_favorites


PRÓXIMOS PASSOS APÓS EXECUTAR:
-------------------------------
1. ✅ Re-executar Query 2 da auditoria principal:
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' AND rowsecurity = false;
   
   Resultado esperado: resource_favorites NÃO deve aparecer

2. ✅ Documentar correção em RLS_AUDIT_EXECUTION_RESULTS.txt

3. ✅ Se houver outras tabelas vulneráveis, criar scripts similares


═══════════════════════════════════════════════════════════════════
📊 MATRIZ DE PERMISSÕES - resource_favorites
═══════════════════════════════════════════════════════════════════

Tabela: resource_favorites
Descrição: Favoritos de recursos de bem-estar (wellness_resources)
Estrutura: Tabela de junção (muitos-para-muitos)
  - user_id (FK → profiles.id)
  - resource_id (FK → wellness_resources.id)

┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│ Role        │ SELECT   │ INSERT   │ UPDATE   │ DELETE   │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ employee    │ Próprio  │ Próprio  │ N/A      │ Próprio  │
│ manager     │ Próprio  │ Próprio  │ N/A      │ Próprio  │
│ hr          │ Todos    │ Próprio  │ N/A      │ Próprio  │
│ admin       │ Todos    │ Próprio  │ N/A      │ Próprio  │
└─────────────┴──────────┴──────────┴──────────┴──────────┘

NOTAS:
- Não há UPDATE porque é uma tabela de junção simples (INSERT ou DELETE)
- HR/Admin podem ver todos para analytics e reports
- Usuários só gerenciam seus próprios favoritos


═══════════════════════════════════════════════════════════════════
🔒 ANÁLISE DE SEGURANÇA
═══════════════════════════════════════════════════════════════════

CRITICIDADE: 🟡 MÉDIA
---------------------
- Dados não são ultra-sensíveis (apenas preferências de recursos)
- Mas expõe padrões de comportamento dos usuários
- Pode revelar interesses em tópicos de saúde mental

IMPACTO DA VULNERABILIDADE:
--------------------------
❌ SEM RLS: Qualquer usuário autenticado pode:
  - Ver favoritos de todos os outros usuários
  - Adicionar/remover favoritos de outros usuários
  - Manipular dados de preferências

✅ COM RLS: Cada usuário só vê e gerencia seus próprios favoritos
  - HR/Admin têm acesso para analytics
  - Dados de preferência protegidos


CONFORMIDADE:
-------------
✅ LGPD: Dados de preferência são dados pessoais
✅ Princípio do menor privilégio
✅ Auditabilidade (created_at registra quando foi favoritado)


═══════════════════════════════════════════════════════════════════
*/
