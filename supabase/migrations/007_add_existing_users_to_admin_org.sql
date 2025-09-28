-- Add existing users to the admin organization
-- This migration ensures all existing users can see admin packages

-- First, ensure the admin organization exists
INSERT INTO organizations (name, plan, created_at, updated_at)
SELECT 
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
  o.id as org_id,
  au.id as user_id,
  'client' as role,
  NOW() as created_at
FROM auth.users au
CROSS JOIN organizations o
WHERE o.name = 'Admin Organization'
  AND au.id NOT IN (
    SELECT user_id 
    FROM org_members 
    WHERE org_id = o.id
  );

-- Update any existing admin users to be owners of the admin organization
UPDATE org_members 
SET role = 'owner'
WHERE org_id IN (
  SELECT id FROM organizations WHERE name = 'Admin Organization'
)
AND user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'sh4m4ni4k@sh4m4ni4k.nl'
);
