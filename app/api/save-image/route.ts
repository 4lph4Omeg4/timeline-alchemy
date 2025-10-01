import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, postId, orgId } = await request.json()
    
    if (!imageUrl || !postId || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Download the image from DALL-E URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image')
    }

    const imageBlob = await imageResponse.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${orgId}/${postId}-${timestamp}.png`

    // Upload to Supabase Storage
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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filename)

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

    return NextResponse.json({ 
      permanentUrl: publicUrl,
      success: true 
    })
  } catch (error) {
    console.error('Error saving image:', error)
    return NextResponse.json(
      { error: 'Failed to save image permanently' },
      { status: 500 }
    )
  }
}
