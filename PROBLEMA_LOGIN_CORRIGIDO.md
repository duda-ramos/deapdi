# 🔴 PROBLEMA IDENTIFICADO: JWT Token Expirado

## O Problema

Seu token JWT no arquivo `.env` está **EXPIRADO**. Por isso não consegue fazer login.

```
Token atual: exp = 1758881574 (30/09/2025 22:42)
Problema: O token expirou no mesmo instante que foi criado (iat == exp)
```

## ✅ SOLUÇÃO IMEDIATA (3 Passos)

### Passo 1: Acesse o Supabase Dashboard
```
https://supabase.com/dashboard
```

### Passo 2: Obtenha Novas Credenciais
1. Entre no seu projeto Supabase
2. Vá em **Settings** (barra lateral esquerda)
3. Clique em **API**
4. Copie:
   - **Project URL** (exemplo: https://xxxxx.supabase.co)
   - **anon/public key** (o token grande que começa com eyJ...)

### Passo 3: Atualize o Arquivo .env

Abra o arquivo `.env` na raiz do projeto e substitua:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO-AQUI.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-NOVA-KEY-AQUI
```

### Passo 4: Reinicie o Servidor

```bash
# Pare o servidor atual (Ctrl+C)
# Depois reinicie:
npm run dev
```

## 👤 Usuários Existentes no Banco

Existem 3 usuários cadastrados que você pode usar após corrigir o token:

1. **Alexia** (HR)
   - Email: alexia@deadesign.com.br
   - Role: hr

2. **Maria Eduarda** (Colaboradora)
   - Email: mariaeduarda@deadesign.com.br
   - Role: employee

3. **Ana Paula** (Admin)
   - Email: anapaula@deadesign.com.br
   - Role: admin

**IMPORTANTE**: Você precisará resetar as senhas desses usuários ou criar novos, já que as senhas não estão visíveis no banco.

## 🆕 Como Criar Novo Usuário

Após atualizar o token, você pode:

1. Usar a tela de **"Criar Conta"** no sistema
2. OU criar direto no Supabase Dashboard:
   - Vá em **Authentication** → **Users**
   - Clique em **Add User**
   - Preencha email e senha

## 🔍 Como Verificar se o Token Está OK

Execute no terminal:

```bash
# Decodificar o token para ver a data de expiração
node -e "console.log(JSON.parse(Buffer.from('${VITE_SUPABASE_ANON_KEY}'.split('.')[1], 'base64').toString()))"
```

Um token válido deve ter:
- `exp` (expiration) no futuro
- Diferente de `iat` (issued at)
- Exemplo: exp = 1893456000 (ano 2030)

## 🚀 Após Corrigir

1. ✅ O sistema vai iniciar normalmente
2. ✅ A tela de login vai funcionar
3. ✅ Você poderá criar novos usuários
4. ✅ Não haverá mais loop de erro

## 🆘 Se Ainda Não Funcionar

Se após atualizar o token ainda não funcionar:

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra o Console do navegador (F12)
3. Veja se há erros em vermelho
4. Verifique se a URL do Supabase está correta
5. Confirme que copiou a **anon key** (não a service_role key)

## 📝 Modo Offline (Alternativa Temporária)

Se não puder atualizar o token agora, use o modo offline:

1. Adicione no `.env`:
   ```
   VITE_SKIP_HEALTH_CHECK=true
   ```

2. OU clique em "Continuar em Modo Offline" na tela de setup

**Observação**: No modo offline você não terá acesso ao banco de dados real.

---

**Status**: 🔴 Token expirado - requer ação imediata
**Ação necessária**: Atualizar credenciais do Supabase no arquivo .env
**Tempo estimado**: 2-3 minutos
