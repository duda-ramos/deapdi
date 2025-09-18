/*
  # Remove Test Users

  This script removes all test users from the system:
  - admin@empresa.com
  - gestor@empresa.com  
  - colaborador@empresa.com
  - rh@empresa.com

  IMPORTANT: Run this in Supabase SQL Editor
*/

-- Remove profiles first (due to foreign key constraints)
DELETE FROM profiles 
WHERE email IN (
  'admin@empresa.com',
  'gestor@empresa.com', 
  'colaborador@empresa.com',
  'rh@empresa.com'
);

-- Remove from auth.users (this will cascade to other related tables)
-- Note: You may need to run this in the Supabase Dashboard under Authentication > Users
-- or use the admin API, as direct SQL access to auth.users may be restricted

-- Clean up any related data
DELETE FROM teams WHERE name IN ('Desenvolvimento', 'Design', 'Marketing', 'RH');

-- Reset any sequences or counters if needed
-- (Add any other cleanup as necessary)

-- Verify cleanup
SELECT 'Profiles remaining:' as info, count(*) as count FROM profiles
UNION ALL
SELECT 'Teams remaining:' as info, count(*) as count FROM teams;