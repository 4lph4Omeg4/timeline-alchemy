import { BrandingSettings } from '@/types/index'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

export async function addWatermarkToImage(imageUrl: string, branding: BrandingSettings | null): Promise<string> {
  if (!branding?.enabled || !branding.logo_url) {
    return imageUrl
  }

  try {
    // Create a canvas to add the watermark
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      console.error('Could not get canvas context')
      return imageUrl
    }

    // Load the main image
    const mainImage = new Image()
    mainImage.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      mainImage.onload = resolve
      mainImage.onerror = reject
      mainImage.src = imageUrl
    })

    // Set canvas size to match the main image
    canvas.width = mainImage.width
    canvas.height = mainImage.height

    // Draw the main image
    ctx.drawImage(mainImage, 0, 0)

    // Load the logo
    const logoImage = new Image()
    logoImage.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      logoImage.onload = resolve
      logoImage.onerror = reject
      logoImage.src = branding.logo_url!
    })

    // Calculate logo size and position
    const logoSize = Math.min(canvas.width, canvas.height) * branding.logo_size
    const logoWidth = logoSize
    const logoHeight = (logoImage.height / logoImage.width) * logoSize

    // Calculate position based on branding settings
    let x = 0
    let y = 0
    
    switch (branding.logo_position) {
      case 'top-left':
        x = 20
        y = 20
        break
      case 'top-right':
        x = canvas.width - logoWidth - 20
        y = 20
        break
      case 'bottom-left':
        x = 20
        y = canvas.height - logoHeight - 20
        break
      case 'bottom-right':
        x = canvas.width - logoWidth - 20
        y = canvas.height - logoHeight - 20
        break
    }

    // Set opacity
    ctx.globalAlpha = branding.logo_opacity

    // Draw the logo
    ctx.drawImage(logoImage, x, y, logoWidth, logoHeight)

    // Convert canvas to blob and upload to Supabase
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'))
          return
        }

        try {
          // Upload the watermarked image to Supabase
          const fileName = `watermarked-${Date.now()}.png`
          const { data, error } = await supabaseAdmin.storage
            .from('blog-images')
            .upload(fileName, blob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            })

          if (error) {
            console.error('Error uploading watermarked image:', error)
            reject(error)
            return
          }

          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('blog-images')
            .getPublicUrl(fileName)

          resolve(publicUrl)
        } catch (error) {
          reject(error)
        }
      }, 'image/png')
    })
  } catch (error) {
    console.error('Error adding watermark:', error)
    // Return original image if watermarking fails
    return imageUrl
  }
}

// Server-side watermark function (for API routes)
export async function addWatermarkToImageServer(imageUrl: string, branding: BrandingSettings | null, orgId: string): Promise<string> {
  if (!branding?.enabled || !branding.logo_url) {
    console.log('🔄 Watermark skipped - branding not enabled or no logo URL')
    return imageUrl
  }

  try {
    const fs = await import('fs')
    const path = await import('path')
    
    console.log('🔄 Adding watermark to image:', imageUrl)
    console.log('🔄 Branding settings:', branding)
    console.log('🔄 Organization ID:', orgId)

    // Read the main image from URL (Supabase or external)
    let mainImageBuffer: Buffer
    
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    mainImageBuffer = Buffer.from(arrayBuffer)

    // Read the logo
    let logoBuffer: Buffer
    if (branding.logo_url.startsWith('/')) {
      // Local logo
      const logopath = path.join(process.cwd(), 'public', branding.logo_url)
      logoBuffer = fs.readFileSync(logopath)
    } else {
      // External logo URL
      const logoResponse = await fetch(branding.logo_url)
      if (!logoResponse.ok) {
        throw new Error(`Failed to fetch logo: ${logoResponse.status}`)
      }
      const logoArrayBuffer = await logoResponse.arrayBuffer()
      logoBuffer = Buffer.from(logoArrayBuffer)
    }

    // Get main image metadata
    const mainImage = sharp(mainImageBuffer)
    const mainMetadata = await mainImage.metadata()
    const mainWidth = mainMetadata.width!
    const mainHeight = mainMetadata.height!

    // Get logo metadata
    const logoImage = sharp(logoBuffer)
    const logoMetadata = await logoImage.metadata()
    const logoWidth = logoMetadata.width!
    const logoHeight = logoMetadata.height!

    // Calculate logo size and position
    const logoSize = Math.min(mainWidth, mainHeight) * branding.logo_size
    const scaledLogoWidth = Math.round(logoSize)
    const scaledLogoHeight = Math.round((logoHeight / logoWidth) * logoSize)

    // Calculate position based on branding settings
    let x = 0
    let y = 0
    
    switch (branding.logo_position) {
      case 'top-left':
        x = 20
        y = 20
        break
      case 'top-right':
        x = mainWidth - scaledLogoWidth - 20
        y = 20
        break
      case 'bottom-left':
        x = 20
        y = mainHeight - scaledLogoHeight - 20
        break
      case 'bottom-right':
        x = mainWidth - scaledLogoWidth - 20
        y = mainHeight - scaledLogoHeight - 20
        break
    }

    // Resize logo
    const resizedLogo = await logoImage
      .resize(scaledLogoWidth, scaledLogoHeight)
      .png()
      .toBuffer()

    // Apply opacity to the logo
    const logoWithOpacity = await sharp(resizedLogo)
      .composite([{
        input: Buffer.from(`<svg width="${scaledLogoWidth}" height="${scaledLogoHeight}">
          <rect width="100%" height="100%" fill="white" opacity="${branding.logo_opacity}"/>
        </svg>`),
        blend: 'multiply'
      }])
      .png()
      .toBuffer()

    // Composite the watermark onto the main image
    const watermarkedImage = await mainImage
      .composite([{
        input: logoWithOpacity,
        left: Math.round(x),
        top: Math.round(y),
        blend: 'over'
      }])
      .png()
      .toBuffer()

    // Upload watermarked image to Supabase Storage
    const timestamp = Date.now()
    const filename = `watermarked/${orgId}-${timestamp}.png`
    
    console.log('🔄 Uploading watermarked image to Supabase Storage...')
    
    const { supabaseAdmin } = await import('./supabase')
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filename, watermarkedImage, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError)
      throw new Error(`Failed to upload watermarked image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(filename)
    
    console.log('✅ Watermark added successfully:', publicUrl)
    
    return publicUrl
  } catch (error) {
    console.error('Error adding server-side watermark:', error)
    return imageUrl
  }
}
