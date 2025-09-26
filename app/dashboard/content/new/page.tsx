'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateContent, generateImage } from '@/lib/ai'
import { AIGenerateRequest } from '@/types'
import toast from 'react-hot-toast'

export default function ContentEditorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setLoading(true)
    try {
      const request: AIGenerateRequest = {
        prompt,
        type: 'blog',
        tone: 'professional',
        length: 'medium',
      }

      const response = await generateContent(request)
      
      if (response.title) {
        setTitle(response.title)
      }
      setContent(response.content)
      
      toast.success('Content generated successfully!')
    } catch (error) {
      toast.error('Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title first')
      return
    }

    setLoading(true)
    try {
      const imageUrl = await generateImage(title)
      toast.success('Image generated successfully!')
      // In a real app, you'd save this image URL to the database
    } catch (error) {
      toast.error('Failed to generate image')
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to save posts')
        return
      }

      // Get user's first organization
      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!orgMember) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      const { error } = await supabase
        .from('blog_posts')
        .insert({
          org_id: orgMember.org_id,
          title,
          content,
          state: 'draft',
        })

      if (error) {
        toast.error('Failed to save post')
      } else {
        toast.success('Post saved successfully!')
        router.push('/dashboard')
      }
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
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleGenerateImage} 
                disabled={loading || !title.trim()}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Image'}
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
