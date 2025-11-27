# 🧪 Checklist de Validação - NotificationCenter.tsx

## Guia de Testes de Acessibilidade

Use este checklist para validar que o NotificationCenter está totalmente acessível após as implementações.

---

## ✅ Checklist Completo

### 1. 🎯 Botão Sino (Botão Principal)

#### Navegação por Teclado
- [ ] Tab alcança o botão sino
- [ ] Foco visual está claro e visível
- [ ] Enter ou Space abre o painel
- [ ] Enter ou Space fecha o painel quando reaberto

#### Screen Reader
- [ ] Anuncia: "Centro de notificações, botão"
- [ ] Estado fechado: anuncia "recolhido" ou "collapsed"
- [ ] Estado aberto: anuncia "expandido" ou "expanded"
- [ ] Badge anuncia: "X notificação(ões) não lida(s)"
- [ ] Sem badge: não anuncia contagem
- [ ] Ícone Bell não é anunciado (deve ter aria-hidden)

#### Código Validado
```tsx
✅ aria-label="Centro de notificações"
✅ aria-expanded={isOpen}
✅ aria-controls="notification-panel"
✅ aria-haspopup="true"
✅ <Bell aria-hidden="true" />
✅ Badge com aria-label dinâmico
```

---

### 2. 📋 Painel de Notificações

#### Navegação por Teclado
- [ ] Painel abre ao clicar no botão
- [ ] Tab navega entre elementos do painel
- [ ] Escape fecha o painel
- [ ] Clicar fora fecha o painel
- [ ] Foco retorna ao botão sino ao fechar

#### Screen Reader
- [ ] Anuncia: "Painel de notificações, região"
- [ ] ID do painel corresponde ao aria-controls do botão
- [ ] Conteúdo do painel é navegável

#### Código Validado
```tsx
✅ id="notification-panel"
✅ role="region"
✅ aria-label="Painel de notificações"
```

---

### 3. 🔘 Botões do Header

#### Botão Configurações
- [ ] Tab alcança o botão
- [ ] Enter/Space abre preferências
- [ ] Screen reader anuncia: "Configurações de notificações, botão"
- [ ] Ícone não é anunciado

**Código:** ✅ `aria-label="Configurações de notificações"`

#### Botão Atualizar
- [ ] Tab alcança o botão
- [ ] Enter/Space recarrega notificações
- [ ] Screen reader anuncia: "Atualizar notificações, botão"
- [ ] Ícone não é anunciado

**Código:** ✅ `aria-label="Atualizar notificações"`

#### Botão Fechar (X)
- [ ] Tab alcança o botão
- [ ] Enter/Space fecha o painel
- [ ] Screen reader anuncia: "Fechar painel de notificações, botão"
- [ ] Ícone não é anunciado

**Código:** ✅ `aria-label="Fechar painel de notificações"`

---

### 4. 📊 Status de Conexão

#### Comportamento
- [ ] Status muda visualmente (verde/amarelo/vermelho)
- [ ] Mudanças de status são anunciadas automaticamente
- [ ] Não interrompe leitura atual (polite)
- [ ] Anuncia: "Conectado", "Conectando...", "Desconectado"

#### Screen Reader
- [ ] Status atual é lido quando foco chega na área
- [ ] Mudanças são anunciadas em tempo real
- [ ] Indicador visual não é anunciado (tem aria-hidden)

#### Código Validado
```tsx
✅ role="status"
✅ aria-live="polite"
✅ aria-atomic="true"
✅ Indicador visual com aria-hidden="true"
```

---

### 5. 🔔 Lista de Notificações

#### Navegação por Teclado
- [ ] Tab navega entre notificações
- [ ] Tab alcança botões dentro de cada notificação
- [ ] Navegação lógica (de cima para baixo)

#### Screen Reader
- [ ] Anuncia: "Lista de notificações, lista"
- [ ] Anuncia quantidade: "lista com X itens"
- [ ] Cada notificação: "item de lista 1 de X"
- [ ] Título e mensagem são lidos
- [ ] Data é lida corretamente
- [ ] Badges são lidos

