import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    
    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        social_posts,
        scheduled_for,
        published_at,
        state,
        created_at,
        organizations:org_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by organization if provided
    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('state', status)
    }

    const { data: posts, error } = await query

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch posts' 
      })
    }

    // Get status summary
    const { data: statusSummary } = await supabase
      .from('blog_posts')
      .select('state')
      .eq('org_id', orgId || '')

    const summary = {
      total: statusSummary?.length || 0,
      scheduled: statusSummary?.filter(p => p.state === 'scheduled').length || 0,
      posted: statusSummary?.filter(p => p.state === 'published').length || 0,
      failed: 0, // No failed state in current schema
      partial: 0 // No partial state in current schema
    }

    return NextResponse.json({
      success: true,
      posts,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: posts.length === limit
      }
    })

  } catch (error) {
    console.error('Status tracking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, status, errorMessage } = await request.json()
    
    if (!postId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID and status are required' 
      })
    }

    const supabase = supabaseAdmin
    
    const updateData: any = {
      state: status
    }

    if (status === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { error } = await (supabase as any)
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update post status' 
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Post status updated successfully'
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
