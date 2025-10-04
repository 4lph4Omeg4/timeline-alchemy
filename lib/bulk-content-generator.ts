// Bulk Content Generator for Grok Trends Arrays
interface TrendItem {
  trend: string
  source_title: string
  source_url: string
  summary: string
  keywords: string[]
  recommended_formats: string[]
  tags: string[]
  audience: string
  tone: string
  cta_ideas: string[]
}

interface BulkContentRequest {
  items: TrendItem[]
  contentType: 'blog' | 'social' | 'mixed'
  customPrompt?: string
  language?: 'nl' | 'en'
}

interface BulkContentResult {
  success: boolean
  generatedPosts: Array<{
    trend: string
    content: string  // Changed from generatedContent to match frontend
    title: string
    excerpt: string
    hashtags: string[]
    suggestions: string[]
    metadata: {
      sourceTitle: string
      sourceUrl: string
      audience: string
      tone: string
      keywords: string[]
      tags: string[]
      generatedAt: string
    }
  }>
  summary: {
    totalProcessed: number
    successful: number
    failed: number
    processingTime: number
  }
  errors?: string[]
}

// Enhanced content generation with trend-specific data
// Map content types to supported formats
const mapContentType = (type: string): string => {
  switch (type) {
    case 'social': return 'short_form'
    case 'mixed': return 'blog'
    default: return type
  }
}

