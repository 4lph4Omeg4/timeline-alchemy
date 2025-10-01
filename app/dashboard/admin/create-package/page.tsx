'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { BlogPost } from '@/types/index'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/Loader'
import { generateAndSaveImage } from '@/lib/ai'

export default function AdminCreatePackagePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [existingContent, setExistingContent] = useState<BlogPost[]>([])
  const [useExistingContent, setUseExistingContent] = useState(false)
  const [selectedContent, setSelectedContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          setLoading(false)
          return
        }

        // Get admin's organization
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .single()

        if (orgError || !orgMember) {
          console.error('Error getting admin organization:', orgError)
          setLoading(false)
          return
        }


        // Fetch existing content from admin's organization
        const { data: contentData, error: contentError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('org_id', orgMember.org_id)
          .eq('created_by_admin', false) // Only show content created by users, not other admin packages
          .order('created_at', { ascending: false })
          .limit(50) // Limit to prevent too many options

        if (contentError) {
          console.error('Error fetching existing content:', contentError)
          toast.error('Failed to fetch existing content')
        } else {
          setExistingContent(contentData || [])
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSavePackage = async () => {

    if (!useExistingContent && (!title.trim() || !content.trim())) {
      toast.error('Please fill in all required fields')
      return
    }

    if (useExistingContent && !selectedContent) {
      toast.error('Please select existing content')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to create packages')
        return
      }

      // Get admin's organization
      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (!orgMember) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      let finalTitle = title
      let finalContent = content

      // If using existing content, get the data from selected content
      if (useExistingContent) {
        const selectedPost = existingContent.find(post => post.id === selectedContent)
        if (selectedPost) {
          finalTitle = selectedPost.title
          finalContent = selectedPost.content
        }
      }

      // If using existing content, copy ALL existing data (including images and social posts)
      if (useExistingContent) {
        const selectedPost = existingContent.find(post => post.id === selectedContent)
        if (selectedPost) {
          // Create package with ALL existing data
          const { data: packageData, error: packageError } = await supabase
            .from('blog_posts')
            .insert({
              org_id: orgMember.org_id,
              title: selectedPost.title,
              content: selectedPost.content,
              excerpt: selectedPost.excerpt,
              social_posts: selectedPost.social_posts,
              state: 'draft',
              created_by_admin: true,
            })
            .select()
            .single()

          if (packageError) {
            console.error('Error creating package:', packageError)
            toast.error('Failed to create package')
            return
          }

                 // Copy ALL existing images
                 const { data: existingImages } = await supabase
                   .from('images')
                   .select('*')
                   .eq('post_id', selectedPost.id)

                 if (existingImages && existingImages.length > 0) {
                   for (const image of existingImages) {
                     await supabase
                       .from('images')
                       .insert({
                         org_id: orgMember.org_id,
                         post_id: packageData.id,
                         url: image.url,
                       })
                   }
                 }

                 // Copy ALL existing social posts
                 const { data: existingSocialPosts } = await supabase
                   .from('social_posts')
                   .select('*')
                   .eq('post_id', selectedPost.id)

                 if (existingSocialPosts && existingSocialPosts.length > 0) {
                   for (const socialPost of existingSocialPosts) {
                     await supabase
                       .from('social_posts')
                       .insert({
                         post_id: packageData.id,
                         platform: socialPost.platform,
                         content: socialPost.content,
                       })
                   }
                 }

          toast.success('Package created with existing content!')
        }
      } else {
        // For new content, just create basic package
        const { data: packageData, error: packageError } = await supabase
          .from('blog_posts')
          .insert({
            org_id: orgMember.org_id,
            title: finalTitle,
            content: finalContent,
            state: 'draft',
            created_by_admin: true,
          })
          .select()
          .single()

        if (packageError) {
          console.error('Error creating package:', packageError)
          toast.error('Failed to create package')
          return
        }

        toast.success('Package created!')
      }

      router.push('/dashboard/admin/packages')
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
        <Loader className="h-16 w-16 text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Create Content Package</h1>
        <p className="text-gray-300 mt-2">
          Create a content package that will be available to all users in your organization.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Package Details</CardTitle>
          <CardDescription className="text-gray-300">
            Create a content package that will be available to all users in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="flex items-center space-x-2">
            <Switch
              id="use-existing"
              checked={useExistingContent}
              onCheckedChange={setUseExistingContent}
            />
            <Label htmlFor="use-existing" className="text-white">
              Use existing content
            </Label>
          </div>

          {useExistingContent ? (
            <div>
              <Label htmlFor="existing-content" className="text-white">Select Content</Label>
              <Select value={selectedContent} onValueChange={setSelectedContent}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select existing content" />
                </SelectTrigger>
                <SelectContent>
                  {existingContent.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedContent && (
                <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Preview:</h4>
                  <p className="text-gray-300 text-sm">
                    {existingContent.find(p => p.id === selectedContent)?.content.substring(0, 200)}...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter package title"
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-white">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={15}
                  placeholder="Enter the main content for this package"
                />
              </div>
            </>
          )}

          <div className="flex space-x-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/admin/packages')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePackage}
              disabled={saving || (!useExistingContent && (!title.trim() || !content.trim())) || (useExistingContent && !selectedContent)}
            >
              {saving ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Creating Package...
                </>
              ) : (
                'Create Package'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
