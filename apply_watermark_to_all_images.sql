-- Manual Watermark Application Script
-- This script helps you identify which images need watermarking
-- You'll need to run the watermark API for each image individually

-- Step 1: Check all images that need watermarking
SELECT 
  id,
  url,
  org_id,
  post_id,
  created_at,
  CASE 
    WHEN url LIKE '%/watermarked/%' THEN '✅ Already watermarked'
    WHEN url LIKE '%/gemini-generated/%' THEN '⚠️ Needs watermark'
    ELSE '⚠️ Check manually'
  END as watermark_status
FROM images
ORDER BY created_at DESC;

-- Step 2: Count images by status
SELECT 
  CASE 
    WHEN url LIKE '%/watermarked/%' THEN 'Already Watermarked'
    WHEN url LIKE '%/gemini-generated/%' THEN 'Needs Watermark'
    ELSE 'Unknown'
  END as status,
  COUNT(*) as count
FROM images
GROUP BY 
  CASE 
    WHEN url LIKE '%/watermarked/%' THEN 'Already Watermarked'
    WHEN url LIKE '%/gemini-generated/%' THEN 'Needs Watermark'
    ELSE 'Unknown'
  END;

-- Note: To apply watermarks, you have two options:
-- 1. Use the Admin Dashboard → Bulk Watermark tool (when 405 error is fixed)
-- 2. Regenerate content packages (they will automatically get watermarks)
-- 
-- For now, new images will automatically get the Timeline Alchemy watermark
-- Old images can remain without watermark until regenerated

