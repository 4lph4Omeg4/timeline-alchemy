'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StarRating, RatingInput } from '@/components/ui/star-rating'
import { BlogPost } from '@/types/index'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Function to generate proper social media posts
const generateSocialMediaPosts = async (title: string, content: string) => {
  try {
    const response = await fetch('/api/generate-social-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.socialPosts
    }
  } catch (error) {
    console.error('Error generating social posts:', error)
  }

  // Fallback to simple posts if AI generation fails
  return {
    facebook: `Check out this amazing content: ${title}\n\n${content.substring(0, 200)}...`,
    instagram: `✨ ${title} ✨\n\n${content.substring(0, 150)}...\n\n#AI #Content #Inspiration`,
    twitter: `${title}\n\n${content.substring(0, 100)}...\n\n#AI #Content`,
    linkedin: `Professional insight: ${title}\n\n${content.substring(0, 180)}...\n\n#Professional #AI #Content`,
    tiktok: `${title} 🚀\n\n${content.substring(0, 120)}...\n\n#AI #Trending #Content`
  }
}

interface GeneratedContent {
  blogPost: {
    title: string
    content: string
    excerpt: string
    tags: string[]
  }
  image: {
    url: string
    prompt: string
  }
  socialPosts: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    tiktok: string
  }
}

