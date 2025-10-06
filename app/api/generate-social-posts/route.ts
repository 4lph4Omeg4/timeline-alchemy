import { NextResponse } from 'next/server'
import { generateVercelContent } from '@/lib/vercel-ai'

export async function POST(req: Request) {
  try {
    const { title, content, platforms } = await req.json()

    console.log('🚀 Using Vercel AI Gateway for social posts generation')
    
    // Create a comprehensive prompt for social media generation
    const socialPrompt = `Create engaging, platform-specific social media posts based on this content. Each post must be unique and tailored to its platform.

Title: ${title}

Content: ${content}

Create posts for these platforms:

Facebook: Engaging community post, 2-3 sentences, ask a question or share insight
Instagram: Visual storytelling with emojis, 2-3 sentences, lifestyle-focused
Twitter: Concise and punchy, under 280 characters, trending style
LinkedIn: Professional insight, 2-3 sentences, business value
Discord: Community-focused, casual tone, engaging for discussions
Reddit: Authentic discussion starter, no corporate speak
Telegram: Informative update, 2-3 sentences with emojis

OUTPUT FORMAT:
Facebook:
[Post content]

Instagram:
[Post content]

Twitter:
[Post content]

LinkedIn:
[Post content]

Discord:
[Post content]

Reddit:
[Post content]

Telegram:
[Post content]

Each post should be engaging and platform-appropriate.`

    // Use direct Gateway call for better control
    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
    
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Create COMPLETELY UNIQUE posts for each platform. NEVER repeat the title. NEVER copy article text. Each post must be DIFFERENT and platform-specific.'
          },
          {
            role: 'user',
            content: socialPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1200,
      })
    })

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.statusText}`)
    }

    const data = await response.json()
    const rawResponse = data.choices?.[0]?.message?.content || ''
    
    console.log('Raw social posts response:', rawResponse)
    
    // Parse the response to extract platform-specific posts
    const socialPosts: any = {}
    
    // Split by platform headers
    const sections = rawResponse.split(/(?=Facebook:|Instagram:|Twitter:|LinkedIn:|Discord:|Reddit:|Telegram:)/i)
    
    for (const section of sections) {
      const lines = section.trim().split('\n')
      if (lines.length === 0) continue
      
      const firstLine = lines[0].toLowerCase()
      let platform = ''
      
      if (firstLine.includes('facebook:')) {
        platform = 'facebook'
      } else if (firstLine.includes('instagram:')) {
        platform = 'instagram'
      } else if (firstLine.includes('twitter:')) {
        platform = 'twitter'
      } else if (firstLine.includes('linkedin:')) {
        platform = 'linkedin'
      } else if (firstLine.includes('discord:')) {
        platform = 'discord'
      } else if (firstLine.includes('reddit:')) {
        platform = 'reddit'
      } else if (firstLine.includes('telegram:')) {
        platform = 'telegram'
      }
      
      if (platform) {
        // Get content after the platform header
        const content = lines.slice(1).join('\n').trim()
        if (content && !content.includes('[') && !content.includes(']')) {
          socialPosts[platform] = content
        }
      }
    }

    // Ensure all platforms have content
    const requiredPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit']
    
    for (const platform of requiredPlatforms) {
      if (!socialPosts[platform]) {
        // Create simple fallback content
        switch (platform) {
          case 'facebook':
            socialPosts.facebook = `What do you think about this topic? Share your thoughts below! 💭 #Discussion #Community`
            break
          case 'instagram':
            socialPosts.instagram = `✨ New insights coming your way! ✨ #Inspiration #Growth #Mindset`
            break
          case 'twitter':
            socialPosts.twitter = `Thoughts on this? 🤔 #Discussion #Community`
            break
          case 'linkedin':
            socialPosts.linkedin = `Professional insights worth sharing. What's your take? #Professional #Insights`
            break
          case 'discord':
            socialPosts.discord = `New content alert! 🚨 What do you think? #Community #Discussion`
            break
          case 'reddit':
            socialPosts.reddit = `What's your opinion on this? Let's discuss! #Discussion #Community`
            break
        }
      }
    }

    console.log('Final parsed social posts:', socialPosts)
    return NextResponse.json({ socialPosts })
  } catch (error) {
    console.error('API error generating social posts:', error)
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 })
  }
}
