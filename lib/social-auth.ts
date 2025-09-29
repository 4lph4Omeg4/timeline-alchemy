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
      
      const tweet = await client.v2.tweet({
        text: content,
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

      // Create a text share
      const shareResponse = await fetch('https://api.linkedin.com/v2/shares', {
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
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
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
