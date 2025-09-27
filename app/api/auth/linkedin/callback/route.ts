import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('LinkedIn OAuth callback received:', { code: !!code, state, error })

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error)
      console.error('Full search params:', Object.fromEntries(searchParams.entries()))
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      console.error('No authorization code received from LinkedIn')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_code`
      )
    }

    // Check if we have the required environment variables
    console.log('Environment check:', {
      NEXT_PUBLIC_LINKEDIN_CLIENT_ID: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ? 'SET' : 'NOT SET',
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    })
    
    if (!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      console.error('Missing LinkedIn API credentials:', {
        NEXT_PUBLIC_LINKEDIN_CLIENT_ID: !!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
        LINKEDIN_CLIENT_SECRET: !!process.env.LINKEDIN_CLIENT_SECRET
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=missing_credentials&details=linkedin_creds`
      )
    }

    // Exchange code for access token
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
    })

    console.log('Exchanging code for LinkedIn token')

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    })

    console.log('LinkedIn token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('LinkedIn token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, expires_in } = tokenData

    // Get user info from LinkedIn
    const userResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get LinkedIn user info')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=user_info_failed`
      )
    }

    const userData = await userResponse.json()
    const linkedinUserId = userData.id

    // Get the current authenticated user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Supabase authentication error:', userError?.message)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=auth_required`
      )
    }

    // Get the user's organization
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (orgError || !orgMember) {
      console.error('Error getting user organization:', orgError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=no_organization`
      )
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Store connection in database
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        org_id: orgMember.org_id,
        platform: 'linkedin',
        access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,platform'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=database_error`
      )
    }

    // Redirect back to socials page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?success=linkedin_connected&userId=${linkedinUserId}`
    )

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/socials?error=callback_error`
    )
  }
}
