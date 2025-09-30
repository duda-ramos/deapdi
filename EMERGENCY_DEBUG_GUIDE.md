# Guia de Debug de Emergência

## Se o Loop Persistir Após Todas as Correções

Este guia fornece estratégias avançadas para identificar e corrigir loops infinitos teimosos.

---

## 🚨 Passo 1: Ativar Debug System

Abra o console do navegador (F12) e execute:

```javascript
debugSystem.enable()
```

Isso ativará:
- Detecção automática de loops (10x em 1 segundo)
- Emergency break automático
- Logging detalhado de todas as operações
- Tracking de performance

O sistema irá **pausar automaticamente** se detectar um loop e mostrar:
- Qual componente/ação está em loop
- Quantas vezes executou
- Histórico recente de eventos

---

## 🔍 Passo 2: Identificar o Componente Problemático

### Método 1: Usar Debug Stats

No console:

```javascript
debugSystem.printStats()
```

Procure por:
- **componentCounts** com valores muito altos (>100)
- **potentialLoops** com contagens suspeitas
- **actionCounts** repetindo muito

### Método 2: Chrome DevTools Performance

1. Abra DevTools (F12)
2. Vá em **Performance** tab
3. Clique em **Record** (círculo vermelho)
4. Aguarde o loop acontecer (3-5 segundos)
5. Clique em **Stop**
6. Procure por:
   - **Flame graph** com funções repetindo
   - **Call tree** mostrando recursão
   - **Bottom-Up** para ver tempo gasto

### Método 3: React DevTools Profiler

1. Instale React DevTools extension
2. Abra DevTools → **Profiler** tab
3. Clique em **Record**
4. Aguarde o loop
5. Clique em **Stop**
6. Veja quais componentes renderizam mais

---

## 🛠️ Passo 3: Correções Específicas por Tipo de Loop

### Loop Tipo 1: Auth Infinito

**Sintomas:**
- Mensagem "Loop de autenticação detectado"
- Console cheio de logs de AUTH
- Página recarregando sozinha

**Correção Imediata:**

```javascript
// No console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**Correção Permanente:**
1. Abra `.env`
2. Confirme que URL e KEY são **do Supabase**, não do Bolt
3. Verifique que KEY não expirou:
   ```javascript
   // No console
   const token = 'COLE_SEU_TOKEN_AQUI'
   const payload = JSON.parse(atob(token.split('.')[1]))
   console.log('Expira em:', new Date(payload.exp * 1000))
   console.log('Issuer:', payload.iss) // Deve ser "supabase"
   ```

### Loop Tipo 2: Subscription Infinita

**Sintomas:**
- Console cheio de logs de 🔔 ou 🏆
- Status "connecting" piscando
- Network tab mostrando websocket reconnecting

**Correção:**

```javascript
// No console - forçar unsubscribe de tudo
if (window.supabase) {
  window.supabase.removeAllChannels()
}
```

Depois, recarregue a página.

### Loop Tipo 3: useEffect Infinito

**Sintomas:**
- Componente específico renderizando sem parar
- Debug stats mostrando RENDER ou EFFECT repetindo
- Performance degradando rapidamente

**Identificar componente:**

```javascript
// No console
debugSystem.getStats().componentCounts
```

**Correção Temporária:**
1. Identifique o componente problemático
2. Comente o componente temporariamente
3. Sistema deve estabilizar
4. Analise o useEffect do componente

**Correção Permanente:**
- Verifique array de dependências do useEffect
- Confirme que não tem setState no body do componente
- Adicione flag de cleanup se necessário

### Loop Tipo 4: Network Request Loop

**Sintomas:**
- Network tab cheio de requests duplicados
- Mesma URL sendo chamada repetidamente
- Erro 400/401 repetindo

**Correção:**

```javascript
// No console - identificar requests
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('supabase'))
  .slice(-20) // últimos 20
```

Se vir muitos requests para `/auth/` ou `/rest/`:
1. Credenciais provavelmente inválidas
2. Siga correção do Loop Tipo 1

---

## 🔧 Passo 4: Disable Tudo e Teste Isoladamente

Se nada funcionar, desabilite features uma por uma:

### Desabilitar Notifications

Em `src/App.tsx`, comente:

```typescript
// <NotificationCenter />
```

Recarregue. Loop parou? → Problema nas notifications.

### Desabilitar Achievements

Em `src/App.tsx`, comente:

```typescript
// <AchievementProvider>
```

Recarregue. Loop parou? → Problema nos achievements.

### Desabilitar Auth

**NÃO RECOMENDADO** mas para teste:

Em `src/App.tsx`, force:

```typescript
const { setupComplete } = useSupabaseSetup();
// Adicione
if (!setupComplete) {
  return <div>Offline Mode</div>
}
```

---

## 📊 Passo 5: Análise de Memória

Se loop causa travamento/lentidão:

### Chrome Memory Profiler

1. DevTools → **Memory** tab
2. Selecione **Heap snapshot**
3. Clique em **Take snapshot**
4. Aguarde 10 segundos
5. Clique em **Take snapshot** novamente
6. Compare os snapshots
7. Procure por:
   - **Detached DOM nodes** crescendo
   - **Arrays** muito grandes
   - **Closures** acumulando

### Memory Timeline

1. DevTools → **Performance** tab
2. Check **Memory** checkbox
3. Record por 10 segundos
4. Analise o gráfico:
   - Linha crescendo = memory leak
   - Dentes de serra = garbage collection normal
   - Linha reta = saudável

---

## 🎯 Passo 6: Versão Mínima Funcional

Se tudo falhar, crie versão mínima:

### 1. Backup Atual

```bash
cp -r /tmp/cc-agent/56983565/project /tmp/backup-project
```

### 2. Criar App Minimal

Crie `src/AppMinimal.tsx`:

```typescript
import React from 'react';

