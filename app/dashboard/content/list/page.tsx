'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { BlogPost } from '@/types/index'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const CONTENT_CATEGORIES = [
  'Consciousness & Awakening & Enlightenment',
  'Esoterica & Ancient Wisdom & Mysteries', 
  'AI & Conscious Technology & Future',
  'Crypto & Decentralized Sovereignty',
  'Divine Lifestyle & New Earth & Harmony',
  'Mythology & Archetypes & Ancient Secrets',
  'Global Shifts & Conscious Culture & Awakening'
] as const

export default function ContentListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'title'>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [filter, sortBy, selectedCategory])

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Get user's organizations
      const { data: orgMembers, error: orgError } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (orgError || !orgMembers || orgMembers.length === 0) {
        console.error('Error getting user organizations:', orgError)
        toast.error('No organization found. Please create an organization first.')
        router.push('/create-organization')
        return
      }

      // Get all organization IDs the user belongs to
      const orgIds = orgMembers.map(member => member.org_id)

      // Get all posts from user's organizations (both user-created and admin-created packages)
      // Also get admin packages from ALL organizations
      let query = supabase
        .from('blog_posts')
        .select('*')
        .in('org_id', orgIds)

      if (filter !== 'all') {
        query = query.eq('state', filter)
      }

      // Apply category filtering
      if (selectedCategory !== 'all') {
        query = query.like('title', `[${selectedCategory}]%`)
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
        const posts = data || []
        setPosts(posts)
        
        // Calculate category counts
        const counts: Record<string, number> = {}
        CONTENT_CATEGORIES.forEach(category => {
          counts[category] = posts.filter(post => post.title.startsWith(`[${category}]`)).length
        })
        setCategoryCounts(counts)
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
          <h1 className="text-3xl font-bold text-white">🌟 Divine Content Library</h1>
          <p className="text-gray-300 mt-2">
            Explore categorized content and view packages across all domains of consciousness.
          </p>
        </div>
        <Link href="/dashboard/content/new">
          <Button>Create New Content</Button>
        </Link>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🗂️ Categories
              </CardTitle>
              <CardDescription className="text-gray-300">
                Filter content by divine domains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* All Content */}
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                className="w-full justify-start text-left"
                onClick={() => setSelectedCategory('all')}
              >
                <span className="flex items-center justify-between w-full">
                  <span>🌟 All Content</span>
                  <Badge variant="secondary">{posts.length}</Badge>
                </span>
              </Button>

              {/* Category Buttons */}
              {CONTENT_CATEGORIES.map(category => {
                const getCategoryEmoji = (cat: string) => {
                  if (cat.includes('Consciousness')) return '🧠'
                  if (cat.includes('Ancient')) return '🏛️'
                  if (cat.includes('AI')) return '🤖'
                  if (cat.includes('Crypto')) return '💰'
                  if (cat.includes('Lifestyle')) return '🌱'
                  if (cat.includes('Mythology')) return '⚡'
                  if (cat.includes('Global')) return '🌍'
                  return '📚'
                }

                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'ghost'}
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="flex flex-col items-start w-full">
                      <span className="text-sm font-medium flex items-center gap-2">
                        {getCategoryEmoji(category)} {category.split(' & ')[0]}
                      </span>
                      <span className="text-xs text-gray-400 truncate w-full">
                        {category.split(' & ')[1] && category.split(' & ')[1]}
                      </span>
                      <Badge variant="secondary" className="mt-1">
                        {categoryCounts[category] || 0}
                      </Badge>
                    </span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Current Selection */}
          <div className="flex items-center gap-2">
            {selectedCategory === 'all' ? (
              <span className="text-lg text-white">🌟 All Content</span>
            ) : (
              <span className="text-lg text-white flex items-center gap-2">
                {selectedCategory.includes('Consciousness') && '🧠'}
                {selectedCategory.includes('Ancient') && '🏛️'}
                {selectedCategory.includes('AI') && '🤖'}
                {selectedCategory.includes('Crypto') && '💰'}
                {selectedCategory.includes('Lifestyle') && '🌱'}
                {selectedCategory.includes('Mythology') && '⚡'}
                {selectedCategory.includes('Global') && '🌍'}
                {selectedCategory.split(' & ')[0]}
              </span>
            )}
            <Badge variant="outline" className="text-purple-300 border-purple-500">
              {selectedCategory === 'all' ? posts.length : categoryCounts[selectedCategory] || 0} articles
            </Badge>
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
                        {post.state === 'scheduled' && !post.created_by_admin && (
                          <Badge className="bg-orange-600 text-white text-xs">
                            📅 Scheduled Task
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
                          Scheduled for {formatDateTime(post.scheduled_for)}
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
                      {/* Warning for scheduled tasks */}
                      {post.state === 'scheduled' && !post.created_by_admin && (
                        <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-400 text-lg">⚠️</span>
                            <div className="text-orange-200 text-sm">
                              <strong>Scheduled Task:</strong> This is a scheduled post created from an admin package. 
                              <br />
                              <span className="text-orange-300">
                                Scheduled for: <strong>{formatDateTime(post.scheduled_for || '')}</strong>
                              </span>
                              <br />
                              <span className="text-orange-300">Do not delete - it will be automatically posted!</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(post.state !== 'scheduled' || post.created_by_admin) && (
                        <p className="text-gray-300 text-sm line-clamp-6">
                          {post.content.substring(0, 300)}...
                        </p>
                      )}
                      
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
                        
                        {!post.created_by_admin && post.state !== 'scheduled' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete
                          </Button>
                        )}
                        
                        {!post.created_by_admin && post.state === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-gray-500 border-gray-600"
                            title="Cannot delete scheduled tasks - they will be automatically posted"
                          >
                            🔒 Protected
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
      </div>
    </div>
  )
}
