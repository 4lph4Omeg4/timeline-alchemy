'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { Sparkles, Wand2, Image as ImageIcon, Share2, Save, Loader2 } from 'lucide-react'

export default function ContentCreatorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [socialPosts, setSocialPosts] = useState<Record<string, string>>({})
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
    setImageLoading(true)
    
    try {
      // Generate everything in parallel
      const [contentResponse, socialResponse, imageResponse] = await Promise.all([
        fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            type: 'blog',
            tone: 'professional',
            length: 'medium',
          }),
        }),
        
        fetch('/api/generate-social-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: prompt,
            content: prompt,
            platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit']
          }),
        }),
        
        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })
      ])

      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        if (contentData.title) setTitle(contentData.title)
        setContent(contentData.content)
      }

      if (socialResponse.ok) {
        const socialData = await socialResponse.json()
        setSocialPosts(socialData.socialPosts)
      }

      if (imageResponse.ok) {
        const imageData = await imageResponse.json()
        setGeneratedImageUrl(imageData.imageUrl)
      } else {
        const imageError = await imageResponse.text()
        console.error('Image generation failed:', imageError)
        toast.error('Image generation failed')
      }
      
      toast.success('Complete content package generated!')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content')
    } finally {
      setContentLoading(false)
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

      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (!orgMembers || orgMembers.length === 0) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      let userOrgId = orgMembers.find(member => member.role !== 'client')?.org_id
      if (!userOrgId) {
        userOrgId = orgMembers[0].org_id
      }

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

      // Save social posts to separate table
      if (Object.keys(socialPosts).length > 0) {
        try {
          for (const [platform, content] of Object.entries(socialPosts)) {
            const { error: socialError } = await supabase
              .from('social_posts')
              .insert({
                post_id: postData.id,
                platform,
                content
              })
            
            if (socialError) {
              console.error('Error saving social post:', socialError)
            }
          }
        } catch (error) {
          console.error('Error saving social posts:', error)
        }
      }

      if (generatedImageUrl) {
        // Save image permanently to Supabase Storage
        try {
          const saveImageResponse = await fetch('/api/save-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: generatedImageUrl,
              postId: postData.id,
              orgId: userOrgId
            })
          })

          if (saveImageResponse.ok) {
            toast.success('Post, social posts, and image saved permanently!')
          } else {
            console.error('Failed to save image permanently')
            toast.error('Post saved but image failed to save permanently')
          }
        } catch (error) {
          console.error('Error saving image:', error)
          toast.error('Post saved but image failed to save')
        }
      } else {
        toast.success('Post and social posts saved successfully!')
      }

      router.push('/dashboard/content/list')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        {/* Divine Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-purple-200 to-pink-200 text-transparent bg-clip-text">
              Divine Content Creator
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-gray-300">
            Craft legendary content with the power of divine AI assistance
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* AI Generation Panel */}
          <div className="w-full">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-sm shadow-2xl h-full w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-white">AI Oracle</CardTitle>
                </div>
                <CardDescription className="text-gray-300">
                  Whisper your vision, receive divine content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">Your Vision</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the essence of your content..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-black/30 border-purple-500/50 text-white placeholder-gray-400 min-h-[200px]"
                    rows={8}
                  />
                </div>
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={contentLoading || imageLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  {contentLoading || imageLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Divine Package...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Complete Package
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Editor Panel */}
          <div className="w-full">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-sm shadow-2xl h-full w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    <CardTitle className="text-white">Sacred Manuscript</CardTitle>
                  </div>
                  {(title || content) && (
                    <Button 
                      onClick={handleSavePost} 
                      disabled={saving || !title.trim() || !content.trim()}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <CardDescription className="text-gray-300">
                  Divine content ready for the world
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {title && (
                  <div className="space-y-2">
                    <Label className="text-white text-lg">Title</Label>
                    <div className="p-4 bg-black/30 border border-purple-500/30 rounded-lg">
                      <h2 className="text-2xl font-bold text-white">{title}</h2>
                    </div>
                  </div>
                )}
                
                {content && (
                  <div className="space-y-2">
                    <Label className="text-white text-lg">Content</Label>
                    <div className="p-6 bg-black/30 border border-purple-500/30 rounded-lg max-h-[400px] overflow-y-auto">
                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-wrap">
                          {content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!title && !content && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <Wand2 className="w-16 h-16 text-purple-400/50" />
                    <p className="text-gray-400 text-lg">
                      Enter your vision and let the divine AI create your content
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Media Posts */}
        {Object.keys(socialPosts).length > 0 && (
          <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">Social Prophecies</CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                Platform-optimized posts blessed by the algorithm gods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(socialPosts).map(([platform, post]) => (
                  <div key={platform} className="bg-black/30 border border-blue-500/30 rounded-lg p-4 hover:border-blue-400/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-blue-400 font-bold capitalize text-sm">{platform}</span>
                    </div>
                    <Textarea
                      value={post}
                      onChange={(e) => {
                        setSocialPosts(prev => ({
                          ...prev,
                          [platform]: e.target.value
                        }))
                      }}
                      className="bg-black/50 border-blue-500/30 text-white text-sm min-h-[120px]"
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Image */}
        {generatedImageUrl && (
          <Card className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 border-pink-500/30 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                  <CardTitle className="text-white">Divine Imagery</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneratedImageUrl('')}
                  className="border-pink-500/50 text-pink-300 hover:bg-pink-500/20"
                >
                  Remove
                </Button>
              </div>
              <CardDescription className="text-gray-300">
                AI-crafted visual perfection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated content image" 
                  className="max-w-full h-auto rounded-lg shadow-2xl border-2 border-pink-500/30"
                  onError={(e) => {
                    console.error('Image failed to load:', generatedImageUrl)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
