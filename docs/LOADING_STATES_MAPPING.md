# Mapeamento de Estados de Loading

## Componentes

```tsx
// Skeletons
import {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  // Variantes específicas
  CardSkeletonGrid,
  UserTableSkeleton,
  ActionListSkeleton,
  NotificationListSkeleton,
  PDIFormSkeleton,
} from '@/components/ui/skeleton';

// Mensagens contextuais
import { loadingMessages, getLoadingMessage } from '@/lib/errorMessages';
```

---

## Skeleton Screens por Contexto

### Lista de PDIs

```tsx
import { CardSkeletonGrid } from '@/components/ui/skeleton';

const PDIList: React.FC = () => {
  const { data, isLoading } = usePDIs();

  if (isLoading) {
    return <CardSkeletonGrid count={6} variant="pdi" columns={2} />;
  }

  return <div>{/* render PDIs */}</div>;
};
```

### Tabela de Usuários

```tsx
import { UserTableSkeleton } from '@/components/ui/skeleton';

const UserManagement: React.FC = () => {
  const { users, isLoading } = useUsers();

  if (isLoading) {
    return <UserTableSkeleton rows={10} />;
  }

  return <Table>{/* render users */}</Table>;
};
```

### Lista de Ações

```tsx
import { ActionListSkeleton } from '@/components/ui/skeleton';

const ActionList: React.FC = () => {
  const { actions, isLoading } = useActions();

  if (isLoading) {
    return <ActionListSkeleton count={8} />;
  }

  return <ul>{/* render actions */}</ul>;
};
```

### Dashboard Cards

```tsx
import { CardSkeleton } from '@/components/ui/skeleton';

const DashboardMetrics: React.FC = () => {
  const { metrics, isLoading } = useMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <CardSkeleton key={i} variant="dashboard" />
        ))}
      </div>
    );
  }

  return <div>{/* render metrics */}</div>;
};
```

---

## Mapeamento Completo

### Queries (hooks/)

| Hook | Skeleton | Mensagem |
|------|----------|----------|
| `usePDIs` | `CardSkeletonGrid` variant="pdi" | "Carregando PDIs..." |
| `useCompetencies` | `CardSkeletonGrid` variant="simple" | "Carregando competências..." |
| `useMentorships` | `ListSkeleton` variant="detailed" | "Carregando sessões..." |
| `useNotifications` | `NotificationListSkeleton` | "Carregando notificações..." |
| `useTasks` | `TaskListSkeleton` | "Carregando tarefas..." |
| `useUsers` | `UserTableSkeleton` | "Carregando usuários..." |
| `useWellnessResources` | `CardSkeletonGrid` variant="simple" | "Carregando recursos..." |
| `useCalendarEvents` | `ListSkeleton` variant="simple" | "Carregando eventos..." |
| `useTeams` | `TableSkeleton` | "Carregando equipes..." |

### Mutations (lib/api/)

| Operação | Mensagem de Loading |
|----------|---------------------|
| `createPDI` | "Criando PDI..." |
| `updatePDI` | "Salvando alterações..." |
| `deletePDI` | "Excluindo PDI..." |
| `addCompetency` | "Adicionando competência..." |
| `removeCompetency` | "Removendo competência..." |
| `createAction` | "Criando ação..." |
| `completeAction` | "Marcando como concluída..." |
| `scheduleMentorship` | "Agendando sessão..." |
| `cancelMentorship` | "Cancelando sessão..." |
| `createCheckin` | "Registrando check-in..." |
| `updateProfile` | "Salvando perfil..." |
| `uploadAvatar` | "Enviando foto..." |
| `signIn` | "Entrando..." |
| `signUp` | "Criando conta..." |
| `sendInvite` | "Enviando convite..." |
| `generateReport` | "Gerando relatório..." |
| `exportData` | "Exportando dados..." |

---

## Loading Contextual

### Em vez de Spinner Genérico

```tsx
// ❌ Antes
<button disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Salvar'}
</button>

// ✅ Depois
<Button loading={isLoading} loadingText="Salvando PDI...">
  Salvar
</Button>
```

### Mensagens Centralizadas

```tsx
import { getLoadingMessage } from '@/lib/errorMessages';

// Uso
const message = getLoadingMessage('pdi.saving'); // "Salvando alterações..."
const message = getLoadingMessage('auth.signIn'); // "Entrando..."
```

---

## Barra de Progresso

