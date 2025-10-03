import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId parameter required' 
      })
    }
    
    console.log('🔍 Checking organizations for user:', userId)
    
    // Get user's organization memberships
    const { data: memberships, error: membershipsError } = await (supabaseAdmin as any)
      .from('org_members')
      .select(`
        org_id,
        role,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch memberships',
        details: membershipsError
      })
    }

    // Get posts from each organization
    const orgIds = memberships?.map(m => m.org_id) || []
    const { data: posts, error: postsError } = await (supabaseAdmin as any)
      .from('blog_posts')
      .select(`
        id,
        title,
        state,
        org_id,
        created_by_admin,
        organizations:org_id (
          id,
          name
        )
      `)
      .in('org_id', orgIds)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError)
    }

    return NextResponse.json({
      success: true,
      userId,
      memberships: memberships || [],
      posts: posts || [],
      analysis: {
        totalOrganizations: memberships?.length || 0,
        totalPosts: posts?.length || 0,
        postsByOrg: posts?.reduce((acc, post) => {
          const orgName = post.organizations?.name || 'Unknown'
          acc[orgName] = (acc[orgName] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {},
        adminPosts: posts?.filter(p => p.created_by_admin).length || 0,
        userPosts: posts?.filter(p => !p.created_by_admin).length || 0
      }
    })

  } catch (error) {
    console.error('❌ Error in user-orgs debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
