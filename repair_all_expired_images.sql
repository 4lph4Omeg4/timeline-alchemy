-- 🔧 REPAIR ALL EXPIRED IMAGES SCRIPT 🔧
-- Dit script repareert alle verlopen afbeeldingen door ze opnieuw op te slaan

-- ========================================
-- 1. IDENTIFICATIE VAN VERLOPEN AFBEELDINGEN
-- ========================================
-- Zoek naar afbeeldingen met Azure Blob Storage URLs (die verlopen zijn)

SELECT 
  i.id,
  i.post_id,
  i.url,
  bp.title,
  bp.created_at,
  CASE 
    WHEN i.url LIKE '%blob.core.windows.net%' THEN 'Azure Blob (expired)'
    WHEN i.url LIKE '%dalle%' THEN 'DALL-E (expired)'
    WHEN i.url LIKE '%supabase%' THEN 'Supabase (permanent)'
    WHEN i.url LIKE '%storage.googleapis.com%' THEN 'Google Storage (permanent)'
    ELSE 'Unknown'
  END as url_type
FROM images i
JOIN blog_posts bp ON i.post_id = bp.id
WHERE i.url LIKE '%blob.core.windows.net%' 
   OR i.url LIKE '%dalle%'
   OR i.url LIKE '%azure%'
ORDER BY bp.created_at DESC;

-- ========================================
-- 2. TELLEN VAN VERLOPEN AFBEELDINGEN
-- ========================================
SELECT 
  COUNT(*) as total_expired_images,
  COUNT(CASE WHEN url LIKE '%blob.core.windows.net%' THEN 1 END) as azure_blob_images,
  COUNT(CASE WHEN url LIKE '%dalle%' THEN 1 END) as dalle_images,
  COUNT(CASE WHEN url LIKE '%supabase%' THEN 1 END) as permanent_images
FROM images 
WHERE url LIKE '%blob.core.windows.net%' 
   OR url LIKE '%dalle%'
   OR url LIKE '%azure%';

-- ========================================
-- 3. HANDMATIGE REPARATIE VIA API
-- ========================================
-- Voor elke verlopen afbeelding, kun je de /api/repair-expired-images endpoint gebruiken
-- Dit endpoint downloadt de afbeelding en uploadt het naar Supabase Storage (blog-images bucket)

-- POST /api/repair-expired-images
-- Body: { "fixAll": true }

-- Of gebruik de /api/save-image endpoint voor individuele afbeeldingen:
-- POST /api/save-image
-- Body: { 
--   "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
--   "postId": "post-id-here",
--   "orgId": "e6c0db74-03ee-4bb3-b08d-d94512efab91"
-- }

-- ========================================
-- 4. BULK REPARATIE VIA SQL (ALS API NIET WERKT)
-- ========================================
-- Als de API niet werkt, kun je deze SQL gebruiken om verlopen URLs te verwijderen
-- Dit voorkomt dat gebruikers gebroken afbeeldingen zien

-- UPDATE images 
-- SET url = NULL
-- WHERE url LIKE '%blob.core.windows.net%' 
--    OR url LIKE '%dalle%'
--    OR url LIKE '%azure%';

-- ========================================
-- 5. VERIFICATIE NA REPARATIE
-- ========================================
-- Controleer of alle afbeeldingen nu permanente URLs hebben

SELECT 
  COUNT(*) as total_images,
  COUNT(CASE WHEN url LIKE '%supabase%' THEN 1 END) as supabase_images,
  COUNT(CASE WHEN url LIKE '%storage.googleapis.com%' THEN 1 END) as google_images,
  COUNT(CASE WHEN url LIKE '%blob.core.windows.net%' THEN 1 END) as expired_images,
  COUNT(CASE WHEN url IS NULL THEN 1 END) as null_images
FROM images;

-- ========================================
-- 6. POSTS ZONDER AFBEELDINGEN
-- ========================================
-- Zoek naar posts die geen werkende afbeelding hebben

SELECT 
  bp.id,
  bp.title,
  bp.created_at,
  CASE 
    WHEN i.url IS NULL THEN 'No image'
    WHEN i.url LIKE '%blob.core.windows.net%' THEN 'Expired image'
    WHEN i.url LIKE '%dalle%' THEN 'Expired image'
    ELSE 'Has image'
  END as image_status
FROM blog_posts bp
LEFT JOIN images i ON bp.id = i.post_id
WHERE i.url IS NULL 
   OR i.url LIKE '%blob.core.windows.net%' 
   OR i.url LIKE '%dalle%'
ORDER BY bp.created_at DESC;

-- ========================================
-- 7. CLEANUP VAN VERLOPEN AFBEELDINGEN
-- ========================================
-- Verwijder verlopen afbeeldingen uit de database
-- (Pas op: dit verwijdert de database records, niet de Supabase Storage bestanden)

-- DELETE FROM images 
-- WHERE url LIKE '%blob.core.windows.net%' 
--    OR url LIKE '%dalle%'
--    OR url LIKE '%azure%';

-- ========================================
-- 8. MONITORING QUERY
-- ========================================
-- Gebruik deze query om te monitoren hoeveel afbeeldingen er zijn

SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_images,
  COUNT(CASE WHEN url LIKE '%supabase%' THEN 1 END) as permanent_images,
  COUNT(CASE WHEN url LIKE '%blob.core.windows.net%' THEN 1 END) as expired_images
FROM images 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
