'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MINLI_CAMPERDEALER_PROFILE, MINLI_TANKSTATION_PROFILE } from '@/lib/ai'
import { AIGenerateRequest, BusinessProfile, BusinessType } from '@/types/index'
import toast from 'react-hot-toast'

export default function ContentEditorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [businessType, setBusinessType] = useState<BusinessType>('general')
  const [customBusinessProfile, setCustomBusinessProfile] = useState<BusinessProfile | null>(null)
  const router = useRouter()

  // Get business profile based on selection
  const getBusinessProfile = (): BusinessProfile | undefined => {
    if (customBusinessProfile) return customBusinessProfile
    
    switch (businessType) {
      case 'camperdealer':
        return MINLI_CAMPERDEALER_PROFILE
      case 'tankstation':
        return MINLI_TANKSTATION_PROFILE
      default:
        return undefined
    }
  }

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
        businessProfile: getBusinessProfile(),
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

      // First save the blog post
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
        toast.error('Failed to save post')
        return
      }

      // If there's a generated image, save it too
      if (generatedImageUrl) {
        const { error: imageError } = await (supabase as any)
          .from('images')
          .insert({
            org_id: userOrgId,
            post_id: postData.id,
            url: generatedImageUrl,
          })

        if (imageError) {
          console.error('Failed to save image:', imageError)
          // Don't fail the whole operation if image save fails
        }
      }

      toast.success('Post saved successfully!')
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
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={businessType} onValueChange={(value: BusinessType) => setBusinessType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Business</SelectItem>
                    <SelectItem value="camperdealer">Camper Dealer</SelectItem>
                    <SelectItem value="tankstation">Gas Station</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="service">Service Business</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
                    />
                    <p className="text-sm text-gray-600 mt-2">
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
