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

    // Generate image using the AI service with improved prompt
    const improvedPrompt = `${prompt}. Professional, high-quality image, modern, clean, inspiring, abstract concept, no text, no words, no letters, visual metaphor, artistic, minimalist design, photorealistic, stunning composition`
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
