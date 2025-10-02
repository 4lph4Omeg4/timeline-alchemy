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

Create posts for ALL platforms: Facebook, Instagram, Twitter, LinkedIn, Discord, Reddit, Telegram

IMPORTANT OUTPUT FORMAT:
Facebook:
[Post content here]

Instagram:
[Post content here]

Twitter:
[Post content here]

LinkedIn:
[Post content here]

Discord:
[Post content here]

Reddit:
[Post content here]

Telegram:
[Post content here]

Requirements:
- Facebook: Engaging, conversational tone, 2-3 paragraphs (up to 1000 characters), include relevant hashtags
- Instagram: Visual, emoji-rich, 2-3 sentences (up to 500 characters), include 5-10 relevant hashtags
- Twitter: CRITICAL - Must be under 280 characters total, concise and punchy, include 2-3 short hashtags
- LinkedIn: Professional, business-focused, 2-3 paragraphs (up to 1500 characters), include 3-5 relevant hashtags
- Discord: Community-focused, casual, engaging for gaming/tech communities
- Reddit: Discussion-provoking, authentic, community-specific language
- Telegram: Channel-friendly, informative, engaging for community updates, 2-3 sentences with emojis

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
      } else if (trimmedLine.toLowerCase().startsWith('discord:')) {
        currentPlatform = 'discord'
        const content = trimmedLine.substring(8).trim()
        if (content) socialPosts.discord = content
      } else if (trimmedLine.toLowerCase().startsWith('reddit:')) {
        currentPlatform = 'reddit'
        const content = trimmedLine.substring(7).trim()
        if (content) socialPosts.reddit = content
      } else if (trimmedLine.toLowerCase().startsWith('telegram:')) {
        currentPlatform = 'telegram'
        const content = trimmedLine.substring(9).trim()
        if (content) socialPosts.telegram = content
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
    const requiredPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit']
    
    for (const platform of requiredPlatforms) {
      if (!socialPosts[platform]) {
        switch (platform) {
          case 'facebook':
            socialPosts.facebook = `Check out this amazing content: ${title}\n\n${content.substring(0, 800)}...\n\n#Content #Inspiration #AI #Digital #Innovation`
            break
          case 'instagram':
            socialPosts.instagram = `✨ ${title} ✨\n\n${content.substring(0, 400)}...\n\n#AI #Content #Inspiration #Digital #Innovation #Trending`
            break
          case 'twitter':
            const shortContent = content.substring(0, 150).replace(/\n/g, ' ').trim()
            const twitterPost = `${title}\n\n${shortContent}...\n\n#AI #Content`
            socialPosts.twitter = twitterPost.length > 280 ? `${title}\n\n${shortContent.substring(0, 200)}...\n\n#AI` : twitterPost
            break
          case 'linkedin':
            socialPosts.linkedin = `Professional insight: ${title}\n\n${content.substring(0, 1200)}...\n\n#Professional #AI #Content #Business #Innovation #Leadership`
            break
          case 'discord':
            socialPosts.discord = `${title} 🎮\n\n${content.substring(0, 120)}...\n\n#AI #Community #Tech`
            break
          case 'reddit':
            socialPosts.reddit = `${title} 🤖\n\n${content.substring(0, 120)}...\n\n#AI #Discussion #Tech`
            break
        }
      }
    }

    // Post-processing: Ensure Twitter posts are under 280 characters
    if (socialPosts.twitter && socialPosts.twitter.length > 280) {
      // Create a very short Twitter post
      const shortTitle = title.length > 50 ? title.substring(0, 50) + '...' : title
      const shortContent = content.substring(0, 150).replace(/\n/g, ' ').trim()
      const hashtags = '#AI #Content'
      
      // Calculate available space for content
      const availableSpace = 280 - shortTitle.length - hashtags.length - 10 // 10 for spacing
      const finalContent = shortContent.length > availableSpace ? 
        shortContent.substring(0, availableSpace) + '...' : 
        shortContent
      
      socialPosts.twitter = `${shortTitle}\n\n${finalContent}\n\n${hashtags}`
      
      // Final safety check - if still too long, make it even shorter
      if (socialPosts.twitter.length > 280) {
        socialPosts.twitter = `${shortTitle}\n\n${shortContent.substring(0, 100)}...\n\n#AI`
      }
    }

    console.log('Final social posts:', socialPosts) // Debug logging
    return NextResponse.json({ socialPosts })
  } catch (error) {
    console.error('API error generating social posts:', error)
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 })
  }
}
