-- Add rating system for packages
-- This migration adds the ability for users to rate and review content packages

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- One rating per user per package
);

-- Add rating columns to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_post_id ON ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
CREATE INDEX IF NOT EXISTS idx_blog_posts_average_rating ON blog_posts(average_rating);
CREATE INDEX IF NOT EXISTS idx_blog_posts_rating_count ON blog_posts(rating_count);

-- Create function to update average rating when a rating is added/updated/deleted
CREATE OR REPLACE FUNCTION update_package_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the blog_posts table with new average rating and count
  UPDATE blog_posts 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0.00) 
      FROM ratings 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM ratings 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update ratings
CREATE TRIGGER trigger_update_rating_on_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_rating();

CREATE TRIGGER trigger_update_rating_on_update
  AFTER UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_rating();

CREATE TRIGGER trigger_update_rating_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_rating();

-- Enable RLS on ratings table
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ratings
-- Users can view all ratings
CREATE POLICY "Users can view all ratings" ON ratings
  FOR SELECT USING (true);

-- Users can only insert their own ratings
CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own ratings
CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE ratings IS 'User ratings and reviews for content packages';
COMMENT ON COLUMN ratings.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN ratings.review_text IS 'Optional text review';
COMMENT ON COLUMN blog_posts.average_rating IS 'Average rating across all user ratings';
COMMENT ON COLUMN blog_posts.rating_count IS 'Total number of ratings received';
