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
            content: `You are a REAL PERSON who just read an amazing blog article and wants to share insights with friends on social media. Write like a human, not a corporate bot.

CRITICAL RULES:
- Write like YOU just discovered something mind-blowing
- Use natural, conversational language
- Share genuine excitement and curiosity
- Be authentic and personal
- Extract REAL insights that made you go "wow"
- Each platform has its own personality - match it
- Include hashtags naturally (not forced)
- End with casual invitation to read more on Facebook

WRITE LIKE A HUMAN WHO JUST LEARNED SOMETHING AMAZING:

Instagram: "Okay this just blew my mind 🤯 I always thought AI would replace creativity but turns out it's actually making us MORE creative? The examples in this article are insane. Swipe up to read the full thing on our Facebook page ✨ #MindBlown #AI #Creativity"

Twitter: "Plot twist: AI isn't killing creativity, it's supercharging it. This article explains how Timeline Alchemy is helping creators make cosmic-level content. Mind = blown 🤯 Full read: [Facebook link] #AI #ContentCreation #PlotTwist"

LinkedIn: "Just read something that completely changed my perspective on AI and content creation. The future isn't human vs AI - it's human + AI collaboration. This article breaks down how conscious creators are scaling authentically. Worth the read: [Facebook page] #ContentStrategy #AI #FutureOfWork"

Discord: "Yo community! Just stumbled on this article about AI content creation and it's actually wild. Turns out we've been thinking about AI all wrong. Check it out on our Facebook page - you won't regret it! #Community #AI #MindBlown"

Reddit: "Interesting read about AI content creation that challenges a lot of assumptions. The author makes some compelling points about human-AI collaboration that I hadn't considered. Full article on our Facebook page if you want to dive deeper into the research."

Telegram: "📢 Just read this fascinating article about AI and creativity. Spoiler: it's not what you think! The insights are pretty mind-blowing. Check out the full analysis on our Facebook page 📢 #AI #Creativity #Insights"

YouTube: "🎥 This article about AI content creation is a game-changer. The examples they share are incredible - it's like AI is becoming a creative partner instead of a replacement. Full breakdown on our Facebook page! 🎥 #AI #ContentCreation #GameChanger"`
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
        // Create better fallback content - extract actual topic from title
        const cleanTitle = title.replace(/^Create a comprehensive blog post about /i, '').replace(/^Timeline Alchemy's revolutionary approach to /i, '').split(',')[0].trim()
        const shortTitle = cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle
        
        switch (platform) {
          case 'facebook':
            socialPosts.facebook = `Discover the revolutionary insights about ${shortTitle}. This comprehensive analysis reveals game-changing perspectives that will transform your understanding. Read the full article for complete details! #TimelineAlchemy #AI #ContentCreation #Insights`
            break
          case 'instagram':
            socialPosts.instagram = `✨ Mind-blowing insights about ${shortTitle}! ✨ This changes everything we thought we knew. Swipe up for the full article on our Facebook page! #TimelineAlchemy #AI #ContentCreation #Mindset #Growth`
            break
          case 'twitter':
            socialPosts.twitter = `Just uncovered something incredible about ${shortTitle}. The implications are bigger than you think. Full analysis: [Facebook link] #TimelineAlchemy #AI #ContentCreation #GameChanger`
            break
          case 'linkedin':
            socialPosts.linkedin = `Professional breakthrough insights on ${shortTitle}. This analysis reveals strategic implications for business leaders and entrepreneurs. Read the complete study on our Facebook page. #TimelineAlchemy #AI #ContentCreation #BusinessStrategy #Leadership`
            break
          case 'discord':
            socialPosts.discord = `Community! Check out these amazing insights about ${shortTitle}. This is exactly what we've been discussing! Full article on our Facebook page. #TimelineAlchemy #AI #ContentCreation #Community`
            break
          case 'reddit':
            socialPosts.reddit = `Interesting analysis on ${shortTitle}. The research reveals some surprising patterns that challenge conventional thinking. Full article available on our Facebook page if you want to dive deeper.`
            break
          case 'telegram':
            socialPosts.telegram = `📢 Exclusive insights about ${shortTitle}! 📢 This comprehensive analysis reveals breakthrough findings. Read the full article on our Facebook page! #TimelineAlchemy #AI #ContentCreation #Exclusive #Insights`
            break
          case 'youtube':
            socialPosts.youtube = `🎥 Deep dive analysis: ${shortTitle} 🎥 This comprehensive study reveals game-changing insights. Full article with detailed analysis on our Facebook page! #TimelineAlchemy #AI #ContentCreation #Analysis #DeepDive`
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
