import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all images with Azure Blob Storage URLs
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .like('url', '%blob.core.windows.net%')

    if (fetchError) {
      console.error('Error fetching images:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    if (!images || images.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Azure Blob Storage URLs found',
        fixed: 0
      })
    }

    console.log(`Found ${images.length} images with Azure URLs to fix`)

    let fixedCount = 0
    const errors: string[] = []

    for (const image of images) {
      try {
        // Download the image from Azure URL
        console.log(`Processing image ${image.id}: ${image.url}`)
        const imageResponse = await fetch(image.url)
        
        if (!imageResponse.ok) {
          console.warn(`Failed to download image ${image.id}: ${imageResponse.status}`)
          errors.push(`Failed to download image ${image.id}: ${imageResponse.status}`)
          continue
        }

        const imageBlob = await imageResponse.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Generate new filename for Supabase Storage
        const timestamp = Date.now()
        const filename = `${image.org_id}/${image.post_id}-${timestamp}.png`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(filename, buffer, {
            contentType: 'image/png',
            upsert: false
          })

        if (uploadError) {
          console.error(`Upload error for image ${image.id}:`, uploadError)
          errors.push(`Upload error for image ${image.id}: ${uploadError.message}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filename)

        // Update the database with the new URL
        const { error: updateError } = await supabase
          .from('images')
          .update({ url: publicUrl })
          .eq('id', image.id)

        if (updateError) {
          console.error(`Database update error for image ${image.id}:`, updateError)
          errors.push(`Database update error for image ${image.id}: ${updateError.message}`)
          continue
        }

        console.log(`✅ Fixed image ${image.id}: ${publicUrl}`)
        fixedCount++

      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error)
        errors.push(`Error processing image ${image.id}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} out of ${images.length} images`,
      fixed: fixedCount,
      total: images.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error fixing image URLs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix image URLs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
