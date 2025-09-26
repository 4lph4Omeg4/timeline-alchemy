'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { STRIPE_PLANS, PlanType } from '@/lib/stripe'
import { Subscription } from '@/types/index'
import toast from 'react-hot-toast'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

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
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('org_id', orgMember.org_id)
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

  const handleUpgrade = async (plan: PlanType) => {
    try {
      if (!subscription) {
        toast.error('No subscription found. Please contact support.')
        return
      }

      toast.success(`Upgrading to ${STRIPE_PLANS[plan].name}...`)
      
      // Update subscription in database
      const { error } = await supabase
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
      const { error } = await supabase
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
                {subscription.status === 'active' && (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel Subscription
                  </Button>
                )}
                <Button variant="outline">
                  Manage Billing
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
                    planKey === 'pro' ? 'border-yellow-400 border-2' : 'border-gray-600'
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
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan}
                      onClick={() => handleUpgrade(planKey as PlanType)}
                    >
                      {isCurrentPlan ? 'Current Plan' : 
                       isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </Button>
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
