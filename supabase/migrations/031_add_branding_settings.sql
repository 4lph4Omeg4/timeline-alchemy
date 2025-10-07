-- Add branding settings table
CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'bottom-right' CHECK (logo_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
  logo_opacity DECIMAL(3,2) DEFAULT 0.7 CHECK (logo_opacity >= 0 AND logo_opacity <= 1),
  logo_size DECIMAL(3,2) DEFAULT 0.1 CHECK (logo_size >= 0.05 AND logo_size <= 0.3),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Add RLS policies
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Policy for organization members to view their branding settings
CREATE POLICY "Users can view their organization's branding settings" ON branding_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = branding_settings.organization_id 
      AND organizations.id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy for organization members to update their branding settings
CREATE POLICY "Users can update their organization's branding settings" ON branding_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = branding_settings.organization_id 
      AND organizations.id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to automatically create branding settings for new organizations
CREATE OR REPLACE FUNCTION create_default_branding_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO branding_settings (organization_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default branding settings when organization is created
CREATE TRIGGER create_branding_settings_trigger
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_branding_settings();
