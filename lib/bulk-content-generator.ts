// Bulk Content Generator for Grok Trends Arrays
interface TrendItem {
  title: string
  summary: string
  tags: string[]
  // Optional fields for backward compatibility
  trend?: string
  source_title?: string
  source_url?: string
  keywords?: string[]
  recommended_formats?: string[]
  audience?: string
  tone?: string
  cta_ideas?: string[]
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
      summary?: string
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
      const trendName = item.title || item.trend || 'Unknown Trend'
      console.log(`📝 Processing trend ${index + 1}/${request.items.length}: ${trendName}`)
      
      const mappedContentType = mapContentType(request.contentType)
      const generatedContent = await generateTrendContent(item, mappedContentType, request.language || 'nl')
      
      results.generatedPosts.push({
        trend: trendName,
        content: generatedContent.content,
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        hashtags: generatedContent.hashtags,
        suggestions: generatedContent.suggestions,
        metadata: {
          sourceTitle: item.source_title || item.title || 'Grok Trend Analysis',
          sourceUrl: item.source_url || '',
          audience: item.audience || 'conscious consumers and tech enthusiasts',
          tone: item.tone || 'insightful',
          keywords: item.keywords || item.tags,
          tags: item.tags,
          summary: item.summary,
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
  
  // Get trend name (use title or trend field)
  const trendName = item.title || item.trend || 'Unknown Trend'
  
      console.log('🚀 generateTrendContent called with:', {
    trend: trendName,
    contentType,
    language,
    hasGateway: !!(process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_TOKEN),
    itemFields: {
      title: item.title,
      summary: item.summary,
      tags: item.tags,
      hasAudience: !!item.audience,
      hasTone: !!item.tone,
      hasKeywords: !!item.keywords
    }
  })
  
  const languageInstruction = language === 'en' ? 'Write in English.' : 'Write in Dutch.'
  
  // Create comprehensive prompt for Grok format
  const userPrompt = `Create a professional blog post about: ${trendName}

${languageInstruction}

Context: ${item.summary}
Target Audience: ${item.audience || 'conscious consumers and tech enthusiasts'}
Tone: ${item.tone || 'insightful'}
Keywords: ${item.keywords?.join(', ') || item.tags.join(', ')}
Source: ${item.source_title || 'Grok Trend Analysis'}

IMPORTANT OUTPUT FORMAT:
- Start with a clear, engaging title (no "Title:" label, just the title)
- Follow with the content in clean paragraphs
- Write MINIMUM 3 paragraphs with proper spacing
- Each paragraph should be 3-5 sentences
- Leave EXACTLY ONE EMPTY LINE between each paragraph
- End with a strong conclusion
- Make it ready to copy and paste directly into any platform
- NO formatting markers, NO labels, NO prefixes
- Reference the source naturally with inline link
- Include one engaging call-to-action suggestion
- DO NOT repeat any content - each paragraph should be unique
- DO NOT duplicate the first paragraph at the end
- CRITICAL: Use double line breaks (\\n\\n) between paragraphs
- Example format:
  Title Here
  
  First paragraph content here.
  
  Second paragraph content here.
  
  Third paragraph content here.`

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
- Write in the same language as the prompt

Write in a professional tone. Create content that is medium in length.
Focus on the specific topic requested without adding unrelated business concepts.`
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000 // Same as working content generator
    })
  })

  console.log('🔍 API Response status:', response.status)
  console.log('🔍 API Response ok:', response.ok)
  
  if (!response.ok) {
    const errorText = await response.text()
    const apiType = gatewayUrl ? 'Vercel AI Gateway' : 'OpenAI API'
    console.log('❌ API Error:', errorText)
    throw new Error(`${apiType} error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  
  console.log('🔍 Full API Response:', JSON.stringify(data, null, 2))
  console.log('🔍 Raw AI content:', JSON.stringify(content))
  console.log('🔍 Content length:', content.length)

  // Improved content parsing for blog posts (same as working content generator)
  const lines = content.split('\n').filter((line: string) => line.trim())
  
  // Find title (first non-empty line, should be the title)
  let title = item.title || item.trend || 'Untitled'
  let contentStartIndex = 0

  if (lines.length > 0) {
    // First line is the title
    title = lines[0].trim() || item.title || item.trend || 'Untitled'
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
  
  console.log('🔍 Final blog content:', JSON.stringify(blogContent))
  console.log('🔍 Extracted title:', JSON.stringify(title))
  console.log('🔍 Blog content length:', blogContent.length)
  
  // Generate excerpt (first 150 characters of content)
  const excerpt = blogContent.substring(0, 150).replace(/\n/g, ' ').trim() + '...'
  
  // Generate hashtags from keywords or tags
  const keywordSource = item.keywords || item.tags
  const hashtags = keywordSource.slice(0, 5).map((k: string) => `#${k.toLowerCase().replace(/[^a-z0-9]/g, '')}`)
  
  const suggestions = [
    language === 'en' ? `Add personal experience with ${trendName}` : `Voeg persoonlijke ervaring toe met ${trendName}`,
    language === 'en' ? 'Include practical steps or exercises' : 'Voeg praktische stappen of oefeningen toe',
    language === 'en' ? 'Create engaging visuals or infographics' : 'Maak boeiende visuals of infographics'
  ]

  const result = {
    content: blogContent,
    title,
    excerpt,
    hashtags,
    suggestions
  }
  
  console.log('✅ Final result for trend:', item.trend, result)
  
  return result
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
