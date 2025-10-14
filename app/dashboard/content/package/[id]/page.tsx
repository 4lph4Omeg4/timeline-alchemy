'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StarRating, RatingInput } from '@/components/ui/star-rating'
import { BlogPost } from '@/types/index'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

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
        platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit', 'telegram']
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
    discord: `${title} 🎮\n\n${content.substring(0, 120)}...\n\n#AI #Community #Tech`,
    reddit: `${title} 🤖\n\n${content.substring(0, 120)}...\n\n#AI #Discussion #Tech`,
    telegram: `📢 ${title}\n\n${content.substring(0, 300)}...\n\n#AI #Tech #Innovation #Update`
  }
}

interface GeneratedContent {
  blogPost: {
    title: string
    content: string
    excerpt: string
    tags: string[]
  }
  images: Array<{
    id?: string
    url: string
    prompt?: string
    style?: string
    variant_type?: string
    is_active?: boolean
    prompt_number?: number
  }>
  socialPosts: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    discord: string
    reddit: string
    telegram: string
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
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [scheduleDateTime, setScheduleDateTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [regeneratingImages, setRegeneratingImages] = useState(false)
  const [selectedImageStyle, setSelectedImageStyle] = useState<'photorealistic' | 'digital_art' | 'cosmic'>('photorealistic')

  const handleRegenerateImages = async () => {
    if (!post) return
    
    setRegeneratingImages(true)
    
    try {
      toast.loading(`Generating 3 diverse images in ${selectedImageStyle.replace('_', ' ')} style...`, { id: 'regen-images' })
      
      const imageStyleSuffixes: Record<string, string> = {
        'photorealistic': 'Professional photography, photorealistic, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality, ultra-realistic, 8k. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!',
        'digital_art': 'Digital art, vibrant colors, artistic interpretation, creative composition, modern digital painting, trending on artstation, detailed illustration. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!',
        'cosmic': 'Cosmic ethereal visualization, nebula colors, purple and pink galaxies, celestial energy, mystical universe, starfield background, astral dimensions, divine cosmic atmosphere. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!'
      }
      
      const selectedStyleSuffix = imageStyleSuffixes[selectedImageStyle]
      
      // Create 3 diverse prompts
      const imagePrompts = [
        `${post.title} - Realistic scene with people or objects depicting the main concept`,
        `${post.title} - Abstract artistic visualization with shapes and colors representing key themes`,
        `${post.title} - Cosmic mystical energy visualization with celestial elements and divine atmosphere`
      ]
      
      const newImages = []
      
      // Generate 3 images
      for (let i = 0; i < 3; i++) {
        try {
          const fullPrompt = `${imagePrompts[i]}. ${selectedStyleSuffix}`
          
          console.log(`🎨 Generating image ${i + 1}/3 in ${selectedImageStyle} style...`)
          
          const imageResponse = await fetch('/api/generate-vercel-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt })
          })
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            newImages.push({
              url: imageData.imageUrl,
              prompt: imagePrompts[i],
              style: selectedImageStyle,
              variant_type: 'final',
              is_active: true,
              prompt_number: i + 1
            })
            console.log(`✅ Generated image ${i + 1}/3`)
          }
          
          // Small delay
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error)
        }
      }
      
