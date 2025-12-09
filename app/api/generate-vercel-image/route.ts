import { NextRequest, NextResponse } from 'next/server'
import { generateVercelImage } from '@/lib/vercel-ai'
import { getVercelAIStats } from '@/lib/vercel-ai'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, orgId } = body

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Check Gateway status
    const stats = getVercelAIStats()

    if (!stats.isUsingGateway) {
      console.warn('⚠️ Vercel AI Gateway not configured for image enhancement')
    }

    // Generate enhanced image using Vercel AI Gateway
    const startTime = Date.now()
    const response = await generateVercelImage(prompt)
    const duration = Date.now() - startTime

    console.log(`🎨 Vercel AI image generation completed in ${duration}ms`)

    if (response.success) {
      let finalImageUrl = response.imageUrl
      let watermarked = false

      // Add watermark based on plan type logic
      if (orgId) {
        try {
          console.log('🔍 Checking plan for orgId:', orgId)

          // Get organization plan
          const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('plan')
            .eq('id', orgId)
            .single()

          // Get plan features
          let hasWhiteLabel = false
          if (org) {
            const { data: features } = await supabaseAdmin
              .from('plan_features')
              .select('white_label')
              .eq('plan_name', (org as { plan: string }).plan)
              .single() as any

            hasWhiteLabel = features?.white_label === true
          }

          console.log('🏷️ White Label Enabled:', hasWhiteLabel)

          if (hasWhiteLabel) {
            // White Label plans can use their own branding
            const { data: branding } = await supabaseAdmin
              .from('branding_settings')
              .select('*')
              .eq('organization_id', orgId)
              .single()

            if (branding && (branding as { logo_url: string }).logo_url) {
              console.log('🔄 Applying custom watermark...')
              try {
                finalImageUrl = await addWatermarkToImageServer(response.imageUrl, branding, orgId)
                watermarked = true
                console.log('✅ Custom watermark applied')
              } catch (e) {
                console.error('❌ Custom watermark failed:', e)
              }
            } else {
              // If white label but no custom branding, check if we should fallback? 
              // User said: "Transcendent users can use their own logo, otherwise not"
              // Implicitly if they have no logo, maybe no watermark? Or maybe Admin fallback?
              // Usually white label means "no forced branding". So no watermark is correct if no logo uploaded.
              console.log('⚠️ No custom branding configured for White Label plan')
            }
          } else {
            console.log('🔄 Standard plan - Using Admin Organization branding')

            // Standard plans get Admin Organization branding
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
                  finalImageUrl = await addWatermarkToImageServer(response.imageUrl, adminBranding, orgId)
                  watermarked = true
                  console.log('✅ Admin watermark applied')
                } catch (e) {
                  console.error('❌ Admin watermark failed:', e)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error applying watermark:', error)
        }
      }

      return NextResponse.json({
        imageUrl: finalImageUrl,
        success: true,
        metadata: {
          originalPrompt: prompt,
          enhancedPrompt: response.enhancedPrompt,
          gateway: stats.isUsingGateway,
          duration,
          timestamp: new Date().toISOString(),
          provider: stats.isUsingGateway ? 'vercel-enhanced' : 'openai-direct',
          enhanced: response.enhanced || false,
          watermarked
        }
      })
    } else {
      throw new Error('Image generation failed')
    }
  } catch (error) {
    console.error('❌ Vercel AI image generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
