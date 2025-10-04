import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    console.log('🌟 Starting divine blog categorization...')

    // Get all posts
    const { data: allPosts, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, content')

    if (fetchError || !allPosts) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch posts' 
      }, { status: 500 })
    }

    // Filter uncategorized posts
    const uncategorizedPosts = allPosts.filter((post: any) => 
      post.title && !post.title.includes('[')
    )

    console.log(`📊 Found ${uncategorizedPosts.length} uncategorized posts`)

    const results: Record<string, number> = {
      consciousness: 0,
      ancient: 0,
      ai: 0,
      crypto: 0,
      lifestyle: 0,
      mythology: 0,
      global: 0,
      uncategorized: 0
    }

    const categorized = []

    // Categorize posts
    for (const post of uncategorizedPosts as any[]) {
      const title = (post.title || '').toLowerCase()
      const content = (post.content || '').toLowerCase()
      
      let category = ''
      let prefix = ''

      if (title.includes('consciousness') || title.includes('awakening') || 
          title.includes('enlightenment') || title.includes('meditation') ||
          content.includes('consciousness') || content.includes('awakening')) {
        category = 'consciousness'
        prefix = '[Consciousness & Awakening & Enlightenment]'
      } else if (title.includes('ancient') || title.includes('wisdom') || 
                 title.includes('esoteric') || title.includes('mystical') ||
                 content.includes('ancient')) {
        category = 'ancient'
        prefix = '[Esoterica & Ancient Wisdom & Mysteries]'
      } else if (title.includes('ai') || title.includes('technology') || 
                 title.includes('future') || title.includes('innovation') ||
                 content.includes('artificial')) {
        category = 'ai'
        prefix = '[AI & Conscious Technology & Future]'
      } else if (title.includes('crypto') || title.includes('bitcoin') || 
                 title.includes('blockchain') || title.includes('decentralized') ||
                 content.includes('cryptocurrency')) {
        category = 'crypto'
        prefix = '[Crypto & Decentralized Sovereignty]'
      } else if (title.includes('lifestyle') || title.includes('wellness') || 
                 title.includes('harmony') || title.includes('balance') ||
                 title.includes('new earth')) {
        category = 'lifestyle'
        prefix = '[Divine Lifestyle & New Earth & Harmony]'
      } else if (title.includes('mythology') || title.includes('archetype') || 
                 title.includes('legend') || title.includes('goddess')) {
        category = 'mythology'
        prefix = '[Mythology & Archetypes & Ancient Secrets]'
      } else if (title.includes('global') || title.includes('culture') || 
                 title.includes('society') || title.includes('movement') ||
                 title.includes('evolution')) {
        category = 'global'
        prefix = '[Global Shifts & Conscious Culture & Awakening]'
      }

      if (category && prefix) {
        const newTitle = `${prefix} ${post.title}`
        
        const { error } = await (supabaseAdmin as any)
          .from('blog_posts')
          .update({ title: newTitle })
          .eq('id', post.id)

        if (!error) {
          results[category]++
          categorized.push({ id: post.id, oldTitle: post.title, newTitle, category })
        }
      } else {
        results.uncategorized++
      }
    }

    const totalCategorized = Object.values(results).reduce((sum, count) => sum + count, 0) - results.uncategorized

    return NextResponse.json({
      success: true,
      message: `✨ Successfully categorized ${totalCategorized} posts!`,
      results: {
        categories: {
          '🧠 Consciousness & Awakening': results.consciousness,
          '🏛️ Ancient Wisdom & Mysteries': results.ancient,
          '🤖 AI & Conscious Technology': results.ai,
          '💰 Crypto & Decentralized Sovereignty': results.crypto,
          '🌱 Divine Lifestyle & New Earth': results.lifestyle,
          '⚡ Mythology & Archetypes': results.mythology,
          '🌍 Global Shifts & Conscious Culture': results.global,
          '❓ Uncategorized': results.uncategorized
        },
        totalPosts: allPosts.length,
        categorizedPosts: totalCategorized,
        uncategorizedPosts: results.uncategorized
      },
      categorizedPosts: categorized
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