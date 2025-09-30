# ✅ CHECKLIST PRÉ-DEPLOY PARA PRODUÇÃO

## 🔧 CONFIGURAÇÃO DE AMBIENTE

### Variáveis de Ambiente
- [x] `.env.production` criado com todas as variáveis necessárias
- [ ] `VITE_SUPABASE_URL` configurada para produção
- [ ] `VITE_SUPABASE_ANON_KEY` configurada para produção
- [ ] `VITE_SENTRY_DSN` configurada para monitoramento
- [ ] `VITE_ANALYTICS_ID` configurada para analytics
- [x] `.env.production` adicionado ao `.gitignore`
- [x] `.env.example` atualizado com todas as variáveis

## 🔒 SEGURANÇA FRONTEND

### Content Security Policy (CSP)
- [x] Meta tags CSP adicionadas ao `index.html`
- [x] Políticas configuradas para scripts, styles, imagens, Sentry
- [x] Conexões permitidas apenas para domínios confiáveis
- [x] Headers de segurança adicionais configurados
- [x] Permissions Policy configurada

### Sanitização de Inputs
- [x] DOMPurify instalado e configurado
- [x] Todos os inputs de texto sanitizados
- [x] Validação implementada em todos os formulários
- [x] Prevenção XSS em componentes de renderização

### Rate Limiting e Performance
- [x] Rate limiting implementado para chamadas de API
- [x] Console.logs removidos do código de produção via Terser
- [x] Error boundaries implementados
- [x] Timeouts configurados para requests
- [x] Rate limiting configurável via variáveis de ambiente

## 🛡️ SEGURANÇA BACKEND (SUPABASE)

### Políticas RLS
- [x] Todas as tabelas com RLS habilitado
- [x] Políticas auditadas tabela por tabela
- [x] Testado com diferentes tipos de usuário
- [x] Nenhuma brecha de segurança identificada
- [x] Políticas de INSERT corrigidas

### Configuração do Supabase
- [ ] Backups automáticos diários configurados
- [ ] Retenção de backups por 30 dias
- [ ] Point-in-time recovery habilitado
- [ ] Permissões da chave anônima revisadas
- [ ] Rate limiting configurado se aplicável

## 📊 MONITORAMENTO E LOGS

### Sentry (Monitoramento de Erros)
- [x] `@sentry/react` instalado e configurado
- [ ] DSN de produção configurado
- [x] Error boundaries integrados
- [x] Source maps ocultos em produção
- [x] Filtros de erro configurados
- [x] Replay sessions configuradas com privacidade
- [x] Performance monitoring ativo

### Analytics
- [x] Google Analytics ou alternativa configurada
- [x] Eventos customizados implementados
- [x] Tracking de conversão configurado
- [x] Métricas de performance monitoradas
- [x] Core Web Vitals rastreamento
- [x] Configurações de privacidade aplicadas

### Logs Estruturados
- [x] Logs para erros de autenticação
- [x] Logs para falhas em operações críticas
- [x] Métricas de performance capturadas
- [x] Logs de segurança implementados
- [x] Rate limiting logs implementados

## 🌐 DOMÍNIO E HOSPEDAGEM

### Domínio Personalizado
- [ ] Registros DNS documentados
- [ ] Redirects configurados (www ↔ não-www)
- [ ] Certificado SSL preparado
- [ ] CORS configurado para domínio de produção

## 🧪 AMBIENTE DE STAGING

### Configuração
- [ ] Projeto Supabase de staging criado
- [ ] Banco de dados separado para testes
- [ ] URL específica para staging configurada
- [ ] Usuários de teste criados

### Dados de Teste
- [ ] Perfis de teste com diferentes roles
- [ ] PDIs de exemplo em vários status
- [ ] Competências distribuídas
- [ ] Grupos de ação ativos
- [ ] Histórico de dados para relatórios

## 🔍 TESTES E QUALIDADE

### Testes Automatizados
- [x] Todos os testes unitários passando
- [x] Testes de integração passando
- [x] Testes E2E passando
- [x] Cobertura de código ≥ 70%

### Testes Manuais
- [ ] Teste manual completo realizado
- [ ] Todas as funcionalidades verificadas
- [ ] Fluxos multi-usuário testados
- [ ] Responsividade validada

### UAT (Testes de Aceitação)
- [x] Documentação UAT preparada
- [ ] Stakeholders treinados
- [ ] Ambiente de staging disponível
- [ ] Feedback coletado e incorporado

## ⚡ PERFORMANCE

### Build de Produção
- [x] `npm run build:prod` executado sem erros
- [x] Arquivos minificados e otimizados
- [x] Code splitting implementado
- [x] Assets otimizados
- [x] Tree shaking configurado
- [x] Bundle analysis disponível

### Otimizações
- [x] Lazy loading implementado onde apropriado
- [x] Imagens otimizadas
- [x] Bundles analisados e otimizados
- [x] Cache configurado adequadamente
- [x] Core Web Vitals monitoramento
- [x] Performance budgets definidos

## 🚀 DEPLOY

### Preparação Final
- [x] `npm run deploy:check` executado com sucesso
- [x] Auditoria de segurança realizada
- [ ] Backup do banco atual criado
- [x] Plano de rollback preparado
- [x] Scripts de deploy configurados
- [x] Health checks implementados

### Pós-Deploy
- [ ] Smoke tests executados em produção
- [ ] Monitoramento ativo configurado
- [ ] Alertas configurados para eventos críticos
- [ ] Documentação de produção atualizada
- [ ] Performance baseline estabelecido
- [ ] Métricas de negócio configuradas

## 📞 CONTATOS DE EMERGÊNCIA

### Equipe Técnica
- **Desenvolvedor Principal**: [email]
- **DevOps**: [email]
- **DBA**: [email]
- **Suporte Técnico**: [email]

### Stakeholders
- **Product Owner**: [email]
- **RH**: [email]
- **Administração**: [email]
- **Usuários Chave**: [emails]

## 🆘 PLANO DE ROLLBACK

### Em Caso de Problemas Críticos
1. Reverter deploy para versão anterior
2. Restaurar backup do banco se necessário
3. Comunicar stakeholders
4. Investigar e corrigir problemas
5. Planejar novo deploy
6. Atualizar documentação de incidentes
7. Revisar processo de deploy

## 📈 MÉTRICAS DE SUCESSO PÓS-DEPLOY
---

### Primeira Hora
### Primeiro Dia
- [ ] 95% de uptime
- [ ] Performance dentro dos limites
- [ ] Usuários conseguem completar fluxos principais
- [ ] Notificações funcionando
- [ ] 0 erros críticos no Sentry
### Primeira Semana
- [ ] Feedback positivo dos usuários
- [ ] Métricas de engajamento positivas
- [ ] Nenhum bug crítico reportado
- [ ] Performance estável
- [ ] Tempo de carregamento < 3s
- [ ] Login funcionando para todos os papéis
- [ ] Funcionalidades críticas operacionais
**⚠️ IMPORTANTE**: Não faça deploy para produção até que TODOS os itens desta checklist estejam marcados como concluídos.