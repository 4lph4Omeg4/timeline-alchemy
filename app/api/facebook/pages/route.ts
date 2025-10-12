import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Get user_id from query params (passed from frontend)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user_id' },
        { status: 400 }
      )
    }
    
    // Get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: orgMember } = await supabaseAdmin
      .from('organization_members')
      .select('org_id')
      .eq('user_id', userId)
      .single()

    if (!orgMember) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    // Get Facebook connection (temporary user token)
    const { data: connection } = await supabaseAdmin
      .from('social_connections')
      .select('access_token, platform')
      .eq('org_id', orgMember.org_id)
      .eq('platform', 'facebook')
      .single()

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'No Facebook connection found. Please connect Facebook first.' },
        { status: 404 }
      )
    }

    // Fetch user's Facebook Pages
    console.log('🔍 Fetching Facebook Pages for org:', orgMember.org_id)
    console.log('🔑 Using access token (first 20 chars):', connection.access_token.substring(0, 20) + '...')
    
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username}&access_token=${connection.access_token}`
    )

    console.log('📘 Facebook Pages API response status:', pagesResponse.status)

    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json()
      console.error('❌ Failed to fetch Facebook Pages:', errorData)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch Facebook Pages', 
          details: errorData 
        },
        { status: 500 }
      )
    }

    const pagesData = await pagesResponse.json()
    
    console.log('✅ Pages found:', pagesData.data?.length || 0)
    if (pagesData.data && pagesData.data.length > 0) {
      console.log('📋 Page names:', pagesData.data.map((p: any) => p.name).join(', '))
    } else {
      console.log('⚠️ No pages returned. Full response:', JSON.stringify(pagesData, null, 2))
    }
    
    return NextResponse.json({
      success: true,
      pages: pagesData.data || [],
      debug: {
        orgId: orgMember.org_id,
        connectionPlatform: connection.platform,
        pagesCount: pagesData.data?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Error fetching Facebook Pages:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

