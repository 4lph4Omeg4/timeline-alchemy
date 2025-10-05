import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug API - Checking database content')

    // Check total posts count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Count error:', countError)
      return NextResponse.json({ error: 'Count error', details: countError.message }, { status: 500 })
    }

    // Check published posts count
    const { count: publishedCount, error: publishedCountError } = await supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('state', 'published')

    if (publishedCountError) {
      console.error('❌ Published count error:', publishedCountError)
      return NextResponse.json({ error: 'Published count error', details: publishedCountError.message }, { status: 500 })
    }

    // Get sample posts
    const { data: samplePosts, error: sampleError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, state, category, published_at, created_at')
      .limit(10)

    if (sampleError) {
      console.error('❌ Sample posts error:', sampleError)
      return NextResponse.json({ error: 'Sample posts error', details: sampleError.message }, { status: 500 })
    }

    // Get categories
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('blog_posts')
      .select('category')
      .not('category', 'is', null)

    const uniqueCategories = Array.from(new Set(categories?.map(c => c.category) || []))

    // Check organizations
    const { data: orgs, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .limit(5)

    console.log('✅ Debug results:', {
      totalCount,
      publishedCount,
      samplePosts: samplePosts?.length || 0,
      categories: uniqueCategories,
      organizations: orgs?.length || 0
    })

    return NextResponse.json({
      totalPosts: totalCount,
      publishedPosts: publishedCount,
      samplePosts: samplePosts || [],
      categories: uniqueCategories,
      organizations: orgs || [],
      message: 'Debug info retrieved successfully'
    })

  } catch (error) {
    console.error('❌ Debug API - Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
