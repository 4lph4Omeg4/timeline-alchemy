-- ROLLBACK: Restore original RLS policies
-- The optimization broke authentication, reverting to original working policies

-- ============================================================================
-- ORGANIZATIONS - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
CREATE POLICY "Organization owners can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Users can update organizations they own or admin" ON organizations;
CREATE POLICY "Users can update organizations they own or admin" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ORG_MEMBERS - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own memberships" ON org_members;
CREATE POLICY "Users can view their own memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
CREATE POLICY "Users can view members of their organizations" ON org_members
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create memberships" ON org_members;
CREATE POLICY "Users can create memberships" ON org_members
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Organization owners can update memberships" ON org_members;
CREATE POLICY "Organization owners can update memberships" ON org_members
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Users can insert members in organizations they own or admin" ON org_members;
CREATE POLICY "Users can insert members in organizations they own or admin" ON org_members
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update members in organizations they own or admin" ON org_members;
CREATE POLICY "Users can update members in organizations they own or admin" ON org_members
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete members in organizations they own or admin" ON org_members;
CREATE POLICY "Users can delete members in organizations they own or admin" ON org_members
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- CLIENTS - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view clients of their organizations" ON clients;
CREATE POLICY "Users can view clients of their organizations" ON clients
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create clients in their organizations" ON clients;
CREATE POLICY "Users can create clients in their organizations" ON clients
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert clients in organizations they belong to" ON clients;
CREATE POLICY "Users can insert clients in organizations they belong to" ON clients
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update clients in their organizations" ON clients;
CREATE POLICY "Users can update clients in their organizations" ON clients
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update clients in organizations they belong to" ON clients;
CREATE POLICY "Users can update clients in organizations they belong to" ON clients
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete clients in organizations they belong to" ON clients;
CREATE POLICY "Users can delete clients in organizations they belong to" ON clients
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BLOG_POSTS - RESTORE ORIGINAL  
-- ============================================================================

DROP POLICY IF EXISTS "Users can view posts from their organizations" ON blog_posts;
CREATE POLICY "Users can view posts from their organizations" ON blog_posts
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create posts in their organizations" ON blog_posts;
CREATE POLICY "Users can create posts in their organizations" ON blog_posts
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert posts in their organizations" ON blog_posts;
CREATE POLICY "Users can insert posts in their organizations" ON blog_posts
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update posts in their organizations" ON blog_posts;
CREATE POLICY "Users can update posts in their organizations" ON blog_posts
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete posts in their organizations" ON blog_posts;
CREATE POLICY "Users can delete posts in their organizations" ON blog_posts
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- IMAGES - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view images from their organizations" ON images;
CREATE POLICY "Users can view images from their organizations" ON images
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create images in their organizations" ON images;
CREATE POLICY "Users can create images in their organizations" ON images
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert images in their organizations" ON images;
CREATE POLICY "Users can insert images in their organizations" ON images
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update images in their organizations" ON images;
CREATE POLICY "Users can update images in their organizations" ON images
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete images in their organizations" ON images;
CREATE POLICY "Users can delete images in their organizations" ON images
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SOCIAL_CONNECTIONS - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view social connections from their own organizations" ON social_connections;
CREATE POLICY "Users can view social connections from their own organizations" ON social_connections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create social connections in their organizations" ON social_connections;
CREATE POLICY "Users can create social connections in their organizations" ON social_connections
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert social connections in their organizations" ON social_connections;
CREATE POLICY "Users can insert social connections in their organizations" ON social_connections
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update social connections in their organizations" ON social_connections;
CREATE POLICY "Users can update social connections in their organizations" ON social_connections
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete social connections in their organizations" ON social_connections;
CREATE POLICY "Users can delete social connections in their organizations" ON social_connections
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view subscriptions from their organizations" ON subscriptions;
CREATE POLICY "Users can view subscriptions from their organizations" ON subscriptions
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create subscriptions in their organizations" ON subscriptions;
CREATE POLICY "Users can create subscriptions in their organizations" ON subscriptions
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert subscriptions in their organizations" ON subscriptions;
CREATE POLICY "Users can insert subscriptions in their organizations" ON subscriptions
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update subscriptions in their organizations" ON subscriptions;
CREATE POLICY "Users can update subscriptions in their organizations" ON subscriptions
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RATINGS - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;
CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own ratings" ON ratings;
CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- CONVERSATIONS & MESSAGES - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update message read status" ON messages;
CREATE POLICY "Users can update message read status" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- ============================================================================
-- TELEGRAM, USAGE, BRANDING - RESTORE ORIGINAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can view telegram channels from their own organizations" ON telegram_channels;
CREATE POLICY "Users can view telegram channels from their own organizations" ON telegram_channels
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create telegram channels in their own organizations" ON telegram_channels;
CREATE POLICY "Users can create telegram channels in their own organizations" ON telegram_channels
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update telegram channels in their own organizations" ON telegram_channels;
CREATE POLICY "Users can update telegram channels in their own organizations" ON telegram_channels
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete telegram channels from their own organizations" ON telegram_channels;
CREATE POLICY "Users can delete telegram channels from their own organizations" ON telegram_channels
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view usage of their organizations" ON organization_usage;
CREATE POLICY "Users can view usage of their organizations" ON organization_usage
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert usage for their organizations" ON organization_usage;
CREATE POLICY "Users can insert usage for their organizations" ON organization_usage
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update usage of their organizations" ON organization_usage;
CREATE POLICY "Users can update usage of their organizations" ON organization_usage
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their organization's branding settings" ON branding_settings;
CREATE POLICY "Users can view their organization's branding settings" ON branding_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their organization's branding settings" ON branding_settings;
CREATE POLICY "Users can update their organization's branding settings" ON branding_settings
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view social posts for accessible posts" ON social_posts;
CREATE POLICY "Users can view social posts for accessible posts" ON social_posts
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM blog_posts 
      WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert social posts for accessible posts" ON social_posts;
CREATE POLICY "Users can insert social posts for accessible posts" ON social_posts
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT id FROM blog_posts 
      WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update social posts for accessible posts" ON social_posts;
CREATE POLICY "Users can update social posts for accessible posts" ON social_posts
  FOR UPDATE USING (
    post_id IN (
      SELECT id FROM blog_posts 
      WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid()
      )
    )
  );

