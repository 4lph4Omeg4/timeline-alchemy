import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, postId, orgId, prompt } = await request.json()

    if (!imageUrl || !postId || !orgId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Download the image from the temporary URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image')
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageData = Buffer.from(imageBuffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `generated-${postId}-${timestamp}.png`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filename, imageData, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filename)

    const permanentUrl = urlData.publicUrl

    // Save image record to database
    const { data: imageRecord, error: dbError } = await supabaseAdmin
      .from('images')
      .insert({
        org_id: orgId,
        post_id: postId,
        url: permanentUrl,
        prompt: prompt || 'AI generated image'
      } as any)
      .select()
      .single()

    if (dbError) {
      console.error('Error saving image record:', dbError)
      // Try to clean up the uploaded file
      await supabaseAdmin.storage.from('images').remove([filename])
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Image saved successfully',
      image: imageRecord,
      permanentUrl
    })

  } catch (error) {
    console.error('Save image API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
