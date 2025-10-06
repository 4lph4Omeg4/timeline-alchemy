import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // This is a one-time fix to ensure all users have access to admin organization
    
    // First, ensure the Admin Organization exists
    const { data: adminOrg, error: orgError } = await (supabaseAdmin as any)
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    if (orgError && orgError.code !== 'PGRST116') {
      console.error('Error finding admin organization:', orgError)
      return NextResponse.json({ error: 'Failed to find admin organization' }, { status: 500 })
    }

    let adminOrgId: string

    if (!adminOrg) {
      // Create admin organization if it doesn't exist
      const { data: newOrg, error: createError } = await (supabaseAdmin as any)
        .from('organizations')
        .insert({
          name: 'Admin Organization',
          plan: 'universal'
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating admin organization:', createError)
        return NextResponse.json({ error: 'Failed to create admin organization' }, { status: 500 })
      }

      adminOrgId = newOrg.id
    } else {
      adminOrgId = adminOrg.id
    }

    // Get all users from auth.users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Add all users to admin organization
    const membersToInsert = users.users.map(user => ({
      org_id: adminOrgId,
      user_id: user.id,
      role: user.email === 'sh4m4ni4k@sh4m4ni4k.nl' ? 'owner' : 'client'
    }))

    // Insert members (ignore conflicts)
    const { error: membersError } = await (supabaseAdmin as any)
      .from('org_members')
      .upsert(membersToInsert, { 
        onConflict: 'org_id,user_id',
        ignoreDuplicates: true 
      })

    if (membersError) {
      console.error('Error adding users to admin organization:', membersError)
      return NextResponse.json({ error: 'Failed to add users to admin organization' }, { status: 500 })
    }

    // Ensure admin organization has a subscription
    const { error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .upsert({
        org_id: adminOrgId,
        stripe_customer_id: 'admin-' + adminOrgId,
        stripe_subscription_id: 'admin-sub-' + adminOrgId,
        plan: 'universal',
        status: 'active'
      }, { 
        onConflict: 'org_id',
        ignoreDuplicates: true 
      })

    if (subError) {
      console.error('Error creating admin subscription:', subError)
      return NextResponse.json({ error: 'Failed to create admin subscription' }, { status: 500 })
    }

    // Move all clients to admin organization
    const { error: clientsError } = await (supabaseAdmin as any)
      .from('clients')
      .update({ org_id: adminOrgId })

    if (clientsError) {
      console.error('Error updating clients:', clientsError)
      return NextResponse.json({ error: 'Failed to update clients' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Client access fixed successfully',
      adminOrgId,
      usersAdded: users.users.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
