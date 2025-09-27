-- Fix client emails to use real user emails instead of placeholders
-- Run this in Supabase SQL Editor to update existing client emails

-- Update client emails to use the organization owner's email
UPDATE clients 
SET contact_info = (
  SELECT ('{"email": "' || au.email || '"}')::jsonb
  FROM org_members om
  JOIN auth.users au ON om.user_id = au.id
  WHERE om.org_id = clients.org_id 
  AND om.role = 'owner'
  LIMIT 1
)
WHERE contact_info->>'email' LIKE 'client@%';

-- Show the updated results
SELECT 
  c.name as client_name,
  c.contact_info->>'email' as email,
  o.name as organization,
  au.email as owner_email
FROM clients c
JOIN organizations o ON c.org_id = o.id
JOIN org_members om ON o.id = om.org_id AND om.role = 'owner'
JOIN auth.users au ON om.user_id = au.id
ORDER BY c.created_at;
