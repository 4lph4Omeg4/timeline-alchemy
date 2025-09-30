import { NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const { title, content, platforms } = await req.json()

    const openai = getOpenAI()
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a social media expert. Create platform-specific posts based ONLY on the content provided. Do not add unrelated concepts or random terms.`
        },
        {
          role: 'user',
          content: `Create social media posts for this blog content:

Title: ${title}

Content: ${content}

Platforms: ${platforms.join(', ')}

Requirements:
- Facebook: Engaging, conversational tone, 1-2 paragraphs
- Instagram: Visual, emoji-rich, hashtags, 1-2 sentences
- Twitter: Concise, punchy, under 280 characters
- LinkedIn: Professional, business-focused, 1-2 paragraphs
- TikTok: Trendy, engaging, short and punchy

Make each post unique and platform-appropriate.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Parse the response to extract platform-specific posts
    const socialPosts: any = {}
    
    // Simple parsing - look for platform headers
    const lines = response.split('\n')
    let currentPlatform = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.toLowerCase().includes('facebook')) {
        currentPlatform = 'facebook'
      } else if (trimmedLine.toLowerCase().includes('instagram')) {
        currentPlatform = 'instagram'
      } else if (trimmedLine.toLowerCase().includes('twitter')) {
        currentPlatform = 'twitter'
      } else if (trimmedLine.toLowerCase().includes('linkedin')) {
        currentPlatform = 'linkedin'
      } else if (trimmedLine.toLowerCase().includes('tiktok')) {
        currentPlatform = 'tiktok'
      } else if (currentPlatform && trimmedLine && !trimmedLine.includes(':')) {
        if (!socialPosts[currentPlatform]) {
          socialPosts[currentPlatform] = trimmedLine
        } else {
          socialPosts[currentPlatform] += '\n' + trimmedLine
        }
      }
    }

    // Fallback if parsing fails
    if (Object.keys(socialPosts).length === 0) {
      socialPosts.facebook = `Check out this amazing content: ${title}\n\n${content.substring(0, 200)}...`
      socialPosts.instagram = `✨ ${title} ✨\n\n${content.substring(0, 150)}...\n\n#AI #Content #Inspiration`
      socialPosts.twitter = `${title}\n\n${content.substring(0, 100)}...\n\n#AI #Content`
      socialPosts.linkedin = `Professional insight: ${title}\n\n${content.substring(0, 180)}...\n\n#Professional #AI #Content`
      socialPosts.tiktok = `${title} 🚀\n\n${content.substring(0, 120)}...\n\n#AI #Trending #Content`
    }

    return NextResponse.json({ socialPosts })
  } catch (error) {
    console.error('API error generating social posts:', error)
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 })
  }
}
