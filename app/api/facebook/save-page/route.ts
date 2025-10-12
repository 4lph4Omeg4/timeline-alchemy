import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { platform, page } = body

    if (!platform || !page) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare connection data based on platform
    let connectionData: any = {
      org_id: orgMember.org_id,
      platform: platform,
      access_token: page.access_token, // Page access token (long-lived)
      updated_at: new Date().toISOString(),
    }

    if (platform === 'instagram' && page.instagram_business_account) {
      // Save Instagram Business Account
      connectionData.account_id = `instagram_${page.instagram_business_account.id}`
      connectionData.account_name = page.instagram_business_account.username
      connectionData.account_username = page.instagram_business_account.username
      connectionData.expires_at = null // Instagram page tokens don't expire
    } else if (platform === 'facebook') {
      // Save Facebook Page
      connectionData.account_id = `facebook_page_${page.id}`
      connectionData.account_name = page.name
      connectionData.account_username = page.name
      connectionData.expires_at = null // Page tokens are long-lived
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid platform or missing Instagram account' },
        { status: 400 }
      )
    }

    // Upsert the connection
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert(connectionData, {
        onConflict: 'org_id,platform,account_id'
      })

    if (dbError) {
      console.error('Database error saving page:', dbError)
      return NextResponse.json(
        { success: false, error: 'Failed to save connection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${platform} connected successfully`
    })

  } catch (error: any) {
    console.error('Error saving Facebook Page:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

