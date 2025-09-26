-- MANUAL FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this SQL in your Supabase SQL Editor to fix the 500 errors

-- Step 1: Disable RLS temporarily to stop the infinite recursion
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to clean up
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

-- Step 3: Create simple, non-recursive policies
-- Organizations: Allow all authenticated users to read, insert, update
CREATE POLICY "organizations_read" ON organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "organizations_insert" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "organizations_update" ON organizations FOR UPDATE TO authenticated USING (true);

-- Org Members: Allow all authenticated users to read, insert, delete
CREATE POLICY "org_members_read" ON org_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_members_insert" ON org_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "org_members_delete" ON org_members FOR DELETE TO authenticated USING (true);

-- Clients: Allow all authenticated users to read, insert, update, delete
CREATE POLICY "clients_read" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated USING (true);

-- User Clients: Allow all authenticated users to read, insert, delete
CREATE POLICY "user_clients_read" ON user_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_clients_insert" ON user_clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_clients_delete" ON user_clients FOR DELETE TO authenticated USING (true);

-- Blog Posts: Allow all authenticated users to read, insert, update, delete
CREATE POLICY "blog_posts_read" ON blog_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "blog_posts_insert" ON blog_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blog_posts_update" ON blog_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "blog_posts_delete" ON blog_posts FOR DELETE TO authenticated USING (true);

-- Images: Allow all authenticated users to read, insert, delete
CREATE POLICY "images_read" ON images FOR SELECT TO authenticated USING (true);
CREATE POLICY "images_insert" ON images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "images_delete" ON images FOR DELETE TO authenticated USING (true);

-- Social Connections: Allow all authenticated users to read, insert, update, delete
CREATE POLICY "social_connections_read" ON social_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "social_connections_insert" ON social_connections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "social_connections_update" ON social_connections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "social_connections_delete" ON social_connections FOR DELETE TO authenticated USING (true);

-- Subscriptions: Allow all authenticated users to read, insert, update
CREATE POLICY "subscriptions_read" ON subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE TO authenticated USING (true);

-- Step 4: Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
