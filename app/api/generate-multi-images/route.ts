import { NextRequest, NextResponse } from 'next/server'
import { generateVercelImage } from '@/lib/vercel-ai'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds (Vercel Hobby plan limit)

// GET endpoint for route verification
export async function GET() {
  return NextResponse.json({
    message: 'Multi-Image Generation API',
    status: 'active',
    method: 'POST',
    description: 'Generates 3 images in different styles for a blog post'
  })
}

// Define image styles
const IMAGE_STYLES = [
  {
    name: 'photorealistic',
    suffix: 'Professional photography, photorealistic, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality, ultra-realistic, 8k'
  },
  {
    name: 'digital_art',
    suffix: 'Digital art, vibrant colors, artistic interpretation, creative composition, modern digital painting, trending on artstation, detailed illustration'
  },
  {
    name: 'minimalist',
    suffix: 'Minimalist design, clean composition, simple elegant aesthetic, modern minimalism, balanced negative space, sophisticated and refined'
  }
]

// Generate 3 different image prompts from article content
function generateImagePrompts(title: string, content: string): string[] {
  return [
    `${title} - Main concept visualization`,
    `${title} - Key theme representation`,
    `${title} - Abstract interpretation`
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, orgId, postId } = body
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title and content' },
        { status: 400 }
      )
    }

    console.log('🎨 Starting multi-image generation for:', title)
    console.log('📊 Will generate 3 images in 3 different styles')

    // Generate 3 different prompts based on the content
    const basePrompts = generateImagePrompts(title, content)
    
    const generatedImages = []
    const styleGroupId = crypto.randomUUID() // Group these images together

    // Generate one image for each style
    for (let i = 0; i < 3; i++) {
      const style = IMAGE_STYLES[i]
      const basePrompt = basePrompts[i]
      const fullPrompt = `${basePrompt}. ${style.suffix}`
      
      console.log(`🎨 Generating image ${i + 1}/3 (${style.name}):`, basePrompt)

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
                      console.log(`✅ Watermark applied to image ${i + 1}`)
                    } catch (watermarkError) {
                      console.error(`❌ Watermark failed for image ${i + 1}:`, watermarkError)
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error applying watermark:', error)
            }
          }

          generatedImages.push({
            url: finalImageUrl,
            prompt: basePrompt,
            style: style.name,
            promptNumber: i + 1,
            styleGroup: styleGroupId,
            variantType: 'original',
            isActive: false, // Not active yet - user needs to choose style first
            metadata: {
              enhancedPrompt: vercelResponse.enhancedPrompt,
              provider: 'vercel-gateway'
            }
          })

          console.log(`✅ Image ${i + 1}/3 generated successfully (${style.name})`)
        } else {
          console.error(`❌ Failed to generate image ${i + 1}`)
        }

        // Small delay between generations to avoid rate limits
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`❌ Error generating image ${i + 1}:`, error)
      }
    }

    // Save images to database if postId provided
    if (postId && generatedImages.length > 0) {
      try {
        const imagesToInsert = generatedImages.map(img => ({
          post_id: postId,
          org_id: orgId,
          url: img.url,
          prompt: img.prompt,
          style: img.style,
          variant_type: img.variantType,
          is_active: img.isActive,
          prompt_number: img.promptNumber,
          style_group: img.styleGroup
        }))

        const { error: dbError } = await (supabaseAdmin as any)
          .from('images')
          .insert(imagesToInsert)

        if (dbError) {
          console.error('Error saving images to database:', dbError)
        } else {
          console.log(`✅ Saved ${generatedImages.length} images to database`)
        }
      } catch (error) {
        console.error('Error saving images:', error)
      }
    }

    console.log(`✅ Multi-image generation complete: ${generatedImages.length}/3 images created`)

    return NextResponse.json({
      success: true,
      images: generatedImages,
      styleGroup: styleGroupId,
      count: generatedImages.length,
      message: `Generated ${generatedImages.length} images in ${generatedImages.length} different styles`
    })

  } catch (error) {
    console.error('Error in multi-image generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

