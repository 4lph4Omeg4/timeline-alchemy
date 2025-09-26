-- Fixed RLS Policies for Timeline Alchemy
-- This migration fixes the infinite recursion issue

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;

DROP POLICY IF EXISTS "Users can view their own memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
DROP POLICY IF EXISTS "Users can create memberships" ON org_members;
DROP POLICY IF EXISTS "Organization owners can update memberships" ON org_members;

DROP POLICY IF EXISTS "Users can view clients of their organizations" ON clients;
DROP POLICY IF EXISTS "Users can create clients in their organizations" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their organizations" ON clients;

DROP POLICY IF EXISTS "Users can view posts from their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can create posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can update posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete posts in their organizations" ON blog_posts;

DROP POLICY IF EXISTS "Users can view images from their organizations" ON images;
DROP POLICY IF EXISTS "Users can create images in their organizations" ON images;
DROP POLICY IF EXISTS "Users can update images in their organizations" ON images;
DROP POLICY IF EXISTS "Users can delete images in their organizations" ON images;

DROP POLICY IF EXISTS "Users can view social connections from their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can create social connections in their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can update social connections in their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can delete social connections in their organizations" ON social_connections;

DROP POLICY IF EXISTS "Users can view subscriptions from their organizations" ON subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions in their organizations" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions in their organizations" ON subscriptions;

DROP POLICY IF EXISTS "Users can view their client relationships" ON user_clients;
DROP POLICY IF EXISTS "Users can create client relationships" ON user_clients;
DROP POLICY IF EXISTS "Users can delete their client relationships" ON user_clients;

-- Create simplified policies without circular references

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = organizations.id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update their organization" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = organizations.id 
      AND org_members.user_id = auth.uid() 
      AND org_members.role = 'owner'
    )
  );

-- Org members policies
CREATE POLICY "Users can view their own memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view members of their organizations" ON org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om2 
      WHERE om2.org_id = org_members.org_id 
      AND om2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create memberships" ON org_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update memberships" ON org_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members om2 
      WHERE om2.org_id = org_members.org_id 
      AND om2.user_id = auth.uid() 
      AND om2.role = 'owner'
    )
  );

-- Clients policies
CREATE POLICY "Users can view clients of their organizations" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = clients.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create clients in their organizations" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = clients.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients in their organizations" ON clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = clients.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Blog posts policies
CREATE POLICY "Users can view posts from their organizations" ON blog_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = blog_posts.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts in their organizations" ON blog_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = blog_posts.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts in their organizations" ON blog_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = blog_posts.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts in their organizations" ON blog_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = blog_posts.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Images policies
CREATE POLICY "Users can view images from their organizations" ON images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = images.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images in their organizations" ON images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = images.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images in their organizations" ON images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = images.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images in their organizations" ON images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = images.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Social connections policies
CREATE POLICY "Users can view social connections from their organizations" ON social_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = social_connections.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create social connections in their organizations" ON social_connections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = social_connections.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update social connections in their organizations" ON social_connections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = social_connections.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete social connections in their organizations" ON social_connections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = social_connections.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view subscriptions from their organizations" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = subscriptions.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subscriptions in their organizations" ON subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = subscriptions.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subscriptions in their organizations" ON subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = subscriptions.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

-- User clients policies (for agencies)
CREATE POLICY "Users can view their client relationships" ON user_clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create client relationships" ON user_clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their client relationships" ON user_clients
  FOR DELETE USING (user_id = auth.uid());
