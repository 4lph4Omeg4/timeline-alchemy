import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    // Get Facebook connection (temporary user token)
    const { data: connection } = await supabase
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
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username}&access_token=${connection.access_token}`
    )

    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json()
      console.error('Failed to fetch Facebook Pages:', errorData)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Facebook Pages' },
        { status: 500 }
      )
    }

    const pagesData = await pagesResponse.json()
    
    return NextResponse.json({
      success: true,
      pages: pagesData.data || []
    })

  } catch (error: any) {
    console.error('Error fetching Facebook Pages:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

