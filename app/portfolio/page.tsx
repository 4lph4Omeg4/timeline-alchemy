'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/ui/modal'
import ContentProtection from '@/components/ContentProtection'
import { Logo } from '@/components/Logo'
import { StarRating } from '@/components/ui/star-rating'
import { CONTENT_CATEGORIES, getAllCategories, getCategoryInfo, type CategoryId } from '@/lib/category-detector'
import { BlogPost } from '@/types/index'
import Link from 'next/link'

interface PortfolioPost extends BlogPost {
  images?: Array<{ 
    id?: string
    url: string 
    prompt?: string
    style?: string
    variant_type?: string
    is_active?: boolean
    prompt_number?: number
  }>
}

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all')
  const [posts, setPosts] = useState<PortfolioPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<PortfolioPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showAllStyles, setShowAllStyles] = useState(false)

  const categories = getAllCategories()

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching posts for category:', selectedCategory)
      console.log('🔍 API URL:', `/api/portfolio/posts?category=${selectedCategory}`)

      const response = await fetch(`/api/portfolio/posts?category=${selectedCategory}&limit=1000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ API Response:', data)
      
      setPosts(data.posts || [])
    } catch (err) {
      console.error('❌ Error fetching posts:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryEmoji = (categoryId: string) => {
    const category = getCategoryInfo(categoryId as CategoryId)
    return category?.emoji || '📝'
  }

  const getCategoryLabel = (categoryId: string) => {
    const category = getCategoryInfo(categoryId as CategoryId)
    return category?.label || 'Uncategorized'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const openPostModal = (post: PortfolioPost) => {
    setSelectedPost(post)
    setIsModalOpen(true)
    setShowAllStyles(false)
  }

  const closePostModal = () => {
    setSelectedPost(null)
    setIsModalOpen(false)
    setShowAllStyles(false)
  }

  const startConversation = async (creatorUserId: string) => {
    try {
      toast.loading('Starting conversation...', { id: 'conversation' })
      
      // Get auth token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('Please sign in to send messages', { id: 'conversation' })
        return
      }
      
      // Create or get conversation
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ otherUserId: creatorUserId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Opening messages...', { id: 'conversation' })
        // Navigate to messages page
        window.location.href = '/dashboard/messages'
      } else {
        toast.error(data.error || 'Failed to start conversation', { id: 'conversation' })
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation', { id: 'conversation' })
    }
  }

  const getActiveImages = (post: PortfolioPost) => {
    if (!post.images || post.images.length === 0) return []
    
    // Try to get active final images first (new format)
    const activeImages = post.images.filter(img => img.is_active && img.variant_type === 'final')
    if (activeImages.length > 0) return activeImages
    
    // Fallback: get active images without variant type check (transition format)
    const activeAny = post.images.filter(img => img.is_active)
    if (activeAny.length > 0) return activeAny
    
    // Fallback: get all images if no active flag (old format)
    return post.images.slice(0, 3) // Max 3 images
  }

  const getAllStyleVariants = (post: PortfolioPost) => {
    return post.images || []
  }

  const getSocialLinks = (post: PortfolioPost) => {
    if (!post.social_posts) return []
    
    return Object.entries(post.social_posts).map(([platform, content]) => ({
      platform,
      content,
      url: getSocialUrl(platform, content)
    }))
  }

  const getSocialUrl = (platform: string, content: string) => {
    // Generate appropriate URLs based on platform
    switch (platform.toLowerCase()) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(content)}`
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(content)}`
      case 'instagram':
        return '#' // Instagram doesn't support direct sharing URLs
      case 'youtube':
        return '#' // YouTube doesn't support direct sharing URLs
      default:
        return '#'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black protected-content">
      {/* Content Protection */}
      <ContentProtection />
      
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center">
              <Logo size="lg" showText={false} />
            </Link>

            {/* Back to Home Button - Right */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button 
                  variant="outline"
                  className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-pink-600/30 hover:border-purple-400 transition-all duration-300"
                >
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-32 pb-12 bg-gradient-to-r from-purple-800/20 to-pink-800/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-4">
              Content Previews
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover our collection of published content, organized by category
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 border-purple-500/30 hover:bg-white/20'
              }`}
            >
              🌟 Alle Categorieën
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 border-purple-500/30 hover:bg-white/20'
                }`}
              >
                {category.emoji} {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-red-300 text-xl font-semibold mb-2">Error</h3>
              <p className="text-red-200">{error}</p>
              <Button 
                onClick={fetchPosts}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Probeer opnieuw
              </Button>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/10 border border-purple-500/30 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-white text-xl font-semibold mb-2">Geen content gevonden</h3>
              <p className="text-gray-300">
                {selectedCategory === 'all' 
                  ? 'Er zijn nog geen posts gepubliceerd.'
                  : `Er zijn nog geen posts in de categorie "${getCategoryLabel(selectedCategory)}".`
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6 text-center">
              <p className="text-gray-300 text-lg">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} gevonden
                {selectedCategory !== 'all' && (
                  <span className="text-purple-300">
                    {' '}in categorie "{getCategoryLabel(selectedCategory)}"
                  </span>
                )}
              </p>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card 
                  key={post.id} 
                  className="bg-white/10 backdrop-blur-md border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 group cursor-pointer"
                  onClick={() => openPostModal(post)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-600/20 text-purple-200 border-purple-500/30"
                      >
                        {getCategoryEmoji(post.category || 'uncategorized')} {getCategoryLabel(post.category || 'uncategorized')}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                    </div>
                    <CardTitle className="text-white text-lg leading-tight group-hover:text-purple-200 transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-300 mb-4 leading-relaxed">
                      {post.excerpt || truncateContent(post.content)}
                    </CardDescription>
                    
                    {/* Post Images - Show all 3 */}
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-3 gap-2">
                          {getActiveImages(post).slice(0, 3).map((image, idx) => (
                            <div key={idx} className="w-full h-32 bg-black/30 rounded-lg border border-purple-500/20 overflow-hidden flex items-center justify-center">
                              <img 
                                src={image.url} 
                                alt={`${post.title} - Image ${idx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>
                        {/* Resonance Rating */}
                        <div className="flex items-center justify-center mt-3 mb-2">
                          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg px-4 py-2">
                            <div className="text-xs text-purple-300 font-semibold mb-1 text-center">
                              Resonance Rating
                            </div>
                            {post.average_rating ? (
                              <div className="flex items-center justify-center space-x-2">
                                <StarRating 
                                  rating={post.average_rating} 
                                  size="md"
                                  showNumber={false}
                                />
                                <span className="text-white font-bold">{post.average_rating.toFixed(1)}</span>
                                <span className="text-gray-400 text-xs">({post.rating_count || 0})</span>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm text-center">
                                No ratings yet
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Resonance Rating (if no image) */}
                    {(!post.images || post.images.length === 0) && (
                      <div className="flex items-center justify-center mb-3">
                        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg px-4 py-2">
                          <div className="text-xs text-purple-300 font-semibold mb-1 text-center">
                            Resonance Rating
                          </div>
                          {post.average_rating ? (
                            <div className="flex items-center justify-center space-x-2">
                              <StarRating 
                                rating={post.average_rating} 
                                size="md"
                                showNumber={false}
                              />
                              <span className="text-white font-bold">{post.average_rating.toFixed(1)}</span>
                              <span className="text-gray-400 text-xs">({post.rating_count || 0})</span>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm text-center">
                              No ratings yet
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <span>👁️</span>
                        <span>Gepubliceerd</span>
                      </div>
                      
                      {post.organizations && (
                        <div className="text-right">
                          <div className="text-xs text-purple-300">
                            {post.organizations.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closePostModal}
        title={selectedPost?.title || ''}
        className="max-w-5xl"
      >
        {selectedPost && (
          <div className="space-y-6">
            {/* Active Images or All Style Variants */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="w-full space-y-4">
                {!showAllStyles ? (
                  <>
                    {/* Show active images only */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {getActiveImages(selectedPost).map((image, index) => (
                        <div key={index} className="space-y-2">
                          <div className="w-full h-64 bg-black/30 rounded-lg border border-purple-500/20 overflow-hidden flex items-center justify-center">
                            <img 
                              src={image.url} 
                              alt={image.prompt || selectedPost.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {image.style && (
                            <Badge variant="secondary" className="bg-purple-600/20 text-purple-200">
                              {image.style.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* View All Styles Button */}
                    {getAllStyleVariants(selectedPost).length > 3 && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllStyles(true)}
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                        >
                          🎨 View All Style Variants
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Show all style variants */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">🎨 All Style Variants</h3>
                        <Button
                          variant="outline"
                          onClick={() => setShowAllStyles(false)}
                          size="sm"
                          className="border-purple-500/50 text-purple-300"
                        >
                          ← Back to Active Images
                        </Button>
                      </div>
                      
                      {/* Group by variant type */}
                      <div className="space-y-4">
                        {/* Original Variants */}
                        {getAllStyleVariants(selectedPost).filter(img => img.variant_type === 'original').length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-purple-300 mb-3">Original Style Variants</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {getAllStyleVariants(selectedPost)
                                .filter(img => img.variant_type === 'original')
                                .map((image, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="w-full h-48 bg-black/30 rounded-lg border border-purple-500/20 overflow-hidden flex items-center justify-center">
                                      <img 
                                        src={image.url} 
                                        alt={image.prompt || selectedPost.title}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Badge variant="secondary" className="bg-purple-600/20 text-purple-200">
                                      {image.style?.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Final Images */}
                        {getAllStyleVariants(selectedPost).filter(img => img.variant_type === 'final').length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-green-300 mb-3">✅ Final Images (Chosen Style)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {getAllStyleVariants(selectedPost)
                                .filter(img => img.variant_type === 'final')
                                .map((image, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="w-full h-48 bg-black/30 rounded-lg border-2 border-green-500/30 overflow-hidden flex items-center justify-center">
                                      <img 
                                        src={image.url} 
                                        alt={image.prompt || selectedPost.title}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Badge variant="secondary" className="bg-green-600/20 text-green-200">
                                      {image.style?.replace('_', ' ')} {image.is_active && '(Active)'}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Post Title */}
                <h2 className="text-2xl font-bold text-white mt-4">
                  {selectedPost.title}
                </h2>
              </div>
            )}
            
            {/* Post Title (if no images) */}
            {(!selectedPost.images || selectedPost.images.length === 0) && (
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedPost.title}
              </h2>
            )}

            {/* Post Meta */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="secondary" 
                  className="bg-purple-600/20 text-purple-200 border-purple-500/30"
                >
                  {getCategoryEmoji(selectedPost.category || 'uncategorized')} {getCategoryLabel(selectedPost.category || 'uncategorized')}
                </Badge>
                <span>{formatDate(selectedPost.published_at || selectedPost.created_at)}</span>
              </div>
              
              {selectedPost.organizations && (
                <div className="text-right">
                  <div className="text-xs text-purple-300">
                    {selectedPost.organizations.name}
                  </div>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedPost.content}
              </div>
            </div>

            {/* Social Links */}
            {selectedPost.social_posts && Object.keys(selectedPost.social_posts).length > 0 && (
              <div className="border-t border-purple-500/30 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="mr-2">🔗</span>
                  Social Media Posts
                </h3>
                <div className="space-y-4">
                  {getSocialLinks(selectedPost).map((social, index) => (
                    <div key={index} className="bg-white/5 border border-purple-500/20 rounded-lg p-4">
                      <div className="mb-2">
                        <h4 className="font-semibold text-purple-200 capitalize">
                          {social.platform}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {social.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Creator Button */}
            <div className="border-t border-purple-500/30 pt-6">
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    💬 Connect with the Creator
                  </h3>
                  <p className="text-sm text-gray-400">
                    Start a conversation with <span className="text-purple-300 font-semibold">{selectedPost.organizations?.name}</span>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (selectedPost.created_by_user_id) {
                      startConversation(selectedPost.created_by_user_id)
                    } else {
                      toast.error('Creator information not available for this post')
                    }
                  }}
                  disabled={!selectedPost.created_by_user_id}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💬 Send Message
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
