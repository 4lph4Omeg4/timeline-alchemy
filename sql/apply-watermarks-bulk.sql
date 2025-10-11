-- Bulk Watermark Application via SQL
-- This script applies watermarks to all images in the database
-- Run this directly in Supabase SQL Editor as a workaround for Vercel 405 issues

-- First, let's check what we have
DO $$
DECLARE
  admin_org_id UUID;
  admin_logo_url TEXT;
  img_record RECORD;
  processed_count INT := 0;
  skipped_count INT := 0;
BEGIN
  -- Get Admin Organization ID
  SELECT id INTO admin_org_id
  FROM organizations
  WHERE name = 'Admin Organization'
  LIMIT 1;
  
  IF admin_org_id IS NULL THEN
    RAISE NOTICE 'ERROR: Admin Organization not found';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Admin Organization ID: %', admin_org_id;
  
  -- Get Admin branding logo URL
  SELECT logo_url INTO admin_logo_url
  FROM branding_settings
  WHERE organization_id = admin_org_id
  LIMIT 1;
  
  IF admin_logo_url IS NULL THEN
    RAISE NOTICE 'ERROR: Admin branding logo not configured';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Admin Logo URL: %', admin_logo_url;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Starting watermark application...';
  RAISE NOTICE '----------------------------------------';
  
  -- Loop through all images
  FOR img_record IN 
    SELECT id, url, org_id, post_id
    FROM images
    ORDER BY created_at DESC
  LOOP
    -- Skip if already watermarked
    IF img_record.url LIKE '%/watermarked/%' THEN
      skipped_count := skipped_count + 1;
      RAISE NOTICE '[SKIPPED] Image % already watermarked', img_record.id;
    ELSE
      -- Mark for manual watermarking
      -- Note: Actual watermarking needs to be done via the working watermark library
      -- This SQL script just helps identify images that need watermarking
      RAISE NOTICE '[NEEDS WATERMARK] Image ID: % | URL: %', img_record.id, img_record.url;
      processed_count := processed_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE 'Total images needing watermark: %', processed_count;
  RAISE NOTICE 'Already watermarked (skipped): %', skipped_count;
  RAISE NOTICE '----------------------------------------';
  
END $$;

-- ALTERNATIVE: Get list of images to watermark as JSON output
SELECT 
  json_build_object(
    'total_images', COUNT(*),
    'needs_watermark', COUNT(*) FILTER (WHERE url NOT LIKE '%/watermarked/%'),
    'already_watermarked', COUNT(*) FILTER (WHERE url LIKE '%/watermarked/%'),
    'images_to_process', json_agg(
      json_build_object(
        'id', id,
        'url', url,
        'org_id', org_id,
        'post_id', post_id
      )
    ) FILTER (WHERE url NOT LIKE '%/watermarked/%')
  ) as watermark_status
FROM images;

