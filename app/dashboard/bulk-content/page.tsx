'use client'

import BulkContentGenerator from '@/components/bulk-content-generator'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BulkContentPage() {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<string>('')
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/dashboard')
          return
        }

        // Check if admin
        const isAdmin = user.email?.includes('sh4m4ni4k@sh4m4ni4k.nl')
        
        if (!isAdmin) {
          // For non-admin users, check their plan
          const { data: orgMembers } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)

          if (orgMembers && orgMembers.length > 0) {
            const orgId = orgMembers[0].org_id

            // Get subscription/plan
            const { data: subscription } = await (supabase as any)
              .from('subscriptions')
              .select('plan')
              .eq('org_id', orgId)
              .single()

            if (subscription) {
              setUserPlan(subscription.plan)
              
              // Get plan limits and current usage
              const { data: planFeatures } = await (supabase as any)
                .from('plan_features')
                .select('bulk_generation_limit')
                .eq('plan_name', subscription.plan)
                .single()
              
              const { data: usage } = await (supabase as any)
                .from('organization_usage')
                .select('bulk_generation_used')
                .eq('org_id', orgId)
                .single()
              
              const used = usage?.bulk_generation_used || 0
              const limit = planFeatures?.bulk_generation_limit || 0
              
              setUsageInfo({ used, limit })
              
              // Trial and Universal plans have access to bulk content
              // BUT trial users must not exceed their limit
              if (subscription.plan === 'universal') {
                // Universal = unlimited
                setHasAccess(true)
              } else if (subscription.plan === 'trial') {
                // Trial = 1 bulk generation
                if (used < limit) {
                  setHasAccess(true)
                } else {
                  setHasAccess(false)
                }
              } else {
                setHasAccess(false)
              }
            } else {
              setHasAccess(false)
            }
          }
        } else {
          // Admin always has access
          setHasAccess(true)
        }
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-purple-400 mx-auto animate-pulse" />
            <p className="text-gray-300">Checking admin permissions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 max-w-2xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Shield className="h-16 w-16 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">
                  {userPlan === 'trial' && usageInfo 
                    ? 'Trial Limit Reached' 
                    : 'Bulk Content Unavailable'}
                </h2>
                <p className="text-gray-300">
                  {userPlan === 'trial' && usageInfo 
                    ? `You've used your ${usageInfo.limit} bulk generation(s) for the trial period. Upgrade to Universal plan for unlimited bulk generations.`
                    : 'Bulk Content Generation is available for Trial (1x) and Universal (unlimited) plans.'}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-purple-300 font-semibold">Current Plan: {userPlan || 'Unknown'}</p>
                  <p className="text-purple-300 font-semibold">Upgrade to Universal to unlock:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>✓ Unlimited bulk content generations</li>
                    <li>✓ Custom branding & watermarks</li>
                    <li>✓ Unlimited content packages</li>
                    <li>✓ Priority support</li>
                  </ul>
                  <button
                    onClick={() => router.push('/dashboard/billing')}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all"
                  >
                    View Plans & Upgrade
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          ✨ Bulk Content Generator
        </h1>
        <p className="text-gray-300 mt-2">
          Generate multiple blog posts from your Grok trends data automatically with Timeline Alchemy magic
        </p>
        
        {/* Usage Info for Trial Users */}
        {userPlan === 'trial' && usageInfo && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Trial Usage</p>
                <p className="text-gray-300 text-sm">
                  {usageInfo.used} of {usageInfo.limit} bulk generation(s) used
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${usageInfo.used < usageInfo.limit ? 'text-green-400' : 'text-red-400'}`}>
                  {usageInfo.limit - usageInfo.used}
                </p>
                <p className="text-gray-400 text-xs">remaining</p>
              </div>
            </div>
            {usageInfo.used === usageInfo.limit - 1 && (
              <p className="mt-2 text-sm text-yellow-300">
                ⚠️ This is your last bulk generation. Upgrade to Universal for unlimited access.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Generator Component */}
      <BulkContentGenerator />
    </div>
  )
}
