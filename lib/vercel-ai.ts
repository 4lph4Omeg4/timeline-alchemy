import { openai } from '@ai-sdk/openai'
import { generateText, generateObject } from 'ai'
import { z } from 'zod'

// Schema for blog post generation
const BlogPostSchema = z.object({
  title: z.string().describe('Engaging blog post title'),
  content: z.string().describe('Complete blog post content with proper paragraph breaks'),
  excerpt: z.string().describe('Short excerpt summarizing the content'),
  hashtags: z.array(z.string()).describe('Relevant hashtags'),
  suggestions: z.array(z.string()).describe('Content improvement suggestions')
})

// Schema for social posts generation
const SocialPostsSchema = z.object({
  facebook: z.string().describe('Facebook-optimized post'),
  instagram: z.string().describe('Instagram-optimized post with emojis'),
  twitter: z.string().describe('Twitter-optimized post under 280 chars'),
  linkedin: z.string().describe('LinkedIn professional post'),
  discord: z.string().describe('Discord community post'),
  reddit: z.string().describe('Reddit discussion-friendly post'),
  telegram: z.string().describe('Telegram channel post with emojis')
})

// Initialize OpenAI with Vercel AI Gateway
function getVercelAIProvider() {
  // Check for Vercel AI Gateway configuration
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const gatewayToken = process.env.AI_GATEWAY_TOKEN
  
  if (gatewayUrl && gatewayToken) {
    console.log('🚀 Using Vercel AI Gateway')
    return openai('gpt-4', {
      baseURL: gatewayUrl,
      apiKey: gatewayToken,
      // Enable advanced features through Gateway
      headers: {
        'X-Vercel-AI-Gateway': 'true'
      }
    })
  }
  
  // Fallback to direct OpenAI
  console.log('📡 Using direct OpenAI API')
  return openai('gpt-4', {
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Enhanced content generation with Vercel AI Gateway
export async function generateVercelContent(prompt: string, type: 'blog' | 'social', tone: string = 'professional') {
  try {
    const provider = getVercelAIProvider()
    
    if (type === 'blog') {
      // Generate structured blog content
      const result = await generateObject({
        model: provider,
        schema: BlogPostSchema,
        prompt: `Create a comprehensive blog post about: ${prompt}

Content Requirements:
- Write in a ${tone} tone
- Include engaging title
- Create 3-5 well-structured paragraphs
- Each paragraph should be 3-5 sentences
- Add relevant hashtags (5-8)
- Provide 3 content improvement suggestions
- Make it ready for immediate publication
- Use double line breaks (\n\n) between paragraphs`,
        temperature: 0.7,
      })

      console.log('✅ Vercel AI generated structured blog post')
      return {
        success: true,
        content: result.object.content,
        title: result.object.title,
        excerpt: result.object.excerpt,
        hashtags: result.object.hashtags,
        suggestions: result.object.suggestions,
        usage: result.usage,
        finishReason: result.finishReason
      }
    } else {
      // Generate social media posts
      const result = await generateObject({
        model: provider,
        schema: SocialPostsSchema,
        prompt: `Create platform-optimized social media posts about: ${prompt}

Platform Guidelines:
- Facebook: Conversational, community-focused, 1-2 sentences
- Instagram: Visual, hashtag-friendly, 1-2 sentences with emojis
- Twitter: Concise, engaging, under 280 characters
- LinkedIn: Professional, thought-provoking, 1-2 sentences
- Discord: Community-focused, casual, engaging
- Reddit: Discussion-provoking, authentic tone
- Telegram: Channel-friendly, informative with emojis

Write in a ${tone} tone and make each post engaging for its specific platform.`,
        temperature: 0.7,
      })

      console.log('✅ Vercel AI generated social media posts')
      return {
        success: true,
        socialPosts: result.object,
        usage: result.usage,
        finishReason: result.finishReason
      }
    }
  } catch (error) {
    console.error('❌ Vercel AI generation error:', error)
    throw new Error(`Failed to generate content with Vercel AI: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// Enhanced image generation using OpenAI (still using DALL-E 3)
export async function generateVercelImage(prompt: string) {
  try {
    const provider = getVercelAIProvider()
    
    // Generate improved prompt via Vercel AI Gateway
    const promptEnhancement = await generateText({
      model: provider,
      prompt: `Transform this prompt into a DALL-E 3 optimized image description:

Original prompt: ${prompt}

Requirements:
- Add cosmic, ethereal, mystical elements
- Include warm golden light
- Add magical atmosphere and fantasy elements
- Include celestial vibes and otherworldly beauty
- Add dreamlike quality with glowing effects
- Include cosmic dust and stardust particles
- Add aurora-like colors and mystical energy
- Make it enchanting and transcendent
- Include divine light and heavenly glow
- Add fantastical, surreal, mesmerizing elements
- Make it professionally photographed with high resolution
- Use cinematic lighting and warm color palette
- Include magical realism and spiritual energy

Return only the enhanced prompt, no explanations.`,
      temperature: 0.8,
      maxTokens: 500
    })

    const enhancedPrompt = promptEnhancement.text || prompt
    
    console.log('🎨 Enhanced prompt:', enhancedPrompt)
    
    // Use OpenAI's image generation (can be enhanced later with other providers via Gateway)
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

    console.log('✅ Vercel AI enhanced image generation successful')
    return {
      success: true,
      imageUrl,
      enhancedPrompt,
      usage: promptEnhancement.usage?.totalTokens || 0
    }
  } catch (error) {
    console.error('❌ Vercel AI image generation error:', error)
    throw new Error(`Failed to generate image with Vercel AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Stream generation for real-time content creation
export async function* generateStreamingContent(prompt: string, type: 'blog' | 'social') {
  try {
    const provider = getVercelAIProvider()
    
    const fullPrompt = type === 'blog' 
      ? `Write a comprehensive blog post about: ${prompt}`
      : `Create a social media post about: ${prompt} optimized for ${type}`

    const result = await generateText({
      model: provider,
      prompt: fullPrompt,
      temperature: 0.7,
      maxTokens: type === 'blog' ? 2000 : 500
    })

    // Yield the chunks as they come in
    for await (const delta of result.textStream) {
      yield delta
    }
  } catch (error) {
    console.error('❌ Streaming generation error:', error)
    throw new Error(`Failed to generate streaming content: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// Analytics and monitoring with Vercel AI Gateway
export function getVercelAIStats() {
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const gatewayToken = process.env.AI_GATEWAY_TOKEN
  
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
