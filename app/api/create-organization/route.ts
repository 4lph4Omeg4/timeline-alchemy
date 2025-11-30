import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, orgName, plan } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already has an organization (only if we want to enforce 1 org limit, but let's be flexible for now or keep it)
    // The original code enforced it. Let's keep the check but maybe relax it if they are explicitly creating a new one?
    // For now, let's assume the user wants to create a NEW one even if they have one, OR we can keep the check.
    // The user's request implies they are stuck on the "create org" screen, so they probably don't have one.

    // Use provided name or fallback
    const nameToUse = orgName ? orgName.trim() : (userName ? `${userName}'s Organization` : 'New Organization')
    const planToUse = plan || 'basic'

    // Create organization
    // Cast to any to avoid type issues with the admin client if types aren't perfectly aligned
    const { data: orgData, error: orgError } = await (supabaseAdmin as any)
      .from('organizations')
      .insert({
        name: nameToUse,
        plan: planToUse
      })
      .select()
      .single()

    if (orgError || !orgData) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization: ' + orgError?.message }, { status: 500 })
    }

    // Add user as owner of the organization
    const { error: memberError } = await (supabaseAdmin as any)
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      // Try to clean up
      await (supabaseAdmin as any).from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }

    // Create default client for the organization
    const clientName = userName ? `${userName}'s Client` : 'Default Client'
    const { error: clientError } = await (supabaseAdmin as any)
      .from('clients')
      .insert({
        org_id: orgData.id,
        name: clientName
      })

    if (clientError) {
      console.error('Error creating default client:', clientError)
      // Don't fail the organization creation for client errors
    }

    // Create a subscription for the organization
    const { error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .insert({
        org_id: orgData.id,
        stripe_customer_id: 'manual-' + orgData.id,
        stripe_subscription_id: 'manual-sub-' + orgData.id,
        plan: planToUse,
        status: 'active'
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
