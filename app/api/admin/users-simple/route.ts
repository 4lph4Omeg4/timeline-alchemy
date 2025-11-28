import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
    const orgId = searchParams.get('orgId')
    const currentUserId = searchParams.get('currentUserId')

    if (!orgId || !currentUserId) {
      return NextResponse.json(
        { error: 'Missing orgId or currentUserId' },
        { status: 400 }
      )
    }

    // Get all users in the organization (excluding only the current user)
    const { data: orgMembers, error: membersError } = await supabaseAdmin
      .from('org_members')
      .select('user_id, role')
      .eq('org_id', orgId)
      .neq('user_id', currentUserId)

    if (membersError) {
      console.error('Error fetching organization members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch organization members' },
        { status: 500 }
      )
    }

    // Return simplified user data (just IDs and roles)
    const users = orgMembers?.map(member => ({
      id: member.user_id,
      email: `user-${member.user_id.substring(0, 8)}@example.com`,
      user_metadata: { name: `User ${member.user_id.substring(0, 8)}` },
      created_at: new Date().toISOString(),
      role: member.role
    })) || []

    console.log('Simple users response:', users)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Simple API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
