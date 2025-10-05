-- 🔍 CATEGORIE CHECK & FIX SCRIPT 🔍
-- Dit script helpt je om te zien wat er in je database staat en hoe je categorieën kunt aanpassen

-- ========================================
-- 1. OVERZICHT VAN ALLE CATEGORIEËN
-- ========================================
SELECT 
  category,
  COUNT(*) as aantal_posts,
  STRING_AGG(LEFT(title, 50), ' | ') as voorbeelden_titels
FROM blog_posts 
WHERE created_at >= NOW() - INTERVAL '7 days'  -- Alleen recente posts
GROUP BY category
ORDER BY aantal_posts DESC;

-- ========================================
-- 2. RECENTE POSTS MET CATEGORIEËN
-- ========================================
SELECT 
  id,
  title,
  category,
  created_at,
  created_by_admin
FROM blog_posts 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- 3. POSTS ZONDER CATEGORIE (UNCATEGORIZED)
-- ========================================
SELECT 
  id,
  title,
  category,
  created_at
FROM blog_posts 
WHERE category = 'uncategorized' OR category IS NULL
ORDER BY created_at DESC;

-- ========================================
-- 4. HANDMATIGE CATEGORIE TOEWIJZING
-- ========================================
-- Gebruik deze queries om categorieën handmatig aan te passen:

-- Voor Consciousness & Awakening:
-- UPDATE blog_posts 
-- SET category = 'consciousness' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%bewustzijn%' OR title LIKE '%awakening%';

-- Voor Ancient Wisdom & Mysteries:
-- UPDATE blog_posts 
-- SET category = 'ancient_wisdom' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%ancient%' OR title LIKE '%mysteries%';

-- Voor AI & Technology:
-- UPDATE blog_posts 
-- SET category = 'ai_technology' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%ai%' OR title LIKE '%technology%';

-- Voor Crypto & Decentralized:
-- UPDATE blog_posts 
-- SET category = 'crypto_decentralized' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%crypto%' OR title LIKE '%bitcoin%';

-- Voor Divine Lifestyle:
-- UPDATE blog_posts 
-- SET category = 'divine_lifestyle' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%lifestyle%' OR title LIKE '%wellness%';

-- Voor Mythology & Archetypes:
-- UPDATE blog_posts 
-- SET category = 'mythology_archetypes' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%mythology%' OR title LIKE '%archetype%';

-- Voor Global Shifts:
-- UPDATE blog_posts 
-- SET category = 'global_shifts' 
-- WHERE id = 'POST_ID_HIER' AND title LIKE '%global%' OR title LIKE '%culture%';

-- ========================================
-- 5. BULK CATEGORIE TOEWIJZING OP BASIS VAN TITEL
-- ========================================
-- Deze queries wijzen automatisch categorieën toe op basis van keywords in de titel:

-- Consciousness & Awakening
UPDATE blog_posts 
SET category = 'consciousness' 
WHERE (title ILIKE '%consciousness%' OR title ILIKE '%awakening%' OR title ILIKE '%enlightenment%' 
       OR title ILIKE '%meditation%' OR title ILIKE '%mindfulness%' OR title ILIKE '%spiritual%')
  AND (category = 'uncategorized' OR category IS NULL);

-- Ancient Wisdom & Mysteries  
UPDATE blog_posts 
SET category = 'ancient_wisdom' 
WHERE (title ILIKE '%ancient%' OR title ILIKE '%wisdom%' OR title ILIKE '%mysteries%' 
       OR title ILIKE '%esoteric%' OR title ILIKE '%occult%' OR title ILIKE '%sacred%')
  AND (category = 'uncategorized' OR category IS NULL);

-- AI & Technology
UPDATE blog_posts 
SET category = 'ai_technology' 
WHERE (title ILIKE '%ai%' OR title ILIKE '%artificial intelligence%' OR title ILIKE '%technology%' 
       OR title ILIKE '%future%' OR title ILIKE '%innovation%' OR title ILIKE '%digital%')
  AND (category = 'uncategorized' OR category IS NULL);

-- Crypto & Decentralized
UPDATE blog_posts 
SET category = 'crypto_decentralized' 
WHERE (title ILIKE '%crypto%' OR title ILIKE '%bitcoin%' OR title ILIKE '%blockchain%' 
       OR title ILIKE '%decentralized%' OR title ILIKE '%defi%' OR title ILIKE '%nft%')
  AND (category = 'uncategorized' OR category IS NULL);

-- Divine Lifestyle
UPDATE blog_posts 
SET category = 'divine_lifestyle' 
WHERE (title ILIKE '%lifestyle%' OR title ILIKE '%wellness%' OR title ILIKE '%harmony%' 
       OR title ILIKE '%balance%' OR title ILIKE '%healthy%' OR title ILIKE '%new earth%')
  AND (category = 'uncategorized' OR category IS NULL);

-- Mythology & Archetypes
UPDATE blog_posts 
SET category = 'mythology_archetypes' 
WHERE (title ILIKE '%mythology%' OR title ILIKE '%archetype%' OR title ILIKE '%legend%' 
       OR title ILIKE '%myth%' OR title ILIKE '%goddess%' OR title ILIKE '%god%')
  AND (category = 'uncategorized' OR category IS NULL);

