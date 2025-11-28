import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Server-side Supabase admin client
export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      const errorDescription = searchParams.get('error_description')
      console.error('YouTube OAuth error:', error)
      console.error('Error description:', errorDescription)
      console.error('Full search params:', Object.fromEntries(searchParams.entries()))

      const errorMessage = errorDescription
        ? `${error}: ${errorDescription}`
        : error

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=${encodeURIComponent(errorMessage)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=missing_parameters&details=no_code_or_state`
      )
    }

    // Parse state to get org_id and user_id
    let stateData
    try {
      stateData = JSON.parse(atob(state))
    } catch (e) {
      console.error('Invalid state parameter:', e)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=invalid_state&details=state_parse_error`
      )
    }

    const { org_id: orgId, user_id: userId } = stateData

    if (!orgId || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=missing_org_or_user&details=no_org_id_or_user_id`
      )
    }

    // Check if required environment variables are configured
    const youtubeClientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID
    const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET

    if (!youtubeClientId || !youtubeClientSecret) {
      console.error('YouTube OAuth credentials not configured')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=oauth_not_configured&details=missing_youtube_credentials`
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: youtubeClientId,
        client_secret: youtubeClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/api/auth/youtube/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('YouTube token exchange failed:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token: accessToken, refresh_token: refreshToken, expires_in } = tokenData

    // Get YouTube channel information
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!channelResponse.ok) {
      const errorData = await channelResponse.text()
      console.error('YouTube channel fetch failed:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=channel_fetch_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const channelData = await channelResponse.json()
    const channel = channelData.items?.[0]

    if (!channel) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=no_channel_found&details=no_youtube_channel`
      )
    }

    const accountId = channel.id
    const accountName = channel.snippet?.title || 'YouTube Channel'
    const accountUsername = channel.snippet?.customUrl || `Channel ${channel.id}`
    const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString()

    console.log('Storing YouTube connection:', {
      orgId,
      accountId,
      accountName,
      accountUsername,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    })

    // Store the connection in the database
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        org_id: orgId,
        platform: 'youtube',
        account_id: accountId,
        account_name: accountName,
        account_username: accountUsername,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,platform,account_id' })

    if (dbError) {
      console.error('Database error storing YouTube connection:', dbError)
      console.error('Attempted to store:', {
        org_id: orgId,
        platform: 'youtube',
        account_id: accountId,
        account_name: accountName
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=database_error&details=${encodeURIComponent(dbError.message)}`
      )
    }

    console.log('YouTube connection stored successfully!')

    // Redirect back to socials page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?success=youtube_connected&username=${encodeURIComponent(accountName)}`
    )

  } catch (error) {
    console.error('YouTube OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.timeline-alchemy.nl'}/dashboard/socials?error=unexpected_error&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    )
  }
}
