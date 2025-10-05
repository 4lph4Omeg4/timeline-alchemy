-- 🔧 REPAIR EXPIRED IMAGES SCRIPT 🔧
-- Dit script repareert verlopen afbeeldingen in de database

-- ========================================
-- 1. CONTROLEER VERLOPEN AFBEELDINGEN
-- ========================================
-- Zoek naar afbeeldingen met Azure Blob Storage URLs (die verlopen zijn)
SELECT 
  i.id,
  i.post_id,
  i.url,
  bp.title,
  bp.created_at
FROM images i
JOIN blog_posts bp ON i.post_id = bp.id
WHERE i.url LIKE '%blob.core.windows.net%' 
   OR i.url LIKE '%azure%'
   OR i.url LIKE '%dalle%'
ORDER BY bp.created_at DESC;

-- ========================================
-- 2. TELLEN VAN VERLOPEN AFBEELDINGEN
-- ========================================
SELECT 
  COUNT(*) as expired_images,
  COUNT(CASE WHEN url LIKE '%blob.core.windows.net%' THEN 1 END) as azure_blob_images,
  COUNT(CASE WHEN url LIKE '%dalle%' THEN 1 END) as dalle_images
FROM images 
WHERE url LIKE '%blob.core.windows.net%' 
   OR url LIKE '%azure%'
   OR url LIKE '%dalle%';

-- ========================================
-- 3. HANDMATIGE REPARATIE VAN SPECIFIEKE AFBEELDINGEN
-- ========================================
-- Voor elke verlopen afbeelding, kun je deze query gebruiken om de URL te updaten
-- Vervang 'OLD_URL' en 'NEW_URL' met de juiste waarden

-- UPDATE images 
-- SET url = 'NEW_PERMANENT_URL'
-- WHERE url = 'OLD_EXPIRED_URL';

-- ========================================
-- 4. BULK REPARATIE VIA API ENDPOINT
-- ========================================
-- Je kunt ook de /api/fix-image-urls endpoint gebruiken om alle verlopen afbeeldingen automatisch te repareren
-- Dit endpoint:
-- 1. Downloadt de afbeelding van de oude URL
-- 2. Uploadt het naar Supabase Storage
-- 3. Update de database met de nieuwe permanente URL

-- POST /api/fix-image-urls
-- Body: { "fixAll": true }

-- ========================================
-- 5. VERIFICATIE NA REPARATIE
-- ========================================
-- Controleer of alle afbeeldingen nu permanente URLs hebben
SELECT 
  COUNT(*) as total_images,
  COUNT(CASE WHEN url LIKE '%supabase%' THEN 1 END) as supabase_images,
  COUNT(CASE WHEN url LIKE '%storage.googleapis.com%' THEN 1 END) as google_images,
  COUNT(CASE WHEN url LIKE '%blob.core.windows.net%' THEN 1 END) as expired_images
FROM images;

-- ========================================
-- 6. AFBEELDINGEN ZONDER POSTS
-- ========================================
-- Zoek naar afbeeldingen die geen bijbehorende post hebben
SELECT i.*
FROM images i
LEFT JOIN blog_posts bp ON i.post_id = bp.id
WHERE bp.id IS NULL;

-- ========================================
-- 7. POSTS ZONDER AFBEELDINGEN
-- ========================================
-- Zoek naar posts die geen afbeelding hebben
SELECT bp.id, bp.title, bp.created_at
FROM blog_posts bp
LEFT JOIN images i ON bp.id = i.post_id
WHERE i.id IS NULL
ORDER BY bp.created_at DESC;

-- ========================================
-- 8. CLEANUP VAN ORPHANED IMAGES
-- ========================================
-- Verwijder afbeeldingen die geen bijbehorende post hebben
-- (Pas op: run dit alleen als je zeker weet dat deze afbeeldingen niet meer nodig zijn)

-- DELETE FROM images 
-- WHERE post_id NOT IN (SELECT id FROM blog_posts);

-- ========================================
-- 9. AFBEELDING STATISTIEKEN
-- ========================================
-- Overzicht van alle afbeeldingen per organisatie
SELECT 
  o.name as organization_name,
  COUNT(i.id) as image_count,
  COUNT(CASE WHEN i.url LIKE '%supabase%' THEN 1 END) as permanent_images,
  COUNT(CASE WHEN i.url LIKE '%blob.core.windows.net%' THEN 1 END) as expired_images
FROM images i
JOIN organizations o ON i.org_id = o.id
GROUP BY o.id, o.name
ORDER BY image_count DESC;

-- ========================================
-- 10. RECENTE AFBEELDINGEN CONTROLEREN
-- ========================================
-- Controleer de laatste 20 afbeeldingen
SELECT 
  i.id,
  i.url,
  bp.title,
  bp.created_at,
  CASE 
    WHEN i.url LIKE '%supabase%' THEN '✅ Permanent'
    WHEN i.url LIKE '%storage.googleapis.com%' THEN '✅ Permanent'
    WHEN i.url LIKE '%blob.core.windows.net%' THEN '❌ Expired'
    ELSE '❓ Unknown'
  END as status
FROM images i
JOIN blog_posts bp ON i.post_id = bp.id
ORDER BY bp.created_at DESC
LIMIT 20;
