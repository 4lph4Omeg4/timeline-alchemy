-- Create telegram_channels table for managing Telegram channels per organization
CREATE TABLE IF NOT EXISTS telegram_channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel_id VARCHAR(255) NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  bot_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate channels per org
ALTER TABLE telegram_channels 
ADD CONSTRAINT telegram_channels_org_channel_unique 
UNIQUE (org_id, channel_id);

-- Add index for faster queries
CREATE INDEX idx_telegram_channels_org_id ON telegram_channels(org_id);

-- Add comment to document the table
COMMENT ON TABLE telegram_channels IS 'Telegram channels managed by organizations for automated posting';
