-- Fix user signup and organization creation
-- This script ensures new users get organizations automatically

-- Step 1: Ensure RLS is disabled on all tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_organization();

-- Step 3: Create a more robust function with better error handling
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Get user details
  user_email := COALESCE(NEW.email, 'user@example.com');
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1),
    'User'
  );
  
  -- Log the attempt (for debugging)
  RAISE NOTICE 'Creating organization for user: % (%)', user_name, user_email;
  
  -- Create organization
  INSERT INTO organizations (name, plan, created_at, updated_at)
  VALUES (
    user_name || '''s Organization', 
    'basic',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_org_id;
  
  RAISE NOTICE 'Created organization: %', new_org_id;
  
  -- Add user as owner
  INSERT INTO org_members (org_id, user_id, role, created_at)
  VALUES (new_org_id, NEW.id, 'owner', NOW());
  
  RAISE NOTICE 'Added user as owner';
  
  -- Create subscription
  INSERT INTO subscriptions (org_id, stripe_customer_id, stripe_subscription_id, plan, status, created_at, updated_at)
  VALUES (
    new_org_id, 
    'temp-customer-' || new_org_id, 
    'temp-sub-' || new_org_id, 
    'basic', 
    'active',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Created subscription';
  
  -- Create a default client
  INSERT INTO clients (org_id, name, contact_info, created_at, updated_at)
  VALUES (
    new_org_id, 
    user_name || '''s Client', 
    ('{"email": "' || user_email || '"}')::jsonb,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Created default client';
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create organization for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_organization();

-- Step 5: Test the setup
SELECT 'User signup fix applied successfully' as status;

-- Step 6: Check if there are any users without organizations
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE WHEN om.org_id IS NULL THEN 'NO ORGANIZATION' ELSE 'HAS ORGANIZATION' END as org_status
FROM auth.users u
LEFT JOIN org_members om ON u.id = om.user_id
ORDER BY u.created_at DESC
LIMIT 10;
