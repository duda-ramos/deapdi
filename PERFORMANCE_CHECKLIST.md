# ✅ Checklist de Validação de Performance - TalentFlow

**Data:** ___/___/2025  
**Executado por:** _________________  
**Ambiente:** [ ] Dev [ ] Staging [ ] Produção

---

## 📋 PARTE 1: QUERIES NO SUPABASE (10 min)

### 1.1 Cache Hit Rate
```
[ ] Acessar Supabase Dashboard > SQL Editor
[ ] Executar query de Cache Hit Rate (PERFORMANCE_VALIDATION_QUERIES.sql - Seção 1.2)
[ ] Resultado: _____% (esperado: > 95%)
[ ] Status: [ ] ✅ OK [ ] ⚠️ Atenção [ ] ❌ Falha
```

### 1.2 Verificar Índices Críticos
```
[ ] Executar query Seção 2.1
[ ] idx_notifications_profile: [ ] ✅ EXISTS [ ] ❌ MISSING
[ ] idx_pdis_profile: [ ] ✅ EXISTS [ ] ❌ MISSING
[ ] idx_tasks_assignee: [ ] ✅ EXISTS [ ] ❌ MISSING
[ ] idx_competencies_profile: [ ] ✅ EXISTS [ ] ❌ MISSING
[ ] idx_profiles_manager_id: [ ] ✅ EXISTS [ ] ❌ MISSING
```

### 1.3 Tempo de Queries Críticas
```
EXPLAIN ANALYZE Results:

[ ] Notificações (Seção 3.3)
    Execution Time: _____ms (esperado: < 30ms)
    [ ] Index Scan [ ] Sequential Scan
    Status: [ ] ✅ OK [ ] ⚠️ Lento [ ] ❌ Muito lento

[ ] PDIs (Seção 3.1)
    Execution Time: _____ms (esperado: < 50ms)
    [ ] Index Scan [ ] Sequential Scan
    Status: [ ] ✅ OK [ ] ⚠️ Lento [ ] ❌ Muito lento

[ ] Dashboard Gestor (Seção 3.2)
    Execution Time: _____ms (esperado: < 100ms)
    Status: [ ] ✅ OK [ ] ⚠️ Lento [ ] ❌ Muito lento

[ ] Competências (Seção 3.4)
    Execution Time: _____ms (esperado: < 30ms)
    Status: [ ] ✅ OK [ ] ⚠️ Lento [ ] ❌ Muito lento
```

### 1.4 Índices Não Utilizados
```
[ ] Executar query Seção 5.2
[ ] Encontrados _____ índices sem uso
[ ] Action: [ ] Manter [ ] Remover (listar): __________________
```

---

## 🌐 PARTE 2: TESTE DE INTERFACE (10 min)

### 2.1 Setup
```
[ ] Terminal: npm run dev
[ ] Aguardar servidor iniciar
[ ] Abrir Chrome (não Firefox/Safari)
[ ] Abrir DevTools (F12)
```

### 2.2 Teste A: Login e Dashboard
```
[ ] Network tab aberta
[ ] Clear (🚫) para limpar requests anteriores
[ ] Fazer login
[ ] Aguardar dashboard carregar completamente

Tempo Total: _____s (esperado: < 3s)
[ ] ✅ < 3s [ ] ⚠️ 3-5s [ ] ❌ > 5s

Observações:
_________________________________________
```

### 2.3 Teste B: Navegação Intensiva
```
[ ] Performance tab aberta
[ ] Clicar Record (●)
[ ] Navegar: Dashboard → PDI → Competências → Grupos → Dashboard
[ ] Repetir 5x
[ ] Stop Recording

Análise:
[ ] Main thread: [ ] Fluido [ ] ⚠️ Alguns travamentos [ ] ❌ Travado
[ ] Long tasks (> 500ms): _____ encontrados
[ ] FPS médio: _____ (esperado: > 30fps)

Status: [ ] ✅ OK [ ] ⚠️ Atenção [ ] ❌ Problema
```

### 2.4 Teste C: Criar PDI
```
[ ] Network tab aberta
[ ] Clicar "Novo PDI"
[ ] Preencher: Título, Descrição, Prazo
[ ] Clicar "Criar"

Tempo: _____s (esperado: < 2s)
[ ] ✅ < 2s [ ] ⚠️ 2-4s [ ] ❌ > 4s

Requests executados: _____
Algum request > 1s? [ ] Não [ ] Sim: ______________
```

