# Plano de Ação - Implementação ARIA

## Visão Geral

Este documento fornece um roadmap executável para implementar as melhorias de acessibilidade identificadas na auditoria.

**Objetivo:** Tornar a aplicação TalentFlow WCAG 2.1 Level AA compliant  
**Prazo Estimado:** 3-4 semanas (40-60 horas de desenvolvimento)  
**Prioridade:** Alta - Acessibilidade é um requisito legal e ético

---

## Fase 1: Fundação (Semana 1) - 8-12 horas

### 1.1 Setup de Ferramentas ⚙️
**Tempo Estimado:** 2 horas

- [ ] Instalar `eslint-plugin-jsx-a11y`
- [ ] Configurar regras no `.eslintrc`
- [ ] Instalar `@axe-core/react` para testes
- [ ] Instalar `jest-axe` para testes unitários
- [ ] Adicionar script de lint de acessibilidade no `package.json`

```bash
npm install --save-dev eslint-plugin-jsx-a11y @axe-core/react jest-axe
```

**Arquivo `.eslintrc.json`:**
```json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error"
  }
}
```

---

### 1.2 Criar Utilitários Base 🔧
**Tempo Estimado:** 3 horas

**Tarefa:** Criar hooks e componentes auxiliares reutilizáveis.

- [ ] Criar `/src/hooks/useAriaId.ts` para IDs únicos
- [ ] Criar `/src/components/ui/VisuallyHidden.tsx` para textos SR-only
- [ ] Criar `/src/components/ui/IconButton.tsx` wrapper com ARIA
- [ ] Criar `/src/components/ui/SearchInput.tsx` com ARIA
- [ ] Atualizar documentação de componentes

**Arquivo `/src/hooks/useAriaId.ts`:**
```typescript
import { useId } from 'react';

interface UseAriaIdResult {
  id: string;
  errorId: string;
  helpId: string;
  labelId: string;
}

export const useAriaId = (prefix?: string): UseAriaIdResult => {
  const reactId = useId();
  const id = prefix ? `${prefix}-${reactId}` : reactId;
  
  return {
    id,
    errorId: `${id}-error`,
    helpId: `${id}-help`,
    labelId: `${id}-label`
  };
};
```

**Arquivo `/src/components/ui/VisuallyHidden.tsx`:**
```typescript
import React from 'react';

export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);
```

---

### 1.3 Corrigir Componentes Base de UI 🎨
**Tempo Estimado:** 5-7 horas

#### Prioridade 1: Componentes Críticos

**1. Textarea.tsx** (30 min)
- [ ] Adicionar sistema de IDs com `useAriaId`
- [ ] Adicionar `aria-invalid`, `aria-describedby`, `aria-required`
- [ ] Conectar label com `htmlFor`
- [ ] Conectar mensagens de erro/ajuda

**2. Checkbox.tsx** (45 min)
- [ ] Adicionar prop `id` e `name`
- [ ] Conectar label com `htmlFor`
- [ ] Adicionar `aria-checked`
- [ ] Adicionar `aria-describedby` para texto de ajuda
- [ ] Adicionar `aria-hidden="true"` no visual decorativo

**3. Select.tsx** (30 min)
- [ ] Adicionar `htmlFor` no label
- [ ] Adicionar `id` no select
- [ ] Adicionar `aria-required`
- [ ] Melhorar estrutura de IDs

