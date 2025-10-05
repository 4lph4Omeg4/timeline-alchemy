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
    
    // 🚀 CREATE ADMIN PACKAGE DIRECTLY - Skip the manual conversion workflow!
    const { data: insertedPackage, error: packageError } = await supabaseClient
      .from('blog_posts')
      .insert({
        org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91', // Admin organization ID  
        title: title, // Clean title without category prefix
        content: content,
        category: category || 'uncategorized', // Store category in dedicated column
        state: 'published', // DIRECT PUBLISH - Available immediately!
        published_at: new Date().toISOString(), // Publish immediately
        created_by_admin: true, // 🎯 This makes it an admin packages immediately!
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

    // Save image to database
    if (generatedImage && insertedPackage?.id) {
      try {
        // Check if this is already a permanent Supabase URL or a temporary DALL-E URL
        const isPermanentUrl = generatedImage.includes('supabase') || generatedImage.includes('storage.googleapis.com')
        
        if (isPermanentUrl) {
          // Image is already permanent, just save the URL
          console.log('✅ Using existing permanent image URL:', generatedImage)
          await supabaseClient
            .from('images')
            .insert({
              org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
              post_id: insertedPackage.id,
              url: generatedImage,
              prompt: `AI generated image for: ${title}`
            })
        } else {
          // Image is temporary (DALL-E), save it permanently
          console.log('🔄 Converting temporary image to permanent storage...')
          const saveImageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/save-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: generatedImage,
              postId: insertedPackage.id,
              orgId: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
              prompt: `AI generated image for: ${title}`
            })
          })

          if (saveImageResponse.ok) {
            const saveImageData = await saveImageResponse.json()
            console.log('✅ Image saved permanently:', saveImageData.permanentUrl)
          } else {
            console.warn('⚠️ Failed to save image permanently, using temporary URL')
            // Fallback to temporary URL if permanent save fails
            await supabaseClient
              .from('images')
              .insert({
                org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
                post_id: insertedPackage.id,
                url: generatedImage,
                prompt: `AI generated image for: ${title}`
              })
          }
        }
      } catch (imageError) {
        console.error('❌ Error saving image:', imageError)
        // Fallback to temporary URL
        await supabaseClient
          .from('images')
          .insert({
            org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
            post_id: insertedPackage.id,
            url: generatedImage,
            prompt: `AI generated image for: ${title}`
          })
      }
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