### Para Operações Longas

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

const FileUpload: React.FC = () => {
  const [progress, setProgress] = useState(0);
  
  const handleUpload = async (file: File) => {
    // Upload com progresso
    await uploadFile(file, (percent) => setProgress(percent));
  };

  return (
    <div>
      {progress > 0 && progress < 100 && (
        <div className="mt-4">
          <p className="text-sm text-slate-600 mb-2">
            Enviando arquivo... {progress}%
          </p>
          <ProgressBar value={progress} max={100} />
        </div>
      )}
    </div>
  );
};
```

### Uso Recomendado

| Operação | Tipo de Feedback |
|----------|------------------|
| Upload de arquivo | Barra de progresso |
| Geração de relatório PDF | Barra de progresso |
| Importação em massa | Barra de progresso |
| Exportação de dados | Barra de progresso |
| Sincronização | Toast + indicador |

---

## Loading Otimista

### Marcar Notificação como Lida

```tsx
const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const [optimisticRead, setOptimisticRead] = useState(notification.read);
  
  const handleMarkRead = async () => {
    // UI imediata
    setOptimisticRead(true);
    
    try {
      await markAsRead(notification.id);
    } catch (error) {
      // Reverter se falhar
      setOptimisticRead(false);
      toast.error('Não foi possível marcar como lida');
    }
  };
  
  return (
    <div className={optimisticRead ? 'opacity-60' : ''}>
      {/* ... */}
    </div>
  );
};
```

### Toggle de Estado

```tsx
const TaskCheckbox: React.FC<{ task: Task }> = ({ task }) => {
  const [isComplete, setIsComplete] = useState(task.completed);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleToggle = async () => {
    const newState = !isComplete;
    
    // Otimista
    setIsComplete(newState);
    setIsSaving(true);
    
    try {
      await updateTask(task.id, { completed: newState });
    } catch {
      // Reverter
      setIsComplete(!newState);
      toast.error('Erro ao atualizar tarefa');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Checkbox 
      checked={isComplete} 
      onChange={handleToggle}
      disabled={isSaving}
      aria-busy={isSaving}
    />
  );
};
```

### Adicionar Item à Lista

```tsx
const ActionList: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  
  const handleAddAction = async (data: ActionInput) => {
    // Criar item temporário
    const tempAction: Action = {
      ...data,
      id: `temp-${Date.now()}`,
      status: 'saving',
    };
    
    // Adicionar à lista
    setActions(prev => [...prev, tempAction]);
    setPendingAction(tempAction);
    
    try {
      const newAction = await createAction(data);
      // Substituir temporário pelo real
      setActions(prev => 
        prev.map(a => a.id === tempAction.id ? newAction : a)
      );
    } catch {
      // Remover temporário
      setActions(prev => prev.filter(a => a.id !== tempAction.id));
      toast.error('Não foi possível criar a ação');
    } finally {
      setPendingAction(null);
    }
  };
  
  return (
    <ul>
      {actions.map(action => (
        <li 
          key={action.id}
          className={action.status === 'saving' ? 'opacity-60' : ''}
        >
          {action.title}
          {action.status === 'saving' && <span>Salvando...</span>}
        </li>
      ))}
    </ul>
  );
};
```

---

## Padrões por Tipo de Operação

### Query (GET)

```tsx
if (isLoading) return <Skeleton />;
```

### Mutation (POST/PUT/DELETE)

```tsx
<Button loading={isSaving}>
  Salvar
</Button>
```

### Background Sync

```tsx
<Toast>Sincronizando...</Toast>
```

---

## Acessibilidade

- [x] `aria-busy="true"` em elementos em loading
- [x] `aria-label` descritivo em skeletons
- [x] `role="status"` para anúncios
- [x] Animações respeitam `prefers-reduced-motion`
- [x] Texto alternativo para screen readers

### Exemplo

```tsx
<div 
  role="status" 
  aria-busy="true" 
  aria-label="Carregando lista de PDIs"
>
  <CardSkeletonGrid count={6} variant="pdi" />
</div>
```

---

## Validações

- [ ] Toda lista tem skeleton correspondente
- [ ] Mensagens de loading são contextuais
- [ ] Barra de progresso em uploads
- [ ] Loading otimista em ações rápidas
- [ ] `aria-busy` em elementos loading
- [ ] Feedback visual claro (não apenas spinner)
- [ ] Timeout com mensagem de erro apropriada