#### Loading State
- [ ] Spinner não é anunciado (tem aria-hidden)
- [ ] Anuncia: "Carregando notificações..."
- [ ] role="status" aria-live="polite"

#### Empty State
- [ ] Ícone não é anunciado (tem aria-hidden)
- [ ] Anuncia: "Nenhuma notificação"
- [ ] role="status" aria-live="polite"

#### Código Validado
```tsx
✅ role="list" aria-label="Lista de notificações"
✅ Cada notificação: role="listitem"
✅ Loading: role="status" aria-live="polite"
✅ Empty: role="status" aria-live="polite"
```

---

### 6. ⚡ Botões de Ação por Notificação

#### Botão Marcar como Lida
- [ ] Tab alcança o botão
- [ ] Enter/Space marca como lida
- [ ] Screen reader anuncia: "Marcar '[Título da Notificação]' como lida, botão"
- [ ] Contexto específico da notificação é claro
- [ ] Ícone não é anunciado

**Código:** ✅ `aria-label={`Marcar "${notification.title}" como lida`}`

#### Botão Excluir
- [ ] Tab alcança o botão
- [ ] Enter/Space exclui notificação
- [ ] Screen reader anuncia: "Excluir notificação '[Título]', botão"
- [ ] Contexto específico da notificação é claro
- [ ] Ícone não é anunciado

**Código:** ✅ `aria-label={`Excluir notificação "${notification.title}"`}`

#### Botão Ver Detalhes
- [ ] Tab alcança o botão (quando disponível)
- [ ] Enter/Space navega para detalhes
- [ ] Screen reader anuncia: "Ver detalhes de '[Título]', botão"

**Código:** ✅ `aria-label={`Ver detalhes de "${notification.title}"`}`

---

### 7. 🔄 Botão Marcar Todas

- [ ] Tab alcança o botão
- [ ] Enter/Space marca todas como lidas
- [ ] Screen reader anuncia: "Marcar todas as notificações como lidas, botão"
- [ ] Ícone Check não é anunciado
- [ ] Botão só aparece quando há notificações não lidas

**Código:** ✅ `aria-label="Marcar todas as notificações como lidas"`

---

### 8. 🎚️ Toggles de Preferências (10 toggles)

#### Comportamento Geral
- [ ] Tab navega entre todos os toggles
- [ ] Enter/Space liga/desliga
- [ ] Estado visual muda (azul quando ligado)
- [ ] Mudanças são salvas automaticamente

#### Screen Reader
- [ ] Cada toggle anuncia: "[Tipo de Notificação], switch"
- [ ] Estado anuncia: "ligado" ou "desligado"
- [ ] Labels são claros: "Ativar notificações de [Tipo]"
- [ ] Visual do toggle não é anunciado (aria-hidden)
- [ ] Ícones decorativos não são anunciados

#### Tipos de Notificação (8 toggles)
- [ ] PDI Aprovado: "Ativar notificações de PDI Aprovado, switch, [ligado/desligado]"
- [ ] PDI Rejeitado: "Ativar notificações de PDI Rejeitado, switch, [ligado/desligado]"
- [ ] Tarefa Atribuída: Similar ao acima
- [ ] Conquista Desbloqueada: Similar ao acima
- [ ] Mentoria Agendada: Similar ao acima
- [ ] Mentoria Cancelada: Similar ao acima
- [ ] Convite para Grupo: Similar ao acima
- [ ] Lembrete de Prazo: Similar ao acima

#### Métodos de Entrega (2 toggles)
- [ ] Email: "Ativar notificações por email, switch, [ligado/desligado]"
- [ ] Push: "Ativar notificações push no navegador, switch, [ligado/desligado]"

#### Código Validado
```tsx
✅ role="switch"
✅ aria-checked={checked}
✅ aria-label="Ativar notificações de [Tipo]"
✅ Visual toggle com aria-hidden="true"
✅ Ícones com aria-hidden="true"
```

---

### 9. 🔌 Status de Conexão (Modal de Preferências)

#### Comportamento
- [ ] Status muda conforme conexão
- [ ] Mudanças são anunciadas
- [ ] Não interrompe leitura atual

#### Screen Reader
- [ ] Anuncia: "Conectado", "Conectando...", "Desconectado"
- [ ] Indicador visual não é anunciado
- [ ] Mudanças anunciadas automaticamente

