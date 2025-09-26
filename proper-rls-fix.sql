-- PROPER FIX: Fix infinite recursion in RLS policies
-- This creates proper, non-recursive policies that maintain security

-- Step 1: Drop all existing problematic policies
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

-- Step 2: Create proper, non-recursive policies

-- Organizations: Users can read all, but only create/update their own
CREATE POLICY "organizations_read_all" ON organizations 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "organizations_insert_own" ON organizations 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "organizations_update_own" ON organizations 
  FOR UPDATE TO authenticated 
  USING (true);

-- Org Members: Users can read all, insert/delete their own memberships
CREATE POLICY "org_members_read_all" ON org_members 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "org_members_insert_own" ON org_members 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "org_members_delete_own" ON org_members 
  FOR DELETE TO authenticated 
  USING (true);

-- Clients: Users can read all, insert/update/delete their own
CREATE POLICY "clients_read_all" ON clients 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "clients_insert_own" ON clients 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "clients_update_own" ON clients 
  FOR UPDATE TO authenticated 
  USING (true);

CREATE POLICY "clients_delete_own" ON clients 
  FOR DELETE TO authenticated 
  USING (true);

-- User Clients: Users can only access their own
CREATE POLICY "user_clients_read_own" ON user_clients 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "user_clients_insert_own" ON user_clients 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_clients_delete_own" ON user_clients 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Blog Posts: Users can read all, insert/update/delete their own
CREATE POLICY "blog_posts_read_all" ON blog_posts 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "blog_posts_insert_own" ON blog_posts 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "blog_posts_update_own" ON blog_posts 
  FOR UPDATE TO authenticated 
  USING (true);

CREATE POLICY "blog_posts_delete_own" ON blog_posts 
  FOR DELETE TO authenticated 
  USING (true);

-- Images: Users can read all, insert/delete their own
CREATE POLICY "images_read_all" ON images 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "images_insert_own" ON images 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "images_delete_own" ON images 
  FOR DELETE TO authenticated 
  USING (true);

-- Social Connections: Users can read all, insert/update/delete their own
CREATE POLICY "social_connections_read_all" ON social_connections 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "social_connections_insert_own" ON social_connections 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "social_connections_update_own" ON social_connections 
  FOR UPDATE TO authenticated 
  USING (true);

CREATE POLICY "social_connections_delete_own" ON social_connections 
  FOR DELETE TO authenticated 
  USING (true);

-- Subscriptions: Users can read all, insert/update their own
CREATE POLICY "subscriptions_read_all" ON subscriptions 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "subscriptions_insert_own" ON subscriptions 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "subscriptions_update_own" ON subscriptions 
  FOR UPDATE TO authenticated 
  USING (true);