      if (newImages.length > 0) {
        // Save to database
        const { data: { user } } = await supabase.auth.getUser()
        const { data: orgMembers } = await supabase.from('org_members').select('org_id, role').eq('user_id', user!.id)
        const userOrgId = orgMembers?.find(member => member.role !== 'client')?.org_id || orgMembers?.[0]?.org_id
        
        const imagesToSave = newImages.map(img => ({
          org_id: userOrgId,
          post_id: post.id,
          url: img.url,
          prompt: img.prompt,
          style: img.style,
          variant_type: 'final',
          is_active: true,
          prompt_number: img.prompt_number,
          style_group: crypto.randomUUID()
        }))
        
        await (supabase as any).from('images').insert(imagesToSave)
        
        // Refresh the page data to show new images
        await fetchPost()
        
        toast.success(`✨ Created new set of 3 images in ${selectedImageStyle.replace('_', ' ')} style!`, { id: 'regen-images' })
      } else {
        toast.error('Failed to generate images', { id: 'regen-images' })
      }
    } catch (error) {
      console.error('Error generating images:', error)
      toast.error('Failed to generate images', { id: 'regen-images' })
    } finally {
      setRegeneratingImages(false)
    }
  }

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

  const handlePostNow = async (platform: string) => {
    if (!post) return
    
    if (!confirm(`Are you sure you want to post to ${platform} now?`)) {
      return
    }
    
    try {
      toast.loading(`Posting to ${platform}...`, { id: 'posting' })
      
      // Call the posting API
      const response = await fetch('/api/post-to-platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          platforms: [platform]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Posting failed')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Successfully posted to ${platform}!`, { id: 'posting' })
        
        // Update post status to published
        await supabase
          .from('blog_posts')
          .update({
            state: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', post.id)
          
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        throw new Error(result.error || 'Unknown error')
      }
      
    } catch (error) {
      console.error(`Error posting to ${platform}:`, error)
      toast.error(`Failed to post to ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'posting' })
    }
  }

  const handleSchedulePost = async (platform: string | null = null) => {
    if (!post) return
    
    setScheduling(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to schedule posts')
        return
      }

      // Get user's organization
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (!orgMembers || orgMembers.length === 0) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      // Find the user's personal organization (owner role only)
      let userOrgId = orgMembers.find(member => member.role === 'owner')?.org_id
      if (!userOrgId) {
        toast.error('No personal organization found. Please create an organization first.')
        return
      }

      if (platform === 'all') {
        // Schedule all platforms
        const scheduledDate = new Date(scheduleDateTime)
        const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit', 'telegram']
        let successCount = 0
        let errorCount = 0

        // Prepare social platform scheduling info first
        const socialPlatformsScheduled = platforms.filter(platform => socialPosts[platform])
        const socialSchedulingInfo = {
          scheduled_social_platforms: socialPlatformsScheduled,
          scheduled_social_content: socialPlatformsScheduled.reduce((acc, platform) => {
            let content = socialPosts[platform]
            const activeImages = generatedContent?.images?.filter(img => img.is_active) || []
            if (activeImages.length > 0) {
              content = `${content}\n\n🖼️ Images: ${activeImages.map(img => img.url).join(', ')}`
            }
            acc[platform] = content
            return acc
          }, {} as Record<string, string>)
        }

        // Create a new blog post in Timeline-Alchemy's organization
        const { data: newPost, error: blogError } = await supabase
          .from('blog_posts')
          .insert({
            org_id: userOrgId,
            title: post.title,
            content: post.content,
            state: 'scheduled',
            scheduled_for: scheduledDate.toISOString(),
            social_posts: socialSchedulingInfo.scheduled_social_content,
            created_by_admin: false
          })
          .select()
          .single()

        if (blogError) {
          console.error('Error creating scheduled post:', blogError)
          errorCount = platforms.length
        } else {
          successCount = socialPlatformsScheduled.length
        }

        // Update local state to show the new scheduled post
        setPost(prev => prev ? { 
          ...prev, 
          id: newPost.id,
          org_id: userOrgId,
          state: 'scheduled', 
          scheduled_for: scheduledDate.toISOString(),
          social_posts: socialSchedulingInfo.scheduled_social_content
        } : null)
        
        if (errorCount === 0) {
          toast.success(`All platforms scheduled successfully! (${successCount + 1} posts including blog)`)
        } else {
          toast.success(`Scheduled ${successCount + 1} platforms successfully (including blog), ${errorCount} failed`)
        }
      } else if (platform) {
        // Schedule individual social post
        const postContent = socialPosts[platform]
        if (!postContent) {
          toast.error(`No ${platform} post available`)
          return
        }

        // Include image URLs in social post content if available
        let enhancedContent = postContent
        const activeImages = generatedContent?.images?.filter(img => img.is_active) || []
        if (activeImages.length > 0) {
          enhancedContent = `${postContent}\n\n🖼️ Images: ${activeImages.map(img => img.url).join(', ')}`
        }

        // Update the original post with individual social platform scheduling
        const scheduledDate = new Date(scheduleDateTime)
        
        // Get current social posts and add the new one
        const currentSocialPosts = post.social_posts || {}
        const updatedSocialPosts = {
          ...currentSocialPosts,
          [platform]: enhancedContent
        }
        
        // Create a new blog post in Timeline-Alchemy's organization for individual platform
        const { data: newPost, error: updateError } = await supabase
          .from('blog_posts')
          .insert({
            org_id: userOrgId,
            title: post.title,
            content: post.content,
            state: 'scheduled',
            scheduled_for: scheduledDate.toISOString(),
            social_posts: updatedSocialPosts,
            created_by_admin: false
          })
          .select()
          .single()

        if (updateError) {
          console.error('Error scheduling social post:', updateError)
          toast.error('Failed to schedule social post')
          return
        }

        // Update local state to show the new scheduled post
        setPost(prev => prev ? { 
          ...prev, 
          id: newPost.id,
          org_id: userOrgId,
          state: 'scheduled', 
          scheduled_for: scheduledDate.toISOString(),
          social_posts: updatedSocialPosts
        } : null)
        
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} post scheduled successfully!`)
      } else {
        // Schedule the main blog post
        // Convert local datetime to UTC for database storage
        const scheduledDate = new Date(scheduleDateTime)
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            state: 'scheduled',
            scheduled_for: scheduledDate.toISOString()
          })
          .eq('id', post.id)

        if (updateError) {
          console.error('Error scheduling blog post:', updateError)
          toast.error('Failed to schedule blog post')
          return
        }

        // Update local state
        setPost(prev => prev ? { ...prev, state: 'scheduled', scheduled_for: scheduledDate.toISOString() } : null)
        toast.success('Blog post scheduled successfully!')
      }

      setShowScheduleModal(false)
      setSelectedPlatform(null)
      setScheduleDateTime('')
    } catch (error) {
      console.error('Error scheduling post:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setScheduling(false)
    }
  }

  const openScheduleModal = (platform: string | null = null) => {
    setSelectedPlatform(platform)
    setShowScheduleModal(true)
    // Set default time to 1 hour from now in local timezone
    const now = new Date()
    now.setHours(now.getHours() + 1)
    // Format for datetime-local input (YYYY-MM-DDTHH:MM) in local timezone
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    setScheduleDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
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

      // Try to fetch associated images - allow access to admin package images or user's org images
      const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('post_id', params.id)

      console.log('📷 Fetched images for post:', params.id)
      console.log('📷 Total images found:', images?.length || 0)
      if (images && images.length > 0) {
        console.log('📷 Active images:', images.filter(img => img.is_active).length)
        console.log('📷 Image details:', images.map(img => ({ url: img.url?.substring(0, 50), is_active: img.is_active, style: img.style })))
      }

             // Use existing content directly - no generation, no processing
             const cleanContent = postData.content
               .replace(/^[\s\S]*?Content:\s*/, '') // Remove "Content:" prefix if it exists
               .replace(/^(Title|Introduction|Content|Conclusion|Summary|Excerpt):\s*/gim, '') // Remove common labels
               .replace(/^(Titel|Introductie|Inhoud|Conclusie|Samenvatting|Uittreksel):\s*/gim, '') // Remove Dutch labels
               .trim()
             
             // Load social posts from separate table
             const { data: socialPostsData } = await supabase
               .from('social_posts')
               .select('platform, content')
               .eq('post_id', postData.id)
             
             const socialPostsMap: Record<string, string> = {}
             if (socialPostsData) {
               socialPostsData.forEach(post => {
                 socialPostsMap[post.platform] = post.content
               })
             }
             setSocialPosts(socialPostsMap)

      // Set the actual generated content with real data
      const actualGeneratedContent: GeneratedContent = {
        blogPost: {
          title: postData.title,
          content: cleanContent,
          excerpt: '',
          tags: ['AI Generated', 'Content Package']
        },
        images: images || [],
        socialPosts: (socialPosts || {}) as any
      }

      setGeneratedContent(actualGeneratedContent)

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
          
          {/* Blog Post Scheduling Options */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              📅 Schedule Blog Post
            </h4>
            <p className="text-gray-300 text-sm mb-4">
              Schedule this blog post to be published at a specific date and time
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => openScheduleModal(null)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
              >
                📅 Schedule Blog Post
              </Button>
              <Button
                onClick={() => openScheduleModal('all')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg hover:shadow-blue-500/50"
              >
                🚀 Schedule All Platforms
              </Button>
              {post.state === 'scheduled' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to publish this post now?')) {
                      handleSchedulePost(null)
                    }
                  }}
                  className="border-green-500/50 text-green-300 hover:bg-green-600/30"
                >
                  ✨ Publish Now ✨
                </Button>
              )}
            </div>
            {post.state === 'scheduled' && post.scheduled_for && (
              <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  <strong>Scheduled for:</strong> {new Date(post.scheduled_for).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate New Image Set */}
      <Card className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 border-pink-500/30">
        <CardHeader>
          <CardTitle className="text-white">🎨 Generate New Image Set</CardTitle>
          <CardDescription className="text-gray-300">
            Create 3 diverse images in your preferred style for this package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="imageStyle">Select Style</Label>
              <select
                id="imageStyle"
                value={selectedImageStyle}
                onChange={(e) => setSelectedImageStyle(e.target.value as 'photorealistic' | 'digital_art' | 'cosmic')}
                className="w-full mt-1 bg-gray-800 border border-purple-500/30 text-white rounded-md p-2"
                disabled={regeneratingImages}
              >
                <option value="photorealistic">📸 Photorealistic</option>
                <option value="digital_art">🎨 Digital Art</option>
                <option value="cosmic">🌌 Cosmic</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Will generate 3 diverse scenes in this style
              </p>
            </div>
            
            <Button
              onClick={handleRegenerateImages}
              disabled={regeneratingImages}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              {regeneratingImages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate New Set
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Images - Multi-Style Gallery */}
      {generatedContent.images && generatedContent.images.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">🖼️ Current Images</CardTitle>
                <CardDescription className="text-gray-300">
                  {generatedContent.images.filter(img => img.is_active).length > 1 
                    ? `${generatedContent.images.filter(img => img.is_active).length} AI-generated images in ${generatedContent.images.find(img => img.is_active)?.style?.replace('_', ' ') || 'selected'} style`
                    : 'AI-generated image that complements your content'}
                </CardDescription>
              </div>
              {generatedContent.images.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allStylesElement = document.getElementById('all-styles-section')
                    if (allStylesElement) {
                      allStylesElement.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  🎨 View All Styles
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Active Images (or all if none are active) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(generatedContent.images.filter(img => img.is_active).length > 0
                ? generatedContent.images.filter(img => img.is_active)
                : generatedContent.images.slice(0, 3)
              ).map((image, index) => (
                  <div key={index} className="space-y-2">
                    <div className="w-full h-64 bg-black/30 rounded-lg shadow-lg border-2 border-green-500/30 overflow-hidden flex items-center justify-center">
                      <img 
                        src={image.url} 
                        alt={image.prompt || 'Generated image'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      {image.prompt && (
                        <p className="text-center"><strong>Scene:</strong> {image.prompt}</p>
                      )}
                      {image.style && (
                        <div className="flex justify-center">
                          <Badge className="bg-green-600/20 text-green-200">
                            ✅ {image.style.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* All Style Variants Section */}
            {generatedContent.images.length > 3 && (
              <div id="all-styles-section" className="mt-8 pt-8 border-t border-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-white">🎨 All Style Variants</h3>
                <p className="text-sm text-gray-400">
                  View all the original style options and final images generated for this content
                </p>
                
                <div className="space-y-6">
                  {/* Original Style Variants */}
                  {generatedContent.images.filter(img => img.variant_type === 'original').length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-purple-300 mb-3">Original Style Variants</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {generatedContent.images
                          .filter(img => img.variant_type === 'original')
                          .map((image, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="w-full h-48 bg-black/30 rounded-lg border border-purple-500/20 overflow-hidden flex items-center justify-center">
                                      <img 
                                        src={image.url} 
                                        alt={image.prompt || 'Original variant'}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Badge className="bg-purple-600/20 text-purple-200">
                                      {image.style?.replace('_', ' ')}
                                    </Badge>
                                  </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Final Images */}
                  {generatedContent.images.filter(img => img.variant_type === 'final').length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-green-300 mb-3">✅ Final Images (Chosen Style)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {generatedContent.images
                          .filter(img => img.variant_type === 'final')
                          .map((image, index) => (
                            <div key={index} className="space-y-2">
                              <div className="w-full h-48 bg-black/30 rounded-lg border-2 border-green-500/30 overflow-hidden flex items-center justify-center">
                                <img 
                                  src={image.url} 
                                  alt={image.prompt || 'Final image'}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <Badge className="bg-green-600/20 text-green-200">
                                {image.style?.replace('_', ' ')} {image.is_active && '(Active)'}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

             {/* Social Media Posts */}
             {(Object.keys(socialPosts).length > 0 || (generatedContent && generatedContent.socialPosts)) && (
               <Card className="bg-gray-900 border-gray-800">
                 <CardHeader>
                     <div>
                       <CardTitle className="text-white">📱 Social Media Posts</CardTitle>
                       <CardDescription className="text-gray-300">
                         Platform-optimized posts ready for publishing
                       </CardDescription>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-6">
          {/* Facebook */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <h4 className="font-semibold text-white">Facebook</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostNow('facebook')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Post Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => openScheduleModal('facebook')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                >
                  📅 Schedule
                </Button>
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.facebook}</p>
              {/* Show image preview for Facebook */}
              {generatedContent.images && generatedContent.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">📷 Image will be included:</p>
                  <div className="w-32 h-32 bg-black/30 rounded-lg overflow-hidden">
                    <img 
                      src={generatedContent.images[0].url} 
                      alt="Post image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Instagram */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">📷</span>
              </div>
              <h4 className="font-semibold text-white">Instagram</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostNow('instagram')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Post Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => openScheduleModal('instagram')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                >
                  📅 Schedule
                </Button>
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.instagram}</p>
              {/* Show image preview for Instagram */}
              {generatedContent.images && generatedContent.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">📷 Image will be included:</p>
                  <div className="w-32 h-32 bg-black/30 rounded-lg overflow-hidden">
                    <img 
                      src={generatedContent.images[0].url} 
                      alt="Post image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Twitter/X */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">𝕏</span>
              </div>
              <h4 className="font-semibold text-white">Twitter/X</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostNow('twitter')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Post Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => openScheduleModal('twitter')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                >
                  📅 Schedule
                </Button>
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.twitter}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* LinkedIn */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">in</span>
              </div>
              <h4 className="font-semibold text-white">LinkedIn</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostNow('linkedin')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Post Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => openScheduleModal('linkedin')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                >
                  📅 Schedule
                </Button>
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.linkedin}</p>
              {/* Show image preview for LinkedIn */}
              {generatedContent.images && generatedContent.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">📷 Image will be included:</p>
                  <div className="w-32 h-32 bg-black/30 rounded-lg overflow-hidden">
                    <img 
                      src={generatedContent.images[0].url} 
                      alt="Post image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Discord */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">💬</span>
              </div>
                <h4 className="font-semibold text-white">Discord</h4>
            </div>
            <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostNow('discord')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Post Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => openScheduleModal('discord')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                >
                  📅 Schedule
                </Button>
              </div>
          </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.discord}</p>
            </div>
          </div>

          {/* Reddit */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🤖</span>
                </div>
                <h4 className="font-semibold text-white">Reddit</h4>
              </div>
            <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePostNow('reddit')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Post Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => openScheduleModal('reddit')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
                >
                  📅 Schedule
                </Button>
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.reddit}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Telegram */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📢</span>
                </div>
                <h4 className="font-semibold text-white">Telegram</h4>
              </div>
            <Button
                size="sm"
                onClick={() => openScheduleModal('telegram')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50"
              >
                📅 Schedule
            </Button>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300 select-all">{socialPosts.telegram}</p>
            </div>
          </div>
        </CardContent>
      </Card>
             )}



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

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📅 Schedule {selectedPlatform === 'all' ? 'All Platforms' : selectedPlatform ? `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Post` : 'Blog Post'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:border-purple-400 focus:ring-purple-400/50"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              {selectedPlatform && selectedPlatform !== 'all' && (
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Preview:</p>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {socialPosts[selectedPlatform]}
                  </p>
                </div>
              )}
              
              {selectedPlatform === 'all' && (
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Will schedule:</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Blog Post: "{post?.title}"</li>
                    <li>• Facebook Post</li>
                    <li>• Instagram Post</li>
                    <li>• Twitter/X Post</li>
                    <li>• LinkedIn Post</li>
                    <li>• Discord Post</li>
                    <li>• Reddit Post</li>
                    <li>• Telegram Post</li>
                    {generatedContent?.images && generatedContent.images.filter(img => img.is_active).length > 0 && (
                      <li>• {generatedContent.images.filter(img => img.is_active).length} Generated Image(s) (included with all posts)</li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSelectedPlatform(null)
                    setScheduleDateTime('')
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSchedulePost(selectedPlatform)}
                  disabled={scheduling || !scheduleDateTime}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Schedule Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
