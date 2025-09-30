# 🔴 CORREÇÃO DO LOOP INFINITO DE CARREGAMENTO

## 📊 RELATÓRIO DE DIAGNÓSTICO

### Causa Raiz Principal
**JWT Token Expirado** no arquivo `.env`

- **Token expirou em:** 2025-09-26 10:12:54 (há 4 dias)
- **Problema:** Token tem `iat === exp` (tempo de vida = 0 segundos)
- **Impacto:** Loop infinito de carregamento

### Fluxo do Bug
```
App.tsx:59 (useSupabaseSetup)
  ↓
App.tsx:78 → checkDatabaseHealth()
  ↓
supabase.ts:73 → Detecta JWT expirado
  ↓
App.tsx:133 → Renderiza SetupCheck
  ↓
❌ SetupCheck NUNCA chama onSetupComplete()
  ↓
🔄 LOOP: Usuário preso em "Verificando configuração..."
```

### Problemas Identificados

1. **`.env` - Token Expirado** (🔴 CRÍTICO)
   - Arquivo: `.env`
   - Linha: 2-3
   - Problema: JWT expirado há 4 dias

2. **`App.tsx` - Race Condition** (🟡 MÉDIO)
   - Arquivo: `src/App.tsx`
   - Linhas: 53-95
   - Problema: Sem timeout, sem cleanup no useEffect

3. **`supabase.ts` - Timeout Insuficiente** (🟡 MÉDIO)
   - Arquivo: `src/lib/supabase.ts`
   - Linha: 63
   - Problema: 10s pode não ser suficiente em redes lentas

4. **`AuthContext.tsx` - Queries com Token Inválido** (🟢 BAIXO)
   - Arquivo: `src/contexts/AuthContext.tsx`
   - Linha: 99-108
   - Problema: Pode tentar queries com token expirado

---

## 🔧 PATCHES DE CORREÇÃO

### PATCH 1: Atualizar .env com Token Válido (CRÍTICO)

```diff
--- a/.env
+++ b/.env
@@ -1,3 +1,6 @@
-VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
-VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
+VITE_SUPABASE_URL=your-project-url-here
+VITE_SUPABASE_ANON_KEY=your-anon-key-here
+
+# IMPORTANTE: Acesse https://supabase.com/dashboard/project/0ec90b57d6e95fcbda19832f/settings/api
+# E copie as novas credenciais (Project URL e anon/public key)
```

**Como Aplicar:**
1. Acesse: https://supabase.com/dashboard/project/0ec90b57d6e95fcbda19832f/settings/api
2. Copie **Project URL** e **anon/public key**
3. Cole no arquivo `.env`
4. Reinicie: `npm run dev`

---

