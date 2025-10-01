import { NextRequest, NextResponse } from 'next/server'
import { RedditOAuth } from '@/lib/social-auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Reddit OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=reddit_auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_code`)
  }

  try {
    const redditOAuth = new RedditOAuth()
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reddit/callback`
    
    const { accessToken, refreshToken, user } = await redditOAuth.exchangeCodeForToken(code, callbackUrl)

    // Get the current user from Supabase
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    
    if (!supabaseUser) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=not_authenticated`)
    }

    // Get user's organization
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', supabaseUser.id)
      .single()

    if (!orgMembers) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_organization`)
    }

    // Store the Reddit connection
    const { error: insertError } = await supabase
      .from('social_connections')
      .upsert({
        org_id: orgMembers.org_id,
        platform: 'reddit',
        access_token: accessToken,
        refresh_token: refreshToken,
        platform_user_id: user.id,
        platform_username: user.name,
        platform_data: user,
        connected_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error storing Reddit connection:', insertError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=storage_failed`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?success=reddit_connected`)
  } catch (error) {
    console.error('Reddit callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_failed`)
  }
}
