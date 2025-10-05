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
  }
  images?: Array<{
    id: string
    url: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Portfolio API - Fetching posts for category:', category)

    // Build the query
    let query = supabaseAdmin
      .from('blog_posts')
      .select(`
        id,
        org_id,
        title,
        content,
        excerpt,
        category,
        state,
        published_at,
        created_at,
        updated_at,
        average_rating,
        rating_count,
        organizations (
          id,
          name
        ),
        images (
          id,
          url
        )
      `)
      .eq('state', 'published') // Only published posts
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by category if not 'all'
    if (category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('❌ Portfolio API Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Portfolio API - Found ${posts?.length || 0} posts for category: ${category}`)

    // Transform the data to match our interface
    const transformedPosts: BlogPost[] = (posts as DatabasePost[] || []).map(post => ({
      id: post.id,
      org_id: post.org_id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      state: post.state as 'draft' | 'scheduled' | 'published',
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      average_rating: post.average_rating,
      rating_count: post.rating_count,
      organizations: post.organizations,
      images: post.images
    }))

    return NextResponse.json({
      posts: transformedPosts,
      total: transformedPosts.length,
      category,
      limit,
      offset
    })

  } catch (error) {
    console.error('❌ Portfolio API - Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
