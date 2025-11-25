# 🔐 GUIA COMPLETO DE TESTES MANUAIS DE ISOLAMENTO DE DADOS
## DEAPDI TalentFlow - Validação de Segurança por Role

---

## 📋 OBJETIVO

Este guia fornece instruções **passo a passo** para validar que o isolamento de dados entre roles (employee, manager, hr, admin) está funcionando corretamente na interface da aplicação.

**⚠️ IMPORTANTE:** NÃO modificar código durante os testes. Apenas documentar comportamentos observados.

---

## 🎯 PRÉ-REQUISITOS

### 1. Usuários de Teste

Execute o script SQL para verificar usuários existentes:

```bash
# No terminal do projeto
psql <sua_connection_string> -f VALIDATE_USER_ISOLATION_QUERY.sql
```

**OU** Execute no Supabase SQL Editor:

1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
2. Copie e cole o conteúdo de `VALIDATE_USER_ISOLATION_QUERY.sql`
3. Clique em `Run`

### 2. Verificar Credenciais

**Usuários com domínio @example.com:**
- carlos@example.com (employee)
- gabriela@example.com (manager)
- rita@example.com (hr)
- lucas@example.com (admin)

**OU usuários com domínio @deapdi-test.local:**
- colab1.teste@deapdi-test.local (employee) - Senha: `Colab@2025!`
- gestor1.teste@deapdi-test.local (manager) - Senha: `Gestor@2025!`
- rh.teste@deapdi-test.local (hr) - Senha: `RH@2025!`
- admin.teste@deapdi-test.local (admin) - Senha: `Admin@2025!`

**Se usuários não existirem:** Consulte `TEST_USERS_SETUP_GUIDE.md` para criar.

### 3. Ambiente de Desenvolvimento

```bash
# Iniciar servidor
npm run dev

# Aguardar até ver:
# ➜  Local:   http://localhost:5173/
```

**URL da aplicação:** http://localhost:5173

---

## 🖥️ SETUP DE NAVEGADORES

### Opção A: Múltiplos Navegadores (RECOMENDADO)

- **Navegador 1 (Chrome):** Employee
- **Navegador 2 (Firefox):** Manager
- **Navegador 3 (Edge/Safari):** HR
- **Navegador 4 (Opera/Brave):** Admin

### Opção B: Janelas Anônimas do Mesmo Navegador

⚠️ **ATENÇÃO:** Pode haver conflito de sessões. Use apenas se não tiver outros navegadores.

- **Janela Anônima 1:** Employee
- **Janela Anônima 2:** Manager
- **Janela Anônima 3:** HR
- **Janela Anônima 4:** Admin

### Como Abrir Janelas Anônimas

| Navegador | Atalho Windows/Linux | Atalho macOS |
|-----------|---------------------|--------------|
| Chrome | Ctrl + Shift + N | ⌘ + Shift + N |
| Firefox | Ctrl + Shift + P | ⌘ + Shift + P |
| Edge | Ctrl + Shift + N | ⌘ + Shift + N |
| Safari | — | ⌘ + Shift + N |

---

## 🧪 EXECUÇÃO DOS TESTES

### PREPARAÇÃO: Login Simultâneo

**Execute estes passos em TODOS os 4 navegadores/janelas:**

1. Acesse: http://localhost:5173
2. Faça login com as credenciais respectivas:
   - **Navegador 1:** Employee (carlos@... ou colab1.teste@...)
   - **Navegador 2:** Manager (gabriela@... ou gestor1.teste@...)
   - **Navegador 3:** HR (rita@... ou rh.teste@...)
   - **Navegador 4:** Admin (lucas@... ou admin.teste@...)

3. **Aguarde todos os 4 logins serem bem-sucedidos**

4. **Organize as janelas lado a lado** para facilitar comparação

---

## 🔍 TESTE 1: EMPLOYEE (Colaborador)

### Contexto

O employee deve ver **APENAS** seus próprios dados. Não deve ter acesso a:
- Dados de colegas
- Dados de outras equipes
- Informações de gestão
- Registros psicológicos de outros
- Dados sensíveis do sistema

---

### TESTE 1.1: Acesso a PDIs Próprios

**No navegador do EMPLOYEE:**

1. **Navegar:** Clique em `Desenvolvimento` → `Meu PDI`

2. **Verificar:**
   - [ ] Aparecem PDIs? (Esperado: ✅ Sim, apenas os próprios)
   - [ ] Quantos PDIs? Anotar: _______
   - [ ] Os PDIs são do usuário logado? (Esperado: ✅ Sim)

