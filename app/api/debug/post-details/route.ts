import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Skip during build process
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped during build',
        timestamp: new Date().toISOString()
      })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId') || '6987e819-aa95-43ad-bc53-c73293750dcf'
    
    console.log('🔍 Checking post details for:', postId)
    
    // Get the specific post
    const { data: post, error: postError } = await (supabaseAdmin as any)
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        state,
        scheduled_for,
        published_at,
        social_posts,
        org_id,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('❌ Error fetching post:', postError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch post',
        details: postError
      })
    }

    // Get social connections for this organization
    const { data: connections, error: connError } = await (supabaseAdmin as any)
      .from('social_connections')
      .select('*')
      .eq('org_id', post.org_id)

    if (connError) {
      console.error('❌ Error fetching connections:', connError)
    }

    // Parse social posts if they exist
    let socialPostsParsed = null
    if (post.social_posts) {
      try {
        socialPostsParsed = typeof post.social_posts === 'string' 
          ? JSON.parse(post.social_posts) 
          : post.social_posts
      } catch (e) {
        console.error('❌ Error parsing social posts:', e)
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        social_posts_parsed: socialPostsParsed
      },
      connections: connections || [],
      analysis: {
        hasSocialPosts: !!post.social_posts,
        socialPostsCount: socialPostsParsed ? Object.keys(socialPostsParsed).length : 0,
        connectionsCount: connections?.length || 0,
        platformsWithContent: socialPostsParsed ? Object.keys(socialPostsParsed) : [],
        platformsWithConnections: connections?.map((c: any) => c.platform) || []
      }
    })

  } catch (error) {
    console.error('❌ Error in post-details debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
