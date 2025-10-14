import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    console.log('🔍 Debug: Checking social connections for post:', postId)
    
    // Get the post data
    const { data: post, error: postError } = await supabaseAdmin
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
        error: 'Post not found',
        details: postError
      })
    }

    console.log('📝 Post found:', {
      id: post.id,
      title: post.title,
      orgId: post.org_id,
      orgName: post.organizations?.name
    })

    // Get social connections for the organization
    // Clients have their own social connections in their own organization
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .eq('org_id', post.org_id)

    console.log('🔗 Social connections:', {
      postOrgId: post.org_id,
      count: connections?.length || 0,
      platforms: connections?.map(c => c.platform) || [],
      error: connectionsError
    })

    // Check if post has social_posts data
    const socialPosts = post.social_posts || {}
    console.log('📱 Social posts available:', Object.keys(socialPosts))

    return NextResponse.json({
      success: true,
      debug: {
        post: {
          id: post.id,
          title: post.title,
          orgId: post.org_id,
          orgName: post.organizations?.name,
          hasSocialPosts: !!post.social_posts
        },
        connections: {
          postOrgId: post.org_id,
          count: connections?.length || 0,
          platforms: connections?.map(c => ({
            platform: c.platform,
            orgId: c.org_id,
            accountId: c.account_id,
            hasAccessToken: !!c.access_token,
            expiresAt: c.expires_at
          })) || [],
          error: connectionsError
        },
        socialPosts: {
          available: Object.keys(socialPosts),
          sample: Object.keys(socialPosts).reduce((acc, platform) => {
            acc[platform] = socialPosts[platform]?.substring(0, 100) + '...'
            return acc
          }, {} as Record<string, string>)
        }
      }
    })

  } catch (error) {
    console.error('💥 Debug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
