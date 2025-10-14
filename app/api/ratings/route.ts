import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, postId, rating, reviewText } = await request.json()

    if (!userId || !postId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Insert or update rating
    const { data, error } = await (supabaseAdmin as any)
      .from('ratings')
      .upsert({
        user_id: userId,
        post_id: postId,
        rating: rating,
        review_text: reviewText || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving rating:', error)
      return NextResponse.json({ success: false, error: 'Failed to save rating' }, { status: 500 })
    }

    console.log('✅ Rating saved successfully:', data)

    return NextResponse.json({ 
      success: true,
      message: 'Rating saved successfully',
      rating: data 
    })

  } catch (error) {
    console.error('Rating API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const userId = searchParams.get('userId')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Get all ratings for this post
    const { data: ratings, error } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ratings:', error)
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
    }

    // If userId is provided, find their specific rating
    let userRating = null
    if (userId) {
      userRating = ratings?.find((r: any) => r.user_id === userId) || null
    }

    return NextResponse.json({ 
      success: true,
      ratings,
      userRating 
    })

  } catch (error) {
    console.error('Rating API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
