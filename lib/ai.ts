import OpenAI from 'openai'
import { AIGenerateRequest, AIGenerateResponse, BusinessProfile, BusinessType } from '@/types/index'

// Server-side OpenAI instance (only use in API routes)
export const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Business-specific prompt configurations
const BUSINESS_PROMPTS: Record<BusinessType, {
  systemPrompt: string
  keywords: string[]
  hashtags: string[]
  tone: string
}> = {
  camperdealer: {
    systemPrompt: `You are a content writer specializing in camper and RV dealership marketing. Focus on adventure, freedom, travel, family memories, and the camper lifestyle. Emphasize quality, reliability, and customer service.`,
    keywords: ['camper', 'RV', 'caravan', 'reizen', 'avontuur', 'vrijheid', 'familie', 'vakantie', 'outdoor'],
    hashtags: ['#camper', '#RV', '#reizen', '#avontuur', '#vrijheid', '#familie', '#vakantie'],
    tone: 'adventurous and trustworthy'
  },
  tankstation: {
    systemPrompt: `You are a content writer for gas stations and convenience stores. Focus on convenience, 24/7 service, fuel efficiency, local community, and quick stops. Emphasize reliability and customer service.`,
    keywords: ['tankstation', 'benzine', 'diesel', '24/7', 'gemak', 'lokale service', 'onderweg', 'snack'],
    hashtags: ['#tankstation', '#24/7', '#gemak', '#lokale service', '#onderweg'],
    tone: 'convenient and reliable'
  },
  restaurant: {
    systemPrompt: `You are a content writer for restaurants and cafes. Focus on food quality, atmosphere, local ingredients, customer experience, and culinary expertise. Emphasize taste and hospitality.`,
    keywords: ['restaurant', 'eten', 'culinair', 'lokaal', 'kwaliteit', 'atmosfeer', 'gastvrijheid'],
    hashtags: ['#restaurant', '#eten', '#culinair', '#lokaal', '#kwaliteit'],
    tone: 'warm and appetizing'
  },
  retail: {
    systemPrompt: `You are a content writer for retail businesses. Focus on product quality, customer service, shopping experience, and value. Emphasize selection and customer satisfaction.`,
    keywords: ['winkel', 'producten', 'kwaliteit', 'klantenservice', 'shopping', 'waarde'],
    hashtags: ['#winkel', '#producten', '#kwaliteit', '#shopping'],
    tone: 'helpful and value-focused'
  },
  service: {
    systemPrompt: `You are a content writer for service businesses. Focus on expertise, reliability, customer satisfaction, and professional service. Emphasize trust and quality work.`,
    keywords: ['service', 'expertise', 'betrouwbaar', 'professioneel', 'kwaliteit', 'klanttevredenheid'],
    hashtags: ['#service', '#expertise', '#betrouwbaar', '#professioneel'],
    tone: 'professional and trustworthy'
  },
  hospitality: {
    systemPrompt: `You are a content writer for hospitality businesses. Focus on comfort, guest experience, amenities, and memorable stays. Emphasize hospitality and attention to detail.`,
    keywords: ['hotel', 'accommodatie', 'gastvrijheid', 'comfort', 'ervaring', 'faciliteiten'],
    hashtags: ['#hotel', '#accommodatie', '#gastvrijheid', '#comfort'],
    tone: 'welcoming and comfortable'
  },
  automotive: {
    systemPrompt: `You are a content writer for automotive businesses. Focus on reliability, performance, safety, and customer service. Emphasize expertise and trustworthiness.`,
    keywords: ['auto', 'garage', 'onderhoud', 'betrouwbaar', 'veiligheid', 'prestaties'],
    hashtags: ['#auto', '#garage', '#onderhoud', '#betrouwbaar'],
    tone: 'reliable and expert'
  },
  general: {
    systemPrompt: `You are a professional content writer creating engaging content for businesses. Focus on value, customer service, and quality.`,
    keywords: ['kwaliteit', 'service', 'klanttevredenheid', 'waarde'],
    hashtags: ['#kwaliteit', '#service', '#klanttevredenheid'],
    tone: 'professional and helpful'
  }
}

interface ComprehensiveContentRequest {
  prompt: string
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative'
  length?: 'short' | 'medium' | 'long'
  platforms?: string[]
}

interface GeneratedContent {
  blogPost: {
    title: string
    content: string
    excerpt: string
    tags: string[]
  }
  image: {
    url: string
    prompt: string
  }
  socialPosts: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    tiktok: string
  }
}

