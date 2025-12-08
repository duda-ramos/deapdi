# TalentFlow - Guia de Troubleshooting

Este documento contém soluções para problemas comuns encontrados no TalentFlow.

## Índice
1. [Problemas de Conexão com Supabase](#problemas-de-conexão-com-supabase)
2. [Falhas de Autenticação](#falhas-de-autenticação)
3. [Problemas de RLS (Row Level Security)](#problemas-de-rls)
4. [Erros de Performance](#erros-de-performance)
5. [Issues de Build](#issues-de-build)
6. [Problemas de Deploy](#problemas-de-deploy)
7. [Como Investigar Erros](#como-investigar-erros)
8. [FAQs](#faqs)
9. [Contatos de Suporte](#contatos-de-suporte)

---

## Problemas de Conexão com Supabase

### Erro: "Failed to fetch" ou "NetworkError"

**Sintomas:**
- Tela de loading infinita
- Mensagem "Erro ao carregar dados"
- Console mostra "Failed to fetch"

**Causas possíveis:**
1. URL do Supabase incorreta
2. Chave anônima inválida
3. Projeto Supabase pausado
4. Problemas de rede/firewall

**Soluções:**

```bash
# 1. Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 2. Testar conexão direta
curl -X GET "https://seu-projeto.supabase.co/rest/v1/profiles" \
  -H "apikey: sua-anon-key" \
  -H "Authorization: Bearer sua-anon-key"

# 3. Verificar status do Supabase
# Acesse: https://status.supabase.com
```

### Erro: "JWT expired" ou "Invalid JWT"

**Solução:**
1. Limpar localStorage do navegador
2. Fazer logout e login novamente
3. Verificar se a anon key está correta

```javascript
// No console do navegador
localStorage.clear();
location.reload();
```

### Erro: "Connection refused" em desenvolvimento

**Solução:**
```bash
# Verificar se o Supabase local está rodando
supabase status

# Reiniciar Supabase local
supabase stop
supabase start
```

---

## Falhas de Autenticação

### Login retorna "Invalid login credentials"

**Causas:**
1. Email ou senha incorretos
2. Usuário não existe no auth.users
3. Usuário não confirmou email

**Soluções:**
```sql
-- Verificar se usuário existe
SELECT * FROM auth.users WHERE email = 'usuario@email.com';

-- Verificar se email está confirmado
SELECT email_confirmed_at FROM auth.users WHERE email = 'usuario@email.com';
```

### Login funciona mas perfil não carrega

**Causa:** Usuário existe em auth.users mas não em profiles

**Solução:**
```sql
-- Verificar profiles
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Criar profile se necessário
INSERT INTO profiles (id, email, name, role)
VALUES ('user-uuid', 'email@test.com', 'Nome', 'employee');
```

### Loop infinito de redirecionamento após login

**Causas:**
1. AuthContext não está atualizando corretamente
2. Problema com cookies/sessão

**Soluções:**
1. Limpar cookies e localStorage
2. Verificar se AuthProvider está envolvendo a aplicação
3. Verificar console para erros de JavaScript

---

## Problemas de RLS

### Erro: "Row level security violation"

**Sintomas:**
- Usuário não consegue ver/editar dados próprios
- Erro 403 ou "permission denied"

**Investigação:**
```sql
-- Verificar políticas ativas
SELECT * FROM pg_policies WHERE tablename = 'nome_tabela';

-- Testar política manualmente
SET LOCAL ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-uuid"}';
SELECT * FROM tabela WHERE id = 'record-id';
```

### Debug de RLS

```sql
-- Habilitar logs de RLS
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Ver logs no Supabase Dashboard > Logs > Postgres
```

### Política RLS não está funcionando

**Verificar:**
1. RLS está habilitado na tabela
2. Política usa `auth.uid()` corretamente
3. Usuário está autenticado

```sql
-- Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'nome_tabela';

-- Habilitar RLS se necessário
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
```

---

## Erros de Performance

### Aplicação lenta para carregar

**Diagnóstico:**
1. Abrir DevTools > Network
2. Verificar tempo de carregamento dos chunks
3. Verificar Lighthouse score

**Soluções:**
```bash
# Analisar bundle size
npm run build:prod
npx source-map-explorer dist/assets/*.js

# Verificar chunks grandes (> 500KB)
ls -la dist/assets/*.js | sort -k5 -n
```

### Queries do Supabase lentas

**Diagnóstico:**
```sql
-- Ver queries lentas
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

-- Analisar query específica
EXPLAIN ANALYZE SELECT * FROM sua_query;
```

**Soluções:**
1. Adicionar índices apropriados
2. Otimizar JOINs
3. Usar paginação

### Memory leak no navegador

**Sintomas:**
- Aplicação fica lenta com o tempo
- Memory cresce continuamente no DevTools

**Diagnóstico:**
1. DevTools > Memory > Take heap snapshot
2. Comparar snapshots antes e depois de ações

**Soluções:**
- Verificar useEffect sem cleanup
- Verificar event listeners não removidos
- Verificar timers/intervals não limpos

---

## Issues de Build

### Erro: "Cannot find module"

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Erro de TypeScript durante build

**Solução:**
```bash
# Verificar erros de tipo
npm run type-check

# Ignorar erros (temporário, não recomendado)
# Adicione "skipLibCheck": true em tsconfig.json
```

### Build falha sem erro claro

**Debug:**
```bash
# Build com mais detalhes
npm run build:prod -- --debug

# Verificar versão do Node
node -v  # Deve ser >= 18

# Verificar memória disponível
free -h
```

---

## Problemas de Deploy

### Deploy no Vercel falha

**Verificações:**
1. Verificar Build Command: `npm run build:prod`
2. Verificar Output Directory: `dist`
3. Verificar Node Version: 18.x

```bash
# Verificar logs
vercel logs --follow

# Build local para debug
npm run build:prod 2>&1 | tee build.log
```

### Variáveis de ambiente não carregam

**Causas:**
1. Prefixo `VITE_` faltando
2. Variável não configurada no Vercel/Netlify

**Verificar:**
```javascript
// No código
console.log(import.meta.env.VITE_SUPABASE_URL);

// No Vercel Dashboard
// Settings > Environment Variables
```

---

## Como Investigar Erros

### Usando o Sentry

1. Acesse [sentry.io](https://sentry.io)
2. Vá para Issues > selecione o erro
3. Analise:
   - Stack trace
   - Breadcrumbs (ações do usuário)
   - Tags (browser, OS, versão)
   - User context

### Usando os Logs do Supabase

1. Acesse Supabase Dashboard
2. Vá para Logs > Postgres ou Edge Functions
3. Filtre por:
   - Nível (error, warning)
   - Timestamp
   - Query específica

### Debugando RLS Policies

```sql
-- 1. Identificar o usuário
SELECT auth.uid();

-- 2. Verificar claims do JWT
SELECT auth.jwt();

-- 3. Simular acesso
SET LOCAL ROLE authenticated;
SET request.jwt.claims = '{"sub": "uuid-do-usuario"}';

-- 4. Executar query problemática
SELECT * FROM tabela_problema;
```

### Usando Console do Navegador

```javascript
// Ver estado da autenticação
console.log(await supabase.auth.getSession());

// Ver usuário atual
console.log(await supabase.auth.getUser());

// Testar query específica
const { data, error } = await supabase.from('profiles').select('*');
console.log({ data, error });
```

---

## FAQs

### Por que não consigo ver os dados de outros usuários?

**R:** O TalentFlow usa Row Level Security (RLS) para proteger dados. Cada usuário só vê seus próprios dados ou dados que tem permissão baseada no seu role (employee, manager, hr, admin).

### Como resetar a senha de um usuário?

**R:** 
1. Via Supabase Dashboard: Authentication > Users > Reset Password
2. Via código: `supabase.auth.resetPasswordForEmail(email)`

### Por que o gráfico não está carregando?

**R:** Verificar:
1. Se há dados suficientes no período selecionado
2. Console do navegador para erros
3. Network tab para ver se API retorna dados

### Como limpar o cache da aplicação?

**R:**
```javascript
// No console do navegador
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload();
```

### O que fazer quando a aplicação trava?

**R:**
1. F5 para recarregar
2. Ctrl+Shift+R para hard reload
3. Limpar cache (ver acima)
4. Verificar console para erros
5. Reportar issue com detalhes

---

## Contatos de Suporte

| Nível | Tempo de Resposta | Canal |
|-------|-------------------|-------|
| Crítico (produção down) | 1 hora | PagerDuty / Telefone |
| Alto (funcionalidade quebrada) | 4 horas | Slack #talentflow-urgent |
| Médio (bug afetando usuários) | 24 horas | Slack #talentflow-support |
| Baixo (melhorias) | 1 semana | GitHub Issues |

### Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação React](https://react.dev)
- [Status Page](https://status.supabase.com)
- [GitHub Issues](https://github.com/sua-org/talentflow/issues)

---

*Última atualização: Dezembro 2024*
