import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
      console.error('Missing Discord API credentials')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=discord_creds`
      )
    }

    // Build Discord OAuth URL
    const authParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`,
      response_type: 'code',
      scope: 'identify guilds',
      state: state || '',
    })

    const authUrl = `https://discord.com/api/oauth2/authorize?${authParams.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Discord OAuth initiation error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=oauth_init_failed`
    )
  }
}

