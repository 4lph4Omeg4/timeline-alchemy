-- 🌟 CLEAN CATEGORY MIGRATION 🌟
-- Simplified migration to clean up existing categorization

-- Step 1: Add category column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'category') THEN
        ALTER TABLE blog_posts ADD COLUMN category TEXT DEFAULT 'uncategorized';
    END IF;
END $$;

-- Step 2: Set categories based on existing title prefixes
UPDATE blog_posts 
SET category = CASE
  WHEN title LIKE '[Consciousness%' THEN 'consciousness'
  WHEN title LIKE '[Esoterica%' THEN 'ancient_wisdom' 
  WHEN title LIKE '[AI%' THEN 'ai_technology'
  WHEN title LIKE '[Crypto%' THEN 'crypto_decentralized'
  WHEN title LIKE '[Divine%' THEN 'divine_lifestyle'
  WHEN title LIKE '[Mythology%' THEN 'mythology_archetypes'
  WHEN title LIKE '[Global%' THEN 'global_shifts'
  ELSE 'uncategorized'
END
WHERE category = 'uncategorized' OR category IS NULL;

-- Step 3: Clean up titles by removing prefixes
UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[Consciousness & Awakening & Enlightenment] ') + 1)
WHERE title LIKE '[Consciousness & Awakening & Enlightenment] %';

UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[Esoterica & Ancient Wisdom & Mysteries] ') + 1)
WHERE title LIKE '[Esoterica & Ancient Wisdom & Mysteries] %';

UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[AI & Conscious Technology & Future] ') + 1)
WHERE title LIKE '[AI & Conscious Technology & Future] %';

UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[Crypto & Decentralized Sovereignty] ') + 1)
WHERE title LIKE '[Crypto & Decentralized Sovereignty] %';

UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[Divine Lifestyle & New Earth & Harmony] ') + 1)
WHERE title LIKE '[Divine Lifestyle & New Earth & Harmony] %';

UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[Mythology & Archetypes & Ancient Secrets] ') + 1)
WHERE title LIKE '[Mythology & Archetypes & Ancient Secrets] %';

UPDATE blog_posts 
SET title = SUBSTRING(title FROM LENGTH('[Global Shifts & Conscious Culture & Awakening] ') + 1)
WHERE title LIKE '[Global Shifts & Conscious Culture & Awakening] %';

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Step 5: Verify results
SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(LEFT(title, 30), ', ') as sample_titles
FROM blog_posts 
GROUP BY category
ORDER BY count DESC;
