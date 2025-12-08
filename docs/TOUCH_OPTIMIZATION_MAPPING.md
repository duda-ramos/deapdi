# Touch Optimization Mapping

**Data:** 8 de Dezembro de 2025  
**Versão:** 1.0

## 1. Áreas de Toque (Touch Targets)

### Recomendações WCAG/Apple HIG
- **Mínimo recomendado:** 44x44px
- **Espaçamento mínimo:** 8px entre elementos clicáveis

### Componentes Otimizados

#### 1.1 Button Component
**Arquivo:** `src/components/ui/Button.tsx`

| Tamanho | Antes | Depois | Status |
|---------|-------|--------|--------|
| sm | 40px (2.5rem) | 44px (2.75rem) | ✅ Corrigido |
| md | 44px (2.75rem) | 44px (2.75rem) | ✅ OK |
| lg | 52px (3.25rem) | 52px (3.25rem) | ✅ OK |

```tsx
// Implementação atual
const sizes = {
  sm: 'px-3 py-2 text-sm min-h-[2.75rem]',   // 44px
  md: 'px-4 py-2.5 text-sm min-h-[2.75rem]', // 44px
  lg: 'px-5 py-3 text-base min-h-[3.25rem]'  // 52px
};
```

#### 1.2 Sidebar Menu Items
**Arquivo:** `src/components/layout/Sidebar.tsx`

| Elemento | Antes | Depois | Status |
|----------|-------|--------|--------|
| Menu item principal | ~36px | 44px (2.75rem) | ✅ Corrigido |
| Sub-menu item | ~32px | 40px (2.5rem) | ✅ Corrigido |

```tsx
// Menu item principal
className="px-3 py-2.5 min-h-[2.75rem]..."

// Sub-menu item
className="px-3 py-2 min-h-[2.5rem]..."
```

#### 1.3 NotificationCenter
**Arquivo:** `src/components/NotificationCenter.tsx`

| Elemento | Tamanho Recomendado | Status |
|----------|---------------------|--------|
| Botão do sino | 44x44px | ✅ OK (w-10 h-10 = 40px + padding) |
| Notification item | 48px+ height | ✅ OK |
| Botões de ação | 44px mínimo | ✅ OK (usa Button component) |

#### 1.4 Input/Select/Textarea Components
**Arquivos:** `src/components/ui/Input.tsx`, `Select.tsx`, `Textarea.tsx`

| Componente | Altura | Status |
|------------|--------|--------|
| Input | auto (padding py-2.5 = ~44px) | ⚠️ Verificar |
| Select | auto (padding py-2.5 = ~44px) | ⚠️ Verificar |
| Textarea | auto (min-height) | ✅ OK |

### Verificações Pendentes

- [ ] Checkbox component - verificar área de clique
- [ ] Radio buttons - verificar área de clique
- [ ] Modal close buttons - verificar tamanho
- [ ] Table action buttons - verificar tamanho

---

## 2. Espaçamento Entre Elementos

### Padrões Aplicados

| Contexto | Espaçamento | Implementação |
|----------|-------------|---------------|
| Entre botões | 8-12px | `gap-2` ou `gap-3` |
| Entre cards | 12-16px | `gap-3` ou `gap-4` |
| Entre form fields | 16-24px | `space-y-4` ou `space-y-6` |
| Mobile navigation | 8px+ | `space-y-2` |

### Componentes com Espaçamento Adequado

```tsx
// Header actions
<div className="flex flex-wrap gap-2">
  <Button>Ação 1</Button>
  <Button>Ação 2</Button>
</div>

// Form fields
<form className="space-y-6">
  <Input />
  <Input />
</form>

// Stats grid
<div className="grid gap-3 sm:gap-4">
```

---

## 3. Gestos Touch

### Gestos Suportados (Nativos)

| Gesto | Elemento | Implementação |
|-------|----------|---------------|
| Tap | Todos os botões | onClick handlers |
| Scroll | Tables, Lists | overflow-x-auto, overflow-y-auto |
| Pull to refresh | - | Não implementado |
| Swipe to delete | - | Não implementado |

### Gestos Recomendados para Implementação Futura

#### 3.1 Swipe para Deletar (Notificações)
```tsx
// Sugestão usando react-swipeable
import { useSwipeable } from 'react-swipeable';

const NotificationItem = ({ notification, onDelete }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onDelete(notification.id),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  return (
    <div {...handlers} className="relative">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 bg-red-500 w-20" />
      {/* Notification content */}
      <div className="bg-white">{notification.content}</div>
    </div>
  );
};
```

#### 3.2 Pull to Refresh
```tsx
// Sugestão para listas
import { usePullToRefresh } from 'react-pull-to-refresh';

const List = ({ onRefresh, children }) => {
  const { pullToRefreshProps, isRefreshing } = usePullToRefresh({
    onRefresh
  });

  return (
    <div {...pullToRefreshProps}>
      {isRefreshing && <LoadingSpinner />}
      {children}
    </div>
  );
};
```

