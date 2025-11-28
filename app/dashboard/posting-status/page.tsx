'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/Loader'

interface Post {
  id: string
  title: string
  content: string
  social_posts: any
  scheduled_for: string | null
  published_at: string | null
  state: 'draft' | 'scheduled' | 'published'
  created_at: string
  organizations: {
    id: string
    name: string
  }
}

interface PostSummary {
  total: number
  scheduled: number
  posted: number
  failed: number
  partial: number
}

export default function PostingStatusDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [summary, setSummary] = useState<PostSummary>({ total: 0, scheduled: 0, posted: 0, failed: 0, partial: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState<string | null>(null)

  const supabaseClient = supabase

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      // Get user's organization (owner role only)
      const { data: userOrg } = await (supabaseClient as any)
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (!userOrg) {
        setError('No organization found')
        return
      }

      // Fetch posts
      const response = await fetch(`/api/post-status?orgId=${userOrg.org_id}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error)
        return
      }

      setPosts(result.posts)
      setSummary(result.summary)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const handleManualPost = async (postId: string) => {
    try {
      setPosting(postId)

      const response = await fetch('/api/manual-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: postId
        })
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error)
        return
      }

      // Refresh posts
      await fetchPosts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setPosting(null)
    }
  }

  const handleTriggerCron = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/cron/scheduled-posts')
      const result = await response.json()

      if (!result.success) {
        setError(result.error)
        return
      }

      // Refresh posts
      await fetchPosts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger cron')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-400 border-blue-400">Scheduled</Badge>
      case 'published':
        return <Badge variant="outline" className="text-green-400 border-green-400">Published</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-gray-400 border-gray-400">Draft</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getAvailablePlatforms = (post: Post) => {
    const platforms = []
    if (post.social_posts) {
      const socialPosts = post.social_posts
      if (socialPosts.twitter || socialPosts.Twitter) platforms.push('Twitter')
      if (socialPosts.linkedin || socialPosts.LinkedIn) platforms.push('LinkedIn')
      if (socialPosts.facebook || socialPosts.Facebook) platforms.push('Facebook')
      if (socialPosts.instagram || socialPosts.Instagram) platforms.push('Instagram')
      if (socialPosts.youtube || socialPosts.YouTube) platforms.push('YouTube')
      if (socialPosts.discord || socialPosts.Discord) platforms.push('Discord')
      if (socialPosts.reddit || socialPosts.Reddit) platforms.push('Reddit')
      if (socialPosts.telegram || socialPosts.Telegram) platforms.push('Telegram')
    }
    return platforms
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Posting Status Dashboard</h1>
          <p className="text-purple-200">Monitor and manage your scheduled posts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{summary.total}</div>
              <div className="text-gray-400">Total Posts</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{summary.scheduled}</div>
              <div className="text-gray-400">Scheduled</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{summary.posted}</div>
              <div className="text-gray-400">Posted</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{summary.failed}</div>
              <div className="text-gray-400">Failed</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{summary.partial}</div>
              <div className="text-gray-400">Partial</div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={handleTriggerCron}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            🚀 Trigger Cron Job
          </Button>
          <Button
            onClick={fetchPosts}
            variant="outline"
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/50 border-red-500 p-4 mb-6">
            <div className="text-red-200">❌ {error}</div>
          </Card>
        )}

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>📅 Created: {new Date(post.created_at).toLocaleDateString()}</span>
                    {post.scheduled_for && (
                      <span>⏰ Scheduled: {new Date(post.scheduled_for).toLocaleString()}</span>
                    )}
                    {post.published_at && (
                      <span>✅ Posted: {new Date(post.published_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(post.state)}
                  {post.state === 'scheduled' && (
                    <Button
                      onClick={() => handleManualPost(post.id)}
                      disabled={posting === post.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {posting === post.id ? '⏳ Posting...' : '🚀 Post Now'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Available Platforms:</div>
                <div className="flex flex-wrap gap-2">
                  {getAvailablePlatforms(post).map((platform) => (
                    <Badge key={platform} variant="outline" className="text-purple-400 border-purple-400">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {(post as any).error_message && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4">
                  <div className="text-red-200 text-sm">
                    <strong>Error:</strong> {(post as any).error_message}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div className="text-gray-300 text-sm">
                <div className="mb-2">
                  <strong>Content:</strong> {post.content.substring(0, 200)}...
                </div>
                {post.social_posts && (
                  <div>
                    <strong>Social Posts:</strong>
                    <div className="mt-2 space-y-1">
                      {Object.entries(post.social_posts).map(([platform, content]) => (
                        <div key={platform} className="text-xs">
                          <span className="text-purple-400">{platform}:</span> {String(content).substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
            <div className="text-gray-400 text-lg">No posts found</div>
            <div className="text-gray-500 text-sm mt-2">Create some content to see it here</div>
          </Card>
        )}
      </div>
    </div>
  )
}
