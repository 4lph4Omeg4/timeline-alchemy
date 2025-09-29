'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BlogPost } from '@/types/index'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default function SchedulerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('list')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

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

        // Get all organization IDs the user belongs to
        const orgIds = orgMembers.map(member => member.org_id)

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
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
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update({
          state: 'scheduled',
          scheduled_for: scheduledFor,
        })
        .eq('id', postId)

      if (error) {
        console.error('Error scheduling post:', error)
      } else {
        // Refresh posts - get user's orgs first
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: orgMembers } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', user.id)
          
          if (orgMembers && orgMembers.length > 0) {
            // Get all organization IDs the user belongs to
            const orgIds = orgMembers.map(member => member.org_id)
            
            const { data } = await supabase
              .from('blog_posts')
              .select('*')
              .in('org_id', orgIds)
              .order('scheduled_for', { ascending: true })
            
            setPosts(data || [])
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
        // Refresh posts - get user's orgs first
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: orgMembers } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', user.id)
          
          if (orgMembers && orgMembers.length > 0) {
            // Get all organization IDs the user belongs to
            const orgIds = orgMembers.map(member => member.org_id)
            
            const { data } = await supabase
              .from('blog_posts')
              .select('*')
              .in('org_id', orgIds)
              .order('scheduled_for', { ascending: true })
            
            setPosts(data || [])
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
            className={view === 'calendar' ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
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
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => handlePublishNow(post.id)}
                            >
                              Publish Now
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
            <CardTitle className="text-white">Calendar View</CardTitle>
            <CardDescription className="text-gray-200">
              Visual calendar of your scheduled content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">Calendar view coming soon!</p>
              <p className="text-sm text-gray-400">
                This will show a visual calendar with scheduled posts
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
