import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createStripeCustomer, getStripe } from '@/lib/stripe'
import fs from 'fs'
import path from 'path'

// Helper to log to file
function logStep(step: string, data?: any) {
  const logFile = path.join(process.cwd(), 'create-org-debug.log')
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
  logStep('🚀 STARTING CREATE ORG REQUEST')
  try {
    const { userId, userName, email, orgName, plan } = await request.json()
    logStep('Received payload', { userId, userName, email, orgName, plan })

    if (!userId) {
      logStep('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use provided name or fallback
    const nameToUse = orgName ? orgName.trim() : (userName ? `${userName}'s Organization` : 'New Organization')
    const planToUse = plan || 'basic'

    // Create organization
    logStep('Creating organization...', { name: nameToUse, plan: planToUse })
    const { data: orgData, error: orgError } = await (supabaseAdmin as any)
      .from('organizations')
      .insert({
        name: nameToUse,
        plan: planToUse
      })
      .select()
      .single()

    if (orgError || !orgData) {
      logStep('❌ Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization: ' + orgError?.message }, { status: 500 })
    }
    logStep('✅ Organization created:', orgData.id)

    // Add user as owner of the organization
    logStep('Adding user as owner...')
    const { error: memberError } = await (supabaseAdmin as any)
      .from('org_members')
      .insert({
        org_id: orgData.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      logStep('❌ Error adding user to organization:', memberError)
      // Try to clean up
      await (supabaseAdmin as any).from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }
    logStep('✅ User added as owner')

    // Create default client for the organization
    logStep('Creating default client...')
    const clientName = userName ? `${userName}'s Client` : 'Default Client'
    const { error: clientError } = await (supabaseAdmin as any)
      .from('clients')
      .insert({
        org_id: orgData.id,
        name: clientName,
        contact_info: email ? { email } : null
      })

    if (clientError) {
      logStep('❌ Error creating default client:', clientError)
    } else {
      logStep('✅ Default client created')
    }

    // Create Stripe Customer and Subscription
    let stripeCustomerId: string = ''
    let stripeSubscriptionId: string = ''

    if (process.env.STRIPE_SECRET_KEY && email) {
      logStep('Starting Stripe integration...')
      try {
        // Create Customer
        const stripeCustomer = await createStripeCustomer(email, userName || 'User')
        stripeCustomerId = stripeCustomer.id
        logStep('✅ Stripe customer created:', stripeCustomerId)

        // Update Organization with Stripe Customer ID
        await (supabaseAdmin as any)
          .from('organizations')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', orgData.id)

        // Create Subscription (Trial/Basic)
        const stripe = getStripe()
        const priceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID

        if (priceId) {
          logStep('Creating Stripe subscription...', { priceId })
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
          logStep('✅ Stripe subscription created:', stripeSubscriptionId)
        } else {
          logStep('⚠️ NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID is missing, skipping subscription creation')
        }

      } catch (stripeError) {
        logStep('❌ Stripe error during organization creation:', stripeError)
      }
    } else {
      logStep('⚠️ Skipping Stripe: Missing key or email')
    }

    // Create a subscription record in DB
    logStep('Creating DB subscription record...')

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

    logStep('Subscription data to insert:', subscriptionData)

    const { data: subData, error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .insert(subscriptionData)
      .select()

    if (subError) {
      logStep('❌ Error creating subscription record:', subError)
    } else {
      logStep('✅ DB subscription record created:', subData)
    }

    return NextResponse.json({
      message: 'Organization created successfully',
      organization: orgData,
      stripeCustomerId,
      stripeSubscriptionId
    })

  } catch (error) {
    logStep('💥 CRITICAL API ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
