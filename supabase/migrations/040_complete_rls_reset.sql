-- COMPLETE RLS RESET TO KNOWN WORKING STATE
-- This migration completely resets all RLS policies to the original working configuration
-- Based on migrations 002 and 005 which were known to work

-- ============================================================================
-- STEP 1: Disable RLS on all tables
-- ============================================================================
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop ALL existing policies (complete cleanup)
-- ============================================================================

-- Organizations
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations they own or admin" ON organizations;
DROP POLICY IF EXISTS "organizations_all" ON organizations;
DROP POLICY IF EXISTS "organizations_read_all" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_own" ON organizations;
DROP POLICY IF EXISTS "organizations_update_own" ON organizations;

-- Org Members
DROP POLICY IF EXISTS "Users can view their own memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
DROP POLICY IF EXISTS "Users can create memberships" ON org_members;
DROP POLICY IF EXISTS "Organization owners can update memberships" ON org_members;
DROP POLICY IF EXISTS "Users can insert members in organizations they own or admin" ON org_members;
DROP POLICY IF EXISTS "Users can update members in organizations they own or admin" ON org_members;
DROP POLICY IF EXISTS "Users can delete members in organizations they own or admin" ON org_members;
DROP POLICY IF EXISTS "org_members_all" ON org_members;
DROP POLICY IF EXISTS "org_members_read_all" ON org_members;
DROP POLICY IF EXISTS "org_members_insert_own" ON org_members;
DROP POLICY IF EXISTS "org_members_update_own" ON org_members;
DROP POLICY IF EXISTS "org_members_delete_own" ON org_members;

-- Clients
DROP POLICY IF EXISTS "Users can view clients of their organizations" ON clients;
DROP POLICY IF EXISTS "Users can create clients in their organizations" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their organizations" ON clients;
DROP POLICY IF EXISTS "Users can insert clients in organizations they belong to" ON clients;
DROP POLICY IF EXISTS "Users can update clients in organizations they belong to" ON clients;
DROP POLICY IF EXISTS "Users can delete clients in organizations they belong to" ON clients;
DROP POLICY IF EXISTS "clients_all" ON clients;
DROP POLICY IF EXISTS "clients_read_all" ON clients;
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "clients_delete_own" ON clients;

-- Blog Posts
DROP POLICY IF EXISTS "Users can view posts from their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can create posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can update posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can insert posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can view admin packages" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_all" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_read_all" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert_own" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_update_own" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete_own" ON blog_posts;

-- Images
DROP POLICY IF EXISTS "Users can view images from their organizations" ON images;
DROP POLICY IF EXISTS "Users can create images in their organizations" ON images;
DROP POLICY IF EXISTS "Users can update images in their organizations" ON images;
DROP POLICY IF EXISTS "Users can delete images in their organizations" ON images;
DROP POLICY IF EXISTS "Users can insert images in their organizations" ON images;
DROP POLICY IF EXISTS "images_all" ON images;
DROP POLICY IF EXISTS "images_read_all" ON images;
DROP POLICY IF EXISTS "images_insert_own" ON images;
DROP POLICY IF EXISTS "images_update_own" ON images;
DROP POLICY IF EXISTS "images_delete_own" ON images;

-- Social Connections
DROP POLICY IF EXISTS "Users can view social connections from their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can view social connections from their own organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can create social connections in their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can update social connections in their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can delete social connections in their organizations" ON social_connections;
DROP POLICY IF EXISTS "Users can insert social connections in their organizations" ON social_connections;
DROP POLICY IF EXISTS "social_connections_all" ON social_connections;
DROP POLICY IF EXISTS "social_connections_read_all" ON social_connections;
DROP POLICY IF EXISTS "social_connections_insert_own" ON social_connections;
DROP POLICY IF EXISTS "social_connections_update_own" ON social_connections;
DROP POLICY IF EXISTS "social_connections_delete_own" ON social_connections;

-- Subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions from their organizations" ON subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions in their organizations" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions in their organizations" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert subscriptions in their organizations" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_all" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_read_all" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;

-- Ratings
DROP POLICY IF EXISTS "Users can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON ratings;

-- Social Posts
DROP POLICY IF EXISTS "Users can view social posts for accessible posts" ON social_posts;
DROP POLICY IF EXISTS "Users can insert social posts for accessible posts" ON social_posts;
DROP POLICY IF EXISTS "Users can update social posts for accessible posts" ON social_posts;

-- Telegram Channels
DROP POLICY IF EXISTS "Users can view telegram channels from their own organizations" ON telegram_channels;
DROP POLICY IF EXISTS "Users can create telegram channels in their own organizations" ON telegram_channels;
DROP POLICY IF EXISTS "Users can update telegram channels in their own organizations" ON telegram_channels;
DROP POLICY IF EXISTS "Users can delete telegram channels from their own organizations" ON telegram_channels;

-- Organization Usage
DROP POLICY IF EXISTS "Users can view usage of their organizations" ON organization_usage;
DROP POLICY IF EXISTS "Users can insert usage for their organizations" ON organization_usage;
DROP POLICY IF EXISTS "Users can update usage of their organizations" ON organization_usage;

-- Branding Settings
DROP POLICY IF EXISTS "Users can view their organization's branding settings" ON branding_settings;
DROP POLICY IF EXISTS "Users can update their organization's branding settings" ON branding_settings;

-- Conversations & Messages
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- ============================================================================
-- STEP 3: Create clean RLS policies (ORIGINAL WORKING VERSION)
-- ============================================================================

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

-- Ratings policies
CREATE POLICY "Users can view all ratings" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (user_id = auth.uid());

-- Social posts policies
CREATE POLICY "Users can view social posts for accessible posts" ON social_posts
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM blog_posts 
      WHERE is_org_member(auth.uid(), org_id)
    )
  );

CREATE POLICY "Users can insert social posts for accessible posts" ON social_posts
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT id FROM blog_posts 
      WHERE is_org_member(auth.uid(), org_id)
    )
  );

CREATE POLICY "Users can update social posts for accessible posts" ON social_posts
  FOR UPDATE USING (
    post_id IN (
      SELECT id FROM blog_posts 
      WHERE is_org_member(auth.uid(), org_id)
    )
  );

-- Telegram channels policies
CREATE POLICY "Users can view telegram channels from their organizations" ON telegram_channels
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can create telegram channels in their organizations" ON telegram_channels
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update telegram channels in their organizations" ON telegram_channels
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can delete telegram channels from their organizations" ON telegram_channels
  FOR DELETE USING (is_org_member(auth.uid(), org_id));

-- Organization usage policies
CREATE POLICY "Users can view usage of their organizations" ON organization_usage
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can insert usage for their organizations" ON organization_usage
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can update usage of their organizations" ON organization_usage
  FOR UPDATE USING (is_org_member(auth.uid(), org_id));

-- Branding settings policies
CREATE POLICY "Users can view their organization's branding settings" ON branding_settings
  FOR SELECT USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update their organization's branding settings" ON branding_settings
  FOR UPDATE USING (is_org_member(auth.uid(), organization_id));

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update message read status" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- ============================================================================
-- STEP 4: Re-enable RLS on all tables
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON DATABASE postgres IS 'RLS policies reset to original working state from migrations 002 and 005';

