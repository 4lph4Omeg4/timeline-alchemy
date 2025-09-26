'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader } from '@/components/Loader'
import { generateComprehensiveContent } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { BlogPost } from '@/types/index'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

export default function ContentPage() {
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState<'professional' | 'casual' | 'friendly' | 'authoritative'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast.error('Please enter an idea for your content')
      return
    }

    setIsGenerating(true)
    try {
      const content = await generateComprehensiveContent({
        prompt: idea,
        tone,
        length,
        platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
      })

      setGeneratedContent(content)
      toast.success('Content generated successfully!')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to save content')
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

      // Save blog post
      const { data: blogPost, error: blogError } = await supabase
        .from('blog_posts')
        .insert({
          org_id: orgMember.org_id,
          title: generatedContent.blogPost.title,
          content: generatedContent.blogPost.content,
          state: 'draft'
        })
        .select()
        .single()

      if (blogError) {
        throw blogError
      }

      // Save image
      if (generatedContent.image.url) {
        await supabase
          .from('images')
          .insert({
            org_id: orgMember.org_id,
            post_id: blogPost.id,
            url: generatedContent.image.url
          })
      }

      toast.success('Content saved successfully!')
      router.push(`/dashboard/content/${blogPost.id}`)
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">AI Content Creator</h1>
        <p className="text-gray-300 mt-2">
          Transform your ideas into complete content packages with AI assistance
        </p>
      </div>

      {/* Input Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Content Idea</CardTitle>
          <CardDescription className="text-gray-300">
            Describe your content idea and let AI create a complete blog post, image, and social media posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="idea" className="text-white">Your Idea</Label>
            <Textarea
              id="idea"
              placeholder="e.g., The future of remote work, sustainable living tips, mindfulness in business..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tone" className="text-white">Tone</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="length" className="text-white">Length</Label>
              <Select value={length} onValueChange={(value: any) => setLength(value)}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (500-800 words)</SelectItem>
                  <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                  <SelectItem value="long">Long (1200+ words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !idea.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Generating Content...
              </>
            ) : (
              'Generate Complete Content Package'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <div className="space-y-6">
          {/* Blog Post */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Generated Blog Post</CardTitle>
              <CardDescription className="text-gray-300">
                AI-generated blog post with non-dual perspective
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {generatedContent.blogPost.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {generatedContent.blogPost.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: generatedContent.blogPost.content }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Image */}
          {generatedContent.image.url && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Generated Image</CardTitle>
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Social Media Posts</CardTitle>
              <CardDescription className="text-gray-300">
                Platform-optimized posts ready for publishing
              </CardDescription>
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
                  <p className="text-gray-300">{generatedContent.socialPosts.facebook}</p>
                </div>
              </div>

              {/* Instagram */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">📷</span>
                  </div>
                  <h4 className="font-semibold text-white">Instagram</h4>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300">{generatedContent.socialPosts.instagram}</p>
                </div>
              </div>

              {/* Twitter/X */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">𝕏</span>
                  </div>
                  <h4 className="font-semibold text-white">Twitter/X</h4>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300">{generatedContent.socialPosts.twitter}</p>
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">in</span>
                  </div>
                  <h4 className="font-semibold text-white">LinkedIn</h4>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300">{generatedContent.socialPosts.linkedin}</p>
                </div>
              </div>

              {/* TikTok */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎵</span>
                  </div>
                  <h4 className="font-semibold text-white">TikTok</h4>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300">{generatedContent.socialPosts.tiktok}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Content Package'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setGeneratedContent(null)}
              className="flex-1"
            >
              Generate New Content
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
