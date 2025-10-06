import { NextRequest, NextResponse } from 'next/server'
import { generateVercelImage } from '@/lib/vercel-ai'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, orgId } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Use Vercel AI Gateway for image generation
    console.log('🚀 Using Vercel AI Gateway for image generation')
    const improvedPrompt = `${prompt}. Professional photography, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality. NO TEXT, NO WORDS, NO LETTERS, NO WRITING, NO TYPEFACE, NO FONTS.`

    const vercelResponse = await generateVercelImage(improvedPrompt)
    
    if (vercelResponse.success) {
      let finalImageUrl = vercelResponse.imageUrl

      // Add watermark if organization has branding settings
      if (orgId) {
        try {
          const { data: branding } = await supabaseAdmin
            .from('branding_settings')
            .select('*')
            .eq('organization_id', orgId)
            .single()

          if (branding) {
            finalImageUrl = await addWatermarkToImageServer(vercelResponse.imageUrl, branding, orgId)
          }
        } catch (error) {
          console.error('Error applying watermark:', error)
          // Continue with original image if watermarking fails
        }
      }

      return NextResponse.json({
        imageUrl: finalImageUrl,
        metadata: {
          provider: 'vercel-gateway',
          enhancedPrompt: vercelResponse.enhancedPrompt,
          enhanced: true,
          watermarked: !!orgId
        }
      })
    } else {
      throw new Error('Vercel Gateway image generation failed')
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
