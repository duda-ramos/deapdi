# Revisão de Responsividade e UX do TalentFlow

## 1. Visão Geral da Auditoria
- **Escopo avaliado:** layout base (`Layout`, `Sidebar`, `Header`), fluxos públicos (`Login`, `Onboarding`) e áreas principais autenticadas (Dashboard, Perfil, Grupos de Ação, PDI, Área de RH, Mentoria e módulos administrativos).
- **Stack de UI:** React + Vite + TypeScript com TailwindCSS, ícones Lucide, Recharts e Framer Motion.
- **Objetivo:** alinhar o produto ao mobile-first, reduzir fricções de usabilidade e garantir consistência visual com a cor primária `#9ce819`.

## 2. Diagnóstico dos Principais Pontos de Melhoria

### 2.1 Estrutura e Navegação Global
- `Layout` fixa a altura em `h-screen` e mantém a `Sidebar` sempre visível (`w-64`), o que provoca overflow vertical e lateral em telas menores, além de ocultar conteúdo crítico.【F:src/components/layout/Layout.tsx†L12-L19】【F:src/components/layout/Sidebar.tsx†L54-L92】
- O `Header` utiliza espaçamento horizontal rígido (`px-6`, `w-64`) e mantém busca + avatar + botão alinhados em linha única, causando compressão/recorte em largura inferior a 1024px.【F:src/components/layout/Header.tsx†L12-L41】
- Falta um padrão de navegação móvel (hamburger/drawer). Links longos na `Sidebar` quebram linhas e dificultam toque seguro.

### 2.2 Páginas Públicas
- **Login:** utiliza cartão centralizado com `max-w-md` e espaçamentos generosos que funcionam em desktop, porém não há ajustes de tipografia/espacamento para <360px nem feedback de loading no botão primário (apenas estado `disabled`).【F:src/components/Login.tsx†L94-L198】
- **Onboarding:** usar carrossel? (não analisado detalhado) -> revisar foco e breadcrumbs.

### 2.3 Páginas Autenticadas
- **Dashboard:** grids definidas com `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` funcionam, mas cards possuem conteúdos com títulos/descrições sem truncamento, gráficos Recharts não se ajustam a alturas menores e o bloco de boas-vindas fixa ícone grande na direita, ocultado em mobile sem alternativa visual.【F:src/pages/Dashboard.tsx†L63-L148】
- **Perfil:** header com botões de ação em linha (`flex items-center justify-between`) sem quebra em mobile; grid de detalhes (`lg:grid-cols-3`) não define gaps específicos para colunas únicas e botões (Salvar/Cancelar) ficam lado a lado sem `wrap`.【F:src/pages/Profile.tsx†L91-L152】
- **Grupos de Ação e PDI:** formulários modais com múltiplos campos ficam em uma coluna alta sem agrupamento ou scroll interno controlado. Listas usam `grid` em colunas fixas, mas cards possuem toolbars horizontais com muitos botões (p.e., `Button` dentro de `Card` com ícones) que extrapolam em telas pequenas.【F:src/pages/ActionGroups.tsx†L1-L120】【F:src/pages/PDI.tsx†L1-L120】
- **Headers secundários:** vários módulos usam `flex justify-between` com ações no canto direito (ex.: botões "Criar"), porém sem comportamento responsivo (não quebram em coluna, não viram `fab`).

### 2.4 Componentes Compartilhados
- `Card` aplica sombra/hover com `scale` via Framer Motion, que pode gerar jitter em mobile; faltam opções de densidade e suporte a cabeçalho/rodapé responsivos.【F:src/components/ui/Card.tsx†L1-L23】
- Botões (`Button`) e inputs (`Input`, `Select`) não utilizam `min-height`/`min-width` para toque confortável (~44px) e carecem de estados visuais para `loading`, `focus-visible` e `disabled` padronizados.
- `Modal` (não exibido aqui) deve validar travas de foco e suportar altura dinâmica com rolagem interna.

## 3. Recomendações Específicas (Mobile-first & Responsividade)

