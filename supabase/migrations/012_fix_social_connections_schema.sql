-- Update social_connections table to support multiple accounts per platform
-- Remove the unique constraint and add account_id for differentiation

-- First, drop the existing unique constraint
ALTER TABLE social_connections DROP CONSTRAINT IF EXISTS social_connections_org_id_platform_key;

-- Add account_id column to differentiate between multiple accounts
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS account_id VARCHAR(255);

-- Add account_name column for user-friendly display
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);

-- Create a new unique constraint that allows multiple accounts per platform
-- but prevents duplicate account_id within the same org/platform combination
ALTER TABLE social_connections ADD CONSTRAINT social_connections_org_platform_account_unique 
UNIQUE (org_id, platform, account_id);

-- Update existing records to have account_id (use platform as default)
UPDATE social_connections 
SET account_id = platform || '_' || EXTRACT(EPOCH FROM created_at)::text
WHERE account_id IS NULL;

-- Update account_name for existing records
UPDATE social_connections 
SET account_name = CASE 
  WHEN platform = 'twitter' THEN 'Twitter Account'
  WHEN platform = 'linkedin' THEN 'LinkedIn Account'
  ELSE platform || ' Account'
END
WHERE account_name IS NULL;

-- Make account_id NOT NULL after setting default values
ALTER TABLE social_connections ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE social_connections ALTER COLUMN account_name SET NOT NULL;
