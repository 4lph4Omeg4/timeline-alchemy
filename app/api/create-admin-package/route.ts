import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, hashtags, suggestions, userId, socialPosts, generatedImage } = body

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

    // 🔧 ADMIN-ONLY SIMPLE STRATEGY: Use the known admin organization ID
    console.log('🔍 Using admin organization for this admin-only package...')
    
    // Create package data with all fields
    const packageData = {
      org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91', // Admin organization ID
      title: title, // No admin prefix needed since this is admin-only
      content: content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      state: 'draft',
      metadata: {
        socialPosts: socialPosts || {},
        generatedImage: generatedImage || null,
        hashtags: hashtags || [],
        suggestions: suggestions || [],
        source: 'bulk_content_generator',
        created_at: new Date().toISOString()
      }
    }
    
    const { data: insertedPackage, error: packageError } = await supabaseClient
      .from('blog_posts')
      .insert(packageData)
      .select()
      .single()
    
    // If we have a generated image, save it to the images table
    if (generatedImage && insertedPackage?.id) {
      console.log('🖼️ Saving generated image for package:', insertedPackage.id)
      
      await supabaseClient
        .from('images')
        .insert({
          org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91', // Same admin organization
          post_id: insertedPackage.id, // Use post_id as per schema
          url: generatedImage
        })
        .select()
        .single()
    }

    if (packageError) {
      console.error('❌ Error creating admin package:', packageError)
      return NextResponse.json(
        { error: 'Failed to create package', details: packageError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Admin package created successfully:', packageData)

    return NextResponse.json({
      success: true,
      package: packageData,
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