### PATCH 2: Adicionar Timeout e Cleanup em App.tsx

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -53,35 +53,49 @@ const AchievementWrapper: React.FC<{ children: React.ReactNode }> = ({ children
 const useSupabaseSetup = () => {
   const [setupComplete, setSetupComplete] = React.useState(false);
   const [checking, setChecking] = React.useState(true);
   const [error, setError] = React.useState<string | null>(null);
   const [isExpiredToken, setIsExpiredToken] = React.useState(false);

   React.useEffect(() => {
+    let mounted = true;
+
     const checkSetup = async () => {
       const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
       const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
       const offlineMode = localStorage.getItem('OFFLINE_MODE') === 'true';

       if (offlineMode) {
-        setSetupComplete(true);
-        setChecking(false);
+        if (mounted) {
+          setSetupComplete(true);
+          setChecking(false);
+        }
         return;
       }

       if (!hasUrl || !hasKey) {
-        setSetupComplete(false);
-        setChecking(false);
-        setError('Missing Supabase credentials');
+        if (mounted) {
+          setSetupComplete(false);
+          setChecking(false);
+          setError('Missing Supabase credentials');
+        }
         return;
       }

       try {
-        const healthCheck = await checkDatabaseHealth(10000);
-        setSetupComplete(healthCheck.healthy);
-        setError(healthCheck.error || null);
-        setIsExpiredToken(healthCheck.isExpiredToken || false);
+        const timeoutPromise = new Promise<never>((_, reject) => {
+          setTimeout(() => reject(new Error('Setup check timeout after 15s')), 15000);
+        });
+
+        const healthCheckPromise = checkDatabaseHealth(10000);
+        const healthCheck = await Promise.race([healthCheckPromise, timeoutPromise]);
+
+        if (mounted) {
+          setSetupComplete(healthCheck.healthy);
+          setError(healthCheck.error || null);
+          setIsExpiredToken(healthCheck.isExpiredToken || false);
+        }
       } catch (error) {
-        setSetupComplete(false);
-        setError(error instanceof Error ? error.message : 'Unknown error occurred');
+        if (mounted) {
+          setSetupComplete(false);
+          setError(error instanceof Error ? error.message : 'Unknown error occurred');
+        }
+      } finally {
+        if (mounted) {
+          setChecking(false);
+        }
       }
-
-      setChecking(false);
     };

     checkSetup();
+
+    return () => {
+      mounted = false;
+    };
   }, []);

   return { setupComplete, checking, error, isExpiredToken, setSetupComplete };
 };
```

**Benefícios:**
- ✅ Adiciona timeout de 15s no health check
- ✅ Previne race conditions com flag `mounted`
- ✅ Cleanup adequado no useEffect
- ✅ Sempre define `checking = false` via `finally`

---

### PATCH 3: Melhorar Detecção de Token Expirado em supabase.ts

```diff
--- a/src/lib/supabase.ts
+++ b/src/lib/supabase.ts
@@ -40,15 +40,21 @@ export const supabase = (supabaseUrl && supabaseAnonKey && !isPlaceholder(supab
 // Check if JWT token is expired
 export const isJWTExpired = (token: string): boolean => {
   try {
     const parts = token.split('.');
     if (parts.length !== 3) return false;

     const payload = JSON.parse(atob(parts[1]));
     if (!payload.exp) return false;

-    // Check if token is expired (with 5 minute buffer)
+    // Check if token is expired
     const now = Math.floor(Date.now() / 1000);
-    return payload.exp < (now + 300);
+
+    // If iat === exp, token has zero lifetime (invalid)
+    if (payload.iat && payload.iat === payload.exp) {
+      return true;
+    }
+
+    // Check if expired (no buffer needed for expired tokens)
+    return payload.exp <= now;
   } catch {
     return false;
   }
@@ -71,8 +77,13 @@ export const checkDatabaseHealth = async (timeoutMs: number = 10000) => {

   // Check if JWT token is expired
   if (supabaseAnonKey && isJWTExpired(supabaseAnonKey)) {
-    console.error('🔴 Supabase ANON_KEY is expired');
+    const parts = supabaseAnonKey.split('.');
+    const payload = JSON.parse(atob(parts[1]));
+    const expDate = new Date(payload.exp * 1000).toISOString();
+
+    console.error('🔴 Supabase ANON_KEY expired at:', expDate);
+    console.error('🔴 Current time:', new Date().toISOString());
+
     return {
       healthy: false,
       error: 'Your Supabase ANON_KEY has expired. Please update your .env file with a new key from your Supabase Dashboard.',
       isExpiredToken: true
     };
```

**Benefícios:**
- ✅ Detecta tokens com `iat === exp` (tempo de vida zero)
- ✅ Melhor logging com datas ISO legíveis
- ✅ Remove buffer de 5 minutos para tokens já expirados

---

### PATCH 4: Prevenir Queries com Token Inválido em AuthContext.tsx

```diff
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -67,6 +67,11 @@ export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ childre
   useEffect(() => {
     let isMounted = true;

     const initializeAuth = async () => {
       if (!supabase) {
+        setLoading(false);
+        return;
+      }
+
+      // Check if token is valid before attempting queries
+      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
+        const { isJWTExpired } = await import('../lib/supabase');
+        if (isJWTExpired(import.meta.env.VITE_SUPABASE_ANON_KEY)) {
+          console.warn('⚠️ AuthContext: Token expired, skipping auth initialization');
+          if (isMounted) {
+            setLoading(false);
+          }
+          return;
+        }
+      }
+
+      if (!supabase) {
         setLoading(false);
         return;
       }
```

**Benefícios:**
- ✅ Valida token antes de queries
- ✅ Previne erros 401/403 em cascata
- ✅ Reduz latência desnecessária

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Após Aplicar os Patches:

- [ ] **App inicia em ≤ 3s** (sem loop infinito)
- [ ] **Nenhum request fica pendente > 5s**
- [ ] **Console não mostra erros de token expirado**
- [ ] **SetupCheck aparece com instruções claras**
- [ ] **Modo offline funciona via botão**

### Build de Produção:
```bash
npm run build
npm run preview
curl -f http://localhost:4173 || echo "FAIL"
```

- [ ] Build completa sem erros
- [ ] Preview inicia corretamente
- [ ] Health check responde

---

## 🎯 INSTRUÇÕES FINAIS

### 1. Obter Novas Credenciais (OBRIGATÓRIO)

```bash
# 1. Acesse o Supabase Dashboard
https://supabase.com/dashboard/project/0ec90b57d6e95fcbda19832f/settings/api

# 2. Copie:
#    - Project URL
#    - anon/public key

# 3. Cole no arquivo .env:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 2. Aplicar Patches (RECOMENDADO)

Os patches 2, 3 e 4 adicionam:
- Timeout de 15s
- Detecção melhorada de token inválido
- Prevenção de race conditions

### 3. Reiniciar Servidor

```bash
# Mate o processo atual
Ctrl+C

# Reinstale (se necessário)
npm ci

# Reinicie
npm run dev
```

### 4. Validar Correção

```bash
# Deve abrir sem loop infinito
# Se token inválido: mostra SetupCheck com instruções
# Se token válido: vai direto para Login
```

---

## 🚨 ALTERNATIVA: Modo Offline

Se não conseguir obter credenciais imediatamente:

1. Abra a aplicação
2. Na tela de SetupCheck, clique em **"Continuar em Modo Offline"**
3. Isso seta `localStorage.OFFLINE_MODE = 'true'`
4. App usará dados mockados

**Para sair do modo offline:**
```javascript
localStorage.removeItem('OFFLINE_MODE');
location.reload();
```

---

## 📈 IMPACTO DAS CORREÇÕES

| Problema | Antes | Depois |
|----------|-------|--------|
| Loop infinito | ✗ | ✓ |
| Timeout | Nunca resolve | 15s máximo |
| Race conditions | Sim | Não |
| Token detection | Buffer incorreto | Preciso |
| Queries inválidas | Sim | Prevenidas |

**Estimativa de tempo total:** 5-10 minutos

---

## 📞 SUPORTE

Se os problemas persistirem após aplicar todos os patches:

1. Verifique console do navegador (F12)
2. Verifique console do servidor (terminal)
3. Verifique aba Network (requests pendentes)
4. Compartilhe os logs

---

**Documentação criada em:** 2025-09-30
**Versão:** 1.0
**Status:** ✅ Pronto para aplicar
