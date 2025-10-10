import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { postId, platforms } = await request.json()
    
    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID is required' 
      })
    }

    console.log(`🚀 Manual post trigger for post: ${postId}`)
    console.log(`📱 Platforms: ${platforms ? platforms.join(', ') : 'all available'}`)

    const supabase = supabaseAdmin
    
    // Get the post data
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    console.log(`📝 Post found: ${(post as any).title}`)

    // Determine platforms to post to
    let targetPlatforms = platforms || []
    
    if (targetPlatforms.length === 0) {
      // Auto-detect platforms from social_posts
      if ((post as any).social_posts) {
        const socialPosts = (post as any).social_posts
        
        if (socialPosts.twitter || socialPosts.Twitter) targetPlatforms.push('twitter')
        if (socialPosts.linkedin || socialPosts.LinkedIn) targetPlatforms.push('linkedin')
        if (socialPosts.facebook || socialPosts.Facebook) targetPlatforms.push('facebook')
        if (socialPosts.instagram || socialPosts.Instagram) targetPlatforms.push('instagram')
        if (socialPosts.youtube || socialPosts.YouTube) targetPlatforms.push('youtube')
        if (socialPosts.discord || socialPosts.Discord) targetPlatforms.push('discord')
        if (socialPosts.reddit || socialPosts.Reddit) targetPlatforms.push('reddit')
        if (socialPosts.telegram || socialPosts.Telegram) targetPlatforms.push('telegram')
      }
    }

    if (targetPlatforms.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No platforms found for posting' 
      })
    }

    console.log(`🎯 Target platforms: ${targetPlatforms.join(', ')}`)

    // Call the posting engine
    const postingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/post-to-platforms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: postId,
        platforms: targetPlatforms
      })
    })

    if (!postingResponse.ok) {
      const error = await postingResponse.json()
      throw new Error(`Posting failed: ${error.error || error.message}`)
    }

    const postingResult = await postingResponse.json()
    
    console.log(`✅ Manual posting complete for: ${(post as any).title}`)
    console.log(`📊 Results: ${postingResult.results?.length || 0} successful, ${postingResult.errors?.length || 0} failed`)

    return NextResponse.json({
      success: true,
      message: `Manual posting completed for: ${(post as any).title}`,
      post: {
        id: (post as any).id,
        title: (post as any).title,
        platforms: targetPlatforms
      },
      results: postingResult.results,
      errors: postingResult.errors,
      summary: {
        total: targetPlatforms.length,
        successful: postingResult.results?.length || 0,
        failed: postingResult.errors?.length || 0
      }
    })

  } catch (error) {
    console.error('💥 Manual post trigger error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Manual posting failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID is required' 
      })
    }

    const supabase = supabaseAdmin
    
    // Get the post data
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    // Get available platforms for this post
    const availablePlatforms = []
    
    if ((post as any).social_posts) {
      const socialPosts = (post as any).social_posts
      
      if (socialPosts.twitter || socialPosts.Twitter) availablePlatforms.push('twitter')
      if (socialPosts.linkedin || socialPosts.LinkedIn) availablePlatforms.push('linkedin')
      if (socialPosts.facebook || socialPosts.Facebook) availablePlatforms.push('facebook')
      if (socialPosts.instagram || socialPosts.Instagram) availablePlatforms.push('instagram')
      if (socialPosts.youtube || socialPosts.YouTube) availablePlatforms.push('youtube')
      if (socialPosts.discord || socialPosts.Discord) availablePlatforms.push('discord')
      if (socialPosts.reddit || socialPosts.Reddit) availablePlatforms.push('reddit')
      if (socialPosts.telegram || socialPosts.Telegram) availablePlatforms.push('telegram')
    }

    return NextResponse.json({
      success: true,
      post: {
        id: (post as any).id,
        title: (post as any).title,
        content: (post as any).content,
        social_posts: (post as any).social_posts,
        scheduled_for: (post as any).scheduled_for,
        published_at: (post as any).published_at,
        state: (post as any).state
      },
      availablePlatforms,
      canPost: availablePlatforms.length > 0
    })

  } catch (error) {
    console.error('💥 Manual post info error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get post info',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
