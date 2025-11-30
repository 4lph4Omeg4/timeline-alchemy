import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createStripeCustomer, getStripe } from '@/lib/stripe'
import fetch from 'node-fetch'

// Force node-fetch for Supabase in this route to avoid undici issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: fetch as any
  }
})

export async function POST(request: NextRequest) {
  const debugErrors: any[] = []

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
          plan: 'transcendant'
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
            plan: 'transcendant',
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

    // Step 5: Create default client in user's personal organization
    console.log('Attempting to create default client for org:', orgData.id)

    const clientName = name ? `${name}'s Client` : 'Default Client'

    const { data: newClient, error: clientError } = await (supabaseAdmin as any)
      .from('clients')
      .insert({
        org_id: orgData.id,
        name: clientName,
        contact_info: { email: email }
      })
      .select()
      .single()

    if (clientError) {
      console.error('Error creating client with contact info:', JSON.stringify(clientError))
      debugErrors.push({ step: 'create_client_with_contact', error: clientError })

      // Retry without contact info
      const { error: retryError } = await (supabaseAdmin as any)
        .from('clients')
        .insert({
          org_id: orgData.id,
          name: clientName
        })

      if (retryError) {
        console.error('Error creating client without contact info:', JSON.stringify(retryError))
        debugErrors.push({ step: 'create_client_retry', error: retryError })
        // Don't fail the whole signup for client errors, but log it clearly
      } else {
        console.log('Default client created (without contact info) on retry')
      }
    } else {
      console.log('Default client created successfully:', newClient?.id)
    }

    // Step 6: Create Stripe customer
    let stripeCustomerId = 'trial-customer-' + orgData.id // fallback
    let stripeSubscriptionId = 'trial-sub-' + orgData.id // fallback

    // Check for Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing in environment variables')
      debugErrors.push({ step: 'check_stripe_key', error: 'STRIPE_SECRET_KEY missing' })
    }

    try {
      const stripeCustomer = await createStripeCustomer(email, name)
      stripeCustomerId = stripeCustomer.id
      console.log('Stripe customer created:', stripeCustomerId)

      // Update organization with Stripe Customer ID
      const { error: updateOrgError } = await (supabaseAdmin as any)
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', orgData.id)

      if (updateOrgError) {
        console.error('Error updating organization with Stripe Customer ID:', updateOrgError)
        debugErrors.push({ step: 'update_org_stripe_id', error: updateOrgError })
      } else {
        console.log('Organization updated with Stripe Customer ID')
      }

      // Step 7: Create Stripe subscription with 14-day trial that converts to Basic plan
      const stripe = getStripe()
      const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID

      if (!basicPriceId) {
        console.warn('NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID not found, creating manual trial subscription')
        debugErrors.push({ step: 'check_price_id', error: 'NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID missing' })
      } else {
        try {
          console.log('Attempting to create Stripe subscription for customer:', stripeCustomerId, 'with price:', basicPriceId)

          // Create subscription with trial period that auto-converts to Basic plan
          const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [
              {
                price: basicPriceId,
              },
            ],
            trial_period_days: 14, // 14-day trial
            payment_behavior: 'default_incomplete', // Don't require payment method during trial
            trial_settings: {
              end_behavior: {
                missing_payment_method: 'pause', // Pause subscription if no payment method after trial
              },
            },
            metadata: {
              org_id: orgData.id,
              user_id: userId,
              plan: 'trial',
            },
          })

          stripeSubscriptionId = subscription.id
          console.log('Stripe subscription created with 14-day trial:', stripeSubscriptionId)
          console.log('Trial ends at:', new Date(subscription.trial_end! * 1000).toISOString())
        } catch (subscriptionError: any) {
          console.error('Error creating Stripe subscription with trial settings:', JSON.stringify(subscriptionError))
          debugErrors.push({ step: 'create_stripe_sub_advanced', error: subscriptionError })

          // Retry without advanced trial settings (fallback for API compatibility or other issues)
          try {
            console.log('Retrying subscription creation without advanced trial settings...')
            const retrySubscription = await stripe.subscriptions.create({
              customer: stripeCustomerId,
              items: [
                {
                  price: basicPriceId,
                },
              ],
              trial_period_days: 14,
              metadata: {
                org_id: orgData.id,
                user_id: userId,
                plan: 'trial',
              },
            })

            stripeSubscriptionId = retrySubscription.id
            console.log('Retry successful: Stripe subscription created:', stripeSubscriptionId)
          } catch (retryError: any) {
            console.error('Retry failed: Error creating Stripe subscription:', JSON.stringify(retryError))
            debugErrors.push({ step: 'create_stripe_sub_retry', error: retryError })
            // Continue with fallback (database-only trial)
          }
        }
      }
    } catch (stripeError: any) {
      console.error('Error creating Stripe customer:', JSON.stringify(stripeError))
      debugErrors.push({ step: 'create_stripe_customer', error: stripeError })
      // Continue with fallback customer ID - don't fail signup
    }

    // Step 8: Create database subscription record
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days

    const { error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .insert({
        org_id: orgData.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan: 'trial',
        status: 'trialing', // Changed from 'active' to 'trialing'
        is_trial: true,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString()
      })

    if (subError) {
      console.error('Error creating subscription:', subError)
      debugErrors.push({ step: 'create_db_subscription', error: subError })
      // Don't fail the whole signup for subscription errors
    } else {
      console.log('Trial subscription record created in database')
    }

    console.log('Signup process completed successfully')
    console.log('Summary:')
    console.log('- User created:', userId)
    console.log('- Stripe customer created:', stripeCustomerId)
    console.log('- Added as client to Admin Organization:', adminOrgId)
    console.log('- Personal organization created:', orgData.id)
    console.log('- User is owner of personal organization')
    console.log('- Default client created')
    console.log('- Trial subscription with Stripe customer linked')

    return NextResponse.json({
      success: true,
      message: 'Account, organization, and client created successfully',
      apiVersion: '2.0',
      userId: userId,
      personalOrganizationId: orgData.id,
      adminOrganizationId: adminOrgId,
      stripeCustomerId: stripeCustomerId,
      debugErrors: debugErrors.length > 0 ? debugErrors : undefined,
      envCheck: {
        stripeKey: !!process.env.STRIPE_SECRET_KEY,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        basicPriceId: !!process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
      }
    })

  } catch (error) {
    console.error('Signup API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message, debugErrors },
      { status: 500 }
    )
  }
}
