import { NextRequest, NextResponse } from 'next/server'
import { DiscordOAuth } from '@/lib/social-auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase admin client
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

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    const errorDescription = searchParams.get('error_description')
    console.error('Discord OAuth error:', error)
    console.error('Error description:', errorDescription)
    console.error('Full search params:', Object.fromEntries(searchParams.entries()))

    const errorMessage = errorDescription
      ? `${error}: ${errorDescription}`
      : error

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=${encodeURIComponent(errorMessage)}`
    )
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

    console.log('Storing Discord connection:', {
      orgId,
      accountId: user.id,
      accountName: user.username || 'Discord Account',
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    })

    // Store the Discord connection using the org_id from state
    const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString() // Discord tokens last ~7 days
    const { error: insertError } = await supabaseAdmin
      .from('social_connections')
      .upsert({
        org_id: orgId,
        platform: 'discord',
        access_token: accessToken,
        refresh_token: refreshToken,
        account_id: user.id,
        account_name: user.username || 'Discord Account',
        account_username: user.username || 'Discord Account',
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,platform,account_id' })

    if (insertError) {
      console.error('Error storing Discord connection:', insertError)
      console.error('Attempted to store:', {
        org_id: orgId,
        platform: 'discord',
        account_id: user.id,
        account_name: user.username || 'Discord Account'
      })
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=storage_failed&details=${encodeURIComponent(insertError.message)}`)
    }

    console.log('Discord connection stored successfully!')

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?success=discord_connected`)
  } catch (error) {
    console.error('Discord callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_failed`)
  }
}
