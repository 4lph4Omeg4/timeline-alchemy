import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { AIGenerateRequest } from '@/types/index'

export async function POST(request: NextRequest) {
  try {
    const body: AIGenerateRequest = await request.json()
    
    // Validate required fields
    if (!body.prompt || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and type' },
        { status: 400 }
      )
    }

    // Generate content using the AI service
    const response = await generateContent(body)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}