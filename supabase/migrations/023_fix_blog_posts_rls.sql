-- Fix blog_posts RLS policies to allow clients to see their scheduled posts
-- This ensures that when clients schedule admin packages, they can see the resulting posts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view posts from their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can create posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can update posts in their organizations" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete posts in their organizations" ON blog_posts;

-- New policies that allow users to see posts from organizations they belong to
-- This includes both their own organization and the Admin Organization (if they're a client)

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

-- Additional policy to allow users to see admin packages (created_by_admin = true)
-- This allows clients to see and schedule admin packages
CREATE POLICY "Users can view admin packages" ON blog_posts
  FOR SELECT USING (
    created_by_admin = true AND
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );
