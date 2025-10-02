-- Add parent_post_id column to blog_posts table
-- This allows linking social media posts to their parent blog post

ALTER TABLE blog_posts 
ADD COLUMN parent_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE;

-- Add social_platform column to identify which platform the post is for
ALTER TABLE blog_posts 
ADD COLUMN social_platform TEXT CHECK (social_platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'));

-- Add index for better performance when querying by parent_post_id
CREATE INDEX idx_blog_posts_parent_post_id ON blog_posts(parent_post_id);

-- Add index for better performance when querying by social_platform
CREATE INDEX idx_blog_posts_social_platform ON blog_posts(social_platform);