-- Global Shifts
UPDATE blog_posts 
SET category = 'global_shifts' 
WHERE (title ILIKE '%global%' OR title ILIKE '%culture%' OR title ILIKE '%society%' 
       OR title ILIKE '%civilization%' OR title ILIKE '%movement%' OR title ILIKE '%shift%')
  AND (category = 'uncategorized' OR category IS NULL);

-- ========================================
-- 6. TITEL CLEANUP - VERWIJDER CATEGORIE PREFIXEN
-- ========================================
-- Deze queries verwijderen de [Category] prefixen uit de titels:

-- Verwijder Consciousness prefixen
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Consciousness & Awakening & Enlightenment] ') + 1))
WHERE title LIKE '[Consciousness & Awakening & Enlightenment] %';

-- Verwijder Esoterica prefixen  
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Esoterica & Ancient Wisdom & Mysteries] ') + 1))
WHERE title LIKE '[Esoterica & Ancient Wisdom & Mysteries] %';

-- Verwijder AI prefixen
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[AI & Conscious Technology & Future] ') + 1))
WHERE title LIKE '[AI & Conscious Technology & Future] %';

-- Verwijder Crypto prefixen
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Crypto & Decentralized Sovereignty] ') + 1))
WHERE title LIKE '[Crypto & Decentralized Sovereignty] %';

-- Verwijder Divine Lifestyle prefixen
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Divine Lifestyle & New Earth & Harmony] ') + 1))
WHERE title LIKE '[Divine Lifestyle & New Earth & Harmony] %';

-- Verwijder Mythology prefixen
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Mythology & Archetypes & Ancient Secrets] ') + 1))
WHERE title LIKE '[Mythology & Archetypes & Ancient Secrets] %';

-- Verwijder Global Shifts prefixen
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Global Shifts & Conscious Culture & Awakening] ') + 1))
WHERE title LIKE '[Global Shifts & Conscious Culture & Awakening] %';

-- Verwijder nieuwe categorie formaten [category_name]
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[consciousness] ') + 1))
WHERE title LIKE '[consciousness] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[ancient_wisdom] ') + 1))
WHERE title LIKE '[ancient_wisdom] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[ai_technology] ') + 1))
WHERE title LIKE '[ai_technology] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[crypto_decentralized] ') + 1))
WHERE title LIKE '[crypto_decentralized] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[divine_lifestyle] ') + 1))
WHERE title LIKE '[divine_lifestyle] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[mythology_archetypes] ') + 1))
WHERE title LIKE '[mythology_archetypes] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[global_shifts] ') + 1))
WHERE title LIKE '[global_shifts] %';

-- Verwijder andere mogelijke prefixen (voor het geval er variaties zijn)
UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Consciousness%') + 1))
WHERE title LIKE '[Consciousness%' AND title NOT LIKE '[Consciousness & Awakening & Enlightenment] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Esoterica%') + 1))
WHERE title LIKE '[Esoterica%' AND title NOT LIKE '[Esoterica & Ancient Wisdom & Mysteries] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[AI%') + 1))
WHERE title LIKE '[AI%' AND title NOT LIKE '[AI & Conscious Technology & Future] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Crypto%') + 1))
WHERE title LIKE '[Crypto%' AND title NOT LIKE '[Crypto & Decentralized Sovereignty] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Divine%') + 1))
WHERE title LIKE '[Divine%' AND title NOT LIKE '[Divine Lifestyle & New Earth & Harmony] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Mythology%') + 1))
WHERE title LIKE '[Mythology%' AND title NOT LIKE '[Mythology & Archetypes & Ancient Secrets] %';

UPDATE blog_posts 
SET title = TRIM(SUBSTRING(title FROM LENGTH('[Global%') + 1))
WHERE title LIKE '[Global%' AND title NOT LIKE '[Global Shifts & Conscious Culture & Awakening] %';

-- ========================================
-- 7. VERIFICATIE NA AANPASSINGEN
-- ========================================
-- Run deze query om te zien hoeveel posts er nu in elke categorie zitten:

SELECT 
  category,
  COUNT(*) as aantal_posts,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM blog_posts 
GROUP BY category
ORDER BY aantal_posts DESC;

-- ========================================
-- 7. SPECIFIEKE POST ZOEKEN EN AANPASSEN
-- ========================================
-- Zoek een specifieke post:
-- SELECT id, title, category FROM blog_posts WHERE title ILIKE '%JE_ZOEKTERM%';

-- Pas een specifieke post aan:
-- UPDATE blog_posts SET category = 'consciousness' WHERE id = 'POST_ID_HIER';

-- ========================================
-- 8. CATEGORIE MAPPING OVERZICHT
-- ========================================
-- Dit zijn alle beschikbare categorieën en hun IDs:

/*
consciousness          → Consciousness & Awakening
ancient_wisdom         → Ancient Wisdom & Mysteries  
ai_technology          → AI & Conscious Technology
crypto_decentralized   → Crypto & Decentralized Sovereignty
divine_lifestyle       → Divine Lifestyle & New Earth
mythology_archetypes   → Mythology & Archetypes
global_shifts          → Global Shifts & Conscious Culture
uncategorized          → Uncategorized (default)
*/