### 3.1 Layout e Navegação
- Implementar `Layout` adaptativo com `Sidebar` colapsável: usar `lg:grid` com colunas ou `flex` onde em breakpoints `<lg` a barra vira drawer controlado por `Disclosure`/`Dialog` (Headless UI) ou `useState`. Garantir foco no primeiro link ao abrir.
- Substituir `h-screen` por `min-h-screen` + `min-h-0` em containers internos; envolver `main` em `overflow-y-auto` somente quando necessário, evitando duplas barras.
- Criar `Header` responsivo com `grid` ou `flex-wrap`: busca com largura `w-full sm:w-72`, avatar e botão reorganizados em menu de usuário via `Popover`.

### 3.2 Breakpoints e tokens de design
- Adotar escala mobile-first com breakpoints Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Utilizar `@media (min-width: …)` apenas para incrementos progressivos.
- Definir tokens no `tailwind.config.js`: `colors.primary = '#9ce819'`, `colors.primaryDark`, `colors.primaryLight`; `fontSize` usando `clamp` (`text-base` = `clamp(0.95rem, 2vw, 1rem)`).
- Ajustar `spacing` padrão para `4/6/8/12/16` px equivalentes (Tailwind `1/1.5/2/3/4` rem) e garantir `gap-y` consistente.

### 3.3 Componentes Interativos
- **Botões:** garantir altura mínima `min-h-[44px]`, padding horizontal `px-4` mobile, `px-5` desktop; usar `focus-visible:outline-primary` com cor `#9ce819`. Quando `loading`, substituir conteúdo por `Spinner` e aplicar `aria-busy`.
- **Inputs/Selects:** adicionar rótulos persistentes + `aria-describedby` para mensagens de erro. Expandir `Select` para ocupar 100% e adotar `text-sm` + `text-base md:text-sm` dependendo do contexto.
- **Modais:** limitar largura a `w-full sm:max-w-lg`, adicionar `max-h-[85vh]` e `overflow-y-auto`, e prender foco com `aria-modal` + `initialFocus`.

### 3.4 Layouts por página
- **Login:** reduzir padding do cartão para `p-6 sm:p-8`, alinhar toggle em coluna em `<360px`, e inserir `Button` com spinner `loading={isLoading}`. Ajustar tipografia com `text-2xl sm:text-3xl`. Considerar CTA secundário ("Esqueci minha senha").
- **Dashboard:** reorganizar cabeçalho para `flex-col md:flex-row`, garantir que gráficos usem `minHeight` com `height={240}` + `className="!w-full"` e que cards usem `gap-3`. Para cards de estatísticas, usar `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` e `aspect-[4/3]` para uniformidade.
- **Perfil:** permitir `flex-wrap` nos botões, ajustar `grid` para `lg:grid-cols-[1fr_2fr]` e colapsar timeline sob cartão principal. Inputs em edição devem respeitar `space-y-4`.
- **Grupos de Ação/PDI:** transformar toolbars em `flex flex-wrap gap-2`, usar `Accordion` para detalhes, e modais com `stepper` quando houver muitos campos. Para listas, usar `divide-y` em mobile ao invés de `grid` horizontal.

### 3.5 Acessibilidade e Feedback Visual
- Aplicar `aria-current="page"` nos links ativos do menu, `aria-expanded`/`aria-controls` em toggles de sidebar/hamburger.
- Garantir contraste mínimo 4.5:1; usar `#2f2f2f` para texto e `#9ce819` para destaques com `hover:bg-primaryDark`.
- Adicionar feedback `hover`, `active`, `focus-visible`, `disabled` e `aria-live` para mensagens de sucesso/erro.

## 4. Exemplos de Refatoração (Componentes-chave)

### 4.1 Layout + Sidebar responsivos
```tsx
// src/components/layout/Layout.tsx (exemplo de refatoração)
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onOpenMenu={() => setMobileOpen(true)} />

      <div className="mx-auto flex w-full max-w-7xl">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-[calc(100vh-4.5rem)] w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        <main className="min-h-[calc(100vh-4.5rem)] flex-1 overflow-x-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <Transition show={mobileOpen} as={Fragment}>
        <Dialog onClose={setMobileOpen} className="relative z-50 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition-transform ease-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 left-0 w-72 max-w-full bg-white shadow-xl">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>

      <button
        type="button"
        className="fixed bottom-6 left-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </div>
  );
};
```

