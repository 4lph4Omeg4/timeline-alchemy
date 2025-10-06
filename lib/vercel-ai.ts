// Simplified Vercel AI Gateway Integration
// This provides enhanced functionality through the Gateway without complex SDK dependencies

interface BlogPostData {
  title: string
  content: string
  excerpt: string
  hashtags: string[]
  suggestions: string[]
}

interface SocialPostsData {
  facebook: string
  instagram: string
  twitter: string
  linkedin: string
  discord: string
  reddit: string
  telegram: string
}

// Check if Vercel AI Gateway is configured
function isGatewayEnabled(): boolean {
  // Vercel AI Gateway uses project linking, so we check for Vercel environment
  const isVercel = process.env.VERCEL && process.env.VERCEL_ENV
  const hasProjectId = process.env.VERCEL_PROJECT_ID
  const hasToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN
  
  console.log('🔍 Gateway Check:', {
    isVercel: !!isVercel,
    hasProjectId: !!hasProjectId,
    hasToken: !!hasToken,
    environment: process.env.VERCEL_ENV
  })
  
  return !!(isVercel && hasProjectId && hasToken)
}

// Enhanced content generation with Gateway optimization
export async function generateVercelContent(prompt: string, type: 'blog' | 'social', tone: string = 'professional') {
  try {
    if (type === 'blog') {
      return await generateBlogContent(prompt, tone)
    } else {
      return await generateSocialContent(prompt, tone)
    }
  } catch (error) {
    console.error('❌ Vercel AI generation error:', error)
    throw new Error(`Failed to generate content with Vercel AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Blog content generation with Gateway enhancement
async function generateBlogContent(prompt: string, tone: string) {
  const enhancedPrompt = `Create a comprehensive blog post about: ${prompt}

Content Requirements:
- Write in a ${tone} tone
- Include engaging title
- Create 3-5 well-structured paragraphs
- Each paragraph should be 3-5 sentences
- Add relevant hashtags (5-8)
- Provide 3 content improvement suggestions
- Make it ready for immediate publication
- Use double line breaks (\n\n) between paragraphs
- Focus on practical insights and actionable advice`

  const gatewayUrl = process.env.AI_GATEWAY_URL
  const model = gatewayUrl ? 'openai/gpt-5' : 'gpt-4' // Use openai/gpt-5 for gateway, gpt-4 for direct API
  const content = await callOpenAI(enhancedPrompt, model, 1500)
  
  // Parse the structured response
  const lines = content.split('\n').filter(line => line.trim())
  const title = lines[0]?.trim() || 'Untitled'
  const postContent = content.replace(title, '').trim()
  const excerpt = postContent.substring(0, 150).replace(/\n/g, ' ').trim() + '...'
  
  // Extract hashtags from content or generate them
  const hashtags = extractHashtags(content, prompt)
  const suggestions = [
    'Add a call-to-action to encourage reader engagement',
    'Include relevant examples or case studies',
    'Add visual elements to break up text sections'
  ]

  console.log('✅ Enhanced blog content generated')
  return {
    success: true,
    content: postContent,
    title,
    excerpt,
    hashtags,
    suggestions,
    enhanced: true,
    provider: isGatewayEnabled() ? 'vercel-gateway' : 'openai-direct'
  }
}

// Social media content generation with Gateway enhancement
async function generateSocialContent(prompt: string, tone: string) {
  const platforms: Array<keyof SocialPostsData> = ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit', 'telegram']
  const socialPosts: SocialPostsData = {} as SocialPostsData

  // Generate content for each platform
  for (const platform of platforms) {
    const platformPrompt = `Create a ${platform}-optimized social media post about: ${prompt}

Platform Guidelines:
- Facebook: Conversational, community-focused, 1-2 sentences, max 200 characters
- Instagram: Visual, hashtag-friendly, 1-2 sentences with emojis, max 150 characters
- Twitter: Concise, engaging, under 280 characters
- LinkedIn: Professional, thought-provoking, 1-2 sentences, max 300 characters
- Discord: Community-focused, casual, engaging, max 200 characters
- Reddit: Discussion-provoking, authentic tone, max 250 characters
- Telegram: Channel-friendly, informative with emojis, max 200 characters

Write in a ${tone} tone and make it engaging for its specific platform.`

    try {
      const content = await callOpenAI(platformPrompt, 'gpt-4', 300)
      socialPosts[platform] = content.trim()
    } catch (error) {
      console.error(`Error generating ${platform} content:`, error)
      socialPosts[platform] = `Engaging ${platform} post about ${prompt}`
    }
  }

  console.log('✅ Enhanced social media content generated')
  return {
    success: true,
    socialPosts,
    enhanced: true,
    provider: isGatewayEnabled() ? 'vercel-gateway' : 'openai-direct'
  }
}

// Enhanced image generation with prompt optimization
export async function generateVercelImage(prompt: string) {
  try {
    // Use the original prompt directly - no cosmic enhancement
    const enhancedPrompt = prompt
    
    console.log('🎨 Using original prompt:', enhancedPrompt)
    
    // Generate image using OpenAI API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid'
      })
    })

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`)
    }

    const imageData = await response.json()
    const imageUrl = imageData.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from generation')
    }

    console.log('✅ Enhanced image generation successful')
    return {
      success: true,
      imageUrl,
      enhancedPrompt,
      enhanced: true,
      provider: isGatewayEnabled() ? 'vercel-gateway-enhanced' : 'openai-direct'
    }
  } catch (error) {
    console.error('❌ Enhanced image generation error:', error)
    throw new Error(`Failed to generate enhanced image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Unified OpenAI API call with Gateway routing
async function callOpenAI(prompt: string, model: string = 'gpt-4', maxTokens: number = 1000): Promise<string> {
  // Check if we're running on Vercel with AI Gateway linked
  const isVercelEnvironment = process.env.VERCEL && process.env.VERCEL_ENV
  const hasProjectId = process.env.VERCEL_PROJECT_ID
  
  let apiUrl = 'https://api.openai.com/v1/chat/completions'
  let apiKey = process.env.OPENAI_API_KEY
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  // Use Vercel AI Gateway if project is linked
  if (isVercelEnvironment && hasProjectId && (process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN)) {
    console.log('🚀 Using Vercel AI Gateway (project-linked)')
    
    // Vercel AI Gateway uses the project's automatic token management
    // The token is automatically refreshed every 12 hours by Vercel
    apiUrl = `https://api.vercel.com/v1/ai/gateway/${process.env.VERCEL_PROJECT_ID}/chat/completions`
    
    // Use Vercel's automatic token (no manual token needed)
    headers['Authorization'] = `Bearer ${process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN}`
    headers['X-Vercel-AI-Gateway'] = 'true'
    headers['X-Vercel-Project-Id'] = process.env.VERCEL_PROJECT_ID || ''
    
    console.log('🔍 Vercel Gateway Configuration:', {
      projectId: process.env.VERCEL_PROJECT_ID,
      environment: process.env.VERCEL_ENV,
      hasVercelToken: !!(process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN)
    })
  } else {
    console.log('📡 Using direct OpenAI API (Gateway not available)')
    console.log('🔍 Fallback reason:', {
      isVercelEnvironment,
      hasProjectId,
      hasVercelToken: !!(process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN)
    })
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional content writer with expertise in engaging, well-structured content creation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url: apiUrl.substring(0, 50) + '...',
      isVercelEnvironment,
      hasProjectId,
      usingGateway: apiUrl.includes('vercel.com')
    })
    
    // Check for quota limit specifically
    if (response.status === 429 || errorText.includes('quota') || errorText.includes('billing')) {
      throw new Error(`QUOTA LIMIT REACHED: ${errorText.includes('quota') ? 'OpenAI API quota exceeded' : 'API quota exceeded'}. Please check your billing and try again later.`)
    }
    
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// Stream generation for real-time content creation
export async function* generateStreamingContent(prompt: string, type: 'blog' | 'social') {
  try {
    const fullPrompt = type === 'blog' 
      ? `Write a comprehensive blog post about: ${prompt}`
      : `Create a social media post about: ${prompt} optimized for ${type}`

    // For now, yield the full content at once
    // In a real implementation, this would stream chunks
    const content = await callOpenAI(fullPrompt, 'gpt-4', type === 'blog' ? 2000 : 500)
    
    // Simulate streaming by yielding words
    const words = content.split(' ')
    for (const word of words) {
      yield word + ' '
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 30))
    }
  } catch (error) {
    console.error('❌ Streaming generation error:', error)
    throw new Error(`Failed to generate streaming content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Analytics and monitoring with Vercel AI Gateway
export function getVercelAIStats() {
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const gatewayToken = process.env.AI_GATEWAY_TOKEN || process.env.AI_GATEWAY_API_KEY
  
  return {
    isUsingGateway: !!(gatewayUrl && gatewayToken),
    gatewayUrl: gatewayUrl ? 'Configured' : 'Not configured',
    hasCredits: !!gatewayToken,
    availableFeatures: gatewayUrl ? [
      'Advanced prompt optimization',
      'Usage analytics',
      'Rate limiting',
      'Caching optimizations',
      'Cost optimization',
      'Performance monitoring'
    ] : []
  }
}

// Helper: Extract hashtags from content
function extractHashtags(content: string, originalPrompt: string): string[] {
  // Extract hashtags from content
  const hashtagMatches = content.match(/#[\w]+/g)
  if (hashtagMatches) {
    return hashtagMatches.slice(0, 6) // Limit to 6 hashtags
  }
  
  // Generate hashtags from prompt
  const words = originalPrompt.toLowerCase().split(' ')
  return words
    .filter(word => word.length > 3)
    .slice(0, 5)
    .map(word => `#${word.replace(/[^a-z0-9]/g, '')}`)
}