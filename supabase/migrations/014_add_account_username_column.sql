-- Add account_username column to social_connections table
ALTER TABLE social_connections 
ADD COLUMN account_username TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN social_connections.account_username IS 'Username for the connected social media account';
