# 🐛 Bug Fix: Criação de Tarefas em Grupos de Ação

## Problema Identificado

**Sintoma:** Criação de tarefas dentro de grupos de ação não funcionava - tarefas não eram salvas no banco de dados.

**Causa Raiz:** As políticas RLS (Row Level Security) da tabela `tasks` não permitiam que participantes de grupos criassem tarefas. Apenas criadores de grupos, managers, HR e admin tinham permissão para criar tarefas.

## Análise Detalhada

### 1. Investigação do Serviço (`src/services/actionGroups.ts`)

✅ **Resultado:** O método `createTask()` estava correto:
- Validava todos os parâmetros obrigatórios (`title`, `assignee_id`, `group_id`, `deadline`)
- Verificava se o `assignee_id` era um participante do grupo
- Enviava notificações corretamente
- Tratamento de erro adequado

### 2. Investigação do Componente (`src/pages/ActionGroups.tsx`)

✅ **Resultado:** O componente estava passando os dados corretamente:
- `groupId` era definido quando o modal era aberto (linha 424)
- `group_id` era passado no payload ao criar a tarefa (linha 127-129)
- Formulário tinha validação `required` nos campos obrigatórios

### 3. Investigação das Políticas RLS

❌ **PROBLEMA ENCONTRADO:** As políticas RLS da tabela `tasks` não permitiam INSERT por participantes:

**Políticas Existentes:**
1. `tasks_assignee`: Permite ALL mas apenas se `assignee_id = auth.uid()` (não funciona para criar tarefas para outros)
2. `tasks_group_read`: Apenas SELECT para participantes do grupo
3. `tasks_creator`: Permite ALL apenas para criadores do grupo
4. `tasks_managers_all`: Permite ALL apenas para managers/HR/admin

**Problema:** Nenhuma política permitia que participantes (membros ou líderes) criassem tarefas no grupo!

## Solução Implementada

### 1. Nova Migration: `20251029000000_fix_task_creation_rls.sql`

Criadas duas novas políticas RLS:

#### Política 1: `tasks_group_participants_insert`
```sql
CREATE POLICY "tasks_group_participants_insert"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    -- O usuário deve ser participante do grupo
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
    )
    AND
    -- O assignee também deve ser participante do grupo
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = tasks.assignee_id
    )
  );
```

**Benefícios:**
- ✅ Qualquer participante do grupo pode criar tarefas
- ✅ Garante que apenas participantes do grupo sejam atribuídos
- ✅ Previne criação de tarefas para pessoas fora do grupo

#### Política 2: `tasks_group_leaders_manage`
```sql
CREATE POLICY "tasks_group_leaders_manage"
  ON tasks FOR ALL
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM action_group_participants
      WHERE action_group_participants.group_id = tasks.group_id
      AND action_group_participants.profile_id = auth.uid()
      AND action_group_participants.role = 'leader'
    )
  )
  WITH CHECK (...);
```

**Benefícios:**
- ✅ Líderes do grupo têm controle total sobre as tarefas do grupo
- ✅ Podem criar, editar, deletar qualquer tarefa do grupo
- ✅ Facilita a gestão do grupo

### 2. Melhorias no Frontend

#### Validação Aprimorada (`src/pages/ActionGroups.tsx`)
```typescript
// Validação de campos obrigatórios antes do submit
if (!taskForm.title || taskForm.title.trim().length === 0) {
  setError('Título da tarefa é obrigatório');
  return;
}

if (!taskForm.assignee_id) {
  setError('Responsável pela tarefa é obrigatório');
  return;
}

if (!taskForm.deadline) {
  setError('Prazo da tarefa é obrigatório');
  return;
}
```

#### Feedback de Erro Melhorado
- ✅ Mensagens de erro exibidas no modal
- ✅ Estado de loading durante criação
- ✅ Validação de data mínima (hoje)
- ✅ Nota informativa sobre notificações

### 3. Logging Aprimorado (`src/services/actionGroups.ts`)

```typescript
console.log('👥 ActionGroups: Creating task:', taskData.title);
console.log('👥 ActionGroups: Task data:', {
  title: taskData.title,
  assignee_id: taskData.assignee_id,
  group_id: taskData.group_id,
  deadline: taskData.deadline
});

console.log('👥 ActionGroups: Verifying assignee is a participant...');
console.log('👥 ActionGroups: Group participants:', participants.map(...));
console.log('👥 ActionGroups: Inserting task into database...');
console.log('👥 ActionGroups: Task created successfully:', task.id);
```

**Benefícios:**
- ✅ Facilita debug de problemas
- ✅ Rastreamento do fluxo completo
- ✅ Identificação rápida de falhas

## Testes Necessários

### Teste 1: Admin cria tarefa
- [ ] Login como Admin
- [ ] Abrir um grupo de ação existente
- [ ] Criar nova tarefa atribuindo a um participante
- [ ] Verificar que tarefa aparece na lista
- [ ] Confirmar no banco que tarefa foi salva

### Teste 2: RH cria tarefa
- [ ] Login como RH
- [ ] Abrir um grupo de ação existente
- [ ] Criar nova tarefa atribuindo a um participante
- [ ] Verificar que tarefa aparece na lista
- [ ] Confirmar no banco que tarefa foi salva

