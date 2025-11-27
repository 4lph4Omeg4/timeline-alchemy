import { NextRequest, NextResponse } from 'next/server'
import { generateVercelImage } from '@/lib/vercel-ai'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for image generation

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

    // Check if we have Google API or fallback to OpenAI
    const hasGoogleApi = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY

    if (hasGoogleApi) {
      console.log('🚀 Using Google Gemini for image generation')
    } else {
      console.log('🚀 Falling back to DALL-E for image generation')
    }

    const improvedPrompt = `${prompt}. Professional photography, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality.`

    const vercelResponse = await generateVercelImage(improvedPrompt)

    if (vercelResponse.success) {
      let finalImageUrl = vercelResponse.imageUrl

      // Add watermark based on plan type
      let watermarked = false
      if (orgId) {
        try {
          console.log('🔍 Checking plan for orgId:', orgId)

          // Get organization plan
          const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('plan')
            .eq('id', orgId)
            .single()

          console.log('🔍 Organization plan:', org ? (org as { plan: string }).plan : 'unknown')

          // Get plan features to check for white_label capability
          const { data: features } = await supabaseAdmin
            .from('plan_features')
            .select('white_label')
            .eq('plan_name', (org as { plan: string }).plan)
            .single()

          const hasWhiteLabel = features?.white_label === true
          console.log('🏷️ White Label Enabled:', hasWhiteLabel)

          if (hasWhiteLabel) {
            console.log('🔄 White Label plan - checking custom branding...')

            // White Label plans can use their own branding
            const { data: branding } = await supabaseAdmin
              .from('branding_settings')
              .select('*')
              .eq('organization_id', orgId)
              .single()

            if (branding && (branding as { logo_url: string }).logo_url) {
              console.log('🔄 Applying custom watermark...')
              try {
                finalImageUrl = await addWatermarkToImageServer(vercelResponse.imageUrl, branding, orgId)
                watermarked = true
                console.log('✅ Custom watermark applied successfully')
              } catch (watermarkError) {
                console.error('❌ Watermark failed:', watermarkError)
                console.log('⚠️ Using original image without watermark')
              }
            } else {
              console.log('⚠️ No custom branding configured for White Label plan')
            }
          } else {
            console.log('🔄 Standard plan - using Admin Organization watermark')

            // Standard plans get the Admin Organization's branding
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
                console.log('🔄 Applying Admin watermark...')
                try {
                  finalImageUrl = await addWatermarkToImageServer(vercelResponse.imageUrl, adminBranding, orgId)
                  watermarked = true
                  console.log('✅ Admin watermark applied successfully')
                } catch (watermarkError) {
                  console.error('❌ Watermark failed:', watermarkError)
                  console.log('⚠️ Using original image without watermark')
                }
              } else {
                console.log('⚠️ Admin branding not configured')
              }
            }
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
          watermarked: watermarked
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