3. **Testar ação:**
   - [ ] Clique em um PDI para ver detalhes
   - [ ] Consegue editar? (Esperado: ✅ Sim)
   - [ ] Consegue criar novo PDI? (Esperado: ✅ Sim)

4. **TESTE CRÍTICO - Tentar acessar PDI de outro:**
   
   **No navegador do MANAGER:**
   - Abra um PDI de algum subordinado
   - Copie a URL (algo como: `/pdis/[UUID]`)
   
   **Volte ao navegador do EMPLOYEE:**
   - Cole a URL copiada na barra de endereço
   - Pressione Enter
   
   **Resultado Esperado:** ❌ Erro 403, redirecionamento, ou página vazia
   
   **Resultado Obtido:** _______________________________
   
   ⚠️ **Se conseguiu acessar = VULNERABILIDADE CRÍTICA!**

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver PDIs próprios | ✅ | ___ | ⬜ |
| NÃO ver PDIs de outros | ✅ | ___ | ⬜ |
| Acessar URL direta de PDI alheio | ❌ | ___ | ⬜ |
```

---

### TESTE 1.2: Acesso a Saúde Mental (Check-ins)

**No navegador do EMPLOYEE:**

1. **Navegar:** Clique em `Saúde Mental` → `Check-ins` ou `Meu Bem-Estar`

2. **Verificar:**
   - [ ] Aparecem check-ins? (Esperado: ✅ Sim, apenas próprios)
   - [ ] Quantos check-ins? Anotar: _______
   - [ ] São apenas do usuário logado? (Esperado: ✅ Sim)

3. **Testar ação:**
   - [ ] Consegue criar novo check-in? (Esperado: ✅ Sim)
   - [ ] Consegue ver histórico próprio? (Esperado: ✅ Sim)

4. **TESTE CRÍTICO - Menu lateral ou tabs:**
   - [ ] Existe opção para ver check-ins de outros? (Esperado: ❌ Não)
   - [ ] Existe filtro por usuário? (Esperado: ❌ Não)

5. **TESTE CRÍTICO - Tentar acessar check-in de outro:**
   
   **No navegador do HR:**
   - Acesse `Saúde Mental` → Ver um check-in de qualquer colaborador
   - Copie a URL (algo como: `/checkins/[UUID]` ou `/health/checkin/[UUID]`)
   
   **Volte ao navegador do EMPLOYEE:**
   - Cole a URL copiada na barra de endereço
   - Pressione Enter
   
   **Resultado Esperado:** ❌ Erro 403, redirecionamento, ou página vazia
   
   **Resultado Obtido:** _______________________________
   
   ⚠️ **Se conseguiu acessar = VULNERABILIDADE CRÍTICA!**

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver check-ins próprios | ✅ | ___ | ⬜ |
| NÃO ver check-ins de outros | ✅ | ___ | ⬜ |
| Acessar URL direta de check-in alheio | ❌ | ___ | ⬜ |
```

---

### TESTE 1.3: Acesso a Gestão de Pessoas

**No navegador do EMPLOYEE:**

1. **Navegar:** Tente acessar `Gestão` → `Pessoas` ou `Equipe`

2. **Verificar:**
   - [ ] Menu existe? (Pode não existir para employee)
   - [ ] Se existe, ao clicar:
     - [ ] Aparece lista vazia? (Esperado: ✅ Sim)
     - [ ] Redireciona para outra página? (Esperado: ✅ Sim)
     - [ ] Mostra mensagem de permissão negada? (Esperado: ✅ Sim)

