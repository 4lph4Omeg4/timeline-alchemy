import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TwitterOAuth, LinkedInOAuth, InstagramOAuth, YouTubeOAuth, DiscordOAuth, RedditOAuth, TelegramOAuth } from '@/lib/social-auth'

export async function POST(request: NextRequest) {
  try {
    const { postId, platforms } = await request.json()
    
    if (!postId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID and platforms array are required' 
      })
    }

    const supabase = supabaseAdmin
    
    // Get the post data
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    // Get social connections for the organization
    const { data: connections, error: connectionsError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('org_id', post.org_id)

    if (connectionsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch social connections' 
      })
    }

    const results = []
    const errors = []

    // Process each platform
    for (const platform of platforms) {
      try {
        const connection = connections.find(conn => conn.platform === platform)
        
        if (!connection) {
          errors.push({
            platform,
            error: `No connection found for ${platform}`
          })
          continue
        }

        let result = null

        // Post to specific platform
        switch (platform) {
          case 'twitter':
            result = await postToTwitter(post, connection)
            break
          case 'linkedin':
            result = await postToLinkedIn(post, connection)
            break
          case 'instagram':
            result = await postToInstagram(post, connection)
            break
          case 'youtube':
            result = await postToYouTube(post, connection)
            break
          case 'discord':
            result = await postToDiscord(post, connection)
            break
          case 'reddit':
            result = await postToReddit(post, connection)
            break
          case 'telegram':
            result = await postToTelegram(post, connection)
            break
          default:
            errors.push({
              platform,
              error: `Unsupported platform: ${platform}`
            })
            continue
        }

        if (result) {
          results.push({
            platform,
            success: true,
            result
          })
        }

      } catch (error) {
        errors.push({
          platform,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update post status
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        published_at: new Date().toISOString(),
        state: errors.length === 0 ? 'published' : 'scheduled'
      })
      .eq('id', postId)

    return NextResponse.json({
      success: true,
      results,
      errors,
      message: `Posted to ${results.length} platforms successfully`
    })

  } catch (error) {
    console.error('Posting engine error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Platform-specific posting functions
async function postToTwitter(post: any, connection: any) {
  const twitter = new TwitterOAuth()
  
  // Get social posts for Twitter
  const socialPosts = post.social_posts?.twitter || post.social_posts?.Twitter
  if (!socialPosts) {
    throw new Error('No Twitter content found')
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: socialPosts
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Twitter API error: ${error.detail || error.message}`)
  }

  return await response.json()
}

async function postToLinkedIn(post: any, connection: any) {
  const linkedin = new LinkedInOAuth()
  
  const socialPosts = post.social_posts?.linkedin || post.social_posts?.LinkedIn
  if (!socialPosts) {
    throw new Error('No LinkedIn content found')
  }

  const response = await fetch('https://api.linkedin.com/v2/shares', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      author: `urn:li:person:${connection.account_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: socialPosts
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`LinkedIn API error: ${error.message}`)
  }

  return await response.json()
}

async function postToInstagram(post: any, connection: any) {
  const instagram = new InstagramOAuth()
  
  const socialPosts = post.social_posts?.instagram || post.social_posts?.Instagram
  if (!socialPosts) {
    throw new Error('No Instagram content found')
  }

  // Instagram requires media, so we'll post as a story or feed post
  const response = await fetch(`https://graph.facebook.com/v18.0/${connection.account_id}/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      caption: socialPosts,
      media_type: 'IMAGE' // Default to image, can be enhanced later
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Instagram API error: ${error.error?.message || error.message}`)
  }

  return await response.json()
}

async function postToYouTube(post: any, connection: any) {
  const youtube = new YouTubeOAuth()
  
  const socialPosts = post.social_posts?.youtube || post.social_posts?.YouTube
  if (!socialPosts) {
    throw new Error('No YouTube content found')
  }

  // YouTube requires video content, so we'll create a community post
  const response = await fetch('https://www.googleapis.com/youtube/v3/activities', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        description: socialPosts
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`YouTube API error: ${error.error?.message || error.message}`)
  }

  return await response.json()
}

async function postToDiscord(post: any, connection: any) {
  const discord = new DiscordOAuth()
  
  const socialPosts = post.social_posts?.discord || post.social_posts?.Discord
  if (!socialPosts) {
    throw new Error('No Discord content found')
  }

  // Discord requires channel ID, we'll need to get this from the connection
  const channelId = connection.account_id // Assuming this is the channel ID
  
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: socialPosts
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Discord API error: ${error.message}`)
  }

  return await response.json()
}

async function postToReddit(post: any, connection: any) {
  const reddit = new RedditOAuth()
  
  const socialPosts = post.social_posts?.reddit || post.social_posts?.Reddit
  if (!socialPosts) {
    throw new Error('No Reddit content found')
  }

  // Reddit requires subreddit, we'll need to get this from the connection
  const subreddit = connection.account_id // Assuming this is the subreddit
  
  const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      kind: 'self',
      title: socialPosts.substring(0, 300), // Reddit title limit
      text: socialPosts,
      sr: subreddit
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Reddit API error: ${error.error || error.message}`)
  }

  return await response.json()
}

async function postToTelegram(post: any, connection: any) {
  const telegram = new TelegramOAuth()
  
  const socialPosts = post.social_posts?.telegram || post.social_posts?.Telegram
  if (!socialPosts) {
    throw new Error('No Telegram content found')
  }

  // Get Telegram channels for this organization
  const supabase = supabaseAdmin
  const { data: channels } = await supabase
    .from('telegram_channels')
    .select('*')
    .eq('org_id', post.org_id)

  if (!channels || channels.length === 0) {
    throw new Error('No Telegram channels found')
  }

  const results = []
  
  // Post to all Telegram channels
  for (const channel of channels) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${channel.bot_token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: channel.channel_id,
          text: socialPosts,
          parse_mode: 'HTML'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Telegram API error: ${error.description}`)
      }

      results.push(await response.json())
    } catch (error) {
      console.error(`Telegram posting error for channel ${channel.channel_name}:`, error)
    }
  }

  return results
}
