# ⚡ CHECKLIST RÁPIDO - TESTES DE ISOLAMENTO DE DADOS

## 🎯 PREPARAÇÃO (5 min)

```bash
# 1. Verificar usuários de teste
psql <connection_string> -f VALIDATE_USER_ISOLATION_QUERY.sql
```

**OU** Execute no Supabase SQL Editor

```bash
# 2. Iniciar servidor
npm run dev
```

**Credenciais (escolha um conjunto):**

### Opção A: @example.com
- Employee: carlos@example.com
- Manager: gabriela@example.com  
- HR: rita@example.com
- Admin: lucas@example.com

### Opção B: @deapdi-test.local
- Employee: colab1.teste@deapdi-test.local / `Colab@2025!`
- Manager: gestor1.teste@deapdi-test.local / `Gestor@2025!`
- HR: rh.teste@deapdi-test.local / `RH@2025!`
- Admin: admin.teste@deapdi-test.local / `Admin@2025!`

---

## 🖥️ SETUP (5 min)

- [ ] Abrir 4 navegadores diferentes (ou janelas anônimas)
- [ ] Fazer login com cada role simultaneamente
- [ ] Organizar janelas lado a lado
- [ ] Abrir DevTools (F12) em cada janela

---

## 🧪 TESTES CRÍTICOS (30-45 min)

### ✅ EMPLOYEE (10 min)

- [ ] Ver PDIs → Apenas próprios ✅
- [ ] Tentar URL de PDI alheio → Bloqueado ❌
- [ ] Ver check-ins → Apenas próprios ✅
- [ ] Tentar URL de check-in alheio → Bloqueado ❌
- [ ] Tentar acessar `/people` → Bloqueado ❌
- [ ] Verificar favoritos → Apenas próprios ✅
- [ ] **API check:** `/api/favorites` retorna só próprios ✅

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

### ⚠️ MANAGER (15 min) - TESTES MAIS CRÍTICOS

- [ ] Ver equipe → Apenas subordinados diretos ✅
- [ ] Conferir com SQL → Quantidade bate ✅
- [ ] Ver PDIs → Apenas da equipe ✅
- [ ] Tentar PDI de outro gestor → Bloqueado ❌
- [ ] **CRÍTICO:** Ver check-ins → NÃO deve ver subordinados ❌
- [ ] **CRÍTICO:** Tentar URL check-in subordinado → Bloqueado ❌
- [ ] **CRÍTICO:** API `/api/checkins` → NÃO retorna subordinados ❌
- [ ] Ver competências → Apenas da equipe ✅

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

### 🔓 HR (10 min)

- [ ] Ver todos colaboradores → Total correto ✅
- [ ] Ver todos PDIs → Acesso total ✅
- [ ] Dashboard saúde mental → Ver todos check-ins ✅
- [ ] Ver alertas de estresse → Colaboradores em risco ✅
- [ ] Registros psicológicos → Acesso completo ✅
- [ ] Solicitações de terapia → Gerenciar todas ✅

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

### 🔑 ADMIN (5 min)

- [ ] Acesso a todas funcionalidades ✅
- [ ] Menu de configurações existe ✅
- [ ] Gerenciar usuários ✅
- [ ] Audit logs visíveis ✅
- [ ] Mudar roles de usuários ✅

**Status:** ⬜ ✅ PASS | ⬜ ❌ FAIL

---

## 🚨 TESTES CRUZADOS (10 min)

### Vazamento via URL
- [ ] HR abre check-in → Employee cola URL → ❌ Bloqueado
- [ ] HR abre check-in → Manager cola URL → ❌ Bloqueado
- [ ] Manager1 PDI → Manager2 cola URL → ❌ Bloqueado

### Vazamento via API (DevTools → Network)
- [ ] Employee: `/api/checkins` retorna apenas próprios
- [ ] Manager: `/api/pdis` retorna apenas subordinados
- [ ] Employee: `/api/favorites` retorna apenas próprios

### Escalação de Privilégios
- [ ] Employee tenta PATCH role → ❌ Bloqueado

---

## 📊 RESULTADO FINAL

| Role | Testes | Pass | Fail | Status |
|------|--------|------|------|--------|
| Employee | ___ | ___ | ___ | ⬜ |
| Manager | ___ | ___ | ___ | ⬜ |
| HR | ___ | ___ | ___ | ⬜ |
| Admin | ___ | ___ | ___ | ⬜ |
| **TOTAL** | ___ | ___ | ___ | ⬜ |

---

## 🚨 VULNERABILIDADES ENCONTRADAS

### Críticas (BLOQUEAR DEPLOY)
1. ___________________________________
2. ___________________________________

### Altas (CORRIGIR URGENTE)
1. ___________________________________
2. ___________________________________

### Médias (CORRIGIR EM BREVE)
1. ___________________________________

---

## ✅ DECISÃO FINAL

⬜ **APROVADO** - Nenhuma vulnerabilidade crítica  
⬜ **APROVADO COM RESSALVAS** - Vulnerabilidades não-críticas  
⬜ **REPROVADO** - Vulnerabilidades críticas encontradas

---

## 📝 DOCUMENTAÇÃO COMPLETA

**Preencher detalhes em:** `USER_ISOLATION_TEST_RESULTS.md`

**Guia completo em:** `MANUAL_USER_ISOLATION_TEST_GUIDE.md`

**Queries SQL em:** `VALIDATE_USER_ISOLATION_QUERY.sql`

---

## 🔥 PRIORIDADES SE FALHAR

### Se Manager vê check-ins de subordinados:
1. ⚠️ **CRÍTICO** - Violação de privacidade
2. 🚨 Bloquear deploy imediatamente
3. 🔧 Corrigir RLS da tabela `emotional_checkins`
4. ✅ Revalidar completamente

### Se Employee vê dados de outros:
1. ⚠️ **CRÍTICO** - Vazamento de dados
2. 🚨 Revisar todas as políticas RLS
3. 🔧 Corrigir isolamento por `auth.uid()`
4. ✅ Revalidar completamente

### Se APIs retornam dados demais:
1. ⚠️ **ALTA** - Vazamento via backend
2. 🔧 Revisar funções RPC e services
3. 🔧 Adicionar filtros no backend
4. ✅ Revalidar APIs

---

**⏱️ TEMPO TOTAL ESTIMADO: 45-60 minutos**

**🎯 FOCO: Testes de Manager são os MAIS CRÍTICOS!**
