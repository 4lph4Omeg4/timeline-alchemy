-- Add RLS policies for user_clients table
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;

-- Users can view their own client relationships
CREATE POLICY "Users can view their own client relationships" ON user_clients
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own client relationships
CREATE POLICY "Users can create their own client relationships" ON user_clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own client relationships
CREATE POLICY "Users can update their own client relationships" ON user_clients
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own client relationships
CREATE POLICY "Users can delete their own client relationships" ON user_clients
  FOR DELETE USING (user_id = auth.uid());

-- Organization owners can manage client relationships for their organization
CREATE POLICY "Organization owners can manage client relationships" ON user_clients
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      INNER JOIN org_members om ON c.org_id = om.org_id
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
  );
