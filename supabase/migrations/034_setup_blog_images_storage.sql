-- Setup dedicated avatars storage bucket for user profile pictures
-- This migration creates a separate bucket for user avatars to keep them organized

-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit (sufficient for profile pictures)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  -- Path must start with their user ID: {user_id}/filename.ext
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view avatars (public bucket for social platform)
CREATE POLICY "Anyone can view avatars" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'avatars'
);

-- Allow users to delete only their own avatar files
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update only their own avatar files
CREATE POLICY "Users can update their own avatar" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Also ensure blog-images bucket has proper policies (if not already set)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  52428800, -- 50MB limit for blog content
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Blog-images policies (for content generation)
DROP POLICY IF EXISTS "Authenticated users can upload to blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog-images" ON storage.objects;

CREATE POLICY "Authenticated users can upload to blog-images" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'blog-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view blog-images" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'blog-images'
);

CREATE POLICY "Authenticated users can delete from blog-images" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'blog-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update blog-images" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'blog-images' AND 
  auth.role() = 'authenticated'
);

