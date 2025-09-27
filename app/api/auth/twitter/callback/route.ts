import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('Twitter OAuth callback received:', { code: !!code, state, error })

    // Handle OAuth errors
    if (error) {
      console.error('Twitter OAuth error:', error)
      console.error('Full search params:', Object.fromEntries(searchParams.entries()))
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      console.error('No authorization code received from Twitter')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_code`
      )
    }

    // Check if we have the required environment variables
    console.log('Environment check:', {
      TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? 'SET' : 'NOT SET',
      TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    })
    
    if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      console.error('Missing Twitter API credentials:', {
        TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
        TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=twitter_creds`
      )
    }

    // Extract code verifier from state parameter
    let codeVerifier: string
    try {
      const stateData = JSON.parse(atob(state || ''))
      codeVerifier = stateData.codeVerifier
    } catch (error) {
      console.error('Failed to decode state parameter:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=invalid_state`
      )
    }
    
    // Exchange code for access token
    const tokenRequestBody = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
      code_verifier: codeVerifier,
    })

    console.log('Exchanging code for token with body:', tokenRequestBody.toString())

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: tokenRequestBody,
    })

    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get user info')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=user_info_failed`
      )
    }

    const userData = await userResponse.json()
    const twitterUserId = userData.data.id
    const twitterUsername = userData.data.username

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Store connection in database
    // Note: You'll need to get the current user's org_id from session
    // For now, using a placeholder - you'll need to implement proper session handling
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        org_id: 'placeholder-org-id', // TODO: Get from user session
        platform: 'twitter',
        access_token,
        refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,platform'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=database_error`
      )
    }

    // Redirect back to socials page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?success=twitter_connected&username=${twitterUsername}`
    )

  } catch (error) {
    console.error('Twitter OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_error`
    )
  }
}
