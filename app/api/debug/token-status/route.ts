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
    
    console.log('🔍 Checking token status for user:', userId)
    
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

    // Get social connections for all organizations the user belongs to
    const orgIds = memberships?.map((m: any) => m.org_id) || []
    
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
      .in('org_id', orgIds)

    if (connectionsError) {
      console.error('❌ Error fetching connections:', connectionsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch connections',
        details: connectionsError
      })
    }

    console.log('🔗 Social connections found:', connections)

    // Group connections by organization
    const connectionsByOrg = connections?.reduce((acc: any, conn: any) => {
      const orgName = conn.organizations?.name || 'Unknown'
      if (!acc[orgName]) {
        acc[orgName] = []
      }
      acc[orgName].push(conn)
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      userId,
      memberships: memberships?.map((m: any) => ({
        orgId: m.org_id,
        role: m.role,
        orgName: m.organizations?.name || 'Unknown'
      })) || [],
      totalConnections: connections?.length || 0,
      connectionsByOrg,
      allConnections: connections?.map((c: any) => ({
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
    console.error('❌ Error in token-status debug:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
