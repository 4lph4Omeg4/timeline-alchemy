import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createStripeCustomer, getStripe } from '@/lib/stripe'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

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

// Helper to log to file
function logStep(step: string, data?: any) {
  const logFile = path.join(process.cwd(), 'signup-debug.log')
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ${step} ${data ? JSON.stringify(data, null, 2) : ''}\n`

  try {
    fs.appendFileSync(logFile, message)
  } catch (e) {
    console.error('Failed to write to log file:', e)
  }
  console.log(step, data || '')
}

export async function POST(request: NextRequest) {
  const debugErrors: any[] = []
  logStep('🚀 STARTING SIGNUP REQUEST')

  try {
    const { email, password, name, organizationName } = await request.json()
    logStep('Received payload', { email, name, organizationName })

    if (!email || !password || !name || !organizationName) {
      logStep('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Create the user account with Supabase Auth
    logStep('Step 1: Creating user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no confirmation email needed)
      user_metadata: {
        name,
      },
    })

    if (authError || !authData.user) {
      logStep('❌ Auth error:', authError)
      return NextResponse.json({
        error: authError?.message || 'Failed to create user account'
      }, { status: 400 })
    }

    logStep('✅ User created successfully:', authData.user.id)
    const userId = authData.user.id

    // Step 2: Find or create Admin Organization and add user as client
    let adminOrgId: string | null = null
    logStep('Step 2: Checking Admin Organization...')

    // First, find the Admin Organization
    const { data: adminOrg, error: adminOrgFindError } = await (supabaseAdmin as any)
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    if (adminOrg) {
      adminOrgId = adminOrg.id
      logStep('Found existing Admin Organization:', adminOrgId)
    } else {
      // Create Admin Organization if it doesn't exist
      logStep('Admin Organization not found, creating it...')
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
        logStep('Created Admin Organization:', adminOrgId)

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
        logStep('⚠️ Error adding user as client to Admin Organization:', adminMemberError)
      } else {
        logStep('✅ User added as client to Admin Organization')
      }
    }

    // Step 3: Create user's personal organization
    logStep('Step 3: Creating personal organization...')
    const { data: orgData, error: orgError } = await (supabaseAdmin as any)
      .from('organizations')
      .insert({
        name: organizationName.trim(),
        plan: 'trial'
      })
      .select()
      .single()

    if (orgError || !orgData) {
      logStep('❌ Error creating organization:', orgError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({
        error: 'Failed to create organization'
      }, { status: 500 })
    }

    logStep('✅ Personal organization created:', orgData.id)

    // Step 4: Add user as OWNER of their personal organization
    logStep('Step 4: Adding user as owner...')
    const { error: memberError } = await (supabaseAdmin as any)
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      logStep('❌ Error adding user to organization:', memberError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await (supabaseAdmin as any).from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json({
        error: 'Failed to add user to organization'
      }, { status: 500 })
    }

    logStep('✅ User added as owner')

    // Step 5: Create default client in user's personal organization
    logStep('Step 5: Creating default client...')
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
      logStep('❌ Error creating client with contact info:', clientError)
      debugErrors.push({ step: 'create_client_with_contact', error: clientError })

      // Retry without contact info
      logStep('Retrying client creation without contact info...')
      const { error: retryError } = await (supabaseAdmin as any)
        .from('clients')
        .insert({
          org_id: orgData.id,
          name: clientName
        })

      if (retryError) {
        logStep('❌ Error creating client without contact info:', retryError)
        debugErrors.push({ step: 'create_client_retry', error: retryError })
      } else {
        logStep('✅ Default client created on retry')
      }
    } else {
      logStep('✅ Default client created successfully:', newClient?.id)
    }

    // Step 6: Create Stripe customer
    logStep('Step 6: Creating Stripe customer...')
    let stripeCustomerId: string
    let stripeSubscriptionId: string = ''

    if (!process.env.STRIPE_SECRET_KEY) {
      logStep('❌ STRIPE_SECRET_KEY is missing')
      throw new Error('STRIPE_SECRET_KEY is missing')
    }

    try {
      const stripeCustomer = await createStripeCustomer(email, name)
      stripeCustomerId = stripeCustomer.id
      logStep('✅ Stripe customer created:', stripeCustomerId)

      // Update organization with Stripe Customer ID
      const { error: updateOrgError } = await (supabaseAdmin as any)
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', orgData.id)

      if (updateOrgError) {
        logStep('⚠️ Error updating organization with Stripe Customer ID:', updateOrgError)
      } else {
        logStep('✅ Organization updated with Stripe Customer ID')
      }
    } catch (stripeError: any) {
      logStep('❌ Error creating Stripe customer:', stripeError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await (supabaseAdmin as any).from('organizations').delete().eq('id', orgData.id)
      throw new Error(`Failed to create Stripe customer: ${stripeError.message || JSON.stringify(stripeError)}`)
    }

    // Step 7: Create Stripe subscription
    logStep('Step 7: Creating Stripe subscription...')
    const stripe = getStripe()
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID

    if (!basicPriceId) {
      logStep('⚠️ NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID missing')
      debugErrors.push({ step: 'check_price_id', error: 'NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID missing' })
    } else {
      try {
        logStep('Attempting to create Stripe subscription...', { customer: stripeCustomerId, price: basicPriceId })

        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: basicPriceId }],
          trial_period_days: 14,
          payment_behavior: 'default_incomplete',
          trial_settings: {
            end_behavior: { missing_payment_method: 'pause' },
          },
          metadata: {
            org_id: orgData.id,
            user_id: userId,
            plan: 'trial',
          },
        })

        stripeSubscriptionId = subscription.id
        logStep('✅ Stripe subscription created:', stripeSubscriptionId)
      } catch (subscriptionError: any) {
        logStep('❌ Error creating Stripe subscription:', subscriptionError)
        debugErrors.push({ step: 'create_stripe_sub_advanced', error: subscriptionError })

        // Retry logic
        try {
          logStep('Retrying subscription creation...')
          const retrySubscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: basicPriceId }],
            trial_period_days: 14,
            metadata: {
              org_id: orgData.id,
              user_id: userId,
              plan: 'trial',
            },
          })

          stripeSubscriptionId = retrySubscription.id
          logStep('✅ Retry successful: Stripe subscription created:', stripeSubscriptionId)
        } catch (retryError: any) {
          logStep('❌ Retry failed:', retryError)

          // CRITICAL: Fail and rollback
          logStep('🛑 ROLLING BACK SIGNUP due to subscription failure')
          await supabaseAdmin.auth.admin.deleteUser(userId)
          await (supabaseAdmin as any).from('organizations').delete().eq('id', orgData.id)

          throw new Error(`Failed to create Stripe subscription: ${retryError.message || JSON.stringify(retryError)}`)
        }
      }
    }

    // Step 8: Create database subscription record
    logStep('Step 8: Creating DB subscription record...')
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)

    const { error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .insert({
        org_id: orgData.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan: 'trial',
        status: 'trialing',
        is_trial: true,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString()
      })

    if (subError) {
      logStep('❌ Error creating DB subscription:', subError)
      debugErrors.push({ step: 'create_db_subscription', error: subError })
    } else {
      logStep('✅ DB subscription record created')
    }

    logStep('🏁 SIGNUP COMPLETED SUCCESSFULLY')

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      apiVersion: '2.0',
      userId: userId,
      personalOrganizationId: orgData.id,
      stripeCustomerId: stripeCustomerId,
      debugErrors: debugErrors.length > 0 ? debugErrors : undefined
    })

  } catch (error) {
    logStep('💥 CRITICAL API ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message, debugErrors },
      { status: 500 }
    )
  }
}
