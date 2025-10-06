import { BrandingSettings } from '@/types/index'
import { supabaseAdmin } from '@/lib/supabase'

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
    return imageUrl
  }

  try {
    // For server-side, we'll use a different approach
    // We'll create a simple overlay using CSS positioning in the frontend
    // or use a server-side image processing library like Sharp
    
    // For now, return the original image URL
    // The watermark will be applied on the frontend when displaying the image
    return imageUrl
  } catch (error) {
    console.error('Error adding server-side watermark:', error)
    return imageUrl
  }
}
