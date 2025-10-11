import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName } = await request.json()

    if (!email || !password || !name || !organizationName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Starting signup process for:', email)

    // Step 1: Create the user account with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no confirmation email needed)
      user_metadata: {
        name,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        error: authError?.message || 'Failed to create user account' 
      }, { status: 400 })
    }

    console.log('User created successfully:', authData.user.id)

    const userId = authData.user.id

    // Step 2: Find or create Admin Organization and add user as client
    let adminOrgId: string | null = null
    
    // First, find the Admin Organization
    const { data: adminOrg, error: adminOrgFindError } = await (supabaseAdmin as any)
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    if (adminOrg) {
      adminOrgId = adminOrg.id
      console.log('Found existing Admin Organization:', adminOrgId)
    } else {
      // Create Admin Organization if it doesn't exist
      console.log('Admin Organization not found, creating it...')
      const { data: newAdminOrg, error: createAdminOrgError } = await (supabaseAdmin as any)
        .from('organizations')
        .insert({
          name: 'Admin Organization',
          plan: 'universal'
        })
        .select()
        .single()

      if (newAdminOrg) {
        adminOrgId = newAdminOrg.id
        console.log('Created Admin Organization:', adminOrgId)

        // Create subscription for Admin Organization
        await (supabaseAdmin as any)
          .from('subscriptions')
          .insert({
            org_id: adminOrgId,
            stripe_customer_id: 'admin-' + adminOrgId,
            stripe_subscription_id: 'admin-sub-' + adminOrgId,
            plan: 'universal',
            status: 'active'
          })
      }
    }

    // Add user as CLIENT to Admin Organization
    if (adminOrgId) {
      const { error: adminMemberError } = await (supabaseAdmin as any)
        .from('org_members')
        .insert({
          org_id: adminOrgId,
          user_id: userId,
          role: 'client'
        })

      if (adminMemberError) {
        console.error('Error adding user as client to Admin Organization:', adminMemberError)
        // Don't fail the signup for this
      } else {
        console.log('User added as client to Admin Organization')
      }
    }

    // Step 3: Create user's personal organization
    const { data: orgData, error: orgError } = await (supabaseAdmin as any)
      .from('organizations')
      .insert({
        name: organizationName.trim(),
        plan: 'trial'
      })
      .select()
      .single()

    if (orgError || !orgData) {
      console.error('Error creating organization:', orgError)
      // Clean up: delete the user if organization creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ 
        error: 'Failed to create organization' 
      }, { status: 500 })
    }

    console.log('User\'s personal organization created successfully:', orgData.id)

    // Step 4: Add user as OWNER of their personal organization
    const { error: memberError } = await (supabaseAdmin as any)
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      // Clean up
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await (supabaseAdmin as any).from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json({ 
        error: 'Failed to add user to organization' 
      }, { status: 500 })
    }

    console.log('User added as owner of their personal organization')

    // Step 5: Create trial subscription for user's personal organization
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days

    const { error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .insert({
        org_id: orgData.id,
        stripe_customer_id: 'trial-customer-' + orgData.id,
        stripe_subscription_id: 'trial-sub-' + orgData.id,
        plan: 'trial',
        status: 'active',
        is_trial: true,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString()
      })

    if (subError) {
      console.error('Error creating subscription:', subError)
      // Don't fail the whole signup for subscription errors
    } else {
      console.log('Trial subscription created for user\'s personal organization')
    }

    // Step 6: Create default client in user's personal organization
    const { error: clientError } = await (supabaseAdmin as any)
      .from('clients')
      .insert({
        org_id: orgData.id,
        name: name + "'s Client",
        contact_info: { email: email }
      })

    if (clientError) {
      console.error('Error creating client:', clientError)
      // Don't fail the whole signup for client errors
    } else {
      console.log('Default client created')
    }

    console.log('Signup process completed successfully')
    console.log('Summary:')
    console.log('- User created:', userId)
    console.log('- Added as client to Admin Organization:', adminOrgId)
    console.log('- Personal organization created:', orgData.id)
    console.log('- User is owner of personal organization')

    return NextResponse.json({ 
      success: true,
      message: 'Account, organization, and client created successfully',
      userId: userId,
      personalOrganizationId: orgData.id,
      adminOrganizationId: adminOrgId
    })

  } catch (error) {
    console.error('Signup API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
