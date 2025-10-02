-- Fix RLS policy for social_connections
-- Clients should only see their own organization's social connections, not admin's

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view social connections from their organizations" ON social_connections;

-- Create new policy that excludes admin organization for clients
CREATE POLICY "Users can view social connections from their own organizations" ON social_connections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'  -- Only owners can see their org's social connections
    )
  );

-- Allow clients to see admin packages but not admin social connections
-- This is handled by the packages system, not social connections
