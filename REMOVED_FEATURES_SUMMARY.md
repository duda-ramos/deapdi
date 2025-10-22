# Resumo: Remoção de Funcionalidades de Conquistas, Aprendizados e Certificados

## Data: 2025-10-22

## Funcionalidades Removidas

As seguintes funcionalidades foram completamente removidas da aplicação:

### 1. **Sistema de Conquistas (Achievements)**
- Página de conquistas (`/achievements`)
- Context de conquistas (`AchievementContext`)
- Toast de notificação de conquistas
- Serviço de conquistas (`achievements.ts`)
- Verificações automáticas de conquistas em PDIs, competências e grupos de ação

### 2. **Sistema de Aprendizado (Learning/Courses)**
- Página de aprendizado (`/learning`)
- Página de certificados (`/certificates`)
- Serviço de cursos (`courses.ts`)
- Inscrições em cursos
- Progresso de módulos
- Geração de certificados

## Arquivos Removidos

### Componentes de UI:
- `/src/pages/Achievements.tsx`
- `/src/pages/Learning.tsx`
- `/src/pages/Certificates.tsx`
- `/src/components/AchievementToast.tsx`
- `/src/contexts/AchievementContext.tsx`

### Serviços:
- `/src/services/achievements.ts`
- `/src/services/courses.ts`

## Arquivos Modificados

### Rotas e Navegação:
- `/src/App.tsx` - Removido rotas e context de achievements
- `/src/components/layout/Sidebar.tsx` - Removido itens de menu
- `/src/components/LazyComponents.tsx` - Removido lazy imports

### Páginas:
- `/src/pages/Dashboard.tsx` - Removido referências a conquistas e cursos
- `/src/pages/PDI.tsx` - Removido hook `useAchievements`
- `/src/pages/Competencies.tsx` - Removido hook `useAchievements`
- `/src/pages/ActionGroups.tsx` - Removido hook `useAchievements`

### Serviços:
- `/src/services/database.ts` - Removido métodos de conquistas
- `/src/services/reports.ts` - Removido Achievement type e achievementsCount
- `/src/services/peopleManagement.ts` - Removido achievements_count das métricas
- `/src/services/admin.ts` - Removido total_achievements das estatísticas

### Types:
- `/src/types/index.ts` - Removido Achievement type e referências

## Migrations do Supabase Afetadas

As seguintes migrations criam tabelas e funções que NÃO são mais utilizadas:

### Conquistas (Achievements):
1. **`20250919122641_yellow_dawn.sql`**
   - Cria tabela `achievement_templates`
   - Cria tabela `achievements` (atualiza para usar templates)
   - Funções: `unlock_achievement`, `check_and_unlock_achievements`
   - Triggers para PDI, competências e tarefas

2. **`20250930141905_expand_achievement_system.sql`**
   - Expande sistema de conquistas
   - Adiciona novos triggers para cursos, mentorias, wellness
   - Função: `manual_check_achievements`, `get_user_achievement_stats`

### Cursos e Certificados:
3. **`20250919124429_smooth_lake.sql`**
   - Cria tabelas: `courses`, `course_modules`, `course_enrollments`, `course_progress`, `certificates`
   - Funções: `calculate_course_completion`, `generate_certificate`, `update_competencies_from_course`
   - Triggers para atualização de progresso
   - Sequence: `certificate_sequence`

4. **`20250929135439_dawn_butterfly.sql`**
   - Funções: `trigger_update_course_progress`, `generate_course_certificate`
   - Triggers para course_progress

### Outras Migrations com Referências:
- **`20250930140232_complete_rls_consolidation.sql`** - Contém políticas RLS para achievements, courses, certificates
- **`20250919193042_solitary_hall.sql`** - RLS policies para achievements e courses
- **`20250929153749_damp_credit.sql`** - Função `get_user_achievement_stats` inclui completedCourses

## Tabelas do Banco de Dados a Remover/Desabilitar

