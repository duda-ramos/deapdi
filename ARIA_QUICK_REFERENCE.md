# Referência Rápida - ARIA Labels

## 📋 Resumo Executivo

**Total de Arquivos Analisados:** 30+  
**Arquivos que Necessitam Modificação:** 23  
**Tempo Estimado Total:** 40-60 horas  
**Prioridade:** 🔴 ALTA

---

## 🎯 Top 10 Problemas Mais Críticos

1. **NotificationCenter.tsx** - 15+ elementos sem ARIA labels
2. **Onboarding.tsx** - Wizard sem navigation landmarks
3. **TaskManager.tsx** - Formulários e listas sem estrutura ARIA
4. **Textarea.tsx** - Componente base sem ARIA completo
5. **Checkbox.tsx** - Sem conexão label-input e aria-checked
6. **ProgressBar.tsx** - Sem role progressbar e valores
7. **FormAssignmentModal.tsx** - Radio buttons sem roles
8. **EmotionalCheckin.tsx** - Range sliders sem labels
9. **CompetencyManager.tsx** - Listas sem roles e botões sem labels

---

## 🔴 Arquivos de Prioridade ALTA (Fazer Primeiro)

### 1. Componentes UI Base
```
✓ /src/components/ui/Textarea.tsx      - 30 min
✓ /src/components/ui/Checkbox.tsx      - 45 min
✓ /src/components/ui/ProgressBar.tsx   - 30 min
✓ /src/components/ui/Select.tsx        - 30 min
✓ /src/components/ui/Table.tsx         - 45 min
```

### 2. Componentes Funcionais
```
✓ /src/components/NotificationCenter.tsx           - 4h
✓ /src/components/mental-health/TaskManager.tsx    - 3h
✓ /src/components/Onboarding.tsx                   - 4h
```

**Tempo Total Prioridade Alta:** ~14 horas

---

## 🟡 Arquivos de Prioridade MÉDIA

```
✓ /src/components/ui/AvatarUpload.tsx              - 30 min
✓ /src/components/layout/Sidebar.tsx               - 3h
✓ /src/components/forms/FormAssignmentModal.tsx    - 2h
✓ /src/components/mental-health/EmotionalCheckin.tsx - 1.5h
✓ /src/components/admin/CompetencyManager.tsx      - 4h
```

**Tempo Total Prioridade Média:** ~13 horas

---

## 🟢 Arquivos de Prioridade BAIXA

```
✓ /src/components/layout/Header.tsx                - 30 min
✓ /src/components/modals/AddSalaryModal.tsx        - 1h
✓ /src/components/Login.tsx                        - 2h
✓ /src/components/testing/TestingPanel.tsx         - 2h
```

**Tempo Total Prioridade Baixa:** ~6.5 horas

---

## 📊 Estatísticas de Problemas

| Categoria | Quantidade | Severidade |
|-----------|------------|------------|
| Botões sem aria-label | 45+ | 🔴 Alta |
| Inputs sem associação label | 12+ | 🔴 Alta |
| Listas sem role | 8+ | 🟡 Média |
| Modais sem region | 5+ | 🟡 Média |
| Ranges sem ARIA values | 6+ | 🟡 Média |
| Toggles sem switch role | 15+ | 🟡 Média |
| Estados sem aria-live | 10+ | 🟡 Média |

---

## 🛠️ Padrões Mais Usados

### Botão com Ícone
```tsx
<button aria-label="Descrição clara">
  <Icon aria-hidden="true" />
</button>
```

### Input com Label
```tsx
<label htmlFor={id}>Label</label>
<input 
  id={id}
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? errorId : undefined}
/>
```

### Modal
```tsx
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby={titleId}
  aria-describedby={descId}
>
```

### Lista
```tsx
<ul role="list" aria-label="Descrição">
  <li role="listitem">...</li>
</ul>
```

### Progress Bar
```tsx
<div
  role="progressbar"
  aria-valuenow={current}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-label="Descrição"
/>
```

### Notificação
```tsx
<div role="alert" aria-live="assertive">
  Erro crítico
</div>

<div role="status" aria-live="polite">
  Sucesso
</div>
```

---

## ✅ Checklist de Implementação

### Antes de Começar
- [ ] Instalar `eslint-plugin-jsx-a11y`
- [ ] Instalar `@axe-core/react`
- [ ] Instalar `jest-axe`
- [ ] Criar hook `useAriaId`
- [ ] Criar componente `VisuallyHidden`

