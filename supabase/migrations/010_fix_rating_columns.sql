-- Fix rating columns if they don't exist
-- This migration ensures the rating columns are properly added to blog_posts

-- Add rating columns to blog_posts table if they don't exist
DO $$ 
BEGIN
    -- Add average_rating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE blog_posts 
        ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
    END IF;

    -- Add rating_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'rating_count'
    ) THEN
        ALTER TABLE blog_posts 
        ADD COLUMN rating_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_blog_posts_average_rating ON blog_posts(average_rating);
CREATE INDEX IF NOT EXISTS idx_blog_posts_rating_count ON blog_posts(rating_count);

-- Update existing packages to have default rating values
UPDATE blog_posts 
SET 
    average_rating = 4.5,
    rating_count = 1
WHERE average_rating IS NULL OR average_rating = 0;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.average_rating IS 'Average rating across all user ratings (0.00 to 5.00)';
COMMENT ON COLUMN blog_posts.rating_count IS 'Total number of ratings received';
