import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addWatermarkToImageServer } from '@/lib/watermark'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, orgId } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check if we have AI Gateway credentials
    if (!process.env.AI_GATEWAY_API_KEY) {
      console.log('🔄 AI Gateway API Key not configured, falling back to DALL-E')
      return await fallbackToDallE(prompt, orgId)
    }

    try {
      // Use Gemini 2.5 Flash Image via Vercel AI SDK
      let imageUrl = await generateImageWithGeminiSDK(prompt)
      
      // Add watermark based on plan type
      let watermarked = false
      if (orgId) {
        try {
          // Get organization plan
          const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('plan')
            .eq('id', orgId)
            .single()

          // For all plans except Universal, use Admin Organization's branding
          const needsAdminWatermark = org?.plan && org.plan.toLowerCase() !== 'universal'
          
          if (needsAdminWatermark) {
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
                .eq('organization_id', adminOrg.id)
                .single()

              if (adminBranding && adminBranding.enabled && adminBranding.logo_url) {
                imageUrl = await addWatermarkToImageServer(imageUrl, adminBranding, orgId)
                watermarked = true
              }
            }
          } else if (org?.plan === 'universal') {
            // Universal plan can use their own branding
            const { data: branding } = await supabaseAdmin
              .from('branding_settings')
              .select('*')
              .eq('organization_id', orgId)
              .single()

            if (branding && branding.enabled && branding.logo_url) {
              imageUrl = await addWatermarkToImageServer(imageUrl, branding, orgId)
              watermarked = true
            }
          }
        } catch (error) {
          console.error('Error applying watermark:', error)
          // Continue with original image if watermarking fails
        }
      }
      
      return NextResponse.json({
        imageUrl,
        provider: imageUrl.includes('openai') ? 'dall-e-3-fallback' : 'vercel-gateway-gemini-sdk',
        metadata: {
          model: imageUrl.includes('openai') ? 'dall-e-3' : 'gemini-2.5-flash-image-preview',
          enhancedPrompt: prompt,
          fallback: imageUrl.includes('openai'),
          watermarked: watermarked
        }
      })
    } catch (geminiError) {
      console.error('❌ Gemini SDK image generation failed:', geminiError)
      console.log('🔄 Falling back to DALL-E')
      return await fallbackToDallE(prompt, orgId)
    }

  } catch (error) {
    console.error('❌ Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

async function generateImageWithGeminiSDK(prompt: string): Promise<string> {
  // Try Vercel AI Gateway with Gemini 2.5 Flash Image SDK first
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
  
  if (gatewayApiKey) {
    console.log('🚀 Attempting Vercel AI Gateway with Gemini 2.5 Flash Image SDK')
    try {
      // Use Vercel AI SDK approach for Gemini 2.5 Flash Image
      const { generateText } = await import('ai')
      
      const result = await generateText({
        model: 'google/gemini-2.5-flash-image-preview',
        providerOptions: {
          google: { responseModalities: ['TEXT', 'IMAGE'] },
        },
        prompt: `Generate an image: ${prompt}`,
      })

      console.log('🔍 Gemini SDK Response:', result)

      // Check for generated images in result.files
      if (result.files && result.files.length > 0) {
        const imageFiles = result.files.filter((f) =>
          f.mediaType?.startsWith('image/'),
        )

        if (imageFiles.length > 0) {
          // Upload image directly to Supabase Storage
          const imageFile = imageFiles[0]
          const extension = imageFile.mediaType?.split('/')[1] || 'png'
          const timestamp = Date.now()
          const filename = `gemini-generated/${timestamp}.${extension}`
          
          console.log('🔄 Uploading Gemini image to Supabase Storage...')
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('blog-images')
            .upload(filename, imageFile.uint8Array, {
              contentType: imageFile.mediaType || 'image/png',
              upsert: false
            })

          if (uploadError) {
            console.error('❌ Supabase upload error:', uploadError)
            throw new Error(`Failed to upload image: ${uploadError.message}`)
          }

          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('blog-images')
            .getPublicUrl(filename)
          
          console.log('✅ Gemini image uploaded to Supabase:', publicUrl)
          
          return publicUrl
        }
      }

      // Check if there's text content that might contain image URLs
      if (result.text) {
        console.log('🔍 Gemini text response:', result.text)
        const urlMatch = result.text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i)
        if (urlMatch) {
          const imageUrl = urlMatch[0]
          console.log('✅ Found image URL in Gemini text:', imageUrl)
          return imageUrl
        }
      }
    } catch (geminiError) {
      console.log('⚠️ Gemini SDK image generation failed:', geminiError)
    }
  }
  
  // Fallback to DALL-E 3
  console.log('🚀 Using DALL-E 3 fallback for image generation')
  const openaiKey = process.env.OPENAI_API_KEY
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ DALL-E image generation failed:', response.status, errorText)
    
    // Check if it's a billing limit error
    if (errorText.includes('billing_hard_limit_reached') || errorText.includes('billing')) {
      console.log('💰 DALL-E billing limit reached, using placeholder image')
      // Return a placeholder image URL
      return 'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Image+Generation+Unavailable'
    }
    
    throw new Error(`DALL-E image generation failed: ${response.statusText} - ${errorText}`)
  }

  const imageData = await response.json()
  console.log('🔍 DALL-E Response data:', imageData)
  
  // DALL-E returns images in data[0].url format
  let imageUrl = null
  
  if (imageData.data?.[0]?.url) {
    imageUrl = imageData.data[0].url
    console.log('✅ Found DALL-E image URL:', imageUrl)
  }
  
  if (!imageUrl) {
    console.error('❌ No image URL found in DALL-E response:', imageData)
    throw new Error('No image URL returned from DALL-E')
  }
  
  return imageUrl
}

async function fallbackToDallE(prompt: string, orgId?: string) {
  try {
    // Import OpenAI directly instead of making API call
    const OpenAI = (await import('openai')).default
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt, // Use original prompt without cosmic enhancements
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    let imageUrl = response.data?.[0]?.url || ''
    
    // Add watermark based on plan type
    let watermarked = false
    if (orgId && imageUrl) {
      try {
        // Get organization plan
        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('plan')
          .eq('id', orgId)
          .single()

        // For all plans except Universal, use Admin Organization's branding
        const needsAdminWatermark = org?.plan && org.plan.toLowerCase() !== 'universal'
        
        if (needsAdminWatermark) {
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
              .eq('organization_id', adminOrg.id)
              .single()

            if (adminBranding && adminBranding.enabled && adminBranding.logo_url) {
              imageUrl = await addWatermarkToImageServer(imageUrl, adminBranding, orgId)
              watermarked = true
            }
          }
        } else if (org?.plan === 'universal') {
          // Universal plan can use their own branding
          const { data: branding } = await supabaseAdmin
            .from('branding_settings')
            .select('*')
            .eq('organization_id', orgId)
            .single()

          if (branding && branding.enabled && branding.logo_url) {
            imageUrl = await addWatermarkToImageServer(imageUrl, branding, orgId)
            watermarked = true
          }
        }
      } catch (error) {
        console.error('Error applying watermark to DALL-E image:', error)
        // Continue with original image if watermarking fails
      }
    }
    
    return NextResponse.json({
      imageUrl,
      provider: 'dall-e-fallback',
      metadata: {
        model: 'dall-e-3',
        enhancedPrompt: prompt,
        fallback: true,
        watermarked: watermarked
      }
    })
  } catch (error) {
    console.error('❌ DALL-E fallback failed:', error)
    return NextResponse.json(
      { error: 'All image generation methods failed' },
      { status: 500 }
    )
  }
}
