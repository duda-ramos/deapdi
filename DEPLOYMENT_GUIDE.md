# Guia de Deploy e Configuração - TalentFlow v1.0

**Data:** 30 de Setembro de 2025
**Versão:** 1.0.0

---

## 📋 PRÉ-REQUISITOS

### Contas Necessárias
- [ ] Conta Supabase (Pro recomendado para produção)
- [ ] Conta Sentry (para monitoramento de erros)
- [ ] Conta Google Analytics (para analytics)
- [ ] Domínio configurado (opcional, mas recomendado)
- [ ] Certificado SSL (automático com Vercel/Netlify)

### Ferramentas Locais
- [ ] Node.js 18+ instalado
- [ ] npm ou yarn instalado
- [ ] Git configurado
- [ ] Acesso ao repositório do projeto

---

## 🔧 FASE 1: CONFIGURAÇÃO DO SUPABASE

### 1.1 Criar Projeto de Produção

1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Preencha:
   - **Name:** TalentFlow Production
   - **Database Password:** (gere uma senha forte)
   - **Region:** Escolha a mais próxima dos usuários
   - **Pricing Plan:** Pro (recomendado)
4. Aguarde a criação (2-3 minutos)

### 1.2 Configurar Backup e Recovery

1. No projeto, vá em **Settings → Database**
2. Em **Backups**:
   - Enable **Daily Backups**
   - Set **Retention Period:** 30 days
3. Em **Point in Time Recovery**:
   - Enable **PITR** (apenas Pro plan)
   - Configura retenção: 7 dias

### 1.3 Aplicar Migrações

**IMPORTANTE:** Aplique as migrações na ordem correta!

```bash
# 1. Clone o repositório (se ainda não fez)
git clone <seu-repositorio>
cd talentflow

# 2. Instale Supabase CLI
npm install -g supabase

# 3. Login no Supabase
supabase login

# 4. Link ao projeto
supabase link --project-ref <seu-project-ref>

# 5. Aplique todas as migrações
supabase db push

# 6. Verifique se aplicou corretamente
supabase db remote commit list
```

**Migrações Críticas:**
- ✅ Todas as migrações em `supabase/migrations/`
- ✅ Especialmente: `20250930140232_complete_rls_consolidation.sql`
- ✅ E: `20250930150000_create_rpc_functions.sql`

### 1.4 Validar RLS

Execute o script de validação no SQL Editor do Supabase:

```bash
# Copie o conteúdo de RLS_VALIDATION_SCRIPT.sql
# Cole no SQL Editor do Supabase
# Execute e verifique se todos os testes passam
```

Resultados esperados:
- ✅ 42/42 tabelas com RLS habilitado
- ✅ 0 políticas com recursão
- ✅ JWT sync function ativa
- ✅ Trigger de sincronização ativo

### 1.5 Obter Credenciais

1. Vá em **Settings → API**
2. Copie:
   - **Project URL** (VITE_SUPABASE_URL)
   - **Project API Key (anon, public)** (VITE_SUPABASE_ANON_KEY)

---

## 🔐 FASE 2: CONFIGURAÇÃO DE MONITORAMENTO

### 2.1 Configurar Sentry

1. Acesse https://sentry.io
2. Crie um novo projeto:
   - **Platform:** React
   - **Project Name:** talentflow-production
3. Copie o **DSN** fornecido
4. Em **Settings → Alerts**:
   - Configure alertas para erros críticos
   - Configure notificações por email/Slack

### 2.2 Configurar Google Analytics

1. Acesse https://analytics.google.com
2. Crie uma propriedade:
   - **Property Name:** TalentFlow
   - **Industry:** Human Resources
   - **Time Zone:** Seu fuso horário
3. Crie um Web Data Stream
4. Copie o **Measurement ID** (formato: G-XXXXXXXXXX)

---

## 🌍 FASE 3: CONFIGURAÇÃO DE AMBIENTE

### 3.1 Configurar Variáveis de Ambiente

