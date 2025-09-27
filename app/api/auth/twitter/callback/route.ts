import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Twitter OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_code`
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
        code_verifier: 'challenge', // In production, store this in session/state
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=token_exchange_failed`
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
