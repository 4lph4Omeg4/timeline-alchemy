import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      console.error('Missing Reddit API credentials')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=reddit_creds`
      )
    }

    // Build Reddit OAuth URL
    const authParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID,
      response_type: 'code',
      state: state || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reddit/callback`,
      duration: 'permanent',
      scope: 'identity submit',
    })

    const authUrl = `https://www.reddit.com/api/v1/authorize?${authParams.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Reddit OAuth initiation error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=oauth_init_failed`
    )
  }
}

