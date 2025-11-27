import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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
      .single() as any

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
      .single() as any

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Cancel the subscription at the end of the current period
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Update subscription status in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      } as any)
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
      message: 'Subscription canceled successfully. You will retain access until the end of your billing period.',
      cancelAt: canceledSubscription.cancel_at,
    })

  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
