'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BlogPost, UsageStats, Organization, Client } from '@/types/index'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats>({
    postsThisMonth: 0,
    organizationsCount: 0,
    socialAccountsCount: 0,
  })
  const [adminStats, setAdminStats] = useState({
    totalOrganizations: 0,
    activeSubscriptions: 0,
    totalClients: 0,
    totalPosts: 0,
  })
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [allOrganizations, setAllOrganizations] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Check if user is admin
        const isAdminUser = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'
        setIsAdmin(isAdminUser)

        if (isAdminUser) {
          // Admin dashboard data
          const { data: allPosts } = await (supabase as any)
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

          const { data: totalOrgs } = await (supabase as any)
            .from('organizations')
            .select('id')

          const { data: activeSubs } = await (supabase as any)
            .from('subscriptions')
            .select('id')
            .eq('status', 'active')

          const { data: totalClients, error: clientsError } = await (supabase as any)
            .from('clients')
            .select('id')

          console.log('Admin clients count query:', { totalClients, clientsError })

          // Fetch all organizations with their subscriptions
          const { data: allOrgsWithSubs } = await (supabase as any)
            .from('organizations')
            .select(`
              id,
              name,
              plan,
              created_at,
              subscriptions(
                id,
                plan,
                status,
                created_at
              )
            `)
            .order('created_at', { ascending: false })

          // Fetch active users with subscriptions
          const { data: usersWithSubs } = await (supabase as any)
            .from('org_members')
            .select(`
              user_id,
              role,
              created_at,
              organizations(
                id,
                name,
                plan,
                created_at,
                subscriptions(
                  id,
                  plan,
                  status,
                  created_at
                )
              )
            `)
            .order('created_at', { ascending: false })

          setPosts(allPosts || [])
          setActiveUsers(usersWithSubs || [])
          setAllOrganizations(allOrgsWithSubs || [])
          setAdminStats({
            totalOrganizations: totalOrgs?.length || 0,
            activeSubscriptions: activeSubs?.length || 0,
            totalClients: totalClients?.length || 0,
            totalPosts: allPosts?.length || 0,
          })
        } else {
          // Regular user dashboard data - get user's organization first
          const { data: orgMember, error: orgError } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .single()

          if (orgMember && !orgError) {
            const { data: postsData, error: postsError } = await supabase
              .from('blog_posts')
              .select('*')
              .eq('org_id', orgMember.org_id)
              .order('created_at', { ascending: false })
              .limit(5)

            if (postsData) {
              setPosts(postsData)
            }
          }

          // Fetch usage stats
          const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
          
          const { data: postsThisMonth } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('org_id', orgMember?.org_id)
            .gte('created_at', `${currentMonth}-01`)

          const { data: organizations } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)

          const { data: socialConnections } = await supabase
            .from('social_connections')
            .select('id')
            .eq('org_id', orgMember?.org_id)

          const { data: telegramChannels } = await supabase
            .from('telegram_channels')
            .select('id')
            .eq('org_id', orgMember?.org_id)

          setUsageStats({
            postsThisMonth: postsThisMonth?.length || 0,
            organizationsCount: organizations?.length || 0,
            socialAccountsCount: (socialConnections?.length || 0) + (telegramChannels?.length || 0),
          })
        }
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
        <h1 className="text-3xl font-bold text-white">
          {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-gray-300 mt-2">
          {isAdmin 
            ? 'System overview and management tools for Timeline Alchemy.'
            : 'Welcome back! Here\'s what\'s happening with your content.'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isAdmin ? (
          <>
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Total Organizations</CardTitle>
                    <span className="text-2xl">🏢</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">{adminStats.totalOrganizations}</div>
                    <p className="text-xs text-gray-300">
                      All registered organizations
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Active Subscriptions</CardTitle>
                    <span className="text-2xl">💳</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">{adminStats.activeSubscriptions}</div>
                    <p className="text-xs text-gray-300">
                      Paying customers
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Total Clients</CardTitle>
                    <span className="text-2xl">👥</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">{adminStats.totalClients}</div>
                    <p className="text-xs text-gray-300">
                      Client accounts
                    </p>
                  </CardContent>
                </Card>
          </>
        ) : (
          <>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Posts This Month</CardTitle>
                <span className="text-2xl">📝</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{usageStats.postsThisMonth}</div>
                <p className="text-xs text-gray-300">
                  AI-generated content created
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Organizations</CardTitle>
                <span className="text-2xl">🏢</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{usageStats.organizationsCount}</div>
                <p className="text-xs text-gray-300">
                  Active organizations
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Social Accounts</CardTitle>
                <span className="text-2xl">🔗</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{usageStats.socialAccountsCount}</div>
                <p className="text-xs text-gray-300">
                  Connected platforms
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isAdmin ? 'Admin Actions' : 'Quick Actions'}
          </CardTitle>
          <CardDescription className="text-gray-200">
            {isAdmin 
              ? 'System management and monitoring tools'
              : 'Get started with creating new content'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {isAdmin ? (
              <>
                <Link href="/dashboard/organizations">
                  <Button>Manage Organizations</Button>
                </Link>
                <Link href="/dashboard/subscriptions">
                  <Button variant="outline">View Subscriptions</Button>
                </Link>
                <Link href="/dashboard/clients">
                  <Button variant="outline">Manage Clients</Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button variant="outline">System Analytics</Button>
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>


          {/* Recent Posts */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                {isAdmin ? 'All Recent Posts' : 'Recent Posts'}
              </CardTitle>
              <CardDescription className="text-gray-200">
                {isAdmin 
                  ? 'Latest content from all organizations'
                  : 'Your latest content creations'
                }
              </CardDescription>
            </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No posts yet</p>
              <Link href="/dashboard/content/new">
                <Button>Create Your First Post</Button>
              </Link>
            </div>
          ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{post.title}</h3>
                          <p className="text-sm text-gray-200 mt-1 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-300">
                            <span className={`px-2 py-1 rounded-full ${
                              post.state === 'published' ? 'bg-green-900 text-green-300' :
                              post.state === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-gray-700 text-gray-200'
                            }`}>
                              {post.state}
                            </span>
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link href={`/dashboard/content/package/${post.id}`}>
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
