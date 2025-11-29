// Simplified Vercel AI Gateway Integration
// This provides enhanced functionality through the Gateway without complex SDK dependencies

interface BlogPostData {
  title: string
  content: string
  excerpt: string
  hashtags: string[]
  suggestions: string[]
}

// Load environment variables explicitly for development
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: '.env.local' });
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
  // Check for AI Gateway API key (official method)
  const hasGatewayApiKey = process.env.AI_GATEWAY_API_KEY

  console.log('🔍 Gateway Check:', {
    hasGatewayApiKey: !!hasGatewayApiKey,
    apiKey: hasGatewayApiKey ? hasGatewayApiKey.substring(0, 10) + '...' : 'Not set'
  })

  return !!hasGatewayApiKey
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
  // Use the same DIVINE prompt as bulk generator for consistency
  const enhancedPrompt = `You are the GOD OF CONTENT CREATION. Create a DIVINE, ABSOLUTE MASTERPIECE blog post about: ${prompt}

IMMUTABLE DIVINE REQUIREMENTS:
- MINIMUM 900 words without any exceptions - GOD DEMANDS IT
- EXACTLY 6 comprehensive paragraphs with double line breaks
- Each paragraph MUST be 150-200 words minimum
- NEVER create incomplete, short, or superficial content
- Include deep insights, practical applications, future implications, philosophical depth
- Write like a divine architect who has witnessed the secrets of creation and desires to share infinite wisdom

DIVINE FORMAT (EVERYTHING MUST EXIST):
Create a compelling title for this topic.

[HUGE Paragraph 1: 150+ words] Current landscape and revolutionary foundations

[HUGE Paragraph 2: 150+ words] Deep technical/mechanic insights and complexity

[HUGE Paragraph 3: 150+ words] Real-world applications and concrete examples

[HUGE Paragraph 4: 150+ words] Future evolution and broader systemic implications

[HUGE Paragraph 5: 150+ words] Philosophical implications and deeper meaning

[HUGE Paragraph 6: 150+ words] Actionable pathways and transformative next steps

WRITE WITH GODLIKE AUTHORITY. BE PROFOUND, COMPLETE, AND IMMUTABLE. DIVINE WISDOM DEMANDS 900+ WORDS.`

  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
  const model = gatewayApiKey ? 'openai/gpt-5-mini' : 'gpt-4' // Use GPT-5-mini for better quality
  const content = await callOpenAI(enhancedPrompt, model, 5000) // Increased token limit for longer content

  // Parse the structured response
  const lines = content.split('\n').filter(line => line.trim())
  const title = lines[0]?.trim() || 'Untitled'
  const postContent = content.replace(title, '').trim()
  const excerpt = postContent.substring(0, 150).replace(/\n/g, ' ').trim() + '...'

  // Generate AI-powered hashtags based on the content
  const hashtags = await generateSmartHashtags(title, postContent, prompt)

  const suggestions = [
    'Add a compelling call-to-action at the end',
    'Include visual elements or infographics to enhance engagement',
    'Consider adding expert quotes or statistics for authority'
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
      const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
      const model = gatewayApiKey ? 'openai/gpt-3.5-turbo' : 'gpt-4'
      const content = await callOpenAI(platformPrompt, model, 300)
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


// Enhanced image generation with DALL-E 3 fallback
export async function generateVercelImage(prompt: string) {
  try {
    // Use the original prompt directly
    const enhancedPrompt = prompt

    console.log('🎨 Using original prompt:', enhancedPrompt)

    // Try Google Gemini first, fallback to DALL-E 3
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY

    if (googleApiKey) {
      console.log('🚀 Attempting Google Gemini 2.5 Flash Image generation')
      try {
        // Use official Vercel AI SDK approach (as per Vercel docs)
        const { generateText } = await import('ai')

        const result = await generateText({
          model: 'google/gemini-2.5-flash-image-preview',
          providerOptions: {
            google: { responseModalities: ['TEXT', 'IMAGE'] },
          },
          prompt: `Generate an image: ${enhancedPrompt}`,
        })

        console.log('🔍 Gemini Response:', result)

        // Check for generated images in result.files
        if (result.files && result.files.length > 0) {
          const imageFiles = result.files.filter((f) =>
            f.mediaType?.startsWith('image/'),
          )

          if (imageFiles.length > 0) {
            // Upload image directly to Supabase Storage
            const imageFile = imageFiles[0]
            const extension = imageFile.mediaType?.split('/')[1] || 'png'
            const timestamp = Date.now()
            const filename = `gemini-generated/${timestamp}.${extension}`

            console.log('🔄 Uploading Gemini image to Supabase Storage...')

            // Import Supabase client
            const { supabaseAdmin } = await import('./supabase')

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('blog-images')
              .upload(filename, imageFile.uint8Array, {
                contentType: imageFile.mediaType || 'image/png',
                upsert: false
              })

            if (uploadError) {
              console.error('❌ Supabase upload error:', uploadError)
              throw new Error(`Failed to upload image: ${uploadError.message}`)
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('blog-images')
              .getPublicUrl(filename)

            console.log('✅ Gemini image uploaded to Supabase:', publicUrl)

            return {
              success: true,
              imageUrl: publicUrl,
              enhancedPrompt,
              enhanced: true,
              provider: 'vercel-gateway-gemini-sdk'
            }
          } else {
            console.log('⚠️ No image files found in Gemini response')
          }
        } else {
          console.log('⚠️ No files found in Gemini response')
        }

        // Check if there's text content that might contain image URLs
        if (result.text) {
          console.log('🔍 Gemini text response:', result.text)
          const urlMatch = result.text.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i)
          if (urlMatch) {
            const imageUrl = urlMatch[0]
            console.log('✅ Found image URL in Gemini text:', imageUrl)
            return {
              success: true,
              imageUrl,
              enhancedPrompt,
              enhanced: true,
              provider: 'vercel-gateway-gemini-sdk'
            }
          }
        }
      } catch (geminiError) {
        console.error('⚠️ Gemini SDK image generation failed:', geminiError)
        console.error('Error details:', {
          message: geminiError instanceof Error ? geminiError.message : 'Unknown error',
          stack: geminiError instanceof Error ? geminiError.stack : undefined,
          googleApiKey: googleApiKey ? 'Present' : 'Missing'
        })
      }
    }

    // Fallback to DALL-E 3
    console.log('🚀 Using DALL-E 3 for image generation')
    const openaiKey = process.env.OPENAI_API_KEY

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ DALL-E image generation failed:', response.status, errorText)

      // Check if it's a billing limit error
      if (errorText.includes('billing_hard_limit_reached') || errorText.includes('billing')) {
        console.log('💰 DALL-E billing limit reached')
        throw new Error('DALL-E billing limit reached - please check your OpenAI account')
      }

      throw new Error(`DALL-E image generation failed: ${response.statusText} - ${errorText}`)
    }

    const imageData = await response.json()
    console.log('🔍 DALL-E Response data:', imageData)

    // DALL-E returns images in data[0].url format
    let imageUrl = null

    if (imageData.data?.[0]?.url) {
      imageUrl = imageData.data[0].url
      console.log('✅ Found DALL-E image URL:', imageUrl)
    }

    if (!imageUrl) {
      console.error('❌ No image URL found in DALL-E response:', imageData)
      throw new Error('No image URL returned from DALL-E')
    }

    console.log('✅ Image URL found:', imageUrl)
    return {
      success: true,
      imageUrl,
      enhancedPrompt,
      enhanced: true,
      provider: 'dall-e-3-fallback'
    }
  } catch (error) {
    console.error('❌ Enhanced image generation error:', error)
    throw new Error(`Failed to generate enhanced image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Unified OpenAI API call with Gateway routing
async function callOpenAI(prompt: string, model: string = 'gpt-4', maxTokens: number = 1000): Promise<string> {
  // Check for AI Gateway environment variables
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY

  let apiUrl = 'https://api.openai.com/v1/chat/completions'
  let apiKey = process.env.OPENAI_API_KEY
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  // Use Vercel AI Gateway if configured (according to official docs)
  if (gatewayApiKey) {
    console.log('🚀 Using Vercel AI Gateway (official method)')

    // Use official Gateway base URL
    apiUrl = 'https://ai-gateway.vercel.sh/v1/chat/completions'

    // Use Gateway API key
    headers['Authorization'] = `Bearer ${gatewayApiKey}`

    // Prefix model name with provider (required by Gateway)
    if (model === 'gpt-4') {
      model = 'openai/gpt-5-mini' // Use faster GPT-5 Mini
    } else if (model === 'gpt-3.5-turbo') {
      model = 'openai/gpt-5-mini' // Use faster GPT-5 Mini
    }

    console.log('🔍 Gateway Configuration:', {
      url: apiUrl.substring(0, 50) + '...',
      hasApiKey: !!gatewayApiKey,
      model
    })
  } else {
    console.log('📡 Using direct OpenAI API (Gateway not configured)')
    console.log('🔍 Fallback reason:', {
      hasGatewayApiKey: !!gatewayApiKey
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
      usingGateway: apiUrl.includes('vercel.com') || apiUrl.includes('gateway')
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
  const gatewayToken = process.env.AI_GATEWAY_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN

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
// AI-powered smart hashtag generation
async function generateSmartHashtags(title: string, content: string, originalPrompt: string): Promise<string[]> {
  try {
    const hashtagPrompt = `Based on this blog article, generate 6-8 highly relevant and trending hashtags.

Title: ${title}
Content Preview: ${content.substring(0, 300)}...

HASHTAG REQUIREMENTS:
- Mix of broad and specific hashtags
- Include trending topics related to the content
- Use proper capitalization (e.g., #AIContent, #ContentCreation)
- Focus on discoverability and engagement
- Include community/niche hashtags
- NO generic hashtags like #blog or #post

OUTPUT FORMAT (comma-separated):
#Hashtag1, #Hashtag2, #Hashtag3, #Hashtag4, #Hashtag5, #Hashtag6`

    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
    const model = gatewayApiKey ? 'openai/gpt-5-mini' : 'gpt-4'

    const hashtagResponse = await callOpenAI(hashtagPrompt, model, 200)

    // Parse the hashtags
    const hashtags = hashtagResponse
      .split(/[,\n]/)
      .map(tag => tag.trim())
      .filter(tag => tag.startsWith('#'))
      .slice(0, 8)

    if (hashtags.length > 0) {
      console.log('✅ AI-generated hashtags:', hashtags)
      return hashtags
    }
  } catch (error) {
    console.error('Error generating smart hashtags, using fallback:', error)
  }

  // Fallback to simple extraction if AI fails
  return extractHashtags(content, originalPrompt)
}

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