export async function generateContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  const { prompt, type, tone = 'professional', length = 'medium', platform, businessProfile } = request

  let systemPrompt = ''
  let userPrompt = ''
  let hashtags: string[] = []

  // Get business-specific configuration
  const businessConfig = businessProfile ? BUSINESS_PROMPTS[businessProfile.type] : BUSINESS_PROMPTS.general
  
  if (type === 'blog') {
    systemPrompt = `${businessConfig.systemPrompt} 
    Write in a ${tone} tone. Create content that is ${length} in length. 
    ${businessProfile ? `Focus on ${businessProfile.name} and their ${businessProfile.industry} business.` : ''}
    Use relevant keywords: ${businessConfig.keywords.join(', ')}.`
    
    userPrompt = `Write a blog post about: ${prompt}`
    hashtags = businessConfig.hashtags
  } else {
    const platformSpecific = platform ? ` for ${platform}` : ''
    systemPrompt = `${businessConfig.systemPrompt} 
    You are a social media expert creating engaging posts${platformSpecific}. 
    Write in a ${tone} tone. Keep it ${length} and engaging.
    ${businessProfile ? `Focus on ${businessProfile.name} and their ${businessProfile.industry} business.` : ''}
    Use relevant keywords: ${businessConfig.keywords.join(', ')}.`
    
    userPrompt = `Create a social media post about: ${prompt}`
    hashtags = businessConfig.hashtags
  }

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: type === 'blog' ? 2000 : 500,
    })

    const content = completion.choices[0]?.message?.content || ''

    if (type === 'blog') {
      // Extract title and content for blog posts
      const lines = content.split('\n')
      const title = lines.find(line => line.trim() && !line.startsWith('#'))?.trim() || 'Untitled'
      const blogContent = content.replace(title, '').trim()
      
      return {
        content: blogContent,
        title,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        suggestions: generateSuggestions(content),
      }
    } else {
      // For social posts, use business-specific hashtags or generate new ones
      const finalHashtags = hashtags.length > 0 ? hashtags : generateHashtags(prompt, platform)
      
      return {
        content,
        hashtags: finalHashtags,
        suggestions: generateSuggestions(content),
      }
    }
  } catch (error) {
    console.error('Error generating content:', error)
    throw new Error('Failed to generate content')
  }
}

