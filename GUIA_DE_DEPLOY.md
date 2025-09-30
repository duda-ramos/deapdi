# 🚀 Guia de Deploy - TalentFlow

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Supabase](#configuração-do-supabase)
3. [Configuração do Projeto](#configuração-do-projeto)
4. [Deploy para Produção](#deploy-para-produção)
5. [Verificação Pós-Deploy](#verificação-pós-deploy)
6. [Monitoramento](#monitoramento)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### Ferramentas Necessárias
- Node.js 18+ LTS
- npm 9+ ou yarn
- Git
- Conta no Supabase
- Conta em plataforma de hosting (Vercel/Netlify recomendados)

### Conhecimentos
- Básico de linha de comando
- Git básico
- Conceitos de variáveis de ambiente

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Nome**: talentflow-production (ou similar)
   - **Senha do Banco**: Senha forte (guarde com segurança!)
   - **Região**: Escolha mais próxima dos usuários
   - **Plano**: Pro recomendado para produção

### 2. Executar Migrações

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute TODAS as migrações na ordem:

```bash
# Ordem de execução (em sequência):
supabase/migrations/20250917184927_pale_tower.sql
supabase/migrations/20250917200248_little_cloud.sql
supabase/migrations/20250917200402_humble_beacon.sql
# ... continue com todas as migrações em ordem cronológica
```

**IMPORTANTE**: Execute uma por vez e verifique se não há erros.

### 3. Popular Dados Base

Execute o script de seed:

```sql
-- Execute o arquivo completo:
scripts/seed_database.sql
```

Isso criará:
- Competências padrão
- Trilhas de carreira
- Conquistas
- Cursos de exemplo
- Recursos de bem-estar

### 4. Obter Credenciais

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon/public key**: Token JWT longo

**⚠️ IMPORTANTE**: O `service_role` key deve ser mantido SECRETO!

### 5. Configurar Políticas de RLS

Verifique que todas as tabelas têm RLS habilitado:

```sql
-- Verificar RLS ativo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Todos devem ter `rowsecurity = true`.

### 6. Configurar Autenticação

1. Em **Authentication** → **Providers**
2. Configure:
   - ✅ Email habilitado
   - ❌ Confirmação de email: Desabilitada (ou configure SMTP)
   - ✅ Sign ups habilitados

Se quiser confirmação por email:
1. Vá em **Settings** → **Auth**
2. Configure SMTP:
   - Host: smtp.gmail.com (exemplo)
   - Port: 587
   - User: seu-email@gmail.com
   - Password: senha-app

### 7. Configurar Storage (Opcional)

Para upload de avatares:

1. Vá em **Storage**
2. Crie bucket **"avatars"**
3. Configure políticas públicas:

```sql
-- Política de leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política de upload autenticado
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

---

## Configuração do Projeto

### 1. Clone do Repositório

```bash
git clone https://github.com/seu-usuario/talentflow.git
cd talentflow
```

### 2. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente

Crie arquivo `.env.production`:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key-aqui

# Ambiente
NODE_ENV=production

# Opcional: Monitoramento
VITE_SENTRY_DSN=https://sua-dsn@sentry.io/projeto
VITE_ANALYTICS_ID=G-XXXXXXXXXX

# Opcional: Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

**⚠️ NUNCA commite o arquivo .env no Git!**

### 4. Build de Produção

```bash
# Build com verificações
npm run deploy:check

# Isso executa:
# - Audit de segurança
# - Lint
# - Type check
# - Testes
# - Build de produção
```

Verifique que não há erros.

### 5. Testar Build Localmente

```bash
npm run preview:prod
```

Acesse `http://localhost:4173` e teste:
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Dados aparecem corretamente
- [ ] Não há erros no console

---

## Deploy para Produção

### Opção A: Vercel (Recomendado)

#### Via Interface Web

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Importe seu repositório Git
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Adicione variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Outras variáveis necessárias
6. Clique em **"Deploy"**

#### Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opção B: Netlify

#### Via Interface Web

1. Acesse [netlify.com](https://netlify.com)
2. **"Add new site"** → **"Import an existing project"**
3. Conecte seu repositório
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Variáveis de ambiente:
   - Vá em **Site settings** → **Environment variables**
   - Adicione as mesmas do `.env.production`
6. **"Deploy site"**

#### Via CLI

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Opção C: Servidor Próprio (VPS)

```bash
# No servidor (Ubuntu/Debian)

# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PM2
sudo npm install -g pm2

# 3. Clonar projeto
git clone https://github.com/seu-usuario/talentflow.git
cd talentflow

# 4. Instalar dependências
npm install

# 5. Configurar .env.production
nano .env.production
# Cole as variáveis

# 6. Build
npm run build

# 7. Instalar servidor HTTP
npm install -g serve

# 8. Iniciar com PM2
pm2 start "serve -s dist -l 3000" --name talentflow

# 9. Configurar Nginx (proxy reverso)
sudo nano /etc/nginx/sites-available/talentflow

# Cole:
server {
    listen 80;
    server_name talentflow.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/talentflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 10. SSL com Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d talentflow.seudominio.com
```

---

## Verificação Pós-Deploy

### Checklist de Produção

#### 1. Funcional
- [ ] Site está acessível
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Todas as páginas carregam
- [ ] Dados são salvos corretamente
- [ ] Imagens carregam

#### 2. Performance
```bash
# Lighthouse (Chrome DevTools)
# Targets:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

#### 3. Segurança
- [ ] HTTPS ativo
- [ ] Headers de segurança configurados
- [ ] RLS funcionando (teste com diferentes usuários)
- [ ] Não há credenciais expostas
- [ ] CORS configurado corretamente

#### 4. Banco de Dados
```sql
-- Verificar dados foram criados
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM competencies) as competencies,
  (SELECT COUNT(*) FROM career_tracks) as tracks,
  (SELECT COUNT(*) FROM achievements) as achievements,
  (SELECT COUNT(*) FROM courses) as courses;
```

#### 5. Monitoramento
- [ ] Sentry configurado (se usando)
- [ ] Analytics configurado (se usando)
- [ ] Logs acessíveis
- [ ] Alertas configurados

---

## Monitoramento

### Métricas a Acompanhar

#### Aplicação
- **Uptime**: > 99.9%
- **Response Time**: < 2s
- **Error Rate**: < 1%
- **Build Success Rate**: 100%

#### Banco de Dados (Supabase)
- **Database CPU**: < 70%
- **Database Memory**: < 80%
- **Connection Pool**: < 80%
- **Query Performance**: < 100ms média

### Ferramentas Recomendadas

1. **Uptime Monitoring**
   - [UptimeRobot](https://uptimerobot.com) (grátis)
   - [Pingdom](https://pingdom.com)

2. **Error Tracking**
   - [Sentry](https://sentry.io) (recomendado)
   - [Rollbar](https://rollbar.com)

3. **Analytics**
   - Google Analytics
   - [Plausible](https://plausible.io) (privacy-friendly)

### Configurar Alertas

```javascript
// Exemplo: Sentry
Sentry.init({
  dsn: "https://sua-dsn@sentry.io/projeto",
  environment: "production",
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filtrar dados sensíveis
    if (event.user) {
      delete event.user.email;
    }
    return event;
  }
});
```

---

## Rollback

### Plano de Rollback

#### Vercel/Netlify
1. Acesse o dashboard
2. Vá em **Deployments**
3. Encontre deploy anterior funcional
4. Clique em **"..."** → **"Promote to Production"**

#### Via Git
```bash
# 1. Reverter para commit anterior
git revert HEAD
git push origin main

# ou

# 2. Reset para versão específica
git reset --hard abc123
git push --force origin main
```

#### Banco de Dados
```sql
-- Se precisa reverter migração
-- CUIDADO: Pode perder dados!

-- 1. Backup primeiro
pg_dump > backup-before-rollback.sql

-- 2. Criar migração de rollback
-- Reverta manualmente as mudanças
```

### Quando Fazer Rollback

- ❌ Erro crítico impedindo login
- ❌ Perda de dados detectada
- ❌ Falha de segurança (RLS quebrado)
- ❌ Performance inaceitável (> 10s load)
- ❌ Taxa de erro > 10%

### Comunicação

```text
Template de Comunicado:

Assunto: [URGENTE] Rollback realizado - TalentFlow

Prezados,

Identificamos um problema crítico no deploy realizado às [HORA].
Um rollback foi executado e o sistema está operando na versão anterior.

Problema: [DESCRIÇÃO]
Impacto: [USUÁRIOS AFETADOS / FUNCIONALIDADES]
Resolução: Em andamento, previsão [TEMPO]

Ações:
1. [AÇÃO 1]
2. [AÇÃO 2]

Atualizaremos assim que houver novidades.

Equipe TalentFlow
```

---

## Troubleshooting

### Problema: Build Falha

```bash
# Limpar cache
rm -rf node_modules
rm package-lock.json
npm install

# Build com verbose
npm run build -- --debug
```

### Problema: Variáveis de Ambiente Não Carregam

```bash
# Verificar se estão definidas
echo $VITE_SUPABASE_URL

# Reconstruir
npm run build

# Verificar no build
cat dist/assets/index-*.js | grep -o "supabase" | head -1
```

### Problema: Erros de CORS

```javascript
// Supabase deve ter CORS configurado
// Verifique URL no .env está EXATAMENTE igual ao dashboard
```

### Problema: RLS Bloqueando Acesso

```sql
-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Testar acesso como usuário
SET ROLE authenticated;
SELECT * FROM profiles LIMIT 1;
RESET ROLE;
```

### Problema: Performance Lenta

```sql
-- Verificar queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Adicionar índices se necessário
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

### Problema: Memória Alta

```bash
# Vercel/Netlify: Upgrade de plano pode ser necessário

# VPS: Verificar uso
free -h
top

# Reiniciar PM2
pm2 restart talentflow
```

---

## Manutenção Contínua

### Diariamente
- [ ] Verificar uptime
- [ ] Checar logs de erro
- [ ] Monitorar performance

### Semanalmente
- [ ] Revisar métricas de uso
- [ ] Analisar feedback de usuários
- [ ] Verificar segurança (npm audit)

### Mensalmente
- [ ] Atualizar dependências
- [ ] Revisar e otimizar queries
- [ ] Backup do banco de dados
- [ ] Revisar custos de infraestrutura

### Trimestralmente
- [ ] Auditoria completa de segurança
- [ ] Revisar e atualizar documentação
- [ ] Planejar melhorias de performance
- [ ] Teste de disaster recovery

---

## Contatos de Emergência

```
Desenvolvedor Principal: [email/telefone]
DevOps/Infraestrutura: [email/telefone]
Suporte Supabase: support@supabase.com
Suporte Vercel: support@vercel.com
```

---

## Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Vite](https://vitejs.dev)
- [Documentação React](https://react.dev)
- [Supabase Status](https://status.supabase.com)

---

**Última atualização:** Setembro 2025
**Versão do Guia:** 1.0.0

---

*Mantenha este documento atualizado a cada mudança significativa no processo de deploy.*