3. **TESTE CRÍTICO - Tentar acessar URL direta:**
   
   **Cole na barra de endereço:**
   - `http://localhost:5173/people`
   - `http://localhost:5173/team`
   - `http://localhost:5173/management`
   
   **Resultado Esperado:** ❌ Erro, redirecionamento, ou página vazia
   
   **Resultado Obtido:** _______________________________
   
   ⚠️ **Se viu lista de pessoas = VULNERABILIDADE ALTA!**

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| NÃO acessar gestão de pessoas | ✅ | ___ | ⬜ |
| URL direta bloqueada | ✅ | ___ | ⬜ |
```

---

### TESTE 1.4: Acesso a Favoritos (Resource Favorites)

**No navegador do EMPLOYEE:**

1. **Navegar:** `Recursos` → `Meus Favoritos` ou ícone de favorito

2. **Verificar:**
   - [ ] Aparecem favoritos? Quantos? _______
   - [ ] São apenas do usuário logado? (Esperado: ✅ Sim)

3. **Testar ação:**
   - [ ] Favoritar um recurso
   - [ ] Desfavoritar um recurso
   - [ ] Filtros/ordenação funcionam? (Esperado: ✅ Sim)

4. **TESTE CRÍTICO - API Inspection:**
   
   **Abra DevTools (F12):**
   - Vá na aba `Network`
   - Recarregue a página de favoritos
   - Encontre a requisição de API (ex: `/api/favorites` ou similar)
   - Clique na requisição e veja a `Response`
   
   **Verificar:**
   - [ ] Resposta contém apenas favoritos do usuário logado?
   - [ ] Tem campo `profile_id` ou `user_id`? Valor: _______
   - [ ] Esse ID corresponde ao usuário logado? (Esperado: ✅ Sim)
   
   ⚠️ **Se a API retornar favoritos de outros = VAZAMENTO DE DADOS!**

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver favoritos próprios | ✅ | ___ | ⬜ |
| NÃO ver favoritos de outros | ✅ | ___ | ⬜ |
| API retorna apenas dados próprios | ✅ | ___ | ⬜ |
```

---

### ✅ CHECKLIST TESTE 1 - EMPLOYEE

- [ ] PDIs: Apenas próprios visíveis
- [ ] PDIs: Não consegue acessar PDI de outro via URL
- [ ] Check-ins: Apenas próprios visíveis
- [ ] Check-ins: Não consegue acessar check-in de outro via URL
- [ ] Gestão de Pessoas: Bloqueado ou vazio
- [ ] Favoritos: Apenas próprios visíveis
- [ ] APIs: Retornam apenas dados do usuário logado

**Status Geral EMPLOYEE:** ⬜ ✅ APROVADO | ⬜ ❌ VULNERABILIDADES ENCONTRADAS

---

## 🔍 TESTE 2: MANAGER (Gestor)

### Contexto

O manager deve ter acesso a:
- ✅ Dados dos **subordinados diretos** (sua equipe)
- ✅ PDIs dos subordinados para validação
- ✅ Competências dos subordinados para avaliação

O manager **NÃO** deve ter acesso a:
- ❌ Check-ins emocionais de subordinados (PRIVACIDADE)
- ❌ Registros psicológicos de qualquer pessoa
- ❌ Dados de outras equipes
- ❌ Dados de colaboradores de outros gestores

---

### TESTE 2.1: Visualizar Subordinados Diretos

**No navegador do MANAGER:**

1. **Navegar:** `Gestão` → `Pessoas` ou `Minha Equipe`

2. **Verificar:**
   - [ ] Aparecem colaboradores? Quantos? _______
   - [ ] Liste os nomes: _______________________________

3. **VALIDAR HIERARQUIA:**
   
   **Execute no SQL Editor do Supabase:**
   ```sql
   SELECT 
     manager.email as gestor,
     subordinado.email as subordinado
   FROM profiles manager
   LEFT JOIN profiles subordinado ON subordinado.manager_id = manager.id
   WHERE manager.email = 'email_do_gestor_testado@...'
   ORDER BY subordinado.email;
   ```
   
   **Resultado SQL:** _______________________________
   
   **Comparar:**
   - [ ] Interface mostra os MESMOS subordinados do SQL?
   - [ ] Interface mostra subordinados EXTRAS? ⚠️ PROBLEMA!
   - [ ] Interface mostra MENOS subordinados? ⚠️ PROBLEMA!

