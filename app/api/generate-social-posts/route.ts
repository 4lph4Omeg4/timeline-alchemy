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

Create posts for ALL platforms: Facebook, Instagram, Twitter, LinkedIn, TikTok

IMPORTANT OUTPUT FORMAT:
Facebook:
[Post content here]

Instagram:
[Post content here]

Twitter:
[Post content here]

LinkedIn:
[Post content here]

TikTok:
[Post content here]

Requirements:
- Facebook: Engaging, conversational tone, 1-2 paragraphs, include relevant hashtags
- Instagram: Visual, emoji-rich, 1-2 sentences, include 5-10 relevant hashtags
- Twitter: Concise, punchy, under 280 characters, include 2-3 relevant hashtags
- LinkedIn: Professional, business-focused, 1-2 paragraphs, include 3-5 relevant hashtags
- TikTok: Trendy, engaging, short and punchy, include 3-5 trending hashtags

CRITICAL: Each post must be ready to copy-paste and publish immediately. Include relevant hashtags for each platform. Make content engaging and platform-specific.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || ''
    console.log('Raw social posts response:', response) // Debug logging
    
    // Parse the response to extract platform-specific posts
    const socialPosts: any = {}
    
    // Better parsing - look for platform headers with colon
    const lines = response.split('\n')
    let currentPlatform = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for platform headers
      if (trimmedLine.toLowerCase().startsWith('facebook:')) {
        currentPlatform = 'facebook'
        const content = trimmedLine.substring(9).trim()
        if (content) socialPosts.facebook = content
      } else if (trimmedLine.toLowerCase().startsWith('instagram:')) {
        currentPlatform = 'instagram'
        const content = trimmedLine.substring(10).trim()
        if (content) socialPosts.instagram = content
      } else if (trimmedLine.toLowerCase().startsWith('twitter:')) {
        currentPlatform = 'twitter'
        const content = trimmedLine.substring(8).trim()
        if (content) socialPosts.twitter = content
      } else if (trimmedLine.toLowerCase().startsWith('linkedin:')) {
        currentPlatform = 'linkedin'
        const content = trimmedLine.substring(10).trim()
        if (content) socialPosts.linkedin = content
      } else if (trimmedLine.toLowerCase().startsWith('tiktok:')) {
        currentPlatform = 'tiktok'
        const content = trimmedLine.substring(7).trim()
        if (content) socialPosts.tiktok = content
      } else if (currentPlatform && trimmedLine && !trimmedLine.includes(':')) {
        // Add content to current platform
        if (!socialPosts[currentPlatform]) {
          socialPosts[currentPlatform] = trimmedLine
        } else {
          socialPosts[currentPlatform] += '\n' + trimmedLine
        }
      }
    }

    // Ensure all platforms have content - fill missing ones
    const requiredPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
    
    for (const platform of requiredPlatforms) {
      if (!socialPosts[platform]) {
        switch (platform) {
          case 'facebook':
            socialPosts.facebook = `Check out this amazing content: ${title}\n\n${content.substring(0, 200)}...\n\n#Content #Inspiration #AI`
            break
          case 'instagram':
            socialPosts.instagram = `✨ ${title} ✨\n\n${content.substring(0, 150)}...\n\n#AI #Content #Inspiration #Digital #Innovation`
            break
          case 'twitter':
            socialPosts.twitter = `${title}\n\n${content.substring(0, 100)}...\n\n#AI #Content #Tech`
            break
          case 'linkedin':
            socialPosts.linkedin = `Professional insight: ${title}\n\n${content.substring(0, 180)}...\n\n#Professional #AI #Content #Business`
            break
          case 'tiktok':
            socialPosts.tiktok = `${title} 🚀\n\n${content.substring(0, 120)}...\n\n#AI #Trending #Content #Viral`
            break
        }
      }
    }

    console.log('Final social posts:', socialPosts) // Debug logging
    return NextResponse.json({ socialPosts })
  } catch (error) {
    console.error('API error generating social posts:', error)
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 })
  }
}
