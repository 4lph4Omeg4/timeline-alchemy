import { NextRequest, NextResponse } from 'next/server'
import { generateVercelContent } from '@/lib/vercel-ai'
import { getVercelAIStats } from '@/lib/vercel-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, type = 'blog', tone = 'professional' } = body
    
    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Check if we're using Vercel AI Gateway
    const stats = getVercelAIStats()
    
    if (!stats.isUsingGateway) {
      console.warn('⚠️ Vercel AI Gateway not configured, falling back to direct OpenAI')
    }

    // Generate content using Vercel AI Gateway
    const startTime = Date.now()
    const response = await generateVercelContent(prompt, type as 'blog' | 'social', tone)
    const duration = Date.now() - startTime
    
    console.log(`🚀 Vercel AI generation completed in ${duration}ms`, {
      type,
      promptLength: prompt.length,
      usage: response.usage
    })
    
    return NextResponse.json({
      ...response,
      metadata: {
        gateway: stats.isUsingGateway,
        duration,
        timestamp: new Date().toISOString(),
        model: 'gpt-4',
        provider: stats.isUsingGateway ? 'vercel-ai-gateway' : 'openai-direct'
      }
    })
  } catch (error) {
    console.error('❌ Vercel AI content generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'vercel-ai-gateway'
      },
      { status: 500 }
    )
  }
}

// Get AI Gateway status and stats
export async function GET(request: NextRequest) {
  try {
    const stats = getVercelAIStats()
    
    return NextResponse.json({
      success: true,
      gateway: {
        enabled: stats.isUsingGateway,
        url: stats.gatewayUrl,
        features: stats.availableFeatures,
        creditsAvailable: stats.hasCredits
      },
      recommendations: stats.isUsingGateway ? [
        '✅ Using Vercel AI Gateway for enhanced performance',
        '✅ Access to advanced prompt optimization',
        '✅ Usage analytics and monitoring'
      ] : [
        '💡 Configure AI_GATEWAY_URL and AI_GATEWAY_TOKEN to enable Gateway features',
        '💡 Get better performance and cost optimization',
        '💡 Access to advanced prompt optimization features'
      ]
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch gateway stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
