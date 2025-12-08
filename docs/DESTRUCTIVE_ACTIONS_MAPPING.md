# Mapeamento de Ações Destrutivas

## Componente

```tsx
import { 
  ConfirmDialog, 
  useConfirm, 
  destructiveActions 
} from '@/components/ui/ConfirmDialog';
```

## Uso Básico

```tsx
// Hook useConfirm
const { confirm, ConfirmDialogComponent } = useConfirm(destructiveActions.deletePDI('Meu PDI'));

const handleDelete = async () => {
  const confirmed = await confirm();
  if (confirmed) {
    await deletePDI(id);
  }
};

return (
  <>
    <button onClick={handleDelete}>Excluir</button>
    <ConfirmDialogComponent />
  </>
);
```

---

## Ações por Módulo

### PDI

| Ação | Título | Descrição | Variante |
|------|--------|-----------|----------|
| Excluir PDI | "Excluir PDI?" | "Este PDI será excluído permanentemente. Todo o progresso e ações associadas serão perdidos." | danger |
| Cancelar PDI | "Cancelar PDI?" | "Este PDI será cancelado. Você poderá reativá-lo posteriormente se necessário." | warning |
| Remover competência | "Remover competência?" | "Esta competência será removida do PDI. O progresso registrado será perdido." | danger |

### Competências (Admin)

| Ação | Título | Descrição | Variante |
|------|--------|-----------|----------|
| Excluir competência | "Excluir competência?" | "Esta competência será excluída permanentemente. Todos os PDIs que a utilizam serão afetados." | danger |
| Resetar progresso | "Resetar progresso?" | "Todo o progresso será zerado. Esta ação não pode ser desfeita." | warning |

### Ações/Tarefas

| Ação | Título | Descrição | Variante |
|------|--------|-----------|----------|
| Excluir ação | "Excluir ação?" | "Esta ação será excluída permanentemente." | danger |
| Excluir tarefa | "Excluir tarefa?" | "Esta tarefa será excluída permanentemente." | danger |
| Cancelar em andamento | "Cancelar {tipo} em andamento?" | "Esta {tipo} está em andamento. Deseja realmente cancelar?" | warning |

### Mentoria

| Ação | Título | Descrição | Variante |
|------|--------|-----------|----------|
| Cancelar sessão | "Cancelar sessão de mentoria?" | "Esta sessão será cancelada. O mentor e mentorado serão notificados." | warning |
| Recusar solicitação | "Recusar solicitação?" | "Esta solicitação de mentoria será recusada." | danger |

### Saúde Mental

| Ação | Título | Descrição | Variante |
|------|--------|-----------|----------|
| Excluir check-in | "Excluir check-in?" | "Este check-in será excluído permanentemente." | danger |
| Excluir nota terapêutica | "Excluir nota terapêutica?" | "Esta nota será excluída permanentemente. Esta ação não pode ser desfeita." | danger |

### Admin

| Ação | Título | Descrição | Variante | Confirmação Extra |
|------|--------|-----------|----------|-------------------|
| Excluir usuário | "Excluir usuário?" | "Este usuário será removido permanentemente. Todos os dados associados serão perdidos." | danger | Digitar nome do usuário |
| Recusar férias | "Recusar solicitação de férias?" | "Esta solicitação será recusada." | warning | - |
| Excluir evento | "Excluir evento?" | "Este evento será excluído permanentemente. Todos os participantes serão notificados." | danger | - |

---

## Configuração Padrão

```typescript
{
  title: "Excluir PDI?",
  description: "Esta ação não pode ser desfeita. Todo o progresso será perdido.",
  confirmText: "Sim, excluir PDI",
  cancelText: "Cancelar",
  variant: "danger"
}
```

### Variantes

| Variante | Cor | Uso |
|----------|-----|-----|
| `danger` | Vermelho | Exclusões permanentes |
| `warning` | Amarelo | Cancelamentos, alterações reversíveis |
| `info` | Azul | Confirmações informativas |

---

## Preferências "Não Mostrar Novamente"

### Armazenamento
As preferências são salvas em `localStorage` com a chave `confirm-dialog-preferences`:

```typescript
// Obter preferência
import { getDontAskAgainPreference } from '@/components/ui/ConfirmDialog';
const skip = getDontAskAgainPreference('delete-pdi');

// Definir preferência
import { setDontAskAgainPreference } from '@/components/ui/ConfirmDialog';
setDontAskAgainPreference('delete-pdi', true);

// Limpar todas preferências (em Configurações)
import { clearAllDontAskAgainPreferences } from '@/components/ui/ConfirmDialog';
clearAllDontAskAgainPreferences();
```

### Action IDs

| Ação | ID |
|------|----|
| Excluir PDI | `delete-pdi` |
| Cancelar PDI | `cancel-pdi` |
| Remover competência | `remove-competency` |
| Excluir ação | `delete-action` |
| Excluir tarefa | `delete-task` |
| Cancelar sessão mentoria | `cancel-mentorship-session` |
| Excluir check-in | `delete-checkin` |
| Excluir evento | `delete-event` |

---

## Acessibilidade

- [x] `role="alertdialog"` no container
- [x] Foco inicial no botão "Cancelar" (ação segura)
- [x] `Escape` fecha o dialog
- [x] Focus trap dentro do modal
- [x] `aria-labelledby` e `aria-describedby` conectados
- [x] Restaura foco ao elemento anterior ao fechar

---

## Exemplos de Implementação

### Com Hook useConfirm

```tsx
const DeletePDIButton: React.FC<{ pdi: PDI }> = ({ pdi }) => {
  const { confirm, ConfirmDialogComponent } = useConfirm(
    destructiveActions.deletePDI(pdi.title)
  );

  const handleDelete = async () => {
    const confirmed = await confirm();
    if (confirmed) {
      try {
        await deletePDI(pdi.id);
        toast.success('PDI excluído com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir PDI');
      }
    }
  };

  return (
    <>
      <IconButtonWithTooltip
        tooltip="Excluir PDI"
        icon={<Trash2 />}
        variant="danger"
        onClick={handleDelete}
      />
      <ConfirmDialogComponent />
    </>
  );
};
```

### Com ConfirmDialog direto

```tsx
const [isConfirmOpen, setIsConfirmOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

const handleConfirmDelete = async () => {
  setIsDeleting(true);
  try {
    await deleteUser(userId);
    setIsConfirmOpen(false);
  } finally {
    setIsDeleting(false);
  }
};

<ConfirmDialog
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  onConfirm={handleConfirmDelete}
  title="Excluir usuário?"
  description={`O usuário "${userName}" será removido permanentemente.`}
  confirmText="Sim, excluir"
  variant="danger"
  isLoading={isDeleting}
  confirmInput={{
    text: userName,
    label: `Digite "${userName}" para confirmar`,
  }}
/>
```

### Configurações - Resetar Preferências

```tsx
import { 
  clearAllDontAskAgainPreferences,
  getAllDontAskAgainPreferences 
} from '@/components/ui/ConfirmDialog';

const SettingsPage: React.FC = () => {
  const preferences = getAllDontAskAgainPreferences();
  const hasPreferences = Object.keys(preferences).length > 0;

  return (
    <div>
      <h3>Confirmações de Ações</h3>
      {hasPreferences ? (
        <>
          <p>Você ocultou {Object.keys(preferences).length} confirmações.</p>
          <Button onClick={clearAllDontAskAgainPreferences}>
            Restaurar todas as confirmações
          </Button>
        </>
      ) : (
        <p>Todas as confirmações estão ativas.</p>
      )}
    </div>
  );
};
```
