import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase client
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

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Get user's organization
    const { data: orgMember } = await supabaseAdmin
      .from('organization_members')
      .select('org_id')
      .eq('user_id', userId)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Get Facebook connection
    const { data: connection } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .eq('platform', 'facebook')
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 })
    }

    // Test 1: Get user info
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${connection.access_token}`
    )
    const meData = await meResponse.json()

    // Test 2: Get permissions
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${connection.access_token}`
    )
    const permissionsData = await permissionsResponse.json()

    // Test 3: Get accounts (pages)
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${connection.access_token}`
    )
    const accountsData = await accountsResponse.json()

    return NextResponse.json({
      success: true,
      connection: {
        platform: connection.platform,
        account_id: connection.account_id,
        account_name: connection.account_name,
        expires_at: connection.expires_at,
        token_preview: connection.access_token.substring(0, 20) + '...'
      },
      facebook_api: {
        user: meData,
        permissions: permissionsData,
        accounts: accountsData
      }
    })

  } catch (error: any) {
    console.error('Error testing Facebook token:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

