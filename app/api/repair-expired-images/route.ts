import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fixAll = false, specificImageId = null } = body

    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    let query = supabaseClient
      .from('images')
      .select('*')
      .or('url.like.%blob.core.windows.net%,url.like.%azure%,url.like.%dalle%')

    if (specificImageId) {
      query = query.eq('id', specificImageId)
    }

    const { data: expiredImages, error: fetchError } = await query

    if (fetchError) {
      console.error('❌ Error fetching expired images:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch expired images', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredImages || expiredImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired images found',
        fixedCount: 0,
        failedCount: 0
      })
    }

    console.log(`🔧 Found ${expiredImages.length} expired images to fix`)

    let fixedCount = 0
    let failedCount = 0
    const results = []

    for (const image of expiredImages) {
      try {
        console.log(`🔄 Fixing image ${image.id} with URL: ${image.url}`)

        // Download the image from the expired URL
        const imageResponse = await fetch(image.url)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        const imageBlob = new Blob([imageBuffer])

        // Generate a unique filename
        const timestamp = Date.now()
        const filename = `repaired-image-${image.post_id}-${timestamp}.jpg`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('images')
          .upload(filename, imageBlob, {
            contentType: 'image/jpeg',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get the public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('images')
          .getPublicUrl(filename)

        // Update the database with the new permanent URL
        const { error: updateError } = await supabaseClient
          .from('images')
          .update({ url: publicUrl })
          .eq('id', image.id)

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`)
        }

        fixedCount++
        results.push({
          id: image.id,
          postId: image.post_id,
          oldUrl: image.url,
          newUrl: publicUrl,
          status: 'success'
        })

        console.log(`✅ Successfully fixed image ${image.id}`)

      } catch (error) {
        failedCount++
        results.push({
          id: image.id,
          postId: image.post_id,
          oldUrl: image.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        })

        console.error(`❌ Failed to fix image ${image.id}:`, error)
      }
    }

    console.log(`🎉 Image repair completed: ${fixedCount} fixed, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Image repair completed: ${fixedCount} fixed, ${failedCount} failed`,
      fixedCount,
      failedCount,
      results
    })

  } catch (error) {
    console.error('❌ Repair images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
