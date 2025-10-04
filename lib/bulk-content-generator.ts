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
  
  const languageInstruction = language === 'en' ? 'Write in English.' : 'Write in Dutch.'
  
  const enhancedPrompt = `Create a comprehensive ${contentType} post about: ${item.trend}

${languageInstruction}

Context:
- Summary: ${item.summary}
- Target Audience: ${item.audience}
- Preferred Tone: ${item.tone}  (playful | bold | sacred-rebel | insightful)
- Keywords: ${item.keywords.join(', ')}
- Topic Tags: ${item.tags.join(', ')}
- Call-to-Action Ideas: ${item.cta_ideas.join(', ')}
- Source: ${item.source_title} — ${item.source_url}

GLOBAL RULES
- Reference the source naturally once (inline link: [${item.source_title}](${item.source_url})).
- Use exactly 1 CTA from Call-to-Action Ideas (no new CTAs).
- Build 5–8 hashtags from Keywords (+ up to 2 from Topic Tags). Lowercase, no spaces, no duplicates.
- Language: follow LANGUAGE_INSTRUCTION; keep it consistent within the post.
- Tone mapping:
  * playful → witty, light, 0–2 emojis max
  * bold → assertive, active voice, no hedging
  * sacred-rebel → devotional + nonconform, mystical but grounded
  * insightful → calm, precise, with concrete takeaways
- Banned words: journey, realm, tapestry, profound, immerse, unlock.
- Make it publication-ready. Do NOT include any "suggestions" in the published body.

CONTENT-TYPE RULES
If ${contentType} == "blog":
  - Title: engaging (≤ 60 chars).
  - Body: 3–5 paragraphs, each 3–5 sentences, with double line breaks.
  - Include one short checklist (2–3 bullets) in any paragraph.
  - Close with 1 CTA line.
  - After the body, print a single line of hashtags (no "Hashtags:" label).

If ${contentType} == "thread":
  - Title (hooky).
  - 7–10 short posts numbered 1/ … N/.
  - Post 1 = hook; final post = CTA.
  - End with one line of hashtags.

If ${contentType} == "short_form":
  - Hook (≤ 80 chars).
  - 4–6 snappy sentences (script vibe).
  - Add a one-paragraph caption (≤ 180 words) that ends with the CTA.
  - End with one line of hashtags.

If ${contentType} == "caption":
  - 1–2 punchy paragraphs (≤ 180 words total), end with the CTA.
  - End with one line of hashtags.

NON-PUBLISHABLE (INTERNAL ONLY)
- Provide exactly 3 improvement suggestions AFTER the final hashtags, preceded by the line:
  "SUGGESTIONS (DO NOT PUBLISH):"
- Keep each suggestion to one sentence.`

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
          content: `You are an elite multi-platform content creator for "Timeline Alchemy".
You STRICTLY follow constraints. You NEVER include meta sections (like "Hashtags:", "Suggestions:") in the publishable body.
Always match the requested CONTENT_TYPE with the exact structure and length rules below.
Keep language consistent with the LANGUAGE_INSTRUCTION (fallback: detect from Target Audience).
Use exactly one Call-to-Action from the provided ideas. Build hashtags only from the provided keywords (+ up to 2 topic tags).
No clichés or purple prose. Be punchy, clear, and practical for spiritual seekers.`
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
  
  // Apply sanitizer to remove internal suggestions
  const sanitizedContent = stripInternalSuggestions(fullContent)
  
  // Parse the structured response
  const lines = sanitizedContent.split('\n').filter((line: string) => line.trim())
  const title = lines.find((line: string) => line.includes('Title:'))?.replace('Title:', '').trim() || 
               lines.find((line: string) => line.includes('Titel:'))?.replace('Titel:', '').trim() ||
               item.trend
  
  const contentParts = sanitizedContent.split(/\n\n|\r\n\r\n/)
  const postContent = contentParts.length > 1 ? contentParts.slice(1).join('\n\n') : sanitizedContent.replace(title || '', '').trim()
  
  const excerpt = postContent.substring(0, language === 'en' ? 120 : 150).replace(/\n/g, ' ').trim() + '...'
  
  // Extract hashtags from content or generate them following new rules
  const hashtagMatches = sanitizedContent.match(/#[\w]+/g)
  let hashtags: string[] = []
  
  if (hashtagMatches) {
    // Clean and deduplicate hashtags
    const uniqueTags = new Set(hashtagMatches.map((tag: string) => tag.toLowerCase()))
    hashtags = Array.from(uniqueTags).slice(0, 8)
  } else {
    // Generate hashtags from keywords + up to 2 topic tags (new rules)
    const keywordWords = item.keywords.map((k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const tagWords = item.tags.slice(0, 2).map((t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const allWords = [...keywordWords, ...tagWords].filter((word: string) => word.length > 2)
    
    hashtags = allWords.slice(0, 8).map((word: string) => `#${word}`)
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