### 2.5 Teste D: Navegação no Dashboard
```
[ ] Carregar dashboard
[ ] Network tab: verificar waterfall
[ ] Total requests: _____
[ ] Requests em paralelo: [ ] Sim [ ] Não
[ ] Algum bloqueio? [ ] Não [ ] Sim: ______________

Status: [ ] ✅ Otimizado [ ] ⚠️ Pode melhorar [ ] ❌ Problema
```

---

## 🧠 PARTE 3: MEMÓRIA (5 min)

### 3.1 Heap Snapshots
```
[ ] DevTools > Memory tab
[ ] Selecionar "Heap snapshot"
[ ] Take snapshot → Snapshot 1

Snapshot 1 Size: _____MB

[ ] Navegar intensivamente por 2 min
[ ] Clicar 🗑️ (Garbage Collection)
[ ] Take snapshot → Snapshot 2

Snapshot 2 Size: _____MB

Crescimento: _____MB (esperado: < 50MB)
[ ] ✅ < 50MB [ ] ⚠️ 50-100MB [ ] ❌ > 100MB
```

### 3.2 Detached DOM Nodes
```
[ ] Comparar Snapshot 1 e 2
[ ] Filtrar por "Detached"

Detached DOM encontrados: _____
[ ] ✅ 0 [ ] ⚠️ < 10 [ ] ❌ > 10

Se > 0, listar componentes:
_________________________________________
```

### 3.3 Memory Monitor
```
[ ] Console: memoryMonitor.getMemorySummary()

Peak: _____MB (esperado: < 80MB)
Average: _____MB (esperado: < 50MB)
Current: _____MB

Status: [ ] ✅ OK [ ] ⚠️ Alto [ ] ❌ Muito alto

Warnings no console? [ ] Não [ ] Sim: ______________
```

---

## 💾 PARTE 4: CACHE (5 min)

### 4.1 Profile Cache
```
[ ] Console: observar logs durante navegação
[ ] Navegar: Profile → Dashboard → Profile

Logs esperados:
[ ] "✅ Profile found in cache" apareceu
[ ] "Cached profile" apareceu no primeiro acesso
[ ] Cache expira após 30s

Status: [ ] ✅ Funcionando [ ] ⚠️ Problema [ ] ❌ Não funciona
```

### 4.2 Subscriptions Cleanup
```
[ ] Console: window.supabase?.getChannels()
[ ] Anotar número de channels: _____

[ ] Navegar entre páginas 3x
[ ] Executar novamente: window.supabase?.getChannels()
[ ] Número de channels: _____

Crescimento de channels: _____
[ ] ✅ Sem crescimento [ ] ⚠️ Crescimento < 5 [ ] ❌ Crescimento > 5

Observações:
_________________________________________
```

### 4.3 Requests Duplicados
```
[ ] Network tab aberta
[ ] Clear (🚫)
[ ] Navegar para página PDI

Total requests: _____
Requests duplicados? [ ] Não [ ] Sim: ______________

Se sim, listar URLs:
_________________________________________
_________________________________________
```

---

## 📊 RESUMO DOS RESULTADOS

### Queries (Parte 1)
```
Cache Hit Rate: _____% [ ] ✅ [ ] ⚠️ [ ] ❌
Índices Missing: _____ [ ] ✅ 0 [ ] ⚠️ 1-2 [ ] ❌ > 2
Queries Lentas: _____ [ ] ✅ 0 [ ] ⚠️ 1-2 [ ] ❌ > 2

STATUS PARTE 1: [ ] ✅ PASSAR [ ] ⚠️ ATENÇÃO [ ] ❌ FALHA
```

### Interface (Parte 2)
```
Login Time: _____s [ ] ✅ [ ] ⚠️ [ ] ❌
Navegação: [ ] ✅ Fluida [ ] ⚠️ Travamentos [ ] ❌ Problemas
Criar PDI: _____s [ ] ✅ [ ] ⚠️ [ ] ❌

STATUS PARTE 2: [ ] ✅ PASSAR [ ] ⚠️ ATENÇÃO [ ] ❌ FALHA
```