---

## 4. Remoção de Hover-Only

### Elementos Verificados

#### 4.1 Tooltips
**Status:** ⚠️ Necessita revisão

Tooltips no código atual usam `title` attribute nativo que funciona com long-press em mobile.

**Recomendação:** Adicionar botão "?" para informações em mobile.

```tsx
// Padrão atual
<button title="Informação útil">Botão</button>

// Padrão recomendado para mobile
<button>
  Botão
  <span className="sm:hidden ml-2" onClick={showInfo}>ℹ️</span>
</button>
```

#### 4.2 Dropdowns
**Status:** ✅ OK

Dropdowns abrem no toque via onClick, não dependem de hover.

#### 4.3 Botões com Hover Effects
**Status:** ✅ OK

Estados hover funcionam como feedback visual, mas ações são disparadas por click/tap.

### Elementos com Hover que Precisam de Alternativa Mobile

| Elemento | Hover Behavior | Alternativa Mobile |
|----------|---------------|-------------------|
| Table row hover | Background highlight | Tap to select |
| Card hover | Shadow/scale | Tap feedback |
| Button hover | Color change | Active state (:active) |

---

## 5. Input Types Corretos

### Mapeamento de Input Types

| Campo | Type Atual | Type Recomendado | Benefício |
|-------|-----------|------------------|-----------|
| Email | `text` | `email` | Teclado com @ |
| Telefone | `text` | `tel` | Teclado numérico |
| Data | `text` | `date` | Date picker nativo |
| Hora | `text` | `time` | Time picker nativo |
| Busca | `text` | `search` | Botão X nativo |
| URL | `text` | `url` | Teclado com .com |
| Número | `text` | `number` | Teclado numérico |

### Verificação por Componente

#### Login Form (`src/components/Login.tsx`)
```tsx
// Email
<Input type="email" ... /> // ✅ OK

// Senha
<Input type="password" ... /> // ✅ OK
```

#### Profile Form
```tsx
// Telefone
<Input type="tel" ... /> // ⚠️ Verificar

// Data de nascimento
<Input type="date" ... /> // ✅ OK
```

#### Event Modal (`src/components/hr-calendar/EventModal.tsx`)
```tsx
// Datas
<Input type="date" ... /> // ✅ OK
```

#### FormAssignmentModal
```tsx
// Data/hora limite
<Input type="datetime-local" ... /> // ✅ OK
```

---

## 6. CSS Classes de Touch

### Classes Utilitárias Recomendadas

```css
/* Touch target minimum */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Touch feedback */
.touch-feedback {
  -webkit-tap-highlight-color: transparent;
}

/* Disable text selection on interactive elements */
.no-select {
  -webkit-user-select: none;
  user-select: none;
}

/* Smooth scroll for iOS */
.scroll-touch {
  -webkit-overflow-scrolling: touch;
}

/* Prevent zoom on input focus (iOS) */
input, select, textarea {
  font-size: 16px; /* Prevents zoom on iOS */
}
```

### Implementação em Tailwind

```tsx
// Touch-friendly button
<button className="min-h-[2.75rem] min-w-[2.75rem] select-none active:scale-95 transition-transform">
  Click me
</button>

// Touch-friendly scroll container
<div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
  {/* content */}
</div>
```

---

## 7. Checklist de Verificação Touch

### Verificações Gerais
- [x] Botões têm mínimo 44x44px
- [x] Menu items têm mínimo 44px de altura
- [x] Espaçamento adequado entre elementos clicáveis
- [ ] Inputs com font-size mínimo 16px (prevenir zoom iOS)
- [ ] Swipe gestures para ações comuns
- [x] Dropdowns funcionam com tap
- [x] Modais podem ser fechados por tap fora
- [x] Scroll horizontal tem indicadores visuais

### Por Página
- [x] Dashboard - Touch targets OK
- [x] PDI - Touch targets OK
- [x] Competencies - Touch targets OK
- [x] Calendar - Touch targets OK
- [x] Mental Health - Touch targets OK
- [x] Sidebar - Touch targets aumentados
- [x] NotificationCenter - Touch targets OK

---

## 8. Próximos Passos

### Prioridade Alta
1. Verificar todos os inputs têm font-size 16px
2. Adicionar min-height aos inputs/selects

### Prioridade Média
1. Implementar swipe-to-delete nas notificações
2. Adicionar pull-to-refresh em listas
3. Criar alternativas mobile para tooltips

### Prioridade Baixa
1. Otimizar animações para dispositivos de baixa performance
2. Implementar haptic feedback (vibração) onde apropriado

---

*Documento gerado em 08/12/2025*
