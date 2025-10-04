-- 🌟 DIVINE BLOG CATEGORIZATION SQL SCRIPT 🌟
-- Dit script categoriseert automatisch alle bestaande blogs en voegt categorie prefixes toe aan de titels

-- Eerst bekijken wat er allemaal in de database staat
SELECT 
    id,
    title,
    content,
    LEFT(content, 100) as content_preview,
    org_id,
    created_at
FROM blog_posts 
WHERE title NOT LIKE '[%]%'  -- Alleen posts zonder categorie prefix
ORDER BY created_at DESC;

-- Step 1: Backup de originele titels in een backup kolom
-- Voegt de kolom toe als deze nog niet bestaat
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'original_title') THEN
        ALTER TABLE blog_posts ADD COLUMN original_title TEXT;
    END IF;
END $$;

-- Update backup kolom met originele titels (alleen voor posts die nog geen backup hebben)
UPDATE blog_posts 
SET original_title = title 
WHERE original_title IS NULL;

-- 🧠 CATEGORY 1: Consciousness & Awakening & Enlightenment
UPDATE blog_posts 
SET title = '[Consciousness & Awakening & Enlightenment] ' || TRIM(title)
WHERE (
    title ILIKE '%consciousness%' OR
    title ILIKE '%awakening%' OR
    title ILIKE '%enlightenment%' OR
    title ILIKE '%meditation%' OR
    title ILIKE '%mindfulness%' OR
    title ILIKE '%spiritual awakening%' OR
    title ILIKE '%inner journey%' OR
    title ILIKE '%higher consciousness%' OR
    title ILIKE '%transcendence%' OR
    title ILIKE '%soul%' OR
    title ILIKE '%awareness%' OR
    content ILIKE '%consciousness%' OR
    content ILIKE '%awakening%' OR
    content ILIKE '%enlightenment%' OR
    content ILIKE '%meditation%'
) 
AND title NOT LIKE '[%]%';

-- 🏛️ CATEGORY 2: Esoterica & Ancient Wisdom & Mysteries
UPDATE blog_posts 
SET title = '[Esoterica & Ancient Wisdom & Mysteries] ' || TRIM(title)
WHERE (
    title ILIKE '%ancient%' OR
    title ILIKE '%wisdom%' OR
    title ILIKE '%mysteries%' OR
    title ILIKE '%esoteric%' OR
    title ILIKE '%occult%' OR
    title ILIKE '%secret%' OR
    title ILIKE '%mystical%' OR
    title ILIKE '%sacred%' OR
    title ILIKE '%energy%' OR
    title ILIKE '%chakra%' OR
    title ILIKE '%aura%' OR
    title ILIKE '%crystal%' OR
    title ILIKE '%tarot%' OR
    title ILIKE '%astrology%' OR
    title ILIKE '%numerology%' OR
    content ILIKE '%ancient wisdom%' OR
    content ILIKE '%esoteric%' OR
    content ILIKE '%mysterious%'
) 
AND title NOT LIKE '[%]%';

-- 🤖 CATEGORY 3: AI & Conscious Technology & Future
UPDATE blog_posts 
SET title = '[AI & Conscious Technology & Future] ' || TRIM(title)
WHERE (
    title ILIKE '%ai%' OR
    title ILIKE '%artificial intelligence%' OR
    title ILIKE '%technology%' OR
    title ILIKE '%future%' OR
    title ILIKE '%innovation%' OR
    title ILIKE '%digital%' OR
    title ILIKE '%conscious technology%' OR
    title ILIKE '%machine learning%' OR
    title ILIKE '%robotics%' OR
    title ILIKE '%automation%' OR
    title ILIKE '%tech%' OR
    title ILIKE '%neural%' OR
    title ILIKE '%algorithm%' OR
    content ILIKE '%artificial intelligence%' OR
    content ILIKE '%machine learning%' OR
    content ILIKE '%conscious technology%' OR
    content ILIKE '%AI%'
) 
AND title NOT LIKE '[%]%';

