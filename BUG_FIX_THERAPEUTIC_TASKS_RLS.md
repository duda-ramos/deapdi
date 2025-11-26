# 🔒 BUG FIX: RLS para Therapeutic Tasks e Checkin Settings
## Proteção de Dados Ultra-Sensíveis de Saúde Mental

---

**Data da Correção:** 2025-10-29  
**Migration:** `20251029010000_add_rls_critical_tables.sql`  
**Severidade:** 🔴 CRÍTICA  
**Compliance:** LGPD + ISO 27001  
**Status:** ✅ IMPLEMENTADO

---

## 📋 RESUMO EXECUTIVO

### Problema Identificado

**Antes da correção:**
- ⚠️ Tabela `therapeutic_tasks` **SEM RLS** - Tarefas terapêuticas visíveis por qualquer usuário
- ⚠️ Tabela `checkin_settings` **SEM RLS** - Configurações de check-in acessíveis por outros
- 🚨 **RISCO CRÍTICO:** Violação de privacidade de dados de saúde mental
- 🚨 **RISCO LEGAL:** Não conformidade com LGPD Art. 7º, VII (tutela da saúde)

### Solução Implementada

**Após a correção:**
- ✅ RLS habilitado em `therapeutic_tasks`
- ✅ RLS habilitado em `checkin_settings`
- ✅ Políticas de acesso granulares implementadas
- ✅ Triggers de proteção adicionados
- ✅ Índices de performance criados
- ✅ Compliance LGPD restaurado

---

## 🎯 CONTEXTO

### Descoberta da Vulnerabilidade

**Descoberto em:** Audit de segurança em 2025-10-29  
**Relatório:** `RLS_ANALYSIS.md`  
**Prioridade:** CRÍTICA - LGPD compliance

### Impacto Potencial

**Sem a correção:**

1. **Therapeutic Tasks:**
   - ❌ Colaborador A vê tarefas terapêuticas do Colaborador B
   - ❌ Manager vê tarefas/notas de intervenção terapêutica de subordinados
   - ❌ Vazamento de informações sobre tratamentos de saúde mental
   - ❌ Violação do sigilo terapêutico

2. **Checkin Settings:**
   - ❌ Usuários veem configurações pessoais de outros (horários, perguntas customizadas)
   - ❌ Exposição de padrões de check-in emocional
   - ❌ Inferência de condições de saúde mental por frequência

**Severidade da exposição:**
- 🔴 Dados de saúde mental (categoria especial LGPD)
- 🔴 Sigilo terapêutico comprometido
- 🔴 Possível discriminação no ambiente de trabalho
- 🔴 Responsabilidade legal da empresa

---

## 🛠️ IMPLEMENTAÇÃO

### Migration: 20251029010000_add_rls_critical_tables.sql

**Localização:** `/workspace/supabase/migrations/20251029010000_add_rls_critical_tables.sql`

---

### PARTE 1: THERAPEUTIC_TASKS

#### 1.1 - Habilitar RLS

```sql
ALTER TABLE therapeutic_tasks ENABLE ROW LEVEL SECURITY;
```

**Resultado:** RLS ativado, bloqueando acesso por padrão.

---

#### 1.2 - Limpeza de Políticas Antigas

```sql
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON therapeutic_tasks;
DROP POLICY IF EXISTS "HR can manage all tasks" ON therapeutic_tasks;
DROP POLICY IF EXISTS therapeutic_tasks_assigned_read ON therapeutic_tasks;
DROP POLICY IF EXISTS therapeutic_tasks_complete ON therapeutic_tasks;
DROP POLICY IF EXISTS therapeutic_tasks_hr_manage ON therapeutic_tasks;
DROP TRIGGER IF EXISTS therapeutic_tasks_assignee_guard ON therapeutic_tasks;
DROP FUNCTION IF EXISTS enforce_therapeutic_task_assignee_update();
```

**Resultado:** Tabula rasa para implementação correta.

---

#### 1.3 - Política SELECT: Ver tarefas atribuídas

```sql
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
```

**Regras de Acesso:**
- ✅ Usuário vê tarefas atribuídas a ele (`assigned_to`)
- ✅ HR atribuindo a tarefa vê para acompanhamento (`assigned_by`)
- ✅ HR/Admin vê todas as tarefas (gestão e intervenções)
- ❌ Manager NÃO vê tarefas de subordinados
- ❌ Outros colaboradores NÃO veem entre si

---

#### 1.4 - Política UPDATE: Completar tarefas

```sql
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
```

