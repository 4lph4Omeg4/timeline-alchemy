import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { priceId, plan, userId } = await request.json()

    console.log('Creating checkout session for:', { userId, plan, priceId })

    if (!priceId || !plan || !userId) {
      console.error('Missing required fields')
      return NextResponse.json(
        { error: 'Missing priceId, plan, or userId' },
        { status: 400 }
      )
    }

    // Get user details
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    // We use 'maybeSingle' or check for error to handle cases where user might not have an org yet (though they should)
    const { data: orgMember, error: orgError } = await (supabaseAdmin as any)
      .from('org_members')
      .select('org_id, organizations(*)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (orgError || !orgMember) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json(
        { error: 'No organization found where user is owner' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Check if customer already exists
    let customerId: string
    const { data: existingSubscription, error: subError } = await (supabaseAdmin as any)
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', (orgMember as any).org_id)
      .maybeSingle()

    if ((existingSubscription as any)?.stripe_customer_id) {
      console.log('Found existing Stripe customer:', (existingSubscription as any).stripe_customer_id)
      customerId = (existingSubscription as any).stripe_customer_id
    } else {
      console.log('Creating new Stripe customer for:', user.email)
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email,
        metadata: {
          org_id: (orgMember as any).org_id,
          user_id: user.id,
        },
      })
      customerId = customer.id
      console.log('Created new Stripe customer:', customerId)
    }

    // Create checkout session with custom domain
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      // Use custom domain for checkout if available
      ...(process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN && {
        custom_domain: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN,
      }),
      metadata: {
        org_id: (orgMember as any).org_id,
        user_id: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          org_id: (orgMember as any).org_id,
          user_id: user.id,
          plan: plan,
        },
      },
    })

    console.log('Created checkout session:', session.id)

    return NextResponse.json({ sessionId: session.id })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + error.message },
      { status: 500 }
    )
  }
}
