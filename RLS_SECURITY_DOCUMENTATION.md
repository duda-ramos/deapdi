# Documentação de Segurança RLS - TalentFlow

## Status da Implementação

✅ **COMPLETO** - Sistema de RLS consolidado e implementado com sucesso

### Resumo da Consolidação

- **Antes:** 213 políticas fragmentadas e conflitantes
- **Depois:** ~110 políticas otimizadas e não-recursivas
- **Tabelas Protegidas:** 42 tabelas com RLS habilitado
- **Estratégia:** JWT claims + acesso direto (sem recursão)

---

## Arquitetura de Segurança

### 1. Sincronização Automática de Roles com JWT

O sistema implementa sincronização automática entre o campo `role` da tabela `profiles` e os JWT claims do usuário:

```sql
-- Trigger automático que sincroniza role com JWT
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_jwt();
```

**Benefícios:**
- ✅ Elimina recursão nas políticas RLS
- ✅ Performance superior (não precisa consultar profiles em cada query)
- ✅ Sincronização em tempo real quando role muda
- ✅ Políticas simples usando `auth.jwt() ->> 'user_role'`

### 2. Hierarquia de Roles

```
admin > hr > manager > employee
```

**Permissões por Role:**

| Role | Descrição | Acesso Global |
|------|-----------|---------------|
| `admin` | Administrador do sistema | Acesso total a tudo, incluindo configurações de sistema |
| `hr` | Recursos Humanos | Acesso total a dados de funcionários, saúde mental, salários |
| `manager` | Gerente de equipe | Acesso a dados da própria equipe (subordinados diretos) |
| `employee` | Funcionário padrão | Acesso apenas aos próprios dados |

---

## Matriz de Permissões Detalhada

### Categoria: Identidade e Organização

#### 📋 profiles

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| SELECT próprio | ✅ | ✅ | ✅ | ✅ | `auth.uid() = id` |
| UPDATE próprio | ✅ | ✅ | ✅ | ✅ | `auth.uid() = id` |
| SELECT equipe | ❌ | ✅ | ✅ | ✅ | `manager_id = auth.uid()` |
| SELECT todos | ❌ | ❌ | ✅ | ✅ | Via JWT role |
| UPDATE qualquer | ❌ | ❌ | ✅ | ✅ | Via JWT role |
| INSERT | ❌ | ❌ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 4
- `profiles_own_access`: Acesso aos próprios dados
- `profiles_hr_admin_jwt`: HR/Admin acesso total via JWT
- `profiles_manager_team_read`: Manager lê subordinados
- `profiles_anon_health`: Health checks anônimos

#### 🏢 teams

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT | ✅ | ✅ | ✅ | ✅ |
| INSERT | ❌ | ❌ | ✅ | ✅ |
| UPDATE | ❌ | ❌ | ✅ | ✅ |
| DELETE | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2
- `teams_read_all`: Todos leem teams
- `teams_hr_admin_manage`: HR/Admin gerenciam

---

### Categoria: Desenvolvimento Profissional

#### 📊 pdis (Planos de Desenvolvimento Individual)

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| SELECT próprio | ✅ | ✅ | ✅ | ✅ | `profile_id = auth.uid()` |
| INSERT próprio | ✅ | ✅ | ✅ | ✅ | `profile_id = auth.uid()` |
| UPDATE próprio | ✅ | ✅ | ✅ | ✅ | `profile_id = auth.uid()` |
| DELETE próprio | ✅ | ✅ | ✅ | ✅ | `profile_id = auth.uid()` |
| SELECT como mentor | ✅ | ✅ | ✅ | ✅ | `mentor_id = auth.uid()` |
| UPDATE como mentor | ✅ | ✅ | ✅ | ✅ | `mentor_id = auth.uid()` |
| SELECT equipe | ❌ | ✅ | ✅ | ✅ | Via manager_id |
| SELECT todos | ❌ | ❌ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 5
- `pdis_own`: Gerencia próprios PDIs
- `pdis_mentor`: Mentor lê PDIs que mentora
- `pdis_mentor_update`: Mentor atualiza PDIs
- `pdis_manager`: Manager lê PDIs da equipe
- `pdis_hr_admin`: HR/Admin acesso total

#### 💡 competencies

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT próprio | ✅ | ✅ | ✅ | ✅ |
| UPDATE próprio | ✅ | ✅ | ✅ | ✅ |
| SELECT equipe | ❌ | ✅ | ✅ | ✅ |
| UPDATE equipe | ❌ | ✅ | ✅ | ✅ |
| ALL qualquer | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 4
- `competencies_own`: Gerencia próprias competências
- `competencies_hr_admin`: HR/Admin acesso total
- `competencies_manager_read`: Manager lê competências da equipe
- `competencies_manager_update`: Manager avalia competências