function AppMinimal() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimal Test</h1>
      <p>If you see this, React is working.</p>
      <button onClick={() => alert('Click works!')}>
        Test Button
      </button>
    </div>
  );
}

export default AppMinimal;
```

### 3. Substituir em main.tsx

```typescript
// Em src/main.tsx, substitua
import App from './App'
// por
import App from './AppMinimal'
```

### 4. Teste

```bash
npm run dev
```

Se funcionar → Problema está em algum componente.
Se não funcionar → Problema em configuração base.

### 5. Adicionar Features Gradualmente

1. ✅ Minimal funciona
2. Adicione `AuthProvider` apenas
3. Teste
4. Adicione `Login` component
5. Teste
6. Continue até encontrar o problema

---

## 🆘 Comandos de Emergência

### Reset Completo do Browser

```javascript
// No console
localStorage.clear()
sessionStorage.clear()
indexedDB.deleteDatabase('supabase')
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
location.reload()
```

### Reset Supabase Client

```javascript
// No console
if (window.supabase) {
  window.supabase.removeAllChannels()
  window.supabase = null
}
```

### Forçar Modo Offline

```javascript
// No console
localStorage.setItem('OFFLINE_MODE', 'true')
location.reload()
```

### Export Debug History

```javascript
// No console
const history = debugSystem.exportHistory()
console.log(history)
// Copie e envie para análise
```

---

## 📋 Checklist de Troubleshooting

### Básico ✓
- [ ] Credenciais Supabase são válidas (não Bolt)?
- [ ] Token não expirou (exp > now)?
- [ ] URL tem formato correto?
- [ ] Internet está funcionando?
- [ ] Projeto Supabase está ativo?

### Browser ✓
- [ ] Testou em modo anônimo?
- [ ] Desabilitou extensões?
- [ ] Limpou cache e storage?
- [ ] Testou em outro browser?
- [ ] Console não mostra erros de CORS?

### Código ✓
- [ ] `npm run build` passa?
- [ ] `npm run type-check` passa?
- [ ] Não há erros no console?
- [ ] Debug system mostra loops?
- [ ] Memory não está crescendo?

### Supabase ✓
- [ ] Dashboard acessível?
- [ ] Projeto está online?
- [ ] Tables existem?
- [ ] RLS não tem recursão?
- [ ] Auth habilitado?

---

## 🔬 Ferramentas de Diagnóstico

### No Projeto

```typescript
// src/utils/debugger.ts
debugSystem.enable()        // Ativar debug
debugSystem.printStats()    // Ver estatísticas
debugSystem.getRecentHistory(50) // Últimos 50 eventos
debugSystem.exportHistory() // Exportar tudo
debugSystem.resetEmergencyBreak() // Reset após loop
```

### No Browser Console

```javascript
// Ver performance
performance.getEntriesByType('navigation')
performance.getEntriesByType('resource').length

// Ver memory
performance.memory.usedJSHeapSize / 1048576 // MB

// Ver network
performance.getEntriesByType('resource')
  .filter(r => r.duration > 1000) // Requests lentos

// Ver event listeners
getEventListeners(document) // Chrome only
```

---

## 📞 Quando Pedir Ajuda

Se tentou tudo acima e ainda não resolveu, forneça:

1. **Output do debugSystem**:
   ```javascript
   debugSystem.exportHistory()
   ```

2. **Console errors**:
   - Screenshot dos erros
   - Ou copiar texto completo

3. **Network tab**:
   - Screenshot mostrando requests
   - Verificar se há requests falhando

4. **Configuração**:
   - Versões (package.json)
   - Ambiente (Dev/Prod)
   - Browser e versão

5. **Steps to reproduce**:
   - O que fez antes do loop
   - Página específica
   - Ação que dispara

---

## 🎓 Lições Aprendidas

### Prevenção Futura

Ao adicionar código novo:

1. **Sempre** adicione cleanup em useEffect
2. **Sempre** verifique dependências
3. **Sempre** use try-catch em async
4. **Sempre** teste desmontagem do componente
5. **Sempre** verifique memória após implementar

### Red Flags

Cuidado com:
- useEffect sem dependências
- setState em callbacks sem cleanup
- Subscriptions sem unsubscribe
- Requests sem timeout
- Loops sem limite de iterações

---

## ✅ Sistema Está Saudável Se...

- [ ] Memory estável (não cresce)
- [ ] Subscriptions limitadas (<10 active)
- [ ] Renders normais (<5 por segundo)
- [ ] Network requests razoáveis (<1 por segundo)
- [ ] Console sem warnings repetidos
- [ ] CPU normal (<30% na maior parte do tempo)

---

**Criado**: 2025-09-30
**Versão**: 1.0
**Status**: Pronto para uso em emergência