-- 💰 CATEGORY 4: Crypto & Decentralized Sovereignty
UPDATE blog_posts 
SET title = '[Crypto & Decentralized Sovereignty] ' || TRIM(title)
WHERE (
    title ILIKE '%crypto%' OR
    title ILIKE '%bitcoin%' OR
    title ILIKE '%blockchain%' OR
    title ILIKE '%decentralized%' OR
    title ILIKE '%decentralization%' OR
    title ILIKE '%sovereignty%' OR
    title ILIKE '%financial freedom%' OR
    title ILIKE '%defi%' OR
    title ILIKE '%nft%' OR
    title ILIKE '%digital assets%' OR
    title ILIKE '%ethereum%' OR
    title ILIKE '%wallet%' OR
    title ILIKE '%mining%' OR
    content ILIKE '%cryptocurrency%' OR
    content ILIKE '%blockchain%' OR
    content ILIKE '%decentralized%'
) 
AND title NOT LIKE '[%]%';

-- 🌱 CATEGORY 5: Divine Lifestyle & New Earth & Harmony
UPDATE blog_posts 
SET title = '[Divine Lifestyle & New Earth & Harmony] ' || TRIM(title)
WHERE (
    title ILIKE '%lifestyle%' OR
    title ILIKE '%wellness%' OR
    title ILIKE '%harmony%' OR
    title ILIKE '%balance%' OR
    title ILIKE '%healthy%' OR
    title ILIKE '%new earth%' OR
    title ILIKE '%sustainable%' OR
    title ILIKE '%natural%' OR
    title ILIKE '%holistic%' OR
    title ILIKE '%healing%' OR
    title ILIKE '%life%' OR
    title ILIKE '%peace%' OR
    title ILIKE '%zen%' OR
    content ILIKE '%wellness%' OR
    content ILIKE '%healthy lifestyle%' OR
    content ILIKE '%harmony%'
) 
AND title NOT LIKE '[%]%';

-- ⚡ CATEGORY 6: Mythology & Archetypes & Ancient Secrets
UPDATE blog_posts 
SET title = '[Mythology & Archetypes & Ancient Secrets] ' || TRIM(title)
WHERE (
    title ILIKE '%mythology%' OR
    title ILIKE '%archetype%' OR
    title ILIKE '%legend%' OR
    title ILIKE '%myth%' OR
    title ILIKE '%archetypal%' OR
    title ILIKE '%symbolic%' OR
    title ILIKE '%symbolism%' OR
    title ILIKE '%goddess%' OR
    title ILIKE '%god%' OR
    title ILIKE '%pantheon%' OR
    title ILIKE '%ancient gods%' OR
    content ILIKE '%mythology%' OR
    content ILIKE '%archetype%' OR
    content ILIKE '%legend%'
) 
AND title NOT LIKE '[%]%';

-- 🌍 CATEGORY 7: Global Shifts & Conscious Culture & Awakening
UPDATE blog_posts 
SET title = '[Global Shifts & Conscious Culture & Awakening] ' || TRIM(title)
WHERE (
    title ILIKE '%global%' OR
    title ILIKE '%culture%' OR
    title ILIKE '%society%' OR
    title ILIKE '%civilization%' OR
    title ILIKE '%movement%' OR
    title ILIKE '%shift%' OR
    title ILIKE '%evolution%' OR
    title ILIKE '%transformation%' OR
    title ILIKE '%change%' OR
    title ILIKE '%world%' OR
    title ILIKE '%humanity%' OR
    title ILIKE '%collective awakening%' OR
    content ILIKE '%global movement%' OR
    content ILIKE '%cultural shift%' OR
    content ILIKE '%collective consciousness%'
) 
AND title NOT LIKE '[%]%';

