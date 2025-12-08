# TalentFlow - Sistema de Gestão de Talentos

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-80%25-yellow)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

Sistema completo de desenvolvimento profissional com gamificação para empresas.

## 📋 Índice

- [Início Rápido](#-início-rápido)
- [Ambientes](#-ambientes)
- [Recursos Principais](#-recursos-principais)
- [Tecnologias](#-tecnologias)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Deployment](#-deployment)
- [Monitoramento](#-monitoramento)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Suporte](#-suporte)

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 18.x
- npm >= 9.x
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/sua-org/talentflow.git
cd talentflow

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

### Usuários de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | anapaula@deadesign.com.br | DEA@pdi |
| RH | alexia@deadesign.com.br | DEA@pdi |
| Gestor | nathalia@deadesign.com.br | DEA@pdi |
| Colaborador | mariaeduarda@deadesign.com.br | DEA@pdi |

---

## 🌍 Ambientes

| Ambiente | URL | Branch | Supabase |
|----------|-----|--------|----------|
| Development | http://localhost:5173 | feature/* | Dev |
| Staging | https://talentflow-staging.vercel.app | develop | Staging |
| Production | https://talentflow.app | main | Production |

### Configuração por Ambiente

```bash
# Desenvolvimento
npm run dev

# Staging build
npm run build -- --mode staging

# Production build
npm run build:prod
```

---

## 📋 Recursos Principais

### 👤 Gestão de Pessoas
- Perfis de colaboradores
- Organograma interativo
- Gestão de equipes

### 📊 Desenvolvimento
- **PDI** - Planos de Desenvolvimento Individual
- **Competências** - Avaliação e tracking
- **Trilhas de Carreira** - Progressão profissional

### 🧠 Saúde Mental
- Check-ins emocionais
- Recursos de bem-estar
- Sessões de psicologia
- Alertas de risco

### 🤝 Mentoria
- Sistema de pareamento
- Agendamento de sessões
- Feedback estruturado

### 📈 Analytics
- Dashboards executivos
- Relatórios de RH
- Métricas de engajamento

### 🎮 Gamificação
- Sistema de pontos
- Conquistas e badges
- Rankings

---

## 🛠 Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Forms | React Hook Form |
| Charts | Recharts |
| PDF | jsPDF, jspdf-autotable |
| Testes | Jest, Cypress, Testing Library |
| Monitoramento | Sentry, Google Analytics |

---

## 🔐 Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJxxx...` |
| `VITE_APP_ENV` | Ambiente atual | `development` / `staging` / `production` |
| `VITE_APP_VERSION` | Versão da aplicação | `1.0.0` |

### Opcionais (Recomendadas para Produção)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SENTRY_DSN` | DSN do Sentry | `https://xxx@sentry.io/xxx` |
| `VITE_GA_MEASUREMENT_ID` | ID do Google Analytics | `G-XXXXXXXXXX` |
| `VITE_ENABLE_ANALYTICS` | Habilitar analytics | `true` / `false` |
| `VITE_ENABLE_DEBUG` | Modo debug | `true` / `false` |

### Arquivo de Exemplo

Veja `.env.example` para documentação completa de todas as variáveis.

---

## 📜 Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build padrão
npm run build:prod       # Build de produção otimizado
npm run preview          # Preview do build local
npm run preview:prod     # Preview do build de produção
```

### Testes

```bash
npm run test             # Testes unitários
npm run test:watch       # Testes em watch mode
npm run test:coverage    # Testes com coverage
npm run test:e2e         # Testes E2E (Cypress)
npm run test:e2e:open    # Cypress em modo interativo
npm run test:all         # Todos os testes
```

### Qualidade de Código

```bash
npm run lint             # Verificar lint
npm run lint:fix         # Corrigir lint
npm run type-check       # Verificar TypeScript
```

### Deploy

```bash
npm run deploy:staging   # Build para staging
npm run deploy:prod      # Build para produção
npm run deploy:check     # Verificações pré-deploy
```

### Utilitários

```bash
npm run health:check     # Verificar saúde do sistema
npm run size:check       # Analisar tamanho do bundle
npm run security:audit   # Auditoria de segurança
```

---

## 🚢 Deployment

### Pré-Deploy Checklist

- [ ] Testes passando (`npm run test:all`)
- [ ] Lint OK (`npm run lint`)
- [ ] Types OK (`npm run type-check`)
- [ ] Build OK (`npm run build:prod`)
- [ ] Bundle size aceitável (< 2MB)

### Deploy em Staging

```bash
# Via Vercel
vercel --env-file .env.staging

# Via Netlify
netlify deploy --build --context staging
```

### Deploy em Produção

```bash
# Via Vercel
vercel --prod

# Via Netlify
netlify deploy --prod
```

### Processo de Hotfix

1. Criar branch: `git checkout -b fix/nome-do-fix`
2. Implementar correção
3. Testar localmente
4. PR direto para `main` (emergência) ou via `develop`
5. Deploy imediato após merge

📖 Veja [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para instruções completas.

---

## 📊 Monitoramento

### Sentry (Error Tracking)

- Dashboard: https://sentry.io/organizations/your-org/projects/talentflow/
- Configuração: `VITE_SENTRY_DSN` no `.env`
- Alertas configurados para erros críticos

### Google Analytics (Usage Analytics)

- Dashboard: https://analytics.google.com
- Configuração: `VITE_GA_MEASUREMENT_ID` no `.env`
- Eventos trackados:
  - Login/Logout
  - Criação de PDI
  - Conclusão de ações
  - Check-ins emocionais (apenas conclusão, sem dados sensíveis)

### Health Check

```bash
# Verificar saúde do sistema
npm run health:check

# Endpoint de health check
curl -X POST 'https://seu-projeto.supabase.co/rest/v1/rpc/health_check' \
  -H "apikey: YOUR_ANON_KEY"
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Guia completo de deploy |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Solução de problemas comuns |
| [MAINTENANCE_PROCEDURES.md](./MAINTENANCE_PROCEDURES.md) | Procedimentos de manutenção |
| [ONBOARDING_DEVELOPERS.md](./ONBOARDING_DEVELOPERS.md) | Guia para novos desenvolvedores |
| [RLS_SECURITY_DOCUMENTATION.md](./RLS_SECURITY_DOCUMENTATION.md) | Documentação de segurança |
| [STAGING_SETUP.md](./STAGING_SETUP.md) | Configuração do ambiente staging |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções

- Commits: [Conventional Commits](https://www.conventionalcommits.org/)
- Código: ESLint + Prettier
- Testes: Jest para unit, Cypress para E2E

---

## 🆘 Suporte

### Canais de Suporte

| Nível | Canal | SLA |
|-------|-------|-----|
| Crítico | PagerDuty | 1 hora |
| Alto | Slack #talentflow-urgent | 4 horas |
| Médio | Slack #talentflow-support | 24 horas |
| Baixo | GitHub Issues | 1 semana |

### Contatos

- **Tech Lead**: tech-lead@empresa.com
- **DevOps**: devops@empresa.com
- **Suporte**: suporte@talentflow.app

### Links Úteis

- [Status Page](https://status.supabase.com)
- [Documentação Supabase](https://supabase.com/docs)
- [GitHub Issues](https://github.com/sua-org/talentflow/issues)

---

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

---

**Desenvolvido com ❤️ pela equipe TalentFlow**

*Versão: 1.0.0 | Última atualização: Dezembro 2024*
