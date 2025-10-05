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
  const [socialPosts, setSocialPosts] = useState<Record<string, string>>({})
  const [prompt, setPrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  const [category, setCategory] = useState('consciousness')
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
        // Generate blog content
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
        
        // Generate social media posts
        fetch('/api/generate-social-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: prompt,
            content: prompt,
            platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit', 'telegram']
          }),
        }),
        
        // Generate image
        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }),
      ])

      const [contentData, socialData, imageData] = await Promise.all([
        contentResponse.json(),
        socialResponse.json(),
        imageResponse.json(),
      ])

      if (contentData.content) {
        setContent(contentData.content)
        setTitle(contentData.title || prompt)
        if (contentData.category) {
          setCategory(contentData.category)
        }
      }

      if (socialData.socialPosts) {
        setSocialPosts(socialData.socialPosts)
      }

      if (imageData.imageUrl) {
        setGeneratedImageUrl(imageData.imageUrl)
      }

      toast.success('Divine content generated successfully!')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content')
    } finally {
      setContentLoading(false)
      setImageLoading(false)
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

      // First save the blog post
      const { data: postData, error: postError } = await (supabase as any)
        .from('blog_posts')
        .insert({
          org_id: userOrgId,
          title,
          content,
          category,
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

      // Check if user is admin and create admin package
      const isAdmin = orgMembers.some(member => member.role === 'admin' || member.role === 'owner')
      
      if (isAdmin) {
        try {
          // Find Admin Organization
          const { data: adminOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', 'Admin Organization')
            .single()

          if (adminOrg) {
            // Create admin package with the same content
            const { error: adminPackageError } = await supabase
              .from('blog_posts')
              .insert({
                org_id: adminOrg.id,
                title: title,
                content: content,
                category: category,
                state: 'published',
                created_by_admin: true,
                social_posts: socialPosts
              })

            if (adminPackageError) {
              console.error('Error creating admin package:', adminPackageError)
            } else {
              console.log('✅ Admin package created successfully!')
              toast.success('Post saved and admin package created!')
            }
          }
        } catch (error) {
          console.error('Error creating admin package:', error)
        }
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
          console.log('Social posts saved to database:', socialPosts)
        } catch (error) {
          console.error('Error saving social posts:', error)
        }
      }

      // If there's a generated image, save it permanently to Supabase Storage
      if (generatedImageUrl) {
        console.log('Saving image permanently with URL:', generatedImageUrl)
        try {
          // Use the save-image API to permanently store the image
          const saveImageResponse = await fetch('/api/save-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: generatedImageUrl,
              postId: postData.id,
              orgId: userOrgId,
              prompt: `AI generated image for: ${title}`
            })
          })

          if (saveImageResponse.ok) {
            const saveImageData = await saveImageResponse.json()
            console.log('✅ Image saved permanently:', saveImageData.permanentUrl)
            toast.success('Post, social posts, and image saved successfully!')
          } else {
            console.warn('⚠️ Failed to save image permanently, using temporary URL')
            // Fallback to temporary URL if permanent save fails
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
              console.log('Image saved with temporary URL')
              toast.success('Post and social posts saved successfully! (Image saved temporarily)')
            }
          }
        } catch (imageError) {
          console.error('Error saving image permanently:', imageError)
          // Fallback to temporary URL
          const { error: fallbackError } = await (supabase as any)
            .from('images')
            .insert({
              org_id: userOrgId,
              post_id: postData.id,
              url: generatedImageUrl,
            })

          if (fallbackError) {
            console.error('Failed to save image:', fallbackError)
            toast.error('Post saved but image failed to save')
          } else {
            toast.success('Post and social posts saved successfully! (Image saved temporarily)')
          }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Divine Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-xl animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-bounce delay-2000"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 p-6">
        {/* Divine Header */}
        <div className="text-center mb-12">
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 mb-4">
              ✨ Divine Content Creator ✨
            </h1>
            <p className="text-xl text-gray-200 font-light">
              Craft legendary content with the power of divine AI assistance
            </p>
            {/* Divine Glow Effect */}
            <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 rounded-3xl blur-2xl"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Oracle Panel */}
          <Card className="bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-md border-purple-500/30 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-white text-2xl font-bold group-hover:text-purple-200 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">✨</span>
                </div>
                AI Oracle
              </CardTitle>
              <CardDescription className="text-purple-200 text-lg">
                Whisper your vision, receive divine content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-purple-200 font-semibold text-lg">Your Vision</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the essence of your content..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="bg-purple-800/30 border-purple-400/50 text-white placeholder-purple-300/70 focus:border-purple-300 focus:ring-purple-500/20"
                />
              </div>
              <Button 
                onClick={handleGenerateContent} 
                disabled={contentLoading || imageLoading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold text-lg py-4 shadow-xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-105"
              >
                {contentLoading || imageLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    ✨ Generating Divine Package... ✨
                  </span>
                ) : (
                  '✨ Generate Complete Package ✨'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sacred Manuscript Panel */}
          <Card className="bg-gradient-to-br from-blue-900/60 to-purple-900/60 backdrop-blur-md border-blue-500/30 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-white text-2xl font-bold group-hover:text-blue-200 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">📜</span>
                </div>
                Sacred Manuscript
              </CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                Divine content ready for the world
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {content ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-blue-200 font-semibold text-lg">Divine Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter your divine title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-blue-800/30 border-blue-400/50 text-white placeholder-blue-300/70 focus:border-blue-300 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-blue-200 font-semibold text-lg">Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-800/30 border border-blue-400/50 text-white rounded-md focus:border-blue-300 focus:ring-blue-500/20"
                    >
                      <option value="consciousness">🧠 Consciousness & Awakening</option>
                      <option value="ancient_wisdom">🏛️ Ancient Wisdom & Mysteries</option>
                      <option value="ai_technology">🤖 AI & Conscious Technology</option>
                      <option value="crypto_decentralized">💰 Crypto & Decentralized Sovereignty</option>
                      <option value="divine_lifestyle">🌱 Divine Lifestyle & New Earth</option>
                      <option value="mythology_archetypes">⚡ Mythology & Archetypes</option>
                      <option value="global_shifts">🌍 Global Shifts & Conscious Culture</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="content" className="text-blue-200 font-semibold text-lg">Sacred Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Your divine content will appear here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="bg-blue-800/30 border-blue-400/50 text-white placeholder-blue-300/70 focus:border-blue-300 focus:ring-blue-500/20 whitespace-pre-wrap"
                    />
                  </div>
                  
                  {/* Social Media Posts */}
                  {Object.keys(socialPosts).length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-blue-200 font-semibold text-lg">Divine Social Posts</Label>
                      <div className="space-y-3">
                        {Object.entries(socialPosts).map(([platform, post]) => (
                          <div key={platform} className="border border-blue-400/30 rounded-lg p-4 bg-blue-800/20">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-blue-300 font-bold capitalize text-sm">{platform}</span>
                            </div>
                            <Textarea
                              value={post}
                              onChange={(e) => {
                                setSocialPosts(prev => ({
                                  ...prev,
                                  [platform]: e.target.value
                                }))
                              }}
                              className="text-sm bg-blue-700/30 border-blue-400/30 text-white focus:border-blue-300 focus:ring-blue-500/20"
                              rows={3}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Image Display */}
                  {generatedImageUrl && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-blue-200 font-semibold text-lg">Divine Image</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGeneratedImageUrl('')}
                          className="border-blue-400/50 text-blue-200 hover:bg-blue-400/20"
                        >
                          Remove Image
                        </Button>
                      </div>
                      <div className="border border-blue-400/30 rounded-lg p-4 bg-blue-800/20">
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
                        <p className="text-sm text-blue-300 mt-2">
                          Divine Image URL: {generatedImageUrl.substring(0, 50)}...
                        </p>
                        <p className="text-sm text-blue-300">
                          Image will be saved with your sacred manuscript
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard')}
                      className="border-blue-400/50 text-blue-200 hover:bg-blue-400/20"
                    >
                      Cancel Divine Journey
                    </Button>
                    <Button 
                      onClick={handleSavePost}
                      disabled={saving || !title.trim() || !content.trim()}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold shadow-xl hover:shadow-blue-500/50 transition-all duration-500 transform hover:scale-105"
                    >
                      {saving ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          💾 Saving Divine Content... 💾
                        </span>
                      ) : (
                        '💾 Save Sacred Manuscript 💾'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🪄</span>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-200 mb-2">Enter your vision and let the divine AI create your content</h3>
                  <p className="text-blue-300/70">The AI Oracle will craft your sacred manuscript</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}