4. **TESTE CRÍTICO - Tentar ver outra equipe:**
   
   **No navegador do outro MANAGER (se tiver):**
   - Acesse `Gestão` → `Pessoas`
   - Copie a URL
   
   **Volte ao navegador do primeiro MANAGER:**
   - Cole a URL
   - Pressione Enter
   
   **Verificar:**
   - [ ] Ainda vê apenas sua própria equipe? (Esperado: ✅ Sim)
   - [ ] Vê outra equipe? ⚠️ VULNERABILIDADE!

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver subordinados diretos | ✅ | X pessoas | ⬜ |
| NÃO ver outras equipes | ✅ | ___ | ⬜ |
| Quantidade corresponde ao SQL | ✅ | ___ | ⬜ |
```

---

### TESTE 2.2: Acesso a PDIs dos Subordinados

**No navegador do MANAGER:**

1. **Navegar:** `Desenvolvimento` → `PDIs da Equipe` ou `Gestão` → `PDIs`

2. **Verificar:**
   - [ ] Aparecem PDIs? Quantos? _______
   - [ ] De quem são? (Esperado: Apenas subordinados)
   - [ ] Liste os donos: _______________________________

3. **Testar ação:**
   - [ ] Consegue visualizar PDI de subordinado? (Esperado: ✅ Sim)
   - [ ] Consegue validar PDI de subordinado? (Esperado: ✅ Sim)
   - [ ] Consegue editar PDI de subordinado? (Esperado: Depende da regra)

4. **TESTE CRÍTICO - Tentar acessar PDI de não-subordinado:**
   
   **Preparação: Encontre um PDI que NÃO seja de um subordinado**
   
   **Execute no SQL:**
   ```sql
   SELECT pdi.id as pdi_uuid, p.email
   FROM pdis pdi
   JOIN profiles p ON p.id = pdi.profile_id
   WHERE p.manager_id != (
     SELECT id FROM profiles WHERE email = 'email_do_gestor@...'
   )
   AND p.manager_id IS NOT NULL
   LIMIT 1;
   ```
   
   **Copie o UUID:** _______________________________
   
   **No navegador do MANAGER:**
   - Cole na barra: `http://localhost:5173/pdis/[UUID_COPIADO]`
   - Pressione Enter
   
   **Resultado Esperado:** ❌ Erro 403 ou redirecionamento
   
   **Resultado Obtido:** _______________________________
   
   ⚠️ **Se conseguiu acessar = VULNERABILIDADE CRÍTICA!**

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver PDIs de subordinados | ✅ | ___ | ⬜ |
| NÃO ver PDIs de outras equipes | ✅ | ___ | ⬜ |
| Acessar URL de PDI não-subordinado | ❌ | ___ | ⬜ |
| Validar PDI de subordinado | ✅ | ___ | ⬜ |
```

---

### TESTE 2.3: Acesso a Saúde Mental de Subordinados (⚠️ TESTE MAIS CRÍTICO)

**Este é o teste MAIS IMPORTANTE para privacidade!**

**No navegador do MANAGER:**

1. **Navegar:** Tente acessar:
   - `Saúde Mental` → `Dashboard`
   - `Saúde Mental` → `Check-ins`
   - `Saúde Mental` → `Minha Equipe` (se existir)

2. **VERIFICAR COM EXTREMA ATENÇÃO:**
   - [ ] Aparece algum check-in de subordinado? (Esperado: ❌ NÃO!)
   - [ ] Aparece estatística agregada da equipe? (Esperado: ❌ NÃO!)
   - [ ] Aparece alerta de estresse de subordinado? (Esperado: ❌ NÃO!)

3. **TESTE CRÍTICO - Tentar acessar check-in de subordinado:**
   
   **Preparação: Encontre um check-in de um subordinado**
   
   **Execute no SQL:**
   ```sql
   SELECT ec.id as checkin_uuid, p.email
   FROM emotional_checkins ec
   JOIN profiles p ON p.id = ec.employee_id
   WHERE p.manager_id = (
     SELECT id FROM profiles WHERE email = 'email_do_gestor@...'
   )
   LIMIT 1;
   ```
   
   **Se retornou UUID, COPIE:** _______________________________
   
   **No navegador do MANAGER:**
   - Cole na barra: `http://localhost:5173/health/checkin/[UUID]` (ajuste a rota)
   - Pressione Enter
   
   **Resultado Esperado:** ❌ Erro 403, tela vazia, ou redirecionamento
   
   **Resultado Obtido:** _______________________________
   
   ⚠️ **Se conseguiu ver dados do check-in = VIOLAÇÃO GRAVE DE PRIVACIDADE!**

