import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Find the admin organization (Timeline Alchemy Admin)
    const { data: adminOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('name', 'Timeline Alchemy Admin')
      .single()

    if (orgError || !adminOrg) {
      console.error('Error finding admin organization:', orgError)
      return NextResponse.json({ error: 'Admin organization not found' }, { status: 404 })
    }

    const adminOrgId = (adminOrg as { id: string }).id

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from('org_members')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', adminOrgId)
      .single()

    if (existingMember) {
      return NextResponse.json({ 
        message: 'User is already a member of the admin organization',
        orgId: adminOrgId 
      })
    }

    // Add user to admin organization as a client
    const { data: newMember, error: memberError } = await supabaseAdmin
      .from('org_members')
      .insert({
        org_id: adminOrgId,
        user_id: userId,
        role: 'client'
      } as any)
      .select()
      .single()

    if (memberError) {
      console.error('Error adding user to admin organization:', memberError)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User successfully added to admin organization',
      orgId: adminOrgId,
      member: newMember
    })

  } catch (error) {
    console.error('Auto-join admin org API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
