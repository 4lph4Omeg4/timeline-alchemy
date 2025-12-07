import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Check if we have the required environment variables
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing Facebook API credentials')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=facebook_creds`
      )
    }

    // Build Facebook OAuth URL with current valid scopes
    // NOTE: Only using scopes that don't require app review
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
      state: state || '',
      scope: 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts',
      response_type: 'code',
    })

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${authParams.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Facebook OAuth initiation error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=oauth_init_failed`
    )
  }
}

