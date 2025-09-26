'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BlogPost, UsageStats } from '@/types/index'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats>({
    postsThisMonth: 0,
    organizationsCount: 0,
    socialAccountsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent posts
        const { data: postsData, error: postsError } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (postsData) {
          setPosts(postsData)
        }

        // Fetch usage stats
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
        
        const { data: postsThisMonth } = await supabase
          .from('blog_posts')
          .select('id')
          .gte('created_at', `${currentMonth}-01`)

        const { data: organizations } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

        const { data: socialConnections } = await supabase
          .from('social_connections')
          .select('id')

        setUsageStats({
          postsThisMonth: postsThisMonth?.length || 0,
          organizationsCount: organizations?.length || 0,
          socialAccountsCount: socialConnections?.length || 0,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening with your content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.postsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated content created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.organizationsCount}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Accounts</CardTitle>
            <span className="text-2xl">🔗</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.socialAccountsCount}</div>
            <p className="text-xs text-muted-foreground">
              Connected platforms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with creating new content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/content/new">
              <Button>Create New Post</Button>
            </Link>
            <Link href="/dashboard/schedule">
              <Button variant="outline">Schedule Content</Button>
            </Link>
            <Link href="/dashboard/socials">
              <Button variant="outline">Connect Socials</Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline">Manage Billing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>
            Your latest content creations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No posts yet</p>
              <Link href="/dashboard/content/new">
                <Button>Create Your First Post</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{post.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${
                          post.state === 'published' ? 'bg-green-100 text-green-800' :
                          post.state === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.state}
                        </span>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/dashboard/content/${post.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
