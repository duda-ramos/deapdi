# Device Testing Matrix

**Data:** 8 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Preparado para Testes

---

## Setup para Testes

### Opção A - ngrok (Recomendado para testes externos)

```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar aplicação
npm run dev

# Em outro terminal, expor a aplicação
ngrok http 5173
```

**URL de acesso:** URL fornecida pelo ngrok (ex: `https://abc123.ngrok.io`)

### Opção B - Rede Local

```bash
# Verificar IP local
# Linux/Mac: ifconfig | grep "inet "
# Windows: ipconfig

# Iniciar aplicação com host
npm run dev -- --host

# URL de acesso
http://[SEU-IP-LOCAL]:5173
```

### Opção C - Chrome DevTools Device Mode

```
1. Abrir Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Selecionar dispositivo ou definir dimensões customizadas
```

---

## Matriz de Dispositivos

### Dispositivos Prioritários

| Dispositivo | Sistema | Navegador | Resolução | Status |
|-------------|---------|-----------|-----------|--------|
| iPhone SE (3rd gen) | iOS 16+ | Safari | 375x667 | ⏳ Pendente |
| iPhone 12/13 | iOS 15+ | Safari | 390x844 | ⏳ Pendente |
| iPhone 14/15 | iOS 17+ | Safari | 393x852 | ⏳ Pendente |
| Samsung Galaxy S21/S22 | Android 12+ | Chrome | 360x800 | ⏳ Pendente |
| Pixel 6/7 | Android 13+ | Chrome | 412x915 | ⏳ Pendente |
| iPad 9th gen | iPadOS 15+ | Safari | 810x1080 | ⏳ Pendente |
| iPad Pro 12.9" | iPadOS 16+ | Safari | 1024x1366 | ⏳ Pendente |

### Dispositivos Secundários

| Dispositivo | Sistema | Navegador | Resolução | Status |
|-------------|---------|-----------|-----------|--------|
| iPhone SE (1st gen) | iOS 15 | Safari | 320x568 | ⏳ Pendente |
| Samsung Galaxy A52 | Android 11+ | Chrome | 412x915 | ⏳ Pendente |
| Xiaomi Redmi Note 11 | Android 11+ | Chrome | 393x851 | ⏳ Pendente |

---

## Checklist de Testes por Dispositivo

### 📱 Template de Teste

```
Dispositivo: _______________
Sistema: _______________
Navegador: _______________
Resolução: _______________
Data do Teste: _______________
Testador: _______________
```

---

### 1. Navegação

| Item | Status | Observações |
|------|--------|-------------|
| Menu hamburguer funciona | ⬜ | |
| Sidebar drawer abre/fecha | ⬜ | |
| Todas as páginas acessíveis | ⬜ | |
| Transições suaves | ⬜ | |
| Sem overflow horizontal | ⬜ | |
| Scroll vertical suave | ⬜ | |
| Header fixo funciona | ⬜ | |
| Logo visível | ⬜ | |
| NotificationCenter abre | ⬜ | |
| Profile menu funciona | ⬜ | |

---

### 2. Formulários

| Item | Status | Observações |
|------|--------|-------------|
| Campos são clicáveis/focáveis | ⬜ | |
| Teclado apropriado aparece | ⬜ | |
| Validação funciona | ⬜ | |
| Mensagens de erro visíveis | ⬜ | |
| Submissão funciona | ⬜ | |
| Select/dropdown funciona | ⬜ | |
| Checkbox/radio funcionam | ⬜ | |
| Date picker funciona | ⬜ | |
| Textarea expansível | ⬜ | |
| Labels são legíveis | ⬜ | |

---

### 3. Interações

| Item | Status | Observações |
|------|--------|-------------|
| Botões respondem ao toque | ⬜ | |
| Feedback visual no toque | ⬜ | |
| Modais abrem corretamente | ⬜ | |
| Modais fecham (X e fora) | ⬜ | |
| Notificações aparecem | ⬜ | |
| Dropdowns funcionam | ⬜ | |
| Tabs funcionam | ⬜ | |
| Acordeões funcionam | ⬜ | |
| Tooltips acessíveis | ⬜ | |
| Loading states visíveis | ⬜ | |

---

### 4. Conteúdo

| Item | Status | Observações |
|------|--------|-------------|
| Texto legível (min 16px) | ⬜ | |
| Imagens carregam | ⬜ | |
| Ícones visíveis | ⬜ | |
| Contraste adequado | ⬜ | |
| Layout não quebra | ⬜ | |
| Cards bem espaçados | ⬜ | |
| Tabelas com scroll | ⬜ | |
| Gráficos legíveis | ⬜ | |
| Badges legíveis | ⬜ | |
| Avatares visíveis | ⬜ | |

---

### 5. Performance

| Item | Status | Observações |
|------|--------|-------------|
| Carregamento < 3s | ⬜ | |
| Animações suaves | ⬜ | |
| Sem travamentos | ⬜ | |
| Scroll fluido | ⬜ | |
| Imagens otimizadas | ⬜ | |

---

## Testes por Página

### Dashboard (`/dashboard`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| Stats grid layout | ⬜ | ⬜ | ⬜ |
| Welcome section | ⬜ | ⬜ | ⬜ |
| Quick actions | ⬜ | ⬜ | ⬜ |
| Cards responsivos | ⬜ | ⬜ | ⬜ |
| Mental health section | ⬜ | ⬜ | ⬜ |

---

