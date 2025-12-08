# TalentFlow - Procedimentos de Manutenção

Este documento descreve os procedimentos de manutenção rotineira e preventiva do TalentFlow.

## Índice
1. [Schedule de Manutenções](#schedule-de-manutenções)
2. [Atualização de Dependências](#atualização-de-dependências)
3. [Auditoria de Segurança](#auditoria-de-segurança)
4. [Backup e Restore](#backup-e-restore)
5. [Limpeza de Dados](#limpeza-de-dados)
6. [Monitoramento de Performance](#monitoramento-de-performance)
7. [Atualização de Políticas RLS](#atualização-de-políticas-rls)
8. [Revisão de Logs e Métricas](#revisão-de-logs-e-métricas)
9. [Atualização de Versão](#atualização-de-versão)
10. [Downtime Esperado](#downtime-esperado)

---

## Schedule de Manutenções

### Diário
- [ ] Verificar alertas do Sentry
- [ ] Revisar métricas de uptime
- [ ] Checar health check status

### Semanal
- [ ] Revisar issues não resolvidas no Sentry
- [ ] Analisar métricas do Google Analytics
- [ ] Verificar uso de storage do Supabase
- [ ] Backup semanal do banco de dados

### Mensal
- [ ] Atualizar dependências (npm audit)
- [ ] Revisar e atualizar políticas RLS
- [ ] Analisar performance queries lentas
- [ ] Revisar e limpar logs antigos
- [ ] Verificar certificados SSL

### Trimestral
- [ ] Auditoria completa de segurança
- [ ] Revisar e otimizar índices do banco
- [ ] Planejamento de capacity
- [ ] Revisão de documentação
- [ ] Teste de disaster recovery

---

## Atualização de Dependências

### Verificação Semanal

```bash
# Ver dependências desatualizadas
npm outdated

# Auditoria de segurança
npm audit

# Relatório detalhado
npm audit --json > audit-report.json
```

### Processo de Atualização

1. **Criar branch de atualização:**
```bash
git checkout -b chore/update-dependencies
```

2. **Atualizar dependências patch/minor:**
```bash
# Atualizar dentro das ranges do package.json
npm update

# Verificar se nada quebrou
npm run test
npm run build:prod
```

3. **Atualizar dependências major (com cuidado):**
```bash
# Ver breaking changes no changelog da dependência
npm info <package> changelog

# Atualizar uma por uma
npm install <package>@latest

# Testar cada atualização
npm run test
```

4. **Corrigir vulnerabilidades:**
```bash
# Fix automático
npm audit fix

# Fix forçado (cuidado!)
npm audit fix --force
```

5. **Testar e fazer merge:**
```bash
npm run test:all
npm run build:prod
git add .
git commit -m "chore: update dependencies"
git push origin chore/update-dependencies
```

### Dependências Críticas

| Pacote | Criticidade | Notas |
|--------|-------------|-------|
| react | Alta | Testar todas as telas |
| @supabase/supabase-js | Alta | Testar auth e queries |
| @sentry/react | Média | Testar error tracking |
| vite | Alta | Testar build completo |

---

## Auditoria de Segurança

### Checklist Mensal

- [ ] Executar `npm audit` e resolver HIGH/CRITICAL
- [ ] Verificar dependências deprecated
- [ ] Revisar logs de acesso do Supabase
- [ ] Verificar tentativas de login falhas
- [ ] Auditar políticas RLS
- [ ] Verificar tokens expostos em logs

### Checklist Trimestral

- [ ] Penetration testing (se aplicável)
- [ ] Revisão de permissões de usuários admin
- [ ] Verificar rotação de chaves
- [ ] Auditar acessos ao Supabase Dashboard
- [ ] Revisar CSP headers
- [ ] Testar rate limiting

### Comandos de Auditoria

```bash
# Auditoria npm
npm audit

# Verificar secrets vazados
git log -p | grep -E "(password|secret|key|token)" | head -20

# Verificar CSP
curl -I https://seu-site.com | grep -i "content-security-policy"
```

---

## Backup e Restore

### Backup Automático (Supabase)

O Supabase Pro realiza backups automáticos diários. Para projetos Free:

1. Acesse Supabase Dashboard
2. Settings > Database
3. Backups > Point-in-time Recovery (Pro)

### Backup Manual

```bash
# Via pg_dump (requer acesso direto)
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### Restore de Backup

⚠️ **CUIDADO: Restore substitui todos os dados atuais!**

```bash
# Via Supabase Dashboard (recomendado)
# Settings > Database > Backups > Restore

# Via psql
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### Schedule de Backups

| Ambiente | Frequência | Retenção |
|----------|------------|----------|
| Production | Diário | 30 dias |
| Staging | Semanal | 7 dias |

---

## Limpeza de Dados

### Logs Antigos

```sql
-- Limpar logs de mais de 90 dias
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Limpar notificações lidas de mais de 30 dias
DELETE FROM notifications 
WHERE read = true AND created_at < NOW() - INTERVAL '30 days';
```

### Sessões Expiradas

```sql
-- Limpar sessões expiradas (feito automaticamente pelo Supabase)
-- Verificar se está funcionando:
SELECT COUNT(*) FROM auth.sessions 
WHERE expires_at < NOW();
```

### Storage

```bash
# Verificar uso de storage
# Supabase Dashboard > Storage > Usage

# Limpar avatares órfãos (sem profile associado)
# Implementar via cron job ou função
```

---

## Monitoramento de Performance

### Métricas a Acompanhar

| Métrica | Threshold | Ação |
|---------|-----------|------|
| LCP (Largest Contentful Paint) | < 2.5s | Otimizar loading |
| FID (First Input Delay) | < 100ms | Reduzir JS blocking |
| CLS (Cumulative Layout Shift) | < 0.1 | Fixar dimensões de imagens |
| API Response Time | < 500ms | Otimizar queries |
| Error Rate | < 1% | Investigar erros |

### Queries Lentas

```sql
-- Identificar queries lentas
SELECT 
  query,
  calls,
  total_time / calls AS avg_time,
  rows / calls AS avg_rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Verificar índices não utilizados
SELECT 
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan AS number_of_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE idx_scan < 50
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### Otimização de Índices

```sql
-- Criar índice para query lenta
CREATE INDEX idx_profiles_role ON profiles(role);

-- Reindexar tabela
REINDEX TABLE profiles;

-- Analisar tabela para otimizar planner
ANALYZE profiles;
```

---

## Atualização de Políticas RLS

### Processo de Atualização

1. **Documentar política atual:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'tabela';
```

2. **Criar migration com nova política:**
```sql
-- Arquivo: supabase/migrations/YYYYMMDD_update_policy.sql

-- Remover política antiga
DROP POLICY IF EXISTS "nome_policy" ON tabela;

-- Criar nova política
CREATE POLICY "novo_nome_policy" ON tabela
  FOR ALL
  USING (user_id = auth.uid());
```

3. **Testar em staging:**
```bash
supabase db push --db-url "postgresql://..."
```

4. **Validar acesso:**
```sql
-- Como usuário específico
SET LOCAL ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-uuid"}';
SELECT * FROM tabela;
```

---

## Revisão de Logs e Métricas

### Sentry - Revisão Semanal

1. Acessar https://sentry.io
2. Ordenar issues por frequência
3. Para cada issue:
   - Analisar stack trace
   - Verificar impacto (usuários afetados)
   - Criar ticket se necessário
   - Marcar como resolvido se corrigido

### Google Analytics - Revisão Semanal

1. Verificar eventos trackados
2. Analisar:
   - Usuários ativos
   - Pages mais acessadas
   - Eventos de conversão (PDI criado, etc.)
   - Taxa de bounce

### Supabase Logs - Revisão Diária

1. Dashboard > Logs
2. Filtrar por:
   - Errors (prioridade)
   - Slow queries
   - Auth failures

---

## Atualização de Versão

### Versioning (SemVer)

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): Novas features
- **PATCH** (0.0.x): Bug fixes

### Processo de Release

1. **Atualizar versão:**
```bash
npm version patch  # ou minor/major
```

2. **Atualizar CHANGELOG:**
```markdown
## [1.0.1] - 2024-01-15
### Fixed
- Corrigido bug de login
- Melhorada performance do dashboard
```

3. **Criar tag e release:**
```bash
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin v1.0.1
```

4. **Deploy:**
```bash
npm run deploy:prod
```

---

## Downtime Esperado

### Manutenções Sem Downtime

- Atualização de dependências frontend
- Deploy de novas features
- Atualização de políticas RLS (maioria)
- Adição de índices (CONCURRENTLY)

### Manutenções Com Downtime Mínimo (< 5 min)

- Migrations de schema simples
- Restart do Supabase
- Atualização de Edge Functions

### Manutenções Com Downtime Planejado

| Operação | Downtime Estimado | Frequência |
|----------|-------------------|------------|
| Migration de dados grandes | 15-30 min | Raro |
| Restore de backup | 30-60 min | Emergência |
| Upgrade do Supabase | 10-15 min | Raro |

### Comunicação de Manutenção

1. Avisar com 48h de antecedência (manutenções planejadas)
2. Canais: Email, Banner na aplicação, Slack
3. Incluir: Data/hora, duração estimada, impacto
4. Após: Comunicar conclusão

---

## Cronograma de Manutenção Sugerido

| Dia | Hora | Atividade |
|-----|------|-----------|
| Segunda | 09:00 | Revisão alertas Sentry |
| Quarta | 14:00 | Verificação métricas GA |
| Sexta | 16:00 | Backup semanal (staging) |
| Primeiro dia do mês | 10:00 | Atualização dependências |
| Dia 15 do mês | 10:00 | Revisão RLS e segurança |

---

*Última atualização: Dezembro 2024*
