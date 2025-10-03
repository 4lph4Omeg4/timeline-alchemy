import { supabaseAdmin } from './supabase'

export interface TokenStatus {
  platform: string
  accountId: string
  accountName: string
  isExpired: boolean
  expiresAt?: Date
  lastChecked: Date
  needsRefresh: boolean
}

export interface RefreshResult {
  success: boolean
  newAccessToken?: string
  newRefreshToken?: string
  expiresIn?: number
  error?: string
}

/**
 * Token Manager - Handles automatic token refresh and status monitoring
 */
export class TokenManager {
  /**
   * Check if a token is expired or about to expire
   */
  static async checkTokenStatus(orgId: string): Promise<TokenStatus[]> {
    try {
      const { data: connections, error } = await (supabaseAdmin as any)
        .from('social_connections')
        .select('*')
        .eq('org_id', orgId)

      if (error) {
        console.error('Error fetching connections:', error)
        return []
      }

      const statuses: TokenStatus[] = []

      for (const connection of connections || []) {
        const status = await this.analyzeTokenStatus(connection)
        statuses.push(status)
      }

      return statuses
    } catch (error) {
      console.error('Error checking token status:', error)
      return []
    }
  }

  /**
   * Analyze individual token status
   */
  private static async analyzeTokenStatus(connection: any): Promise<TokenStatus> {
    const now = new Date()
    let isExpired = false
    let needsRefresh = false
    let expiresAt: Date | undefined

    // Check token expiry based on platform
    switch (connection.platform) {
      case 'twitter':
        // Twitter OAuth 1.0a tokens are long-lived and don't expire in the same way
        // They typically last for months, so we don't need to refresh them frequently
        needsRefresh = false
        break

      case 'linkedin':
        // LinkedIn tokens expire in 60 days, refresh if older than 50 days
        const linkedinAge = now.getTime() - new Date(connection.created_at).getTime()
        needsRefresh = linkedinAge > 50 * 24 * 60 * 60 * 1000 // 50 days
        break

      case 'discord':
        // Discord tokens don't expire but can be revoked
        needsRefresh = false
        break

      case 'reddit':
        // Reddit tokens expire in 1 hour
        const redditAge = now.getTime() - new Date(connection.created_at).getTime()
        needsRefresh = redditAge > 45 * 60 * 1000 // 45 minutes
        break

      case 'telegram':
        // Telegram bot tokens don't expire
        needsRefresh = false
        break

      case 'wordpress':
        // WordPress connections use username/password, no token expiry
        needsRefresh = false
        break

      default:
        needsRefresh = false
    }

    return {
      platform: connection.platform,
      accountId: connection.account_id,
      accountName: connection.account_name,
      isExpired,
      expiresAt,
      lastChecked: now,
      needsRefresh
    }
  }

  /**
   * Refresh tokens for a specific platform
   */
  static async refreshToken(orgId: string, platform: string, accountId: string): Promise<RefreshResult> {
    try {
      const { data: connection, error } = await (supabaseAdmin as any)
        .from('social_connections')
        .select('*')
        .eq('org_id', orgId)
        .eq('platform', platform)
        .eq('account_id', accountId)
        .single()

      if (error || !connection) {
        return { success: false, error: 'Connection not found' }
      }

      // Platform-specific refresh logic
      switch (platform) {
        case 'twitter':
          return await this.refreshTwitterToken(connection)
        case 'linkedin':
          return await this.refreshLinkedInToken(connection)
        case 'discord':
          return await this.refreshDiscordToken(connection)
        case 'reddit':
          return await this.refreshRedditToken(connection)
        case 'telegram':
          return await this.refreshTelegramToken(connection)
        case 'wordpress':
          return await this.refreshWordPressToken(connection)
        case 'instagram':
          return await this.refreshInstagramToken(connection)
        default:
          return { success: false, error: 'Platform not supported for refresh' }
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      return { success: false, error: 'Unexpected error during refresh' }
    }
  }

  /**
   * Refresh Twitter token using OAuth 2.0 PKCE
   */
  private static async refreshTwitterToken(connection: any): Promise<RefreshResult> {
    // Twitter OAuth 1.0a tokens don't expire in the traditional sense
    // They are long-lived and don't need frequent refreshing
    // If the token is truly invalid, re-authentication is required
    return { 
      success: true, 
      newAccessToken: connection.access_token,
      error: 'Twitter tokens are long-lived and don\'t require frequent refreshing. If posting fails, please re-authenticate.'
    }
  }

  /**
   * Refresh LinkedIn token
   */
  private static async refreshLinkedInToken(connection: any): Promise<RefreshResult> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        return { success: false, error: `LinkedIn refresh failed: ${errorData}` }
      }

