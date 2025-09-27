-- Add clients for existing users who don't have any
-- Run this in Supabase SQL Editor to create clients for existing organizations

-- Find organizations without clients
WITH orgs_without_clients AS (
  SELECT o.id, o.name, om.user_id
  FROM organizations o
  LEFT JOIN org_members om ON o.id = om.org_id AND om.role = 'owner'
  LEFT JOIN clients c ON o.id = c.org_id
  WHERE c.id IS NULL
)
-- Create clients for organizations that don't have any
INSERT INTO clients (org_id, name, contact_info)
SELECT 
  owc.id,
  owc.name || ' Client',
  ('{"email": "client@' || owc.name || '.com"}')::jsonb
FROM orgs_without_clients owc;

-- Show the results
SELECT 
  o.name as organization,
  c.name as client_name,
  c.contact_info
FROM organizations o
JOIN clients c ON o.id = c.org_id
ORDER BY o.created_at;
