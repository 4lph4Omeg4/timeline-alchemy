import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createStripeCustomer, getStripe } from '@/lib/stripe'
import fetch from 'node-fetch'

// Create a local admin client to ensure we have full control and no global fetch issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: fetch as any
  }
})

export async function POST(request: NextRequest) {
  console.log('🚀 STARTING CREATE ORG REQUEST (Self-Contained)')

  // Debug checks
  const hasServiceKey = !!supabaseServiceKey
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
  const hasPriceId = !!process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID

  console.log('Environment Check:', { hasServiceKey, hasStripeKey, hasPriceId, supabaseUrl })

  if (!hasServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing')
    return NextResponse.json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 })
  }

  try {
    const { userId, userName, email, orgName, plan } = await request.json()
    console.log('Received payload', { userId, userName, email, orgName, plan })

    if (!userId) {
      console.error('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use provided name or fallback
    const nameToUse = orgName ? orgName.trim() : (userName ? `${userName}'s Organization` : 'New Organization')
    const planToUse = plan || 'basic'

    // 1. Create organization
    console.log('1. Creating organization...', { name: nameToUse, plan: planToUse })
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: nameToUse,
        plan: planToUse
      })
      .select()
      .single()

    if (orgError || !orgData) {
      console.error('❌ Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization: ' + orgError?.message }, { status: 500 })
    }
    console.log('✅ Organization created:', orgData.id)

    // 2. Create organization usage record
    console.log('2. Creating organization usage record...')
    const { error: usageError } = await supabaseAdmin
      .from('organization_usage')
      .insert({
        org_id: orgData.id,
        content_packages_used: 0,
        custom_content_used: 0,
        bulk_generation_used: 0
      })

    if (usageError) {
      console.error('❌ Error creating organization usage:', usageError)
    } else {
      console.log('✅ Organization usage created')
    }

    // 3. Add user as owner of the organization
    console.log('3. Adding user as owner...')
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: userId,
        role: 'owner'
      })
      .select()

    if (memberError) {
      console.error('❌ Error adding user to organization:', memberError)
      // Try to clean up
      await supabaseAdmin.from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json({ error: 'Failed to add user to organization: ' + memberError.message }, { status: 500 })
    }
    console.log('✅ User added as owner:', memberData)

    // 4. Create default client for the organization
    console.log('4. Creating default client...')
    const clientName = userName ? `${userName}'s Client` : 'Default Client'
    const { error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        org_id: orgData.id,
        name: clientName,
        contact_info: email ? { email } : null
      })

    if (clientError) {
      console.error('❌ Error creating default client:', clientError)
    } else {
      console.log('✅ Default client created')
    }

    // 5. Create Stripe Customer and Subscription
    let stripeCustomerId: string = ''
    let stripeSubscriptionId: string = ''
    let stripeErrorDetail: any = null

    if (hasStripeKey && email) {
      console.log('5. Starting Stripe integration...')
      try {
        // Create Customer
        const stripeCustomer = await createStripeCustomer(email, userName || 'User')
        stripeCustomerId = stripeCustomer.id
        console.log('✅ Stripe customer created:', stripeCustomerId)

        // Update Organization with Stripe Customer ID
        await supabaseAdmin
          .from('organizations')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', orgData.id)

        // Create Subscription (Trial/Basic)
        const stripe = getStripe()
        const priceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID

        if (priceId) {
          console.log('Creating Stripe subscription...', { priceId })
          const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            trial_period_days: 14,
            payment_behavior: 'default_incomplete',
            trial_settings: {
              end_behavior: { missing_payment_method: 'pause' },
            },
            metadata: {
              org_id: orgData.id,
              user_id: userId,
              plan: planToUse,
            },
          })
          stripeSubscriptionId = subscription.id
          console.log('✅ Stripe subscription created:', stripeSubscriptionId)
        } else {
          console.warn('⚠️ NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID is missing, skipping subscription creation')
          stripeErrorDetail = 'NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID is missing'
        }

      } catch (stripeError) {
        console.error('❌ Stripe error during organization creation:', stripeError)
        stripeErrorDetail = stripeError
      }
    } else {
      console.log('⚠️ Skipping Stripe: Missing key or email')
      stripeErrorDetail = 'Missing Stripe key or email'
    }

    // 6. Create a subscription record in DB
    console.log('6. Creating DB subscription record...')

    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)

    const subscriptionData = {
      org_id: orgData.id,
      stripe_customer_id: stripeCustomerId || ('manual-' + orgData.id),
      stripe_subscription_id: stripeSubscriptionId || ('manual-sub-' + orgData.id),
      plan: planToUse,
      status: stripeSubscriptionId ? 'trialing' : 'active',
      is_trial: !!stripeSubscriptionId,
      trial_start_date: stripeSubscriptionId ? trialStart.toISOString() : null,
      trial_end_date: stripeSubscriptionId ? trialEnd.toISOString() : null
    }

    console.log('Subscription data to insert:', subscriptionData)

    const { data: subData, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select()

    if (subError) {
      console.error('❌ Error creating subscription record:', subError)
    } else {
      console.log('✅ DB subscription record created:', subData)
    }

    return NextResponse.json({
      message: 'Organization created successfully',
      organization: orgData,
      stripeCustomerId,
      stripeSubscriptionId,
      debug: {
        hasServiceKey,
        hasStripeKey,
        hasPriceId,
        stripeError: stripeErrorDetail,
        dbSubscriptionError: subError,
        orgId: orgData.id
      }
    })

  } catch (error) {
    console.error('💥 CRITICAL API ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
