import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai'
import { generateVercelImage } from '@/lib/vercel-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Check if AI Gateway is available for enhanced image generation
    const useVercelGateway = process.env.AI_GATEWAY_API_KEY
    
    if (useVercelGateway) {
      console.log('🎨 Using Vercel AI Gateway for enhanced image generation')
      try {
        const vercelResponse = await generateVercelImage(prompt)
        
        if (vercelResponse.success) {
          return NextResponse.json({
            imageUrl: vercelResponse.imageUrl,
            metadata: {
              provider: 'vercel-enhanced',
              enhancedPrompt: vercelResponse.enhancedPrompt,
              enhancementTokens: 0,
            gateway: true,
              improved: true
            }
          })
        }
      } catch (vercelError) {
        console.warn('⚠️ Vercel Gateway image generation failed, falling back:', vercelError)
      }
    }

    // Fallback to original implementation with enhanced prompt
    console.log('📡 Using direct OpenAI API for image generation')
    const improvedPrompt = `${prompt}. Professional photography, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality. NO TEXT, NO WORDS, NO LETTERS, NO WRITING, NO TYPEFACE, NO FONTS.`
    
    const imageUrl = await generateImage(improvedPrompt)
    
    return NextResponse.json({ 
      imageUrl,
      metadata: {
        provider: 'openai-direct',
        enhancedPrompt: improvedPrompt,
        fallback: useVercelGateway
      }
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