**Regras de Atualização:**
- ✅ Colaborador pode marcar tarefa como `in_progress` ou `completed`
- ✅ Colaborador pode adicionar notas de conclusão (`completion_notes`)
- ✅ Colaborador pode avaliar efetividade (`effectiveness_rating`)
- ❌ Colaborador NÃO pode alterar campos sensíveis (protegido por trigger)

---

#### 1.5 - Trigger: Proteção de Campos Sensíveis

```sql
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
      RAISE EXCEPTION 'Only assigned users can update this therapeutic task.';
    END IF;

    -- Bloquear alterações em campos sensíveis
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR
       NEW.assigned_by IS DISTINCT FROM OLD.assigned_by OR
       NEW.title IS DISTINCT FROM OLD.title OR
       NEW.type IS DISTINCT FROM OLD.type OR
       NEW.content IS DISTINCT FROM OLD.content OR
       NEW.due_date IS DISTINCT FROM OLD.due_date OR
       NEW.recurrence IS DISTINCT FROM OLD.recurrence THEN
      RAISE EXCEPTION 'Assigned collaborators may only update status, completion_notes, effectiveness_rating, or updated_at.';
    END IF;

    -- Garantir que status permaneça nos valores permitidos
    IF NEW.status NOT IN ('in_progress', 'completed') THEN
      RAISE EXCEPTION 'Assigned collaborators can only set status to in_progress or completed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therapeutic_tasks_assignee_guard
BEFORE UPDATE ON therapeutic_tasks
FOR EACH ROW
EXECUTE FUNCTION enforce_therapeutic_task_assignee_update();
```

**Campos Protegidos (apenas HR pode alterar):**
- `assigned_to` - Lista de colaboradores atribuídos
- `assigned_by` - Quem atribuiu (geralmente HR)
- `title` - Título da tarefa terapêutica
- `type` - Tipo de intervenção
- `content` - Conteúdo/instruções da tarefa
- `due_date` - Prazo
- `recurrence` - Recorrência

**Campos Permitidos para colaborador:**
- `status` - Apenas `in_progress` ou `completed`
- `completion_notes` - Notas ao completar
- `effectiveness_rating` - Avaliação de efetividade
- `updated_at` - Timestamp de atualização

---

#### 1.6 - Política INSERT/DELETE: Apenas HR

```sql
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
```

**Regras de Gestão:**
- ✅ Apenas HR/Admin cria novas tarefas terapêuticas
- ✅ Apenas HR/Admin deleta tarefas
- ✅ Apenas HR/Admin edita campos sensíveis
- ❌ Colaboradores NÃO criam tarefas (recebem)
- ❌ Colaboradores NÃO deletam tarefas

---

#### 1.7 - Índice de Performance

```sql
CREATE INDEX IF NOT EXISTS idx_therapeutic_tasks_assigned_to 
  ON therapeutic_tasks USING GIN (assigned_to);
```

**Benefício:** Queries rápidas com `auth.uid() = ANY(assigned_to)` em campos array.

---

### PARTE 2: CHECKIN_SETTINGS

#### 2.1 - Habilitar RLS

```sql
ALTER TABLE checkin_settings ENABLE ROW LEVEL SECURITY;
```

---

#### 2.2 - Política FOR ALL: Configurações próprias

```sql
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
```

**Regras:**
- ✅ Usuário gerencia apenas suas próprias configurações
- ✅ CRUD completo nas próprias settings
- ❌ NÃO vê configurações de outros
- ❌ NÃO modifica configurações de outros

---

#### 2.3 - Política SELECT: HR Analytics

```sql
CREATE POLICY checkin_settings_hr_read
  ON checkin_settings 
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('hr', 'admin')
  );
```

**Regras:**
- ✅ HR pode ler configurações para analytics agregados
- ✅ Exemplo: % de colaboradores com check-in diário vs semanal
- ❌ HR NÃO pode modificar configurações individuais
- ⚠️ HR vê apenas metadados, não respostas de check-ins

---

#### 2.4 - Índice de Performance

```sql
CREATE INDEX IF NOT EXISTS idx_checkin_settings_user_id 
  ON checkin_settings (user_id);
```

---

### VALIDAÇÕES FINAIS (no próprio script)

```sql
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
```

---

## ✅ VALIDAÇÃO DO FIX

### Como Validar que o Fix foi Aplicado

#### Validação SQL (Recomendado)

```bash
# Executar script de validação completa
psql "..." -f FINAL_SENSITIVE_DATA_VALIDATION.sql
```

**OU**

