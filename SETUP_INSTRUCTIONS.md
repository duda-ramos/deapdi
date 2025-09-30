# Setup Instructions - TalentFlow

## O Problema Atual

O botão de login fica em estado de "Carregando..." indefinidamente porque as credenciais do Supabase no arquivo `.env` estão **expiradas ou são placeholders**.

### Sintomas:
- Botão de login mostra "Carregando..." e nunca termina
- Erro no console: "Supabase request failed" com status 400 ou 401
- A aplicação fica presa na tela de verificação de configuração

## Soluções Disponíveis

### Opção 1: Configurar Credenciais do Supabase (Recomendado)

**Passo a passo:**

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu projeto**
   - Clique no projeto que você quer usar
   - Ou crie um novo projeto se ainda não tiver

3. **Obtenha as credenciais**
   - No menu lateral, vá em: `Settings` → `API`
   - Você verá duas informações importantes:
     - **Project URL**: algo como `https://xxxxx.supabase.co`
     - **anon/public key**: uma string JWT longa começando com `eyJ...`

4. **Atualize o arquivo .env**
   - Abra o arquivo `.env` na raiz do projeto
   - Substitua os valores de exemplo pelas suas credenciais reais:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Reinicie o servidor**
   - Pare o servidor de desenvolvimento (Ctrl+C)
   - Execute novamente: `npm run dev`
   - A aplicação agora deve conectar com sucesso

### Opção 2: Usar Modo Offline (Para Desenvolvimento)

Se você quer apenas testar a interface sem configurar o Supabase:

1. **Ative o modo offline**
   - Abra o arquivo `.env`
   - Descomente ou adicione a linha:
   ```env
   VITE_OFFLINE_MODE=true
   ```

2. **Reinicie o servidor**
   - Pare e inicie novamente: `npm run dev`
   - A aplicação funcionará com dados mockados (sem persistência)

**Nota:** No modo offline:
- Login/Cadastro não funcionarão de verdade
- Dados não serão salvos
- Algumas funcionalidades estarão limitadas
- É útil apenas para desenvolvimento da UI

### Opção 3: Usar o Botão "Continuar em Modo Offline" na Tela de Setup

Se a aplicação mostrar a tela de configuração do Supabase:

1. Role até o final da página
2. Clique no botão "Continuar em Modo Offline"
3. Isso permitirá usar a aplicação com dados mockados

## Por Que Isso Aconteceu?

O token JWT no arquivo `.env` original tinha uma data de expiração que já passou:
- Token expirou em: `1758881574` (Unix timestamp)
- Data atual: `1759245382`
- O token expirou há aproximadamente 4 dias

Tokens JWT do Supabase geralmente têm validade limitada e precisam ser renovados periodicamente, ou você precisa usar as credenciais corretas do seu projeto.

## Verificando se Funcionou

Após aplicar uma das soluções acima, você deve:

1. ✅ Ver a tela de login sem erros
2. ✅ Conseguir clicar em "Entrar" sem que fique carregando indefinidamente
3. ✅ Se usar credenciais válidas, conseguir criar conta e fazer login
4. ✅ Não ver erros relacionados ao Supabase no console do navegador

## Problemas Comuns

### "JWT expired" ou "Invalid JWT"
**Solução:** O token está expirado. Obtenha um novo no Supabase Dashboard.

### "Failed to fetch" ou "Network error"
**Solução:**
- Verifique sua conexão com a internet
- Confirme que a URL do Supabase está correta
- Verifique se o projeto Supabase está ativo

### "CORS error"
**Solução:** Configure as origens permitidas no Supabase Dashboard:
- Settings → API → API Settings
- Adicione `http://localhost:5173` nas origens permitidas

## Suporte Adicional

Se você ainda está tendo problemas:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do terminal onde está rodando `npm run dev`
3. Confirme que todas as dependências estão instaladas: `npm install`
4. Tente limpar o cache: `rm -rf node_modules/.vite`

## Credenciais de Teste (Apenas para Referência)

⚠️ **Não use credenciais expiradas ou de exemplo em produção!**

As credenciais devem sempre vir do seu próprio projeto Supabase, obtidas através do Dashboard oficial.