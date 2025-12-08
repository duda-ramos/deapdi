# TalentFlow - Guia de Deployment

## Índice
1. [Visão Geral](#visão-geral)
2. [Ambientes](#ambientes)
3. [Pré-requisitos](#pré-requisitos)
4. [Deploy em Staging](#deploy-em-staging)
5. [Deploy em Produção](#deploy-em-produção)
6. [Rollback Procedures](#rollback-procedures)
7. [Health Checks](#health-checks)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O TalentFlow utiliza uma arquitetura de deploy baseada em:
- **Frontend**: React SPA hospedada em Vercel/Netlify
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Monitoramento**: Sentry (erros) + Google Analytics (uso)

### Fluxo de Deploy

```
Local Dev → Staging (validação) → Production
```

---

## Ambientes

| Ambiente | URL | Supabase Project | Sentry Environment |
|----------|-----|------------------|-------------------|
| Development | http://localhost:5173 | Local/Dev | development |
| Staging | https://talentflow-staging.vercel.app | talentflow-staging | staging |
| Production | https://talentflow.app | talentflow-prod | production |

---

## Pré-requisitos

### Ferramentas Necessárias
- Node.js >= 18.x
- npm >= 9.x
- Git
- Vercel CLI (`npm i -g vercel`) ou Netlify CLI
- Supabase CLI (opcional, para migrations)

### Acessos Necessários
- [ ] Repositório Git
- [ ] Projeto Supabase (staging e production)
- [ ] Conta Vercel/Netlify
- [ ] Projeto Sentry
- [ ] Google Analytics

---

## Deploy em Staging

### 1. Preparar o Build

```bash
# Verificar se está na branch correta
git checkout develop

# Atualizar dependências
npm ci

# Rodar testes
npm run test

# Build para staging
npm run build -- --mode staging

# Preview local
npm run preview -- --mode staging
```

### 2. Configurar Variáveis de Ambiente

No Vercel/Netlify, configure as variáveis do arquivo `.env.staging`:

```
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key
VITE_APP_ENV=staging
VITE_SENTRY_DSN=https://...@sentry.io/staging
VITE_GA_MEASUREMENT_ID=G-STAGING0000
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=true
```

### 3. Deploy

```bash
# Vercel
vercel --env-file .env.staging

# Netlify
netlify deploy --build --context staging
```

### 4. Validação Pós-Deploy

Execute o checklist de smoke tests:
- [ ] Aplicação carrega sem erros
- [ ] Login funciona (todos os perfis)
- [ ] Dashboard principal renderiza
- [ ] Criar PDI de teste
- [ ] Verificar notificações
- [ ] Console sem erros críticos

---

## Deploy em Produção

### 1. Checklist Pré-Deploy

- [ ] Todos os testes passando
- [ ] Staging validado e aprovado
- [ ] Migrations do Supabase aplicadas
- [ ] Backup do banco de produção realizado
- [ ] Janela de manutenção comunicada (se aplicável)

### 2. Preparar o Build

```bash
# Garantir branch main atualizada
git checkout main
git pull origin main

# Build de produção
npm run build:prod

# Verificar bundle size
npm run size:check
```

### 3. Aplicar Migrations (se houver)

```bash
# Conectar ao Supabase production
supabase link --project-ref <production-project-ref>

# Aplicar migrations
supabase db push
```

### 4. Deploy

```bash
# Vercel (production)
vercel --prod

# Netlify (production)
netlify deploy --prod
```

### 5. Validação Pós-Deploy

- [ ] Health check passando
- [ ] Login com usuário real
- [ ] Funcionalidades críticas testadas
- [ ] Sentry recebendo eventos
- [ ] Google Analytics ativo

---

## Rollback Procedures

### Critérios para Rollback

Execute rollback imediatamente se:
1. Taxa de erro > 10% no Sentry
2. Funcionalidade crítica quebrada (login, PDI, dashboard)
3. Problemas de performance graves (LCP > 4s)
4. Dados corrompidos ou inacessíveis

### Rollback do Frontend (Vercel)

```bash
# Listar deployments anteriores
vercel ls

# Reverter para deploy anterior
vercel rollback [deployment-url]

# Ou via Dashboard:
# 1. Acesse vercel.com/dashboard
# 2. Selecione o projeto
# 3. Vá em "Deployments"
# 4. Encontre o deploy estável anterior
# 5. Clique em "..." → "Promote to Production"
```

### Rollback do Frontend (Netlify)

```bash
# Via CLI
netlify rollback

# Ou via Dashboard:
# 1. Acesse app.netlify.com
# 2. Selecione o site
# 3. Vá em "Deploys"
# 4. Encontre o deploy estável
# 5. Clique em "Publish deploy"
```

### Rollback de Migrations (Supabase)

⚠️ **CUIDADO**: Rollback de migrations pode causar perda de dados!

```sql
-- 1. Identificar a migration problemática
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 5;

-- 2. Se a migration tiver script de rollback:
-- Execute o script de rollback manualmente

-- 3. Se não houver script de rollback:
-- Restaure backup do banco de dados
```

### Rollback de Banco de Dados (Backup Completo)

```bash
# 1. Acesse Supabase Dashboard
# 2. Settings → Database → Backups
# 3. Selecione o backup antes do problema
# 4. Clique em "Restore"

# ⚠️ ATENÇÃO: Isso substituirá todos os dados atuais!
```

### Rollback via Git

```bash
# Identificar commit problemático
git log --oneline -10

# Reverter commit específico
git revert <commit-hash>

# Ou reverter para commit estável
git reset --hard <commit-hash>

# Deploy da versão revertida
npm run build:prod
vercel --prod
```

### Checklist Pós-Rollback

- [ ] Confirmar que versão anterior está no ar
- [ ] Verificar que erro foi resolvido
- [ ] Comunicar stakeholders sobre rollback
- [ ] Criar issue para investigar causa raiz
- [ ] Documentar lições aprendidas

---

## Health Checks

### Endpoint de Health Check

```bash
# Via Supabase RPC
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/health_check' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "connected": true,
      "latency_ms": 5
    }
  }
}
```

### Configurar UptimeRobot

1. Acesse [uptimerobot.com](https://uptimerobot.com)
2. Crie novo monitor HTTP(s)
3. Configure:
   - URL: `https://your-project.supabase.co/rest/v1/rpc/health_check`
   - Interval: 5 minutos
   - Keyword: `"status":"healthy"`
   - Headers: `apikey: YOUR_ANON_KEY`
4. Configure alertas por email/Slack

### Script Local de Health Check

```bash
npm run health:check
```

---

## Monitoramento

### Sentry Dashboard

- URL: https://sentry.io/organizations/your-org/projects/talentflow/
- Verificar:
  - Issues não resolvidas
  - Trend de erros
  - Performance issues

### Google Analytics

- URL: https://analytics.google.com
- Verificar:
  - Usuários ativos
  - Eventos trackados
  - Conversões (PDIs criados, etc.)

### Supabase Dashboard

- URL: https://supabase.com/dashboard/project/your-project
- Verificar:
  - Database health
  - API requests
  - Storage usage

---

## Troubleshooting

### Deploy falha no Vercel

```bash
# Verificar logs
vercel logs

# Build local para debug
npm run build:prod 2>&1 | tee build.log
```

### Migrations não aplicam

```bash
# Verificar status
supabase db status

# Resetar migrations (⚠️ apenas desenvolvimento!)
supabase db reset
```

### Sentry não recebe eventos

1. Verificar se VITE_SENTRY_DSN está configurado
2. Testar manualmente: `window.testSentryError()` no console
3. Verificar CSP headers

---

## Contatos de Suporte

| Papel | Nome | Contato |
|-------|------|---------|
| Tech Lead | - | tech-lead@empresa.com |
| DevOps | - | devops@empresa.com |
| DBA | - | dba@empresa.com |

### Canais de Comunicação

- Slack: #talentflow-deploy
- PagerDuty: talentflow-critical
- Email: suporte@talentflow.app

---

*Última atualização: Dezembro 2024*