Edite o arquivo `.env.production`:

```env
# Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Environment
NODE_ENV=production

# Monitoramento (OBRIGATÓRIO)
VITE_SENTRY_DSN=https://seu-dsn@sentry.io/projeto
VITE_ANALYTICS_ID=G-XXXXXXXXXX

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# API Configuration
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=5242880

# Security
VITE_RATE_LIMIT_REQUESTS=100
VITE_RATE_LIMIT_WINDOW=60000

# Application
VITE_APP_NAME=TalentFlow
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Custom Domain (opcional)
VITE_APP_DOMAIN=https://talentflow.suaempresa.com
```

### 3.2 Validar Configuração

```bash
# Verifique se todas as variáveis estão definidas
cat .env.production | grep "VITE_"

# Não deve haver valores de exemplo (your-project, G-XXXXXXXXXX, etc)
```

---

## 🏗️ FASE 4: BUILD E TESTES

### 4.1 Instalar Dependências

```bash
# Limpe node_modules e cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Instale dependências
npm install

# Verifique vulnerabilidades
npm audit
npm audit fix
```

### 4.2 Executar Linting e Type Check

```bash
# Lint
npm run lint

# Se houver erros, corrija:
npm run lint:fix

# Type check
npm run type-check
```

### 4.3 Executar Testes

```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E (certifique-se de que o Supabase está configurado)
npm run test:e2e

# Todos os testes
npm run test:all

# Cobertura
npm run test:coverage
```

**Critério de Sucesso:**
- ✅ Todos os testes passando
- ✅ Cobertura ≥ 70%

### 4.4 Build de Produção

```bash
# Build completo com validações
npm run build:prod

# Verifique o tamanho do bundle
npm run size:check

# Analise o bundle (opcional)
npm run build:analyze
```

**Critérios de Sucesso:**
- ✅ Build sem erros
- ✅ Bundle size aceitável
- ✅ Sem warnings críticos

### 4.5 Testar Localmente

```bash
# Preview do build de produção
npm run preview:prod

# Abra http://localhost:4173
# Teste funcionalidades críticas:
# - Login
# - Criação de PDI
# - Visualização de perfil
# - Notificações
```

---

## 🚀 FASE 5: DEPLOY

### Opção A: Vercel (Recomendado)

```bash
# 1. Instale Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Configure variáveis de ambiente na UI
# Vá em Project Settings → Environment Variables
# Adicione todas as variáveis do .env.production
```

### Opção B: Netlify

```bash
# 1. Instale Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Inicialize
netlify init

# 4. Deploy
netlify deploy --prod

# 5. Configure variáveis de ambiente
netlify env:set VITE_SUPABASE_URL "sua-url"
netlify env:set VITE_SUPABASE_ANON_KEY "sua-chave"
# ... repita para todas as variáveis
```

### Opção C: Manual (Servidor Próprio)

```bash
# 1. Build
npm run build:prod

# 2. Os arquivos estáticos estão em dist/
# 3. Configure seu servidor web (nginx/apache) para servir dist/
# 4. Configure redirecionamentos para SPA:
#    Todas as rotas → index.html

# Exemplo nginx:
# location / {
#   try_files $uri $uri/ /index.html;
# }
```

---

## ✅ FASE 6: PÓS-DEPLOY

### 6.1 Smoke Tests em Produção

Execute estes testes manualmente após deploy:

#### Teste 1: Login
- [ ] Abra a URL de produção
- [ ] Faça login com credenciais de teste
- [ ] Verifique se redireciona para dashboard
- [ ] Logout

#### Teste 2: Criação de Dados
- [ ] Crie um novo PDI
- [ ] Verifique se salva no banco
- [ ] Verifique se notificação aparece
- [ ] Delete o PDI de teste

#### Teste 3: Permissões
- [ ] Login como employee
- [ ] Tente acessar /admin (deve bloquear)
- [ ] Login como admin
- [ ] Acesse /admin (deve permitir)

