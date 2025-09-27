-- STEP 3: Create simple, non-recursive policies
-- Run this after Step 2

-- Organizations
CREATE POLICY "organizations_read" ON organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "organizations_insert" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "organizations_update" ON organizations FOR UPDATE TO authenticated USING (true);

-- Org Members
CREATE POLICY "org_members_read" ON org_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_members_insert" ON org_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "org_members_delete" ON org_members FOR DELETE TO authenticated USING (true);

-- Clients
CREATE POLICY "clients_read" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated USING (true);

-- User Clients
CREATE POLICY "user_clients_read" ON user_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_clients_insert" ON user_clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_clients_delete" ON user_clients FOR DELETE TO authenticated USING (true);

-- Blog Posts
CREATE POLICY "blog_posts_read" ON blog_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "blog_posts_insert" ON blog_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "blog_posts_update" ON blog_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "blog_posts_delete" ON blog_posts FOR DELETE TO authenticated USING (true);

-- Images
CREATE POLICY "images_read" ON images FOR SELECT TO authenticated USING (true);
CREATE POLICY "images_insert" ON images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "images_delete" ON images FOR DELETE TO authenticated USING (true);

-- Social Connections
CREATE POLICY "social_connections_read" ON social_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "social_connections_insert" ON social_connections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "social_connections_update" ON social_connections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "social_connections_delete" ON social_connections FOR DELETE TO authenticated USING (true);

-- Subscriptions
CREATE POLICY "subscriptions_read" ON subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE TO authenticated USING (true);
