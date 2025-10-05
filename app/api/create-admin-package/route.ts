import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, hashtags, suggestions, userId, socialPosts, generatedImage, category } = body
    
    console.log('🔍 Debug - Received generatedImage:', generatedImage)
    console.log('🔍 Debug - GeneratedImage type:', typeof generatedImage)
    console.log('🔍 Debug - GeneratedImage length:', generatedImage?.length)

    console.log('🔍 Create admin package request:', {
      title: title,
      hasContent: !!content,
      contentLength: content?.length || 0,
      hasSocialPosts: !!socialPosts,
      socialPostsKeys: socialPosts ? Object.keys(socialPosts) : [],
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
        social_posts: socialPosts || {}, // 🔧 ALSO save in JSONB column for scheduled publisher
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

    console.log('✅ Admin package created successfully:', {
      id: insertedPackage?.id,
      title: insertedPackage?.title,
      hasSocialPostsInJSONB: !!insertedPackage?.social_posts,
      socialPostsKeysInJSONB: insertedPackage?.social_posts ? Object.keys(insertedPackage.social_posts) : []
    })

    // Save social posts to separate table (like working content generator)
    if (socialPosts && Object.keys(socialPosts).length > 0) {
      console.log('🔧 Saving social posts to separate table:', Object.keys(socialPosts))
      for (const [platform, socialContent] of Object.entries(socialPosts)) {
        await supabaseClient
          .from('social_posts')
          .insert({
            post_id: insertedPackage.id,
            platform,
            content: socialContent
          })
      }
      console.log('✅ Social posts saved to separate table')
    } else {
      console.log('⚠️ No social posts to save to separate table')
    }

    // Save image permanently AFTER post creation (now we have the real postId)
    if (generatedImage && insertedPackage?.id) {
      console.log('🔄 Starting permanent image save process...')
      console.log('🔍 Image URL:', generatedImage)
      console.log('🔍 Post ID:', insertedPackage.id)
      try {
        // Download the image from DALL-E URL
        const imageResponse = await fetch(generatedImage)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        const imageBlob = await imageResponse.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log('🔄 Image downloaded, size:', buffer.length)

        // Generate unique filename
        const timestamp = Date.now()
        const filename = `e6c0db74-03ee-4bb3-b08d-d94512efab91/${insertedPackage.id}-${timestamp}.png`
        console.log('🔄 Uploading to filename:', filename)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('blog-images')
          .upload(filename, buffer, {
            contentType: 'image/png',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        console.log('✅ Upload successful:', uploadData)

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('blog-images')
          .getPublicUrl(filename)

        console.log('✅ Public URL:', publicUrl)

        // Save to images table
        const { error: dbError } = await supabaseClient
          .from('images')
          .insert({
            org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
            post_id: insertedPackage.id,
            url: publicUrl,
            prompt: `AI generated image for: ${title}`
          })

        if (dbError) {
          console.error('❌ Database error:', dbError)
          throw new Error(`Failed to save image to database: ${dbError.message}`)
        }

        console.log('✅ Image saved permanently to database:', publicUrl)
        
      } catch (imageError) {
        console.error('❌ Error saving image permanently:', imageError)
        console.log('🔄 Attempting fallback: saving temporary URL to database')
        
        // Fallback: save temporary URL to database
        try {
          const { error: fallbackError } = await supabaseClient
            .from('images')
            .insert({
              org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
              post_id: insertedPackage.id,
              url: generatedImage,
              prompt: `AI generated image for: ${title}`
            })
          
          if (fallbackError) {
            console.error('❌ Fallback save also failed:', fallbackError)
          } else {
            console.log('⚠️ Saved temporary URL as fallback')
          }
        } catch (fallbackError) {
          console.error('❌ Fallback save also failed:', fallbackError)
        }
      }
    } else {
      console.log('⚠️ No image to save or no post ID available')
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