-- RLS Policies for Timeline Alchemy
-- This migration adds Row Level Security policies to allow proper data access

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Org members policies
CREATE POLICY "Users can view their own memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view members of their organizations" ON org_members
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create memberships" ON org_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update memberships" ON org_members
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Clients policies
CREATE POLICY "Users can view clients of their organizations" ON clients
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create clients in their organizations" ON clients
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients in their organizations" ON clients
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Blog posts policies
CREATE POLICY "Users can view posts from their organizations" ON blog_posts
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts in their organizations" ON blog_posts
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts in their organizations" ON blog_posts
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts in their organizations" ON blog_posts
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Images policies
CREATE POLICY "Users can view images from their organizations" ON images
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images in their organizations" ON images
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images in their organizations" ON images
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images in their organizations" ON images
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Social connections policies
CREATE POLICY "Users can view social connections from their organizations" ON social_connections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create social connections in their organizations" ON social_connections
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update social connections in their organizations" ON social_connections
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete social connections in their organizations" ON social_connections
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view subscriptions from their organizations" ON subscriptions
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subscriptions in their organizations" ON subscriptions
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subscriptions in their organizations" ON subscriptions
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- User clients policies (for agencies)
CREATE POLICY "Users can view their client relationships" ON user_clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create client relationships" ON user_clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their client relationships" ON user_clients
  FOR DELETE USING (user_id = auth.uid());