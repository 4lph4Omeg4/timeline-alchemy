-- Fix search_path for all functions to prevent security vulnerabilities
-- This addresses the "Function Search Path Mutable" warnings from the database linter
-- By setting a fixed search_path, we prevent potential SQL injection attacks

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
DROP TRIGGER IF EXISTS trigger_create_default_branding ON organizations;
DROP TRIGGER IF EXISTS trigger_update_package_rating ON ratings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the functions (except those used in RLS policies)
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS create_default_branding_settings() CASCADE;
DROP FUNCTION IF EXISTS update_package_rating() CASCADE;
DROP FUNCTION IF EXISTS can_create_content_package(UUID);
DROP FUNCTION IF EXISTS can_create_custom_content(UUID);
DROP FUNCTION IF EXISTS can_do_bulk_generation(UUID);
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS is_trial_expired(UUID);
DROP FUNCTION IF EXISTS get_effective_plan(UUID);
DROP FUNCTION IF EXISTS start_trial_for_user(UUID);
DROP FUNCTION IF EXISTS convert_trial_to_basic(UUID);
DROP FUNCTION IF EXISTS get_active_images(UUID);
DROP FUNCTION IF EXISTS get_style_variants(UUID, TEXT);
-- Note: is_org_member and is_org_owner are NOT dropped because they're used in RLS policies
-- We'll use CREATE OR REPLACE instead
DROP FUNCTION IF EXISTS create_user_organization() CASCADE;

-- 1. update_conversation_timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 2. create_default_branding_settings
CREATE OR REPLACE FUNCTION create_default_branding_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO branding_settings (organization_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 3. update_package_rating
CREATE OR REPLACE FUNCTION update_package_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blog_posts
  SET 
    average_rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM ratings
      WHERE post_id = NEW.post_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE post_id = NEW.post_id
    )
  WHERE id = NEW.post_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 4. can_create_content_package
