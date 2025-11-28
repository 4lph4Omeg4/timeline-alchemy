'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BlogPost } from '@/types/index'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ContentEditPage() {
  const params = useParams()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [postImages, setPostImages] = useState<string[]>([])
  const [excerpt, setExcerpt] = useState('')
  const [socialPosts, setSocialPosts] = useState<Record<string, string>>({})

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

      // Get user's organizations (any role)
      const { data: orgMembers, error: orgError } = await (supabase as any)
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (orgError || !orgMembers || orgMembers.length === 0) {
        console.error('Error getting user organizations:', orgError)
        toast.error('No organization found')
        router.push('/create-organization')
        return
      }

      // Get all organization IDs the user belongs to
      const orgIds = orgMembers.map((member: any) => member.org_id)

      // Fetch the post
      const { data: postData, error: postError } = await (supabase as any)
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .in('org_id', orgIds)
        .single()

      if (postError || !postData) {
        console.error('Error fetching post:', postError)
        toast.error('Post not found')
        router.push('/dashboard/content/list')
        return
      }

      setPost(postData)
      setTitle(postData.title)
      setContent(postData.content)
      setExcerpt('') // Will be added after database update

      // Load social posts from separate table
      const { data: socialPostsData } = await (supabase as any)
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

      // Fetch images for this post
      const { data: images, error: imagesError } = await (supabase as any)
        .from('images')
        .select('url')
        .eq('post_id', params.id)

      if (!imagesError && images) {
        setPostImages(images.map(img => img.url))
      }

    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      // Update social posts
      if (Object.keys(socialPosts).length > 0) {
        // Delete existing social posts
        await (supabase as any)
          .from('social_posts')
          .delete()
          .eq('post_id', params.id)

        // Insert updated social posts
        for (const [platform, content] of Object.entries(socialPosts)) {
          await (supabase as any)
            .from('social_posts')
            .insert({
              post_id: params.id,
              platform,
              content
            })
        }
      }

      if (error) {
        console.error('Error updating post:', error)
        toast.error('Failed to save changes')
      } else {
        toast.success('Post updated successfully!')
        router.push('/dashboard/content/list')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Post Not Found</h1>
          <p className="text-gray-300 mt-2">The requested post could not be found.</p>
        </div>
        <Link href="/dashboard/content/list">
          <Button>Back to Content Library</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Post</h1>
          <p className="text-gray-300 mt-2">
            Modify your content and publish when ready
          </p>
        </div>
        <Link href="/dashboard/content/list">
          <Button variant="outline">Back to Library</Button>
        </Link>
      </div>

      {/* Edit Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Post Content</CardTitle>
          <CardDescription className="text-gray-300">
            Edit your title and content below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-700 text-white"
              placeholder="Enter your post title..."
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-white">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-700 text-white min-h-[400px] whitespace-pre-wrap"
              placeholder="Write your post content here..."
              rows={20}
            />
          </div>

          {/* Excerpt */}
          {excerpt && (
            <div>
              <Label className="text-white">Excerpt</Label>
              <div className="mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <p className="text-gray-300 italic">{excerpt}</p>
              </div>
            </div>
          )}

          {/* Social Media Posts */}
          {Object.keys(socialPosts).length > 0 && (
            <div>
              <Label className="text-white">Social Media Posts</Label>
              <div className="mt-2 space-y-4">
                {Object.entries(socialPosts).map(([platform, post]) => (
                  <div key={platform} className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400 font-semibold capitalize">{platform}</span>
                    </div>
                    <Textarea
                      value={post}
                      onChange={(e) => {
                        setSocialPosts(prev => ({
                          ...prev,
                          [platform]: e.target.value
                        }))
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Images */}
          {postImages.length > 0 && (
            <div>
              <Label className="text-white">Post Images</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {postImages.map((imageUrl, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                    <img
                      src={imageUrl}
                      alt={`Post image ${index + 1}`}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSavePost}
              disabled={saving}
              variant="outline"
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>

            <Button
              onClick={() => router.push(`/dashboard/content/package/${params.id}`)}
              variant="outline"
              className="flex-1"
            >
              View Package
            </Button>
          </div>

          {/* Post Info */}
          <div className="border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              <p><strong>Status:</strong> {post.state.charAt(0).toUpperCase() + post.state.slice(1)}</p>
              <p><strong>Created:</strong> {new Date(post.created_at).toLocaleDateString()}</p>
              {post.updated_at && (
                <p><strong>Last Updated:</strong> {new Date(post.updated_at).toLocaleDateString()}</p>
              )}
              {post.published_at && (
                <p><strong>Published:</strong> {new Date(post.published_at).toLocaleDateString()}</p>
              )}
              {post.scheduled_for && (
                <p><strong>Scheduled:</strong> {new Date(post.scheduled_for).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
