import Stripe from 'stripe'
import { PlanType } from '@/types/index'

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
  trial: {
    name: 'Trial',
    price: 0, // Free trial
    features: [
      '2 content packages',
      '5 custom content generations',
      '1 bulk generation',
      '14-day free trial',
    ],
    limits: {
      contentPackages: 2,
      customContent: 5,
      bulkGeneration: 1,
      customIntegrations: false,
      whiteLabel: false,
      prioritySupport: false,
      advancedAnalytics: false,
    },
  },
  basic: {
    name: 'Basic',
    price: 49, // €49.00
    features: [
      '4 content packages',
      'Basic scheduling',
      'Standard support',
    ],
    limits: {
      contentPackages: 4,
      customContent: 0,
      bulkGeneration: 0,
      customIntegrations: false,
      whiteLabel: false,
      prioritySupport: false,
      advancedAnalytics: false,
    },
  },
  initiate: {
    name: 'Initiate',
    price: 99, // €99.00
    features: [
      '8 content packages',
      '10 custom content generations',
      'Advanced scheduling',
      'Priority support',
    ],
    limits: {
      contentPackages: 8,
      customContent: 10,
      bulkGeneration: 0,
      customIntegrations: false,
      whiteLabel: false,
      prioritySupport: true,
      advancedAnalytics: false,
    },
  },
  transcendant: {
    name: 'Transcendant',
    price: 199, // €199.00
    features: [
      '12 content packages',
      'Unlimited custom content',
      'Advanced analytics',
      'Priority support',
    ],
    limits: {
      contentPackages: 12,
      customContent: -1, // unlimited
      bulkGeneration: 0,
      customIntegrations: false,
      whiteLabel: false,
      prioritySupport: true,
      advancedAnalytics: true,
    },
  },
  universal: {
    name: 'Universal',
    price: 499, // €499.00
    features: [
      'Unlimited content packages',
      'Unlimited custom content',
      'Unlimited bulk generation',
      'Custom integrations',
      'White-label options',
    ],
    limits: {
      contentPackages: -1, // unlimited
      customContent: -1, // unlimited
      bulkGeneration: -1, // unlimited
      customIntegrations: true,
      whiteLabel: true,
      prioritySupport: true,
      advancedAnalytics: true,
    },
  },
} as const

export type StripePlanType = keyof typeof STRIPE_PLANS

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
  cancelUrl: string,
  customDomain?: string
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
    // Use custom domain if provided
    ...(customDomain && {
      custom_domain: customDomain,
    }),
  })
}

// Helper function to get plan limits
export function getPlanLimits(plan: PlanType) {
  return STRIPE_PLANS[plan]?.limits || STRIPE_PLANS.basic.limits
}

// Helper function to check if user can perform action
export function canPerformAction(plan: PlanType, action: 'contentPackage' | 'customContent' | 'bulkGeneration', currentUsage: number) {
  const limits = getPlanLimits(plan)
  
  switch (action) {
    case 'contentPackage':
      return limits.contentPackages === -1 || currentUsage < limits.contentPackages
    case 'customContent':
      return limits.customContent === -1 || currentUsage < limits.customContent
    case 'bulkGeneration':
      return limits.bulkGeneration === -1 || currentUsage < limits.bulkGeneration
    default:
      return false
  }
}
