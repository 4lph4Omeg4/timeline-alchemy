import OpenAI from 'openai'
import { AIGenerateRequest, AIGenerateResponse } from '@/types/index'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  const { prompt, type, tone = 'professional', length = 'medium', platform } = request

  let systemPrompt = ''
  let userPrompt = ''

  if (type === 'blog') {
    systemPrompt = `You are a professional content writer specializing in creating engaging blog posts. 
    Write in a ${tone} tone. Create content that is ${length} in length.`
    
    userPrompt = `Write a blog post about: ${prompt}`
  } else {
    const platformSpecific = platform ? ` for ${platform}` : ''
    systemPrompt = `You are a social media expert creating engaging posts${platformSpecific}. 
    Write in a ${tone} tone. Keep it ${length} and engaging.`
    
    userPrompt = `Create a social media post about: ${prompt}`
  }

  try {
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
        suggestions: generateSuggestions(content),
      }
    } else {
      // For social posts, generate hashtags
      const hashtags = generateHashtags(prompt, platform)
      
      return {
        content,
        hashtags,
        suggestions: generateSuggestions(content),
      }
    }
  } catch (error) {
    console.error('Error generating content:', error)
    throw new Error('Failed to generate content')
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
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

function generateHashtags(prompt: string, platform?: string): string[] {
  const words = prompt.toLowerCase().split(' ')
  const hashtags = words
    .filter(word => word.length > 3)
    .slice(0, 5)
    .map(word => `#${word.replace(/[^a-z0-9]/g, '')}`)
  
  // Add platform-specific hashtags
  if (platform) {
    const platformTags = {
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
