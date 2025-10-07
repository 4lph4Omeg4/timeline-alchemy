-- Update subscription to trial plan
-- Subscription ID: 2288c6f7-f23c-4809-a618-24bc2c06d87c

-- First, let's see the current state
SELECT 
  id,
  org_id,
  plan,
  status,
  trial_start_date,
  trial_end_date,
  stripe_customer_id,
  stripe_subscription_id
FROM subscriptions 
WHERE id = '2288c6f7-f23c-4809-a618-24bc2c06d87c';

-- Update to trial plan with 14-day trial period
-- Using 'active' status since 'trialing' is not in the check constraint
UPDATE subscriptions
SET 
  plan = 'trial',
  status = 'active',
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '14 days',
  updated_at = NOW()
WHERE id = '2288c6f7-f23c-4809-a618-24bc2c06d87c';

-- Verify the update
SELECT 
  id,
  org_id,
  plan,
  status,
  trial_start_date,
  trial_end_date,
  stripe_customer_id,
  stripe_subscription_id,
  updated_at
FROM subscriptions 
WHERE id = '2288c6f7-f23c-4809-a618-24bc2c06d87c';

