-- Cleanup duplicate Admin Organizations
-- This migration removes duplicate admin organizations and keeps only one

-- First, let's see what we have
-- SELECT id, name, created_at FROM organizations WHERE name = 'Admin Organization' ORDER BY created_at;

-- Keep the oldest Admin Organization and remove duplicates
WITH admin_orgs AS (
  SELECT id, name, created_at,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM organizations 
  WHERE name = 'Admin Organization'
),
to_keep AS (
  SELECT id FROM admin_orgs WHERE rn = 1
),
to_delete AS (
  SELECT id FROM admin_orgs WHERE rn > 1
)
-- Move all org_members from duplicate orgs to the main one
UPDATE org_members 
SET org_id = (SELECT id FROM to_keep)
WHERE org_id IN (SELECT id FROM to_delete);

-- Move all blog_posts from duplicate orgs to the main one
UPDATE blog_posts 
SET org_id = (SELECT id FROM to_keep)
WHERE org_id IN (SELECT id FROM to_delete);

-- Move all images from duplicate orgs to the main one
UPDATE images 
SET org_id = (SELECT id FROM to_keep)
WHERE org_id IN (SELECT id FROM to_delete);

-- Move all social_connections from duplicate orgs to the main one
UPDATE social_connections 
SET org_id = (SELECT id FROM to_keep)
WHERE org_id IN (SELECT id FROM to_delete);

-- Move all subscriptions from duplicate orgs to the main one
UPDATE subscriptions 
SET org_id = (SELECT id FROM to_keep)
WHERE org_id IN (SELECT id FROM to_delete);

-- Now delete the duplicate organizations
DELETE FROM organizations 
WHERE id IN (
  SELECT id FROM (
    SELECT id, name, created_at,
           ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM organizations 
    WHERE name = 'Admin Organization'
  ) ranked
  WHERE rn > 1
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE organizations ADD CONSTRAINT unique_admin_organization 
UNIQUE (name) WHERE name = 'Admin Organization';

-- Verify we only have one Admin Organization now
-- SELECT COUNT(*) as admin_org_count FROM organizations WHERE name = 'Admin Organization';