### Durante Implementação
- [ ] Testar com Tab (navegação por teclado)
- [ ] Verificar com Lighthouse
- [ ] Rodar axe DevTools
- [ ] Verificar console do ESLint

### Após Implementação
- [ ] Testar com NVDA/JAWS
- [ ] Testar com VoiceOver
- [ ] Validar com WAVE
- [ ] Lighthouse Score > 95
- [ ] 0 violações críticas

---

## 🚀 Quick Start

### 1. Setup (30 min)
```bash
npm install --save-dev eslint-plugin-jsx-a11y @axe-core/react jest-axe
```

### 2. Criar Utilitários (1h)
- Hook `useAriaId`
- Componente `VisuallyHidden`
- Componente `IconButton`

### 3. Começar por Componentes Base (3h)
- Textarea
- Checkbox
- ProgressBar
- Select
- Table

### 4. Componentes Funcionais (10h)
- NotificationCenter
- TaskManager
- Onboarding

### 5. Testes e Validação (4h)
- Testes automatizados
- Testes manuais com SR
- Correção de problemas

---

## 📝 Comandos Úteis

```bash
# Rodar lint de acessibilidade
npm run lint -- --fix

# Rodar testes de acessibilidade
npm test -- --testPathPattern=a11y

# Build com análise
npm run build -- --analyze

# Lighthouse CI
npx lighthouse [URL] --only-categories=accessibility
```

---

## 🎓 Recursos Essenciais

### Aprendizado
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)

### Ferramentas
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Extension](https://wave.webaim.org/extension/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Validação
- Chrome DevTools > Accessibility
- Lighthouse (Accessibility audit)
- axe DevTools extension

---

## 💡 Dicas Rápidas

1. **Sempre conecte labels a inputs** - use `htmlFor` e `id`
2. **Ícones sozinhos precisam de aria-label** - sem exceções
3. **Ícones com texto são decorativos** - use `aria-hidden="true"`
4. **Erros devem ser assertivos** - `role="alert" aria-live="assertive"`
5. **Sucessos podem ser polite** - `role="status" aria-live="polite"`
6. **Modais sempre precisam** - `role="dialog" aria-modal="true"`
7. **Listas explícitas são melhores** - use `role="list"` em divs
8. **Range sliders precisam de valores** - `aria-valuenow/min/max`
9. **Botões de toggle precisam de estado** - `aria-expanded`
10. **Navegação ativa precisa de marcação** - `aria-current="page"`

---

## 🔍 Como Identificar Problemas

### Visual (Chrome DevTools)
1. Abrir DevTools > Elements
2. Clicar em Accessibility tab
3. Verificar ARIA properties
4. Verificar Computed properties

### Automático (axe DevTools)
1. Instalar extensão
2. Abrir página
3. Clicar em "Analyze"
4. Revisar Issues

### Manual (Teclado)
1. Usar apenas Tab/Shift+Tab
2. Verificar ordem lógica
3. Todos elementos acessíveis?
4. Foco visível?

### Manual (Screen Reader)
1. Ativar NVDA/JAWS/VoiceOver
2. Navegar pela página
3. Todos elementos anunciados?
4. Anúncios fazem sentido?

---

## 📞 Próximos Passos

1. ✅ Revisar este documento
2. ⏭️ Ler `ARIA_ACCESSIBILITY_AUDIT.md` (detalhes completos)
3. ⏭️ Consultar `ARIA_IMPLEMENTATION_GUIDE.md` (exemplos de código)
4. ⏭️ Seguir `ARIA_ACTION_PLAN.md` (roadmap executável)
5. ⏭️ Começar implementação

---

**Objetivo:** WCAG 2.1 Level AA compliance  
**Prazo:** 3-4 semanas  
**Status:** 🔴 Pronto para Execução

---

## 📌 Pins Importantes

> **⚠️ CRÍTICO:** NotificationCenter, TaskManager e Onboarding são os componentes mais usados e com mais problemas. Priorizar!

> **💡 DICA:** Criar componentes wrapper (IconButton, SearchInput) economiza tempo e garante consistência.

> **🎯 META:** Lighthouse Accessibility Score > 95 e 0 violações críticas no axe.

> **✅ SUCESSO:** Quando todos os fluxos principais funcionarem perfeitamente com NVDA/VoiceOver.

---

**Última Atualização:** 27 de Novembro de 2025
