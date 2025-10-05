import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { BlogPost } from '@/types/index'

interface DatabasePost {
  id: string
  org_id: string
  title: string
  content: string
  excerpt?: string
  category?: string
  state: string
  published_at?: string
  created_at: string
  updated_at: string
  average_rating?: number
  rating_count?: number
  organizations?: {
    id: string
    name: string
  } | null
  images?: Array<{
    id: string
    url: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Portfolio API - Starting request')
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Portfolio API - Parameters:', { category, limit, offset })

    // Test Supabase connection first
    console.log('🔍 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabaseAdmin
      .from('blog_posts')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Supabase connection error:', testError)
      return NextResponse.json(
        { error: 'Database connection failed', details: testError.message },
        { status: 500 }
      )
    }

    console.log('✅ Supabase connection OK')

    // Simplified query - only use columns that exist
    let query = supabaseAdmin
      .from('blog_posts')
      .select('id, org_id, title, content, category, state, published_at, created_at, updated_at')
      .eq('state', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by category if not 'all'
    if (category !== 'all') {
      query = query.eq('category', category)
    }

    console.log('🔍 Executing query...')
    const { data: posts, error } = await query

    if (error) {
      console.error('❌ Portfolio API Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Portfolio API - Found ${posts?.length || 0} posts for category: ${category}`)

    // Simple transformation
    const transformedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      org_id: post.org_id,
      title: post.title,
      content: post.content,
      excerpt: post.content ? post.content.substring(0, 200) + '...' : '', // Generate excerpt from content
      category: post.category,
      state: post.state,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      average_rating: null,
      rating_count: null,
      organizations: null,
      images: []
    }))

    const result = {
      posts: transformedPosts,
      total: transformedPosts.length,
      category,
      limit,
      offset,
      debug: {
        supabaseConnected: true,
        queryExecuted: true,
        postsFound: posts?.length || 0
      }
    }

    console.log('✅ Portfolio API - Returning result:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Portfolio API - Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          supabaseConnected: false,
          queryExecuted: false,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      },
      { status: 500 }
    )
  }
}
