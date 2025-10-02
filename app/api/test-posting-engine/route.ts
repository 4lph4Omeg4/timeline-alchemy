import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Posting Engine...')
    
    const supabase = createClient()
    
    // Get a test post
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        organizations:org_id (
          id,
          name
        )
      `)
      .limit(1)
      .order('created_at', { ascending: false })

    if (postsError || !posts || posts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No posts found for testing' 
      })
    }

    const testPost = posts[0]
    console.log(`📝 Testing with post: ${testPost.title}`)

    // Get social connections for the organization
    const { data: connections, error: connectionsError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('org_id', testPost.org_id)

    if (connectionsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch social connections' 
      })
    }

    console.log(`🔗 Found ${connections?.length || 0} social connections`)

    // Determine available platforms
    const availablePlatforms = []
    if (testPost.social_posts) {
      const socialPosts = testPost.social_posts
      if (socialPosts.twitter || socialPosts.Twitter) availablePlatforms.push('twitter')
      if (socialPosts.linkedin || socialPosts.LinkedIn) availablePlatforms.push('linkedin')
      if (socialPosts.facebook || socialPosts.Facebook) availablePlatforms.push('facebook')
      if (socialPosts.instagram || socialPosts.Instagram) availablePlatforms.push('instagram')
      if (socialPosts.youtube || socialPosts.YouTube) availablePlatforms.push('youtube')
      if (socialPosts.discord || socialPosts.Discord) availablePlatforms.push('discord')
      if (socialPosts.reddit || socialPosts.Reddit) availablePlatforms.push('reddit')
      if (socialPosts.telegram || socialPosts.Telegram) availablePlatforms.push('telegram')
    }

    console.log(`📱 Available platforms: ${availablePlatforms.join(', ')}`)

    // Check which platforms have connections
    const connectedPlatforms = []
    const missingConnections = []

    for (const platform of availablePlatforms) {
      const connection = connections?.find(conn => conn.platform === platform)
      if (connection) {
        connectedPlatforms.push(platform)
      } else {
        missingConnections.push(platform)
      }
    }

    console.log(`✅ Connected platforms: ${connectedPlatforms.join(', ')}`)
    console.log(`❌ Missing connections: ${missingConnections.join(', ')}`)

    return NextResponse.json({
      success: true,
      message: 'Posting engine test completed',
      testPost: {
        id: testPost.id,
        title: testPost.title,
        org_id: testPost.org_id,
        organization: testPost.organizations?.name
      },
      socialConnections: connections?.map(conn => ({
        platform: conn.platform,
        account_name: conn.account_name,
        has_access_token: !!conn.access_token
      })) || [],
      availablePlatforms,
      connectedPlatforms,
      missingConnections,
      canPost: connectedPlatforms.length > 0,
      summary: {
        totalConnections: connections?.length || 0,
        availablePlatforms: availablePlatforms.length,
        connectedPlatforms: connectedPlatforms.length,
        missingConnections: missingConnections.length
      }
    })

  } catch (error) {
    console.error('💥 Posting engine test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, platforms } = await request.json()
    
    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID is required' 
      })
    }

    console.log(`🧪 Testing manual post for: ${postId}`)
    console.log(`📱 Platforms: ${platforms ? platforms.join(', ') : 'all available'}`)

    // Call the manual post API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/manual-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: postId,
        platforms: platforms
      })
    })

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Manual post failed' 
      })
    }

    console.log(`✅ Manual post test completed`)
    console.log(`📊 Results: ${result.summary?.successful || 0} successful, ${result.summary?.failed || 0} failed`)

    return NextResponse.json({
      success: true,
      message: 'Manual post test completed',
      result: result
    })

  } catch (error) {
    console.error('💥 Manual post test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Manual post test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
