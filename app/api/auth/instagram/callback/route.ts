import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase client
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
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET

    console.log('Environment check:', {
      NEXT_PUBLIC_FACEBOOK_APP_ID: clientId ? 'SET' : 'NOT SET',
      FACEBOOK_APP_SECRET: clientSecret ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    })

    if (!clientId || !clientSecret) {
      console.error('Missing Facebook API credentials:', {
        NEXT_PUBLIC_FACEBOOK_APP_ID: !!clientId,
        FACEBOOK_APP_SECRET: !!clientSecret
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=facebook_creds`
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
      client_id: clientId,
      client_secret: clientSecret,
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

    // Get user info from Facebook (since we use Facebook Login)
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${access_token}`)

    console.log('Facebook user info response status:', userResponse.status)

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('Failed to get Facebook user info:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=user_info_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const userData = await userResponse.json()
    const facebookUserId = userData.id
    const facebookUsername = userData.name || `User ${facebookUserId}`

    // Use org_id from state parameter
    console.log('Using org_id from state:', orgId)

    // Calculate token expiration (Instagram tokens typically last 60 days)
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days

    // Store TEMPORARY user connection (needed to fetch Pages and Instagram accounts)
    // This will be replaced by the Instagram Business Account connection after user selects
    const accountId = `facebook_${facebookUserId}` // Facebook user ID for fetching pages
    const accountName = facebookUsername

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

    // Try to fetch user's pages with Instagram accounts and auto-select first one
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username}&access_token=${access_token}`
      )

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()

        console.log('📷 Found', pagesData.data?.length || 0, 'pages')

        // Filter for pages with Instagram Business Account
        const instagramPages = pagesData.data?.filter((page: any) => page.instagram_business_account) || []

        console.log('📷 Found', instagramPages.length, 'pages with Instagram')

        if (instagramPages.length > 0) {
          // Use first Instagram-connected page
          const firstPage = instagramPages[0]
          const igAccount = firstPage.instagram_business_account

          console.log('✅ Auto-selecting Instagram:', igAccount.username)

          // Store Instagram Business Account connection
          await supabaseAdmin
            .from('social_connections')
            .upsert({
              org_id: orgId,
              platform: 'instagram',
              account_id: `instagram_${igAccount.id}`,
              account_name: igAccount.username,
              account_username: igAccount.username,
              access_token: firstPage.access_token, // Page token for posting
              refresh_token: null,
              expires_at: null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'org_id,platform,account_id'
            })

          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?success=instagram_connected&username=${encodeURIComponent(igAccount.username)}`
          )
        } else {
          // No Instagram accounts found
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_instagram_accounts`
          )
        }
      }
    } catch (error) {
      console.error('❌ Failed to auto-fetch Instagram accounts:', error)
      // Redirect to socials with error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=failed_to_fetch_instagram&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
      )
    }

    // Fallback: No Instagram pages found
    console.warn('⚠️ No Instagram Business Accounts found for user')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_instagram_accounts&details=no_instagram_business_accounts_connected`
    )

  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_error`
    )
  }
}
