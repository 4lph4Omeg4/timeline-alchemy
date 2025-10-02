import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

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

    const supabase = createClient()
    
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

    console.log(`📝 Post found: ${post.title}`)

    // Determine platforms to post to
    let targetPlatforms = platforms || []
    
    if (targetPlatforms.length === 0) {
      // Auto-detect platforms from social_posts
      if (post.social_posts) {
        const socialPosts = post.social_posts
        
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
    const postingResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/post-to-platforms`, {
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
    
    console.log(`✅ Manual posting complete for: ${post.title}`)
    console.log(`📊 Results: ${postingResult.results?.length || 0} successful, ${postingResult.errors?.length || 0} failed`)

    return NextResponse.json({
      success: true,
      message: `Manual posting completed for: ${post.title}`,
      post: {
        id: post.id,
        title: post.title,
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

    const supabase = createClient()
    
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
    
    if (post.social_posts) {
      const socialPosts = post.social_posts
      
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
        id: post.id,
        title: post.title,
        content: post.content,
        social_posts: post.social_posts,
        scheduled_for: post.scheduled_for,
        posted_at: post.posted_at,
        post_status: post.post_status,
        error_message: post.error_message
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
