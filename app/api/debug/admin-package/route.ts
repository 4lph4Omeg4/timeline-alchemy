import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking admin package content...')
    
    // Get the latest admin package
    const { data: adminPackage, error: packageError } = await (supabaseAdmin as any)
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        social_posts,
        created_by_admin,
        created_at,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('created_by_admin', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (packageError) {
      console.error('❌ Error fetching admin package:', packageError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch admin package',
        details: packageError
      })
    }

    // Parse social posts if they exist
    let socialPostsParsed = null
    if (adminPackage.social_posts) {
      try {
        socialPostsParsed = typeof adminPackage.social_posts === 'string' 
          ? JSON.parse(adminPackage.social_posts) 
          : adminPackage.social_posts
      } catch (e) {
        console.error('❌ Error parsing social posts:', e)
      }
    }

    return NextResponse.json({
      success: true,
      adminPackage: {
        ...adminPackage,
        social_posts_parsed: socialPostsParsed
      },
      analysis: {
        hasSocialPosts: !!adminPackage.social_posts,
        socialPostsCount: socialPostsParsed ? Object.keys(socialPostsParsed).length : 0,
        platformsWithContent: socialPostsParsed ? Object.keys(socialPostsParsed) : [],
        hasTelegram: socialPostsParsed ? 'telegram' in socialPostsParsed : false,
        telegramContent: socialPostsParsed?.telegram || null
      }
    })

  } catch (error) {
    console.error('❌ Error in admin-package debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
