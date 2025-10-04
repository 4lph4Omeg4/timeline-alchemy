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
    const useVercelGateway = process.env.AI_GATEWAY_URL && (process.env.AI_GATEWAY_TOKEN || process.env.AI_GATEWAY_API_KEY)
    
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
    const improvedPrompt = `${prompt}. Cosmic, ethereal, mystical, warm golden light, magical atmosphere, fantasy elements, celestial vibes, otherworldly beauty, dreamlike quality, glowing effects, cosmic dust, stardust particles, aurora-like colors, mystical energy, enchanting, transcendent, divine light, heavenly glow, fantastical, surreal, mesmerizing, captivating, professional photography, high resolution, cinematic lighting, warm color palette, golden hour, magical realism, spiritual energy, cosmic wonder, ethereal glow, mystical aura, enchanting atmosphere, otherworldly, celestial beauty, divine inspiration, magical realism, warm and inviting, cosmically beautiful, fantastically stunning`
    
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
