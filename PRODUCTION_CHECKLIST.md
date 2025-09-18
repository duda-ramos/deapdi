# ✅ CHECKLIST PRÉ-DEPLOY PARA PRODUÇÃO

## 🔧 CONFIGURAÇÃO DE AMBIENTE

### Variáveis de Ambiente
- [ ] `.env.production` criado com todas as variáveis necessárias
- [ ] `VITE_SUPABASE_URL` configurada para produção
- [ ] `VITE_SUPABASE_ANON_KEY` configurada para produção
- [ ] `VITE_SENTRY_DSN` configurada para monitoramento
- [ ] `VITE_ANALYTICS_ID` configurada para analytics
- [ ] `.env.production` adicionado ao `.gitignore`
- [ ] `.env.example` atualizado com todas as variáveis

## 🔒 SEGURANÇA FRONTEND

### Content Security Policy (CSP)
- [ ] Meta tags CSP adicionadas ao `index.html`
- [ ] Políticas configuradas para scripts, styles, imagens
- [ ] Conexões permitidas apenas para domínios confiáveis
- [ ] Headers de segurança adicionais configurados

### Sanitização de Inputs
- [ ] DOMPurify instalado e configurado
- [ ] Todos os inputs de texto sanitizados
- [ ] Validação implementada em todos os formulários
- [ ] Prevenção XSS em componentes de renderização

### Rate Limiting e Performance
- [ ] Rate limiting implementado para chamadas de API
- [ ] Console.logs removidos do código de produção
- [ ] Error boundaries implementados
- [ ] Timeouts configurados para requests

## 🛡️ SEGURANÇA BACKEND (SUPABASE)

### Políticas RLS
- [ ] Todas as tabelas com RLS habilitado
- [ ] Políticas auditadas tabela por tabela
- [ ] Testado com diferentes tipos de usuário
- [ ] Nenhuma brecha de segurança identificada
- [ ] Políticas de INSERT corrigidas

### Configuração do Supabase
- [ ] Backups automáticos diários configurados
- [ ] Retenção de backups por 30 dias
- [ ] Point-in-time recovery habilitado
- [ ] Permissões da chave anônima revisadas
- [ ] Rate limiting configurado se aplicável

## 📊 MONITORAMENTO E LOGS

### Sentry (Monitoramento de Erros)
- [ ] `@sentry/react` instalado e configurado
- [ ] DSN de produção configurado
- [ ] Error boundaries integrados
- [ ] Source maps configurados para debugging
- [ ] Filtros de erro configurados

### Analytics
- [ ] Google Analytics ou alternativa configurada
- [ ] Eventos customizados implementados
- [ ] Tracking de conversão configurado
- [ ] Métricas de performance monitoradas

### Logs Estruturados
- [ ] Logs para erros de autenticação
- [ ] Logs para falhas em operações críticas
- [ ] Métricas de performance capturadas
- [ ] Logs de segurança implementados

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
- [ ] Todos os testes unitários passando
- [ ] Testes de integração passando
- [ ] Testes E2E passando
- [ ] Cobertura de código ≥ 70%

### Testes Manuais
- [ ] Teste manual completo realizado
- [ ] Todas as funcionalidades verificadas
- [ ] Fluxos multi-usuário testados
- [ ] Responsividade validada

### UAT (Testes de Aceitação)
- [ ] Documentação UAT preparada
- [ ] Stakeholders treinados
- [ ] Ambiente de staging disponível
- [ ] Feedback coletado e incorporado

## ⚡ PERFORMANCE

### Build de Produção
- [ ] `npm run build:prod` executado sem erros
- [ ] Arquivos minificados e otimizados
- [ ] Code splitting implementado
- [ ] Assets otimizados

### Otimizações
- [ ] Lazy loading implementado onde apropriado
- [ ] Imagens otimizadas
- [ ] Bundles analisados e otimizados
- [ ] Cache configurado adequadamente

## 🚀 DEPLOY

### Preparação Final
- [ ] `npm run deploy:check` executado com sucesso
- [ ] Auditoria de segurança realizada
- [ ] Backup do banco atual criado
- [ ] Plano de rollback preparado

### Pós-Deploy
- [ ] Smoke tests executados em produção
- [ ] Monitoramento ativo configurado
- [ ] Alertas configurados para eventos críticos
- [ ] Documentação de produção atualizada

## 📞 CONTATOS DE EMERGÊNCIA

### Equipe Técnica
- **Desenvolvedor Principal**: [email]
- **DevOps**: [email]
- **DBA**: [email]

### Stakeholders
- **Product Owner**: [email]
- **RH**: [email]
- **Administração**: [email]

## 🆘 PLANO DE ROLLBACK

### Em Caso de Problemas Críticos
1. Reverter deploy para versão anterior
2. Restaurar backup do banco se necessário
3. Comunicar stakeholders
4. Investigar e corrigir problemas
5. Planejar novo deploy

---

**⚠️ IMPORTANTE**: Não faça deploy para produção até que TODOS os itens desta checklist estejam marcados como concluídos.