import { NextResponse } from 'next/server'
import { generateVercelContent } from '@/lib/vercel-ai'

export async function POST(req: Request) {
  try {
    const { title, content, platforms } = await req.json()

    // Use Vercel AI Gateway exclusively
    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY
    
    if (!gatewayApiKey) {
      return NextResponse.json(
        { error: 'AI Gateway API key not configured' },
        { status: 500 }
      )
    }
    
    console.log('🚀 Using Vercel AI Gateway for social posts generation')
    
    // Create a comprehensive prompt for social media generation
    const socialPrompt = `Create COMPLETELY UNIQUE social media posts for each platform. Each platform gets a DIFFERENT approach.

Title: ${title}

Content: ${content}

CRITICAL RULES:
- NEVER include the title in any post
- NEVER copy text from the article
- Each post must be COMPLETELY DIFFERENT
- Create engaging hooks and insights
- Use platform-specific language and tone

Facebook: Community discussion starter, ask engaging questions
Instagram: Visual storytelling with emojis, lifestyle angle
Twitter: Punchy one-liner or question, trending style
LinkedIn: Professional insight, business value proposition
Discord: Gaming/tech community discussion starter
Reddit: Authentic community discussion, no corporate speak
Telegram: Informative update with emojis

OUTPUT FORMAT:
Facebook:
[Unique discussion starter here]

Instagram:
[Unique visual story here]

Twitter:
[Unique punchy post here]

LinkedIn:
[Unique professional insight here]

Discord:
[Unique community post here]

Reddit:
[Unique discussion starter here]

Telegram:
[Unique informative update here]

Each post must be ready to publish and completely different.`

    const vercelResponse = await generateVercelContent(socialPrompt, 'social', 'professional')
    
    if (vercelResponse.success && 'socialPosts' in vercelResponse) {
      console.log('✅ Vercel Gateway social posts generation successful')
      return NextResponse.json({ socialPosts: vercelResponse.socialPosts })
    } else {
      throw new Error('Vercel Gateway social posts generation failed')
    }
  } catch (error) {
    console.error('API error generating social posts:', error)
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 })
  }
}
