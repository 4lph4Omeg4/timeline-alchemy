-- Update plan limits and features (Nov 2025 Update 2)
-- Basic: 5x usage (custom content & bulk)
-- Initiate: 50x usage (custom content & bulk), Branding Enabled
-- Transcendant: Unlimited, Branding Enabled

-- 1. Update Basic Plan
-- Set custom_content_limit and bulk_generation_limit to 5
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly)
VALUES ('basic', 5, 5, 5, FALSE, FALSE, FALSE, FALSE, 1000)
ON CONFLICT (plan_name) DO UPDATE SET
    custom_content_limit = EXCLUDED.custom_content_limit,
    bulk_generation_limit = EXCLUDED.bulk_generation_limit;

-- 2. Update Initiate Plan
-- Set custom_content_limit and bulk_generation_limit to 50
-- Enable white_label (branding)
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly)
VALUES ('initiate', 50, 50, 50, FALSE, TRUE, TRUE, FALSE, 2900)
ON CONFLICT (plan_name) DO UPDATE SET
    custom_content_limit = EXCLUDED.custom_content_limit,
    bulk_generation_limit = EXCLUDED.bulk_generation_limit,
    white_label = EXCLUDED.white_label;

-- 3. Update Transcendant Plan
-- Ensure everything is unlimited (NULL) and features enabled
INSERT INTO plan_features (plan_name, content_packages_limit, custom_content_limit, bulk_generation_limit, custom_integrations, white_label, priority_support, advanced_analytics, price_monthly)
VALUES ('transcendant', NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE, 19900)
ON CONFLICT (plan_name) DO UPDATE SET
    white_label = TRUE;
