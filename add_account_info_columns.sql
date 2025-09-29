-- Add account information columns to social_connections table
-- Run this SQL in your Supabase dashboard SQL editor

ALTER TABLE social_connections 
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS account_username TEXT;

-- Add comments to explain the new fields
COMMENT ON COLUMN social_connections.account_id IS 'Platform-specific account ID (e.g., Twitter user ID, LinkedIn person ID)';
COMMENT ON COLUMN social_connections.account_name IS 'Display name of the connected account';
COMMENT ON COLUMN social_connections.account_username IS 'Username/handle of the connected account (e.g., @username)';
