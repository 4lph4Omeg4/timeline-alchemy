-- Add client_id to blog_posts table for admin-created packages
ALTER TABLE blog_posts ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE blog_posts ADD COLUMN created_by_admin BOOLEAN DEFAULT FALSE;

-- Add client_id to images table for admin-created packages
ALTER TABLE images ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_blog_posts_client_id ON blog_posts(client_id);
CREATE INDEX idx_blog_posts_created_by_admin ON blog_posts(created_by_admin);
CREATE INDEX idx_images_client_id ON images(client_id);
