import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { BlogPost } from '@/types/index'

export const dynamic = 'force-dynamic'

const supabaseUrl = 'https://kjjrzhicspmbiitayrco.supabase.co'

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
  average_rating?: string | number | null
  rating_count?: number | null
  organizations?: {
    id: string
    name: string
  } | null
  images?: Array<{
    id?: string
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

    console.log('🔍 Starting portfolio API...')

    // Query with images join and ratings
    let query = supabaseAdmin
      .from('blog_posts')
      .select(`
        id, 
        org_id, 
        title, 
        content, 
        category, 
        state, 
        published_at, 
        created_at, 
        updated_at,
        average_rating,
        rating_count,
        created_by_user_id,
        images (
          id,
          url,
          prompt,
          style,
          variant_type,
          is_active,
          prompt_number
        ),
        organizations (
          id,
          name
        )
      `)
      .eq('state', 'published')

    // Filter by category BEFORE limiting (important!)
    if (category !== 'all') {
      query = query.eq('category', category)
    }

    // Apply ordering and limit AFTER filtering
    query = query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

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

    // Simple transformation for now - skip social posts temporarily
    // Get social posts for each post separately
    const postsWithSocialPosts = await Promise.all(
      (posts || []).map(async (post: any) => {
        // Try to query social posts for this specific post
        let socialPostsObj = {}
        try {
          const { data: socialPosts, error: socialError } = await supabaseAdmin
            .from('social_posts')
            .select('platform, content')
            .eq('post_id', post.id)

          if (socialError) {
            console.warn(`⚠️ Could not fetch social posts for post ${post.id}:`, socialError.message)
          } else {
            // Transform social posts from array to object format
            socialPostsObj = socialPosts?.reduce((acc: any, social: any) => {
              acc[social.platform] = social.content
              return acc
            }, {}) || {}
          }
        } catch (err) {
          console.warn(`⚠️ Error fetching social posts for post ${post.id}:`, err)
        }

        return {
          id: post.id,
          org_id: post.org_id,
          title: post.title,
          content: post.content,
          excerpt: post.content ? post.content.substring(0, 200) + '...' : '',
          category: post.category,
          state: post.state,
          published_at: post.published_at,
          created_at: post.created_at,
          updated_at: post.updated_at,
          average_rating: post.average_rating ? parseFloat(post.average_rating) : null,
          rating_count: post.rating_count || 0,
          created_by_user_id: post.created_by_user_id || null,
          organizations: post.organizations ? {
            ...post.organizations,
            name: post.organizations.name === 'Admin Organization' ? 'Timeline Alchemy' : post.organizations.name
          } : null,
          images: post.images || [],
          social_posts: socialPostsObj
        }
      })
    )

    const result = {
      posts: postsWithSocialPosts,
      total: postsWithSocialPosts.length,
      category,
      limit,
      offset,
      debug: {
        supabaseConnected: true,
        queryExecuted: true,
        postsFound: postsWithSocialPosts.length
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
