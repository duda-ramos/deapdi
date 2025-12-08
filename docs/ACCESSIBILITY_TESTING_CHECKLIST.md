# Checklist de Testes de Acessibilidade - TalentFlow

Este documento fornece um checklist completo para testes manuais e automatizados de acessibilidade.

## Índice
1. [Testes Automatizados](#testes-automatizados)
2. [Testes Manuais com Leitor de Tela](#testes-manuais-com-leitor-de-tela)
3. [Testes de Navegação por Teclado](#testes-de-navegação-por-teclado)
4. [Fluxos Críticos](#fluxos-críticos)
5. [Ferramentas Recomendadas](#ferramentas-recomendadas)

---

## Testes Automatizados

### Executar Suíte de Testes
```bash
# Executar todos os testes de acessibilidade
npm run test:a11y

# Executar testes com relatório de cobertura
npm run test:coverage -- --testPathPattern=a11y
```

### Cobertura de Componentes

| Componente | Arquivo de Teste | Status |
|------------|------------------|--------|
| Input | `Input.a11y.test.tsx` | ✅ |
| Textarea | `Textarea.a11y.test.tsx` | ✅ |
| Checkbox | `Checkbox.a11y.test.tsx` | ✅ |
| Select | `Select.a11y.test.tsx` | ✅ |
| Button | `Button.a11y.test.tsx` | ✅ |
| Badge | `Badge.a11y.test.tsx` | ✅ |
| Modal | `Modal.a11y.test.tsx` | ✅ |
| Sidebar | `Sidebar.a11y.test.tsx` | ✅ |
| NotificationCenter | `NotificationCenter.a11y.test.tsx` | ✅ |
| TaskManager | `TaskManager.a11y.test.tsx` | ✅ |
| Login | `Login.a11y.test.tsx` | ✅ |

---

## Testes Manuais com Leitor de Tela

### NVDA (Windows)

#### Configuração
1. Baixar e instalar NVDA: https://www.nvaccess.org/
2. Usar com Firefox ou Chrome
3. Ativar modo de foco (Insert + Space)

#### Cenários de Teste

- [ ] **Login**
  - [ ] Formulário de login é anunciado corretamente
  - [ ] Labels dos campos são lidos
  - [ ] Erros de validação são anunciados
  - [ ] Botão de submit é identificável
  - [ ] Alternância de modo (login/cadastro) é anunciada

- [ ] **Dashboard**
  - [ ] Título da página é anunciado
  - [ ] Cards de estatísticas têm contexto
  - [ ] Gráficos têm texto alternativo
  - [ ] Notificações são anunciadas como live region

- [ ] **Sidebar/Navegação**
  - [ ] Menu principal é identificado como navegação
  - [ ] Itens de menu são listados
  - [ ] Submenus expandíveis são anunciados
  - [ ] Item atual é identificado (aria-current)

- [ ] **Modais**
  - [ ] Título do modal é anunciado ao abrir
  - [ ] Conteúdo é lido na ordem correta
  - [ ] Foco retorna ao elemento anterior ao fechar
  - [ ] Botão de fechar é identificável

- [ ] **Formulários**
  - [ ] Todos os campos têm labels associados
  - [ ] Campos obrigatórios são identificados
  - [ ] Estados de erro são anunciados
  - [ ] Textos de ajuda são lidos

### VoiceOver (macOS)

#### Configuração
1. Ativar: System Preferences > Accessibility > VoiceOver
2. Atalho: Command + F5
3. Usar com Safari

#### Cenários de Teste

- [ ] **Navegação Global**
  - [ ] Usar rotor (Ctrl + Option + U) para listar landmarks
  - [ ] Usar rotor para listar headings
  - [ ] Usar rotor para listar links
  - [ ] Usar rotor para listar form controls

- [ ] **Interações**
  - [ ] Botões são ativáveis com Space/Enter
  - [ ] Links são ativáveis com Enter
  - [ ] Selects são navegáveis com setas
  - [ ] Checkboxes alternam com Space

### TalkBack (Android)

#### Configuração
1. Settings > Accessibility > TalkBack
2. Testar com Chrome

#### Cenários de Teste

- [ ] **Touch Exploration**
  - [ ] Elementos respondem ao toque
  - [ ] Duplo toque ativa elementos
  - [ ] Gestos de navegação funcionam

---

## Testes de Navegação por Teclado

### Teclas Globais

| Atalho | Ação | Local |
|--------|------|-------|
| `Tab` | Próximo elemento focável | Global |
| `Shift + Tab` | Elemento focável anterior | Global |
| `Enter` / `Space` | Ativar elemento | Botões, Links |
| `Escape` | Fechar modal/dropdown | Modais, Dropdowns |
| `Ctrl/Cmd + K` | Abrir busca | Global (quando implementado) |
| `Ctrl/Cmd + N` | Nova tarefa | TaskManager |
| `/` | Focar busca | TaskManager |

### Navegação em Componentes

#### Sidebar
- [ ] `↑` / `↓` navegam entre itens
- [ ] `→` expande submenu
- [ ] `←` colapsa submenu
- [ ] `Home` vai para primeiro item
- [ ] `End` vai para último item
- [ ] `Enter` ativa link

#### Modal
- [ ] `Tab` navega entre elementos focáveis
- [ ] `Shift + Tab` navega na direção oposta
- [ ] `Escape` fecha o modal
- [ ] Foco fica preso dentro do modal
- [ ] Foco inicial vai para primeiro elemento focável

#### NotificationCenter
- [ ] `↑` / `↓` navegam entre notificações
- [ ] `Enter` marca como lida
- [ ] `Delete` remove notificação
- [ ] `Escape` fecha painel

#### TaskManager Grid
- [ ] `←` / `→` navegam horizontalmente
- [ ] `↑` / `↓` navegam entre linhas
- [ ] `Enter` abre/ativa tarefa
- [ ] `Home` vai para primeira tarefa
- [ ] `End` vai para última tarefa

---

## Fluxos Críticos

### 1. Fluxo de Login
```
1. Página carrega
   - [ ] Título da página é "TalentFlow - Login"
   - [ ] Foco está no campo de email

2. Preenchimento do formulário
   - [ ] Tab navega pelos campos
   - [ ] Labels são associados corretamente
   - [ ] Erro de validação é anunciado

3. Submissão
   - [ ] Botão é ativável por teclado
   - [ ] Loading state é anunciado (aria-busy)
   - [ ] Sucesso/erro é comunicado
```

### 2. Criar Tarefa (PDI)
```
1. Abrir modal de criação
   - [ ] Botão "Nova tarefa" é focável
   - [ ] Modal abre e foco move para ele
   - [ ] Título é anunciado

2. Preenchimento
   - [ ] Todos os campos são navegáveis por teclado
   - [ ] Selects funcionam com setas
   - [ ] Campos obrigatórios são identificados

3. Salvamento
   - [ ] Botão salvar é ativável
   - [ ] Modal fecha após salvar
   - [ ] Foco retorna ao elemento anterior
   - [ ] Sucesso é anunciado via live region
```

### 3. Check-in Emocional
```
1. Acessar página
   - [ ] Navegação por sidebar funciona
   - [ ] Página carrega e título é anunciado

2. Seleção de humor
   - [ ] Opções são navegáveis por teclado
   - [ ] Seleção é anunciada
   - [ ] Estado selecionado é identificável

3. Descrição
   - [ ] Textarea é focável
   - [ ] Label é lido
   - [ ] Contador de caracteres (se houver) é acessível

4. Submissão
   - [ ] Botão é ativável
   - [ ] Confirmação é anunciada
```

---

## Ferramentas Recomendadas

### Extensões de Navegador

| Ferramenta | Navegador | Uso |
|------------|-----------|-----|
| axe DevTools | Chrome, Firefox | Auditoria automatizada |
| WAVE | Chrome, Firefox | Visualização de problemas |
| Lighthouse | Chrome | Auditoria completa |
| Accessibility Insights | Chrome, Edge | Testes guiados |

### Ferramentas de Teste de Cor

| Ferramenta | Link | Uso |
|------------|------|-----|
| WebAIM Contrast Checker | https://webaim.org/resources/contrastchecker/ | Verificar contraste |
| Colorblindly | Chrome Extension | Simular daltonismo |
| Color Oracle | Desktop | Simulação global |

### Leitores de Tela

| Ferramenta | Plataforma | Custo |
|------------|------------|-------|
| NVDA | Windows | Gratuito |
| JAWS | Windows | Pago |
| VoiceOver | macOS/iOS | Integrado |
| TalkBack | Android | Integrado |
| Orca | Linux | Gratuito |

---

## Comandos de Teste

```bash
# Executar todos os testes de acessibilidade
npm run test:a11y

# Executar teste específico
npx jest src/tests/a11y/Modal.a11y.test.tsx

# Executar com verbose
npm run test:a11y -- --verbose

# Executar e observar mudanças
npm run test:a11y -- --watch

# Gerar relatório de cobertura
npm run test:a11y -- --coverage

# Executar com debug
npm run test:a11y -- --testTimeout=30000
```

---

## Validação Final

### Antes do Deploy

- [ ] Todos os testes automatizados passam (`npm run test:a11y`)
- [ ] Auditoria Lighthouse ≥ 90 em Acessibilidade
- [ ] Verificação manual com NVDA em fluxos críticos
- [ ] Verificação manual com VoiceOver em fluxos críticos
- [ ] Navegação completa apenas por teclado testada
- [ ] Contraste de cores verificado (ver CONTRAST_ANALYSIS_REPORT.md)
- [ ] Live regions funcionando para conteúdo dinâmico
- [ ] Skip links funcionando (se implementados)
- [ ] Zoom de 200% não quebra layout

### Critérios de Aprovação

| Critério | Mínimo |
|----------|--------|
| Score Lighthouse A11y | ≥ 90 |
| Testes jest-axe | 100% pass |
| Violações WCAG AA | 0 críticas |
| Navegação por teclado | 100% funcional |

---

## Recursos Adicionais

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
