import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking scheduled posts...')
    
    // Get all scheduled posts
    const { data: scheduledPosts, error: postsError } = await (supabaseAdmin as any)
      .from('blog_posts')
      .select(`
        id,
        title,
        state,
        scheduled_for,
        published_at,
        created_at,
        social_posts,
        organizations:org_id (
          id,
          name
        )
      `)
      .not('scheduled_for', 'is', null)
      .order('scheduled_for', { ascending: false })

    if (postsError) {
      console.error('❌ Error fetching scheduled posts:', postsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch scheduled posts',
        details: postsError
      })
    }

    // Get current time
    const now = new Date().toISOString()
    
    // Categorize posts
    const overdue = scheduledPosts?.filter(post => 
      post.scheduled_for < now && post.state === 'scheduled'
    ) || []
    
    const upcoming = scheduledPosts?.filter(post => 
      post.scheduled_for >= now && post.state === 'scheduled'
    ) || []
    
    const published = scheduledPosts?.filter(post => 
      post.state === 'published'
    ) || []

    return NextResponse.json({
      success: true,
      currentTime: now,
      summary: {
        total: scheduledPosts?.length || 0,
        overdue: overdue.length,
        upcoming: upcoming.length,
        published: published.length
      },
      overdue: overdue,
      upcoming: upcoming.slice(0, 5), // Only show next 5
      published: published.slice(0, 5), // Only show last 5
      allScheduled: scheduledPosts
    })

  } catch (error) {
    console.error('❌ Error in scheduled-posts debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
