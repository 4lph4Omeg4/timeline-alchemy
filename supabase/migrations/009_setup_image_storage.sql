-- Setup image storage bucket for permanent image storage
-- This migration creates a storage bucket for generated images

-- Create the images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view images
CREATE POLICY "Authenticated users can view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated'
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated'
);

-- Add a prompt column to the images table for better tracking
ALTER TABLE images ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_images_post_id ON images(post_id);
CREATE INDEX IF NOT EXISTS idx_images_org_id ON images(org_id);
