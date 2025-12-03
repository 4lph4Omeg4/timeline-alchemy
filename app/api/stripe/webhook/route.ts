import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Stripe webhook received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const orgId = session.metadata?.org_id
          const plan = session.metadata?.plan

          if (!orgId || !plan) {
            console.error('Missing metadata in checkout session:', session.id)
            break
          }

          // Create or update subscription in database
          const { error } = await (supabaseAdmin as any)
            .from('subscriptions')
            .upsert(
              {
                org_id: orgId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                plan: plan,
                status: subscription.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'org_id' }
            )

          if (error) {
            console.error('Error saving subscription:', error)
          } else {
            console.log('Subscription saved successfully:', subscription.id)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const orgId = subscription.metadata?.org_id
        if (!orgId) {
          console.error('Missing org_id in subscription metadata:', subscription.id)
          break
        }

        // Update subscription status
        const { error } = await (supabaseAdmin as any)
          .from('subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        } else {
          console.log('Subscription updated successfully:', subscription.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const orgId = subscription.metadata?.org_id
        if (!orgId) {
          console.error('Missing org_id in subscription metadata:', subscription.id)
          break
        }

        // Update subscription status to canceled
        const { error } = await (supabaseAdmin as any)
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error canceling subscription:', error)
        } else {
          console.log('Subscription canceled successfully:', subscription.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          const orgId = subscription.metadata?.org_id
          if (!orgId) {
            console.error('Missing org_id in subscription metadata:', subscription.id)
            break
          }

          // Update subscription status to active
          const { error } = await (supabaseAdmin as any)
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error updating subscription after payment:', error)
          } else {
            console.log('Subscription activated after payment:', subscription.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          const orgId = subscription.metadata?.org_id
          if (!orgId) {
            console.error('Missing org_id in subscription metadata:', subscription.id)
            break
          }

          // Update subscription status to past_due
          const { error } = await (supabaseAdmin as any)
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error updating subscription after payment failure:', error)
          } else {
            console.log('Subscription marked as past_due after payment failure:', subscription.id)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

