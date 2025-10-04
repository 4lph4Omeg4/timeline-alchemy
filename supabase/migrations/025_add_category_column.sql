-- 🌟 DIVINE CATEGORY SYSTEM MIGRATION 🌟
-- This migration adds a proper category system to blog_posts

-- Step 1: Add category column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN category TEXT DEFAULT 'uncategorized';

-- Step 2: Create category enum/naming conventions
-- We'll use a clean naming system:
-- consciousness, ancient_wisdom, ai_technology, crypto_decentralized, 
-- divine_lifestyle, mythology_archetypes, global_shifts

-- Step 3: Copy existing categorization from title prefixes to category column
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
END;

-- Step 4: Clean up titles by removing category prefixes
UPDATE blog_posts 
SET title = CASE
  WHEN title LIKE '[Consciousness & Awakening & Enlightenment]%' THEN 
    TRIM(REPLACE(title, '[Consciousness & Awakening & Enlightenment]', ''))
  WHEN title LIKE '[Esoterica & Ancient Wisdom & Mysteries]%' THEN 
    TRIM(REPLACE(title, '[Esoterica & Ancient Wisdom & Mysteries]', ''))
  WHEN title LIKE '[AI & Conscious Technology & Future]%' THEN 
    TRIM(REPLACE(title, '[AI & Conscious Technology & Future]', ''))
  WHEN title LIKE '[Crypto & Decentralized Sovereignty]%' THEN 
    TRIM(REPLACE(title, '[Crypto & Decentralized Sovereignty]', ''))
  WHEN title LIKE '[Divine Lifestyle & New Earth & Harmony]%' THEN 
    TRIM(REPLACE(title, '[Divine Lifestyle & New Earth & Harmony]', ''))
  WHEN title LIKE '[Mythology & Archetypes & Ancient Secrets]%' THEN 
    TRIM(REPLACE(title, '[Mythology & Archetypes & Ancient Secrets]', ''))
  WHEN title LIKE '[Global Shifts & Conscious Culture & Awakening]%' THEN 
    TRIM(REPLACE(title, '[Global Shifts & Conscious Culture & Awakening]', ''))
  ELSE title
END;

-- Step 5: Add index on category for better performance
CREATE INDEX idx_blog_posts_category ON blog_posts(category);

-- Step 6: Verify the migration
SELECT 
  category,
  COUNT(*) as post_count,
  STRING_AGG(LEFT(title, 30), ', ') as sample_titles
FROM blog_posts 
GROUP BY category
ORDER BY post_count DESC;

-- Step 7: Show stats
SELECT 
  'MIGRATION COMPLETE!' as status,
  COUNT(*) as total_posts,
  COUNT(CASE WHEN category != 'uncategorized' THEN 1 END) as categorized_posts,
  COUNT(CASE WHEN category = 'uncategorized' THEN 1 END) as uncategorized_posts
FROM blog_posts;
