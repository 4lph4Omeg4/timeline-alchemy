import { NextRequest, NextResponse } from 'next/server'
import { generateVercelImage } from '@/lib/vercel-ai'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds (Vercel Hobby plan limit)

// GET endpoint for route verification
export async function GET() {
  return NextResponse.json({
    message: 'Image Style Regeneration API',
    status: 'active',
    method: 'POST',
    description: 'Regenerates images in a chosen style'
  })
}

// Style definitions (same as multi-images)
const IMAGE_STYLES: Record<string, string> = {
  photorealistic: 'Professional photography, photorealistic, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality, ultra-realistic, 8k',
  digital_art: 'Digital art, vibrant colors, artistic interpretation, creative composition, modern digital painting, trending on artstation, detailed illustration',
  minimalist: 'Minimalist design, clean composition, simple elegant aesthetic, modern minimalism, balanced negative space, sophisticated and refined'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, chosenStyle, orgId } = body
    
    if (!postId || !chosenStyle) {
      return NextResponse.json(
        { error: 'Missing required fields: postId and chosenStyle' },
        { status: 400 }
      )
    }

    console.log(`🎨 Regenerating images for post ${postId} in style: ${chosenStyle}`)

    // Get all original images for this post
    const { data: originalImages, error: fetchError } = await (supabaseAdmin as any)
      .from('images')
      .select('*')
      .eq('post_id', postId)
      .eq('variant_type', 'original')
      .order('prompt_number')

    if (fetchError || !originalImages || originalImages.length === 0) {
      return NextResponse.json(
        { error: 'No original images found for this post' },
        { status: 404 }
      )
    }

    console.log(`📊 Found ${originalImages.length} original images`)

    // Find the chosen image and the ones to regenerate
    const chosenImage = originalImages.find((img: any) => img.style === chosenStyle)
    const imagesToRegenerate = originalImages.filter((img: any) => img.style !== chosenStyle)

    if (!chosenImage) {
      return NextResponse.json(
        { error: 'Chosen style not found in original images' },
        { status: 404 }
      )
    }

    console.log(`✅ Chosen image found: ${chosenImage.prompt} (${chosenStyle})`)
    console.log(`🔄 Will regenerate ${imagesToRegenerate.length} images in ${chosenStyle} style`)

    const regeneratedImages = []
    const styleGroupId = crypto.randomUUID()

    // First, mark the chosen original image as active
    await (supabaseAdmin as any)
      .from('images')
      .update({ is_active: true })
      .eq('id', chosenImage.id)

    regeneratedImages.push({
      id: chosenImage.id,
      url: chosenImage.url,
      prompt: chosenImage.prompt,
      style: chosenImage.style,
      promptNumber: chosenImage.prompt_number,
      variantType: 'original',
      isActive: true
    })

    // Regenerate the other prompts in the chosen style
    for (const imageToRegen of imagesToRegenerate) {
      const basePrompt = imageToRegen.prompt
      const styleSuffix = IMAGE_STYLES[chosenStyle] || IMAGE_STYLES.photorealistic
      const fullPrompt = `${basePrompt}. ${styleSuffix}`

      console.log(`🎨 Regenerating prompt ${imageToRegen.prompt_number} in ${chosenStyle} style`)

      try {
        const vercelResponse = await generateVercelImage(fullPrompt)
        
        if (vercelResponse.success) {
          let finalImageUrl = vercelResponse.imageUrl

          // Apply watermark if needed
          if (orgId) {
            try {
              const { data: org } = await supabaseAdmin
                .from('organizations')
                .select('plan')
                .eq('id', orgId)
                .single()

              const needsAdminWatermark = org && (org as { plan: string }).plan?.toLowerCase() !== 'universal'
              
              if (needsAdminWatermark) {
                const { data: adminOrg } = await supabaseAdmin
                  .from('organizations')
                  .select('id')
                  .eq('name', 'Admin Organization')
                  .single()

                if (adminOrg) {
                  const { data: adminBranding } = await supabaseAdmin
                    .from('branding_settings')
                    .select('*')
                    .eq('organization_id', (adminOrg as { id: string }).id)
                    .single()

                  if (adminBranding && (adminBranding as { logo_url: string }).logo_url) {
                    try {
                      finalImageUrl = await addWatermarkToImageServer(vercelResponse.imageUrl, adminBranding, orgId)
                    } catch (watermarkError) {
                      console.error('Watermark failed:', watermarkError)
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error applying watermark:', error)
            }
          }

          // Save regenerated image to database
          const { data: newImage, error: insertError } = await (supabaseAdmin as any)
            .from('images')
            .insert({
              post_id: postId,
              org_id: orgId,
              url: finalImageUrl,
              prompt: basePrompt,
              style: chosenStyle,
              variant_type: 'final',
              is_active: true,
              prompt_number: imageToRegen.prompt_number,
              style_group: styleGroupId
            })
            .select()
            .single()

          if (!insertError && newImage) {
            regeneratedImages.push({
              id: newImage.id,
              url: finalImageUrl,
              prompt: basePrompt,
              style: chosenStyle,
              promptNumber: imageToRegen.prompt_number,
              variantType: 'final',
              isActive: true
            })
            console.log(`✅ Regenerated image ${imageToRegen.prompt_number} in ${chosenStyle} style`)
          }
        }

        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Error regenerating image ${imageToRegen.prompt_number}:`, error)
      }
    }

    console.log(`✅ Regeneration complete: ${regeneratedImages.length} images now active in ${chosenStyle} style`)

    return NextResponse.json({
      success: true,
      images: regeneratedImages,
      chosenStyle,
      count: regeneratedImages.length,
      message: `Successfully regenerated ${regeneratedImages.length} images in ${chosenStyle} style`
    })

  } catch (error) {
    console.error('Error in image regeneration:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