export async function generateComprehensiveContent(request: ComprehensiveContentRequest): Promise<GeneratedContent> {
  const { prompt, tone = 'professional', length = 'medium', platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'] } = request

  try {
    const openai = getOpenAI()
    
    // Generate blog post with non-dual perspective
    const blogCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a master content writer specializing in non-dual perspectives. You see beyond binary thinking and write about unity, interconnectedness, and the deeper truths that connect all things. Write in a ${tone} tone, ${length} length. Always include:
          - A compelling title
          - An engaging excerpt
          - Relevant tags
          - Content that transcends either/or thinking
          - Practical insights that honor the whole`
        },
        {
          role: 'user',
          content: `Write a comprehensive blog post about: ${prompt}. Include title, excerpt, tags, and full content.`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const blogContent = blogCompletion.choices[0]?.message?.content || ''
    const blogData = parseBlogContent(blogContent)

    // Generate image
    const imagePrompt = `Professional, high-quality image that represents: ${prompt}. Modern, clean, inspiring, non-dual perspective, unity, interconnectedness`
    const imageUrl = await generateImage(imagePrompt)

    // Generate social media posts for each platform
    const socialPosts = await generateSocialPosts(prompt, tone, platforms)

    return {
      blogPost: blogData,
      image: {
        url: imageUrl,
        prompt: imagePrompt
      },
      socialPosts
    }
  } catch (error) {
    console.error('Error generating comprehensive content:', error)
    throw new Error('Failed to generate comprehensive content')
  }
}

async function generateSocialPosts(prompt: string, tone: string, platforms: string[]): Promise<any> {
  const socialPosts: any = {}
  const openai = getOpenAI()

  for (const platform of platforms) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert creating ${platform}-optimized posts. Write in a ${tone} tone. Platform guidelines:
            - Facebook: Conversational, community-focused, 1-2 sentences
            - Instagram: Visual, hashtag-friendly, 1-2 sentences with emojis
            - Twitter: Concise, engaging, under 280 characters
            - LinkedIn: Professional, thought-provoking, 1-2 sentences
            - TikTok: Trendy, engaging, short and punchy`
          },
          {
            role: 'user',
            content: `Create a ${platform} post about: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      socialPosts[platform] = completion.choices[0]?.message?.content || ''
    } catch (error) {
      console.error(`Error generating ${platform} post:`, error)
      socialPosts[platform] = `Engaging content about ${prompt}`
    }
  }

  return socialPosts
}

function parseBlogContent(content: string): { title: string; content: string; excerpt: string; tags: string[] } {
  const lines = content.split('\n').filter(line => line.trim())
  
  let title = 'Untitled'
  let excerpt = ''
  let tags: string[] = []
  let blogContent = content

  // Extract title (usually first line or after "Title:")
  const titleMatch = content.match(/(?:Title:|#\s*)(.+)/i)
  if (titleMatch) {
    title = titleMatch[1].trim()
  } else if (lines.length > 0) {
    title = lines[0].replace(/^#+\s*/, '').trim()
  }

  // Extract excerpt (look for "Excerpt:" or first paragraph)
  const excerptMatch = content.match(/(?:Excerpt:|Summary:)\s*(.+)/i)
  if (excerptMatch) {
    excerpt = excerptMatch[1].trim()
  } else {
    // Use first substantial paragraph as excerpt
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50)
    excerpt = paragraphs[0]?.trim().substring(0, 200) + '...' || ''
  }

  // Extract tags (look for "Tags:" or hashtags)
  const tagsMatch = content.match(/(?:Tags?:|#)\s*(.+)/i)
  if (tagsMatch) {
    tags = tagsMatch[1].split(/[,\s]+/).filter(tag => tag.trim()).slice(0, 5)
  } else {
    // Generate tags from content
    const words = content.toLowerCase().split(/\s+/)
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'a', 'an'])
    tags = words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  }

  // Clean up blog content
  blogContent = content
    .replace(/^(?:Title:|Excerpt:|Tags?:|Summary:).+$/gim, '')
    .replace(/^#+\s*.+$/gm, '')
    .trim()

  return { title, content: blogContent, excerpt, tags   }
}

// Helper function to create business profiles
export function createBusinessProfile(
  type: BusinessType,
  name: string,
  industry: string,
  targetAudience: string[],
  keyServices: string[],
  brandVoice: string,
  location?: string
): BusinessProfile {
  return {
    type,
    name,
    industry,
    targetAudience,
    keyServices,
    brandVoice,
    location
  }
}

// Predefined business profiles for common business types
export const MINLI_CAMPERDEALER_PROFILE: BusinessProfile = {
  type: 'camperdealer',
  name: 'Minli Caravan World',
  industry: 'Camper & RV Dealership',
  targetAudience: ['camper enthousiasten', 'families', 'avonturiers', 'reizigers'],
  keyServices: ['camper verkoop', 'onderhoud', 'accessoires', 'advies'],
  brandVoice: 'avontuurlijk en betrouwbaar',
  location: 'Landgraaf'
}

export const MINLI_TANKSTATION_PROFILE: BusinessProfile = {
  type: 'tankstation',
  name: 'Minli Tankstations',
  industry: 'Gas Station & Convenience',
  targetAudience: ['forenzen', 'reizigers', 'lokale bewoners', 'chauffeurs'],
  keyServices: ['brandstof', '24/7 service', 'snacks', 'pakketpunten', 'carwash'],
  brandVoice: 'betrouwbaar en gemakkelijk',
  location: 'Zuid-Limburg'
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const openai = getOpenAI()
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional, high-quality image: ${prompt}`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    return response.data?.[0]?.url || ''
  } catch (error) {
    console.error('Error generating image:', error)
    throw new Error('Failed to generate image')
  }
}

export async function generateAndSaveImage(prompt: string, postId: string, orgId: string): Promise<string> {
  try {
    // Generate the image first
    const temporaryUrl = await generateImage(prompt)
    
    if (!temporaryUrl) {
      throw new Error('No image URL returned from generation')
    }

    // Save the image permanently
    const response = await fetch('/api/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: temporaryUrl,
        postId: postId,
        orgId: orgId,
        prompt: prompt
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save image')
    }

    return data.permanentUrl
  } catch (error) {
    console.error('Error generating and saving image:', error)
    throw new Error('Failed to generate and save image')
  }
}

function generateHashtags(prompt: string, platform?: string): string[] {
  const words = prompt.toLowerCase().split(' ')
  const hashtags = words
    .filter(word => word.length > 3)
    .slice(0, 5)
    .map(word => `#${word.replace(/[^a-z0-9]/g, '')}`)
  
  // Add platform-specific hashtags
  if (platform) {
    const platformTags: Record<string, string[]> = {
      twitter: ['#Twitter', '#SocialMedia'],
      linkedin: ['#LinkedIn', '#Professional'],
      instagram: ['#Instagram', '#Visual'],
      facebook: ['#Facebook', '#Community'],
      youtube: ['#YouTube', '#Video'],
    }
    hashtags.push(...(platformTags[platform] || []))
  }
  
  return hashtags.slice(0, 8) // Limit to 8 hashtags
}

function generateSuggestions(content: string): string[] {
  const suggestions = [
    'Add a call-to-action',
    'Include relevant statistics',
    'Add personal anecdotes',
    'Include quotes from experts',
    'Add visual elements',
  ]
  
  return suggestions.slice(0, 3)
}
