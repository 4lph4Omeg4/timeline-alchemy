import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { generateVercelContent } from '@/lib/vercel-ai'
import { AIGenerateRequest } from '@/types/index'
import { detectCategory, getCategoryInfo } from '@/lib/category-detector'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for content generation

export async function POST(request: NextRequest) {
  try {
    let body: AIGenerateRequest
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('❌ JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!body.prompt || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and type' },
        { status: 400 }
      )
    }

    // Use Vercel AI Gateway exclusively
    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
    
    if (!gatewayApiKey) {
      return NextResponse.json(
        { error: 'AI Gateway API key not configured' },
        { status: 500 }
      )
    }
    
    console.log('🚀 Using Vercel AI Gateway for content generation')
    const vercelResponse = await generateVercelContent(body.prompt, body.type as 'blog' | 'social', body.tone || 'professional')
    
    if (vercelResponse.success) {
      // Check if it's blog content (has content property) or social content
      if ('content' in vercelResponse) {
        // Auto-detect category based on content
        const detectedCategory = detectCategory(vercelResponse.title || body.prompt, vercelResponse.content || '')
        const categoryInfo = getCategoryInfo(detectedCategory)
        
        return NextResponse.json({
          content: vercelResponse.content || '',
          title: vercelResponse.title || '',
          excerpt: vercelResponse.excerpt || '',
          hashtags: vercelResponse.hashtags,
          suggestions: vercelResponse.suggestions,
          category: categoryInfo.id,
          metadata: {
            provider: 'vercel-ai-gateway',
            enhanced: true,
            detectedCategory: categoryInfo.label
          }
        })
      } else if ('socialPosts' in vercelResponse) {
        // For social content, we'll return it in the social format
        return NextResponse.json({
          content: `Social media content generated for multiple platforms`,
          title: `${body.prompt} - Social Media Content`,
          excerpt: 'Multi-platform social media content',
          hashtags: [],
          suggestions: ['Customize for each specific platform', 'Add visual content', 'Schedule optimal posting times'],
          metadata: {
            provider: 'vercel-ai-gateway',
            socialPosts: vercelResponse.socialPosts,
            enhanced: true
          }
        })
      }
    }
    
    return NextResponse.json(
      { error: 'Vercel Gateway content generation failed' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}