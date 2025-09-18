/*
  # Seed Test Users and Setup

  1. Test Users Setup
    - Creates teams for organization
    - Provides instructions for creating test users
    - Sets up profiles for different roles

  2. Security
    - Temporarily disables RLS for setup
    - Re-enables RLS after setup
    - Provides secure test credentials

  3. Test Credentials
    - Admin: admin@empresa.com / admin123
    - Manager: gestor@empresa.com / gestor123  
    - Employee: colaborador@empresa.com / colab123
    - HR: rh@empresa.com / rh123456
*/

-- Temporarily disable RLS for setup
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Create sample teams
INSERT INTO teams (id, name, description, created_at, updated_at) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Desenvolvimento', 'Time de desenvolvimento de software', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Design', 'Time de design e UX/UI', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Marketing', 'Time de marketing digital', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440004', 'RH', 'Time de recursos humanos', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

/*
  INSTRUÇÕES PARA CRIAR USUÁRIOS DE TESTE:
  
  1. Vá para o Supabase Dashboard > Authentication > Users
  2. Clique em "Create new user" para cada usuário abaixo:
  
  USUÁRIO ADMIN:
  - Email: admin@empresa.com
  - Password: admin123
  - Email Confirm: ✓ (marque como confirmado)
  - User Metadata: {"name": "Admin Sistema", "role": "admin"}
  
  USUÁRIO GESTOR:
  - Email: gestor@empresa.com  
  - Password: gestor123
  - Email Confirm: ✓ (marque como confirmado)
  - User Metadata: {"name": "João Silva", "role": "manager"}
  
  USUÁRIO COLABORADOR:
  - Email: colaborador@empresa.com
  - Password: colab123
  - Email Confirm: ✓ (marque como confirmado)
  - User Metadata: {"name": "Maria Santos", "role": "employee"}
  
  USUÁRIO RH:
  - Email: rh@empresa.com
  - Password: rh123456
  - Email Confirm: ✓ (marque como confirmado)
  - User Metadata: {"name": "Ana Costa", "role": "hr"}
  
  3. Após criar os usuários, o trigger handle_new_user() criará automaticamente os perfis
  
  4. Se os perfis não forem criados automaticamente, execute o script abaixo
     substituindo os UUIDs pelos IDs reais dos usuários criados:
*/

-- EXEMPLO DE INSERÇÃO MANUAL DE PERFIS (use apenas se o trigger não funcionar)
-- SUBSTITUA OS UUIDs PELOS IDs REAIS DOS USUÁRIOS CRIADOS NO DASHBOARD

/*
INSERT INTO profiles (id, email, name, role, status, team_id, position, level, points, created_at, updated_at) VALUES 
  ('UUID-DO-ADMIN-AQUI', 'admin@empresa.com', 'Admin Sistema', 'admin', 'active', '550e8400-e29b-41d4-a716-446655440001', 'Administrador do Sistema', 'Especialista', 1000, now(), now()),
  ('UUID-DO-GESTOR-AQUI', 'gestor@empresa.com', 'João Silva', 'manager', 'active', '550e8400-e29b-41d4-a716-446655440001', 'Tech Lead', 'Sênior', 750, now(), now()),
  ('UUID-DO-COLABORADOR-AQUI', 'colaborador@empresa.com', 'Maria Santos', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440001', 'Desenvolvedora Frontend', 'Pleno', 500, now(), now()),
  ('UUID-DO-RH-AQUI', 'rh@empresa.com', 'Ana Costa', 'hr', 'active', '550e8400-e29b-41d4-a716-446655440004', 'Analista de RH', 'Pleno', 300, now(), now())
ON CONFLICT (id) DO NOTHING;
*/