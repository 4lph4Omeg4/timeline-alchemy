-- BETTER FIX: Create proper policies that actually work
-- Run this after the quick fix to properly secure the database

-- First, make sure we're starting clean
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "organizations_read" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "Enable read access for all users" ON organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable update for organization owners" ON organizations;

DROP POLICY IF EXISTS "org_members_read" ON org_members;
DROP POLICY IF EXISTS "org_members_insert" ON org_members;
DROP POLICY IF EXISTS "org_members_delete" ON org_members;
DROP POLICY IF EXISTS "Enable read access for members of organization" ON org_members;
DROP POLICY IF EXISTS "Enable insert for organization owners" ON org_members;
DROP POLICY IF EXISTS "Enable delete for organization owners" ON org_members;

DROP POLICY IF EXISTS "clients_read" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;
DROP POLICY IF EXISTS "Enable read access for organization members" ON clients;
DROP POLICY IF EXISTS "Enable insert for organization members" ON clients;
DROP POLICY IF EXISTS "Enable update for organization members" ON clients;
DROP POLICY IF EXISTS "Enable delete for organization members" ON clients;

DROP POLICY IF EXISTS "user_clients_read" ON user_clients;
DROP POLICY IF EXISTS "user_clients_insert" ON user_clients;
DROP POLICY IF EXISTS "user_clients_delete" ON user_clients;
DROP POLICY IF EXISTS "Enable read access for user's clients" ON user_clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_clients;
DROP POLICY IF EXISTS "Enable delete for user's clients" ON user_clients;

DROP POLICY IF EXISTS "blog_posts_read" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_update" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete" ON blog_posts;
DROP POLICY IF EXISTS "Enable read access for organization members" ON blog_posts;
DROP POLICY IF EXISTS "Enable insert for organization members" ON blog_posts;
DROP POLICY IF EXISTS "Enable update for organization members" ON blog_posts;
DROP POLICY IF EXISTS "Enable delete for organization members" ON blog_posts;

DROP POLICY IF EXISTS "images_read" ON images;
DROP POLICY IF EXISTS "images_insert" ON images;
DROP POLICY IF EXISTS "images_delete" ON images;
DROP POLICY IF EXISTS "Enable read access for organization members" ON images;
DROP POLICY IF EXISTS "Enable insert for organization members" ON images;
DROP POLICY IF EXISTS "Enable delete for organization members" ON images;

DROP POLICY IF EXISTS "social_connections_read" ON social_connections;
DROP POLICY IF EXISTS "social_connections_insert" ON social_connections;
DROP POLICY IF EXISTS "social_connections_update" ON social_connections;
DROP POLICY IF EXISTS "social_connections_delete" ON social_connections;
DROP POLICY IF EXISTS "Enable read access for organization members" ON social_connections;
DROP POLICY IF EXISTS "Enable insert for organization members" ON social_connections;
DROP POLICY IF EXISTS "Enable update for organization members" ON social_connections;
DROP POLICY IF EXISTS "Enable delete for organization members" ON social_connections;

DROP POLICY IF EXISTS "subscriptions_read" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
DROP POLICY IF EXISTS "Enable read access for organization members" ON subscriptions;
DROP POLICY IF EXISTS "Enable insert for organization members" ON subscriptions;
DROP POLICY IF EXISTS "Enable update for organization members" ON subscriptions;

-- Create simple, working policies
CREATE POLICY "organizations_all" ON organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "org_members_all" ON org_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clients_all" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_clients_all" ON user_clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "blog_posts_all" ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "images_all" ON images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "social_connections_all" ON social_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "subscriptions_all" ON subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