### Teste 3: Gestor (criador do grupo) cria tarefa
- [ ] Login como Gestor
- [ ] Abrir um grupo que o gestor criou
- [ ] Criar nova tarefa atribuindo a um participante
- [ ] Verificar que tarefa aparece na lista
- [ ] Confirmar no banco que tarefa foi salva

### Teste 4: Líder do grupo cria tarefa
- [ ] Login como um usuário que é líder (não criador) de um grupo
- [ ] Abrir o grupo
- [ ] Criar nova tarefa atribuindo a um participante
- [ ] Verificar que tarefa aparece na lista
- [ ] Confirmar no banco que tarefa foi salva

### Teste 5: Membro do grupo cria tarefa
- [ ] Login como um usuário que é membro (não líder) de um grupo
- [ ] Abrir o grupo
- [ ] Criar nova tarefa atribuindo a um participante
- [ ] Verificar que tarefa aparece na lista
- [ ] Confirmar no banco que tarefa foi salva

### Teste 6: Usuário não-participante tenta criar tarefa
- [ ] Login como usuário que NÃO é participante de um grupo
- [ ] Tentar acessar o grupo (não deveria conseguir)
- [ ] Se conseguir, tentar criar tarefa (deveria falhar)

### Teste 7: Validações
- [ ] Tentar criar tarefa sem título → deve mostrar erro
- [ ] Tentar criar tarefa sem responsável → deve mostrar erro
- [ ] Tentar criar tarefa sem prazo → deve mostrar erro
- [ ] Tentar criar tarefa com prazo passado → deve mostrar erro
- [ ] Criar tarefa para si mesmo → deve funcionar
- [ ] Criar tarefa para outro participante → deve funcionar

## Arquivos Modificados

1. **Nova Migration:** `/workspace/supabase/migrations/20251029000000_fix_task_creation_rls.sql`
   - Adiciona política `tasks_group_participants_insert`
   - Adiciona política `tasks_group_leaders_manage`

2. **Frontend:** `/workspace/src/pages/ActionGroups.tsx`
   - Melhor validação de campos obrigatórios
   - Feedback de erro aprimorado
   - Estado de loading
   - Validação de data mínima

3. **Serviço:** `/workspace/src/services/actionGroups.ts`
   - Logging detalhado
   - Validação de `group_id`
   - Mensagens de erro mais claras
   - Detecção de erros RLS

4. **Documentação:**
   - `/workspace/TASK_CREATION_FIX_VALIDATION.sql` - Queries de validação
   - `/workspace/BUG_FIX_TASK_CREATION_SUMMARY.md` - Este documento

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie e execute o conteúdo de `20251029000000_fix_task_creation_rls.sql`

### Opção 2: Via CLI do Supabase
```bash
cd /workspace
supabase db push
```

### Opção 3: Via psql
```bash
psql $DATABASE_URL < supabase/migrations/20251029000000_fix_task_creation_rls.sql
```

## Validação da Correção

Use as queries em `TASK_CREATION_FIX_VALIDATION.sql` para validar:

```sql
-- Verificar se as novas políticas foram criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks'
AND policyname IN ('tasks_group_participants_insert', 'tasks_group_leaders_manage');
```

**Resultado esperado:** 2 linhas retornadas

## Resumo das Mudanças

### Backend (Database)
- ✅ Nova política RLS para INSERT de participantes
- ✅ Nova política RLS para líderes gerenciarem tarefas

### Frontend
- ✅ Validação aprimorada de formulário
- ✅ Feedback de erro melhorado
- ✅ Estado de loading adequado
- ✅ Validação de data mínima

### Serviço
- ✅ Logging detalhado para debug
- ✅ Validação de group_id
- ✅ Mensagens de erro claras
- ✅ Detecção de erros RLS

## Impacto

**Antes da correção:**
- ❌ Apenas criadores de grupos podiam criar tarefas
- ❌ Membros e líderes não conseguiam criar tarefas
- ❌ Erros silenciosos (sem feedback claro)

**Após a correção:**
- ✅ Qualquer participante pode criar tarefas
- ✅ Líderes têm controle total sobre tarefas do grupo
- ✅ Validação robusta no frontend
- ✅ Feedback claro de erros
- ✅ Logging detalhado para debug

## Próximos Passos

1. [ ] Aplicar a migration no banco de dados
2. [ ] Executar todos os testes listados acima
3. [ ] Validar com queries do arquivo de validação
4. [ ] Testar em ambiente de staging
5. [ ] Deploy para produção
6. [ ] Monitorar logs de erro após deploy

## Notas Técnicas

- As novas políticas RLS não afetam as políticas existentes
- A ordem das políticas RLS não importa (Supabase usa OR lógico)
- Managers, HR e Admin continuam tendo acesso total via política existente
- Assignees continuam podendo gerenciar suas próprias tarefas
- Criadores de grupos continuam tendo controle total sobre o grupo

## Contato

Se houver problemas após a aplicação da correção, verifique:
1. Se a migration foi aplicada com sucesso
2. Se não há conflito com outras políticas RLS
3. Os logs do console do navegador
4. Os logs do servidor Supabase
