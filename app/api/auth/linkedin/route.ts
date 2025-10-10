import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      console.error('Missing LinkedIn API credentials')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=linkedin_creds`
      )
    }

    // Build LinkedIn OAuth URL
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
      scope: 'openid profile w_member_social',
      state: state || '',
    })

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${authParams.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=oauth_init_failed`
    )
  }
}

