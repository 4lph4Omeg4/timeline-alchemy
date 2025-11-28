import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase client
export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { priceId, plan, userId } = await request.json()

    if (!priceId || !plan || !userId) {
      return NextResponse.json(
        { error: 'Missing priceId, plan, or userId' },
        { status: 400 }
      )
    }

    // Get user details
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: orgMember, error: orgError } = await supabaseAdmin
      .from('org_members')
      .select('org_id, organizations(*)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Check if customer already exists
    let customerId: string
    const existingSubscription = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', orgMember.org_id)
      .single()

    if (existingSubscription.data?.stripe_customer_id) {
      customerId = existingSubscription.data.stripe_customer_id
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email,
        metadata: {
          org_id: orgMember.org_id,
          user_id: user.id,
        },
      })
      customerId = customer.id
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
        org_id: orgMember.org_id,
        user_id: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          org_id: orgMember.org_id,
          user_id: user.id,
          plan: plan,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
