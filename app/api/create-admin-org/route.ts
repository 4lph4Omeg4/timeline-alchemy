import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if admin already has an organization
    const { data: existingOrg } = await supabase
      .from('org_members')
      .select('org_id, organizations(*)')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single()

    if (existingOrg) {
      return NextResponse.json({
        message: 'Admin already has an organization',
        organization: existingOrg.organizations
      })
    }

    // Create admin organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Timeline Alchemy Admin',
        plan: 'enterprise'
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating admin organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Add admin as owner of the organization
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: newOrg.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding admin to organization:', memberError)
      return NextResponse.json(
        { error: 'Failed to add admin to organization' },
        { status: 500 }
      )
    }

    // Create a subscription for the admin organization
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        org_id: newOrg.id,
        stripe_customer_id: 'admin-' + newOrg.id,
        stripe_subscription_id: 'admin-sub-' + newOrg.id,
        plan: 'enterprise',
        status: 'active'
      })

    if (subError) {
      console.error('Error creating admin subscription:', subError)
      // Don't fail the request, subscription is optional
    }

    return NextResponse.json({
      message: 'Admin organization created successfully',
      organization: newOrg
    })

  } catch (error) {
    console.error('Error creating admin organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
