import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, userName } = await request.json()

    if (!userId || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already has an organization
    const { data: existingOrg } = await supabase
      .from('org_members')
      .select('org_id, organizations(*)')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single()

    if (existingOrg) {
      return NextResponse.json({ 
        message: 'User already has an organization',
        organization: (existingOrg as any).organizations
      })
    }

    // Create default organization for the user
    const { data: orgData, error: orgError } = await (supabase as any)
      .from('organizations')
      .insert({
        name: `${userName}'s Organization`,
        plan: 'basic'
      })
      .select()
      .single()

    if (orgError || !orgData) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Add user as owner of the organization
    const { error: memberError } = await (supabase as any)
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }

    // Create a trial subscription for the organization (no payment required initially)
    const { error: subError } = await (supabase as any)
      .from('subscriptions')
      .insert({
        org_id: orgData.id,
        stripe_customer_id: 'temp-' + orgData.id,
        stripe_subscription_id: 'temp-sub-' + orgData.id,
        plan: 'basic',
        status: 'trialing' // Changed from 'active' to 'trialing'
      })

    if (subError) {
      console.error('Error creating subscription:', subError)
      // Don't fail the organization creation for subscription errors
    }

    return NextResponse.json({ 
      message: 'Organization created successfully',
      organization: orgData
    })

  } catch (error) {
    console.error('Create Organization API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