### Memória (Parte 3)
```
Heap Growth: _____MB [ ] ✅ [ ] ⚠️ [ ] ❌
Detached DOM: _____ [ ] ✅ [ ] ⚠️ [ ] ❌
Memory Leaks: [ ] ✅ Nenhum [ ] ⚠️ Menores [ ] ❌ Críticos

STATUS PARTE 3: [ ] ✅ PASSAR [ ] ⚠️ ATENÇÃO [ ] ❌ FALHA
```

### Cache (Parte 4)
```
Profile Cache: [ ] ✅ OK [ ] ⚠️ Problema [ ] ❌ Não funciona
Subscriptions: [ ] ✅ OK [ ] ⚠️ Leak menor [ ] ❌ Leak crítico
Requests: [ ] ✅ Otimizado [ ] ⚠️ Duplicados [ ] ❌ Muitos duplicados

STATUS PARTE 4: [ ] ✅ PASSAR [ ] ⚠️ ATENÇÃO [ ] ❌ FALHA
```

---

## 🎯 AVALIAÇÃO FINAL

### Score Total
```
Parte 1 (Queries): ___/10
Parte 2 (Interface): ___/10
Parte 3 (Memória): ___/10
Parte 4 (Cache): ___/10

TOTAL: ___/40 pontos

[ ] 36-40: ✅ EXCELENTE - Aprovado sem ressalvas
[ ] 30-35: ✅ BOM - Aprovado com melhorias menores
[ ] 24-29: ⚠️ REGULAR - Aprovado com ressalvas
[ ] < 24: ❌ INSUFICIENTE - Requer melhorias antes de aprovar
```

### Critérios de Aceitação
```
[ ] ✅ Cache Hit Rate > 95%
[ ] ✅ Queries críticas < 500ms
[ ] ✅ Login + Dashboard < 3s
[ ] ✅ Operações CRUD < 2s
[ ] ✅ Navegação fluida sem travamentos
[ ] ✅ Memory growth < 50MB
[ ] ✅ Zero memory leaks críticos
[ ] ✅ Profile cache funcionando
[ ] ✅ Subscriptions cleanup OK

Total atendidos: ___/9

Mínimo para aprovação: 7/9
```

---

## 📝 ISSUES IDENTIFICADOS

### Críticos (Bloquear Deploy)
```
1. _________________________________________
2. _________________________________________
3. _________________________________________
```

### Médios (Resolver em Sprint 1)
```
1. _________________________________________
2. _________________________________________
3. _________________________________________
```

### Menores (Backlog)
```
1. _________________________________________
2. _________________________________________
3. _________________________________________
```

---

## 🚀 AÇÕES RECOMENDADAS

### Imediatas (Hoje)
```
[ ] _________________________________________
[ ] _________________________________________
[ ] _________________________________________
```

### Curto Prazo (Esta Semana)
```
[ ] Implementar 4 índices recomendados (PERFORMANCE_VALIDATION_QUERIES.sql Seção 9)
[ ] _________________________________________
[ ] _________________________________________
```

### Médio Prazo (Próximas 2 Semanas)
```
[ ] Avaliar implementação de React Query
[ ] _________________________________________
[ ] _________________________________________
```

---

## ✍️ ASSINATURAS

```
Testador: _________________ Data: ___/___/2025

Revisor: __________________ Data: ___/___/2025

Aprovação: ________________ Data: ___/___/2025

Status Final: [ ] ✅ APROVADO [ ] ⚠️ APROVADO COM RESSALVAS [ ] ❌ REPROVADO
```

---

## 📎 ANEXOS

```
[ ] Screenshots de problemas anexados
[ ] Logs de erro salvos
[ ] Heap snapshots exportados
[ ] Network HAR files salvos
[ ] PERFORMANCE_TEST_RESULTS.md revisado
```

---

**Próxima Validação:** ___/___/2025  
**Responsável:** _________________

---

### 💡 Dicas Rápidas

- ⏱️ Reserve 30 minutos sem interrupções
- 🌐 Use Chrome (DevTools mais completo)
- 📸 Tire screenshots de problemas
- 📝 Documente observações em tempo real
- 🔄 Se algo falhar, execute novamente
- ✅ Marque cada checkbox conforme avança
- 📊 Compare sempre com valores esperados

### 📞 Contatos de Suporte

- DevOps: _________________
- Backend: _________________
- Frontend: _________________