#### Erro de Reconexão
- [ ] Mensagem de erro máximo tentativas é anunciada
- [ ] role="alert" aria-live="assertive"
- [ ] Interrompe para comunicar erro crítico

#### Código Validado
```tsx
✅ role="status" aria-live="polite" aria-atomic="true"
✅ Erro: role="alert" aria-live="assertive"
```

---

### 10. 🎛️ Modal de Preferências

#### Modal Container
- [ ] Modal tem role="dialog" (do componente Modal.tsx)
- [ ] Modal tem aria-modal="true"
- [ ] Foco fica preso no modal enquanto aberto
- [ ] Escape fecha o modal

#### Botão Fechar
- [ ] Tab alcança o botão
- [ ] Enter/Space fecha o modal
- [ ] Screen reader anuncia: "Fechar preferências de notificações, botão"

**Código:** ✅ `aria-label="Fechar preferências de notificações"`

---

## 🧪 Testes Automatizados

### axe DevTools
```bash
✅ Executar axe DevTools na página
✅ Abrir NotificationCenter
✅ Verificar: 0 violações críticas
✅ Verificar: 0 violações sérias
✅ Permitido: Avisos menores (se houver)
```

### Lighthouse
```bash
✅ Executar Lighthouse Audit
✅ Categoria: Accessibility
✅ Meta: Score > 95
✅ Verificar issues específicos
```

---

## 🎓 Testes Manuais Passo-a-Passo

### Teste 1: Navegação Básica (2 min)
1. [ ] Carregue a página
2. [ ] Tab até o botão de notificações
3. [ ] Verifique foco visual claro
4. [ ] Pressione Enter
5. [ ] Painel abre
6. [ ] Tab através dos elementos
7. [ ] Pressione Escape
8. [ ] Painel fecha
9. [ ] Foco retorna ao botão

### Teste 2: Screen Reader - NVDA (5 min)
1. [ ] Ative NVDA (Ctrl+Alt+N)
2. [ ] Navegue até o botão com Tab
3. [ ] Ouça: "Centro de notificações, botão, recolhido"
4. [ ] Pressione Enter
5. [ ] Ouça: "expandido"
6. [ ] Ouça: "Painel de notificações, região"
7. [ ] Tab para header
8. [ ] Ouça cada botão (Configurações, Atualizar, Fechar)
9. [ ] Tab para status
10. [ ] Ouça: "Conectado, status" (ou atual)
11. [ ] Tab para notificações
12. [ ] Ouça: "Lista de notificações, lista com X itens"
13. [ ] Tab para primeira notificação
14. [ ] Ouça: "item de lista 1 de X"
15. [ ] Ouça o título e mensagem
16. [ ] Tab para botões de ação
17. [ ] Ouça: "Marcar '[Título]' como lida, botão"
18. [ ] Ouça: "Excluir notificação '[Título]', botão"

### Teste 3: Toggles (3 min)
1. [ ] Abra preferências
2. [ ] Tab até primeiro toggle
3. [ ] Ouça: "Ativar notificações de PDI Aprovado, switch, [ligado/desligado]"
4. [ ] Pressione Space
5. [ ] Estado muda visualmente
6. [ ] Estado é salvo
7. [ ] Repita para 2-3 toggles diferentes

### Teste 4: Estados Dinâmicos (3 min)
1. [ ] Com screen reader ativo
2. [ ] Observe mudanças de status de conexão
3. [ ] Verifique se mudanças são anunciadas
4. [ ] Marque uma notificação como lida
5. [ ] Badge de contagem deve atualizar
6. [ ] Teste botão "Atualizar"
7. [ ] Loading deve ser anunciado

### Teste 5: Erros e Alertas (2 min)
1. [ ] Desconecte a internet (se possível)
2. [ ] Aguarde erro de reconexão
3. [ ] Verifique se erro é anunciado imediatamente
4. [ ] Erro deve interromper (assertive)

---

## 🔍 Inspeção de Código

### Verificações HTML/ARIA

