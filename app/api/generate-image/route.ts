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

          // For all plans except Universal, use Admin Organization's branding
          const needsAdminWatermark = org && (org as { plan: string }).plan && (org as { plan: string }).plan.toLowerCase() !== 'universal'
          
          if (needsAdminWatermark) {
            console.log('🔄 Using Admin Organization watermark for', (org as { plan: string }).plan, 'plan')
            
            // Get Admin Organization's branding settings
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

              if (adminBranding && (adminBranding as { enabled: boolean }).enabled && (adminBranding as { logo_url: string }).logo_url) {
                console.log('🔄 Applying Admin watermark...')
                finalImageUrl = await addWatermarkToImageServer(vercelResponse.imageUrl, adminBranding, orgId)
                watermarked = true
                console.log('✅ Admin watermark applied successfully')
              } else {
                console.log('⚠️ Admin branding not configured')
              }
            }
          } else if (org && (org as { plan: string }).plan === 'universal') {
            console.log('🔄 Universal plan - checking custom branding...')
            
            // Universal plan can use their own branding
            const { data: branding } = await supabaseAdmin
              .from('branding_settings')
              .select('*')
              .eq('organization_id', orgId)
              .single()

            if (branding && (branding as { enabled: boolean }).enabled && (branding as { logo_url: string }).logo_url) {
              console.log('🔄 Applying custom watermark...')
              finalImageUrl = await addWatermarkToImageServer(vercelResponse.imageUrl, branding, orgId)
              watermarked = true
              console.log('✅ Custom watermark applied successfully')
            } else {
              console.log('⚠️ No custom branding configured for Universal plan')
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
