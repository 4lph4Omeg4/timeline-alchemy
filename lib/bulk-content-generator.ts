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
    generatedContent: string
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
      
      const generatedContent = await generateTrendContent(item, request.contentType, request.language || 'nl')
      
      results.generatedPosts.push({
        trend: item.trend,
        generatedContent: generatedContent.content,
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
      
      // Small delay between generations to respect API limits
      if (index < request.items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate content for trend: ${item.trend}`, error)
      results.errors?.push(`Failed to generate content for "${item.trend}": ${error instanceof Error ? error.message : 'Unknown error'}`)
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
  
  const languageInstruction = language === 'en' ? 'Write in English and maintain professional quality' : 'Schrijf in Nederlands en behoud professionele kwaliteit'
  
  const enhancedPrompt = `Create a comprehensive ${contentType} post about: ${item.trend}

${languageInstruction}

Context Information:
- Summary: ${item.summary}
- Target Audience: ${item.audience}
- Preferred Tone: ${item.tone}
- Keywords to integrate: ${item.keywords.join(', ')}
- Topic Tags: ${item.tags.join(', ')}
- Call-to-Action Ideas: ${item.cta_ideas.join(', ')}

Content Requirements:
- Include engaging title
- Create 3-5 well-structured ${contentType === 'blog' ? 'paragraphs' : 'sentences'}
- Each paragraph should be 3-5 sentences (for blog) or concise (for social)
- Add relevant hashtags (5-8)
- Provide 3 content improvement suggestions
- Make it ready for immediate publication
- Use double line breaks (\n\n) between paragraphs (for blog)
- Include a call-to-action based on the provided ideas
- Reference the source research naturally
- Target the specified audience
- Maintain the specified tone

Make the content engaging, informative, and aligned with spiritual/esoteric themes while being accessible to the intended audience.`

  // Use OpenAI API directly (the same method as our existing content generation)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: language === 'en' 
            ? 'You are a professional content creator specializing in spiritual, esoteric, and consciousness topics. Create engaging, well-structured content that resonates with spiritual seekers and consciousness enthusiasts.'
            : 'Je bent een professional content creator gespecialiseerd in spirituele, esoterische en bewustzijnsonderwerpen. Maak boeiende, goed gestructureerde content die resoneert met spirituele zoekers en bewustzijnsenthusiasten.'
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
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const fullContent = data.choices?.[0]?.message?.content || ''
  
  // Parse the structured response
  const lines = fullContent.split('\n').filter((line: string) => line.trim())
  const title = lines.find((line: string) => line.includes('Title:'))?.replace('Title:', '').trim() || 
               lines.find((line: string) => line.includes('Titel:'))?.replace('Titel:', '').trim() ||
               item.trend
  
  const contentParts = fullContent.split(/\n\n|\r\n\r\n/)
  const postContent = contentParts.length > 1 ? contentParts.slice(1).join('\n\n') : fullContent.replace(title || '', '').trim()
  
  const excerpt = postContent.substring(0, language === 'en' ? 120 : 150).replace(/\n/g, ' ').trim() + '...'
  
  // Extract hashtags from content or generate them
  const hashtagMatches = fullContent.match(/#[\w]+/g)
  let hashtags: string[] = []
  
  if (hashtagMatches) {
    hashtags = hashtagMatches.slice(0, 6).filter((tag: string) => tag.length <= 20)
  } else {
    // Generate hashtags from keywords and trend
    const trendWords = item.trend.toLowerCase().split(' ')
    const keywordWords = item.keywords.map((k: string) => k.toLowerCase())
    const allWords = [...trendWords, ...keywordWords]
      .filter((word: string) => word.length > 3)
      .slice(0, 5)
    
    hashtags = allWords.map((word: string) => `#${word.replace(/[^a-z0-9]/g, '')}${language === 'nl' ? 'Nederland' : ''}`)
  }
  
  const suggestions = [
    language === 'en' ? `Add personal experience with ${item.trend}` : `Voeg persoonlijke ervaring toe met ${item.trend}`,
    language === 'en' ? 'Include practical steps or exercises' : 'Voeg praktische stappen of oefeningen toe',
    language === 'en' ? 'Create engaging visuals or infographics' : 'Maak boeiende visuals of infographics'
  ]

  return {
    content: postContent,
    title,
    excerpt,
    hashtags,
    suggestions
  }
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
    content: generatedContent.generatedContent,
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