**4. ProgressBar.tsx** (30 min)
- [ ] Adicionar `role="progressbar"`
- [ ] Adicionar `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Adicionar `aria-label` ou `aria-labelledby`
- [ ] Adicionar `aria-valuetext` para descrição

**5. Table.tsx** (45 min)
- [ ] Adicionar `aria-label` ou `<caption>`
- [ ] Adicionar `role="status" aria-live="polite"` em estados de loading
- [ ] Adicionar `scope="col"` nos headers
- [ ] Adicionar `aria-rowcount` e `aria-rowindex` (opcional)

**6. AvatarUpload.tsx** (30 min)
- [ ] Adicionar `aria-label` em botões de upload/remoção
- [ ] Adicionar `aria-label` no input file
- [ ] Adicionar `aria-busy` durante upload
- [ ] Melhorar `alt` text do preview

---

## Fase 2: Componentes de Formulários (Semana 2) - 10-14 horas

### 2.1 Componentes de Formulários Especializados 📝
**Tempo Estimado:** 6-8 horas

**1. FormAssignmentModal.tsx** (2h)
- [ ] Adicionar `role="radiogroup"` nos tipos de atribuição
- [ ] Adicionar `role="radio"` e `aria-checked` nos botões
- [ ] Adicionar `role="list"` e `aria-label` na lista de usuários
- [ ] Adicionar `role="listitem"` em cada item

**2. Onboarding.tsx** (3-4h)
- [ ] Adicionar `aria-label` em todos inputs dinâmicos
- [ ] Adicionar `aria-pressed` nos botões de sugestão
- [ ] Adicionar `aria-label` nos botões de remover
- [ ] Garantir IDs únicos em todos checkboxes
- [ ] Adicionar `aria-current="step"` no step ativo
- [ ] Adicionar `aria-label` em cada step do wizard

**3. EventModal.tsx** (1h)
- [ ] Garantir IDs únicos em checkboxes
- [ ] Adicionar `aria-label` nos botões de cor
- [ ] Adicionar `aria-pressed` nos botões de cor

---

### 2.2 Componentes de Saúde Mental 🧠
**Tempo Estimado:** 4-6 horas

**1. EmotionalCheckin.tsx** (1.5h)
- [ ] Adicionar `aria-label` em todos range sliders
- [ ] Adicionar `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- [ ] Adicionar `aria-live="polite"` nos valores
- [ ] Adicionar `aria-hidden="true"` nos ícones decorativos

**2. TaskManager.tsx** (2.5-3h)
- [ ] Adicionar `aria-label` no input de busca
- [ ] Adicionar labels nos selects de filtro
- [ ] Adicionar `aria-label` no botão de filtros
- [ ] Adicionar `role="article"` e `aria-label` nos cards
- [ ] Melhorar `aria-label` dos botões de ação
- [ ] Adicionar `aria-label` nos botões de rating

---

## Fase 3: Componentes de Navegação e Feedback (Semana 3) - 12-16 horas

### 3.1 NotificationCenter.tsx - Refatoração Completa 🔔
**Tempo Estimado:** 4-5 horas

**Prioridade:** ALTA - Componente crítico para UX

- [ ] Adicionar `aria-label` e `aria-expanded` no botão sino
- [ ] Adicionar `aria-label` no badge de contagem
- [ ] Adicionar `role="region"` e `aria-label` no painel
- [ ] Adicionar `aria-label` em botões (Settings, Refresh, Close, Mark as Read, Delete)
- [ ] Adicionar `role="list"` e `aria-label` na lista de notificações
- [ ] Adicionar `role="listitem"` em cada notificação
- [ ] Adicionar `aria-live="polite"` no status de conexão
- [ ] Converter toggles para `role="switch"` com `aria-checked`

**Estrutura Recomendada:**
```tsx
<button 
  aria-label="Centro de notificações"
  aria-expanded={isOpen}
  aria-controls="notification-panel"
>
  <Bell aria-hidden="true" />
  <span aria-label={`${unreadCount} notificações não lidas`}>
    {unreadCount}
  </span>
</button>

<div 
  id="notification-panel"
  role="region"
  aria-label="Painel de notificações"
>
  <ul role="list" aria-label="Lista de notificações">
    {notifications.map(n => (
      <li role="listitem">...</li>
    ))}
  </ul>
</div>
```

---

### 3.2 Sidebar.tsx 🗂️
**Tempo Estimado:** 2-3 horas

- [ ] Adicionar `aria-current="page"` nos links ativos
- [ ] Adicionar `role="list"` no container de subitems
- [ ] Adicionar `role="listitem"` em cada subitem
- [ ] Melhorar labels de navegação

---

### 3.3 Login.tsx 🔐
**Tempo Estimado:** 1.5-2 horas

