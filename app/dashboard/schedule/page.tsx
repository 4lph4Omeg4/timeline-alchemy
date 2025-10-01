'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BlogPost } from '@/types/index'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { SocialIcon } from '@/components/ui/social-icons'

export default function SchedulerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, firstDay, lastDay }
  }

  const getPostsForDate = (date: Date) => {
    // Use local date string instead of UTC
    const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD format in local timezone
    return posts.filter(post => {
      if (!post.scheduled_for) return false
      // Convert scheduled_for to local date string
      const scheduledDate = new Date(post.scheduled_for).toLocaleDateString('en-CA')
      return scheduledDate === dateStr
    })
  }

  const getGroupedPostsForDate = (date: Date) => {
    const dayPosts = getPostsForDate(date)
    
    // Group posts by organization
    const grouped = dayPosts.reduce((acc, post) => {
      const orgName = post.organizations?.name || 'Unknown Organization'
      const orgId = post.org_id
      
      if (!acc[orgId]) {
        acc[orgId] = {
          organization: orgName,
          posts: []
        }
      }
      
      acc[orgId].posts.push(post)
      return acc
    }, {} as Record<string, { organization: string; posts: any[] }>)
    
    return Object.values(grouped)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Check if user is admin
        const isAdmin = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'

        // Get user's organization
        const { data: orgMembers, error: orgError } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)

        if (orgError || !orgMembers || orgMembers.length === 0) {
          console.error('Error getting user organizations:', orgError)
          setLoading(false)
          return
        }

        let orgIds: string[]

        if (isAdmin) {
          // Admin can see all posts from all organizations - get all org IDs
          const { data: allOrgs } = await supabase
            .from('organizations')
            .select('id')
          
          orgIds = allOrgs?.map(org => org.id) || []
        } else {
          // Non-admin users only see posts from their primary organization (not Admin Organization)
          const nonAdminOrgs = orgMembers.filter(member => {
            // Get organization name to filter out Admin Organization
            return member.org_id // We'll filter this further below
          })
          
          // Get organization names to filter out Admin Organization
          const orgIdsToCheck = nonAdminOrgs.map(member => member.org_id)
          const { data: orgsData } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', orgIdsToCheck)
          
          // Filter out Admin Organization
          const nonAdminOrgIds = orgsData
            ?.filter(org => org.name !== 'Admin Organization')
            .map(org => org.id) || []
          
          orgIds = nonAdminOrgIds
        }

        if (orgIds.length === 0) {
          setPosts([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            organizations (
              id,
              name
            )
          `)
          .in('org_id', orgIds)
          .order('scheduled_for', { ascending: true })

        if (error) {
          console.error('Error fetching posts:', error)
        } else {
          setPosts(data || [])
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleSchedulePost = async (postId: string, scheduledFor: string) => {
    try {
      // Convert local datetime to UTC for database storage
      const scheduledDate = new Date(scheduledFor)
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update({
          state: 'scheduled',
          scheduled_for: scheduledDate.toISOString(),
        })
        .eq('id', postId)

      if (error) {
        console.error('Error scheduling post:', error)
      } else {
        // Refresh posts with same logic as initial fetch
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const isAdmin = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'
          
          const { data: orgMembers } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', user.id)
          
          if (orgMembers && orgMembers.length > 0) {
            let orgIds: string[]

            if (isAdmin) {
              // Admin can see all posts from all organizations
              const { data: allOrgs } = await supabase
                .from('organizations')
                .select('id')
              
              orgIds = allOrgs?.map(org => org.id) || []
            } else {
              const orgIdsToCheck = orgMembers.map(member => member.org_id)
              const { data: orgsData } = await supabase
                .from('organizations')
                .select('id, name')
                .in('id', orgIdsToCheck)
              
              const nonAdminOrgIds = orgsData
                ?.filter(org => org.name !== 'Admin Organization')
                .map(org => org.id) || []
              
              orgIds = nonAdminOrgIds
            }

            if (orgIds.length > 0) {
            const { data } = await supabase
              .from('blog_posts')
              .select(`
                *,
                organizations (
                  id,
                  name
                )
              `)
              .in('org_id', orgIds)
              .order('scheduled_for', { ascending: true })
            
            setPosts(data || [])
            }
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }

  const handlePublishNow = async (postId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update({
          state: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', postId)

      if (error) {
        console.error('Error publishing post:', error)
      } else {
        // Refresh posts with same logic as initial fetch
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const isAdmin = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'
          
          const { data: orgMembers } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', user.id)
          
          if (orgMembers && orgMembers.length > 0) {
            let orgIds: string[]

            if (isAdmin) {
              // Admin can see all posts from all organizations
              const { data: allOrgs } = await supabase
                .from('organizations')
                .select('id')
              
              orgIds = allOrgs?.map(org => org.id) || []
            } else {
              const orgIdsToCheck = orgMembers.map(member => member.org_id)
              const { data: orgsData } = await supabase
                .from('organizations')
                .select('id, name')
                .in('id', orgIdsToCheck)
              
              const nonAdminOrgIds = orgsData
                ?.filter(org => org.name !== 'Admin Organization')
                .map(org => org.id) || []
              
              orgIds = nonAdminOrgIds
            }

            if (orgIds.length > 0) {
            const { data } = await supabase
              .from('blog_posts')
              .select(`
                *,
                organizations (
                  id,
                  name
                )
              `)
              .in('org_id', orgIds)
              .order('scheduled_for', { ascending: true })
            
            setPosts(data || [])
            }
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Scheduler</h1>
          <p className="text-gray-200 mt-2">
            Manage and schedule your content across all platforms
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            className={view === 'list' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            onClick={() => setView('list')}
          >
            List View
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            className={view === 'calendar' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            onClick={() => setView('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{posts.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {posts.filter(p => p.state === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {posts.filter(p => p.state === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {posts.filter(p => p.state === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">All Posts</CardTitle>
            <CardDescription className="text-gray-200">
              Manage your content posts and their scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">No posts yet</p>
                <Link href="/dashboard/content/new">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-500">Create Your First Post</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-700 rounded-lg p-6 bg-gray-800 hover:bg-gray-750 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{post.title}</h3>
                        <p className="text-sm text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-xs">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            post.state === 'published' ? 'bg-green-900 text-green-300' :
                            post.state === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {post.state}
                          </span>
                          {post.scheduled_for && (
                            <span className="text-gray-400">Scheduled: {formatDateTime(post.scheduled_for)}</span>
                          )}
                          {post.published_at && (
                            <span className="text-gray-400">Published: {formatDateTime(post.published_at)}</span>
                          )}
                          <span className="text-gray-400">Created: {formatDateTime(post.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        {post.state === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-yellow-400 text-black hover:bg-yellow-500"
                              onClick={() => {
                                const scheduledFor = prompt('Enter scheduled date (YYYY-MM-DD HH:MM):')
                                if (scheduledFor) {
                                  handleSchedulePost(post.id, scheduledFor)
                                }
                              }}
                            >
                              Schedule
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                              onClick={() => handlePublishNow(post.id)}
                            >
                              ✨ Publish Now ✨
                            </Button>
                          </>
                        )}
                        <Link href={`/dashboard/content/package/${post.id}`}>
                          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
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
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">📅 Calendar View</CardTitle>
            <CardDescription className="text-gray-200">
              Visual calendar of your scheduled content
            </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
                >
                  ←
                </Button>
                <h3 className="text-lg font-semibold text-white min-w-[200px] text-center">
                  {formatMonthYear(currentDate)}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
                >
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-400 border-b border-gray-700">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {(() => {
                  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
                  const today = new Date()
                  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
                  
                  const days = []
                  
                  // Empty cells for days before the first day of the month
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(
                      <div key={`empty-${i}`} className="h-24 border border-gray-700 bg-gray-800/50"></div>
                    )
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const groupedPosts = getGroupedPostsForDate(date)
                    const totalPosts = groupedPosts.reduce((sum, group) => sum + group.posts.length, 0)
                    const isToday = isCurrentMonth && day === today.getDate()
                    const isSelected = selectedDate && 
                      date.getDate() === selectedDate.getDate() && 
                      date.getMonth() === selectedDate.getMonth() && 
                      date.getFullYear() === selectedDate.getFullYear()
                    
                    days.push(
                      <div
                        key={day}
                        className={`h-24 border border-gray-700 p-1 cursor-pointer transition-all duration-200 hover:bg-purple-600/20 ${
                          isToday ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-purple-500' : ''
                        } ${
                          isSelected ? 'bg-gradient-to-br from-purple-600/50 to-pink-600/50 border-purple-400' : ''
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-yellow-400' : 'text-white'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {groupedPosts.slice(0, 2).map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded truncate"
                              title={`${group.organization}: ${group.posts.length} posts`}
                            >
                              <div className="font-semibold truncate">{group.organization}</div>
                              <div className="text-purple-200 text-xs">
                                {group.posts.length} post{group.posts.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          ))}
                          {groupedPosts.length > 2 && (
                            <div className="text-xs text-purple-300">
                              +{groupedPosts.length - 2} more clients
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  return days
                })()}
              </div>
              
              {/* Selected Date Details */}
              {selectedDate && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-3">
                    📅 {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  {(() => {
                    const groupedPosts = getGroupedPostsForDate(selectedDate)
                    const totalPosts = groupedPosts.reduce((sum, group) => sum + group.posts.length, 0)
                    
                    return groupedPosts.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-purple-200 font-medium">
                          {totalPosts} scheduled post{totalPosts !== 1 ? 's' : ''} from {groupedPosts.length} client{groupedPosts.length !== 1 ? 's' : ''}
                        </p>
                        {groupedPosts.map((group, groupIndex) => (
                          <div key={groupIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-lg">🏢</span>
                              <h4 className="font-semibold text-white text-lg">{group.organization}</h4>
                              <span className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full">
                                {group.posts.length} post{group.posts.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {group.posts.map((post) => {
                                // Determine platform based on title
                                const getPlatform = (title: string) => {
                                  const lowerTitle = title.toLowerCase()
                                  if (lowerTitle.includes('facebook')) return 'facebook'
                                  if (lowerTitle.includes('instagram')) return 'instagram'
                                  if (lowerTitle.includes('twitter') || lowerTitle.includes('x')) return 'twitter'
                                  if (lowerTitle.includes('linkedin')) return 'linkedin'
                                  if (lowerTitle.includes('discord')) return 'discord'
                                  if (lowerTitle.includes('reddit')) return 'reddit'
                                  if (lowerTitle.includes('youtube')) return 'youtube'
                                  return 'blog' // Default for blog posts
                                }
                                
                                const platform = getPlatform(post.title)
                                
                                return (
                                  <div key={post.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-500">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          {platform === 'blog' ? (
                                            <span className="text-sm">📝</span>
                                          ) : (
                                            <SocialIcon platform={platform} size="sm" className="text-white" />
                                          )}
                                          <h5 className="font-semibold text-white text-sm">{post.title}</h5>
                                        </div>
                                        <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                                          {post.content}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            post.state === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                                            post.state === 'published' ? 'bg-green-900 text-green-300' :
                                            'bg-gray-700 text-gray-300'
                                          }`}>
                                            {post.state}
                                          </span>
                                          <span className="text-gray-400 text-xs">
                                            {formatDateTime(post.scheduled_for || '')}
                                          </span>
                                        </div>
                                      </div>
                                      <Link href={`/dashboard/content/package/${post.id}`}>
                                        <Button size="sm" variant="outline" className="ml-2 border-purple-500/50 text-purple-300 hover:bg-purple-600/30">
                                          View
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 mb-3">No posts scheduled for this date</p>
                        <Link href="/dashboard/content/new">
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50">
                            ✨ Create New Post ✨
                          </Button>
                        </Link>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
