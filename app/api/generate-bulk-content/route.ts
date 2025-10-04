import { NextRequest, NextResponse } from 'next/server'
import { generateBulkContent, validateTrendData } from '@/lib/bulk-content-generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('🚀 Bulk content generation request received')
    
    // Validate request body
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: items array is required'
      }, { status: 400 })
    }
    
    // Validate trend data structure
    if (!validateTrendData(body)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid trend data structure. Each item must have: trend, summary, keywords, audience, tone'
      }, { status: 400 })
    }
    
    // Set defaults
    const contentType = body.contentType || 'blog'
    const language = body.language || 'nl'
    const customPrompt = body.customPrompt || ''
    
    console.log(`📊 Processing ${body.items.length} trend items for ${contentType} content in ${language}`)
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }
    
    // Generate bulk content
    const startTime = Date.now()
    const result = await generateBulkContent({
      items: body.items,
      contentType,
      language,
      customPrompt
    })
    
    const duration = Date.now() - startTime
    
    console.log(`✅ Bulk generation completed in ${duration}ms`, {
      successful: result.summary.successful,
      total: result.summary.totalProcessed,
      failed: result.summary.failed
    })
    
    return NextResponse.json({
      success: result.success,
      generatedPosts: result.generatedPosts,
      summary: result.summary,
      errors: result.errors,
      metadata: {
        contentType,
        language,
        processingTime: duration,
        timestamp: new Date().toISOString(),
        provider: 'openai-gpt-4'
      }
    })
    
  } catch (error) {
    console.error('❌ Bulk content generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Bulk content generation failed'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Bulk Content Generation API',
    status: 'active',
    endpoints: {
      POST: '/api/generate-bulk-content',
      description: 'Generate multiple blog posts from trends array'
    },
    requiredFormat: {
      items: 'Array of TrendItem objects',
      contentType: 'blog | social | mixed',
      language: 'nl | en'
    },
    trendItemExample: {
      trend: 'Sample Trend',
      source_title: 'Sample Source',
      source_url: 'https://example.com',
      summary: 'Brief description',
      keywords: ['keyword1', 'keyword2'],
      recommended_formats: ['blog_draft'],
      tags: ['Tag1', 'Tag2'],
      audience: 'Target audience',
      tone: 'professional',
      cta_ideas: ['Call to action ideas']
    }
  })
}
