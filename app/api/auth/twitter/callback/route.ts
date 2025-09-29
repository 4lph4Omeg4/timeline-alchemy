import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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
      
      // If it's an auth_required error, redirect to signin first
      if (error === 'auth_required') {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?redirectTo=${encodeURIComponent('/dashboard/socials')}`
        )
      }
      
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
      NEXT_PUBLIC_TWITTER_CLIENT_ID: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID ? 'SET' : 'NOT SET',
      TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    })
    
    if (!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      console.error('Missing Twitter API credentials:', {
        NEXT_PUBLIC_TWITTER_CLIENT_ID: !!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
        TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=twitter_creds`
      )
    }

    // Extract code verifier, org_id, and user_id from state parameter
    let codeVerifier: string
    let orgId: string
    let userId: string
    try {
      const stateData = JSON.parse(atob(state || ''))
      codeVerifier = stateData.codeVerifier
      orgId = stateData.org_id
      userId = stateData.user_id
      
      console.log('Twitter OAuth state decoded:', { orgId, userId, hasCodeVerifier: !!codeVerifier })
      
      if (!orgId || !userId) {
        console.error('Missing org_id or user_id in state:', { orgId, userId })
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=invalid_state_data`
        )
      }
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
              `${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
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
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=id,username,name,public_metrics', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    console.log('Twitter user info response status:', userResponse.status)

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('Failed to get Twitter user info:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=user_info_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const userData = await userResponse.json()
    const twitterUserId = userData.data.id
    const twitterUsername = userData.data.username

    // Use org_id from state parameter (no need to authenticate user)
    console.log('Using org_id from state:', orgId)

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Store connection in database
    const accountId = `twitter_${twitterUserId}`
    const accountName = `@${twitterUsername}`
    
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        org_id: orgId,
        platform: 'twitter',
        account_id: accountId,
        account_name: accountName,
        access_token,
        refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
        platform_user_id: twitterUserId,
        platform_username: twitterUsername,
      }, {
        onConflict: 'org_id,platform,account_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=database_error`
      )
    }

    // Redirect directly to socials page with success message
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