export async function generateBulkContent(request: BulkContentRequest): Promise<BulkContentResult> {
  const startTime = Date.now()
  const results: BulkContentResult = {
    success: true,
    generatedPosts: [],
    summary: {
      totalProcessed: request.items.length,
      successful: 0,
      failed: 0,
      processingTime: 0
    },
    errors: []
  }

  console.log(`🚀 Starting bulk content generation for ${request.items.length} trends`)

  // Process each trend item
  for (let index = 0; index < request.items.length; index++) {
    const item = request.items[index]
    try {
      console.log(`📝 Processing trend ${index + 1}/${request.items.length}: ${item.trend}`)
      
      const mappedContentType = mapContentType(request.contentType)
      const generatedContent = await generateTrendContent(item, mappedContentType, request.language || 'nl')
      
      results.generatedPosts.push({
        trend: item.trend,
        content: generatedContent.content,
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        hashtags: generatedContent.hashtags,
        suggestions: generatedContent.suggestions,
        metadata: {
          sourceTitle: item.source_title,
          sourceUrl: item.source_url,
          audience: item.audience,
          tone: item.tone,
          keywords: item.keywords,
          tags: item.tags,
          generatedAt: new Date().toISOString()
        }
      })
      
      results.summary.successful++
      
      // Rate limiting to prevent quota issues
      if (index < request.items.length - 1) {
        console.log(`⏳ Waiting 3 seconds before next generation...`)
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate content for trend: ${item.trend}`, error)
      
      // Check if it's a quota/rate limit error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')
      
      if (isQuotaError) {
        console.log(`🚨 Quota/Rate limit detected. Stopping bulk generation to prevent further errors.`)
        results.errors?.push(`⚠️ QUOTA LIMIT REACHED: OpenAI API quota exceeded. Please check your billing and try again later.`)
        
        // Stop processing remaining items to avoid more quota errors
        results.summary.failed = request.items.length - results.summary.successful
        break
      } else {
        results.errors?.push(`Failed to generate content for "${item.trend}": ${errorMessage}`)
      }
      
      results.summary.failed++
    }
  }

  results.summary.processingTime = Date.now() - startTime
  results.success = results.summary.successful > 0

  console.log(`✅ Bulk generation completed: ${results.summary.successful}/${results.summary.totalProcessed} successful`)
  
  return results
}

// Generate content for individual trend
async function generateTrendContent(
  item: TrendItem, 
  contentType: string, 
  language: string
): Promise<{
  content: string
  title: string
  excerpt: string
  hashtags: string[]
  suggestions: string[]
}> {
  
  const languageInstruction = language === 'en' ? 'Write in English.' : 'Write in Dutch.'
  
  // Simplified prompt similar to the working content generator
  const enhancedPrompt = `Create a professional blog post about: ${item.trend}

${languageInstruction}

Context:
- Summary: ${item.summary}
- Target Audience: ${item.audience}
- Tone: ${item.tone}
- Keywords: ${item.keywords.join(', ')}
- Source: ${item.source_title} — ${item.source_url}

IMPORTANT OUTPUT FORMAT:
- Start with a clear, engaging title (no "Title:" label, just the title)
- Follow with the content in clean paragraphs
- Write MINIMUM 3 paragraphs with proper spacing
- Each paragraph should be 3-5 sentences
- Leave EXACTLY ONE EMPTY LINE between each paragraph
- End with a strong conclusion
- Make it ready to copy and paste directly into any platform
- NO formatting markers, NO labels, NO prefixes
- Reference the source naturally: [${item.source_title}](${item.source_url})
- Use one call-to-action from: ${item.cta_ideas.join(', ')}`

  // Use Vercel AI Gateway if available, otherwise fallback to OpenAI
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const gatewayToken = process.env.AI_GATEWAY_TOKEN
  
  let apiUrl: string
  let headers: Record<string, string>
  
  if (gatewayUrl && gatewayToken) {
    console.log('🚀 Using Vercel AI Gateway for bulk content generation')
    apiUrl = `${gatewayUrl}/v1/chat/completions`
    headers = {
      'Authorization': `Bearer ${gatewayToken}`,
      'Content-Type': 'application/json'
    }
  } else {
    console.log('⚠️ Using direct OpenAI API (no gateway configured)')
    apiUrl = 'https://api.openai.com/v1/chat/completions'
    headers = {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: gatewayUrl ? 'openai/gpt-5' : 'gpt-4', // Vercel Gateway uses openai/gpt-5 format
      messages: [
        {
          role: 'system',
          content: `You are a professional content writer. Write exactly what the user requests in a clear, engaging way.

CRITICAL OUTPUT REQUIREMENTS:
- Write ONLY the actual content, no labels or prefixes
- NEVER start with "Title:", "Introduction:", "Content:", "Conclusion:", etc.
- NEVER use markdown formatting (#, **, *, etc.)
- Write clean, professional text ready for immediate use
- Each paragraph should be 3-5 sentences with proper spacing
- Make it copy-paste ready for any platform
- Focus ONLY on the specific topic requested
- Do NOT add unrelated concepts or random business terms
- Write in the same language as the prompt`
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: contentType === 'blog' ? 1500 : 800
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    const apiType = gatewayUrl ? 'Vercel AI Gateway' : 'OpenAI API'
    throw new Error(`${apiType} error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  
  console.log('Raw AI content:', JSON.stringify(content)) // Debug logging

  // Improved content parsing for blog posts (same as working content generator)
  const lines = content.split('\n').filter((line: string) => line.trim())
  
  // Find title (first non-empty line, should be the title)
  let title = item.trend
  let contentStartIndex = 0
  
  if (lines.length > 0) {
    // First line is the title
    title = lines[0].trim()
    contentStartIndex = 1
  }
  
  // Use raw content as-is - NO PARSING AT ALL
  let blogContent = content
  
  // Only remove the title line if it exists
  if (lines.length > 0) {
    const titleLine = lines[0].trim()
    if (titleLine) {
      blogContent = content.replace(titleLine, '').trim()
    }
  }
  
  console.log('Final blog content:', JSON.stringify(blogContent)) // Debug logging
  
  // Generate excerpt (first 150 characters of content)
  const excerpt = blogContent.substring(0, 150).replace(/\n/g, ' ').trim() + '...'
  
  // Generate hashtags from keywords
  const hashtags = item.keywords.slice(0, 5).map((k: string) => `#${k.toLowerCase().replace(/[^a-z0-9]/g, '')}`)
  
  const suggestions = [
    language === 'en' ? `Add personal experience with ${item.trend}` : `Voeg persoonlijke ervaring toe met ${item.trend}`,
    language === 'en' ? 'Include practical steps or exercises' : 'Voeg praktische stappen of oefeningen toe',
    language === 'en' ? 'Create engaging visuals or infographics' : 'Maak boeiende visuals of infographics'
  ]

  return {
    content: blogContent,
    title,
    excerpt,
    hashtags,
    suggestions
  }
}

// Publish Sanitizer - removes internal suggestions from published content
export function stripInternalSuggestions(text: string): string {
  if (!text) return text;
  const marker = "SUGGESTIONS (DO NOT PUBLISH):";
  return text.includes(marker) ? text.split(marker)[0].trim() : text.trim();
}

// Helper function to validate trend data structure
export function validateTrendData(data: any): boolean {
  if (!data || !Array.isArray(data.items)) {
    return false
  }
  
  const requiredFields = ['trend', 'summary', 'keywords', 'audience', 'tone']
  
  for (const item of data.items) {
    if (!item || typeof item !== 'object') {
      return false
    }
    
    for (const field of requiredFields) {
      if (!item[field]) {
        return false
      }
    }
  }
  
  return true
}

// Convert generated content to WordPress-ready format
export function formatForWordPress(generatedContent: BulkContentResult['generatedPosts'][0], baseUrl: string = '/content') {
  return {
    title: generatedContent.title,
    content: generatedContent.content,
    excerpt: generatedContent.excerpt,
    status: 'publish',
    categories: generatedContent.metadata.tags.map(tag => ({ name: tag })),
    tags: generatedContent.hashtags,
    meta: {
      ai_generated: true,
      trend_source: generatedContent.trend,
      source_url: generatedContent.metadata.sourceUrl,
      target_audience: generatedContent.metadata.audience,
      tone: generatedContent.metadata.tone,
      generated_at: generatedContent.metadata.generatedAt,
      bulk_batch: true
    }
  }
}
