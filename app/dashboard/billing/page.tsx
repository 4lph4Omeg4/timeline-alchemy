'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { STRIPE_PLANS, StripePlanType } from '@/lib/stripe'
import { Subscription, PlanType } from '@/types/index'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [trialStatus, setTrialStatus] = useState<any>(null)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  // ... (existing code)

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's organizations
      const { data: orgMembers } = await (supabase as any)
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (!orgMembers || orgMembers.length === 0) return

      // Find the user's personal organization (not Admin Organization)
      let userOrgId = orgMembers.find((member: any) => member.role !== 'client')?.org_id
      if (!userOrgId) {
        userOrgId = orgMembers[0].org_id
      }

      // Get subscription
      const { data: sub, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('org_id', userOrgId)
        .single()

      if (sub) {
        setSubscription(sub)

        // Get trial status
        const trialResponse = await fetch(`/api/trial/status?orgId=${userOrgId}`)
        if (trialResponse.ok) {
          const trialData = await trialResponse.json()
          setTrialStatus(trialData)
        }

        // Get usage stats
        const usageResponse = await fetch(`/api/usage?orgId=${userOrgId}`)
        if (usageResponse.ok) {
          const usageData = await usageResponse.json()
          setUsageStats(usageData)
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  // ... (existing code)

  {/* Usage Stats */ }
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
          <div className="text-2xl font-bold text-yellow-400">
            {usageStats?.contentPackages?.used || 0}
          </div>
          <div className="text-sm text-gray-300">Content Packages</div>
          <div className="text-xs text-gray-400">
            {usageStats?.contentPackages?.limit === -1 ? 'Unlimited' : `${usageStats?.contentPackages?.limit || 0} limit`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {usageStats?.customContent?.used || 0}
          </div>
          <div className="text-sm text-gray-300">Custom Content</div>
          <div className="text-xs text-gray-400">
            {usageStats?.customContent?.limit === -1 ? 'Unlimited' : `${usageStats?.customContent?.limit || 0} limit`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {usageStats?.bulkGeneration?.used || 0}
          </div>
          <div className="text-sm text-gray-300">Bulk Generations</div>
          <div className="text-xs text-gray-400">
            {usageStats?.bulkGeneration?.limit === -1 ? 'Unlimited' : `${usageStats?.bulkGeneration?.limit || 0} limit`}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  const handleSubscribe = async (plan: PlanType) => {
    setProcessing(plan)
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to subscribe')
        return
      }

      // You'll need to replace these with your actual Stripe price IDs
      const priceIds: Record<PlanType, string> = {
        trial: 'trial_free', // Trial is free, no Stripe price needed
        basic: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_basic',
        initiate: process.env.NEXT_PUBLIC_STRIPE_INITIATE_PRICE_ID || 'price_initiate',
        transcendant: process.env.NEXT_PUBLIC_STRIPE_TRANSCENDANT_PRICE_ID || 'price_transcendant',
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceIds[plan],
          plan: plan,
          userId: user.id,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      // Redirect to Stripe Checkout
      const { loadStripe } = await import('@stripe/stripe-js')
      const stripe = await loadStripe(
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
      // Try the API first, but fallback to direct billing link
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { url, error } = await response.json()

      if (error || !url) {
        // Fallback to direct billing link
        console.log('API failed, using direct billing link')
        window.open('https://billing.stripe.com/p/login/eVqfZj1tyaVQgkH1CteAg00', '_blank')
        toast.success('Opening billing portal...')
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      // Fallback to direct billing link
      window.open('https://billing.stripe.com/p/login/eVqfZj1tyaVQgkH1CteAg00', '_blank')
      toast.success('Opening billing portal...')
    } finally {
      setProcessing(null)
    }
  }

  const handleChangePlan = async (newPlan: PlanType) => {
    if (!subscription) {
      toast.error('No subscription found. Please contact support.')
      return
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to change plans')
      return
    }

    setProcessing(newPlan)
    try {
      const response = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPlan: newPlan,
          userId: user.id,
        }),
      })

      const { success, message, error, redirectToCheckout } = await response.json()

      if (error) {
        if (redirectToCheckout) {
          // If it's a trial subscription, redirect to checkout instead
          toast.error('Trial subscription detected. Redirecting to checkout...')
          await handleSubscribe(newPlan)
          return
        }
        toast.error(error)
        return
      }

      if (success) {
        toast.success(message || `Successfully changed to ${STRIPE_PLANS[newPlan].name}!`)
        // Refresh subscription data
        await fetchSubscription()
      }
    } catch (error) {
      console.error('Error changing plan:', error)
      toast.error('Failed to change plan. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleCancel = async () => {
    if (!subscription) return

    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    setProcessing('cancel')
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { success, message, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success(message || 'Subscription canceled successfully')
        // Refresh subscription data
        await fetchSubscription()
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error('Failed to cancel subscription. Please try again.')
    } finally {
      setProcessing(null)
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
                  {STRIPE_PLANS[subscription.plan as StripePlanType]?.name || subscription.plan}
                </h3>
                <p className="text-gray-300">
                  €{STRIPE_PLANS[subscription.plan as StripePlanType]?.price || 'N/A'}/month
                </p>
                <p className={`text-sm ${subscription.status === 'active' ? 'text-green-400' :
                  subscription.status === 'trialing' ? 'text-blue-400' :
                    subscription.status === 'canceled' ? 'text-red-400' :
                      'text-yellow-400'
                  }`}>
                  Status: {subscription.status === 'trialing' ? 'Trial' : subscription.status}
                  {subscription.status === 'trialing' && (
                    <span className="block text-xs text-gray-400 mt-1">
                      Subscribe to continue after trial
                    </span>
                  )}
                </p>

                {/* Trial Status */}
                {trialStatus && trialStatus.isTrial && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-blue-200 font-semibold">🎉 Free Trial Active</h4>
                        <p className="text-blue-300 text-sm">
                          {trialStatus.daysRemaining > 0
                            ? `${trialStatus.daysRemaining} days remaining`
                            : 'Trial expired'
                          }
                        </p>
                      </div>
                      {trialStatus.daysRemaining > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-blue-400">
                            Trial ends: {subscription.trial_end_date ? new Date(subscription.trial_end_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={processing === 'manage'}
                >
                  {processing === 'manage' ? 'Opening...' : 'Manage Billing'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const portalLink = process.env.NEXT_PUBLIC_STRIPE_PRICING_PORTAL || 'https://pay.timeline-alchemy.nl/p/login/eVqfZj1tyaVQgkH1CteAg00'
                    window.open(portalLink, '_blank')
                  }}
                  className="text-green-400 border-green-400 hover:bg-green-400/20"
                >
                  ✨ View Plans & Upgrade
                </Button>
                {subscription.status === 'active' && (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={processing === 'cancel'}
                  >
                    {processing === 'cancel' ? 'Canceling...' : 'Cancel'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Information Banner */}
      <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Start with a Free Trial!</h3>
              <p className="text-blue-200 mb-3">
                Every new member begins with a <span className="font-semibold text-yellow-300">2-week free trial period</span>.
                Explore the platform with 2 content packages, 5 custom content generations, and 1 bulk generation to experience what Timeline Alchemy can do for you.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full">✓ 2 Content Packages</span>
                <span className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full">✓ 5 Custom Generations</span>
                <span className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full">✓ 1 Bulk Generation</span>
                <span className="bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full">✓ 14 Days Free</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Available Plans</CardTitle>
          <CardDescription className="text-gray-300">
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(STRIPE_PLANS).filter(([planKey]) => planKey !== 'trial').map(([planKey, plan]) => {
              const isCurrentPlan = subscription?.plan === planKey
              const planType = planKey as PlanType

              return (
                <div
                  key={planKey}
                  className={`border rounded-lg p-6 bg-gray-700 ${planKey === 'transcendant' ? 'border-purple-400 border-2' : 'border-gray-600'
                    }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <div className="text-3xl font-bold text-yellow-400 mt-2">
                      €{plan.price}
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
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                          onClick={() => handleChangePlan(planType)}
                          disabled={processing === planKey}
                        >
                          {processing === planKey ? 'Processing...' :
                            subscription.stripe_customer_id.startsWith('temp-') ? 'Subscribe' : 'Change Plan'}
                        </Button>
                      )
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                        onClick={() => handleSubscribe(planType)}
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
              <div className="text-2xl font-bold text-yellow-400">4</div>
              <div className="text-sm text-gray-300">Content Packages</div>
              <div className="text-xs text-gray-400">
                {subscription ?
                  `${STRIPE_PLANS[subscription.plan as StripePlanType]?.limits.contentPackages === -1 ? 'Unlimited' : STRIPE_PLANS[subscription.plan as StripePlanType]?.limits.contentPackages || 0} limit` :
                  '4 limit'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">2</div>
              <div className="text-sm text-gray-300">Custom Content</div>
              <div className="text-xs text-gray-400">
                {subscription ?
                  `${STRIPE_PLANS[subscription.plan as StripePlanType]?.limits.customContent === -1 ? 'Unlimited' : STRIPE_PLANS[subscription.plan as StripePlanType]?.limits.customContent || 0} limit` :
                  '0 limit'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">0</div>
              <div className="text-sm text-gray-300">Bulk Generations</div>
              <div className="text-xs text-gray-400">
                {subscription ?
                  `${STRIPE_PLANS[subscription.plan as StripePlanType]?.limits.bulkGeneration === -1 ? 'Unlimited' : STRIPE_PLANS[subscription.plan as StripePlanType]?.limits.bulkGeneration || 0} limit` :
                  '0 limit'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Portal Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">💳 Billing Portal Access</CardTitle>
          <CardDescription className="text-gray-300">
            Manage your subscription, payment methods, and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">What you can do:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Change your subscription plan
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Update payment methods
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  View billing history & invoices
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Download receipts
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Cancel subscription
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Access:</h4>
              <div className="space-y-3">
                <Button
                  onClick={handleManageSubscription}
                  disabled={processing === 'manage'}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  {processing === 'manage' ? 'Opening...' : '🚀 Manage Current Subscription'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const portalLink = process.env.NEXT_PUBLIC_STRIPE_PRICING_PORTAL || 'https://pay.timeline-alchemy.nl/p/login/eVqfZj1tyaVQgkH1CteAg00'
                    window.open(portalLink, '_blank')
                  }}
                  className="w-full text-green-400 border-green-400 hover:bg-green-400/20"
                >
                  ✨ View All Plans & Upgrade
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Manage your existing subscription or browse available plans
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
