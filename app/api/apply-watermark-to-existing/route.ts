import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

// Add GET handler for debugging
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'This endpoint only accepts POST requests',
    method: 'POST',
    endpoint: '/api/apply-watermark-to-existing'
  }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 Starting bulk watermark application to existing images...')

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
    console.log('🏢 Admin Organization ID:', adminOrgId)

    const { data: branding } = await supabaseAdmin
      .from('branding_settings')
      .select('*')
      .eq('organization_id', adminOrgId)
      .single()

    if (!branding || !(branding as { logo_url: string }).logo_url) {
      return NextResponse.json({ error: 'Admin branding not configured' }, { status: 400 })
    }

    console.log('✅ Admin branding loaded:', (branding as { logo_url: string }).logo_url)

    // Get all images from the database
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('images')
      .select('id, url, org_id, post_id')
      .order('created_at', { ascending: false })

    if (imagesError) {
      console.error('❌ Error fetching images:', imagesError)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ message: 'No images found to watermark', processed: 0 }, { status: 200 })
    }

    console.log(`📊 Found ${images.length} images to process`)

    let processed = 0
    let skipped = 0
    let failed = 0
    const results: Array<{ id: string; status: string; newUrl?: string; error?: string }> = []

    // Process images in batches to avoid overwhelming the system
    const batchSize = 5
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize)
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`)

      await Promise.all(
        batch.map(async (image) => {
          try {
            const imageUrl = (image as { url: string }).url
            const imageId = (image as { id: string }).id
            const imageOrgId = (image as { org_id: string }).org_id

            console.log(`\n🖼️  Processing image ${imageId}`)
            console.log(`   Original URL: ${imageUrl}`)

            // Skip if already watermarked (check if URL contains 'watermarked')
            if (imageUrl.includes('/watermarked/')) {
              console.log(`   ⏭️  Skipped - already watermarked`)
              skipped++
              results.push({ id: imageId, status: 'skipped', newUrl: imageUrl })
              return
            }

            // Apply watermark
            const watermarkedUrl = await addWatermarkToImageServer(imageUrl, branding, imageOrgId)

            if (watermarkedUrl && watermarkedUrl !== imageUrl) {
              // Update database with new watermarked URL
              // Note: We bypass TypeScript strict checking here due to Supabase type inference issues
              let updateSuccess = false
              
              try {
                // Cast the entire client to bypass TypeScript's overly strict type checking
                const client: any = supabaseAdmin
                const { error: updateError } = await client
                  .from('images')
                  .update({ url: watermarkedUrl })
                  .eq('id', imageId)
                
                if (updateError) {
                  console.error(`   ❌ Failed to update database:`, updateError)
                  failed++
                  results.push({ id: imageId, status: 'failed', error: 'Database update failed' })
                } else {
                  updateSuccess = true
                }
              } catch (e) {
                console.error(`   ❌ Update error:`, e)
                failed++
                results.push({ id: imageId, status: 'failed', error: 'Update failed' })
              }
              
              if (updateSuccess) {
                console.log(`   ✅ Watermarked successfully`)
                console.log(`   New URL: ${watermarkedUrl}`)
                processed++
                results.push({ id: imageId, status: 'processed', newUrl: watermarkedUrl })
              }
            } else {
              console.log(`   ⚠️  Watermark failed or URL unchanged`)
              failed++
              results.push({ id: imageId, status: 'failed', error: 'Watermark function returned same URL' })
            }
          } catch (error) {
            console.error(`   ❌ Error processing image:`, error)
            failed++
            results.push({ 
              id: (image as { id: string }).id, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        })
      )

      // Small delay between batches to avoid rate limits
      if (i + batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`\n✅ Bulk watermark application complete!`)
    console.log(`   Processed: ${processed}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Total: ${images.length}`)

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

