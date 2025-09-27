-- Debug clients table and data
-- Run this in Supabase SQL Editor to check clients

-- Check if clients table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any clients in the table
SELECT COUNT(*) as total_clients FROM clients;

-- Check all clients data
SELECT * FROM clients LIMIT 10;

-- Check if there are any clients with organizations
SELECT 
  c.*,
  o.name as org_name
FROM clients c
LEFT JOIN organizations o ON c.org_id = o.id
LIMIT 10;

-- Check org_members to see user organizations
SELECT 
  om.*,
  o.name as org_name
FROM org_members om
LEFT JOIN organizations o ON om.org_id = o.id
LIMIT 10;