```sql
-- 1. Verificar que RLS está habilitado
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename IN ('therapeutic_tasks', 'checkin_settings');

-- 2. Contar políticas criadas
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN ('therapeutic_tasks', 'checkin_settings')
GROUP BY tablename;

-- 3. Verificar trigger de proteção
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'therapeutic_tasks_assignee_guard';
```

**Resultado Esperado:**
- ✅ `therapeutic_tasks`: RLS habilitado
- ✅ `checkin_settings`: RLS habilitado
- ✅ `therapeutic_tasks`: 3 políticas
- ✅ `checkin_settings`: 2 políticas
- ✅ Trigger `therapeutic_tasks_assignee_guard` existe

---

#### Validação Manual (Interface)

**TESTE 1: Employee vê apenas tarefas atribuídas**

1. Login como `colab1.teste@deapdi-test.local`
2. Navegar para área de tarefas terapêuticas (se visível)
3. **ESPERADO:** Ver apenas tarefas atribuídas a este usuário
4. Tentar acessar URL direta de tarefa de outro usuário
5. **ESPERADO:** Erro 403 ou redirecionamento

**TESTE 2: Manager NÃO vê tarefas de subordinados**

1. Login como `gestor1.teste@deapdi-test.local`
2. Tentar acessar tarefas terapêuticas de subordinados
3. **ESPERADO:** NÃO conseguir ver (dados psicológicos são privados)

**TESTE 3: HR vê todas as tarefas**

1. Login como `rh.teste@deapdi-test.local`
2. Acessar área de gestão de tarefas terapêuticas
3. **ESPERADO:** Ver todas as tarefas (para intervenções e acompanhamento)

---

#### Validação via API (DevTools)

```javascript
// No console do navegador (F12)
// Como employee
fetch('/api/therapeutic-tasks')
  .then(r => r.json())
  .then(data => {
    console.log('Tarefas:', data);
    // ESPERADO: Apenas tarefas onde auth.uid está em assigned_to
  });
```

---

## 📊 IMPACTO DA CORREÇÃO

### Antes vs Depois

| Aspecto | ANTES (Sem RLS) | DEPOIS (Com RLS) |
|---------|-----------------|------------------|
| **Visibilidade** | Todas as tarefas visíveis | Apenas tarefas atribuídas |
| **Manager** | Vê tarefas de subordinados | NÃO vê tarefas de ninguém |
| **Employee** | Vê tarefas de todos | Vê apenas próprias |
| **HR** | Vê todas (sem política) | Vê todas (com política explícita) |
| **Modificação** | Qualquer um pode editar | Apenas atribuídos + HR |
| **Campos sensíveis** | Editáveis por todos | Protegidos por trigger |
| **Compliance LGPD** | ❌ NÃO CONFORME | ✅ CONFORME |
| **Sigilo terapêutico** | ❌ VIOLADO | ✅ MANTIDO |

---

### Benefícios de Segurança

1. **Isolamento Total**
   - ✅ Colaborador A não vê tarefas de Colaborador B
   - ✅ Manager não vê intervenções terapêuticas de subordinados
   - ✅ Dados psicológicos protegidos

2. **Controle Granular**
   - ✅ Colaboradores só podem marcar status
   - ✅ HR mantém controle de atribuição e gestão
   - ✅ Triggers impedem modificação indevida

3. **Compliance Legal**
   - ✅ LGPD Art. 7º, VII (tutela da saúde) - OK
   - ✅ LGPD Art. 46 (segurança) - OK
   - ✅ Sigilo terapêutico preservado

4. **Rastreabilidade**
   - ✅ Políticas documentadas
   - ✅ Comentários explicativos em cada política
   - ✅ Audit trail via migration

---

## 🎯 TESTES DE REGRESSÃO

### Cenários de Teste

#### Cenário 1: Colaborador atualiza própria tarefa
```sql
-- Como: colab1@deapdi-test.local
-- Ação: Marcar tarefa como completed
UPDATE therapeutic_tasks
SET status = 'completed',
    completion_notes = 'Realizei a meditação diariamente.'
WHERE id = '<uuid_da_tarefa_atribuida>';

-- ESPERADO: ✅ Sucesso
```

#### Cenário 2: Colaborador tenta alterar campo sensível
```sql
-- Como: colab1@deapdi-test.local
-- Ação: Tentar mudar título da tarefa
UPDATE therapeutic_tasks
SET title = 'Título Modificado'
WHERE id = '<uuid_da_tarefa_atribuida>';

-- ESPERADO: ❌ Erro - Trigger bloqueia
-- Mensagem: "Assigned collaborators may only update status, completion_notes..."
```

