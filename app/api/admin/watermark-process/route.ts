import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const runtime = 'nodejs'

// Simple POST handler without NextRequest
export async function POST() {
  try {
    console.log('🎨 Watermark process started')

    // Get Admin Organization branding settings
    const { data: adminOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    if (!adminOrg) {
      return NextResponse.json({ error: 'Admin Organization not found' }, { status: 404 })
    }

    const adminOrgId = (adminOrg as { id: string }).id

    const { data: branding } = await supabaseAdmin
      .from('branding_settings')
      .select('*')
      .eq('organization_id', adminOrgId)
      .single()

    if (!branding || !(branding as { logo_url: string }).logo_url) {
      return NextResponse.json({ error: 'Admin branding not configured' }, { status: 400 })
    }

    // Get all images from the database
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('images')
      .select('id, url, org_id, post_id')
      .order('created_at', { ascending: false })

    if (imagesError) {
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No images found to watermark', 
        stats: { total: 0, processed: 0, skipped: 0, failed: 0 },
        results: []
      }, { status: 200 })
    }

    let processed = 0
    let skipped = 0
    let failed = 0
    const results: Array<{ id: string; status: string; newUrl?: string; error?: string }> = []

    // Process images in batches
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
              results.push({ id: imageId, status: 'skipped', newUrl: imageUrl })
              return
            }

            // Apply watermark
            const watermarkedUrl = await addWatermarkToImageServer(imageUrl, branding, imageOrgId)

            if (watermarkedUrl && watermarkedUrl !== imageUrl) {
              const client: any = supabaseAdmin
              const { error: updateError } = await client
                .from('images')
                .update({ url: watermarkedUrl })
                .eq('id', imageId)
              
              if (updateError) {
                failed++
                results.push({ id: imageId, status: 'failed', error: 'Database update failed' })
              } else {
                processed++
                results.push({ id: imageId, status: 'processed', newUrl: watermarkedUrl })
              }
            } else {
              failed++
              results.push({ id: imageId, status: 'failed', error: 'Watermark function returned same URL' })
            }
          } catch (error) {
            failed++
            results.push({ 
              id: (image as { id: string }).id, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
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
      message: 'Bulk watermark application complete',
      stats: {
        total: images.length,
        processed,
        skipped,
        failed
      },
      results
    })

  } catch (error) {
    console.error('❌ Bulk watermark error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Watermark Process API - Active',
    method: 'POST',
    endpoint: '/api/admin/watermark-process',
    status: 'ready',
    version: '3.0.0'
  })
}

