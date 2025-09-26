import Stripe from 'stripe'

// Server-side Stripe instance (only use in API routes)
export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  })
}

// Client-safe Stripe plans configuration
export const STRIPE_PLANS = {
  basic: {
    name: 'Basic',
    price: 129,
    features: [
      '1 organization',
      '4x Blog + crossplatform social links (set per week)',
      'Basic scheduling',
    ],
    limits: {
      postsPerMonth: 16, // 4 per week
      organizations: 1,
      socialAccounts: 5,
    },
  },
  pro: {
    name: 'Pro',
    price: 249,
    features: [
      '1 organization',
      '8x Blog + crossplatform social links (2x set per week)',
      'Advanced scheduling',
      'Analytics dashboard',
    ],
    limits: {
      postsPerMonth: 32, // 8 per week
      organizations: 1,
      socialAccounts: 10,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    features: [
      'Unlimited AI posts',
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
  const stripe = getStripe()
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function createStripeSubscription(
  customerId: string,
  priceId: string
) {
  const stripe = getStripe()
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
  const stripe = getStripe()
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