      const data = await response.json()
      
      await this.updateConnectionTokens(connection.org_id, connection.platform, connection.account_id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      })

      return {
        success: true,
        newAccessToken: data.access_token,
        newRefreshToken: data.refresh_token,
        expiresIn: data.expires_in
      }
    } catch (error) {
      return { success: false, error: `LinkedIn refresh error: ${error}` }
    }
  }

  /**
   * Discord tokens don't expire, but we can verify they're still valid
   */
  private static async refreshDiscordToken(connection: any): Promise<RefreshResult> {
    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`
        }
      })

      if (!response.ok) {
        return { success: false, error: 'Discord token is invalid' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Discord verification error: ${error}` }
    }
  }

  /**
   * Refresh Reddit token
   */
  private static async refreshRedditToken(connection: any): Promise<RefreshResult> {
    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        return { success: false, error: `Reddit refresh failed: ${errorData}` }
      }

      const data = await response.json()
      
      await this.updateConnectionTokens(connection.org_id, connection.platform, connection.account_id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      })

      return {
        success: true,
        newAccessToken: data.access_token,
        newRefreshToken: data.refresh_token,
        expiresIn: data.expires_in
      }
    } catch (error) {
      return { success: false, error: `Reddit refresh error: ${error}` }
    }
  }

  /**
   * Refresh Telegram token - Bot tokens don't expire
   */
  private static async refreshTelegramToken(connection: any): Promise<RefreshResult> {
    // Telegram bot tokens don't expire and don't need refreshing
    // If the bot is inactive, re-authentication is required
    return { 
      success: true, 
      newAccessToken: connection.access_token,
      error: 'Telegram bot tokens don\'t expire. If posting fails, please check bot permissions and re-authenticate.'
    }
  }

  /**
   * Refresh WordPress token - Uses username/password authentication
   */
  private static async refreshWordPressToken(connection: any): Promise<RefreshResult> {
    // WordPress connections use username/password, not tokens
    // No refresh needed, credentials are stored securely
    return { 
      success: true, 
      newAccessToken: connection.access_token, // This would be the stored credentials
      error: 'WordPress uses username/password authentication. No token refresh needed.'
    }
  }

  /**
   * Refresh Instagram token - Instagram tokens are long-lived
   */
  private static async refreshInstagramToken(connection: any): Promise<RefreshResult> {
    // Instagram tokens are long-lived and don't expire frequently
    // If posting fails, re-authentication might be required
    return { 
      success: true, 
      newAccessToken: connection.access_token,
      error: 'Instagram tokens are long-lived. If posting fails, please re-authenticate.'
    }
  }

  /**
   * Update connection tokens in database
   */
  private static async updateConnectionTokens(
    orgId: string, 
    platform: string, 
    accountId: string, 
    tokens: { access_token: string; refresh_token?: string; expires_in?: number }
  ): Promise<void> {
    try {
      const updateData: any = {
        access_token: tokens.access_token,
        updated_at: new Date().toISOString()
      }

      if (tokens.refresh_token) {
        updateData.refresh_token = tokens.refresh_token
      }

      const { error } = await (supabaseAdmin as any)
        .from('social_connections')
        .update(updateData)
        .eq('org_id', orgId)
        .eq('platform', platform)
        .eq('account_id', accountId)

      if (error) {
        console.error('Error updating connection tokens:', error)
      }
    } catch (error) {
      console.error('Error updating connection tokens:', error)
    }
  }

  /**
   * Get fresh token for posting (with automatic refresh)
   */
  static async getFreshToken(orgId: string, platform: string, accountId: string): Promise<string | null> {
    try {
      const statuses = await this.checkTokenStatus(orgId)
      const status = statuses.find(s => s.platform === platform && s.accountId === accountId)

      if (!status) {
        return null
      }

      // If token needs refresh, try to refresh it
      if (status.needsRefresh) {
        const refreshResult = await this.refreshToken(orgId, platform, accountId)
        if (refreshResult.success && refreshResult.newAccessToken) {
          return refreshResult.newAccessToken
        }
      }

      // Get the current token
      const { data: connection, error } = await (supabaseAdmin as any)
        .from('social_connections')
        .select('access_token')
        .eq('org_id', orgId)
        .eq('platform', platform)
        .eq('account_id', accountId)
        .single()

      if (error || !connection) {
        return null
      }

      return connection.access_token
    } catch (error) {
      console.error('Error getting fresh token:', error)
      return null
    }
  }
}