#### 🎯 career_tracks

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT próprio | ✅ | ✅ | ✅ | ✅ |
| UPDATE próprio | ✅ | ✅ | ✅ | ✅ |
| ALL qualquer | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2
- `career_tracks_own`: Acesso ao próprio career track
- `career_tracks_hr_admin`: HR/Admin gerenciam todos

#### 💰 salary_history (DADOS SENSÍVEIS)

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT próprio | ✅ | ✅ | ✅ | ✅ |
| SELECT qualquer | ❌ | ❌ | ✅ | ✅ |
| INSERT | ❌ | ❌ | ✅ | ✅ |
| UPDATE | ❌ | ❌ | ✅ | ✅ |
| DELETE | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2
- `salary_own_read`: Usuário lê próprio histórico
- `salary_hr_admin_all`: **APENAS HR/Admin gerenciam**

⚠️ **ATENÇÃO:** Managers NÃO têm acesso a dados salariais da equipe

---

### Categoria: Colaboração

#### 👥 action_groups

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT | ✅ | ✅ | ✅ | ✅ |
| INSERT | ✅ | ✅ | ✅ | ✅ |
| UPDATE próprio | ✅ | ✅ | ✅ | ✅ |
| UPDATE qualquer | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 3

#### ✅ tasks

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| ALL como assignee | ✅ | ✅ | ✅ | ✅ | `assignee_id = auth.uid()` |
| SELECT grupo | ✅ | ✅ | ✅ | ✅ | Se participante do grupo |
| ALL como criador | ✅ | ✅ | ✅ | ✅ | Se criou o grupo |
| ALL qualquer | ❌ | ✅ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 4

---

### Categoria: Saúde Mental (MÁXIMA PRIVACIDADE)

#### 😊 emotional_checkins

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL próprio | ✅ | ✅ | ✅ | ✅ |
| SELECT todos | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2
- `emotional_own`: **Acesso ultra-restrito** ao próprio funcionário
- `emotional_hr_read`: HR/Admin para estatísticas

⚠️ **PRIVACIDADE CRÍTICA:** Managers não têm acesso aos check-ins emocionais da equipe

#### 🧠 psychology_sessions

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| ALL próprio | ✅ | ✅ | ✅ | ✅ | `employee_id = auth.uid()` |
| ALL como psicólogo | ✅ | ✅ | ✅ | ✅ | `psychologist_id = auth.uid()` |
| SELECT todos | ❌ | ❌ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 3

#### 📋 psychological_records (ULTRA-SENSÍVEL)

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 1
- `psych_records_hr_admin`: **APENAS HR/Admin** têm acesso

⚠️ **MÁXIMA SEGURANÇA:** Funcionários e managers não acessam registros psicológicos

#### 🚨 mental_health_alerts

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 1
- `alerts_hr_admin`: **APENAS HR/Admin**

---

### Categoria: Aprendizado

#### 📚 courses

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT (ativos) | ✅ | ✅ | ✅ | ✅ |
| ALL | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2

#### 📝 course_enrollments

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL próprio | ✅ | ✅ | ✅ | ✅ |
| SELECT todos | ❌ | ✅ | ✅ | ✅ |

**Políticas Implementadas:** 2

#### 📜 certificates

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT próprio | ✅ | ✅ | ✅ | ✅ |
| INSERT (sistema) | ✅ | ✅ | ✅ | ✅ |
| SELECT todos | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 3

---

### Categoria: Mentoria

#### 🤝 mentorships

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| ALL participante | ✅ | ✅ | ✅ | ✅ | `mentor_id = uid OR mentee_id = uid` |
| SELECT todos | ❌ | ❌ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 2

#### ⭐ mentor_ratings

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| ALL como mentee | ✅ | ✅ | ✅ | ✅ | `mentee_id = auth.uid()` |
| SELECT participantes | ✅ | ✅ | ✅ | ✅ | Se mentor ou mentee |
| SELECT todos | ❌ | ❌ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 2

---

### Categoria: Calendário

#### 📅 calendar_events

| Operação | employee | manager | hr | admin | Condição |
|----------|----------|---------|----|----|----------|
| ALL próprio | ✅ | ✅ | ✅ | ✅ | `user_id = uid OR created_by = uid` |
| SELECT públicos | ✅ | ✅ | ✅ | ✅ | `is_public = true` |
| ALL qualquer | ❌ | ❌ | ✅ | ✅ | Via JWT role |

