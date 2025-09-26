import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create default organization for the user
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `${name}'s Organization`,
        plan: 'basic'
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Add user as owner of the organization
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: authData.user.id,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }

    // Create a basic subscription for the organization
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        org_id: orgData.id,
        stripe_customer_id: 'temp-' + orgData.id,
        stripe_subscription_id: 'temp-sub-' + orgData.id,
        plan: 'basic',
        status: 'active'
      })

    if (subError) {
      console.error('Error creating subscription:', subError)
      // Don't fail the signup for subscription errors
    }

    return NextResponse.json({ 
      message: 'User and organization created successfully',
      user: authData.user,
      organization: orgData
    })

  } catch (error) {
    console.error('Signup API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
