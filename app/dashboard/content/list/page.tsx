'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { BlogPost } from '@/types/index'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ContentListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'title'>('newest')
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [filter, sortBy])

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Get user's organization
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (orgError || !orgMember) {
        console.error('Error getting user organization:', orgError)
        toast.error('No organization found. Please create an organization first.')
        router.push('/create-organization')
        return
      }

      // Get all posts from the organization (both user-created and admin-created packages)
      // Also get admin packages from ALL organizations
      let query = supabase
        .from('blog_posts')
        .select('*')
        .or(`org_id.eq.${orgMember.org_id},and(created_by_admin.eq.true)`)

      if (filter !== 'all') {
        query = query.eq('state', filter)
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'rating':
          query = query.order('average_rating', { ascending: false }).order('rating_count', { ascending: false })
          break
        case 'title':
          query = query.order('title', { ascending: true })
          break
      }

      const { data, error } = await query

      console.log('All posts in organization:', data)

      if (error) {
        console.error('Error fetching posts:', error)
        toast.error('Failed to load content')
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      if (error) {
        console.error('Error deleting post:', error)
        toast.error('Failed to delete post')
      } else {
        toast.success('Post deleted successfully')
        fetchPosts() // Refresh the list
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handlePublishPost = async (postId: string) => {
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
        toast.error('Failed to publish post')
      } else {
        toast.success('Post published successfully')
        fetchPosts() // Refresh the list
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleRecyclePost = async (postId: string) => {
    if (!confirm('Are you sure you want to recycle this published post back to draft? This will remove the published date but keep all content.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          state: 'draft',
          published_at: null,
        })
        .eq('id', postId)

      if (error) {
        console.error('Error recycling post:', error)
        toast.error('Failed to recycle post')
      } else {
        toast.success('Post recycled to draft successfully')
        fetchPosts() // Refresh the list
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-yellow-600'
      case 'scheduled':
        return 'bg-blue-600'
      case 'published':
        return 'bg-green-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStateText = (state: string) => {
    return state.charAt(0).toUpperCase() + state.slice(1)
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Library</h1>
          <p className="text-gray-300 mt-2">
            Manage your content and view packages created by your admin.
          </p>
        </div>
        <Link href="/dashboard/content/new">
          <Button>Create New Content</Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {(['all', 'draft', 'scheduled', 'published'] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'default' : 'outline'}
            onClick={() => setFilter(filterType)}
            className="capitalize"
          >
            {filterType === 'all' ? 'All Content' : getStateText(filterType)}
          </Button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-300 text-sm font-medium">Sort by:</span>
        <div className="flex space-x-2">
          {(['newest', 'oldest', 'rating', 'title'] as const).map((sortType) => (
            <Button
              key={sortType}
              variant={sortBy === sortType ? 'default' : 'outline'}
              onClick={() => setSortBy(sortType)}
              size="sm"
              className="capitalize"
            >
              {sortType === 'newest' ? 'Newest First' : 
               sortType === 'oldest' ? 'Oldest First' :
               sortType === 'rating' ? 'Top Rated' : 'Title A-Z'}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {posts.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">No content found</h3>
            <p className="text-gray-400 text-center mb-6">
              {filter === 'all' 
                ? "No content found in your organization. Start by creating your first post or ask your admin to create packages for you!"
                : `No ${filter} content found. Try creating some content or check other filters.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white text-lg line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <Badge className={`${getStateColor(post.state)} text-white ml-2`}>
                    {getStateText(post.state)}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>Created {formatDate(post.created_at)}</span>
                    {post.created_by_admin && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        Admin Package
                      </Badge>
                    )}
                  </div>
                  {post.published_at && (
                    <span className="block">
                      Published {formatDate(post.published_at)}
                    </span>
                  )}
                  {post.scheduled_for && (
                    <span className="block text-blue-400">
                      Scheduled for {formatDate(post.scheduled_for)}
                    </span>
                  )}
                  {/* Rating Display */}
                  <div className="flex items-center space-x-2 mt-2">
                    <StarRating 
                      rating={post.average_rating || 0} 
                      size="sm" 
                      showNumber={true}
                    />
                    <span className="text-xs text-gray-500">
                      ({post.rating_count || 0} {post.rating_count === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {post.content.substring(0, 150)}...
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {post.state === 'draft' && (
                      <>
                        {post.created_by_admin ? (
                          <Link href={`/dashboard/content/package/${post.id}`}>
                            <Button size="sm" className="flex-1">
                              📦 View Package
                            </Button>
                          </Link>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePublishPost(post.id)}
                              className="flex-1"
                            >
                              Publish
                            </Button>
                            <Link href={`/dashboard/content/edit/${post.id}`}>
                              <Button size="sm" variant="outline" className="flex-1">
                                Edit
                              </Button>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                    
                    {post.state === 'published' && (
                      <>
                        <Link href={`/dashboard/content/package/${post.id}`}>
                          <Button size="sm" className="flex-1">
                            📦 View Package
                          </Button>
                        </Link>
                        {!post.created_by_admin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecyclePost(post.id)}
                            className="flex-1"
                          >
                            ♻️ Recycle
                          </Button>
                        )}
                      </>
                    )}

                    {post.state === 'scheduled' && (
                      <>
                        <Link href={`/dashboard/content/package/${post.id}`}>
                          <Button size="sm" className="flex-1">
                            📦 View Package
                          </Button>
                        </Link>
                        {!post.created_by_admin && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePublishPost(post.id)}
                              className="flex-1"
                            >
                              Publish Now
                            </Button>
                            <Link href={`/dashboard/content/edit/${post.id}`}>
                              <Button size="sm" variant="outline" className="flex-1">
                                Edit
                              </Button>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                    
                    {!post.created_by_admin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {posts.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total: {posts.length} posts</span>
              <span>
                Draft: {posts.filter(p => p.state === 'draft').length} | 
                Published: {posts.filter(p => p.state === 'published').length} |
                Scheduled: {posts.filter(p => p.state === 'scheduled').length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