**Políticas Implementadas:** 3

#### 🗓️ calendar_requests (Férias/Day-off)

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL próprio | ✅ | ✅ | ✅ | ✅ |
| ALL qualquer | ❌ | ✅ | ✅ | ✅ |

**Políticas Implementadas:** 3
- `calendar_requests_own`: Funcionário gerencia próprias solicitações
- `calendar_requests_manager`: Manager aprova solicitações
- `calendar_requests_hr_admin`: HR/Admin gerenciam tudo

---

### Categoria: Templates e Configuração

#### 🏆 achievement_templates

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT | ✅ | ✅ | ✅ | ✅ |
| ALL | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2

#### 💼 career_track_templates

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT | ✅ | ✅ | ✅ | ✅ |
| ALL | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2

#### 💵 career_stage_salary_ranges

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT | ❌ | ✅ | ✅ | ✅ |
| ALL | ❌ | ❌ | ✅ | ✅ |

**Políticas Implementadas:** 2

---

### Categoria: Sistema e Auditoria

#### 🔔 notifications

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL próprio | ✅ | ✅ | ✅ | ✅ |
| INSERT (sistema) | ✅ | ✅ | ✅ | ✅ |

**Políticas Implementadas:** 2

#### 📊 audit_logs

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| SELECT | ❌ | ❌ | ❌ | ✅ |
| INSERT (sistema) | ✅ | ✅ | ✅ | ✅ |

**Políticas Implementadas:** 2
- `audit_admin_read`: **APENAS Admin** lê logs
- `audit_system_create`: Sistema cria logs

#### ⚙️ system_config

| Operação | employee | manager | hr | admin |
|----------|----------|---------|----|----|
| ALL | ❌ | ❌ | ❌ | ✅ |

**Políticas Implementadas:** 1
- `system_config_admin`: **APENAS Admin**

---

## Índices de Performance

Todos os índices foram criados para otimizar as políticas RLS:

```sql
-- Principais índices implementados
idx_profiles_manager_id         -- Para políticas de manager
idx_profiles_role               -- Para verificação de roles
idx_action_groups_created_by    -- Para criadores de grupos
idx_tasks_assignee              -- Para assignees de tasks
idx_competencies_profile        -- Para competências por profile
idx_pdis_profile                -- Para PDIs por profile
idx_salary_profile              -- Para histórico salarial
idx_emotional_checkins_employee -- Para check-ins emocionais
idx_psychology_sessions_employee -- Para sessões psicológicas
idx_mentorships_mentor          -- Para mentorships
idx_course_enrollments_profile  -- Para enrollments
idx_calendar_requests_requester -- Para solicitações de calendário
```

---

## Testes de Segurança

### Cenários de Teste Implementados

#### 1. Isolamento de Dados Entre Usuários
```sql
-- ✅ Usuário A NÃO pode ver dados do Usuário B
-- ✅ Testado em: profiles, salary_history, pdis, competencies
```

#### 2. Acesso de Manager à Equipe
```sql
-- ✅ Manager PODE ver subordinados diretos
-- ✅ Manager NÃO pode ver outros funcionários
-- ✅ Testado em: profiles, pdis, competencies
```

#### 3. Privacidade de Saúde Mental
```sql
-- ✅ Funcionário vê apenas próprios check-ins
-- ✅ Manager NÃO vê check-ins da equipe
-- ✅ HR vê dados agregados para estatísticas
-- ✅ Testado em: emotional_checkins, psychology_sessions
```

#### 4. Proteção de Dados Salariais
```sql
-- ✅ Funcionário vê apenas próprio histórico
-- ✅ Manager NÃO vê salários da equipe
-- ✅ APENAS HR/Admin acessam
-- ✅ Testado em: salary_history, career_stage_salary_ranges
```

#### 5. Colaboração em Grupos
```sql
-- ✅ Participantes veem tasks do grupo
-- ✅ Criador gerencia participantes
-- ✅ Não-participantes não veem tasks privadas
-- ✅ Testado em: action_groups, tasks, action_group_participants
```

---

## Boas Práticas de Segurança

### ✅ DO (Faça)

1. **Use auth.uid() diretamente** para acesso aos próprios dados
   ```sql
   USING (profile_id = auth.uid())
   ```

2. **Use auth.jwt() para verificar roles** (evita recursão)
   ```sql
   USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
   ```

3. **Separe políticas por operação** (SELECT, INSERT, UPDATE, DELETE)
   ```sql
   CREATE POLICY "table_read" FOR SELECT ...
   CREATE POLICY "table_write" FOR INSERT ...
   ```