-- 📊 RESULTATEN CONTROLEREN
-- Bekijk hoeveel posts per categorie zijn toegewezen
SELECT 
    CASE 
        WHEN title LIKE '[Consciousness %' THEN '🧠 Consciousness & Awakening'
        WHEN title LIKE '[Esoterica %' THEN '🏛️ Ancient Wisdom & Mysteries'
        WHEN title LIKE '[AI %' THEN '🤖 AI & Conscious Technology'
        WHEN title LIKE '[Crypto %' THEN '💰 Crypto & Decentralized Sovereignty'
        WHEN title LIKE '[Divine %' THEN '🌱 Divine Lifestyle & New Earth'
        WHEN title LIKE '[Mythology %' THEN '⚡ Mythology & Archetypes'
        WHEN title LIKE '[Global %' THEN '🌍 Global Shifts & Conscious Culture'
        ELSE '❓ Uncategorized'
    END as category,
    COUNT(*) as post_count,
    STRING_AGG(LEFT(title, 50), ', ') as sample_titles
FROM blog_posts 
GROUP BY 
    CASE 
        WHEN title LIKE '[Consciousness %' THEN '🧠 Consciousness & Awakening'
        WHEN title LIKE '[Esoterica %' THEN '🏛️ Ancient Wisdom & Mysteries'
        WHEN title LIKE '[AI %' THEN '🤖 AI & Conscious Technology'
        WHEN title LIKE '[Crypto %' THEN '💰 Crypto & Decentralized Sovereignty'
        WHEN title LIKE '[Divine %' THEN '🌱 Divine Lifestyle & New Earth'
        WHEN title LIKE '[Mythology %' THEN '⚡ Mythology & Archetypes'
        WHEN title LIKE '[Global %' THEN '🌍 Global Shifts & Conscious Culture'
        ELSE '❓ Uncategorized'
    END
ORDER BY post_count DESC;

-- 🌟 BONUS: Clean-up dubbele openingshaken (als die er zijn)
UPDATE blog_posts 
SET title = REGEXP_REPLACE(title, '^\[\[+([^\]]+)\]\]*', '[\1]')
WHERE title ~ '^\[\[';

-- 🔧 FINAL CHECK: Bekijk alle posts met categorieën
SELECT 
    id,
    title,
    created_at,
    CASE 
        WHEN title LIKE '[Consciousness %' THEN '🧠'
        WHEN title LIKE '[Esoterica %' THEN '🏛️'
        WHEN title LIKE '[AI %' THEN '🤖'
        WHEN title LIKE '[Crypto %' THEN '💰'
        WHEN title LIKE '[Divine %' THEN '🌱'
        WHEN title LIKE '[Mythology %' THEN '⚡'
        WHEN title LIKE '[Global %' THEN '🌍'
        ELSE '❌'
    END as emoji,
    CASE 
        WHEN title LIKE '[Consciousness %' THEN 'Consciousness & Awakening'
        WHEN title LIKE '[Esoterica %' THEN 'Ancient Wisdom & Mysteries'
        WHEN title LIKE '[AI %' THEN 'AI & Conscious Technology'
        WHEN title LIKE '[Crypto %' THEN 'Crypto & Decentralized Sovereignty'
        WHEN title LIKE '[Divine %' THEN 'Divine Lifestyle & New Earth'
        WHEN title LIKE '[Mythology %' THEN 'Mythology & Archetypes'
        WHEN title LIKE '[Global %' THEN 'Global Shifts & Conscious Culture'
        ELSE 'Uncategorized'
    END as category_name
FROM blog_posts 
ORDER BY created_at DESC;

-- 💫 SUCCESS! Alle blogs zijn nu gecategoriseerd!
-- Je kunt nu ook de categorize logic gebruiken in je React Component:
/*
// In je categorizePosts functie:
const categorizeExistingPosts = async () => {
  // Dit roept bovenstaande SQL logic aan
  const response = await fetch('/api/categorize-existing-posts', {
    method: 'POST'
  });
};
*/
