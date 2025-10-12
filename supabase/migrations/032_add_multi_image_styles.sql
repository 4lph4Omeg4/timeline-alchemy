-- Add multi-image support with style variants
-- This allows 3 images per post with different styles and prompts

-- Add new columns to images table
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS variant_type TEXT CHECK (variant_type IN ('original', 'final')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS prompt_number INTEGER CHECK (prompt_number >= 1 AND prompt_number <= 3),
ADD COLUMN IF NOT EXISTS style_group TEXT; -- Groups images from same generation batch

-- Add comments for documentation
COMMENT ON COLUMN images.style IS 'Visual style of the image (e.g., photorealistic, digital_art, minimalist)';
COMMENT ON COLUMN images.variant_type IS 'Whether this is an original style variant or final regenerated version';
COMMENT ON COLUMN images.is_active IS 'Whether this image is currently active for the post';
COMMENT ON COLUMN images.prompt_number IS 'Which of the 3 prompts this image represents (1, 2, or 3)';
COMMENT ON COLUMN images.style_group IS 'UUID to group images from the same generation batch';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_images_post_id_active ON images(post_id, is_active);
CREATE INDEX IF NOT EXISTS idx_images_style_group ON images(style_group);
CREATE INDEX IF NOT EXISTS idx_images_variant_type ON images(variant_type);

-- Update existing images to have default values
UPDATE images 
SET 
  variant_type = 'final',
  is_active = true,
  prompt_number = 1,
  style = 'photorealistic'
WHERE variant_type IS NULL;

-- Create function to get active images for a post
CREATE OR REPLACE FUNCTION get_active_images(post_id_param UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  prompt TEXT,
  style TEXT,
  prompt_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.url,
    i.prompt,
    i.style,
    i.prompt_number
  FROM images i
  WHERE i.post_id = post_id_param
    AND i.is_active = true
    AND i.variant_type = 'final'
  ORDER BY i.prompt_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all style variants for a post
CREATE OR REPLACE FUNCTION get_style_variants(post_id_param UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  prompt TEXT,
  style TEXT,
  variant_type TEXT,
  prompt_number INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.url,
    i.prompt,
    i.style,
    i.variant_type,
    i.prompt_number,
    i.is_active
  FROM images i
  WHERE i.post_id = post_id_param
  ORDER BY i.variant_type, i.prompt_number, i.style;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_style_variants(UUID) TO authenticated;