### PDI (`/pdi`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| Header responsivo | ⬜ | ⬜ | ⬜ |
| Lista de PDIs | ⬜ | ⬜ | ⬜ |
| Modal criar PDI | ⬜ | ⬜ | ⬜ |
| Modal fullscreen | ⬜ | ⬜ | ⬜ |
| Formulário funcional | ⬜ | ⬜ | ⬜ |

---

### Competências (`/competencies`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| Header responsivo | ⬜ | ⬜ | ⬜ |
| Botões condensados | ⬜ | ⬜ | ⬜ |
| Rating stars touch | ⬜ | ⬜ | ⬜ |
| Gráficos legíveis | ⬜ | ⬜ | ⬜ |
| Tabs funcionais | ⬜ | ⬜ | ⬜ |

---

### Calendário (`/calendar`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| Header responsivo | ⬜ | ⬜ | ⬜ |
| Stats grid | ⬜ | ⬜ | ⬜ |
| Calendário navegável | ⬜ | ⬜ | ⬜ |
| Event modal | ⬜ | ⬜ | ⬜ |
| Filtros | ⬜ | ⬜ | ⬜ |

---

### Mental Health (`/mental-health`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| Header responsivo | ⬜ | ⬜ | ⬜ |
| Consent modal | ⬜ | ⬜ | ⬜ |
| Resource cards | ⬜ | ⬜ | ⬜ |
| Forms | ⬜ | ⬜ | ⬜ |
| Análises | ⬜ | ⬜ | ⬜ |

---

### Admin Pages (`/admin/*`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| CompetencyManager header | ⬜ | ⬜ | ⬜ |
| CompetencyManager table | ⬜ | ⬜ | ⬜ |
| PeopleManagement header | ⬜ | ⬜ | ⬜ |
| PeopleManagement filters | ⬜ | ⬜ | ⬜ |
| PeopleManagement table | ⬜ | ⬜ | ⬜ |

---

### Login (`/login`)

| Funcionalidade | iPhone | Android | iPad |
|----------------|--------|---------|------|
| Layout centralizado | ⬜ | ⬜ | ⬜ |
| Form fields | ⬜ | ⬜ | ⬜ |
| Teclado email | ⬜ | ⬜ | ⬜ |
| Social login buttons | ⬜ | ⬜ | ⬜ |
| Toggle login/signup | ⬜ | ⬜ | ⬜ |

---

## Teste de Conexão Lenta

### Configuração no Chrome DevTools

```
1. Abrir DevTools (F12)
2. Network tab
3. Throttling dropdown
4. Selecionar "Fast 3G" ou "Slow 3G"
```

### Checklist Conexão Lenta

| Item | Fast 3G | Slow 3G |
|------|---------|---------|
| Carregamento inicial | ⬜ | ⬜ |
| Imagens carregam | ⬜ | ⬜ |
| Loading states visíveis | ⬜ | ⬜ |
| Timeout handling | ⬜ | ⬜ |
| Forms submetem | ⬜ | ⬜ |

---

## Relatório de Bugs

### Template de Bug

```markdown
## Bug #XX: [Título Descritivo]

**Dispositivo:** [ex: iPhone 12, iOS 15.5]
**Navegador:** [ex: Safari 15.5]
**Resolução:** [ex: 390x844]
**Severidade:** [Crítica / Alta / Média / Baixa]

### Descrição
[Descrição clara do problema]

### Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [...]

### Comportamento Esperado
[O que deveria acontecer]

### Comportamento Atual
[O que está acontecendo]

### Screenshots/Video
[Anexar evidências]

### Notas Adicionais
[Informações relevantes]
```

---

## Bugs Encontrados

<!-- Adicionar bugs conforme descobertos -->

### Bug #01: [Placeholder - Aguardando Testes]

**Dispositivo:** -  
**Navegador:** -  
**Severidade:** -

**Descrição:** Aguardando execução dos testes em dispositivos reais.

---

## Resumo dos Testes

| Categoria | Passou | Falhou | Pendente |
|-----------|--------|--------|----------|
| Navegação | 0 | 0 | 10 |
| Formulários | 0 | 0 | 10 |
| Interações | 0 | 0 | 10 |
| Conteúdo | 0 | 0 | 10 |
| Performance | 0 | 0 | 5 |
| **Total** | **0** | **0** | **45** |

---

## Notas de Orientação para Rotação

### Testes de Rotação

| Página | Portrait → Landscape | Landscape → Portrait |
|--------|---------------------|----------------------|
| Dashboard | ⬜ | ⬜ |
| PDI | ⬜ | ⬜ |
| Competencies | ⬜ | ⬜ |
| Calendar | ⬜ | ⬜ |
| Mental Health | ⬜ | ⬜ |
| Login | ⬜ | ⬜ |

### Verificar em Rotação
- [ ] Layout se adapta corretamente
- [ ] Modais permanecem centrados
- [ ] Não há perda de dados em formulários
- [ ] Scroll position é mantido
- [ ] Sidebar/drawer funciona corretamente

---

## Aprovação Final

| Critério | Status |
|----------|--------|
| Todos os bugs críticos resolvidos | ⬜ |
| Todos os bugs altos resolvidos | ⬜ |
| 90%+ dos testes passaram | ⬜ |
| Performance aceitável | ⬜ |
| **Aprovado para Produção** | ⬜ |

---

**Próximos Passos:**
1. Executar testes nos dispositivos reais listados
2. Documentar bugs encontrados usando o template
3. Priorizar correções por severidade
4. Re-testar após correções
5. Atualizar status final

---

*Documento gerado em 08/12/2025*