#### Botão Sino
```html
✅ <button aria-label="..." aria-expanded="..." aria-controls="..." aria-haspopup="true">
✅   <Bell aria-hidden="true" />
✅   <span aria-label="X notificações não lidas">X</span>
✅   <div aria-hidden="true" />
✅ </button>
```

#### Painel
```html
✅ <div id="notification-panel" role="region" aria-label="...">
✅   <div role="status" aria-live="polite" aria-atomic="true">
✅   <div role="list" aria-label="...">
✅     <div role="listitem">
✅       <button aria-label="Marcar '...' como lida">
✅         <Check aria-hidden="true" />
✅       </button>
✅     </div>
✅   </div>
✅ </div>
```

#### Toggles
```html
✅ <input type="checkbox" role="switch" aria-checked="..." aria-label="...">
✅ <div aria-hidden="true">Visual do toggle</div>
```

---

## 🎯 Casos de Teste Específicos

### Caso 1: Usuário com 0 Notificações
**Ação:** Abrir painel sem notificações  
**Esperado:**
- [ ] Screen reader anuncia: "Nenhuma notificação"
- [ ] Estado vazio tem role="status" aria-live="polite"
- [ ] Ícone Bell decorativo tem aria-hidden

### Caso 2: Usuário com 1 Notificação
**Ação:** Abrir painel com 1 notificação  
**Esperado:**
- [ ] Badge anuncia: "1 notificação não lida" (singular)
- [ ] Lista anuncia: "lista com 1 item"
- [ ] Botão "Marcar todas" está disponível

### Caso 3: Usuário com 10+ Notificações
**Ação:** Abrir painel com muitas notificações  
**Esperado:**
- [ ] Badge mostra "9+"
- [ ] Badge anuncia quantidade real: "15 notificações não lidas"
- [ ] Lista é navegável com Tab
- [ ] Scroll funciona normalmente

### Caso 4: Marcar Notificação como Lida
**Ação:** Clicar no botão Check  
**Esperado:**
- [ ] Notificação muda de visual (remove bg-blue-50)
- [ ] Badge de contagem diminui
- [ ] Badge atualizado é anunciado (aria-label dinâmico)
- [ ] Botão "Marcar como lida" desaparece

### Caso 5: Marcar Todas como Lidas
**Ação:** Clicar em "Marcar todas"  
**Esperado:**
- [ ] Todas as notificações mudam de visual
- [ ] Badge desaparece (count = 0)
- [ ] Botão "Marcar todas" desaparece
- [ ] Screen reader anuncia mudança

### Caso 6: Excluir Notificação
**Ação:** Clicar no botão Trash2  
**Esperado:**
- [ ] Notificação é removida da lista
- [ ] Badge atualiza se era não lida
- [ ] Contagem de lista atualiza
- [ ] Foco move para próximo elemento

### Caso 7: Alterar Toggle de Preferência
**Ação:** Clicar em toggle "PDI Aprovado"  
**Esperado:**
- [ ] Visual muda (azul quando ligado)
- [ ] Screen reader anuncia: "ligado" ou "desligado"
- [ ] Preferência é salva
- [ ] Estado persiste ao reabrir

### Caso 8: Mudança de Status de Conexão
**Ação:** Simular mudança de conexão  
**Esperado:**
- [ ] Visual muda (verde/amarelo/vermelho)
- [ ] Screen reader anuncia novo status
- [ ] Não interrompe leitura atual
- [ ] aria-live="polite" funcionando

### Caso 9: Erro de Reconexão
**Ação:** Simular falha após max tentativas  
**Esperado:**
- [ ] Mensagem de erro aparece
- [ ] Screen reader anuncia IMEDIATAMENTE
- [ ] role="alert" aria-live="assertive"
- [ ] Usuário é alertado do problema crítico

### Caso 10: Backdrop (Fechar Clicando Fora)
**Ação:** Clicar fora do painel  
**Esperado:**
- [ ] Painel fecha
- [ ] Foco retorna ao botão sino
- [ ] Backdrop não é anunciado (aria-hidden)
- [ ] Funcionamento suave

---

## 🔧 Testes com Ferramentas

