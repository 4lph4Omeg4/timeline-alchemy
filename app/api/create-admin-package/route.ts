import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, hashtags, suggestions, userId, socialPosts, generatedImage, category } = body

    console.log('🔍 Create admin package request:', {
      title: title,
      hasContent: !!content,
      contentLength: content?.length || 0,
      hasSocialPosts: !!socialPosts,
      hasGeneratedImage: !!generatedImage,
      userId: userId
    })
    
    if (!title || !content) {
      console.error('❌ Missing required fields:', {
        title: title,
        sourceContent: content
      })
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 🔧 ADMIN-ONLY SIMPLE STRATEGY: Mimic the working content generator
    console.log('🔍 Using admin organization for this admin-only package...')
    
    // Create basic blog post with category metadata (like the working content generator)
    const { data: insertedPackage, error: packageError } = await supabaseClient
      .from('blog_posts')
      .insert({
        org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91', // Admin organization ID
        title: category ? `[${category}] ${title}` : title,
        content: content,
        state: 'draft',
        // Note: category prefix added to title for visibility
      })
      .select()
      .single()

    if (packageError) {
      console.error('❌ Save post error:', packageError)
      return NextResponse.json(
        { error: 'Failed to save post', details: packageError.message },
        { status: 500 }
      )
    }

    // Save social posts to separate table (like working content generator)
    if (socialPosts && Object.keys(socialPosts).length > 0) {
      for (const [platform, socialContent] of Object.entries(socialPosts)) {
        await supabaseClient
          .from('social_posts')
          .insert({
            post_id: insertedPackage.id,
            platform,
            content: socialContent
          })
      }
    }

    // Save image (simple approach like working generator)
    if (generatedImage && insertedPackage?.id) {
      await supabaseClient
        .from('images')
        .insert({
          org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
          post_id: insertedPackage.id,
          url: generatedImage
        })
    }
    
    console.log('✅ Admin package created successfully:', insertedPackage?.id)

    return NextResponse.json({
      success: true,
      package: insertedPackage,
      message: 'Admin package created successfully'
    })

  } catch (error) {
    console.error('❌ Create admin package error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}