Quando executar a limpeza do banco de dados, as seguintes tabelas devem ser removidas:

1. `achievements`
2. `achievement_templates`
3. `courses`
4. `course_modules`
5. `course_enrollments`
6. `course_progress`
7. `certificates`

## Funções e Triggers a Remover

### Funções:
- `get_user_achievement_stats`
- `manual_check_achievements`
- `check_and_unlock_achievements`
- `unlock_achievement`
- `generate_course_certificate`
- `trigger_update_course_progress`
- `trigger_check_pdi_achievements`
- `trigger_check_competency_achievements`
- `trigger_check_course_achievements`
- `trigger_check_mentorship_achievements`
- `trigger_check_action_group_achievements`
- `trigger_check_wellness_achievements`

### Triggers:
- `check_pdi_achievements`
- `check_competency_achievements`
- `check_course_achievements`
- `check_mentorship_achievements`
- `check_action_group_achievements`
- `check_wellness_achievements`
- `course_progress_update`

### Sequences:
- `certificate_sequence`
- `certificate_number_seq`

## Como Proceder com o Banco de Dados

### Opção 1: Nova Migration de Limpeza (Recomendado para Produção)
Crie uma nova migration que:
```sql
-- Drop triggers
DROP TRIGGER IF EXISTS check_pdi_achievements ON pdis;
DROP TRIGGER IF EXISTS check_competency_achievements ON competencies;
-- ... (todos os outros triggers)

-- Drop functions
DROP FUNCTION IF EXISTS get_user_achievement_stats(uuid);
-- ... (todas as outras funções)

-- Drop tables
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS achievement_templates CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS course_progress CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS certificate_sequence;
DROP SEQUENCE IF EXISTS certificate_number_seq;
```

### Opção 2: Reset Completo (Apenas para Desenvolvimento)
Se estiver em ambiente de desenvolvimento e quiser começar do zero:
1. Faça backup dos dados importantes
2. Remova ou comente as migrations listadas acima
3. Execute um reset completo do banco de dados
4. Reaplique as migrations restantes

## Impacto nas Funcionalidades Restantes

### Funcionalidades que PERMANECEM intactas:
- ✅ PDI (Plano de Desenvolvimento Individual)
- ✅ Competências
- ✅ Grupos de Ação
- ✅ Trilhas de Carreira
- ✅ Mentorias
- ✅ Bem-estar/Saúde Mental
- ✅ Gestão de Pessoas
- ✅ Relatórios
- ✅ Sistema de pontos

### Ajustes Realizados:
- Métricas de engajamento agora calculadas sem achievements e courses
- Dashboard atualizado para focar em PDI, competências e bem-estar
- Navegação simplificada sem as seções removidas
- Hooks de verificação de conquistas removidos de PDI, competências e grupos de ação

## Próximos Passos Recomendados

1. ✅ **Revisar o código** - Confirmar que não há importações quebradas
2. ⚠️ **Executar testes** - Verificar se a aplicação funciona corretamente
3. ⚠️ **Atualizar banco de dados** - Aplicar migration de limpeza ou remover tabelas manualmente
4. ⚠️ **Atualizar documentação** - Remover referências a conquistas e cursos
5. ⚠️ **Comunicar mudanças** - Informar usuários sobre a remoção dessas funcionalidades

## Notas Importantes

- ⚠️ As migrations existentes NÃO foram deletadas para manter o histórico
- ⚠️ Se o banco de dados já possui dados nessas tabelas, faça backup antes de remover
- ⚠️ Algumas referências podem ainda existir em fixtures de testes do Cypress
- ✅ Todo código TypeScript foi atualizado para não depender dessas funcionalidades
- ✅ Rotas e navegação foram atualizadas
- ✅ Context providers foram removidos

---

**Remoção concluída com sucesso!** 🎉

A aplicação agora está focada em:
- Desenvolvimento de carreira (PDI, competências, trilhas)
- Gestão de pessoas e times
- Bem-estar e saúde mental
- Mentorias e grupos de ação
