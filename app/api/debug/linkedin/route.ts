import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const callbackUrl = `${appUrl}/api/auth/linkedin/callback`

  return NextResponse.json({
    message: 'LinkedIn Debug Info',
    NEXT_PUBLIC_LINKEDIN_CLIENT_ID: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ? `${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID.substring(0, 5)}...` : 'NOT SET',
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    CalculatedCallbackURL: callbackUrl,
    LinkedInOAuthAuthorizeURL: 'https://www.linkedin.com/oauth/v2/authorization',
    LinkedInOAuthTokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    LinkedInUserLookupURL: 'https://api.linkedin.com/v2/people/~',
    RequiredRedirectURI: callbackUrl,
  })
}
