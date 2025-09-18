# Configuração de Ambiente de Staging

## 1. Configuração do Supabase para Staging

### Criar Projeto Separado
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto para staging: `talentflow-staging`
3. Anote a URL e chave anônima do projeto de staging

### Configurar Banco de Dados
1. Execute todas as migrações no projeto de staging
2. Configure as mesmas políticas RLS
3. Crie usuários de teste com diferentes perfis

## 2. Variáveis de Ambiente para Staging

Crie arquivo `.env.staging`:
```
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
NODE_ENV=staging
VITE_SENTRY_DSN=your_staging_sentry_dsn
VITE_ANALYTICS_ID=your_staging_analytics_id
```

## 3. Usuários de Teste

### Credenciais para UAT
- **Admin**: admin.staging@empresa.com / admin123
- **RH**: rh.staging@empresa.com / rh123456  
- **Gestor**: gestor.staging@empresa.com / gestor123
- **Colaborador**: colaborador.staging@empresa.com / colab123

### Dados de Teste
- 20 perfis de colaboradores
- 5 equipes diferentes
- 15 PDIs em diferentes status
- 50 competências distribuídas
- 10 grupos de ação ativos

## 4. Checklist de Testes UAT

### Funcionalidades Críticas
- [ ] Login/Logout com todos os perfis
- [ ] Criação e gestão de PDIs
- [ ] Avaliação de competências
- [ ] Navegação entre todas as páginas
- [ ] Permissões por tipo de usuário
- [ ] Responsividade mobile/desktop

### Fluxos Completos
- [ ] Colaborador cria PDI → Gestor valida
- [ ] Autoavaliação → Avaliação do gestor
- [ ] Criação de grupo → Adição de participantes
- [ ] Solicitação de mentoria → Aceite do mentor

### Performance e Segurança
- [ ] Tempo de carregamento < 3 segundos
- [ ] Sem erros no console
- [ ] Políticas RLS funcionando
- [ ] Rate limiting ativo

## 5. Comandos para Staging

```bash
# Build para staging
npm run build -- --mode staging

# Preview staging
npm run preview -- --mode staging

# Deploy para staging
npm run deploy:staging
```

## 6. Monitoramento de Staging

### Métricas a Acompanhar
- Tempo de resposta das APIs
- Taxa de erro por funcionalidade
- Uso de recursos (CPU, memória)
- Feedback dos testadores

### Ferramentas
- Sentry para erros
- Analytics para uso
- Logs do Supabase para performance