import { TwitterApi } from 'twitter-api-v2'

// Twitter OAuth helper functions
export class TwitterOAuth {
  private client: TwitterApi

  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID!,
      appSecret: process.env.TWITTER_CLIENT_SECRET!,
    })
  }

  // Generate OAuth URL for user authorization
  generateAuthUrl(callbackUrl: string, state?: string): string {
    const authLink = this.client.generateOAuth2AuthLink(callbackUrl, {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      state: state || Math.random().toString(36).substring(2, 15),
    })

    return authLink.url
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, codeVerifier: string, callbackUrl: string) {
    try {
      const { client: loggedClient, accessToken, refreshToken } = await this.client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackUrl,
      })

      // Get user info
      const user = await loggedClient.v2.me({
        'user.fields': ['id', 'name', 'username', 'profile_image_url'],
      })

      return {
        accessToken,
        refreshToken,
        user: user.data,
        client: loggedClient,
      }
    } catch (error) {
      console.error('Twitter OAuth error:', error)
      throw new Error('Failed to exchange code for token')
    }
  }

  // Create a Twitter client with stored tokens
  createClientWithTokens(accessToken: string, refreshToken?: string) {
    return new TwitterApi({
      appKey: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID!,
      appSecret: process.env.TWITTER_CLIENT_SECRET!,
      accessToken,
      accessSecret: refreshToken || '',
    })
  }

  // Post a tweet
  async postTweet(accessToken: string, content: string, imageUrl?: string) {
    try {
      const client = new TwitterApi(accessToken)

      // Add hashtags to content
      const hashtags = '#tmline_alchemy #sh4m4ni4k'
      const tweetContent = `${content}\n\n${hashtags}`

      let mediaId: string | undefined

      if (imageUrl) {
        try {
          console.log('Downloading image for Twitter:', imageUrl)
          const response = await fetch(imageUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Get content type
            const contentType = response.headers.get('content-type') || 'image/jpeg'

            // Upload media
            console.log('Uploading media to Twitter...')
            mediaId = await client.v1.uploadMedia(buffer, { mimeType: contentType })
            console.log('Media uploaded, ID:', mediaId)
          } else {
            console.error('Failed to download image:', response.statusText)
          }
        } catch (error) {
          console.error('Error uploading media to Twitter:', error)
          // Continue without image if upload fails
        }
      }

      const payload: any = {
        text: tweetContent,
      }

      if (mediaId) {
        payload.media = { media_ids: [mediaId] }
      }

      const tweet = await client.v2.tweet(payload)

      return tweet.data
    } catch (error) {
      console.error('Twitter post error:', error)
      throw new Error('Failed to post tweet')
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string) {
    try {
      const client = this.createClientWithTokens('', refreshToken)
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(refreshToken)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      console.error('Twitter token refresh error:', error)
      throw new Error('Failed to refresh token')
    }
  }
}

// LinkedIn OAuth helper functions
export class LinkedInOAuth {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
  }

  // Generate OAuth URL for user authorization
  generateAuthUrl(callbackUrl: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: callbackUrl,
      scope: 'openid profile w_member_social',
      state: state || Math.random().toString(36).substring(2, 15),
    })

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, callbackUrl: string) {
    try {
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: callbackUrl,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const tokenData = await tokenResponse.json()

      // Get user profile using OpenID Connect userinfo endpoint
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile')
      }

      const profileData = await profileResponse.json()

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        user: profileData,
      }
    } catch (error) {
      console.error('LinkedIn OAuth error:', error)
      throw new Error('Failed to exchange code for token')
    }
  }

  // Post to LinkedIn
  async postToLinkedIn(accessToken: string, content: string) {
    try {
      // Get user's profile to get the person URN using userinfo endpoint
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile')
      }

      const profileData = await profileResponse.json()
      const personUrn = `urn:li:person:${profileData.sub}`

      // Add hashtags to content
      const hashtags = '#TimelineAlchemy #sh4m4ni4k'
      const linkedInContent = `${content}\n\n${hashtags}`

      // Create a text share using the correct API endpoint
      const shareResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: linkedInContent,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      })

      if (!shareResponse.ok) {
        throw new Error('Failed to post to LinkedIn')
      }

      return await shareResponse.json()
    } catch (error) {
      console.error('LinkedIn post error:', error)
      throw new Error('Failed to post to LinkedIn')
    }
  }
}

