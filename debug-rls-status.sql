-- DEBUG: Check RLS status and test basic operations
-- Run this in Supabase SQL Editor

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'org_members', 'subscriptions');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'org_members', 'subscriptions')
ORDER BY tablename, policyname;

-- Test simple insert (this should work if RLS is properly configured)
INSERT INTO organizations (name, plan) 
VALUES ('Debug Test Org', 'basic') 
RETURNING *;

-- Clean up
DELETE FROM organizations WHERE name = 'Debug Test Org';