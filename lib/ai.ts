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

  // Simple content foundation
  const CONTENT_FOUNDATION = `You are a professional content writer. Write exactly what the user requests in a clear, engaging way.

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

// Business-specific prompt configurations
const BUSINESS_PROMPTS: Record<BusinessType, {
  systemPrompt: string
  keywords: string[]
  hashtags: string[]
  tone: string
  adaptation: string
}> = {
  camperdealer: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on adventure, freedom, travel, family memories, and the camper lifestyle. Let the natural unity of family adventures and shared experiences emerge organically.`,
    keywords: ['camper', 'RV', 'caravan', 'reizen', 'avontuur', 'vrijheid', 'familie', 'vakantie', 'outdoor'],
    hashtags: ['#camper', '#RV', '#reizen', '#avontuur', '#vrijheid', '#familie', '#vakantie'],
    tone: 'adventurous and authentic',
    adaptation: 'Focus on the practical benefits and experiences of camper travel'
  },
  tankstation: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on convenience, 24/7 service, fuel efficiency, local community, and quick stops. Let the natural interconnectedness of community service emerge naturally.`,
    keywords: ['tankstation', 'benzine', 'diesel', '24/7', 'gemak', 'lokale service', 'onderweg', 'snack'],
    hashtags: ['#tankstation', '#24/7', '#gemak', '#lokale service', '#onderweg'],
    tone: 'convenient and reliable',
    adaptation: 'Focus on practical service benefits and community value'
  },
  restaurant: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on food quality, atmosphere, local ingredients, customer experience, and culinary expertise. Let the natural unity of shared meals and community emerge organically.`,
    keywords: ['restaurant', 'eten', 'culinair', 'lokaal', 'kwaliteit', 'atmosfeer', 'gastvrijheid'],
    hashtags: ['#restaurant', '#eten', '#culinair', '#lokaal', '#kwaliteit'],
    tone: 'warm and authentic',
    adaptation: 'Focus on culinary excellence and customer experience'
  },
  retail: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on product quality, customer service, shopping experience, and value.`,
    keywords: ['winkel', 'producten', 'kwaliteit', 'klantenservice', 'shopping', 'waarde'],
    hashtags: ['#winkel', '#producten', '#kwaliteit', '#shopping'],
    tone: 'helpful and value-focused',
    adaptation: 'Focus on product value and customer satisfaction'
  },
  service: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on expertise, reliability, customer satisfaction, and professional service.`,
    keywords: ['service', 'expertise', 'betrouwbaar', 'professioneel', 'kwaliteit', 'klanttevredenheid'],
    hashtags: ['#service', '#expertise', '#betrouwbaar', '#professioneel'],
    tone: 'professional and trustworthy',
    adaptation: 'Focus on service quality and customer satisfaction'
  },
  hospitality: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on comfort, guest experience, amenities, and memorable stays.`,
    keywords: ['hotel', 'accommodatie', 'gastvrijheid', 'comfort', 'ervaring', 'faciliteiten'],
    hashtags: ['#hotel', '#accommodatie', '#gastvrijheid', '#comfort'],
    tone: 'welcoming and comfortable',
    adaptation: 'Focus on guest comfort and memorable experiences'
  },
  automotive: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on reliability, performance, safety, and customer service.`,
    keywords: ['auto', 'garage', 'onderhoud', 'betrouwbaar', 'veiligheid', 'prestaties'],
    hashtags: ['#auto', '#garage', '#onderhoud', '#betrouwbaar'],
    tone: 'reliable and expert',
    adaptation: 'Focus on vehicle reliability and customer service'
  },
  general: {
    systemPrompt: `${CONTENT_FOUNDATION} Focus on value, customer service, and quality. Let the natural interconnectedness of business relationships emerge authentically.`,
    keywords: ['kwaliteit', 'service', 'klanttevredenheid', 'waarde'],
    hashtags: ['#kwaliteit', '#service', '#klanttevredenheid'],
    tone: 'professional and helpful',
    adaptation: 'Focus on business value and customer satisfaction'
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

  // Create simple system prompt without business-specific configurations
  const systemPrompt = `${CONTENT_FOUNDATION}
  
Write in a ${tone} tone. Create content that is ${length} in length.
Focus on the specific topic requested without adding unrelated business concepts.`

  // Create unified user prompt
  const userPrompt = type === 'blog' 
    ? `Create a professional blog post about: ${prompt}

       IMPORTANT OUTPUT FORMAT:
       - Start with a clear, engaging title (no "Title:" label, just the title)
       - Follow with the content in clean paragraphs
       - Write MINIMUM 3 paragraphs with proper spacing
       - Each paragraph should be 3-5 sentences
       - Leave ONE EMPTY LINE between each paragraph
       - End with a strong conclusion
       - Make it ready to copy and paste directly into any platform
       - NO formatting markers, NO labels, NO prefixes
       - DO NOT repeat any content - each paragraph should be unique
       - DO NOT duplicate the first paragraph at the end`
    : `Create a social media post about: ${prompt}

IMPORTANT OUTPUT FORMAT:
- Start directly with the post content, NO labels like "Title:", "Post:", etc.
- Write engaging, platform-appropriate content
- Include relevant hashtags naturally
- Make it ready to copy and paste directly into ${platform || 'the platform'}
- NO formatting markers, NO labels, NO prefixes
- Keep it concise and engaging`

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
      // Improved content parsing for blog posts
      const lines = content.split('\n').filter(line => line.trim())
      
      // Find title (first non-empty line, should be the title)
      let title = 'Untitled'
      let contentStartIndex = 0
      
      if (lines.length > 0) {
        // First line is the title
        title = lines[0].trim()
        contentStartIndex = 1
      }
      
      // Extract content (everything after title)
      const contentLines = lines.slice(contentStartIndex)
      let blogContent = contentLines.join('\n').trim()
      
      // Ensure proper paragraph spacing
      blogContent = blogContent
        .replace(/\n{2,}/g, '\n\n') // Ensure double line breaks between paragraphs
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      
      // Clean up formatting and remove all labels while preserving paragraph structure
      blogContent = blogContent
        .replace(/\n{3,}/g, '\n\n') // Keep max 2 line breaks between paragraphs
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
        .replace(/^#+\s*/gm, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/`(.*?)`/g, '$1') // Remove code markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
        .replace(/^[-*]\s*/gm, '') // Remove bullet points
        .replace(/^(Title|Introduction|Content|Conclusion|Summary|Excerpt):\s*/gim, '') // Remove common labels
        .replace(/^(Titel|Introductie|Inhoud|Conclusie|Samenvatting|Uittreksel):\s*/gim, '') // Remove Dutch labels
        .replace(/([.!?])\s*([A-Z][a-z])/g, '$1\n\n$2') // Ensure paragraph breaks after sentences
        .replace(/\n{3,}/g, '\n\n') // Clean up excessive line breaks
        .trim()
      
      // Generate excerpt (first 150 characters of content)
      const excerpt = blogContent.substring(0, 150).replace(/\n/g, ' ').trim() + '...'
      
      return {
        content: blogContent,
        title,
        excerpt,
        hashtags: undefined,
        suggestions: generateSuggestions(blogContent),
      }
    } else {
      // For social posts, clean up formatting and remove labels
      const cleanedContent = content
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/^#+\s*/gm, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/`(.*?)`/g, '$1') // Remove code markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/^(Title|Introduction|Content|Conclusion|Summary|Excerpt):\s*/gim, '') // Remove common labels
        .replace(/^(Titel|Introductie|Inhoud|Conclusie|Samenvatting|Uittreksel):\s*/gim, '') // Remove Dutch labels
        .trim()
      
      return {
        content: cleanedContent,
        hashtags: generateHashtags(prompt, platform),
        suggestions: generateSuggestions(cleanedContent),
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
    const imagePrompt = `Professional, high-quality image that represents: ${prompt}. Modern, clean, inspiring, abstract concept, no text, no words, no letters, visual metaphor, artistic, minimalist design`
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
  targetAudience: ['camper enthousiasten', 'families', 'avonturiers', 'reizigers', 'natuurliefhebbers'],
  keyServices: ['camper verkoop', 'onderhoud', 'accessoires', 'advies', 'reizen naar eenheid'],
  brandVoice: 'avontuurlijk en verbindend',
  location: 'Landgraaf'
}

export const MINLI_TANKSTATION_PROFILE: BusinessProfile = {
  type: 'tankstation',
  name: 'Minli Tankstations',
  industry: 'Gas Station & Convenience',
  targetAudience: ['forenzen', 'reizigers', 'lokale bewoners', 'chauffeurs', 'gemeenschapsleden'],
  keyServices: ['brandstof', '24/7 service', 'snacks', 'pakketpunten', 'carwash', 'verbinding'],
  brandVoice: 'betrouwbaar en verbindend',
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