- [ ] Adicionar `role="tablist"` no container de toggle
- [ ] Mudar `aria-pressed` para `aria-selected` nos botões
- [ ] Adicionar `role="tab"` nos botões
- [ ] Adicionar `aria-controls` apontando para formulário
- [ ] Adicionar `role="tabpanel"` nos formulários

---

### 3.4 Componentes de Calendário 📅
**Tempo Estimado:** 4-6 horas

**1. CalendarFilters.tsx** (2-3h)
- [ ] Adicionar `role="checkbox"` e `aria-checked` nos botões de tipo
- [ ] Adicionar `aria-label` no container de tipos
- [ ] Adicionar label ou `aria-label` no select de status

**2. Outros componentes de calendário** (2-3h)
- [ ] CalendarView: Adicionar ARIA em navegação de datas
- [ ] RequestForm: Revisar ARIA em formulários
- [ ] ApprovalQueue: Adicionar ARIA em lista de aprovações

---

## Fase 4: Componentes Administrativos (Semana 4) - 8-12 horas

### 4.1 CompetencyManager.tsx 🎯
**Tempo Estimado:** 3-4 horas

- [ ] Adicionar `aria-label` no input de busca
- [ ] Adicionar labels ou `aria-label` nos selects de filtro
- [ ] Adicionar `role="list"` no container de competências
- [ ] Adicionar `role="listitem"` em cada competência
- [ ] Melhorar `aria-label` dos botões de ação
- [ ] Adicionar ARIA completo no range de nível

---

### 4.2 TestingPanel.tsx 🧪
**Tempo Estimado:** 2-3 horas

- [ ] Adicionar `aria-label` no botão flutuante
- [ ] Adicionar `role="tablist"` nos tabs
- [ ] Adicionar `role="tab"` e `aria-selected` nos botões
- [ ] Adicionar `role="tabpanel"` no conteúdo

---

### 4.3 Outros Componentes Administrativos ⚙️
**Tempo Estimado:** 3-5 horas

**1. MigrationManager** (1h)
- [ ] Revisar formulários e adicionar ARIA

**2. FacilitiesReportGenerator** (1h)
- [ ] Adicionar ARIA em controles de geração

**3. OrganizationalChart** (1-2h)
- [ ] Adicionar ARIA em visualização hierárquica
- [ ] Garantir navegação por teclado

**4. PerformanceDashboard** (1h)
- [ ] Adicionar ARIA em gráficos e métricas

---

## Fase 5: Testes e Validação (Paralelo às Fases 1-4) ✅

### 5.1 Testes Automatizados
**Tempo Contínuo:** 1-2h por semana

- [ ] Adicionar testes jest-axe para componentes críticos
- [ ] Criar suite de testes de acessibilidade
- [ ] Configurar CI/CD para rodar testes de a11y

**Exemplo de teste:**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button should have no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

### 5.2 Testes Manuais
**Tempo:** 2-4h ao final de cada fase

**Checklist de Testes:**

#### Navegação por Teclado
- [ ] Tab através de todos os elementos interativos
- [ ] Enter/Space ativam botões e links
- [ ] Escape fecha modais e dropdowns
- [ ] Arrows navegam em listas e menus
- [ ] Ordem de foco é lógica

#### Leitores de Tela
- [ ] NVDA (Windows) - Testar fluxos principais
- [ ] JAWS (Windows) - Testar formulários
- [ ] VoiceOver (Mac/iOS) - Testar mobile
- [ ] TalkBack (Android) - Testar mobile

#### Ferramentas de Inspeção
- [ ] Chrome DevTools Accessibility Panel
- [ ] axe DevTools Extension
- [ ] WAVE Extension
- [ ] Lighthouse Accessibility Audit

---

## Fase 6: Documentação e Manutenção 📚

### 6.1 Documentação
**Tempo Estimado:** 4-6 horas

- [ ] Atualizar README com seção de acessibilidade
- [ ] Criar guia de componentes acessíveis
- [ ] Documentar padrões ARIA do projeto
- [ ] Criar checklist para novos componentes
- [ ] Adicionar badges de acessibilidade

