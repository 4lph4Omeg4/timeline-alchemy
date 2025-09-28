-- Add existing users to the admin organization
-- This migration ensures all existing users can see admin packages

-- First, ensure the admin organization exists
INSERT INTO organizations (id, name, plan, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Admin Organization',
  'enterprise',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE name = 'Admin Organization'
);

-- Add all existing users to the admin organization as clients
-- (Skip if they're already members)
INSERT INTO org_members (org_id, user_id, role, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid as org_id,
  au.id as user_id,
  'client' as role,
  NOW() as created_at
FROM auth.users au
WHERE au.id NOT IN (
  SELECT user_id 
  FROM org_members 
  WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Update any existing admin users to be owners of the admin organization
UPDATE org_members 
SET role = 'owner'
WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'sh4m4ni4k@sh4m4ni4k.nl'
  );
