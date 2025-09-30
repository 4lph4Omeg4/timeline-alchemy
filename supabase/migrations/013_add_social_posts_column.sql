-- Add social_posts column to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN social_posts JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN blog_posts.social_posts IS 'Generated social media posts for different platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok)';
