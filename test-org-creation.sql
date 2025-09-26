-- TEST: Check if we can create organizations and subscriptions
-- Run this in Supabase SQL Editor to test

-- Test 1: Check if we can insert into organizations
INSERT INTO organizations (name, plan) 
VALUES ('Test Organization', 'basic') 
RETURNING *;

-- Test 2: Check if we can insert into subscriptions  
INSERT INTO subscriptions (org_id, stripe_customer_id, stripe_subscription_id, plan, status)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
  'test-customer-123',
  'test-sub-123', 
  'basic',
  'active'
)
RETURNING *;

-- Test 3: Check if we can insert into org_members
INSERT INTO org_members (org_id, user_id, role)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1),
  '7dd7293d-467f-4594-877e-e5740c15bde1', -- Replace with actual user ID
  'owner'
)
RETURNING *;

-- Clean up test data
DELETE FROM org_members WHERE org_id = (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1);
DELETE FROM subscriptions WHERE org_id = (SELECT id FROM organizations WHERE name = 'Test Organization' LIMIT 1);
DELETE FROM organizations WHERE name = 'Test Organization';
