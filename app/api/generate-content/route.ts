import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { generateVercelContent } from '@/lib/vercel-ai'
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

    // Check if AI Gateway is available and use it for better quality
    const useVercelGateway = process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_TOKEN
    
    if (useVercelGateway) {
      console.log('🚀 Using Vercel AI Gateway for enhanced generation')
      try {
        const vercelResponse = await generateVercelContent(body.prompt, body.type as 'blog' | 'social', body.tone || 'professional')
        
        if (vercelResponse.success) {
          return NextResponse.json({
            content: vercelResponse.content || '',
            title: vercelResponse.title || '',
            excerpt: vercelResponse.excerpt || '',
            hashtags: vercelResponse.hashtags,
            suggestions: vercelResponse.suggestions,
            metadata: {
              provider: 'vercel-ai-gateway',
              usage: vercelResponse.usage,
              enhanced: true
            }
          })
        }
      } catch (vercelError) {
        console.warn('⚠️ Vercel Gateway failed, falling back to direct OpenAI:', vercelError)
      }
    }

    // Fallback to original implementation
    console.log('📡 Using direct OpenAI API')
    const response = await generateContent(body)
    
    return NextResponse.json({
      ...response,
      metadata: {
        provider: 'openai-direct',
        fallback: useVercelGateway // Indicate this was a fallback
      }
    })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}