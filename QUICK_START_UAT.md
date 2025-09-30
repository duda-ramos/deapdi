# 🚀 Quick Start - UAT TalentFlow

Guia rápido para iniciar os testes de aceitação do usuário.

---

## ⏱️ Tempo estimado: 15 minutos

---

## 1️⃣ Configurar Credenciais (5 min)

### Passo 1: Obter credenciais do Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em `Settings` → `API`
4. Copie:
   - **Project URL**
   - **anon/public key**

### Passo 2: Atualizar .env
Abra o arquivo `.env` e substitua:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Passo 3: Reiniciar servidor
```bash
# Parar o servidor (Ctrl+C)
npm run dev
```

---

## 2️⃣ Criar Usuários de Teste (5 min)

### Via Supabase Dashboard

1. Acesse: `Authentication` → `Users` → `Add User`

2. Crie 4 usuários com esses emails e senhas:

| Email | Senha | Role |
|-------|-------|------|
| admin@empresa.com | admin123 | Admin |
| rh@empresa.com | rh123456 | HR |
| gestor@empresa.com | gestor123 | Manager |
| colaborador@empresa.com | colab123 | Employee |

3. Para cada usuário:
   - Clique em `Add User`
   - Preencha Email e Password
   - ✅ Marque "Auto Confirm User"
   - Clique em `Create User`

### Popular Perfis Completos

1. Vá em: `SQL Editor` no Supabase Dashboard
2. Copie e cole o conteúdo de: `scripts/populate_test_users.sql`
3. Clique em `Run`
4. Verifique o resultado na tabela `profiles`

---

## 3️⃣ Verificar Instalação (2 min)

### Teste rápido:

1. Abra: http://localhost:5173
2. Tente fazer login com: `colaborador@empresa.com` / `colab123`
3. Deve entrar no dashboard ✅

### Se der erro:
- ❌ "Invalid credentials" → Verifique se o usuário foi criado
- ❌ "Carregando indefinidamente" → Verifique o `.env`
- ❌ "Supabase not configured" → Reinicie o servidor

---

## 4️⃣ Executar Cenários UAT (3 min por cenário)

### Cenário 1: PDI Completo
1. Login como: `colaborador@empresa.com`
2. Vá em: `PDI` → `Novo PDI`
3. Preencha: Título, Descrição, Data
4. Clique: `Salvar` → `Iniciar` → `Concluir`
5. Logout e login como: `gestor@empresa.com`
6. Vá em: `PDI` → Encontre o PDI → `Validar`
7. ✅ Verificar se pontos foram atribuídos

### Cenário 2: Competências
1. Login como: `colaborador@empresa.com`
2. Vá em: `Competências` → `Autoavaliação`
3. Avalie 5 competências
4. Clique: `Salvar`
5. Logout e login como: `gestor@empresa.com`
6. Vá em: `Gestão de Pessoas` → Selecione colaborador → `Avaliar`
7. ✅ Verificar gráfico de comparação

### Cenário 3: Grupo de Ação
1. Login como: `gestor@empresa.com`
2. Vá em: `Grupos de Ação` → `Novo Grupo`
3. Preencha e adicione o colaborador
4. Crie 2-3 tarefas
5. Logout e login como: `colaborador@empresa.com`
6. Vá em: `Grupos de Ação` → Veja suas tarefas
7. ✅ Complete uma tarefa

### Cenário 4: Saúde Mental (Privacidade)
1. Login como: `colaborador@empresa.com`
2. Vá em: `Saúde Mental` → Aceitar termos
3. Faça um check-in emocional
4. Logout e login como: `gestor@empresa.com`
5. Vá em: `Gestão de Pessoas`
6. ✅ NÃO deve ver dados de saúde mental

### Cenário 5: Mentoria
1. Login como: `colaborador@empresa.com`
2. Vá em: `Mentoria` → `Solicitar Mentoria`
3. Preencha o formulário
4. Logout e login como: `gestor@empresa.com` (como mentor)
5. Vá em: `Mentoria` → `Solicitações Pendentes`
6. ✅ Aceite a solicitação

---

## 5️⃣ Reportar Problemas

### Se encontrar bugs:

1. Login como admin: `admin@empresa.com` / `admin123`
2. Vá em: `Administração` → Aba `UAT Prep Kit`
3. Clique: `Reportar Bug`
4. Preencha:
   - Título descritivo
   - Severidade (Crítico/Alto/Médio/Baixo)
   - Descrição detalhada
   - Passos para reproduzir
   - Resultado esperado vs atual

---

## ✅ Checklist Final

Antes de aprovar o sistema, verifique:

- [ ] Todos os 5 cenários executados
- [ ] Login funciona para todos os papéis
- [ ] Dados aparecem corretamente
- [ ] Permissões funcionam (ex: gestor vê equipe, não vê outros)
- [ ] Notificações aparecem
- [ ] Interface é responsiva (teste no celular)
- [ ] Performance é aceitável (< 3s para carregar)
- [ ] Nenhum erro crítico encontrado

---

## 🆘 Problemas Comuns

### "Invalid email or password"
→ Usuário não foi criado. Volte ao passo 2.

### "Cannot read property of undefined"
→ Perfil não foi populado. Execute o script SQL do passo 2.

### Botão de login fica "Carregando..."
→ Credenciais do Supabase erradas. Volte ao passo 1.

### "RLS policy violation"
→ Política de segurança funcionando. Isso é esperado se tentar acessar dados de outros usuários.

### Página em branco
→ Erro no console. Pressione F12 e veja o erro.

---

## 📊 Exportar Relatório

Ao final dos testes:

1. Login como: `admin@empresa.com`
2. Vá em: `Administração` → `UAT Prep Kit`
3. Clique: `Exportar Relatório`
4. Arquivo MD será baixado com:
   - Cenários executados
   - Bugs reportados
   - Resumo geral

---

## 📞 Ajuda

- **Documentação Completa**: `UAT_DOCUMENTATION.md`
- **Relatório Técnico**: `PHASE_3_TEST_REPORT.md`
- **Sumário Executivo**: `PHASE_3_SUMMARY.md`
- **Problemas de Setup**: `SETUP_INSTRUCTIONS.md`

---

## 🎉 Próximos Passos

Após UAT aprovado:
1. Consolidar feedback
2. Corrigir bugs críticos
3. Preparar deploy de produção
4. Treinar usuários finais
5. Go Live! 🚀

---

**Boa sorte com o UAT!** 🎯