import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { newPlan } = await request.json()

    if (!newPlan) {
      return NextResponse.json(
        { error: 'Missing newPlan' },
        { status: 400 }
      )
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    // Check if already on this plan
    if (subscription.plan === newPlan) {
      return NextResponse.json(
        { error: 'Already on this plan' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Get the new price ID
    const priceIds: Record<string, string> = {
      basic: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_basic',
      pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
      enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    }

    const newPriceId = priceIds[newPlan]
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get the current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations', // This handles prorated billing
        metadata: {
          org_id: orgMember.org_id,
          user_id: user.id,
          plan: newPlan,
        },
      }
    )

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan: newPlan,
        status: updatedSubscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgMember.org_id)

    if (updateError) {
      console.error('Error updating subscription in database:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plan changed successfully',
      subscription: {
        plan: newPlan,
        status: updatedSubscription.status,
      }
    })

  } catch (error: any) {
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    )
  }
}
