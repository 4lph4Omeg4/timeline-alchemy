-- Quick fix for infinite recursion in RLS policies
-- This temporarily disables RLS to allow the application to work

-- Disable RLS on problematic tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for all users" ON organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable update for organization owners" ON organizations;

DROP POLICY IF EXISTS "Enable read access for members of organization" ON org_members;
DROP POLICY IF EXISTS "Enable insert for organization owners" ON org_members;
DROP POLICY IF EXISTS "Enable delete for organization owners" ON org_members;

DROP POLICY IF EXISTS "Enable read access for organization members" ON clients;
DROP POLICY IF EXISTS "Enable insert for organization members" ON clients;
DROP POLICY IF EXISTS "Enable update for organization members" ON clients;
DROP POLICY IF EXISTS "Enable delete for organization members" ON clients;

DROP POLICY IF EXISTS "Enable read access for user's clients" ON user_clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_clients;
DROP POLICY IF EXISTS "Enable delete for user's clients" ON user_clients;

DROP POLICY IF EXISTS "Enable read access for organization members" ON blog_posts;
DROP POLICY IF EXISTS "Enable insert for organization members" ON blog_posts;
DROP POLICY IF EXISTS "Enable update for organization members" ON blog_posts;
DROP POLICY IF EXISTS "Enable delete for organization members" ON blog_posts;

DROP POLICY IF EXISTS "Enable read access for organization members" ON images;
DROP POLICY IF EXISTS "Enable insert for organization members" ON images;
DROP POLICY IF EXISTS "Enable delete for organization members" ON images;

DROP POLICY IF EXISTS "Enable read access for organization members" ON social_connections;
DROP POLICY IF EXISTS "Enable insert for organization members" ON social_connections;
DROP POLICY IF EXISTS "Enable update for organization members" ON social_connections;
DROP POLICY IF EXISTS "Enable delete for organization members" ON social_connections;

DROP POLICY IF EXISTS "Enable read access for organization members" ON subscriptions;
DROP POLICY IF EXISTS "Enable insert for organization members" ON subscriptions;
DROP POLICY IF EXISTS "Enable update for organization members" ON subscriptions;
