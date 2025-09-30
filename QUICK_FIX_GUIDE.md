# Guia Rápido: Correção do Loop de Login

## O Problema

Seu sistema está em **loop de erro de login** porque o arquivo `.env` contém **credenciais Supabase INVÁLIDAS**:

- ❌ Token gerado pelo "Bolt" (não é um token Supabase real)
- ❌ Token expirado (tempo de vida = ZERO)
- ❌ URL pode estar incorreta

## A Solução (5 passos simples)

### 1️⃣ Acesse o Supabase Dashboard

Abra: **https://supabase.com/dashboard**

### 2️⃣ Selecione ou Crie um Projeto

- Se já tem projeto: clique nele
- Se não tem: clique em "New Project" e crie um

### 3️⃣ Vá para Settings → API

No menu lateral: **Settings** → **API**

### 4️⃣ Copie as Credenciais Corretas

Você vai encontrar:

**Project URL** (exemplo):
```
https://abcdefghijklmnopqrst.supabase.co
```

**anon/public key** (exemplo - começa com eyJ...):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQ5NTU2MDAsImV4cCI6MjAxMDUzMTYwMH0...
```

⚠️ **IMPORTANTE**: Copie a chave **anon** ou **public**, NÃO a **service_role**!

### 5️⃣ Atualize o Arquivo .env

Abra o arquivo `.env` na raiz do projeto e substitua:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQ5NTU2MDAsImV4cCI6MjAxMDUzMTYwMH0...
```

(Substitua pelos valores que você copiou)

### 6️⃣ Reinicie o Servidor

```bash
npm run dev
```

## ✅ Verificar se Funcionou

Após reiniciar, você deve ver:

1. ✅ Mensagem "Supabase Configurado!"
2. ✅ Botão "Continuar para Login"
3. ✅ Tela de login sem erros
4. ✅ Login funciona normalmente

## 🆘 Ainda Não Funciona?

### Limpar Cache

Se ainda houver problemas:

**Opção 1**: Clique no botão "Limpar Cache e Recarregar" na tela de setup

**Opção 2**: Manualmente no navegador
1. Abra DevTools (F12)
2. Vá em **Application** (ou **Aplicativo**)
3. Clique em **Clear site data** (ou **Limpar dados do site**)
4. Recarregue a página

### Verificar Credenciais

Certifique-se que:
- ✅ URL tem formato: `https://[20-caracteres].supabase.co`
- ✅ Token tem mais de 100 caracteres
- ✅ Você copiou a chave **anon**, não a **service_role**
- ✅ Projeto Supabase está ativo (não pausado)
- ✅ Arquivo `.env` está na raiz do projeto

### Token Ainda Inválido?

No Supabase Dashboard, vá em:
1. **Settings** → **API**
2. Role até **Project API keys**
3. Se necessário, clique em **Reset** para gerar novas chaves
4. Copie as novas credenciais

## 📖 Mais Informações

- Documentação completa: `LOGIN_LOOP_FIX_SUMMARY.md`
- Instruções no arquivo: `.env` (tem comentários detalhados)
- Documentação Supabase: https://supabase.com/docs

## ❓ FAQ

### Q: Por que o token Bolt não funciona?
**A:** Tokens Bolt são para desenvolvimento local e não são aceitos pela API Supabase real. Você precisa de credenciais do seu projeto Supabase.

### Q: Preciso criar um projeto novo?
**A:** Se você já tem um projeto Supabase, pode usar as credenciais dele. Se não tem, crie um novo (é grátis para começar).

### Q: Qual a diferença entre anon key e service_role key?
**A:**
- **anon key**: Segura, pode ser exposta no frontend (use esta)
- **service_role**: Tem acesso total, NUNCA exponha no frontend

### Q: Meu projeto foi pausado, o que fazer?
**A:** No Supabase Dashboard, vá no projeto e clique em "Resume" ou "Restore" para reativá-lo.

### Q: O .env não está sendo lido
**A:**
1. Certifique-se que o arquivo se chama exatamente `.env` (com o ponto)
2. Arquivo deve estar na **raiz do projeto** (mesmo nível que `package.json`)
3. Reinicie o servidor após qualquer alteração no `.env`

## 🎯 Checklist Final

Antes de pedir ajuda, verifique:

- [ ] Copiei as credenciais do Supabase Dashboard
- [ ] Usei a chave **anon** (não service_role)
- [ ] Arquivo `.env` está na raiz do projeto
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Limpei o cache do navegador
- [ ] Projeto Supabase está ativo (não pausado)
- [ ] URL tem formato correto (20 caracteres antes de .supabase.co)

---

**🚀 Após seguir estes passos, seu sistema deve funcionar normalmente!**

Se persistir, verifique o console do navegador (F12 → Console) e compartilhe os erros que aparecem.
