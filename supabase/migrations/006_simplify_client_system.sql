-- Simplify client system by removing unused user_clients relationships
-- Since we're making all packages available to all clients, we don't need the complex assignment system

-- Drop the user_clients table (no longer needed)
DROP TABLE IF EXISTS user_clients CASCADE;

-- Remove client_id from blog_posts (packages are now available to all users in the organization)
ALTER TABLE blog_posts DROP COLUMN IF EXISTS client_id;

-- Remove client_id from images (images are now available to all users in the organization)
ALTER TABLE images DROP COLUMN IF EXISTS client_id;

-- Drop related indexes
DROP INDEX IF EXISTS idx_blog_posts_client_id;
DROP INDEX IF EXISTS idx_blog_posts_created_by_admin;
DROP INDEX IF EXISTS idx_images_client_id;

-- Note: We keep the clients table and created_by_admin column as they're still useful for:
-- 1. Tracking which packages were created by admins vs users
-- 2. Client management for admin purposes
-- 3. Future potential features