### 4.2 DashboardCard adaptativo
```tsx
// src/components/dashboard/DashboardCard.tsx (novo componente)
import { ReactNode } from 'react';

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  helper?: string;
  variant?: 'default' | 'success' | 'warning';
}

const variantStyles: Record<NonNullable<DashboardCardProps['variant']>, string> = {
  default: 'bg-white text-slate-900',
  success: 'bg-emerald-50 text-emerald-900',
  warning: 'bg-amber-50 text-amber-900',
};

export function DashboardCard({ icon, title, value, helper, variant = 'default' }: DashboardCardProps) {
  return (
    <article
      className={`group flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-100 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-within:outline focus-within:outline-2 focus-within:outline-primary ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Atualizado agora</span>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
        <p className="text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
        {helper && <p className="text-sm text-slate-500 sm:text-xs">{helper}</p>}
      </div>
    </article>
  );
}
```

- Usar esse componente em grids `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4` e, em mobile, aplicar `snap-x snap-mandatory overflow-x-auto` para permitir rolagem horizontal sem cortar cards.

### 4.3 Modal focado e responsivo
```tsx
// src/components/ui/Modal.tsx (trecho sugerido)
<div
  className="relative mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl focus:outline-none sm:p-8"
  role="dialog"
  aria-modal="true"
>
  <div className="max-h-[75vh] space-y-5 overflow-y-auto pr-2">
    {children}
  </div>
  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
    <Button type="submit" loading={loading} className="bg-primary hover:bg-primary-dark">
      Salvar
    </Button>
  </div>
</div>
```

## 5. Correções para Conteúdos Sobrepostos
- Adicionar `flex-wrap` e `gap-3` em containers de ações (`justify-between`) para evitar que botões invadam títulos em mobile (ex.: Perfil, Dashboard).【F:src/pages/Profile.tsx†L99-L134】【F:src/pages/Dashboard.tsx†L109-L148】
- Para toolbars com muitos ícones (Grupos de Ação), usar `overflow-x-auto` com `scrollbar-thin` ou converter em menu `kebab` (`Menu` + `Dropdown`) em `<md`.
- Garantir que gráficos tenham `min-width` 0 e envolvê-los em `overflow-hidden rounded-2xl` para evitar que legendas apareçam sobrepostas.

## 6. Checklist de Validação Manual
1. **Viewport pequenos (320px, 360px, 414px):** verificar se não há scroll horizontal, textos recortados ou botões colados nas bordas.
2. **Breakpoints sm/md/lg:** abrir o DevTools responsivo (Chrome → `Ctrl+Shift+M`) e validar Layout, Dashboard, Perfil, PDI e Grupos.
3. **Navegação móvel:** acionar botão hamburger → confirmar foco inicial no primeiro link, fechamento por `Esc` e por clique em backdrop.
4. **Formulários:** testar teclado virtual (mobile) para inputs de Login/PDI. Conferir que o layout não sobe/oculta campos ao abrir o teclado.
5. **Modais:** abrir modais de criação/edição → verificar rolagem interna, foco mantido dentro, botões acessíveis com `Tab`.
6. **Feedbacks:** disparar estados `loading`/`erro`/`sucesso` e certificar que mensagens aparecem abaixo dos campos com leitura de screen readers (`aria-live`).
7. **Gráficos:** encolher altura <600px e garantir que componentes Recharts reajustam altura e não exibem tooltip fora da viewport.
8. **Contraste:** usar extensão Lighthouse/axe para validar contraste em textos sobre fundos coloridos (especialmente `#9ce819`).
9. **Gestos touch:** testar rolagem de listas longas, arrastar modais, clique nos cards (sem hover). Garantir distância mínima de 44px entre interações.
10. **Performance:** inspecionar `Performance insights` no DevTools para garantir que animações (Framer Motion) não travam em 60fps.

---
Essas recomendações priorizam uma experiência coesa em dispositivos móveis e desktop, reforçando consistência visual com a paleta `#9ce819`, melhorando acessibilidade e garantindo escalabilidade para novos módulos.
