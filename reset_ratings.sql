-- 🔄 RATING SYSTEM RESET SCRIPT 🔄
-- This script safely resets all ratings in the database

-- ========================================
-- 1. BACKUP CURRENT RATINGS (OPTIONAL)
-- ========================================
-- Uncomment these lines if you want to backup before resetting
-- CREATE TABLE ratings_backup AS SELECT * FROM ratings;
-- CREATE TABLE blog_posts_backup AS SELECT id, title, average_rating, rating_count FROM blog_posts;

-- ========================================
-- 2. RESET ALL RATINGS
-- ========================================

-- Reset all blog post rating data
UPDATE blog_posts 
SET 
  average_rating = 0,
  rating_count = 0,
  updated_at = NOW()
WHERE average_rating > 0 OR rating_count > 0;

-- Remove all individual ratings
DELETE FROM ratings;

-- ========================================
-- 3. VERIFICATION
-- ========================================
-- Check that all ratings are reset
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN average_rating > 0 THEN 1 END) as posts_with_ratings,
  COUNT(CASE WHEN rating_count > 0 THEN 1 END) as posts_with_rating_counts,
  SUM(average_rating) as total_average_rating,
  SUM(rating_count) as total_rating_count
FROM blog_posts;

-- Check ratings table is empty
SELECT COUNT(*) as remaining_ratings FROM ratings;

-- ========================================
-- 4. SAMPLE POSTS TO VERIFY
-- ========================================
-- Show a few sample posts to verify reset
SELECT 
  id,
  title,
  average_rating,
  rating_count,
  created_at
FROM blog_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- 5. RESTORE FROM BACKUP (IF NEEDED)
-- ========================================
-- If you need to restore ratings later, uncomment these lines:
-- INSERT INTO ratings SELECT * FROM ratings_backup;
-- UPDATE blog_posts SET 
--   average_rating = b.average_rating,
--   rating_count = b.rating_count
-- FROM blog_posts_backup b 
-- WHERE blog_posts.id = b.id;
-- DROP TABLE ratings_backup;
-- DROP TABLE blog_posts_backup;
