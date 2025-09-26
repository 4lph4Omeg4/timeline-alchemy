-- DEBUG: Check current RLS status and policies
-- Run this to see what's currently enabled

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'org_members', 'clients', 'blog_posts', 'images', 'social_connections', 'subscriptions');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'org_members', 'clients', 'blog_posts', 'images', 'social_connections', 'subscriptions')
ORDER BY tablename, policyname;
