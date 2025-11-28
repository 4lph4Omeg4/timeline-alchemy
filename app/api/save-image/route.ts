import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

  try {
    const { imageUrl, postId, orgId } = await request.json()

    console.log('Save image request:', { imageUrl, postId, orgId })

    if (!imageUrl || !postId || !orgId) {
      console.error('Missing required fields:', { imageUrl, postId, orgId })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Download the image from DALL-E URL
    console.log('Downloading image from:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBlob = await imageResponse.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('Image downloaded, size:', buffer.length)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${orgId}/${postId}-${timestamp}.png`
    console.log('Uploading to filename:', filename)

    // Upload to Supabase Storage (use 'blog-images' bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filename)

    console.log('Public URL:', publicUrl)

    // Save to images table
    const { error: dbError } = await supabase
      .from('images')
      .insert({
        org_id: orgId,
        post_id: postId,
        url: publicUrl
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save image to database: ${dbError.message}`)
    }

    console.log('Image saved successfully')

    return NextResponse.json({
      permanentUrl: publicUrl,
      success: true
    })
  } catch (error: any) {
    console.error('Error saving image:', error)
    return NextResponse.json(
      {
        error: 'Failed to save image permanently',
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}
