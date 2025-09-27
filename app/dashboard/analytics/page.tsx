'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalOrganizations: 0,
    activeSubscriptions: 0,
    totalClients: 0,
    totalPosts: 0,
    postsThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all analytics data
        const [
          { data: orgs },
          { data: subs },
          { data: clients },
          { data: posts },
        ] = await Promise.all([
          supabase.from('organizations').select('id'),
          supabase.from('subscriptions').select('id').eq('status', 'active'),
          supabase.from('clients').select('id'),
          supabase.from('blog_posts').select('id, created_at'),
        ])

        // Calculate posts this month
        const currentMonth = new Date().toISOString().slice(0, 7)
        const postsThisMonth = posts?.filter(post => 
          (post as any).created_at.startsWith(currentMonth)
        ).length || 0

        setAnalytics({
          totalOrganizations: orgs?.length || 0,
          activeSubscriptions: subs?.length || 0,
          totalClients: clients?.length || 0,
          totalPosts: posts?.length || 0,
          postsThisMonth,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

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
        <h1 className="text-3xl font-bold text-white">System Analytics</h1>
        <p className="text-gray-300 mt-2">
          Overview of system performance and usage
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Organizations</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{analytics.totalOrganizations}</div>
            <p className="text-xs text-gray-400">
              All registered organizations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Subscriptions</CardTitle>
            <span className="text-2xl">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{analytics.activeSubscriptions}</div>
            <p className="text-xs text-gray-400">
              Paying customers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Clients</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{analytics.totalClients}</div>
            <p className="text-xs text-gray-400">
              Client accounts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Posts This Month</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{analytics.postsThisMonth}</div>
            <p className="text-xs text-gray-400">
              AI-generated content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Content Generation Stats</CardTitle>
          <CardDescription className="text-gray-300">
            AI content creation metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{analytics.totalPosts}</div>
              <div className="text-sm text-gray-300">Total Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {analytics.totalOrganizations > 0 ? Math.round(analytics.totalPosts / analytics.totalOrganizations) : 0}
              </div>
              <div className="text-sm text-gray-300">Avg Posts per Organization</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue Overview</CardTitle>
          <CardDescription className="text-gray-300">
            Subscription revenue metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Revenue analytics coming soon</p>
            <p className="text-sm text-gray-500">
              Detailed revenue tracking and reporting will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
