import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Instagram uses Facebook OAuth
    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
      console.error('Missing Instagram/Facebook API credentials')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=instagram_creds`
      )
    }

    // Build Facebook OAuth URL with Instagram scopes (via Facebook Pages)
    // Instagram posting requires: Facebook Page -> Instagram Business Account connection
    const authParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
      state: state || '',
      scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_comments',
      response_type: 'code',
    })

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${authParams.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Instagram OAuth initiation error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=oauth_init_failed`
    )
  }
}

