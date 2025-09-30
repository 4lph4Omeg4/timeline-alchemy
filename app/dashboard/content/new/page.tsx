'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AIGenerateRequest } from '@/types/index'
import toast from 'react-hot-toast'

export default function ContentEditorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setContentLoading(true)
    try {
      const request: AIGenerateRequest = {
        prompt,
        type: 'blog',
        tone: 'professional',
        length: 'medium',
      }

      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const responseData = await response.json()
      
      if (responseData.title) {
        setTitle(responseData.title)
      }
      if (responseData.excerpt) {
        setExcerpt(responseData.excerpt)
      }
      setContent(responseData.content)
      
      toast.success('Content generated successfully!')
    } catch (error) {
      toast.error('Failed to generate content')
    } finally {
      setContentLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title first')
      return
    }

    setImageLoading(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: title }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const responseData = await response.json()
      console.log('Generated image URL:', responseData.imageUrl)
      setGeneratedImageUrl(responseData.imageUrl)
      toast.success('Image generated successfully!')
    } catch (error) {
      toast.error('Failed to generate image')
    } finally {
      setImageLoading(false)
    }
  }

  const handleSavePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to save posts')
        return
      }

      // Get user's organizations
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (!orgMembers || orgMembers.length === 0) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      // Find the user's personal organization (not Admin Organization)
      let userOrgId = orgMembers.find(member => member.role !== 'client')?.org_id
      if (!userOrgId) {
        userOrgId = orgMembers[0].org_id
      }

      // First save the blog post (simplified - no excerpt/social_posts for now)
      const { data: postData, error: postError } = await (supabase as any)
        .from('blog_posts')
        .insert({
          org_id: userOrgId,
          title,
          content,
          state: 'draft',
        })
        .select()
        .single()

      if (postError) {
        console.error('Post save error:', postError)
        toast.error('Failed to save post')
        return
      }

      console.log('Post saved successfully:', postData.id)

      // If there's a generated image, save it too
      if (generatedImageUrl) {
        console.log('Saving image with URL:', generatedImageUrl)
        const { error: imageError } = await (supabase as any)
          .from('images')
          .insert({
            org_id: userOrgId,
            post_id: postData.id,
            url: generatedImageUrl,
          })

        if (imageError) {
          console.error('Failed to save image:', imageError)
          toast.error('Post saved but image failed to save')
        } else {
          console.log('Image saved successfully')
          toast.success('Post and image saved successfully!')
        }
      } else {
        toast.success('Post saved successfully!')
      }

      router.push('/dashboard/content/list')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Editor</h1>
        <p className="text-gray-600 mt-2">
          Create amazing content with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Generation Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Generate content using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Content Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want to write about..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleGenerateContent} 
                disabled={contentLoading || imageLoading}
                className="w-full"
              >
                {contentLoading ? 'Generating Content...' : 'Generate Content'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleGenerateImage} 
                disabled={imageLoading || contentLoading || !title.trim()}
                className="w-full"
              >
                {imageLoading ? 'Generating Image...' : 'Generate Image'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Post Editor</CardTitle>
              <CardDescription>
                Write and edit your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                />
              </div>
              
              {/* Generated Image Display */}
              {generatedImageUrl && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Generated Image</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGeneratedImageUrl('')}
                    >
                      Remove Image
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated content image" 
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        console.error('Image failed to load:', generatedImageUrl)
                        e.currentTarget.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', generatedImageUrl)
                      }}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Image URL: {generatedImageUrl.substring(0, 50)}...
                    </p>
                    <p className="text-sm text-gray-600">
                      Image will be saved with your post
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePost}
                  disabled={saving || !title.trim() || !content.trim()}
                >
                  {saving ? 'Saving...' : 'Save Post'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
