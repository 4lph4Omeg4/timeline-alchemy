import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export const STRIPE_PLANS = {
  basic: {
    name: 'Basic',
    price: 29,
    features: [
      '5 AI posts per month',
      '1 organization',
      '2 social accounts',
      'Basic scheduling',
    ],
    limits: {
      postsPerMonth: 5,
      organizations: 1,
      socialAccounts: 2,
    },
  },
  pro: {
    name: 'Pro',
    price: 99,
    features: [
      '50 AI posts per month',
      '3 organizations',
      '10 social accounts',
      'Advanced scheduling',
      'Analytics dashboard',
    ],
    limits: {
      postsPerMonth: 50,
      organizations: 3,
      socialAccounts: 10,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    features: [
      'Unlimited AI posts',
      'Unlimited organizations',
      'Unlimited social accounts',
      'Priority support',
      'Custom integrations',
    ],
    limits: {
      postsPerMonth: -1, // unlimited
      organizations: -1, // unlimited
      socialAccounts: -1, // unlimited
    },
  },
} as const

export type PlanType = keyof typeof STRIPE_PLANS

export async function createStripeCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function createStripeSubscription(
  customerId: string,
  priceId: string
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}
