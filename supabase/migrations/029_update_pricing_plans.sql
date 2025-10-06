-- Update pricing plans to new structure
-- This migration updates the pricing plans from old structure to new one

-- First, drop existing constraints
ALTER TABLE organizations 
DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Update existing organizations to new plan names BEFORE adding constraint
UPDATE organizations 
SET plan = CASE 
  WHEN plan = 'basic' THEN 'basic'
  WHEN plan = 'pro' THEN 'initiate' 
  WHEN plan = 'enterprise' THEN 'universal'
  ELSE 'basic'
END;

-- Update existing subscriptions to new plan names BEFORE adding constraint
UPDATE subscriptions 
SET plan = CASE 
  WHEN plan = 'basic' THEN 'basic'
  WHEN plan = 'pro' THEN 'initiate' 
  WHEN plan = 'enterprise' THEN 'universal'
  ELSE 'basic'
END;

-- Now add the new constraints after data is updated
ALTER TABLE organizations 
ADD CONSTRAINT organizations_plan_check 
CHECK (plan IN ('basic', 'initiate', 'transcendant', 'universal'));

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan IN ('basic', 'initiate', 'transcendant', 'universal'));

-- Create a new table for plan limits and features
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_name TEXT NOT NULL UNIQUE,
    content_packages_limit INTEGER, -- NULL means unlimited
    custom_content_limit INTEGER, -- NULL means unlimited
    bulk_generation_limit INTEGER, -- NULL means unlimited
    custom_integrations BOOLEAN DEFAULT FALSE,
    white_label BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    advanced_analytics BOOLEAN DEFAULT FALSE,
    price_monthly INTEGER NOT NULL, -- Price in cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the new plan features
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly) VALUES
('basic', 4, NULL, NULL, FALSE, FALSE, FALSE, FALSE, 4900), -- €49.00
('initiate', 8, 10, NULL, FALSE, FALSE, TRUE, FALSE, 9900), -- €99.00
('transcendant', 12, NULL, NULL, FALSE, FALSE, TRUE, TRUE, 19900), -- €199.00
('universal', NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE, 49900); -- €499.00

-- Create a table to track usage limits per organization
CREATE TABLE IF NOT EXISTS organization_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    content_packages_used INTEGER DEFAULT 0,
    custom_content_used INTEGER DEFAULT 0,
    bulk_generation_used INTEGER DEFAULT 0,
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_name ON plan_features(plan_name);
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_id ON organization_usage(org_id);

-- Enable RLS for new tables
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_features (public read access)
CREATE POLICY "Anyone can view plan features" ON plan_features
  FOR SELECT USING (true);

-- RLS Policies for organization_usage
CREATE POLICY "Users can view usage of their organizations" ON organization_usage
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update usage of their organizations" ON organization_usage
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert usage for their organizations" ON organization_usage
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create a function to check if organization can create content packages
CREATE OR REPLACE FUNCTION can_create_content_package(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan TEXT;
    packages_limit INTEGER;
    packages_used INTEGER;
BEGIN
    -- Get current plan
    SELECT plan INTO current_plan 
    FROM organizations 
    WHERE id = org_id_param;
    
    -- Get plan limits
    SELECT content_packages_limit INTO packages_limit
    FROM plan_features 
    WHERE plan_name = current_plan;
    
    -- Get current usage
    SELECT COALESCE(content_packages_used, 0) INTO packages_used
    FROM organization_usage 
    WHERE org_id = org_id_param;
    
    -- Check if unlimited (NULL limit) or under limit
    RETURN packages_limit IS NULL OR packages_used < packages_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if organization can create custom content
CREATE OR REPLACE FUNCTION can_create_custom_content(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan TEXT;
    custom_limit INTEGER;
    custom_used INTEGER;
BEGIN
    -- Get current plan
    SELECT plan INTO current_plan 
    FROM organizations 
    WHERE id = org_id_param;
    
    -- Get plan limits
    SELECT custom_content_limit INTO custom_limit
    FROM plan_features 
    WHERE plan_name = current_plan;
    
    -- Get current usage
    SELECT COALESCE(custom_content_used, 0) INTO custom_used
    FROM organization_usage 
    WHERE org_id = org_id_param;
    
    -- Check if unlimited (NULL limit) or under limit
    RETURN custom_limit IS NULL OR custom_used < custom_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if organization can do bulk generation
CREATE OR REPLACE FUNCTION can_do_bulk_generation(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan TEXT;
    bulk_limit INTEGER;
    bulk_used INTEGER;
BEGIN
    -- Get current plan
    SELECT plan INTO current_plan 
    FROM organizations 
    WHERE id = org_id_param;
    
    -- Get plan limits
    SELECT bulk_generation_limit INTO bulk_limit
    FROM plan_features 
    WHERE plan_name = current_plan;
    
    -- Get current usage
    SELECT COALESCE(bulk_generation_used, 0) INTO bulk_used
    FROM organization_usage 
    WHERE org_id = org_id_param;
    
    -- Check if unlimited (NULL limit) or under limit
    RETURN bulk_limit IS NULL OR bulk_used < bulk_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(org_id_param UUID, usage_type TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO organization_usage (org_id, content_packages_used, custom_content_used, bulk_generation_used)
    VALUES (org_id_param, 
            CASE WHEN usage_type = 'content_package' THEN 1 ELSE 0 END,
            CASE WHEN usage_type = 'custom_content' THEN 1 ELSE 0 END,
            CASE WHEN usage_type = 'bulk_generation' THEN 1 ELSE 0 END)
    ON CONFLICT (org_id) DO UPDATE SET
        content_packages_used = organization_usage.content_packages_used + 
            CASE WHEN usage_type = 'content_package' THEN 1 ELSE 0 END,
        custom_content_used = organization_usage.custom_content_used + 
            CASE WHEN usage_type = 'custom_content' THEN 1 ELSE 0 END,
        bulk_generation_used = organization_usage.bulk_generation_used + 
            CASE WHEN usage_type = 'bulk_generation' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
