import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Use exact same pattern as generate-bulk-content (which works)
export async function POST(req: NextRequest) {
  try {
    console.log('🎨 Watermark - Starting bulk application')
    
    // Get Admin Organization branding settings
    const { data: adminOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    if (orgError || !adminOrg) {
      return Response.json({ 
        success: false,
        error: 'Admin Organization not found',
        details: orgError?.message 
      }, { status: 404 })
    }

    const adminOrgId = (adminOrg as { id: string }).id

    const { data: branding, error: brandingError } = await supabaseAdmin
      .from('branding_settings')
      .select('*')
      .eq('organization_id', adminOrgId)
      .single()

    if (brandingError || !branding || !(branding as { logo_url: string }).logo_url) {
      return Response.json({ 
        success: false,
        error: 'Admin branding not configured',
        details: brandingError?.message 
      }, { status: 400 })
    }

    // Get all images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('images')
      .select('id, url, org_id')
      .order('created_at', { ascending: false })

    if (imagesError) {
      return Response.json({ 
        success: false,
        error: 'Failed to fetch images',
        details: imagesError.message 
      }, { status: 500 })
    }

    if (!images || images.length === 0) {
      return Response.json({ 
        success: true,
        message: 'No images found',
        stats: { total: 0, processed: 0, skipped: 0, failed: 0 }
      })
    }

    let processed = 0
    let skipped = 0
    let failed = 0

    // Process in batches
    const batchSize = 5
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (image) => {
          try {
            const imageUrl = (image as { url: string }).url
            const imageId = (image as { id: string }).id
            const imageOrgId = (image as { org_id: string }).org_id

            // Skip if already watermarked
            if (imageUrl.includes('/watermarked/')) {
              skipped++
              return
            }

            // Apply watermark
            const watermarkedUrl = await addWatermarkToImageServer(imageUrl, branding, imageOrgId)

            if (watermarkedUrl && watermarkedUrl !== imageUrl) {
              // Type-safe Supabase update
              const client: any = supabaseAdmin
              const { error: updateError } = await client
                .from('images')
                .update({ url: watermarkedUrl })
                .eq('id', imageId)
              
              if (!updateError) {
                processed++
              } else {
                failed++
              }
            } else {
              failed++
            }
          } catch (error) {
            failed++
          }
        })
      )

      // Delay between batches
      if (i + batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk watermark complete',
      stats: {
        total: images.length,
        processed,
        skipped,
        failed
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

