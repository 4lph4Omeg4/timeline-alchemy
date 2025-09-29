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
  async postTweet(accessToken: string, refreshToken: string, content: string) {
    try {
      const client = this.createClientWithTokens(accessToken, refreshToken)
      
      // Add hashtags to content
      const hashtags = '#tmline_alchemy #sh4m4ni4k'
      const tweetContent = `${content}\n\n${hashtags}`
      
      const tweet = await client.v2.tweet({
        text: tweetContent,
      })

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
