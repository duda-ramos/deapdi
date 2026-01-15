# Guia de Validação do Projeto Supabase

## 📋 Índice
1. [Queries SQL para Execução](#queries-sql)
2. [Checklist de Verificação do Dashboard](#checklist-dashboard)
3. [Documentação dos Resultados](#documentacao-resultados)

---

## 🔍 Queries SQL para Execução

### 1. Contar Tabelas do Schema Public

Execute esta query no **SQL Editor** do Supabase:

```sql
-- Contar total de tabelas no schema public
SELECT 
    COUNT(*) as total_tables,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Listar todas as tabelas com detalhes
SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    hasindexes as has_indexes,
    hasrules as has_rules,
    hastriggers as has_triggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado:**
- Total de tabelas criadas
- Lista detalhada de cada tabela com suas propriedades

---

### 2. Listar Tabelas SEM RLS Ativo

Execute esta query no **SQL Editor** do Supabase:

```sql
-- Identificar tabelas sem RLS (Row Level Security) habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
ORDER BY tablename;

-- Contar tabelas sem RLS
SELECT 
    COUNT(*) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false;
```

**Resultado esperado:**
- Lista de tabelas vulneráveis (sem RLS)
- Contagem total de tabelas sem proteção

---

### 3. Verificar Políticas RLS Existentes

Execute esta query adicional para ver quais tabelas TÊM políticas RLS:

```sql
-- Listar todas as políticas RLS configuradas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Resumo de políticas por tabela
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(DISTINCT cmd) as different_commands
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies DESC;
```

---

### 4. Verificar Storage Buckets

```sql
-- Listar buckets de storage configurados
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;
```

---

### 5. Verificar Funções/RPC Criadas

```sql
-- Listar todas as funções customizadas
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    t.typname as return_type,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type
FROM pg_proc p
INNER JOIN pg_namespace n ON p.pronamespace = n.oid
INNER JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

---

## ✅ Checklist de Verificação do Dashboard

### Acesse: [Supabase Dashboard](https://app.supabase.com)

### 🔐 1. Authentication (Auth)

**Navegação:** `Project Settings > Authentication`

- [ ] **Auth está habilitado?**
  - Verificar se o serviço Auth está ativo
  - Status: ⚪ Desabilitado | 🟢 Habilitado
  
- [ ] **Provedores de autenticação configurados:**
  - [ ] Email/Password
  - [ ] Magic Link
  - [ ] OAuth (Google, GitHub, etc.)
  
- [ ] **Configurações de Email:**
  - [ ] SMTP configurado (ou usando default)
  - [ ] Templates de email customizados
  - [ ] Email de confirmação habilitado
  
- [ ] **Configurações de Segurança:**
  - [ ] JWT expiration time
  - [ ] Refresh token rotation
  - [ ] MFA habilitado (se necessário)

**Documentar:**
```
Auth Status: [Habilitado/Desabilitado]
Provedores: [listar provedores ativos]
SMTP: [Configurado/Default]
JWT Expiry: [tempo em segundos]
```

---

### ⚡ 2. Rate Limiting

**Navegação:** `Project Settings > API` ou `Project Settings > Database`

- [ ] **Rate limiting está configurado?**
  - Verificar limites de requisições por IP
  - Verificar limites de requisições por usuário
  
- [ ] **Limites identificados:**
  - [ ] Requests por segundo: _______
  - [ ] Requests por minuto: _______
  - [ ] Concurrent connections: _______

**Documentar:**
```
Rate Limiting: [Configurado/Não Configurado]
Limites:
- Requests/segundo: [número]
- Requests/minuto: [número]
- Conexões simultâneas: [número]
```

---

### 🌍 3. Região do Projeto

**Navegação:** `Project Settings > General`

- [ ] **Região identificada:**
  - [ ] us-east-1 (N. Virginia)
  - [ ] us-west-1 (N. California)
  - [ ] eu-west-1 (Ireland)
  - [ ] eu-central-1 (Frankfurt)
  - [ ] ap-southeast-1 (Singapore)
  - [ ] ap-northeast-1 (Tokyo)
  - [ ] sa-east-1 (São Paulo)
  - [ ] Outra: _______

**Documentar:**
```
Região: [código da região]
Localização: [nome da localização]
```

---

### 💳 4. Plano Atual

**Navegação:** `Project Settings > Billing` ou `Organization > Billing`

- [ ] **Plano identificado:**
  - [ ] **Free Tier**
    - 500 MB database
    - 1 GB file storage
    - 2 GB bandwidth
    - 50,000 monthly active users
    - 500,000 Edge Function invocations
  
  - [ ] **Pro Plan** ($25/mês)
    - 8 GB database
    - 100 GB file storage
    - 250 GB bandwidth
    - 100,000 monthly active users
    - 2M Edge Function invocations
  
  - [ ] **Team Plan** (custom pricing)
  
  - [ ] **Enterprise**

- [ ] **Uso atual identificado:**
  - [ ] Database size: _______ MB/GB
  - [ ] Storage used: _______ MB/GB
  - [ ] Bandwidth used: _______ GB
  - [ ] Active users: _______

**Documentar:**
```
Plano: [Free/Pro/Team/Enterprise]
Uso atual:
- Database: [tamanho] / [limite]
- Storage: [tamanho] / [limite]
- Bandwidth: [uso] / [limite]
- Active Users: [número] / [limite]
```

---

### 🔧 5. Verificações Adicionais

#### API Keys
**Navegação:** `Project Settings > API`

- [ ] **Anon (public) key disponível**
- [ ] **Service role key disponível**
- [ ] **URL do projeto identificada**

#### Database
**Navegação:** `Project Settings > Database`

- [ ] **Connection pooling habilitado**
- [ ] **Connection string disponível**
- [ ] **SSL enforcement ativo**

#### Storage
**Navegação:** `Storage`

- [ ] **Buckets criados**
- [ ] **Políticas de acesso configuradas**
- [ ] **File size limits definidos**

---

## 📝 Documentação dos Resultados

### Template para Documentar os Resultados

```markdown
# Relatório de Validação do Projeto Supabase

**Data da validação:** [DD/MM/YYYY]
**Projeto:** [Nome do Projeto]
**URL:** [URL do projeto Supabase]

---

## 1. Análise de Tabelas

### Total de Tabelas
- **Quantidade:** [número]
- **Schema:** public

### Tabelas Listadas
[Cole aqui o resultado da query]

---

## 2. Análise de RLS (Row Level Security)

### Tabelas SEM RLS
- **Quantidade:** [número]
- **Lista:**
  ```
  [Cole aqui a lista de tabelas sem RLS]
  ```

### Políticas RLS Configuradas
- **Total de políticas:** [número]
- **Tabelas com políticas:** [número]

**⚠️ ATENÇÃO:** Tabelas sem RLS são vulneráveis e permitem acesso direto aos dados!

---

## 3. Configurações do Dashboard

### Authentication
- **Status:** [Habilitado/Desabilitado]
- **Provedores:** [lista]
- **SMTP:** [Configurado/Default]
- **JWT Expiry:** [tempo]

### Rate Limiting
- **Status:** [Configurado/Não Configurado]
- **Limites:** [detalhar]

### Região
- **Código:** [região]
- **Localização:** [nome]

### Plano
- **Tipo:** [Free/Pro/Team/Enterprise]
- **Uso Database:** [X] MB/GB de [limite]
- **Uso Storage:** [X] MB/GB de [limite]
- **Uso Bandwidth:** [X] GB de [limite]
- **Active Users:** [número] de [limite]

---

## 4. Storage Buckets
[Cole aqui o resultado da query de buckets]

---

## 5. Funções RPC
[Cole aqui o resultado da query de funções]

---

## 6. Recomendações

### 🔴 Crítico
- [ ] [Item crítico identificado]

### 🟡 Importante
- [ ] [Item importante identificado]

### 🟢 Sugestões
- [ ] [Sugestão de melhoria]

---

## 7. Próximos Passos
1. [Ação 1]
2. [Ação 2]
3. [Ação 3]
```

---

## 🚀 Como Usar Este Guia

1. **Execute as queries SQL** uma por uma no SQL Editor do Supabase
2. **Copie os resultados** de cada query
3. **Navegue pelo Dashboard** seguindo o checklist
4. **Documente tudo** usando o template fornecido
5. **Analise os resultados** e identifique problemas críticos
6. **Crie um plano de ação** baseado nas descobertas

---

## ⚠️ Pontos Críticos de Atenção

### Segurança
- ✅ Todas as tabelas devem ter RLS habilitado (exceto tabelas públicas intencionais)
- ✅ Políticas RLS devem cobrir SELECT, INSERT, UPDATE, DELETE
- ✅ Service role key nunca deve ser exposta no frontend

### Performance
- ✅ Verificar se está próximo dos limites do plano
- ✅ Identificar tabelas grandes que podem precisar de otimização
- ✅ Verificar se há índices nas tabelas principais

### Disponibilidade
- ✅ Confirmar que a região está próxima dos usuários finais
- ✅ Verificar se o plano atual suporta o tráfego esperado
- ✅ Confirmar que backup automático está configurado (Pro+)

---

## 📞 Recursos Adicionais

- [Documentação Oficial do Supabase](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Pricing Plans](https://supabase.com/pricing)
- [Security Best Practices](https://supabase.com/docs/guides/platform/security)
