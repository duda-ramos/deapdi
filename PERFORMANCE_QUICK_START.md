# 🚀 Guia Rápido - Validação de Performance

## ⏱️ Tempo Total: 30 minutos

---

## 📋 PASSO 1: Análise de Queries (10 min)

### Acessar Supabase:
1. Abra [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto TalentFlow
3. Vá para **SQL Editor**

### Executar Queries:
```bash
# Abra o arquivo:
PERFORMANCE_VALIDATION_QUERIES.sql
```

**Queries Essenciais (executar nesta ordem):**

#### 1. Cache Hit Rate (CRÍTICO)
```sql
-- Seção 1.2 do arquivo SQL
-- ESPERADO: > 95%
-- SE < 90%: Sistema com problema de memória
```

#### 2. Verificar Índices Críticos
```sql
-- Seção 2.1 do arquivo SQL
-- ESPERADO: Todos com ✅ EXISTS
```

#### 3. Query de Notificações (Mais Usada)
```sql
-- Seção 3.3 do arquivo SQL
-- ESPERADO: < 30ms
-- Anotar tempo de Execution Time
```

#### 4. Query de PDIs
```sql
-- Seção 3.1 do arquivo SQL
-- ESPERADO: < 50ms
-- Verificar se usa Index Scan
```

### 📊 Documentar Resultados:
```
Cache Hit Rate: ____%
Notificações Time: ___ms
PDIs Time: ___ms
Índices Missing: ___
```

---

## 🌐 PASSO 2: Teste de Interface (10 min)

### Setup:
```bash
# Terminal
npm run dev
```

### Testes com Chrome DevTools:

#### Teste A: Login e Dashboard
1. Abra Chrome DevTools (F12)
2. Vá para **Network** tab
3. Faça login
4. **Medir:** Tempo até dashboard carregar
   - ✅ ESPERADO: < 3 segundos

#### Teste B: Navegação Intensiva
1. DevTools > **Performance** tab
2. Clique em **Record** (●)
3. Navegue: Dashboard → PDI → Competências → Grupos → Dashboard
4. Repita o ciclo **5 vezes**
5. Pare gravação
6. Verifique **Main thread**
   - ✅ ESPERADO: Sem longTasks > 500ms

#### Teste C: Criar PDI
1. Network tab aberto
2. Clique em "Novo PDI"
3. Preencha formulário
4. Clique "Criar"
5. **Medir:** Tempo até confirmação
   - ✅ ESPERADO: < 2 segundos

### 📊 Documentar:
```
Login Time: ___s
Navegação: ✅ Fluida / ⚠️ Travamentos
Criar PDI: ___s
```

---

## 🧠 PASSO 3: Memória (5 min)

### No Chrome DevTools:

1. **Memory** tab
2. Clique em "Take heap snapshot" → Snapshot 1
3. Navegue intensivamente por 2 minutos
4. Clique no ícone 🗑️ (Garbage Collection)
5. "Take heap snapshot" → Snapshot 2
6. Compare ambos snapshots

### 📊 Verificar:
```
Snapshot 1: ___MB
Snapshot 2: ___MB
Crescimento: ___MB

✅ ESPERADO: Crescimento < 50MB
⚠️ ALERTA: Crescimento > 100MB
```

### Memory Monitor (Console):
```javascript
// Cole no Console
memoryMonitor.getMemorySummary()

// ESPERADO:
// peak < 80MB
// average < 50MB
```

---

## 💾 PASSO 4: Cache (5 min)

### Validação de Cache no Console:
```javascript
// 1. Verificar cache de perfil
console.log('🔍 Testing profile cache...');

// 2. Navegar para Profile
// 3. Voltar para Dashboard
// 4. Ir novamente para Profile

// 5. No console, verificar logs:
// Deve aparecer: "✅ Profile found in cache"
```

### Validação de Subscriptions:
```javascript
// Verificar subscriptions ativas
console.log(window.supabase?.getChannels());

// ESPERADO: Array com subscriptions ativas
// Verifique se cleanup acontece ao mudar de página
```

---

## 📄 RESULTADOS FINAIS

### Preencher Template:

```markdown
## Performance Test Results - [DATA]

### ✅ Queries Críticas
- Cache Hit Rate: ___% (esperado: > 95%)
- Notificações: ___ms (esperado: < 30ms)
- PDIs: ___ms (esperado: < 50ms)
- Índices Missing: ___ (esperado: 0)

### ✅ Interface
- Login + Dashboard: ___s (esperado: < 3s)
- Navegação: [✅ Fluida / ⚠️ Travamentos]
- Criar PDI: ___s (esperado: < 2s)
- Network Waterfall: [✅ Normal / ⚠️ Requests lentos]

### ✅ Memória
- Heap Growth: ___MB (esperado: < 50MB)
- Memory Leaks: [✅ Nenhum / ⚠️ Detectados]
- Detached DOM: [✅ Zero / ⚠️ Acumulando]

### ✅ Cache
- Profile Cache: [✅ Funcionando / ⚠️ Problema]
- Subscriptions Cleanup: [✅ OK / ⚠️ Leak]

### 🎯 Status Final
[ ] ✅ Todos critérios atendidos - APROVADO
[ ] ⚠️ Issues menores - APROVADO com ressalvas
[ ] ❌ Problemas críticos - REQUER AÇÃO

### 📝 Observações:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🎓 CRITÉRIOS DE ACEITAÇÃO

### ✅ PASSAR (Sistema Saudável):
- Cache Hit Rate > 95%
- Queries críticas < 500ms
- Login + Dashboard < 3s
- Memory growth < 50MB
- Zero memory leaks críticos

### ⚠️ ATENÇÃO (Requer Otimização):
- Cache Hit Rate 85-95%
- Queries críticas 500ms-1s
- Login + Dashboard 3-5s
- Memory growth 50-100MB
- Memory leaks menores

### ❌ FALHA (Ação Imediata):
- Cache Hit Rate < 85%
- Queries críticas > 1s
- Login + Dashboard > 5s
- Memory growth > 100MB
- Memory leaks críticos

---

## 🔧 AÇÕES RÁPIDAS SE PROBLEMAS

### Se Cache Hit Rate < 95%:
```sql
-- Executar no Supabase SQL Editor:
VACUUM ANALYZE;
```

### Se Queries Lentas:
```sql
-- Criar índices recomendados (Seção 9 do SQL):
-- PERFORMANCE_VALIDATION_QUERIES.sql linha 400+
```

### Se Memory Leaks:
```javascript
// 1. Verificar subscriptions:
console.log(window.supabase?.getChannels());

// 2. Force cleanup:
window.location.reload();

// 3. Verificar novamente após navegação
```

---

## 📚 DOCUMENTOS DE REFERÊNCIA

1. **PERFORMANCE_TEST_RESULTS.md** - Análise completa do sistema
2. **PERFORMANCE_VALIDATION_QUERIES.sql** - Todas as queries SQL
3. Este arquivo - Guia rápido de execução

---

## 🎯 PRÓXIMOS PASSOS (Se Aprovado)

1. ✅ Documentar resultados
2. ⚠️ Implementar índices recomendados (se necessário)
3. 🚀 Deploy em produção
4. 📊 Monitorar em produção por 7 dias
5. 🔄 Repetir validação após 30 dias

---

## ❓ TROUBLESHOOTING

**Problema:** Cache Hit Rate baixo
**Solução:** VACUUM ANALYZE + verificar shared_buffers

**Problema:** Queries lentas de notificações
**Solução:** Criar índice composto (Seção 9.1 do SQL)

**Problema:** Memory leak detectado
**Solução:** Verificar subscriptions + reload + retest

**Problema:** Dashboard lento
**Solução:** Verificar Network tab para requests lentos específicos

---

**Tempo Total Estimado:** 30 minutos  
**Próxima Validação:** Após deploy em produção  
**Responsável:** [SEU NOME]