CREATE OR REPLACE FUNCTION can_create_content_package(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    packages_limit INT;
    packages_used INT;
BEGIN
    -- Get the plan's content package limit
    SELECT pf.content_packages_limit INTO packages_limit
    FROM subscriptions s
    JOIN plan_features pf ON s.plan = pf.plan_name
    WHERE s.org_id = org_id_param;
    
    -- Get current usage
    SELECT content_packages_used INTO packages_used
    FROM organization_usage
    WHERE org_id = org_id_param;
    
    -- Check if unlimited (NULL limit) or under limit
    RETURN packages_limit IS NULL OR packages_used < packages_limit;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 5. can_create_custom_content
CREATE OR REPLACE FUNCTION can_create_custom_content(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    custom_limit INT;
    custom_used INT;
BEGIN
    -- Get the plan's custom content limit
    SELECT pf.custom_content_limit INTO custom_limit
    FROM subscriptions s
    JOIN plan_features pf ON s.plan = pf.plan_name
    WHERE s.org_id = org_id_param;
    
    -- Get current usage
    SELECT custom_content_used INTO custom_used
    FROM organization_usage
    WHERE org_id = org_id_param;
    
    -- Check if unlimited (NULL limit) or under limit
    RETURN custom_limit IS NULL OR custom_used < custom_limit;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 6. can_do_bulk_generation
CREATE OR REPLACE FUNCTION can_do_bulk_generation(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    bulk_limit INT;
    bulk_used INT;
BEGIN
    -- Get the plan's bulk generation limit
    SELECT pf.bulk_generation_limit INTO bulk_limit
    FROM subscriptions s
    JOIN plan_features pf ON s.plan = pf.plan_name
    WHERE s.org_id = org_id_param;
    
    -- Get current usage
    SELECT bulk_generation_used INTO bulk_used
    FROM organization_usage
    WHERE org_id = org_id_param;
    
    -- Check if unlimited (NULL limit) or under limit
    RETURN bulk_limit IS NULL OR bulk_used < bulk_limit;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 7. increment_usage
CREATE OR REPLACE FUNCTION increment_usage(org_id_param UUID, usage_type TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE organization_usage
    SET 
        content_packages_used = organization_usage.content_packages_used + 
            CASE WHEN usage_type = 'content_package' THEN 1 ELSE 0 END,
        custom_content_used = organization_usage.custom_content_used + 
            CASE WHEN usage_type = 'custom_content' THEN 1 ELSE 0 END,
        bulk_generation_used = organization_usage.bulk_generation_used + 
            CASE WHEN usage_type = 'bulk_generation' THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE org_id = org_id_param;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 8. is_trial_expired
CREATE OR REPLACE FUNCTION is_trial_expired(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT trial_end_date INTO trial_end
    FROM subscriptions
    WHERE org_id = org_id_param 
    AND is_trial = TRUE;
    
    IF trial_end IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN trial_end < NOW();
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 9. get_effective_plan
CREATE OR REPLACE FUNCTION get_effective_plan(org_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    subscription_plan TEXT;
    is_trial_active BOOLEAN;
BEGIN
    SELECT plan, is_trial INTO subscription_plan, is_trial_active
    FROM subscriptions
    WHERE org_id = org_id_param;
    
    -- If on trial and not expired, return trial
    IF is_trial_active AND NOT is_trial_expired(org_id_param) THEN
        RETURN 'trial';
    END IF;
    
    RETURN subscription_plan;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 10. start_trial_for_user
CREATE OR REPLACE FUNCTION start_trial_for_user(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Get user's organization
    SELECT org_id INTO user_org_id
    FROM org_members
    WHERE user_id = user_id_param AND role IN ('owner', 'admin')
    LIMIT 1;
    
    IF user_org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found for user';
    END IF;
    
    -- Update subscription to trial
    UPDATE subscriptions
    SET 
        is_trial = TRUE,
        trial_start_date = NOW(),
        trial_end_date = NOW() + INTERVAL '14 days',
        updated_at = NOW()
    WHERE org_id = user_org_id;
    
    -- Initialize usage tracking
    INSERT INTO organization_usage (org_id, content_packages_used, custom_content_used, bulk_generation_used, reset_date)
    VALUES (user_org_id, 0, 0, 0, NOW() + INTERVAL '1 month')
    ON CONFLICT (org_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 11. convert_trial_to_basic
CREATE OR REPLACE FUNCTION convert_trial_to_basic(org_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions
    SET 
        plan = 'basic',
        is_trial = FALSE,
        trial_start_date = NULL,
        trial_end_date = NULL,
        updated_at = NOW()
    WHERE org_id = org_id_param;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 12. get_active_images (if exists)
CREATE OR REPLACE FUNCTION get_active_images(post_id_param UUID)
RETURNS TABLE(id UUID, url TEXT, prompt TEXT, style TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.url, i.prompt, i.style
    FROM images i
    WHERE i.post_id = post_id_param 
    AND i.is_active = TRUE
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 13. get_style_variants (if exists)
CREATE OR REPLACE FUNCTION get_style_variants(post_id_param UUID, style_param TEXT)
RETURNS TABLE(id UUID, url TEXT, prompt TEXT, variant_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.url, i.prompt, i.variant_type
    FROM images i
    WHERE i.post_id = post_id_param 
    AND i.style = style_param
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 14. is_org_member (used in RLS policies - using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION is_org_member(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = user_uuid AND org_id = org_uuid
  );
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 15. is_org_owner (used in RLS policies - using CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION is_org_owner(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = user_uuid AND org_id = org_uuid AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- 16. create_user_organization
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization for new user
  INSERT INTO organizations (name, plan)
  VALUES (NEW.email || '''s Organization', 'basic')
  RETURNING id INTO new_org_id;
  
  -- Add user as owner of the organization
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  -- Create a default subscription
  INSERT INTO subscriptions (org_id, stripe_customer_id, stripe_subscription_id, plan, status)
  VALUES (new_org_id, 'temp-' || new_org_id, 'temp-sub-' || new_org_id, 'basic', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public, pg_temp
SECURITY DEFINER;

-- Recreate the triggers that were dropped
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

CREATE TRIGGER trigger_create_default_branding
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_branding_settings();

CREATE TRIGGER trigger_update_package_rating
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_rating();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_organization();

-- Add comments explaining the security fix
COMMENT ON FUNCTION update_conversation_timestamp() IS 'Trigger function to update conversation timestamps. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION create_default_branding_settings() IS 'Trigger function to create default branding on org creation. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION update_package_rating() IS 'Trigger function to update package ratings. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION can_create_content_package(UUID) IS 'Check if organization can create content packages. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION can_create_custom_content(UUID) IS 'Check if organization can create custom content. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION can_do_bulk_generation(UUID) IS 'Check if organization can do bulk generation. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION increment_usage(UUID, TEXT) IS 'Increment usage counters. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION is_trial_expired(UUID) IS 'Check if trial is expired. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION get_effective_plan(UUID) IS 'Get effective plan considering trial status. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION start_trial_for_user(UUID) IS 'Start trial for user. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION convert_trial_to_basic(UUID) IS 'Convert trial to basic plan. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION get_active_images(UUID) IS 'Get active images for post. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION get_style_variants(UUID, TEXT) IS 'Get style variants for post. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION is_org_member(UUID, UUID) IS 'Check if user is organization member. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION is_org_owner(UUID, UUID) IS 'Check if user is organization owner. SET search_path prevents SQL injection.';
COMMENT ON FUNCTION create_user_organization() IS 'Trigger to create organization for new users. SET search_path prevents SQL injection.';