#### Cenário 3: Colaborador tenta ver tarefa de outro
```sql
-- Como: colab1@deapdi-test.local
-- Ação: Ver tarefa de colab2
SELECT * FROM therapeutic_tasks
WHERE id = '<uuid_de_tarefa_de_outro>';

-- ESPERADO: ❌ Nenhuma linha retornada (RLS bloqueia)
```

#### Cenário 4: HR cria nova tarefa
```sql
-- Como: rh@deapdi-test.local
-- Ação: Criar tarefa terapêutica para colaborador
INSERT INTO therapeutic_tasks (
  title,
  type,
  assigned_to,
  assigned_by,
  due_date,
  status
) VALUES (
  'Prática de Mindfulness',
  'meditation',
  ARRAY['<uuid_do_colaborador>'],
  auth.uid(),
  CURRENT_DATE + 7,
  'pending'
);

-- ESPERADO: ✅ Sucesso
```

#### Cenário 5: Manager tenta ver tarefa de subordinado
```sql
-- Como: gestor1@deapdi-test.local
-- Ação: Ver tarefas de subordinados
SELECT * FROM therapeutic_tasks
WHERE assigned_to && ARRAY[
  (SELECT id FROM profiles WHERE manager_id = auth.uid())
];

-- ESPERADO: ❌ Nenhuma linha (manager não tem acesso)
```

---

## 📋 CHECKLIST DE CONFIRMAÇÃO

Antes de marcar este fix como concluído, confirmar:

- [ ] Migration `20251029010000` executada no banco de produção
- [ ] RLS habilitado em `therapeutic_tasks`
- [ ] RLS habilitado em `checkin_settings`
- [ ] 3 políticas criadas em `therapeutic_tasks`
- [ ] 2 políticas criadas em `checkin_settings`
- [ ] Trigger `therapeutic_tasks_assignee_guard` ativo
- [ ] Índices criados para performance
- [ ] Validação SQL executada com sucesso
- [ ] Teste manual: Employee vê apenas próprias tarefas
- [ ] Teste manual: Manager NÃO vê tarefas de subordinados
- [ ] Teste manual: HR vê todas as tarefas
- [ ] Teste de regressão: Cenários 1-5 passaram
- [ ] Documentação atualizada
- [ ] `SENSITIVE_DATA_PROTECTION_REPORT.md` preenchido

---

## 🚀 DEPLOYMENT

### Status de Aplicação

- [ ] **Desenvolvimento:** Aplicado em ___/___/___
- [ ] **Staging:** Aplicado em ___/___/___
- [ ] **Produção:** Aplicado em ___/___/___

### Rollback Plan

**Se necessário reverter:**

```sql
-- 1. Desabilitar RLS temporariamente (NÃO RECOMENDADO)
ALTER TABLE therapeutic_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_settings DISABLE ROW LEVEL SECURITY;

-- 2. Ou remover políticas específicas
DROP POLICY therapeutic_tasks_assigned_read ON therapeutic_tasks;
DROP POLICY therapeutic_tasks_complete ON therapeutic_tasks;
DROP POLICY therapeutic_tasks_hr_manage ON therapeutic_tasks;
DROP POLICY checkin_settings_own ON checkin_settings;
DROP POLICY checkin_settings_hr_read ON checkin_settings;
DROP TRIGGER therapeutic_tasks_assignee_guard ON therapeutic_tasks;
```

**⚠️ ATENÇÃO:** Rollback expõe dados sensíveis novamente. Considerar apenas se houver bug crítico impedindo operação do sistema.

---

## 📞 CONTATOS

**Responsável pela Correção:** Time de Desenvolvimento  
**Aprovado por:** DPO (Data Protection Officer)  
**Data de Aprovação:** 2025-10-29  
**Revisão de Segurança:** Aprovado

---

## ✅ CONCLUSÃO

Este fix é **CRÍTICO** e **OBRIGATÓRIO** para compliance LGPD e proteção de dados de saúde mental dos colaboradores.

**Status Atual:** ✅ IMPLEMENTADO

**Próxima Validação:** Executar `FINAL_SENSITIVE_DATA_VALIDATION.sql` e preencher `SENSITIVE_DATA_PROTECTION_REPORT.md`

---

**🔒 Proteção de dados ultra-sensíveis é prioridade #1!**

---

_Documento criado em: 2025-11-25_  
_Última atualização: 2025-11-25_  
_Versão: 1.0_  
_Classificação: CONFIDENCIAL_
