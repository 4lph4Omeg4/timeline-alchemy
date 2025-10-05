'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/Loader'
import { CONTENT_CATEGORIES, getAllCategories, getCategoryInfo, type CategoryId } from '@/lib/category-detector'
import { BlogPost } from '@/types/index'

interface PortfolioPost extends BlogPost {
  images?: Array<{ url: string }>
}

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all')
  const [posts, setPosts] = useState<PortfolioPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = getAllCategories()

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/portfolio/posts?category=${selectedCategory}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800/20 to-pink-800/20 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-4">
              Content Previews
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Ontdek onze collectie van gepubliceerde content, georganiseerd per categorie
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
                  className="bg-white/10 backdrop-blur-md border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 group"
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
                          src={post.images[0].url} 
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-lg border border-purple-500/20"
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
    </div>
  )
}
