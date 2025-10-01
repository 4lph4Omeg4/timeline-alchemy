-- Add Discord and Reddit support to social_connections table
ALTER TABLE social_connections 
DROP CONSTRAINT IF EXISTS social_connections_platform_check;

ALTER TABLE social_connections 
ADD CONSTRAINT social_connections_platform_check 
CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'discord', 'reddit'));

-- Update the unique constraint to allow multiple accounts per platform
ALTER TABLE social_connections 
DROP CONSTRAINT IF EXISTS social_connections_org_id_platform_key;

-- Add comment to document the supported platforms
COMMENT ON COLUMN social_connections.platform IS 'Social media platform: twitter, linkedin, instagram, facebook, youtube, discord, reddit';