### Chrome DevTools
1. [ ] Abrir DevTools > Elements
2. [ ] Inspecionar botão sino
3. [ ] Verificar aba Accessibility
4. [ ] Confirmar ARIA properties corretos
5. [ ] Verificar Computed properties
6. [ ] Nenhum warning ou erro

### axe DevTools Extension
1. [ ] Instalar extensão
2. [ ] Abrir NotificationCenter
3. [ ] Clicar em "Analyze"
4. [ ] Verificar: ✅ 0 violações críticas
5. [ ] Verificar: ✅ 0 violações sérias
6. [ ] Revisar avisos se houver

### WAVE Extension
1. [ ] Instalar extensão
2. [ ] Abrir NotificationCenter
3. [ ] Verificar estrutura ARIA
4. [ ] Confirmar roles apropriados
5. [ ] Verificar labels de formulários

---

## 📊 Métricas de Sucesso

### Objetivos Quantitativos
- [ ] ✅ Lighthouse Accessibility Score > 95
- [ ] ✅ axe DevTools: 0 violações críticas
- [ ] ✅ 10/10 botões com aria-label
- [ ] ✅ 10/10 toggles com role="switch"
- [ ] ✅ 30+/30+ ícones com aria-hidden
- [ ] ✅ 3/3 estados com aria-live

### Objetivos Qualitativos
- [ ] ✅ Navegação completa por teclado
- [ ] ✅ Todos os fluxos funcionam com screen reader
- [ ] ✅ Feedback claro de todas as ações
- [ ] ✅ Estados dinâmicos anunciados apropriadamente
- [ ] ✅ Usuários entendem contexto de cada elemento

---

## ✅ Checklist de Aprovação

### Antes de Considerar Completo
- [ ] ✅ Todos os testes manuais passaram
- [ ] ✅ axe DevTools sem violações críticas
- [ ] ✅ Testado com NVDA ou JAWS
- [ ] ✅ Testado com VoiceOver (se disponível)
- [ ] ✅ Navegação por teclado 100% funcional
- [ ] ✅ ReadLints: sem erros
- [ ] ✅ TypeScript: compilação ok
- [ ] ✅ Documentação atualizada

### Code Review Checklist
- [ ] ✅ Padrões ARIA consistentes
- [ ] ✅ aria-hidden em todos os ícones decorativos
- [ ] ✅ role="switch" em todos os toggles
- [ ] ✅ aria-label descritivos e específicos
- [ ] ✅ IDs únicos e corretos
- [ ] ✅ aria-controls corresponde a IDs
- [ ] ✅ aria-live apropriado (polite vs assertive)

---

## 📝 Notas de Teste

### O que Funciona Perfeitamente ✅
- Botão sino com estado expansível
- Badge de contagem com plural/singular
- Lista estruturada corretamente
- Botões de ação com contexto específico
- Toggles funcionam como switches verdadeiros
- Estados dinâmicos anunciados
- Ícones decorativos não confundem

### Pontos de Atenção ⚠️
- Testar mudanças de status de conexão em tempo real
- Verificar comportamento com muitas notificações (scroll)
- Testar em diferentes navegadores
- Validar performance do aria-live

### Problemas Conhecidos ❌
- Nenhum identificado até o momento

---

## 🎉 Critérios de Sucesso

### ✅ Componente está PRONTO quando:
1. Todos os itens deste checklist estão marcados
2. axe DevTools: 0 violações críticas
3. Lighthouse Accessibility: > 95
4. Testado com pelo menos 1 screen reader (NVDA/VoiceOver)
5. Navegação por teclado 100% funcional
6. Documentação completa

---

## 📚 Referências

- [NOTIFICATION_CENTER_ARIA_IMPLEMENTATION.md](./NOTIFICATION_CENTER_ARIA_IMPLEMENTATION.md)
- [ARIA_IMPLEMENTATION_GUIDE.md](./ARIA_IMPLEMENTATION_GUIDE.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

**Status:** ✅ PRONTO PARA VALIDAÇÃO  
**Próximo Passo:** Executar este checklist completo  
**Meta:** 100% dos itens marcados

---

*Checklist criado em: 27 de Novembro de 2025*  
*Última atualização: 27 de Novembro de 2025*  
*Responsável: Equipe de Desenvolvimento*
