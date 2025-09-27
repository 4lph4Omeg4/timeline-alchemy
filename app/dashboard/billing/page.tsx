'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { STRIPE_PLANS, PlanType } from '@/lib/stripe'
import { Subscription } from '@/types/index'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's organization
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!orgMember) return

        // Get subscription
        const { data: sub, error } = await (supabase as any)
          .from('subscriptions')
          .select('*')
          .eq('org_id', (orgMember as any).org_id)
          .single()

        if (sub) {
          setSubscription(sub)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  // Handle URL parameters for success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')

    if (success) {
      toast.success('Subscription activated successfully!')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh subscription data
      fetchSubscription()
    } else if (canceled) {
      toast.error('Subscription setup was canceled')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's organization
      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!orgMember) return

      // Get subscription
      const { data: sub, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('org_id', (orgMember as any).org_id)
        .single()

      if (sub) {
        setSubscription(sub)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (plan: PlanType) => {
    setProcessing(plan)
    try {
      // You'll need to replace these with your actual Stripe price IDs
      const priceIds: Record<PlanType, string> = {
        basic: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_basic',
        pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
        enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceIds[plan],
          plan: plan,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      // Redirect to Stripe Checkout
      const stripe = (await import('@stripe/stripe-js')).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      )

      if (stripe) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        })

        if (stripeError) {
          toast.error('Failed to redirect to checkout')
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error('Failed to start subscription process')
    } finally {
      setProcessing(null)
    }
  }

  const handleManageSubscription = async () => {
    setProcessing('manage')
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { url, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      toast.error('Failed to open customer portal')
    } finally {
      setProcessing(null)
    }
  }

  const handleUpgrade = async (plan: PlanType) => {
    try {
      if (!subscription) {
        toast.error('No subscription found. Please contact support.')
        return
      }

      toast.success(`Upgrading to ${STRIPE_PLANS[plan].name}...`)
      
      // Update subscription in database
      const { error } = await (supabase as any)
        .from('subscriptions')
        .update({ 
          plan: plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      if (error) {
        throw error
      }

      // Update local state
      setSubscription(prev => prev ? { ...prev, plan, updated_at: new Date().toISOString() } : null)
      
      toast.success(`Successfully upgraded to ${STRIPE_PLANS[plan].name}!`)
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Failed to upgrade plan. Please try again.')
    }
  }

  const handleCancel = async () => {
    try {
      if (!subscription) return

      toast.success('Canceling subscription...')
      
      // Update subscription in database
      const { error } = await (supabase as any)
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      if (error) {
        throw error
      }

      // Update local state
      setSubscription(prev => prev ? { ...prev, status: 'canceled', updated_at: new Date().toISOString() } : null)
      
      toast.success('Subscription canceled successfully')
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error('Failed to cancel subscription. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-gray-300 mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Plan</CardTitle>
            <CardDescription className="text-gray-300">
              Your current subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {STRIPE_PLANS[subscription.plan].name}
                </h3>
                <p className="text-gray-300">
                  ${STRIPE_PLANS[subscription.plan].price}/month
                </p>
                <p className={`text-sm ${
                  subscription.status === 'active' ? 'text-green-400' :
                  subscription.status === 'canceled' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  Status: {subscription.status}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={processing === 'manage'}
                >
                  {processing === 'manage' ? 'Opening...' : 'Manage Billing'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Available Plans</CardTitle>
          <CardDescription className="text-gray-300">
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(STRIPE_PLANS).map(([planKey, plan]) => {
              const isCurrentPlan = subscription?.plan === planKey
              const isUpgrade = !subscription || (
                planKey === 'pro' && subscription.plan === 'basic'
              ) || (
                planKey === 'enterprise' && subscription.plan !== 'enterprise'
              )

              return (
                <div
                  key={planKey}
                  className={`border rounded-lg p-6 bg-gray-700 ${
                    planKey === 'basic' ? 'border-yellow-400 border-2' : 'border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <div className="text-3xl font-bold text-yellow-400 mt-2">
                      ${plan.price}
                      <span className="text-lg text-gray-400">/month</span>
                    </div>
                  </div>
                  
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-300">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {subscription ? (
                      isCurrentPlan ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          disabled
                        >
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleSubscribe(planKey as PlanType)}
                          disabled={processing === planKey}
                        >
                          {processing === planKey ? 'Processing...' : 'Change Plan'}
                        </Button>
                      )
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(planKey as PlanType)}
                        disabled={processing === planKey}
                      >
                        {processing === planKey ? 'Processing...' : 'Subscribe'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Usage This Month</CardTitle>
          <CardDescription className="text-gray-300">
            Track your current usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">16</div>
                <div className="text-sm text-gray-300">AI Posts Generated</div>
                <div className="text-xs text-gray-400">
                  {subscription ? 
                    `${STRIPE_PLANS[subscription.plan].limits.postsPerMonth === -1 ? 'Unlimited' : STRIPE_PLANS[subscription.plan].limits.postsPerMonth} limit` :
                    '16 limit'
                  }
                </div>
              </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">1</div>
              <div className="text-sm text-gray-300">Organizations</div>
              <div className="text-xs text-gray-400">
                {subscription ? 
                  `${STRIPE_PLANS[subscription.plan].limits.organizations === -1 ? 'Unlimited' : STRIPE_PLANS[subscription.plan].limits.organizations} limit` :
                  '1 limit'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">2</div>
              <div className="text-sm text-gray-300">Social Accounts</div>
              <div className="text-xs text-gray-400">
                {subscription ? 
                  `${STRIPE_PLANS[subscription.plan].limits.socialAccounts === -1 ? 'Unlimited' : STRIPE_PLANS[subscription.plan].limits.socialAccounts} limit` :
                  '2 limit'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Billing History</CardTitle>
          <CardDescription className="text-gray-300">
            View your past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No billing history yet</p>
            <p className="text-sm text-gray-500">
              Your invoices and payment history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