4. **TESTE CRÍTICO - API Inspection:**
   
   **Abra DevTools (F12):**
   - Vá na aba `Network`
   - Tente acessar qualquer página de Saúde Mental
   - Filtre por XHR/Fetch
   - Procure por endpoints tipo:
     - `/api/checkins`
     - `/api/emotional_checkins`
     - `/api/health`
     - `/api/psychological`
   
   **Verificar na resposta:**
   - [ ] API retorna check-ins de subordinados? (Esperado: ❌ NÃO!)
   - [ ] API retorna apenas do próprio gestor? (Esperado: ✅ Sim)
   - [ ] API retorna erro 403? (Esperado: ✅ Ideal)
   
   ⚠️ **Se API retornar dados de subordinados = VIOLAÇÃO CRÍTICA!**

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| NÃO ver check-ins de subordinados | ✅ | ___ | ⬜ |
| NÃO acessar via URL direta | ✅ | ___ | ⬜ |
| API NÃO retorna dados de subordinados | ✅ | ___ | ⬜ |
| Privacidade mantida | ✅ CRÍTICO | ___ | ⬜ |
```

**⚠️ ATENÇÃO ESPECIAL:**  
Se qualquer um destes testes falhar, marque como **VULNERABILIDADE CRÍTICA** no relatório!

---

### TESTE 2.4: Acesso a Competências dos Subordinados

**No navegador do MANAGER:**

1. **Navegar:** 
   - Acesse `Gestão` → `Competências`
   - OU clique em um subordinado e veja suas competências

2. **Verificar:**
   - [ ] Vê competências dos subordinados? (Esperado: ✅ Sim)
   - [ ] Consegue avaliar competências? (Esperado: ✅ Sim)
   - [ ] Apenas subordinados diretos? (Esperado: ✅ Sim)

3. **TESTE CRÍTICO - Tentar acessar competências de não-subordinado:**
   
   **Execute no SQL:**
   ```sql
   SELECT c.id as competencia_uuid, p.email
   FROM competencies c
   JOIN profiles p ON p.id = c.profile_id
   WHERE p.manager_id != (
     SELECT id FROM profiles WHERE email = 'email_do_gestor@...'
   )
   LIMIT 1;
   ```
   
   **Copie o UUID:** _______________________________
   
   **No navegador do MANAGER:**
   - Cole na barra: `http://localhost:5173/competencies/[UUID]` (ajuste a rota)
   - Pressione Enter
   
   **Resultado Esperado:** ❌ Erro 403 ou redirecionamento
   
   **Resultado Obtido:** _______________________________

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver competências de subordinados | ✅ | ___ | ⬜ |
| Avaliar competências | ✅ | ___ | ⬜ |
| NÃO ver outras equipes | ✅ | ___ | ⬜ |
```

---

### ✅ CHECKLIST TESTE 2 - MANAGER

- [ ] Subordinados: Vê apenas sua equipe direta
- [ ] PDIs: Acessa e valida apenas PDIs dos subordinados
- [ ] PDIs: Não consegue acessar PDI de não-subordinado via URL
- [ ] **Check-ins: NÃO vê dados emocionais de subordinados** ⚠️ CRÍTICO
- [ ] **API: NÃO retorna check-ins de subordinados** ⚠️ CRÍTICO
- [ ] Competências: Avalia apenas subordinados
- [ ] Isolamento entre equipes: Mantido

**Status Geral MANAGER:** ⬜ ✅ APROVADO | ⬜ ❌ VULNERABILIDADES ENCONTRADAS

---

## 🔍 TESTE 3: HR (Recursos Humanos)

### Contexto

O HR deve ter acesso **amplo** a:
- ✅ Todos os colaboradores
- ✅ Todos os PDIs (visão global)
- ✅ Todos os check-ins emocionais
- ✅ Registros psicológicos
- ✅ Solicitações de terapia
- ✅ Relatórios e estatísticas

O HR **NÃO** deve poder (a menos que seja admin também):
- ❌ Modificar configurações do sistema
- ❌ Acessar audit logs (só admin)

---

### TESTE 3.1: Acesso a Todos os Colaboradores

**No navegador do HR:**

1. **Navegar:** `Gestão` → `Pessoas` ou `Colaboradores`

2. **Verificar:**
   - [ ] Aparece lista completa? Quantos colaboradores? _______
   
3. **VALIDAR TOTALIDADE:**
   
   **Execute no SQL:**
   ```sql
   SELECT COUNT(*) as total_colaboradores
   FROM profiles
   WHERE role IN ('employee', 'manager');
   ```
   
   **Resultado SQL:** _______ colaboradores
   
   **Comparar:**
   - [ ] Interface mostra o MESMO total? (Esperado: ✅ Sim)
   - [ ] Se divergir, quantos faltam? _______

4. **Testar filtros:**
   - [ ] Filtrar por departamento funciona?
   - [ ] Buscar por nome funciona?
   - [ ] Filtrar por role funciona?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver todos os colaboradores | ✅ | X pessoas | ⬜ |
| Total corresponde ao SQL | ✅ | ___ | ⬜ |
| Filtros funcionam | ✅ | ___ | ⬜ |
```

---

### TESTE 3.2: Acesso a Todos os PDIs

**No navegador do HR:**

1. **Navegar:** `Desenvolvimento` → `PDIs` ou `Dashboard` → `PDIs`

2. **Verificar:**
   - [ ] Aparece lista de PDIs? Quantos? _______
   - [ ] De múltiplos colaboradores? (Esperado: ✅ Sim)
   