#### Teste 4: Performance
- [ ] Abra DevTools → Network
- [ ] Recarregue a página
- [ ] Verifique tempo de carregamento < 3s
- [ ] Verifique Core Web Vitals (Lighthouse)

### 6.2 Configurar Alertas

#### Sentry
- [ ] Configure alerta para > 10 erros/hora
- [ ] Configure alerta para erros críticos (500)
- [ ] Teste enviando um erro proposital

#### Google Analytics
- [ ] Verifique se eventos estão sendo registrados
- [ ] Configure funil de conversão (login → PDI criado)

### 6.3 Monitoramento de Banco de Dados

No Supabase:
- [ ] Vá em **Database → Performance**
- [ ] Configure alertas para:
  - CPU > 80%
  - Memória > 80%
  - Conexões > 90%
- [ ] Configure notificações por email

### 6.4 Documentação

- [ ] Atualize README.md com URL de produção
- [ ] Documente processo de rollback
- [ ] Crie runbook para problemas comuns
- [ ] Compartilhe credenciais com equipe (use vault)

---

## 🔄 ROLLBACK (Em Caso de Problemas)

### Rollback Rápido (Vercel/Netlify)

```bash
# Vercel
vercel rollback <deployment-url>

# Netlify
netlify rollback
```

### Rollback Manual

```bash
# 1. Faça checkout da versão anterior
git checkout <commit-anterior>

# 2. Build e deploy novamente
npm run build:prod
# ... siga processo de deploy
```

### Rollback de Banco de Dados

**ATENÇÃO:** Só faça se absolutamente necessário!

```bash
# 1. No Supabase, vá em Database → Backups
# 2. Selecione o backup anterior ao deploy
# 3. Clique em "Restore"
# 4. Aguarde confirmação (pode levar alguns minutos)
```

---

## 📊 MÉTRICAS DE SUCESSO

### Primeira Hora
- [ ] 0 erros críticos no Sentry
- [ ] Tempo de carregamento < 3s
- [ ] Login funcionando para todos os papéis

### Primeiro Dia
- [ ] 95% uptime
- [ ] Funcionalidades críticas operacionais
- [ ] Performance dentro dos limites
- [ ] Usuários conseguem completar fluxos principais

### Primeira Semana
- [ ] Feedback positivo dos usuários
- [ ] Métricas de engajamento positivas
- [ ] Nenhum bug crítico reportado
- [ ] Performance estável

---

## 🆘 TROUBLESHOOTING

### Erro: "Not authenticated"
**Causa:** Variáveis de ambiente incorretas
**Solução:** Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

### Erro: "RLS Policy Violation"
**Causa:** Políticas RLS muito restritivas ou JWT não sincronizado
**Solução:** Execute RLS_VALIDATION_SCRIPT.sql e verifique logs

### Performance Ruim
**Causa:** Bundle muito grande ou queries ineficientes
**Solução:**
- Execute `npm run build:analyze`
- Verifique queries no Supabase Performance tab
- Adicione índices se necessário

### Notificações Não Funcionam
**Causa:** Subscrição real-time não conectada
**Solução:**
- Verifique console do browser
- Verifique se Realtime está habilitado no Supabase
- Verifique RLS policies na tabela notifications

---

## 📞 CONTATOS DE EMERGÊNCIA

**DevOps:** [email]
**DBA:** [email]
**Product Owner:** [email]
**Suporte Supabase:** https://supabase.com/support

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Migrações aplicadas e validadas
- [ ] RLS policies verificadas
- [ ] Backup automático ativado
- [ ] Monitoramento configurado (Sentry + Analytics)
- [ ] Smoke tests em produção passando
- [ ] Performance aceitável (< 3s)
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Equipe notificada
- [ ] Plano de rollback documentado

---

**Data de Criação:** 30 de Setembro de 2025
**Próxima Revisão:** Após primeiro deploy
**Versão do Guia:** 1.0