-- Check current trial bulk generation usage
-- Run this to see current usage for trial organizations

-- 1. Check trial organizations and their usage
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.plan,
  s.is_trial,
  s.trial_end_date,
  u.bulk_generation_used,
  pf.bulk_generation_limit,
  CASE 
    WHEN s.trial_end_date < NOW() THEN 'EXPIRED'
    WHEN u.bulk_generation_used >= pf.bulk_generation_limit THEN 'LIMIT REACHED'
    ELSE 'AVAILABLE'
  END as status
FROM organizations o
LEFT JOIN subscriptions s ON o.id = s.org_id
LEFT JOIN organization_usage u ON o.id = u.org_id
LEFT JOIN plan_features pf ON o.plan = pf.plan_name
WHERE o.plan = 'trial' OR s.is_trial = true;

-- 2. Check plan_features for trial plan
SELECT * FROM plan_features WHERE plan_name = 'trial';

-- 3. OPTIONAL: Reset bulk generation usage for a specific trial organization
-- Uncomment and replace <ORG_ID> with actual organization ID if needed
-- UPDATE organization_usage 
-- SET bulk_generation_used = 0 
-- WHERE org_id = '<ORG_ID>' 
-- AND EXISTS (
--   SELECT 1 FROM organizations WHERE id = '<ORG_ID>' AND plan = 'trial'
-- );

-- 4. OPTIONAL: Set bulk generation usage to 1 for a specific trial organization
-- (Use this if they already used 1 and shouldn't be able to use more)
-- UPDATE organization_usage 
-- SET bulk_generation_used = 1 
-- WHERE org_id = '<ORG_ID>' 
-- AND EXISTS (
--   SELECT 1 FROM organizations WHERE id = '<ORG_ID>' AND plan = 'trial'
-- );

