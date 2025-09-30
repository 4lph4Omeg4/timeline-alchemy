-- Add excerpt and social_posts columns to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN excerpt TEXT,
ADD COLUMN social_posts JSONB;

-- Add comments to explain the columns
COMMENT ON COLUMN blog_posts.excerpt IS 'Short summary/excerpt of the blog post content';
COMMENT ON COLUMN blog_posts.social_posts IS 'Generated social media posts for different platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok)';