// Instagram posting through Facebook Pages API
export class InstagramOAuth {
  // Post to Instagram via Facebook Pages API
  async postToInstagram(facebookAccessToken: string, content: string) {
    try {
      // Get Facebook Pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${facebookAccessToken}`)

      if (!pagesResponse.ok) {
        throw new Error('Failed to get Facebook pages')
      }

      const pagesData = await pagesResponse.json()
      const pages = pagesData.data

      if (!pages || pages.length === 0) {
        throw new Error('No Facebook pages found')
      }

      // Find pages with Instagram Business accounts connected
      const instagramPages = []
      for (const page of pages) {
        try {
          const instagramResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`)
          if (instagramResponse.ok) {
            const instagramData = await instagramResponse.json()
            if (instagramData.instagram_business_account) {
              instagramPages.push({
                ...page,
                instagram_account_id: instagramData.instagram_business_account.id
              })
            }
          }
        } catch (error) {
          console.log(`Page ${page.id} has no Instagram Business account`)
        }
      }

      if (instagramPages.length === 0) {
        throw new Error('No Instagram Business accounts found connected to Facebook Pages')
      }

      // Use the first Instagram-enabled page
      const instagramPage = instagramPages[0]
      const hashtags = '#TimelineAlchemy #sh4m4ni4k'
      const instagramContent = `${content}\n\n${hashtags}`

      // Create Instagram media container
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramPage.instagram_account_id}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          image_url: 'https://via.placeholder.com/1080x1080/000000/FFFFFF?text=Timeline+Alchemy', // Placeholder image
          caption: instagramContent,
          access_token: instagramPage.access_token,
        }),
      })

      if (!mediaResponse.ok) {
        throw new Error('Failed to create Instagram media')
      }

      const mediaData = await mediaResponse.json()
      const mediaId = mediaData.id

      // Publish the media
      const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramPage.instagram_account_id}/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          creation_id: mediaId,
          access_token: instagramPage.access_token,
        }),
      })

      if (!publishResponse.ok) {
        throw new Error('Failed to publish to Instagram')
      }

      return await publishResponse.json()
    } catch (error) {
      console.error('Instagram post error:', error)
      throw new Error('Failed to post to Instagram')
    }
  }
}

// Discord OAuth helper functions
export class DiscordOAuth {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET!
  }

  // Generate OAuth URL for user authorization
  generateAuthUrl(callbackUrl: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'identify guilds',
      state: state || Math.random().toString(36).substring(2, 15),
    })

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, callbackUrl: string) {
    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const tokenData = await tokenResponse.json()

      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to get user info')
      }

      const userData = await userResponse.json()

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        user: userData,
      }
    } catch (error) {
      console.error('Discord OAuth error:', error)
      throw new Error('Failed to exchange code for token')
    }
  }

  // Post message to Discord channel (requires bot token for actual posting)
  async postToDiscord(accessToken: string, content: string, channelId?: string) {
    try {
      // For now, we'll simulate a Discord post
      // In a real implementation, you would need a Discord bot token
      // and proper channel permissions
      const hashtags = '#TimelineAlchemy #sh4m4ni4k'
      const discordContent = `${content}\n\n${hashtags}`

      console.log('Discord post content:', discordContent)

      return {
        success: true,
        message: 'Discord post created (simulated)',
        content: discordContent
      }
    } catch (error) {
      console.error('Discord post error:', error)
      throw new Error('Failed to post to Discord')
    }
  }

  // Get user's Discord servers/guilds
  async getUserGuilds(accessToken: string) {
    try {
      const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user guilds')
      }

      return await response.json()
    } catch (error) {
      console.error('Discord guilds error:', error)
      throw new Error('Failed to get Discord guilds')
    }
  }
}

// Reddit OAuth helper functions
export class RedditOAuth {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID!
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET!
  }

  // Generate OAuth URL for user authorization
  generateAuthUrl(callbackUrl: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: state || Math.random().toString(36).substring(2, 15),
      redirect_uri: callbackUrl,
      duration: 'permanent',
      scope: 'identity submit',
    })

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, callbackUrl: string) {
    try {
      // Reddit requires Basic Auth with client credentials
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

      const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'TimelineAlchemy/1.0 by sh4m4ni4k',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const tokenData = await tokenResponse.json()

      // Get user info
      const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'User-Agent': 'TimelineAlchemy/1.0 by sh4m4ni4k',
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to get user info')
      }

      const userData = await userResponse.json()

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        user: userData,
      }
    } catch (error) {
      console.error('Reddit OAuth error:', error)
      throw new Error('Failed to exchange code for token')
    }
  }

  // Post to Reddit
  async postToReddit(accessToken: string, content: string, subreddit: string = 'test') {
    try {
      const hashtags = '#TimelineAlchemy #sh4m4ni4k'
      const redditContent = `${content}\n\n${hashtags}`

      const response = await fetch(`https://oauth.reddit.com/api/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'TimelineAlchemy/1.0 by sh4m4ni4k',
        },
        body: new URLSearchParams({
          kind: 'self',
          sr: subreddit,
          text: redditContent,
          title: 'Timeline Alchemy Content',
          api_type: 'json',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post to Reddit')
      }

      return await response.json()
    } catch (error) {
      console.error('Reddit post error:', error)
      throw new Error('Failed to post to Reddit')
    }
  }

  // Get user's subscribed subreddits
  async getUserSubreddits(accessToken: string) {
    try {
      const response = await fetch('https://oauth.reddit.com/subreddits/mine/subscriber', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'TimelineAlchemy/1.0 by sh4m4ni4k',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user subreddits')
      }

      return await response.json()
    } catch (error) {
      console.error('Reddit subreddits error:', error)
      throw new Error('Failed to get Reddit subreddits')
    }
  }
}

// Telegram Bot API helper functions
export class TelegramOAuth {
  private botToken: string

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN!
  }

  // Get bot information
  async getBotInfo() {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)

      if (!response.ok) {
        throw new Error('Failed to get bot info')
      }

      return await response.json()
    } catch (error) {
      console.error('Telegram bot info error:', error)
      throw new Error('Failed to get Telegram bot info')
    }
  }

  // Get user's channels (requires user to start bot first)
  async getUserChannels(userId: string) {
    try {
      // Note: Telegram doesn't have a direct API to get user's channels
      // Users need to add the bot to their channels manually
      // This is a placeholder for future implementation
      return {
        success: true,
        message: 'User needs to add bot to channels manually',
        channels: []
      }
    } catch (error) {
      console.error('Telegram channels error:', error)
      throw new Error('Failed to get Telegram channels')
    }
  }

  // Send message to Telegram channel
  async sendMessage(chatId: string, content: string, imageUrl?: string) {
    try {
      let messageData: any = {
        chat_id: chatId,
        text: content,
        parse_mode: 'HTML'
      }

      // If there's an image, send as photo with caption
      if (imageUrl) {
        messageData = {
          chat_id: chatId,
          photo: imageUrl,
          caption: content,
          parse_mode: 'HTML'
        }
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Telegram API error: ${errorData.description}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Telegram send message error:', error)
      throw new Error('Failed to send Telegram message')
    }
  }

  // Send photo to Telegram channel
  async sendPhoto(chatId: string, photoUrl: string, caption?: string) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: caption || '',
          parse_mode: 'HTML'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Telegram API error: ${errorData.description}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Telegram send photo error:', error)
      throw new Error('Failed to send Telegram photo')
    }
  }

  // Get webhook info (for future webhook implementation)
  async getWebhookInfo() {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`)

      if (!response.ok) {
        throw new Error('Failed to get webhook info')
      }

      return await response.json()
    } catch (error) {
      console.error('Telegram webhook info error:', error)
      throw new Error('Failed to get Telegram webhook info')
    }
  }
}

// YouTube posting functionality
export class YouTubeOAuth {
  // Post video to YouTube
  async postVideo(accessToken: string, refreshToken: string, title: string, description: string, videoUrl?: string) {
    try {
      const hashtags = '#TimelineAlchemy #sh4m4ni4k'
      const fullDescription = `${description}\n\n${hashtags}`

      // For now, we'll create a placeholder video post
      // In a real implementation, you would upload a video file
      const videoData = {
        snippet: {
          title: title,
          description: fullDescription,
          tags: ['TimelineAlchemy', 'sh4m4ni4k'],
          categoryId: '22', // People & Blogs category
        },
        status: {
          privacyStatus: 'public',
        },
      }

      // This is a placeholder - actual video upload would require file handling
      console.log('YouTube video post data:', videoData)

      return {
        success: true,
        message: 'YouTube video post created (placeholder)',
        videoData
      }
    } catch (error) {
      console.error('YouTube post error:', error)
      throw new Error('Failed to post to YouTube')
    }
  }

  // Get YouTube channel info
  async getChannelInfo(accessToken: string) {
    try {
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get channel info')
      }

      const data = await response.json()
      return data.items?.[0] || null
    } catch (error) {
      console.error('YouTube channel info error:', error)
      throw new Error('Failed to get YouTube channel info')
    }
  }
}
