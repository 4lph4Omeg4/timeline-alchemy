import { NextRequest, NextResponse } from 'next/server'
import { DiscordOAuth } from '@/lib/social-auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Discord OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=discord_auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_code`)
  }

  try {
    // Parse state to get user info
    let stateData
    try {
      stateData = JSON.parse(atob(state || ''))
    } catch (e) {
      console.error('Invalid state parameter:', e)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=invalid_state`)
    }

    const discordOAuth = new DiscordOAuth()
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`
    
    const { accessToken, refreshToken, user } = await discordOAuth.exchangeCodeForToken(code, callbackUrl)

    // Use the user ID from state instead of trying to get current user
    const userId = stateData.user_id
    const orgId = stateData.org_id

    if (!userId || !orgId) {
      console.error('Missing user_id or org_id in state')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_user_info`)
    }

    // Store the Discord connection using the org_id from state
    const { error: insertError } = await supabase
      .from('social_connections')
      .upsert({
        org_id: orgId,
        platform: 'discord',
        access_token: accessToken,
        refresh_token: refreshToken,
        platform_user_id: user.id,
        platform_username: user.username,
        platform_data: user,
        connected_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error storing Discord connection:', insertError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=storage_failed`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?success=discord_connected`)
  } catch (error) {
    console.error('Discord callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_failed`)
  }
}