export default function ContentPackagePage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<any[]>([])
  const [userRating, setUserRating] = useState<any>(null)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [regeneratingSocial, setRegeneratingSocial] = useState(false)
  const [actualExcerpt, setActualExcerpt] = useState('')
  const [socialPosts, setSocialPosts] = useState<Record<string, string>>({})

  const handleRegenerateSocialPosts = async () => {
    if (!post) return
    
    setRegeneratingSocial(true)
    try {
      const cleanContent = post.content.replace(/^[\s\S]*?Content:\s*/, '').trim()
      const socialPosts = await generateSocialMediaPosts(post.title, cleanContent)
      
      // Update the database
      await supabase
        .from('blog_posts')
        .update({ social_posts: socialPosts })
        .eq('id', post.id)
      
             // Update the local state
             setSocialPosts(socialPosts)
             setGeneratedContent(prev => prev ? {
               ...prev,
               socialPosts
             } : null)
      
      toast.success('Social media posts regenerated!')
    } catch (error) {
      console.error('Error regenerating social posts:', error)
      toast.error('Failed to regenerate social posts')
    } finally {
      setRegeneratingSocial(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchPost()
    }
  }, [params.id])

  const fetchPost = async () => {
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
        toast.error('No organization found')
        router.push('/create-organization')
        return
      }

      // Fetch the post - allow access to user's org content OR admin packages from any org
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .or(`org_id.eq.${orgMember.org_id},and(created_by_admin.eq.true)`)
        .single()

      if (postError || !postData) {
        console.error('Error fetching post:', postError)
        toast.error('Post not found')
        router.push('/dashboard/content/list')
        return
      }

      setPost(postData)

      // Fetch ratings for this post
      await fetchRatings(postData.id, user.id)

      // Try to fetch associated images - allow access to user's org images OR admin package images
      const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('post_id', params.id)
        .or(`org_id.eq.${orgMember.org_id},and(post_id.eq.${params.id})`)

      console.log('Fetched images for post:', images)

             // Use existing content directly - no generation, no processing
             const cleanContent = postData.content
               .replace(/^[\s\S]*?Content:\s*/, '') // Remove "Content:" prefix if it exists
               .replace(/^(Title|Introduction|Content|Conclusion|Summary|Excerpt):\s*/gim, '') // Remove common labels
               .replace(/^(Titel|Introductie|Inhoud|Conclusie|Samenvatting|Uittreksel):\s*/gim, '') // Remove Dutch labels
               .trim()
             
             // Generate social posts if they don't exist
             try {
               const socialResponse = await fetch('/api/generate-social-posts', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   title: postData.title,
                   content: cleanContent,
                   platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
                 })
               })
               
               if (socialResponse.ok) {
                 const socialData = await socialResponse.json()
                 setSocialPosts(socialData.socialPosts)
               }
             } catch (error) {
               console.error('Error generating social posts:', error)
               setSocialPosts({})
             }

      // For now, we'll create a mock generated content structure
      // In a real app, you might store the complete generated content in the database
      const mockGeneratedContent: GeneratedContent = {
        blogPost: {
          title: postData.title,
          content: cleanContent,
          excerpt: excerpt,
          tags: ['AI Generated', 'Content Package']
        },
        image: images && images.length > 0 ? {
          url: images[0].url,
          prompt: 'AI generated image for: ' + postData.title
        } : {
          url: '',
          prompt: ''
        },
        socialPosts: posts as any
      }

      setGeneratedContent(mockGeneratedContent)

    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchRatings = async (postId: string, userId: string) => {
    try {
      const response = await fetch(`/api/ratings?postId=${postId}&userId=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setRatings(data.ratings || [])
        // Find user's rating
        const userRatingData = data.ratings?.find((rating: any) => rating.user_id === userId)
        setUserRating(userRatingData || null)
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
    }
  }

  const handleRatingSubmit = async (rating: number, reviewText?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to rate packages')
        return
      }

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          postId: params.id,
          rating: rating,
          reviewText: reviewText
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Rating submitted successfully!')
        setShowRatingForm(false)
        // Refresh ratings
        await fetchRatings(params.id as string, user.id)
        // Refresh post to update average rating
        await fetchPost()
      } else {
        toast.error(data.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleRecyclePost = async () => {
    if (!post) return

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
        .eq('id', post.id)

      if (error) {
        console.error('Error recycling post:', error)
        toast.error('Failed to recycle post')
      } else {
        toast.success('Post recycled to draft successfully')
        router.push('/dashboard/content/list')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post || !generatedContent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Not Found</h1>
          <p className="text-gray-300 mt-2">The requested content package could not be found.</p>
        </div>
        <Link href="/dashboard/content/list">
          <Button>Back to Content Library</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{post.title}</h1>
            <Badge className="bg-green-600 text-white">Published</Badge>
          </div>
          <p className="text-gray-300">
            Published {formatDate(post.published_at || post.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {!post.created_by_admin && (
            <Button
              variant="outline"
              onClick={handleRecyclePost}
            >
              ♻️ Recycle to Draft
            </Button>
          )}
          <Link href="/dashboard/content/list">
            <Button variant="outline">Back to Library</Button>
          </Link>
        </div>
      </div>

             {/* Excerpt */}
             {actualExcerpt && (
               <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
                 <CardHeader>
                   <CardTitle className="text-white flex items-center gap-2">
                     <span className="text-blue-400">📖</span>
                     Article Excerpt
                   </CardTitle>
                   <CardDescription className="text-gray-300">
                     A preview of this article's key insights
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-200 leading-relaxed text-lg italic">
                       {actualExcerpt}
                     </p>
                   </div>
                 </CardContent>
               </Card>
             )}

      {/* Blog Post */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">{post.title}</h2>
            <div className="flex flex-wrap gap-2">
              {generatedContent.blogPost.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <CardDescription className="text-gray-300">
            Complete article content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-invert max-w-none">
            <div 
              className="text-gray-300 leading-relaxed whitespace-pre-wrap select-all"
              style={{ maxHeight: 'none', overflow: 'visible' }}
            >
              {generatedContent.blogPost.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Image */}
      {generatedContent.image.url && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">🖼️ Generated Image</CardTitle>
            <CardDescription className="text-gray-300">
              AI-generated image that complements your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img 
                src={generatedContent.image.url} 
                alt={generatedContent.image.prompt}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
              <p className="text-sm text-gray-400 text-center">
                <strong>Prompt:</strong> {generatedContent.image.prompt}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

             {/* Social Media Posts */}
             {Object.keys(socialPosts).length > 0 && (
               <Card className="bg-gray-900 border-gray-800">
                 <CardHeader>
                   <div className="flex justify-between items-start">
                     <div>
                       <CardTitle className="text-white">📱 Social Media Posts</CardTitle>
                       <CardDescription className="text-gray-300">
                         Platform-optimized posts ready for publishing
                       </CardDescription>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleRegenerateSocialPosts}
                       disabled={regeneratingSocial}
                     >
                       {regeneratingSocial ? 'Regenerating...' : '🔄 Regenerate Posts'}
                     </Button>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-6">
          {/* Facebook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <h4 className="font-semibold text-white">Facebook</h4>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{generatedContent.socialPosts.facebook}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Instagram */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">📷</span>
              </div>
              <h4 className="font-semibold text-white">Instagram</h4>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{generatedContent.socialPosts.instagram}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Twitter/X */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">𝕏</span>
              </div>
              <h4 className="font-semibold text-white">Twitter/X</h4>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{generatedContent.socialPosts.twitter}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* LinkedIn */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">in</span>
              </div>
              <h4 className="font-semibold text-white">LinkedIn</h4>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{generatedContent.socialPosts.linkedin}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* TikTok */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">🎵</span>
              </div>
              <h4 className="font-semibold text-white">TikTok</h4>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{generatedContent.socialPosts.tiktok}</p>
            </div>
          </div>
        </CardContent>
      </Card>
             )}

      {/* Publishing Options */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">🚀 Publishing Options</CardTitle>
          <CardDescription className="text-gray-300">
            Publish this content to your social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                window.open(`https://twitter.com/compose/tweet?text=${encodeURIComponent(generatedContent.socialPosts.twitter)}`, '_blank')
              }}
            >
              🐦 Publish to Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(generatedContent.socialPosts.linkedin)}`, '_blank')
              }}
            >
              💼 Publish to LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=&quote=${encodeURIComponent(generatedContent.socialPosts.facebook)}`, '_blank')
              }}
            >
              📘 Publish to Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedContent.socialPosts.instagram)
                toast.success('Instagram post copied to clipboard!')
              }}
            >
              📷 Copy Instagram Post
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedContent.socialPosts.tiktok)
                toast.success('TikTok post copied to clipboard!')
              }}
            >
              🎵 Copy TikTok Post
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const blogUrl = window.location.href
                const shareText = `${generatedContent.blogPost.title}\n\n${blogUrl}`
                navigator.clipboard.writeText(shareText)
                toast.success('Blog link copied to clipboard!')
              }}
            >
              🔗 Copy Blog Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Copy to Clipboard Actions */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">📋 Quick Actions</CardTitle>
          <CardDescription className="text-gray-300">
            Copy content for easy sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedContent.blogPost.content)
                toast.success('Blog content copied to clipboard!')
              }}
            >
              Copy Blog Content
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const allSocialPosts = Object.entries(generatedContent.socialPosts)
                  .map(([platform, content]) => `${platform.toUpperCase()}:\n${content}`)
                  .join('\n\n')
                navigator.clipboard.writeText(allSocialPosts)
                toast.success('All social posts copied to clipboard!')
              }}
            >
              Copy All Social Posts
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const fullPackage = `BLOG POST:\n${generatedContent.blogPost.content}\n\nSOCIAL MEDIA POSTS:\n${Object.entries(generatedContent.socialPosts)
                  .map(([platform, content]) => `${platform.toUpperCase()}:\n${content}`)
                  .join('\n\n')}`
                navigator.clipboard.writeText(fullPackage)
                toast.success('Complete package copied to clipboard!')
              }}
            >
              Copy Full Package
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rating Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">⭐ Rate This Package</CardTitle>
          <CardDescription className="text-gray-300">
            Help others discover great content by rating this package
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Rating Display */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <StarRating 
                rating={post.average_rating || 0} 
                size="lg" 
                showNumber={true}
              />
              <span className="text-gray-400">
                ({post.rating_count || 0} {post.rating_count === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          </div>

          {/* User's Current Rating */}
          {userRating && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Your Rating</h4>
              <div className="flex items-center space-x-2">
                <StarRating rating={userRating.rating} size="md" />
                <span className="text-gray-300">{userRating.rating}/5 stars</span>
              </div>
              {userRating.review_text && (
                <p className="text-gray-400 mt-2 italic">"{userRating.review_text}"</p>
              )}
            </div>
          )}

          {/* Rating Form */}
          {!userRating && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-4">Rate this package</h4>
              <RatingInput
                onSubmit={handleRatingSubmit}
                className="max-w-md"
              />
            </div>
          )}

          {/* Recent Reviews */}
          {ratings.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-4">Recent Reviews</h4>
              <div className="space-y-3">
                {ratings.slice(0, 3).map((rating) => (
                  <div key={rating.id} className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <StarRating rating={rating.rating} size="sm" />
                      <span className="text-gray-400 text-sm">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                    {rating.review_text && (
                      <p className="text-gray-300 text-sm">"{rating.review_text}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
