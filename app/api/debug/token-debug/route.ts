import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Skip during build process
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped during build',
        timestamp: new Date().toISOString()
      })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId parameter required' 
      })
    }
    
    console.log('🔍 Debugging token status for user:', userId)
    
    // Get user's organization memberships
    const { data: memberships, error: membershipsError } = await (supabaseAdmin as any)
      .from('org_members')
      .select(`
        org_id,
        role,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch memberships',
        details: membershipsError
      })
    }

    console.log('📋 User memberships:', memberships)

    // Find the user's personal organization (same logic as socials page)
    let userOrgId = memberships?.find((member: any) => member.role !== 'client')?.org_id
    if (!userOrgId) {
      userOrgId = memberships?.[0]?.org_id
    }

    console.log('🎯 Selected user org ID:', userOrgId)

    // Get social connections for the user's personal organization
    const { data: connections, error: connectionsError } = await (supabaseAdmin as any)
      .from('social_connections')
      .select(`
        id,
        platform,
        account_id,
        account_name,
        created_at,
        updated_at,
        org_id,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('org_id', userOrgId)

    if (connectionsError) {
      console.error('❌ Error fetching connections:', connectionsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch connections',
        details: connectionsError
      })
    }

    console.log('🔗 Social connections found:', connections)

    return NextResponse.json({
      success: true,
      userId,
      memberships: memberships?.map((m: any) => ({
        orgId: m.org_id,
        role: m.role,
        orgName: m.organizations?.name || 'Unknown'
      })) || [],
      selectedOrgId: userOrgId,
      selectedOrgName: memberships?.find((m: any) => m.org_id === userOrgId)?.organizations?.name || 'Unknown',
      connectionsCount: connections?.length || 0,
      connections: connections?.map((c: any) => ({
        id: c.id,
        platform: c.platform,
        accountId: c.account_id,
        accountName: c.account_name,
        orgId: c.org_id,
        orgName: c.organizations?.name || 'Unknown',
        createdAt: c.created_at,
        updatedAt: c.updated_at
      })) || []
    })

  } catch (error) {
    console.error('❌ Error in token-debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
