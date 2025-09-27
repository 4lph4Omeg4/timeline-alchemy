-- Fix RLS infinite recursion and ensure proper subscription creation
-- This script addresses the infinite recursion in org_members policies

-- First, disable RLS temporarily to fix the policies
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Create a function to check if user is member of organization (avoids recursion)
CREATE OR REPLACE FUNCTION is_org_member(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = user_uuid AND org_id = org_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is owner of organization
CREATE OR REPLACE FUNCTION is_org_owner(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = user_uuid AND org_id = org_uuid AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create new policies using the helper functions (no recursion)

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (is_org_member(auth.uid(), id));

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update their organization" ON organizations
  FOR UPDATE USING (is_org_owner(auth.uid(), id));

-- Org members policies
CREATE POLICY "Users can view their own memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view members of their organizations" ON org_members
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create memberships" ON org_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update memberships" ON org_members
  FOR UPDATE USING (is_org_owner(auth.uid(), org_id));

-- Clients policies
CREATE POLICY "Users can view clients of their organizations" ON clients
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create clients in their organizations" ON clients
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update clients in their organizations" ON clients
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

-- Blog posts policies
CREATE POLICY "Users can view posts from their organizations" ON blog_posts
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create posts in their organizations" ON blog_posts
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update posts in their organizations" ON blog_posts
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can delete posts in their organizations" ON blog_posts
  FOR DELETE USING (is_org_member(auth.uid(), org_id));

-- Images policies
CREATE POLICY "Users can view images from their organizations" ON images
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create images in their organizations" ON images
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update images in their organizations" ON images
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can delete images in their organizations" ON images
  FOR DELETE USING (is_org_member(auth.uid(), org_id));

-- Social connections policies
CREATE POLICY "Users can view social connections from their organizations" ON social_connections
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create social connections in their organizations" ON social_connections
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update social connections in their organizations" ON social_connections
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can delete social connections in their organizations" ON social_connections
  FOR DELETE USING (is_org_member(auth.uid(), org_id));

-- Subscriptions policies
CREATE POLICY "Users can view subscriptions from their organizations" ON subscriptions
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create subscriptions in their organizations" ON subscriptions
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update subscriptions in their organizations" ON subscriptions
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

-- User clients policies (for agencies)
CREATE POLICY "Users can view their client relationships" ON user_clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create client relationships" ON user_clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their client relationships" ON user_clients
  FOR DELETE USING (user_id = auth.uid());

-- Create a function to automatically create organization and subscription for new users
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Get user name from metadata or email
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User');
  
  -- Create organization
  INSERT INTO organizations (name, plan)
  VALUES (user_name || '''s Organization', 'basic')
  RETURNING id INTO new_org_id;
  
  -- Add user as owner
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  -- Create subscription
  INSERT INTO subscriptions (org_id, stripe_customer_id, stripe_subscription_id, plan, status)
  VALUES (new_org_id, 'temp-' || new_org_id, 'temp-sub-' || new_org_id, 'basic', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create organization for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_organization();