4. **Use EXISTS com LIMIT 1** para performance
   ```sql
   EXISTS (SELECT 1 FROM ... LIMIT 1)
   ```

5. **Teste cada política** com diferentes roles antes de deploy

### ❌ DON'T (Não Faça)

1. **NÃO use subqueries recursivas** na mesma tabela
   ```sql
   -- ❌ ERRADO - causa recursão infinita
   USING (
     EXISTS (
       SELECT 1 FROM profiles -- recursão!
       WHERE profiles.id = auth.uid()
       AND profiles.role = 'admin'
     )
   )

   -- ✅ CORRETO - usa JWT
   USING ((auth.jwt() ->> 'user_role') = 'admin')
   ```

2. **NÃO use USING (true)** sem necessidade real
   ```sql
   -- ❌ ERRADO - abre acesso desnecessário
   CREATE POLICY "insecure" USING (true);

   -- ✅ CORRETO - restringe apropriadamente
   CREATE POLICY "secure" USING (profile_id = auth.uid());
   ```

3. **NÃO exponha dados sensíveis** para managers
   ```sql
   -- ❌ ERRADO - manager vê salários
   -- ✅ CORRETO - apenas HR/Admin veem salários
   ```

4. **NÃO use FOR ALL** quando puder separar operações
   ```sql
   -- ❌ MENOS SEGURO
   CREATE POLICY "all_ops" FOR ALL ...

   -- ✅ MAIS SEGURO - controle granular
   CREATE POLICY "read" FOR SELECT ...
   CREATE POLICY "write" FOR INSERT ...
   ```

---

## Troubleshooting Comum

### Problema: "row-level security policy violated"

**Causa:** Usuário tentando acessar dados sem permissão

**Solução:**
1. Verificar se o JWT do usuário tem o role correto:
   ```sql
   SELECT auth.jwt() ->> 'user_role';
   ```
2. Verificar se a política permite a operação
3. Verificar se o usuário está autenticado

### Problema: "infinite recursion detected in policy"

**Causa:** Política com subquery recursiva

**Solução:**
1. Use `auth.jwt() ->> 'user_role'` ao invés de consultar profiles
2. Evite EXISTS que consulta a mesma tabela da política
3. Sincronize roles com JWT usando o trigger

### Problema: Performance lenta em queries com RLS

**Causa:** Falta de índices ou políticas complexas

**Solução:**
1. Adicionar índices nas colunas usadas nas políticas
2. Usar índices parciais com WHERE
3. Simplificar condições das políticas
4. Usar `EXPLAIN ANALYZE` para debugar

---

## Manutenção e Governança

### Adicionando Novas Tabelas

1. **Sempre habilite RLS:**
   ```sql
   ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;
   ```

2. **Crie políticas básicas:**
   ```sql
   -- Acesso próprio
   CREATE POLICY "nova_tabela_own"
     ON nova_tabela FOR ALL
     TO authenticated
     USING (user_id = auth.uid())
     WITH CHECK (user_id = auth.uid());

   -- HR/Admin acesso total
   CREATE POLICY "nova_tabela_hr_admin"
     ON nova_tabela FOR ALL
     TO authenticated
     USING ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'))
     WITH CHECK ((auth.jwt() ->> 'user_role') IN ('hr', 'admin'));
   ```

3. **Adicione índices:**
   ```sql
   CREATE INDEX idx_nova_tabela_user ON nova_tabela(user_id);
   ```

### Modificando Roles Existentes

1. **Nunca mude roles diretamente em auth.users**
2. **Sempre atualize via profiles:**
   ```sql
   UPDATE profiles SET role = 'hr' WHERE id = 'user-uuid';
   -- O trigger sincroniza automaticamente com JWT
   ```

3. **Valide a sincronização:**
   ```sql
   SELECT
     p.id,
     p.role as profile_role,
     u.raw_app_meta_data->>'user_role' as jwt_role
   FROM profiles p
   JOIN auth.users u ON u.id = p.id
   WHERE p.id = 'user-uuid';
   ```

---

## Contato e Suporte

Para questões de segurança ou modificações nas políticas RLS:

1. **Consulte sempre este documento** antes de fazer alterações
2. **Teste em ambiente de staging** antes de produção
3. **Documente todas as mudanças** nas políticas
4. **Execute testes de permissão** após cada mudança

---

**Última Atualização:** 2025-09-30
**Versão:** 2.0 (Consolidação Completa)
**Status:** ✅ Produção