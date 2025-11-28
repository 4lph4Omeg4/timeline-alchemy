import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase client creation moved inside handler

export async function GET(request: NextRequest) {
  try {
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

    // Get user details for each member
    const userIds = orgMembers?.map((member: any) => member.user_id) || []
    console.log('Found org members:', orgMembers)
    console.log('User IDs to fetch:', userIds)

    const users = []

    for (const userId of userIds) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (!userError && userData.user) {
          users.push({
            id: userData.user.id,
            email: userData.user.email,
            user_metadata: userData.user.user_metadata,
            created_at: userData.user.created_at
          })
        } else {
          console.error(`Error fetching user ${userId}:`, userError)
        }
      } catch (error) {
        console.error(`Exception fetching user ${userId}:`, error)
      }
    }

    console.log('Final users array:', users)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