3. **VALIDAR TOTALIDADE:**
   
   **Execute no SQL:**
   ```sql
   SELECT COUNT(*) as total_pdis FROM pdis;
   ```
   
   **Resultado SQL:** _______ PDIs
   
   **Comparar:**
   - [ ] Interface mostra total similar? (Esperado: ✅ Sim)

4. **Testar ação:**
   - [ ] Consegue visualizar PDI de qualquer colaborador? (Esperado: ✅ Sim)
   - [ ] Consegue filtrar por status?
   - [ ] Consegue exportar dados?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver todos os PDIs | ✅ | X PDIs | ⬜ |
| Acessar qualquer PDI | ✅ | ___ | ⬜ |
| Estatísticas globais | ✅ | ___ | ⬜ |
```

---

### TESTE 3.3: Acesso a Dashboard de Saúde Mental (⚠️ DADOS SENSÍVEIS)

**No navegador do HR:**

1. **Navegar:** `Saúde Mental` → `Dashboard` ou `Check-ins`

2. **Verificar:**
   - [ ] Aparece dashboard completo? (Esperado: ✅ Sim)
   - [ ] Estatísticas agregadas? (Esperado: ✅ Sim)
   - [ ] Lista de check-ins recentes? (Esperado: ✅ Sim)

3. **TESTE - Ver check-ins de múltiplos colaboradores:**
   
   **Na interface:**
   - Acesse a lista de check-ins emocionais
   - Verifique se há check-ins de **diferentes** colaboradores
   
   **Deve mostrar:**
   - [ ] Check-ins de vários colaboradores? (Esperado: ✅ Sim)
   - [ ] Nome/email do colaborador visível? (Esperado: ✅ Sim)
   - [ ] Níveis de estresse/humor visíveis? (Esperado: ✅ Sim)

4. **TESTE - Alertas de estresse:**
   
   **Verificar se existe:**
   - [ ] Seção de "Colaboradores em Risco" ou "Alertas"?
   - [ ] Mostra colaboradores com estresse alto? (Esperado: ✅ Sim)
   
   **Execute no SQL para validar:**
   ```sql
   SELECT p.email, AVG(ec.stress_level) as avg_stress
   FROM emotional_checkins ec
   JOIN profiles p ON p.id = ec.employee_id
   GROUP BY p.id, p.email
   HAVING AVG(ec.stress_level) >= 7
   ORDER BY avg_stress DESC;
   ```
   
   **Resultado SQL:** _______________________________
   
   **Comparar:**
   - [ ] Interface mostra os MESMOS colaboradores em risco?

5. **TESTE - Registros Psicológicos:**
   
   **Navegar:**
   - `Saúde Mental` → `Registros Psicológicos` ou similar
   - `Saúde Mental` → `Sessões de Terapia`
   
   **Verificar:**
   - [ ] Consegue acessar? (Esperado: ✅ Sim)
   - [ ] Vê registros de múltiplos colaboradores? (Esperado: ✅ Sim)
   - [ ] Dados detalhados visíveis? (Esperado: ✅ Sim)

6. **TESTE - Solicitações de Terapia:**
   
   **Navegar:**
   - `Saúde Mental` → `Solicitações` ou `Sessões Pendentes`
   
   **Verificar:**
   - [ ] Lista de solicitações aparece? (Esperado: ✅ Sim)
   - [ ] Consegue aprovar/agendar? (Esperado: ✅ Sim)

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Dashboard de saúde mental | ✅ | ___ | ⬜ |
| Ver todos os check-ins | ✅ | ___ | ⬜ |
| Alertas de estresse | ✅ | ___ | ⬜ |
| Registros psicológicos | ✅ | ___ | ⬜ |
| Solicitações de terapia | ✅ | ___ | ⬜ |
```

---

### TESTE 3.4: Acesso a Relatórios

**No navegador do HR:**

1. **Navegar:** `Relatórios` ou `Dashboard` → `Métricas`

2. **Verificar:**
   - [ ] Dashboards de engajamento disponíveis?
   - [ ] Estatísticas de PDIs?
   - [ ] Métricas de desenvolvimento?
   - [ ] Relatórios de competências?
   - [ ] Relatórios de saúde mental?

3. **Testar ação:**
   - [ ] Consegue filtrar por período?
   - [ ] Consegue filtrar por departamento?
   - [ ] Consegue exportar relatórios?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Relatórios completos | ✅ | ___ | ⬜ |
