# 🚀 Quick Start: Aplicar Correção de Criação de Tarefas

## Resumo do Problema
Tarefas não eram salvas no banco ao serem criadas dentro de grupos de ação porque as políticas RLS (Row Level Security) não permitiam que participantes dos grupos criassem tarefas.

## Correção Aplicada
✅ Nova política RLS para permitir INSERT por participantes do grupo  
✅ Nova política RLS para líderes gerenciarem tarefas  
✅ Validação aprimorada no frontend  
✅ Logging detalhado para debug  

## Como Aplicar (Escolha uma opção)

### Opção 1: Supabase Dashboard (Recomendado)
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo: `supabase/migrations/20251029000000_fix_task_creation_rls.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Cmd/Ctrl + Enter)
8. Aguarde confirmação de sucesso

### Opção 2: Via CLI do Supabase
```bash
cd /workspace
supabase db push
```

### Opção 3: Via psql (se tiver acesso direto)
```bash
psql "$DATABASE_URL" -f supabase/migrations/20251029000000_fix_task_creation_rls.sql
```

## Validar a Correção

### Teste Rápido via SQL
```sql
-- Verificar se as políticas foram criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks'
  AND policyname IN ('tasks_group_participants_insert', 'tasks_group_leaders_manage');
```

**Resultado esperado:** 2 linhas

### Teste na Interface
1. Faça login na aplicação
2. Acesse **Grupos de Ação**
3. Abra um grupo existente (ou crie um novo)
4. Clique em **+ Tarefa**
5. Preencha:
   - Título: "Teste de criação de tarefa"
   - Responsável: Selecione um participante
   - Prazo: Amanhã
6. Clique em **Criar Tarefa**
7. ✅ A tarefa deve aparecer na lista imediatamente

## Arquivos Modificados

### 1. Database Migration (DEVE SER APLICADA)
- `supabase/migrations/20251029000000_fix_task_creation_rls.sql`

### 2. Código Frontend (já atualizado no repositório)
- `src/pages/ActionGroups.tsx` - Validação e feedback melhorados
- `src/services/actionGroups.ts` - Logging detalhado

### 3. Documentação (para referência)
- `BUG_FIX_TASK_CREATION_SUMMARY.md` - Análise completa do bug
- `TASK_CREATION_FIX_VALIDATION.sql` - Queries de validação

## Troubleshooting

### ❌ Erro: "policy already exists"
```sql
-- Remove as políticas antigas e recrie
DROP POLICY IF EXISTS tasks_group_participants_insert ON tasks;
DROP POLICY IF EXISTS tasks_group_leaders_manage ON tasks;
-- Depois execute a migration novamente
```

### ❌ Tarefa ainda não é criada
1. Abra o Console do navegador (F12)
2. Vá em Grupos de Ação e tente criar uma tarefa
3. Procure por logs que começam com `👥 ActionGroups:`
4. Verifique se há erros de permissão
5. Execute as queries de validação em `TASK_CREATION_FIX_VALIDATION.sql`

### ❌ "Sem permissão para criar tarefa"
Verifique se o usuário é participante do grupo:
```sql
SELECT 
  ag.title,
  p.name as user_name,
  agp.role
FROM action_group_participants agp
JOIN action_groups ag ON agp.group_id = ag.id
JOIN profiles p ON agp.profile_id = p.id
WHERE p.email = 'seu-email@exemplo.com';  -- Substitua pelo email do usuário
```

## Checklist de Validação

- [ ] Migration aplicada com sucesso
- [ ] 2 novas políticas aparecem na query de validação
- [ ] Login como Admin → pode criar tarefas ✅
- [ ] Login como RH → pode criar tarefas ✅
- [ ] Login como Gestor (criador) → pode criar tarefas ✅
- [ ] Login como Líder do grupo → pode criar tarefas ✅
- [ ] Login como Membro do grupo → pode criar tarefas ✅
- [ ] Tarefa aparece na lista após criação ✅
- [ ] Tarefa aparece no banco de dados ✅
- [ ] Notificação é enviada ao responsável ✅

## O Que Mudou?

### Antes ❌
- Apenas criador do grupo, managers, HR e admin podiam criar tarefas
- Participantes regulares (mesmo líderes) não conseguiam criar tarefas
- Erros não eram claros

### Depois ✅
- **TODOS os participantes** podem criar tarefas no grupo
- Líderes têm controle total sobre tarefas
- Validação robusta com feedback claro
- Logging detalhado para debug

## Suporte

Se o problema persistir:
1. Verifique os logs do console do navegador
2. Execute todas as queries em `TASK_CREATION_FIX_VALIDATION.sql`
3. Verifique o documento completo: `BUG_FIX_TASK_CREATION_SUMMARY.md`
4. Procure por erros no Supabase Dashboard → Logs

## Notas Importantes

⚠️ **A migration DEVE ser aplicada no banco de dados**  
⚠️ As mudanças no código frontend já estão no repositório  
✅ Não há breaking changes - correção é retrocompatível  
✅ Managers, HR e Admin mantêm acesso total  