---

### 6.2 Treinamento da Equipe
**Tempo Estimado:** 2-3 horas

- [ ] Sessão de apresentação sobre acessibilidade
- [ ] Demonstração de uso de leitores de tela
- [ ] Workshop de revisão de código com foco em a11y
- [ ] Compartilhar recursos e referências

---

## Checklist de Progresso por Arquivo

### 🔴 Prioridade ALTA

- [ ] `/src/components/ui/Textarea.tsx`
- [ ] `/src/components/ui/Checkbox.tsx`
- [ ] `/src/components/ui/ProgressBar.tsx`
- [ ] `/src/components/NotificationCenter.tsx`
- [ ] `/src/components/mental-health/TaskManager.tsx`
- [ ] `/src/components/Onboarding.tsx`

### 🟡 Prioridade MÉDIA

- [ ] `/src/components/ui/Select.tsx`
- [ ] `/src/components/ui/Table.tsx`
- [ ] `/src/components/ui/AvatarUpload.tsx`
- [ ] `/src/components/layout/Sidebar.tsx`
- [ ] `/src/components/forms/FormAssignmentModal.tsx`
- [ ] `/src/components/mental-health/EmotionalCheckin.tsx`
- [ ] `/src/components/hr-calendar/CalendarFilters.tsx`
- [ ] `/src/components/admin/CompetencyManager.tsx`

### 🟢 Prioridade BAIXA

- [ ] `/src/components/layout/Header.tsx`
- [ ] `/src/components/modals/AddSalaryModal.tsx`
- [ ] `/src/components/hr-calendar/EventModal.tsx`
- [ ] `/src/components/Login.tsx`
- [ ] `/src/components/testing/TestingPanel.tsx`

---

## Métricas de Sucesso

### Métricas Quantitativas
- [ ] Lighthouse Accessibility Score: > 95
- [ ] 0 violações críticas no axe
- [ ] 100% dos componentes com testes de a11y
- [ ] < 5 avisos no ESLint jsx-a11y

### Métricas Qualitativas
- [ ] Navegação completa por teclado
- [ ] Todos os fluxos funcionam com leitor de tela
- [ ] Feedback claro de erros e sucessos
- [ ] Identificação clara de elementos interativos

---

## Cronograma Visual

```
Semana 1: Fundação
├─ Setup [██████████] 100%
├─ Utilitários [░░░░░░░░░░] 0%
└─ UI Base [░░░░░░░░░░] 0%

Semana 2: Formulários
├─ Especializados [░░░░░░░░░░] 0%
└─ Saúde Mental [░░░░░░░░░░] 0%

Semana 3: Navegação
├─ Notifications [░░░░░░░░░░] 0%
├─ Sidebar [░░░░░░░░░░] 0%
├─ Login [░░░░░░░░░░] 0%
└─ Calendário [░░░░░░░░░░] 0%

Semana 4: Admin + Validação
├─ CompetencyMgr [░░░░░░░░░░] 0%
├─ Testing Panel [░░░░░░░░░░] 0%
├─ Outros Admin [░░░░░░░░░░] 0%
└─ Testes Finais [░░░░░░░░░░] 0%
```

---

## Recursos e Apoio

### Ferramentas
- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/download/)

### Documentação
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Comunidade
- [a11y Slack](https://web-a11y.slack.com/)
- [A11y Project](https://www.a11yproject.com/)

---

## Próximos Passos Imediatos

1. ✅ Ler este plano de ação completo
2. ⏭️ Revisar `ARIA_ACCESSIBILITY_AUDIT.md` para detalhes técnicos
3. ⏭️ Consultar `ARIA_IMPLEMENTATION_GUIDE.md` para exemplos
4. ⏭️ Começar Fase 1.1: Setup de Ferramentas
5. ⏭️ Implementar componentes de Prioridade ALTA

---

**Última Atualização:** 27 de Novembro de 2025  
**Status:** Pronto para Execução  
**Responsável:** Equipe de Desenvolvimento
