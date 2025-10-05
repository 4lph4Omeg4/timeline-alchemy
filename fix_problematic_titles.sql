-- 🔧 TITLE CLEANUP SCRIPT 🔧
-- Dit script vindt en repareert posts waarvan de titel eigenlijk de eerste alinea van de content is

-- ========================================
-- 1. IDENTIFICATIE VAN ECHTE PROBLEMATISCHE TITELS
-- ========================================
-- Zoek naar posts waarvan de titel identiek is aan de eerste alinea van de content

WITH problematic_titles AS (
  SELECT 
    id,
    title,
    content,
    -- Extracteer de eerste zin van de content (tot de eerste punt)
    CASE 
      WHEN POSITION('.' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION('.' IN content))
      WHEN POSITION('!' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION('!' IN content))
      WHEN POSITION('?' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION('?' IN content))
      ELSE SUBSTRING(content FROM 1 FOR 100)
    END as first_sentence,
    -- Extracteer de eerste alinea (tot de eerste dubbele newline)
    CASE 
      WHEN POSITION(E'\n\n' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION(E'\n\n' IN content) - 1)
      ELSE SUBSTRING(content FROM 1 FOR 200)
    END as first_paragraph
  FROM blog_posts 
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  pt.id,
  pt.title,
  pt.first_sentence,
  pt.first_paragraph,
  CASE 
    WHEN pt.title LIKE 'Title: %' THEN 'Title has "Title: " prefix'
    WHEN pt.title LIKE 'Titel: %' THEN 'Title has "Titel: " prefix'
    WHEN TRIM(pt.title) = TRIM(pt.first_sentence) THEN 'Title matches first sentence'
    WHEN TRIM(pt.title) = TRIM(pt.first_paragraph) THEN 'Title matches first paragraph'
    WHEN LENGTH(pt.title) > 100 AND pt.title LIKE '% %' THEN 'Title too long (likely content)'
    ELSE 'Other issue'
  END as problem_type,
  LENGTH(pt.title) as title_length
FROM problematic_titles pt
WHERE (
  pt.title LIKE 'Title: %' OR
  pt.title LIKE 'Titel: %' OR
  TRIM(pt.title) = TRIM(pt.first_sentence) OR
  TRIM(pt.title) = TRIM(pt.first_paragraph) OR
  (LENGTH(pt.title) > 100 AND pt.title LIKE '% %')
)
ORDER BY pt.id DESC;

-- ========================================
-- 2. TELLEN VAN PROBLEMATISCHE TITELS
-- ========================================
SELECT 
  COUNT(*) as total_problematic_titles,
  COUNT(CASE WHEN title LIKE '%.' THEN 1 END) as ends_with_period,
  COUNT(CASE WHEN title LIKE '%!' THEN 1 END) as ends_with_exclamation,
  COUNT(CASE WHEN title LIKE '%?' THEN 1 END) as ends_with_question,
  COUNT(CASE WHEN title LIKE 'The %' THEN 1 END) as starts_with_the,
  COUNT(CASE WHEN title LIKE 'This %' THEN 1 END) as starts_with_this,
  COUNT(CASE WHEN LENGTH(title) > 100 THEN 1 END) as too_long
FROM blog_posts 
WHERE (
  title LIKE '%.' OR 
  title LIKE '%!' OR 
  title LIKE '%?' OR
  title LIKE 'The %' OR
  title LIKE 'This %' OR
  title LIKE 'In %' OR
  title LIKE 'When %' OR
  title LIKE 'How %' OR
  LENGTH(title) > 100
)
AND created_at >= NOW() - INTERVAL '30 days';

-- ========================================
-- 3. HANDMATIGE TITEL REPARATIE
-- ========================================
-- Voor elke problematische titel, kun je deze query gebruiken om een betere titel te maken
-- Vervang 'POST_ID_HIER' en 'NIEUWE_TITEL' met de juiste waarden

-- UPDATE blog_posts 
-- SET title = 'NIEUWE_TITEL'
-- WHERE id = 'POST_ID_HIER';

-- ========================================
-- 4. HOOFDPROBLEEM: EERSTE ALINEA ALS TITEL
-- ========================================
-- Dit script vindt en repareert posts waarvan de titel identiek is aan de eerste alinea van de content

-- Eerst een backup maken
CREATE TABLE IF NOT EXISTS blog_posts_title_backup AS 
SELECT id, title, content, created_at 
FROM blog_posts 
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Vind posts waarvan de titel overeenkomt met het begin van de content
-- Dit zijn de echte problematische titels
WITH problematic_titles AS (
  SELECT 
    id,
    title,
    content,
    -- Extracteer de eerste zin van de content (tot de eerste punt)
    CASE 
      WHEN POSITION('.' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION('.' IN content))
      WHEN POSITION('!' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION('!' IN content))
      WHEN POSITION('?' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION('?' IN content))
      ELSE SUBSTRING(content FROM 1 FOR 100)
    END as first_sentence,
    -- Extracteer de eerste alinea (tot de eerste dubbele newline)
    CASE 
      WHEN POSITION(E'\n\n' IN content) > 0 THEN SUBSTRING(content FROM 1 FOR POSITION(E'\n\n' IN content) - 1)
      ELSE SUBSTRING(content FROM 1 FOR 200)
    END as first_paragraph
  FROM blog_posts 
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
-- Update posts waarvan de titel overeenkomt met de eerste zin of alinea
UPDATE blog_posts 
SET title = CASE
  -- Verwijder "Title: " prefix
  WHEN blog_posts.title LIKE 'Title: %' THEN 
    TRIM(SUBSTRING(blog_posts.title FROM 8))
  
  -- Verwijder "Titel: " prefix (Dutch)
  WHEN blog_posts.title LIKE 'Titel: %' THEN 
    TRIM(SUBSTRING(blog_posts.title FROM 8))
  
  -- Als titel overeenkomt met eerste zin, maak een betere titel
  WHEN TRIM(blog_posts.title) = TRIM(pt.first_sentence) THEN 
    -- Probeer een betere titel te maken door de eerste zin te verkorten
    CASE 
      WHEN LENGTH(pt.first_sentence) > 60 THEN 
        SUBSTRING(pt.first_sentence FROM 1 FOR 60) || '...'
      ELSE pt.first_sentence
    END
  
  -- Als titel overeenkomt met eerste alinea, maak een betere titel
  WHEN TRIM(blog_posts.title) = TRIM(pt.first_paragraph) THEN 
    -- Gebruik de eerste zin als titel, maar verkort deze
    CASE 
      WHEN LENGTH(pt.first_sentence) > 60 THEN 
        SUBSTRING(pt.first_sentence FROM 1 FOR 60) || '...'
      ELSE pt.first_sentence
    END
  
  -- Als titel te lang is en lijkt op content, verkort deze
  WHEN LENGTH(blog_posts.title) > 100 AND blog_posts.title LIKE '% %' THEN 
    SUBSTRING(blog_posts.title FROM 1 FOR 80) || '...'
  
  ELSE blog_posts.title
END
FROM problematic_titles pt
WHERE blog_posts.id = pt.id
AND (
  blog_posts.title LIKE 'Title: %' OR
  blog_posts.title LIKE 'Titel: %' OR
  TRIM(blog_posts.title) = TRIM(pt.first_sentence) OR
  TRIM(blog_posts.title) = TRIM(pt.first_paragraph) OR
  (LENGTH(blog_posts.title) > 100 AND blog_posts.title LIKE '% %')
);

-- ========================================
-- 5. VERIFICATIE NA REPARATIE
-- ========================================
-- Controleer hoeveel titels er zijn gerepareerd

SELECT 
  COUNT(*) as remaining_problematic_titles,
  COUNT(CASE WHEN title LIKE '%.' THEN 1 END) as still_ends_with_period,
  COUNT(CASE WHEN title LIKE '%!' THEN 1 END) as still_ends_with_exclamation,
  COUNT(CASE WHEN title LIKE '%?' THEN 1 END) as still_ends_with_question,
  COUNT(CASE WHEN title LIKE 'The %' THEN 1 END) as still_starts_with_the,
  COUNT(CASE WHEN title LIKE 'This %' THEN 1 END) as still_starts_with_this,
  COUNT(CASE WHEN LENGTH(title) > 100 THEN 1 END) as still_too_long
FROM blog_posts 
WHERE (
  title LIKE '%.' OR 
  title LIKE '%!' OR 
  title LIKE '%?' OR
  title LIKE 'The %' OR
  title LIKE 'This %' OR
  title LIKE 'In %' OR
  title LIKE 'When %' OR
  title LIKE 'How %' OR
  LENGTH(title) > 100
)
AND created_at >= NOW() - INTERVAL '30 days';

-- ========================================
-- 6. VOORBEELDEN VAN GEREPAREERDE TITELS
-- ========================================
-- Toon een paar voorbeelden van gerepareerde titels

SELECT 
  bp.id,
  bp.title as new_title,
  btb.title as old_title,
  bp.created_at
FROM blog_posts bp
JOIN blog_posts_title_backup btb ON bp.id = btb.id
WHERE bp.title != btb.title
ORDER BY bp.created_at DESC
LIMIT 10;

-- ========================================
-- 7. RESTORE VAN BACKUP (ALS NODIG)
-- ========================================
-- Als je de oude titels terug wilt, uncomment deze regels:

-- UPDATE blog_posts 
-- SET title = btb.title
-- FROM blog_posts_title_backup btb
-- WHERE blog_posts.id = btb.id;

-- DROP TABLE blog_posts_title_backup;

-- ========================================
-- 8. ADVANCED TITEL GENERATIE (OPTIONEEL)
-- ========================================
-- Voor meer geavanceerde titel generatie kun je een AI service gebruiken
-- Dit is een voorbeeld van hoe je dat zou kunnen doen:

-- UPDATE blog_posts 
-- SET title = CASE
--   -- Extracteer het eerste zinvolle deel van de content als titel
--   WHEN LENGTH(title) > 100 THEN 
--     TRIM(SUBSTRING(content FROM 1 FOR 80)) || '...'
--   ELSE title
-- END
-- WHERE LENGTH(title) > 100
-- AND created_at >= NOW() - INTERVAL '30 days';
