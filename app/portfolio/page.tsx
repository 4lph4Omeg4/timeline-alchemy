'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/ui/modal'
import { CONTENT_CATEGORIES, getAllCategories, getCategoryInfo, type CategoryId } from '@/lib/category-detector'
import { BlogPost } from '@/types/index'
import Link from 'next/link'

interface PortfolioPost extends BlogPost {
  images?: Array<{ url: string }>
}

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all')
  const [posts, setPosts] = useState<PortfolioPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<PortfolioPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

      const response = await fetch(`/api/portfolio/posts?category=${selectedCategory}`, {
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
  }

  const closePostModal = () => {
    setSelectedPost(null)
    setIsModalOpen(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800/20 to-pink-800/20 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-4">
              Content Previews
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Ontdek onze collectie van gepubliceerde content, georganiseerd per categorie
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/signin">
                <Button 
                  variant="outline"
                  className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-pink-600/30 hover:border-purple-400 transition-all duration-300"
                >
                  Inloggen
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button 
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Aanmelden
                </Button>
              </Link>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/portfolio')
                    const data = await response.json()
                    console.log('🔍 Debug Info:', data)
                    alert(`Debug Info:\nTotal Posts: ${data.totalPosts}\nPublished Posts: ${data.publishedPosts}\nCategories: ${data.categories?.join(', ') || 'None'}`)
                  } catch (err) {
                    console.error('Debug error:', err)
                    alert('Debug failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                  }
                }}
                variant="outline"
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 text-blue-200 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400 transition-all duration-300"
              >
                🔍 Debug
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('🧪 Testing Portfolio API...')
                    const response = await fetch('/api/portfolio/posts', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      cache: 'no-cache'
                    })
                    console.log('🧪 Test Response Status:', response.status)
                    console.log('🧪 Test Response OK:', response.ok)
                    
                    if (!response.ok) {
                      const errorText = await response.text()
                      console.error('🧪 Test Error:', errorText)
                      alert(`API Test Failed:\nStatus: ${response.status}\nError: ${errorText}`)
                      return
                    }
                    
                    const data = await response.json()
                    console.log('🧪 Test Data:', data)
                    alert(`API Test Success!\nPosts: ${data.posts?.length || 0}\nTotal: ${data.total}\nCategory: ${data.category}`)
                  } catch (err) {
                    console.error('🧪 Test Error:', err)
                    alert('API Test Failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                  }
                }}
                variant="outline"
                className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/50 text-green-200 hover:bg-gradient-to-r hover:from-green-600/30 hover:to-blue-600/30 hover:border-green-400 transition-all duration-300"
              >
                🧪 Test API
              </Button>
            </div>
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
                    
                    {/* Post Image */}
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4">
                        <img 
                          src={`${post.images[0].url}-image.png`} 
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-lg border border-purple-500/20"
                          onError={(e) => {
                            // Try alternative image names if the first one fails
                            const img = e.target as HTMLImageElement
                            if (img.src.includes('-image.png')) {
                              img.src = img.src.replace('-image.png', '-post-image.png')
                            } else if (img.src.includes('-post-image.png')) {
                              img.src = img.src.replace('-post-image.png', '-main.png')
                            } else if (img.src.includes('-main.png')) {
                              img.src = img.src.replace('-main.png', '.png')
                            } else {
                              img.style.display = 'none'
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        {post.average_rating && (
                          <div className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span>{post.average_rating.toFixed(1)}</span>
                            <span>({post.rating_count})</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span>👁️</span>
                          <span>Gepubliceerd</span>
                        </div>
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
        className="max-w-4xl"
      >
        {selectedPost && (
          <div className="space-y-6">
            {/* Post Image */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="w-full">
                <img 
                  src={`${selectedPost.images[0].url}-image.png`} 
                  alt={selectedPost.title}
                  className="w-full h-64 md:h-80 object-cover rounded-lg border border-purple-500/20"
                  onError={(e) => {
                    // Try alternative image names if the first one fails
                    const img = e.target as HTMLImageElement
                    if (img.src.includes('-image.png')) {
                      img.src = img.src.replace('-image.png', '-post-image.png')
                    } else if (img.src.includes('-post-image.png')) {
                      img.src = img.src.replace('-post-image.png', '-main.png')
                    } else if (img.src.includes('-main.png')) {
                      img.src = img.src.replace('-main.png', '.png')
                    } else {
                      img.style.display = 'none'
                    }
                  }}
                />
              </div>
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

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-purple-500/30">
              <Button
                onClick={closePostModal}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold"
              >
                Sluiten
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
