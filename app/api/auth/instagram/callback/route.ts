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

    console.log('Instagram OAuth callback received:', { code: !!code, state, error })

    // Handle OAuth errors
    if (error) {
      console.error('Instagram OAuth error:', error)
      console.error('Full search params:', Object.fromEntries(searchParams.entries()))
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      console.error('No authorization code received from Instagram')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_code`
      )
    }

    // Check if we have the required environment variables
    console.log('Environment check:', {
      NEXT_PUBLIC_INSTAGRAM_CLIENT_ID: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET',
      INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    })
    
    if (!process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
      console.error('Missing Instagram API credentials:', {
        NEXT_PUBLIC_INSTAGRAM_CLIENT_ID: !!process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID,
        INSTAGRAM_CLIENT_SECRET: !!process.env.INSTAGRAM_CLIENT_SECRET
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=instagram_creds`
      )
    }

    // Extract org_id and user_id from state parameter
    let orgId: string
    let userId: string
    try {
      const stateData = JSON.parse(atob(state || ''))
      orgId = stateData.org_id
      userId = stateData.user_id
      
      console.log('Instagram OAuth state decoded:', { orgId, userId })
      
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

    // Exchange code for access token using Facebook Pages API
    const tokenRequestBody = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
      code,
    })

    console.log('Exchanging code for Facebook Pages API token')

    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    })

    console.log('Instagram token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Instagram token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, user_id } = tokenData

    // Get user info from Instagram
    const userResponse = await fetch(`https://graph.instagram.com/${user_id}?fields=id,username&access_token=${access_token}`)

    console.log('Instagram user info response status:', userResponse.status)

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('Failed to get Instagram user info:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=user_info_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const userData = await userResponse.json()
    const instagramUserId = userData.id
    const instagramUsername = userData.username || `User ${instagramUserId}`

    // Use org_id from state parameter
    console.log('Using org_id from state:', orgId)

    // Calculate token expiration (Instagram tokens typically last 60 days)
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days

    // Store TEMPORARY user connection (needed to fetch Pages and Instagram accounts)
    // This will be replaced by the Instagram Business Account connection after user selects
    const accountId = `facebook_${instagramUserId}` // Facebook user ID for fetching pages
    const accountName = instagramUsername
    
    const { error: dbError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        org_id: orgId,
        platform: 'facebook', // Store as facebook temporarily to fetch pages
        account_id: accountId,
        account_name: accountName,
        account_username: accountName,
        access_token,
        refresh_token: null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,platform,account_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=database_error`
      )
    }

    // Redirect to page selector so user can choose which Instagram Business Account to use
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials/select-page?platform=instagram`
    )

  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_error`
    )
  }
}
