import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
      id: (post as any).id,
      title: (post as any).title,
      orgId: (post as any).org_id,
      orgName: (post as any).organizations?.name
    })

    // Get social connections for the organization
    // Clients have their own social connections in their own organization
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .eq('org_id', (post as any).org_id)

    console.log('🔗 Social connections:', {
      postOrgId: (post as any).org_id,
      count: connections?.length || 0,
      platforms: connections?.map((c: any) => c.platform) || [],
      error: connectionsError
    })

    // Check if post has social_posts data
    let socialPosts = (post as any).social_posts || {}

    // Also fetch from social_posts table
    const { data: socialPostsTableData } = await supabaseAdmin
      .from('social_posts')
      .select('platform, content')
      .eq('post_id', postId)

    if (socialPostsTableData && socialPostsTableData.length > 0) {
      socialPostsTableData.forEach((sp: any) => {
        // Normalize platform names to lowercase for consistency
        const platformKey = sp.platform.toLowerCase()
        if (!socialPosts[platformKey]) {
          socialPosts[platformKey] = sp.content
        }
        // Also keep original case just in case
        if (!socialPosts[sp.platform]) {
          socialPosts[sp.platform] = sp.content
        }
      })
    }

    console.log('📱 Social posts available:', Object.keys(socialPosts))

    return NextResponse.json({
      success: true,
      debug: {
        post: {
          id: (post as any).id,
          title: (post as any).title,
          orgId: (post as any).org_id,
          orgName: (post as any).organizations?.name,
          hasSocialPosts: !!(post as any).social_posts
        },
        connections: {
          postOrgId: (post as any).org_id,
          count: connections?.length || 0,
          platforms: connections?.map((c: any) => ({
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
