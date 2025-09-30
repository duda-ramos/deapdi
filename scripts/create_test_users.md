# Criação de Usuários de Teste para UAT

## Importante
Os usuários precisam ser criados através do painel de autenticação do Supabase ou através da interface de cadastro da aplicação. Este documento fornece as informações dos usuários de teste.

## Usuários de Teste

### 1. Administrador
- **Email:** admin@talentflow.com
- **Senha:** Admin@2025
- **Nome:** Admin Sistema
- **Cargo:** Administrador de Sistema
- **Nível:** Especialista
- **Descrição:** Usuário com permissões completas para gerenciar o sistema

### 2. RH Manager
- **Email:** rh@talentflow.com
- **Senha:** RH@2025
- **Nome:** Maria Silva
- **Cargo:** Gerente de RH
- **Nível:** Sênior
- **Descrição:** Gerente de RH com acesso a relatórios e gestão de pessoas

### 3. Tech Lead
- **Email:** techlead@talentflow.com
- **Senha:** Tech@2025
- **Nome:** João Santos
- **Cargo:** Tech Lead
- **Nível:** Sênior
- **Descrição:** Líder técnico responsável por mentoria e avaliações técnicas

### 4. Desenvolvedor Pleno
- **Email:** dev.pleno@talentflow.com
- **Senha:** Dev@2025
- **Nome:** Ana Costa
- **Cargo:** Desenvolvedora Full Stack
- **Nível:** Pleno
- **Descrição:** Desenvolvedora com experiência intermediária

### 5. Desenvolvedor Júnior
- **Email:** dev.junior@talentflow.com
- **Senha:** Dev@2025
- **Nome:** Pedro Oliveira
- **Cargo:** Desenvolvedor Frontend
- **Nível:** Júnior
- **Descrição:** Desenvolvedor em início de carreira

### 6. Designer
- **Email:** designer@talentflow.com
- **Senha:** Design@2025
- **Nome:** Carla Mendes
- **Cargo:** UX/UI Designer
- **Nível:** Pleno
- **Descrição:** Designer de interfaces

### 7. QA Analyst
- **Email:** qa@talentflow.com
- **Senha:** QA@2025
- **Nome:** Lucas Almeida
- **Cargo:** QA Analyst
- **Nível:** Pleno
- **Descrição:** Analista de qualidade

### 8. Estagiário
- **Email:** estagiario@talentflow.com
- **Senha:** Estagio@2025
- **Nome:** Julia Fernandes
- **Cargo:** Estagiária de Desenvolvimento
- **Nível:** Estagiário
- **Descrição:** Estagiária em programa de desenvolvimento

## Como Criar os Usuários

### Opção 1: Via Interface da Aplicação
1. Acesse a página de cadastro em `/login`
2. Clique em "Criar Conta"
3. Preencha os dados conforme especificado acima
4. Complete o processo de onboarding

### Opção 2: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em Authentication > Users
3. Clique em "Add user"
4. Crie o usuário com email e senha
5. O perfil será criado automaticamente via trigger

### Opção 3: Via SQL (Usuários Auth já existentes)

Se os usuários já foram criados na autenticação mas não têm perfis:

```sql
-- Ajuste os IDs conforme os UUIDs reais dos usuários criados
INSERT INTO profiles (id, email, name, role, position, level, status)
VALUES
  ('uuid-admin', 'admin@talentflow.com', 'Admin Sistema', 'admin', 'Administrador de Sistema', 'Especialista', 'active'),
  ('uuid-rh', 'rh@talentflow.com', 'Maria Silva', 'hr', 'Gerente de RH', 'Sênior', 'active'),
  ('uuid-techlead', 'techlead@talentflow.com', 'João Santos', 'manager', 'Tech Lead', 'Sênior', 'active'),
  ('uuid-pleno', 'dev.pleno@talentflow.com', 'Ana Costa', 'employee', 'Desenvolvedora Full Stack', 'Pleno', 'active'),
  ('uuid-junior', 'dev.junior@talentflow.com', 'Pedro Oliveira', 'employee', 'Desenvolvedor Frontend', 'Júnior', 'active'),
  ('uuid-designer', 'designer@talentflow.com', 'Carla Mendes', 'employee', 'UX/UI Designer', 'Pleno', 'active'),
  ('uuid-qa', 'qa@talentflow.com', 'Lucas Almeida', 'employee', 'QA Analyst', 'Pleno', 'active'),
  ('uuid-estagiario', 'estagiario@talentflow.com', 'Julia Fernandes', 'employee', 'Estagiária de Desenvolvimento', 'Estagiário', 'active')
ON CONFLICT (id) DO NOTHING;
```

