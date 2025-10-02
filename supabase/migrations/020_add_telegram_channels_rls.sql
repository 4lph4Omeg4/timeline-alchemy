-- Add RLS policies for telegram_channels table
-- Users can only see/manage channels from their own organizations

-- Enable RLS on telegram_channels table
ALTER TABLE telegram_channels ENABLE ROW LEVEL SECURITY;

-- Users can view channels from their own organizations
CREATE POLICY "Users can view telegram channels from their own organizations" ON telegram_channels
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Users can create channels in their own organizations
CREATE POLICY "Users can create telegram channels in their own organizations" ON telegram_channels
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Users can update channels in their own organizations
CREATE POLICY "Users can update telegram channels in their own organizations" ON telegram_channels
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Users can delete channels from their own organizations
CREATE POLICY "Users can delete telegram channels from their own organizations" ON telegram_channels
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
