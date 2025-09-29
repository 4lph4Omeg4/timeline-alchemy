-- Fix client organization access issue
-- This migration ensures all users have access to the admin organization

-- First, ensure the Admin Organization exists
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

-- Add all existing users to the Admin Organization as clients
-- This ensures they have access to global packages and can see their clients
INSERT INTO org_members (org_id, user_id, role, created_at)
SELECT 
  o.id,
  au.id,
  CASE 
    WHEN au.email = 'sh4m4ni4k@sh4m4ni4k.nl' THEN 'owner'
    ELSE 'client'
  END,
  NOW()
FROM auth.users au
CROSS JOIN organizations o
WHERE o.name = 'Admin Organization'
AND NOT EXISTS (
  SELECT 1 FROM org_members om 
  WHERE om.org_id = o.id AND om.user_id = au.id
);

-- Ensure Admin Organization has an active subscription
INSERT INTO subscriptions (org_id, stripe_customer_id, stripe_subscription_id, plan, status, created_at, updated_at)
SELECT 
  o.id,
  'admin-' || o.id,
  'admin-sub-' || o.id,
  'enterprise',
  'active',
  NOW(),
  NOW()
FROM organizations o
WHERE o.name = 'Admin Organization'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.org_id = o.id
);

-- Update all existing clients to be in the Admin Organization
-- This ensures they're accessible to all users
UPDATE clients 
SET org_id = (
  SELECT id FROM organizations WHERE name = 'Admin Organization'
)
WHERE org_id IS NOT NULL;

-- Add a comment to track this migration
COMMENT ON TABLE org_members IS 'Updated to ensure all users have access to Admin Organization for global package access';
