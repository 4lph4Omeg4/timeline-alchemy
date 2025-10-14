-- Backfill created_by_user_id for existing blog posts
-- This links posts to their creators for the messaging system

-- For posts in the Admin Organization (created by admin user)
UPDATE blog_posts
SET created_by_user_id = (
  SELECT user_id 
  FROM org_members 
  WHERE org_id = blog_posts.org_id 
  AND role = 'admin'
  LIMIT 1
)
WHERE org_id = 'e6c0db74-03ee-4bb3-b08d-d94512efab91' -- Admin Organization
AND created_by_user_id IS NULL;

-- For posts in client organizations (created by owner)
UPDATE blog_posts
SET created_by_user_id = (
  SELECT user_id 
  FROM org_members 
  WHERE org_id = blog_posts.org_id 
  AND role = 'owner'
  LIMIT 1
)
WHERE org_id != 'e6c0db74-03ee-4bb3-b08d-d94512efab91' -- Not Admin Organization
AND created_by_user_id IS NULL;

-- Verify the update
SELECT 
  bp.id,
  bp.title,
  bp.created_by_user_id,
  o.name as org_name,
  u.email as creator_email
FROM blog_posts bp
LEFT JOIN organizations o ON bp.org_id = o.id
LEFT JOIN auth.users u ON bp.created_by_user_id = u.id
ORDER BY bp.created_at DESC
LIMIT 20;

