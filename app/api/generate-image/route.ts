import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai'

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

    // Generate image using the AI service with cosmische, fantastische prompt
    const improvedPrompt = `${prompt}. Cosmic, ethereal, mystical, warm golden light, magical atmosphere, fantasy elements, celestial vibes, otherworldly beauty, dreamlike quality, glowing effects, cosmic dust, stardust particles, aurora-like colors, mystical energy, enchanting, transcendent, divine light, heavenly glow, fantastical, surreal, mesmerizing, captivating, professional photography, high resolution, cinematic lighting, warm color palette, golden hour, magical realism, spiritual energy, cosmic wonder, ethereal glow, mystical aura, enchanting atmosphere, otherworldly, celestial beauty, divine inspiration, magical realism, warm and inviting, cosmically beautiful, fantastically stunning`
    const imageUrl = await generateImage(improvedPrompt)
    
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
