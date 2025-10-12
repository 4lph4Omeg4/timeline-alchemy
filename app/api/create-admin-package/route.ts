import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { incrementUsage } from '@/lib/subscription-limits'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, hashtags, suggestions, userId, socialPosts, generatedImages, category } = body
    
    console.log('🔍 Debug - Received generatedImages:', generatedImages)
    console.log('🔍 Debug - GeneratedImages is array:', Array.isArray(generatedImages))
    console.log('🔍 Debug - GeneratedImages count:', generatedImages?.length)

    console.log('🔍 Create admin package request:', {
      title: title,
      hasContent: !!content,
      contentLength: content?.length || 0,
      hasSocialPosts: !!socialPosts,
      socialPostsKeys: socialPosts ? Object.keys(socialPosts) : [],
      hasGeneratedImages: !!generatedImages,
      generatedImagesCount: generatedImages?.length || 0,
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

    // Use Admin Organization directly (simplified for single-user setup)
    const { data: adminOrg } = await supabaseClient
      .from('organizations')
      .select('id, name')
      .eq('name', 'Admin Organization')
      .single()

    if (!adminOrg) {
      return NextResponse.json({
        error: 'Admin organization not found'
      }, { status: 500 })
    }

    const userOrgId = adminOrg.id
    console.log('🏢 Using Admin Organization:', userOrgId)

    // Skip org_members lookup
    const orgMembers = [{ org_id: userOrgId, role: 'admin' }]

    if (!orgMembers || orgMembers.length === 0) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 400 }
      )
    }

    // userOrgId is already set above (Admin Organization)
    console.log('🔍 Checking limits for org:', userOrgId)

    // Check subscription limits directly (no fetch needed)
    const { checkPlanLimits } = await import('@/lib/subscription-limits')
    const limitResult = await checkPlanLimits(userOrgId, 'contentPackage')
    
    console.log('🔍 Limit check result:', limitResult)
    
    if (!limitResult.allowed) {
      console.log('❌ Limit check failed:', limitResult.reason)
      return NextResponse.json(
        { error: limitResult.reason || 'Plan limit reached' },
        { status: 403 }
      )
    }
    
    console.log('✅ Limit check passed - Admin Organization has unlimited access')

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

    // Save images permanently AFTER post creation (now we have the real postId)
    if (generatedImages && Array.isArray(generatedImages) && generatedImages.length > 0 && insertedPackage?.id) {
      console.log(`🔄 Starting permanent save for ${generatedImages.length} images...`)
      console.log('🔍 Post ID:', insertedPackage.id)
      
      try {
        // Prepare images for database
        const imagesToInsert = generatedImages.map((img: any, index: number) => ({
          org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91',
          post_id: insertedPackage.id,
          url: img.url,
          prompt: img.prompt || `AI generated image ${index + 1} for: ${title}`,
          style: img.style || 'photorealistic',
          variant_type: img.variantType || 'original',
          is_active: img.isActive !== undefined ? img.isActive : false,
          prompt_number: img.promptNumber || (index + 1),
          style_group: img.styleGroup || crypto.randomUUID()
        }))
        
        console.log(`🔄 Saving ${imagesToInsert.length} images to database...`)
        console.log('🔍 Images to insert:', JSON.stringify(imagesToInsert, null, 2))
        
        // Save to images table
        const { data: insertedImages, error: dbError } = await (supabaseClient as any)
          .from('images')
          .insert(imagesToInsert)
          .select()

        if (dbError) {
          console.error('❌ Database error saving images:', dbError)
          console.error('❌ Error details:', JSON.stringify(dbError, null, 2))
          // Don't throw - continue even if images fail
        } else {
          console.log(`✅ ${imagesToInsert.length} images saved to database successfully`)
          console.log('✅ Inserted images:', insertedImages)
        }
        
      } catch (imageError) {
        console.error('❌ Error saving images permanently:', imageError)
      }
    } else {
      console.log('⚠️ No images to save or no post ID available')
    }
    
    console.log('✅ Admin package created successfully:', insertedPackage?.id)

    // Increment usage counter for successful package creation
    try {
      await incrementUsage(userOrgId, 'contentPackage')
      console.log(`📊 Incremented content package usage for org: ${userOrgId}`)
    } catch (usageError) {
      console.error('❌ Failed to increment usage:', usageError)
      // Don't fail the request if usage increment fails
    }

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