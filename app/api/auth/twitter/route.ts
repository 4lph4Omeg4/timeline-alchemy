import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      console.error('Missing Twitter API credentials')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=twitter_creds`
      )
    }

    // Generate PKCE code verifier
    const codeVerifier = generateCodeVerifier()

    // Generate PKCE code challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Parse state to get user_id and org_id
    let stateData
    try {
      stateData = JSON.parse(atob(state || ''))
    } catch (error) {
      console.error('Failed to decode state parameter:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=invalid_state`
      )
    }

    // Add code verifier to state
    const enrichedState = btoa(JSON.stringify({
      ...stateData,
      codeVerifier
    }))

    // Build Twitter OAuth URL
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: enrichedState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    const authUrl = `https://twitter.com/i/oauth2/authorize?${authParams.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=oauth_init_failed`
    )
  }
}

// Helper function to generate PKCE code verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

// Helper function to generate PKCE code challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(digest))
}

// Helper function to base64 URL encode
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = Buffer.from(buffer).toString('base64')
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

