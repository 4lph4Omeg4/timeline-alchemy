import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/library/supabase'

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.includes('Bearer')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌟 Starting divine blog categorization...')

    // Direct SQL execution voor categorisatie
    const categorizationSQL = `
      -- Voeg original_title kolom toe als deze niet bestaat
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'blog_posts' AND column_name = 'original_title') THEN
          ALTER TABLE blog_posts ADD COLUMN original_title TEXT;
        END IF;
      END $$;

      -- Backup originele titels
      UPDATE blog_posts 
      SET original_title = title 
      WHERE original_title IS NULL;

      -- 🧠 Consciousness & Awakening & Enlightenment
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

      -- 🏛️ Ancient Wisdom & Mysteries
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

      -- 🤖 AI & Conscious Technology
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
        content ILIlKE '%machine learning%' OR
        content ILIKE '%conscious technology%' OR
        content ILIKE '%AI%'
      ) 
      AND title NOT LIKE '[%]%';

      -- 💰 Crypto & Decentralized Sovereignty
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

      -- 🌱 Divine Lifestyle & New Earth
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

      -- ⚡ Mythology & Archetypes
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

      -- 🌍 Global Shifts & Conscious Culture
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
    `

    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: categorizationSQL
      })
      
      console.log('✨ SQL categorization completed')
    } catch (error) {
      console.error('SQL categorization error:', error)
      return NextResponse.json({
        success: false, 
        error: 'Failed to execute categorization SQL',
        details: error instanceof Error ? error.message : 'Unknown SQL error'
      }, { status: 500 })
    }

    // Get categorized results
    const { data: categorizedPosts, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, original_title, content')

    if (fetchError) {
      console.error('Error fetching categorized posts:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch categorized posts' 
      }, { status: 500 })
    }

    // Count posts by category
    const categoryCounts = categorizedPosts.reduce((acc, post) => {
      let category = 'Uncategorized'
      if (post.title?.startsWith('[Consciousness')) category = 'Consciousness & Awakening'
      else if (post.title?.startsWith('[Esoterica')) category = 'Ancient Wisdom & Mysteries'
      else if (post.title?.startsWith('[AI')) category = 'AI & Conscious Technology'
      else if (post.title?.startsWith('[Crypto')) category = 'Crypto & Decentralized Sovereignty'
      else if (post.title?.startsWith('[Divine')) category = 'Divine Lifestyle & New Earth'
      else if (post.title?.startsWith('[Mythology')) category = 'Mythology & Archetypes'
      else if (post.title?.startsWith('[Global')) category = 'Global Shifts & Conscious Culture'
      
      acc[/category] = (acc[/category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const categorizedCount = categorizedPosts.filter(post => 
      post.title?.startsWith('[') && !post.title.includes('[%]%')
    ).length

    console.log('✨ Categorization completed!', categoryCounts)

    return NextResponse.json({
      success: true,
      message: '🌟 Divine blog categorization completed successfully!',
      results: {
        categories: categoryCounts,
        totalPosts: categorizedPosts.length,
        categorizedPosts: categorizedCount,
        uncategorizedPosts: categorizedPosts.length - categorizedCount
      },
      samplePosts: categorizedPosts.slice(0, 10).map(post => ({
        id: post.id,
        title: post.title,
        originalTitle: post.original_title,
        category: post.title?.startsWith('[Consciousness') ? '🧠 Consciousness & Awakening' :
                 post.title?.startsWith('[Esoterica') ? '🏛️ Ancient Wisdom & Mysteries' :
                 post.title?.startsWith('[AI') ? '🤖 AI & Conscious Technology' :
                 post.title?.startsWith('[Crypto') ? '💰 Crypto & Decentralized Sovereignty' :
                 post.title?.startsWith('[Divine') ? '🌱 Divine Lifestyle & New Earth' :
                 post.title?.startsWith('[Mythology') ? '⚡ Mythology & Archetypes' :
                 post.title?.startsWith('[Global') ? '🌍 Global Shifts & Conscious Culture' :
                 '❓ Uncategorized'
      }))
    })

  } catch (error) {
    console.error('❌ Categorization error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred during categorization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}