| Exportação de dados | ✅ | ___ | ⬜ |
| Filtros funcionam | ✅ | ___ | ⬜ |
```

---

### ✅ CHECKLIST TESTE 3 - HR

- [ ] Colaboradores: Vê todos do sistema
- [ ] PDIs: Acessa todos os PDIs
- [ ] Check-ins: Vê check-ins de todos os colaboradores
- [ ] Alertas: Identifica colaboradores em risco
- [ ] Registros psicológicos: Acesso total
- [ ] Solicitações de terapia: Gerencia todas
- [ ] Relatórios: Acesso completo

**Status Geral HR:** ⬜ ✅ APROVADO | ⬜ ❌ VULNERABILIDADES ENCONTRADAS

---

## 🔍 TESTE 4: ADMIN (Administrador)

### Contexto

O admin deve ter acesso **irrestrito** a:
- ✅ Todas as funcionalidades do HR
- ✅ Configurações do sistema
- ✅ Audit logs
- ✅ Gerenciamento de usuários
- ✅ Permissões e roles

---

### TESTE 4.1: Acesso Completo ao Sistema

**No navegador do ADMIN:**

1. **Navegar por todas as seções:**
   - [ ] `Dashboard` → Visão geral completa?
   - [ ] `Gestão` → Todos os recursos?
   - [ ] `Desenvolvimento` → Todos os PDIs?
   - [ ] `Saúde Mental` → Dados sensíveis?
   - [ ] `Relatórios` → Todos os relatórios?

2. **Verificar menus exclusivos:**
   - [ ] Existe menu `Admin` ou `Configurações`?
   - [ ] Existe menu `Usuários` ou `Gerenciar Usuários`?
   - [ ] Existe menu `Audit Logs` ou `Logs de Sistema`?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Acesso a todas as funcionalidades | ✅ | ___ | ⬜ |
| Menus exclusivos de admin | ✅ | ___ | ⬜ |
```

---

### TESTE 4.2: Gerenciamento de Usuários

**No navegador do ADMIN:**

1. **Navegar:** `Admin` → `Usuários` ou similar

2. **Verificar:**
   - [ ] Lista de todos os usuários?
   - [ ] Consegue editar usuário?
   - [ ] Consegue criar novo usuário?
   - [ ] Consegue desativar usuário?
   - [ ] Consegue mudar role de usuário?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver todos os usuários | ✅ | ___ | ⬜ |
| Gerenciar roles | ✅ | ___ | ⬜ |
| Criar/editar usuários | ✅ | ___ | ⬜ |
```

---

### TESTE 4.3: Audit Logs

**No navegador do ADMIN:**

1. **Navegar:** `Admin` → `Audit Logs` ou `Logs de Sistema`

2. **Verificar:**
   - [ ] Lista de logs aparece?
   - [ ] Logs de diferentes usuários?
   - [ ] Filtrar por usuário funciona?
   - [ ] Filtrar por data funciona?
   - [ ] Ver detalhes de um log?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Ver audit logs | ✅ | ___ | ⬜ |
| Filtros funcionam | ✅ | ___ | ⬜ |
| Detalhes completos | ✅ | ___ | ⬜ |
```

---

### TESTE 4.4: Configurações do Sistema

**No navegador do ADMIN:**

1. **Navegar:** `Admin` → `Configurações` ou `Settings`

2. **Verificar:**
   - [ ] Configurações gerais do sistema?
   - [ ] Configurações de segurança?
   - [ ] Configurações de notificações?
   - [ ] Outras configurações?

**Documentar no relatório:**
```markdown
| Aspecto | Esperado | Obtido | Status |
|---------|----------|--------|--------|
| Configurações do sistema | ✅ | ___ | ⬜ |
| Modificar configurações | ✅ | ___ | ⬜ |
```

---

### ✅ CHECKLIST TESTE 4 - ADMIN

- [ ] Acesso: Todas as funcionalidades disponíveis
- [ ] Usuários: Gerencia todos os usuários
- [ ] Roles: Modifica roles de usuários
- [ ] Audit Logs: Visualiza logs completos
- [ ] Configurações: Acessa e modifica configs do sistema

**Status Geral ADMIN:** ⬜ ✅ APROVADO | ⬜ ❌ VULNERABILIDADES ENCONTRADAS

---

## 🎯 TESTES CRUZADOS CRÍTICOS

### TESTE CRUZADO 1: Vazamento via URL Direta

**Objetivo:** Verificar se é possível acessar recursos de outros usuários manipulando URLs.

**Para CADA role (Employee, Manager, HR):**

1. **No navegador do HR (que tem acesso a tudo):**
   - Abra um check-in de um colaborador
   - Copie a URL: `http://localhost:5173/health/checkin/[UUID]`

