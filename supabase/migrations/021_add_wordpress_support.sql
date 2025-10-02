-- Add WordPress support to social_connections table
-- Add columns for WordPress site credentials

ALTER TABLE social_connections 
ADD COLUMN IF NOT EXISTS site_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS password VARCHAR(500);

-- Update the platform check constraint to include wordpress
ALTER TABLE social_connections 
DROP CONSTRAINT IF EXISTS social_connections_platform_check;

ALTER TABLE social_connections 
ADD CONSTRAINT social_connections_platform_check 
CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'discord', 'reddit', 'telegram', 'wordpress'));

-- Add comment to document the new columns
COMMENT ON COLUMN social_connections.site_url IS 'WordPress site URL (e.g., https://example.com)';
COMMENT ON COLUMN social_connections.username IS 'WordPress username for API authentication';
COMMENT ON COLUMN social_connections.password IS 'WordPress password or application password for API authentication';
