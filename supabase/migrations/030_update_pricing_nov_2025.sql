-- Update pricing plans to new structure (Nov 2025)
-- Basic: €10, 5 packages
-- Initiate: €29, 50 packages
-- Transcendant: €199, Unlimited everything
-- Universal: Removed (migrated to Transcendant)

-- 1. Update existing 'universal' plans to 'transcendant'
UPDATE organizations 
SET plan = 'transcendant' 
WHERE plan = 'universal';

UPDATE subscriptions 
SET plan = 'transcendant' 
WHERE plan = 'universal';

-- 2. Update plan_features with new limits and prices
-- We'll use UPSERT (INSERT ... ON CONFLICT) to update existing rows

-- Basic: €10 (1000 cents), 5 packages
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly)
VALUES ('basic', 5, 0, 0, FALSE, FALSE, FALSE, FALSE, 1000)
ON CONFLICT (plan_name) DO UPDATE SET
    content_packages_limit = EXCLUDED.content_packages_limit,
    custom_content_limit = EXCLUDED.custom_content_limit,
    bulk_generation_limit = EXCLUDED.bulk_generation_limit,
    price_monthly = EXCLUDED.price_monthly;

-- Initiate: €29 (2900 cents), 50 packages
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly)
VALUES ('initiate', 50, 10, 0, FALSE, FALSE, TRUE, FALSE, 2900)
ON CONFLICT (plan_name) DO UPDATE SET
    content_packages_limit = EXCLUDED.content_packages_limit,
    custom_content_limit = EXCLUDED.custom_content_limit,
    bulk_generation_limit = EXCLUDED.bulk_generation_limit,
    price_monthly = EXCLUDED.price_monthly;

-- Transcendant: €199 (19900 cents), Unlimited everything (was Universal features)
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly)
VALUES ('transcendant', NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE, 19900)
ON CONFLICT (plan_name) DO UPDATE SET
    content_packages_limit = EXCLUDED.content_packages_limit,
    custom_content_limit = EXCLUDED.custom_content_limit,
    bulk_generation_limit = EXCLUDED.bulk_generation_limit,
    custom_integrations = EXCLUDED.custom_integrations,
    white_label = EXCLUDED.white_label,
    priority_support = EXCLUDED.priority_support,
    advanced_analytics = EXCLUDED.advanced_analytics,
    price_monthly = EXCLUDED.price_monthly;

-- 3. Remove Universal from plan_features
DELETE FROM plan_features WHERE plan_name = 'universal';

-- 4. Update constraints
ALTER TABLE organizations 
DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE organizations 
ADD CONSTRAINT organizations_plan_check 
CHECK (plan IN ('basic', 'initiate', 'transcendant'));

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan IN ('basic', 'initiate', 'transcendant'));
