'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BlogPost } from '@/types'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default function SchedulerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('list')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
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
      const { error } = await supabase
        .from('blog_posts')
        .update({
          state: 'scheduled',
          scheduled_for: scheduledFor,
        })
        .eq('id', postId)

      if (error) {
        console.error('Error scheduling post:', error)
      } else {
        // Refresh posts
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .order('scheduled_for', { ascending: true })
        
        setPosts(data || [])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }

  const handlePublishNow = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          state: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', postId)

      if (error) {
        console.error('Error publishing post:', error)
      } else {
        // Refresh posts
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .order('scheduled_for', { ascending: true })
        
        setPosts(data || [])
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
          <h1 className="text-3xl font-bold text-gray-900">Content Scheduler</h1>
          <p className="text-gray-600 mt-2">
            Manage and schedule your content across all platforms
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            List View
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            onClick={() => setView('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.state === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.state === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.state === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
            <CardDescription>
              Manage your content posts and their scheduling
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
                          {post.scheduled_for && (
                            <span>Scheduled: {formatDateTime(post.scheduled_for)}</span>
                          )}
                          {post.published_at && (
                            <span>Published: {formatDateTime(post.published_at)}</span>
                          )}
                          <span>Created: {formatDateTime(post.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        {post.state === 'draft' && (
                          <>
                            <Button
                              size="sm"
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
                              variant="outline"
                              onClick={() => handlePublishNow(post.id)}
                            >
                              Publish Now
                            </Button>
                          </>
                        )}
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              Visual calendar of your scheduled content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Calendar view coming soon!</p>
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
