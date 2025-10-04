import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { generateVercelContent } from '@/lib/vercel-ai'
import { AIGenerateRequest } from '@/types/index'
import { detectCategory, getCategoryInfo } from '@/lib/category-detector'

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
      } catch (vercelError) {
        console.warn('⚠️ Vercel Gateway failed, falling back to direct OpenAI:', vercelError)
      }
    }

    // Fallback to original implementation
    console.log('📡 Using direct OpenAI API')
    const response = await generateContent(body)
    
    // Auto-detect category for fallback response too
    const detectedCategory = detectCategory(response.title || body.prompt, response.content || '')
    const categoryInfo = getCategoryInfo(detectedCategory)
    
    return NextResponse.json({
      ...response,
      category: categoryInfo.id,
      metadata: {
        provider: 'openai-direct',
        fallback: useVercelGateway, // Indicate this was a fallback
        detectedCategory: categoryInfo.label
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