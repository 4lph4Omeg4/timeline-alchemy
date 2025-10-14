import { NextResponse } from 'next/server'
import { generateVercelContent } from '@/lib/vercel-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for social posts generation

export async function POST(req: Request) {
  try {
    const { title, content, platforms } = await req.json()

    console.log('🚀 Using Vercel AI Gateway for social posts generation')
    
    // Create a comprehensive prompt for social media generation
    const socialPrompt = `Create engaging, platform-specific social media posts that drive traffic to our Facebook page. Each post MUST be unique, valuable, and create curiosity.

Blog Title: ${title}

Blog Content Summary: ${content.substring(0, 500)}...

CRITICAL REQUIREMENTS:
- Each post MUST provide VALUE first, then drive to Facebook
- Include relevant hashtags for each platform (3-6 per post)
- Create UNIQUE, engaging content - NEVER generic "thoughts on this?"
- Extract specific insights from the blog content
- Make readers want to follow our Facebook page for more

Create posts for these platforms:

Facebook: 
- Full blog post content (this is the main destination)
- Complete article with all insights
- Professional yet engaging tone
- 4-6 relevant hashtags
- Include call-to-action for engagement

Instagram:
- Visual hook with key insight from blog
- 2-3 sentences with emojis
- Lifestyle/spiritual angle
- 5-6 relevant hashtags
- End with "Read the full article on our Facebook page"

Twitter:
- Punchy insight from the blog
- Under 250 characters
- 3-4 relevant hashtags
- End with "Full article: [Facebook page link]"

LinkedIn:
- Professional insight highlighting business value
- 2-3 sentences
- 4-5 professional hashtags
- End with "Read the complete analysis on our Facebook page"

Discord:
- Community-focused insight
- Casual, friendly tone
- "Check this out..." style
- End with "Full article on our Facebook page"

Reddit:
- Authentic discussion starter
- Share key insight without corporate speak
- No hashtags (Reddit doesn't use them)
- End with "Full article available on our Facebook page"

Telegram:
- Newsletter-style insight with emojis
- 2-3 sentences
- 4-5 relevant hashtags
- End with "Read more on our Facebook page"

YouTube:
- Video-style hook about the topic
- 2-3 sentences
- 4-5 relevant hashtags
- End with "Full article on our Facebook page"

OUTPUT FORMAT (EXACTLY AS SHOWN):
Facebook:
[Complete blog post content with hashtags]

Instagram:
[Post content with hashtags]

Twitter:
[Post content with hashtags]

LinkedIn:
[Post content with hashtags]

Discord:
[Post content]

Reddit:
[Post content]

Telegram:
[Post content with hashtags]

YouTube:
[Post content with hashtags]`

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
    const sections = rawResponse.split(/(?=Facebook:|Instagram:|Twitter:|LinkedIn:|Discord:|Reddit:|Telegram:|YouTube:)/i)
    
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
      } else if (firstLine.includes('youtube:')) {
        platform = 'youtube'
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
    const requiredPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit', 'telegram', 'youtube']
    
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
          case 'telegram':
            socialPosts.telegram = `📢 New insights coming your way! 📢 #Newsletter #Updates #TimelineAlchemy`
            break
          case 'youtube':
            socialPosts.youtube = `🎥 New video content about this topic! 🎥 #YouTube #ContentCreation #Video`
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