## Estrutura de Times (Opcional)

Após criar os usuários, você pode organizá-los em times:

```sql
-- Criar times
INSERT INTO teams (name, description, manager_id, created_at)
VALUES
  ('Engenharia', 'Time de Engenharia e Desenvolvimento', 'uuid-techlead', NOW()),
  ('Design', 'Time de Design e UX', NULL, NOW()),
  ('Qualidade', 'Time de QA e Testes', NULL, NOW())
ON CONFLICT (name) DO NOTHING;

-- Associar membros aos times
UPDATE profiles SET team_id = (SELECT id FROM teams WHERE name = 'Engenharia')
WHERE email IN ('dev.pleno@talentflow.com', 'dev.junior@talentflow.com', 'estagiario@talentflow.com');

UPDATE profiles SET team_id = (SELECT id FROM teams WHERE name = 'Design')
WHERE email = 'designer@talentflow.com';

UPDATE profiles SET team_id = (SELECT id FROM teams WHERE name = 'Qualidade')
WHERE email = 'qa@talentflow.com';
```

## Cenários de Teste por Usuário

### Admin Sistema
- ✅ Gerenciar todos os usuários
- ✅ Acessar relatórios completos
- ✅ Configurar competências e trilhas
- ✅ Executar migrações
- ✅ Gerenciar times

### Gerente de RH
- ✅ Visualizar relatórios de RH
- ✅ Aprovar solicitações de férias
- ✅ Gerenciar calendário de RH
- ✅ Acessar dados de bem-estar agregados
- ✅ Criar e editar trilhas de carreira

### Tech Lead
- ✅ Mentorar desenvolvedores
- ✅ Avaliar PDIs da equipe
- ✅ Criar e gerenciar times
- ✅ Acessar relatórios de equipe
- ✅ Aprovar metas de desenvolvimento

### Desenvolvedor Pleno
- ✅ Criar e gerenciar PDI pessoal
- ✅ Participar de mentorias
- ✅ Completar cursos
- ✅ Registrar conquistas
- ✅ Usar recursos de bem-estar

### Desenvolvedor Júnior
- ✅ Seguir trilha de carreira
- ✅ Buscar mentores
- ✅ Completar cursos iniciantes
- ✅ Fazer check-ins emocionais
- ✅ Acompanhar progresso

### Designer
- ✅ Trilha específica de design
- ✅ PDI focado em UX/UI
- ✅ Cursos de design
- ✅ Colaboração com desenvolvimento

### QA Analyst
- ✅ Trilha de qualidade
- ✅ PDI de automação de testes
- ✅ Cursos de testing
- ✅ Colaboração com times

### Estagiário
- ✅ Programa de onboarding completo
- ✅ Trilha de aprendizado estruturada
- ✅ Mentoria obrigatória
- ✅ Cursos básicos
- ✅ Acompanhamento de progresso

## Checklist de Testes

- [ ] Todos os usuários conseguem fazer login
- [ ] Perfis estão completos e corretos
- [ ] Permissões funcionam conforme esperado
- [ ] Cada usuário pode acessar suas funcionalidades
- [ ] RLS está bloqueando acessos não autorizados
- [ ] Times estão organizados corretamente
- [ ] Hierarquia de gestão funciona
- [ ] Notificações são enviadas adequadamente

## Notas Importantes

1. **Senhas:** Todas as senhas seguem o padrão `Tipo@2025` para facilitar testes
2. **Emails:** Todos usam o domínio `@talentflow.com` para identificação fácil
3. **Dados Sensíveis:** Estes são usuários de TESTE, não use em produção
4. **Reset:** Para começar fresh, delete os usuários no Supabase Auth Dashboard
5. **RLS:** Teste sempre que usuários NÃO vejam dados de outros sem permissão

## Próximos Passos Após Criação

1. Execute o script `seed_database.sql` para popular competências e cursos
2. Crie alguns PDIs de exemplo para cada usuário
3. Registre algumas conquistas
4. Faça check-ins emocionais
5. Teste fluxos completos de cada persona