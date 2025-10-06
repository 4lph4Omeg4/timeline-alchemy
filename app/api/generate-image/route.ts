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

    // Use Vercel AI Gateway for image generation
    console.log('🚀 Using Vercel AI Gateway for image generation')
    const improvedPrompt = `${prompt}. Professional photography, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality. NO TEXT, NO WORDS, NO LETTERS, NO WRITING, NO TYPEFACE, NO FONTS.`

    const vercelResponse = await generateVercelImage(improvedPrompt)
    
    if (vercelResponse.success) {
      return NextResponse.json({
        imageUrl: vercelResponse.imageUrl,
        metadata: {
          provider: 'vercel-gateway',
          enhancedPrompt: vercelResponse.enhancedPrompt,
          enhanced: true
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
