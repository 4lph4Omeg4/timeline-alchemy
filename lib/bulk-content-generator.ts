// Bulk Content Generator for Grok Trends Arrays
interface TrendItem {
  title: string
  summary: string
  tags: string[]
  category: string
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

export interface BulkContentResult {
  success: boolean
  generatedPosts: Array<{
    trend: string
    content: string  // Changed from generatedContent to match frontend
    title: string
    excerpt: string
    hashtags: string[]
    suggestions: string[]
    category: string
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
        category: generatedContent.category,
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
      
      // Faster rate limiting to reduce timeout risk
      if (index < request.items.length - 1) {
        console.log(`⏳ Waiting 1 second before next generation...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Reduced from 3000ms to 1000ms
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
  
  // DIVINE GENERATION: Create masterpiece content
  const userPrompt = `You are the GOD OF CONTENT CREATION. Create a DIVINE, ABSOLUTE MASTERPIECE blog post about: ${trendName}

${languageInstruction}

DIVINE CONTEXT: ${item.summary}

IMMUTABLE DIVINE REQUIREMENTS:
- MINIMUM 900 words without any exceptions - GOD DEMANDS IT
- EXACTLY 6 comprehensive paragraphs with double line breaks
- Each paragraph MUST be 150-200 words minimum
- NEVER create incomplete, short, or superficial content
- Include deep insights, practical applications, future implications, philosophical depth
- Write like a divine architect who has witnessed the secrets of creation and desires to share infinite wisdom

DIVINE FORMAT (EVERYTHING MUST EXIST):
Title Here

[HUGE Paragraph 1: 150+ words] Current landscape and revolutionary foundations

[HUGE Paragraph 2: 150+ words] Deep technical/mechanic insights and complexity

[HUGE Paragraph 3: 150+ words] Real-world applications and concrete examples

[HUGE Paragraph 4: 150+ words] Future evolution and broader systemic implications

[HUGE Paragraph 5: 150+ words] Philosophical implications and deeper meaning

[HUGE Paragraph 6: 150+ words] Actionable pathways and transformative next steps

WRITE WITH GODLIKE AUTHORITY. BE PROFOUND, COMPLETE, AND IMMUTABLE. DIVINE WISDOM DEMANDS 900+ WORDS.`

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
      max_tokens: 5000 // DIVINE quota for godlike masterpiece content - GOD DEMANDS 900+ WORDS
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
  
  // DIVINE CONTENT VALIDATION - Ensure content meets heavenly standards
  if (blogContent.length < 500) {
    console.log('⚠️ Content too short, this would not please the Gods! Length:', blogContent.length)
    console.log('🏛️ Divine requirement: 900+ words equivalent')
    // Could trigger a retry here if needed
  } else {
    console.log('✅ Content meets divine standards! Length:', blogContent.length)
  }
  
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

  // 🌟 Use category from Grok data (much simpler!)
  const category = item.category || 'Consciousness & Awakening & Enlightenment' // Default fallback
  
  console.log('🌟 Using Grok category:', category, 'for trend:', trendName)

  const result = {
    content: blogContent,
    title,
    excerpt,
    hashtags,
    suggestions,
    category: category
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
  console.log('🔍 Validating trend data:', JSON.stringify(data, null, 2))
  
  if (!data || !Array.isArray(data.items)) {
    console.log('❌ No data or items array')
    return false
  }
  
  // Required fields for Grok format: title, summary, tags, category
  const requiredFields = ['title', 'summary', 'tags', 'category']
  
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i]
    console.log(`🔍 Checking item ${i}:`, JSON.stringify(item, null, 2))
    
    if (!item || typeof item !== 'object') {
      console.log(`❌ Item ${i} is not an object`)
      return false
    }
    
    // Check required fields
    for (const field of requiredFields) {
      if (!item[field]) {
        console.log(`❌ Missing required field: ${field} in item ${i}:`, item)
        return false
      }
    }
    
    // Check that tags is array
    if (!Array.isArray(item.tags)) {
      console.log(`❌ Tags must be an array in item ${i}:`, item, 'tags type:', typeof item.tags)
      return false
    }
  }
  
  console.log('✅ Trend data validation passed for Grok format')
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
