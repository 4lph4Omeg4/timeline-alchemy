-- Add trial support to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_trial BOOLEAN DEFAULT FALSE;

-- Add trial plan to plan_features table
INSERT INTO plan_features (
  plan_name,
  content_packages_limit,
  custom_content_limit,
  bulk_generation_limit,
  custom_integrations,
  white_label,
  priority_support,
  advanced_analytics,
  price_monthly
) VALUES (
  'trial',
  2, -- 2 content packages during trial
  5, -- 5 custom content generations during trial
  1, -- 1 bulk generation during trial
  false, -- No custom integrations
  false, -- No white label
  false, -- No priority support
  false, -- No advanced analytics
  0 -- Free trial
);

-- Add trial plan to PlanType constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check 
  CHECK (plan IN ('trial', 'basic', 'initiate', 'transcendant', 'universal'));

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
  CHECK (plan IN ('trial', 'basic', 'initiate', 'transcendant', 'universal'));

-- Create function to check if trial has expired
CREATE OR REPLACE FUNCTION is_trial_expired(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT s.trial_end_date
  INTO trial_end_date
  FROM subscriptions s
  WHERE s.org_id = org_id_param
    AND s.is_trial = true
    AND s.status = 'active';
  
  IF trial_end_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN trial_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get effective plan (trial or actual plan)
CREATE OR REPLACE FUNCTION get_effective_plan(org_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  current_plan TEXT;
  is_trial_active BOOLEAN;
BEGIN
  SELECT s.plan, s.is_trial
  INTO current_plan, is_trial_active
  FROM subscriptions s
  WHERE s.org_id = org_id_param
    AND s.status = 'active';
  
  IF current_plan IS NULL THEN
    RETURN 'basic';
  END IF;
  
  -- If trial is active and not expired, return trial
  IF is_trial_active AND NOT is_trial_expired(org_id_param) THEN
    RETURN 'trial';
  END IF;
  
  -- If trial is expired, return basic plan
  IF is_trial_active AND is_trial_expired(org_id_param) THEN
    RETURN 'basic';
  END IF;
  
  -- Return the actual plan
  RETURN current_plan;
END;
$$ LANGUAGE plpgsql;

-- Create function to start trial for new user
CREATE OR REPLACE FUNCTION start_trial_for_user(org_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_start TIMESTAMP WITH TIME ZONE;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  trial_start := NOW();
  trial_end := trial_start + INTERVAL '14 days';
  
  -- Update subscription to trial
  UPDATE subscriptions
  SET 
    plan = 'trial',
    is_trial = true,
    trial_start_date = trial_start,
    trial_end_date = trial_end,
    status = 'active'
  WHERE org_id = org_id_param;
  
  -- Update organization plan
  UPDATE organizations
  SET plan = 'trial'
  WHERE id = org_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to convert trial to basic plan
CREATE OR REPLACE FUNCTION convert_trial_to_basic(org_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update subscription to basic
  UPDATE subscriptions
  SET 
    plan = 'basic',
    is_trial = false,
    trial_start_date = NULL,
    trial_end_date = NULL
  WHERE org_id = org_id_param;
  
  -- Update organization plan
  UPDATE organizations
  SET plan = 'basic'
  WHERE id = org_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for trial functions
GRANT EXECUTE ON FUNCTION is_trial_expired(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_effective_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_trial_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_trial_to_basic(UUID) TO authenticated;