2. **Cole essa URL nos navegadores de:**
   - **Employee:** Resultado esperado: ❌ Bloqueado
   - **Manager:** Resultado esperado: ❌ Bloqueado (a menos que seja subordinado)

3. **Repita para:**
   - URLs de PDIs
   - URLs de competências
   - URLs de favoritos
   - URLs de registros psicológicos

**Documentar todos os testes:**

| URL Testada | Role Testando | Esperado | Obtido | Status |
|-------------|---------------|----------|--------|--------|
| /checkin/... | employee | ❌ | ___ | ⬜ |
| /checkin/... | manager | ❌ | ___ | ⬜ |
| /pdis/... | employee (outro) | ❌ | ___ | ⬜ |
| /pdis/... | manager (outro) | ❌ | ___ | ⬜ |

---

### TESTE CRUZADO 2: Vazamento via API

**Objetivo:** Verificar se as APIs retornam mais dados do que deveriam.

**Para CADA role:**

1. **Abra DevTools (F12) → Network**

2. **Faça requisições:**
   - Listar PDIs
   - Listar check-ins
   - Listar favoritos
   - Listar competências

3. **Para cada resposta, verificar:**
   - [ ] Contém apenas dados do usuário logado (employee)?
   - [ ] Contém apenas dados dos subordinados (manager)?
   - [ ] Contém todos os dados (HR/admin)?

4. **Procure por:**
   - Campos com IDs de outros usuários
   - Arrays com múltiplos registros quando deveria ser único
   - Campos sensíveis que não deveriam estar na resposta

**Documentar vazamentos:**

| API | Role | Dados Esperados | Dados Obtidos | Status |
|-----|------|-----------------|---------------|--------|
| GET /api/checkins | employee | Apenas próprios | ___ | ⬜ |
| GET /api/pdis | manager | Subordinados | ___ | ⬜ |
| GET /api/favorites | employee | Apenas próprios | ___ | ⬜ |

---

### TESTE CRUZADO 3: Escalação de Privilégios

**Objetivo:** Verificar se é possível um usuário modificar seu próprio role.

**No navegador do EMPLOYEE:**

1. **Abra DevTools → Console**

2. **Tente modificar role via API:**
   
   ```javascript
   // Copie e cole no console
   fetch('/api/profiles/me', {
     method: 'PATCH',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({role: 'admin'})
   }).then(r => r.json()).then(console.log)
   ```

3. **Resultado esperado:** ❌ Erro 403 ou não altera o role

4. **Verificar:**
   - [ ] Requisição foi bloqueada?
   - [ ] Role continuou como 'employee'?
   - [ ] Recebeu erro de permissão?

**Documentar:**

```markdown
| Ação | Esperado | Obtido | Status |
|------|----------|--------|--------|
| Employee tentar virar admin | ❌ Bloqueado | ___ | ⬜ |
| Manager tentar virar admin | ❌ Bloqueado | ___ | ⬜ |
```

---

## ✅ FINALIZAÇÃO

### Checklist Final

**Antes de finalizar, certifique-se:**

- [ ] Todos os 4 roles foram testados
- [ ] Todos os testes críticos foram executados
- [ ] Screenshots de vulnerabilidades foram capturados
- [ ] Documentação preenchida em `USER_ISOLATION_TEST_RESULTS.md`
- [ ] Vulnerabilidades priorizadas por severidade
- [ ] Recomendações documentadas

---

### Próximos Passos

1. **Se NENHUMA vulnerabilidade foi encontrada:**
   - ✅ Marcar sistema como APROVADO
   - Arquivar documentação
   - Seguir para testes de performance

2. **Se vulnerabilidades NÃO-CRÍTICAS foram encontradas:**
   - ⚠️ Documentar todas em issues
   - Priorizar correções
   - Agendar revalidação após correções

3. **Se vulnerabilidades CRÍTICAS foram encontradas:**
   - 🚨 PARAR deploy/produção imediatamente
   - Escalar para time de desenvolvimento
   - Corrigir com MÁXIMA PRIORIDADE
   - Revalidar completamente após correção

---

## 📞 SUPORTE

**Em caso de dúvidas:**

- Consulte `USER_ISOLATION_TEST_RESULTS.md` para template de documentação
- Execute `VALIDATE_USER_ISOLATION_QUERY.sql` para validações SQL
- Consulte `TEST_USERS_SETUP_GUIDE.md` se precisar criar usuários

---

**BOA SORTE COM OS TESTES! 🔒**

_Lembre-se: Segurança é prioridade #1. Documente TUDO!_
