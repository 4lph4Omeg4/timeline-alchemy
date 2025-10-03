import { NextRequest, NextResponse } from 'next/server'
import { generateVercelImage } from '@/lib/vercel-ai'
import { getVercelAIStats } from '@/lib/vercel-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body
    
    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Check Gateway status
    const stats = getVercelAIStats()
    
    if (!stats.isUsingGateway) {
      console.warn('⚠️ Vercel AI Gateway not configured for image enhancement')
    }

    // Generate enhanced image using Vercel AI Gateway
    const startTime = Date.now()
    const response = await generateVercelImage(prompt)
    const duration = Date.now() - startTime
    
    console.log(`🎨 Vercel AI image generation completed in ${duration}ms`, {
      promptLength: prompt.length,
      enhancedPromptLength: response.enhancedPrompt?.length || 0,
      usage: response.usage
    })
    
    return NextResponse.json({
      imageUrl: response.imageUrl,
      success: true,
      metadata: {
        originalPrompt: prompt,
        enhancedPrompt: response.enhancedPrompt,
        gateway: stats.isUsingGateway,
        duration,
        timestamp: new Date().toISOString(),
        model: 'dall-e-3',
        provider: stats.isUsingGateway ? 'vercel-enhanced' : 'openai-direct',
        enhancementTokens: response.usage
      }
    })
  } catch (error) {
    console.error('❌ Vercel AI image generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'vercel-ai-gateway'
      },
      { status: 500 }
    )
  }
}
