'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { Sparkles, Wand2, Image as ImageIcon, Share2, Save, Loader2 } from 'lucide-react'

export default function ContentCreatorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const supabase = createClient()
  const [socialPosts, setSocialPosts] = useState<Record<string, string>>({})
  const [prompt, setPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState<Array<{
    url: string
    prompt: string
    style: string
    promptNumber: number
  }>>([])
  const [chosenStyle, setChosenStyle] = useState<string | null>(null)
  const [finalImages, setFinalImages] = useState<Array<{ url: string, prompt: string }>>([])
  const [contentLoading, setContentLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPostId, setCurrentPostId] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setContentLoading(true)
    setImageLoading(true)
    setGeneratedImages([])
    setChosenStyle(null)
    setFinalImages([])

    try {
      // First generate content
      const contentResponse = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'blog',
          tone: 'professional',
          length: 'medium',
        }),
      })

      let generatedTitle = ''
      let generatedContent = ''

      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        if (contentData.title) {
          setTitle(contentData.title)
          generatedTitle = contentData.title
        }
        setContent(contentData.content)
        generatedContent = contentData.content
      }

      // Then generate social posts with the ACTUAL title and content
      const socialResponse = await fetch('/api/generate-social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedTitle || prompt,
          content: generatedContent || prompt,
          platforms: ['facebook', 'instagram', 'twitter', 'linkedin', 'discord', 'reddit', 'telegram', 'youtube']
        }),
      })

      if (socialResponse.ok) {
        const socialData = await socialResponse.json()
        setSocialPosts(socialData.socialPosts)
      }

      setContentLoading(false)
      toast.success('Content and social posts generated! Now generating 3 image styles...')

      // After content is generated, generate 3 images with DIFFERENT scenes in DIFFERENT styles
      // User will choose their preferred style, then we regenerate all 3 scenes in that style
      const imageStyles = [
        { name: 'photorealistic', suffix: 'Professional photography, photorealistic, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality, ultra-realistic, 8k. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!' },
        { name: 'digital_art', suffix: 'Digital art, vibrant colors, artistic interpretation, creative composition, modern digital painting, trending on artstation, detailed illustration. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!' },
        { name: 'cosmic', suffix: 'Cosmic ethereal visualization, nebula colors, purple and pink galaxies, celestial energy, mystical universe, starfield background, astral dimensions, divine cosmic atmosphere. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!' }
      ]

      // Generate 3 DIFFERENT scene prompts for variety
      const imagePrompts = [
        `${title || prompt} - Realistic scene depicting the main concept`,
        `${title || prompt} - Abstract artistic representation of key themes`,
        `${title || prompt} - Cosmic mystical visualization with celestial energy`
      ]

      const generatedImagesArray = []

      // Generate 3 images sequentially
      for (let i = 0; i < 3; i++) {
        try {
          const fullPrompt = `${imagePrompts[i]}. ${imageStyles[i].suffix}`

          const imageResponse = await fetch('/api/generate-vercel-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt })
          })

          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            generatedImagesArray.push({
              url: imageData.imageUrl,
              prompt: imagePrompts[i],
              style: imageStyles[i].name,
              promptNumber: i + 1
            })
            console.log(`✅ Image ${i + 1}/3 generated (${imageStyles[i].name})`)
          } else {
            console.error(`❌ Image ${i + 1}/3 failed`)
          }

          // Small delay between generations
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error)
        }
      }

      if (generatedImagesArray.length > 0) {
        setGeneratedImages(generatedImagesArray)
        toast.success(`Generated ${generatedImagesArray.length} images in different styles! Choose your favorite.`)
      } else {
        toast.error('Image generation failed')
      }

    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content')
    } finally {
      setContentLoading(false)
      setImageLoading(false)
    }
  }

  const handleStyleChoice = async (style: string) => {
    setRegenerating(true)
    setChosenStyle(style)

    try {
      toast.loading('Creating full set of 3 diverse scenes in your chosen style...', { id: 'regen' })

      console.log(`🎨 User chose "${style}" style`)
      console.log(`✨ Creating 3 diverse scenes in "${style}" style`)

      const imageStyles: Record<string, string> = {
        photorealistic: 'Professional photography, photorealistic, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality, ultra-realistic, 8k. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!',
        digital_art: 'Digital art, vibrant colors, artistic interpretation, creative composition, modern digital painting, trending on artstation, detailed illustration. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!',
        cosmic: 'Cosmic ethereal visualization, nebula colors, purple and pink galaxies, celestial energy, mystical universe, starfield background, astral dimensions, divine cosmic atmosphere. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!'
      }

      // Generate 3 NEW diverse scenes in the chosen style
      const diversePrompts = [
        `${title || prompt} - Realistic scene with people or objects depicting the main concept`,
        `${title || prompt} - Abstract artistic visualization with shapes and colors representing key themes`,
        `${title || prompt} - Cosmic mystical energy visualization with celestial elements and divine atmosphere`
      ]

      const regeneratedArray = []

      // Generate 3 new images in chosen style
      for (let i = 0; i < 3; i++) {
        try {
          const fullPrompt = `${diversePrompts[i]}. ${imageStyles[style]}`

          console.log(`🎨 Generating image ${i + 1}/3 in ${style} style...`)

          const imageResponse = await fetch('/api/generate-vercel-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt })
          })

          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            regeneratedArray.push({
              url: imageData.imageUrl,
              prompt: diversePrompts[i],
              style: style,
              promptNumber: i + 1,
              variantType: 'final',
              isActive: true
            })
            console.log(`✅ Generated image ${i + 1}/3 in ${style} style`)
          }

          // Small delay between generations
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error)
          toast.error(`Failed to generate image ${i + 1}`, { id: 'regen' })
        }
      }

      setFinalImages(regeneratedArray)

      // Save to database if we have a post ID
      if (currentPostId) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const { data: orgMembers } = await supabase.from('org_members').select('org_id, role').eq('user_id', user!.id)
          const members = orgMembers as unknown as { org_id: string, role: string }[] | null
          const userOrgId = members?.find(member => member.role !== 'client')?.org_id || members?.[0]?.org_id

          // Save all final images to database (all are 'final' since they're freshly generated)
          const imagesToSave = regeneratedArray.map((img, index) => ({
            org_id: userOrgId,
            post_id: currentPostId,
            url: img.url,
            prompt: img.prompt,
            style: img.style,
            variant_type: 'final',
            is_active: true,
            prompt_number: img.promptNumber,
            style_group: crypto.randomUUID()
          }))

          await (supabase as any).from('images').insert(imagesToSave)
          console.log(`✅ Saved ${imagesToSave.length} final images to database`)
        } catch (dbError) {
          console.error('Error saving images to database:', dbError)
        }
      }

      toast.success(`Created full set of 3 images in ${style} style!`, { id: 'regen' })
    } catch (error) {
      console.error('Error creating image set:', error)
      toast.error('Failed to create image set', { id: 'regen' })
    } finally {
      setRegenerating(false)
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

      // Store post ID for later image regeneration
      setCurrentPostId(postData.id)

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

      // Save images - prioritize final images if they exist
      const imagesToProcess = finalImages.length > 0 ? finalImages : generatedImages
      const isFinal = finalImages.length > 0

      if (imagesToProcess.length > 0) {
        try {
          // Save images to database
          const imagesToSave = imagesToProcess.map(img => ({
            org_id: userOrgId,
            post_id: postData.id,
            url: img.url,
            prompt: img.prompt,
            style: (img as any).style || chosenStyle || 'photorealistic',
            variant_type: isFinal ? 'final' : 'original',
            is_active: isFinal, // Final images are active by default
            prompt_number: (img as any).promptNumber || 1,
            style_group: crypto.randomUUID()
          }))

          const { error: imgError } = await (supabase as any).from('images').insert(imagesToSave)

          if (imgError) {
            console.error('Failed to save images:', imgError)
            toast.error('Post saved but images failed to save')
          } else {
            console.log(`✅ Saved ${imagesToSave.length} images`)
            toast.success('Post, social posts, and images saved successfully!')
          }
        } catch (error) {
          console.error('Error saving images:', error)
          toast.error('Post saved but images failed to save')
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
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-purple-200 to-pink-200 text-transparent bg-clip-text">
              Content Creator
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-gray-300">
            Craft legendary content with the power of AI assistance
          </p>
        </div>

        {/* Main Content Layout - Full Width */}
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* AI Generation Panel */}
          <div className="w-full">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-sm shadow-2xl h-full w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-white">AI Oracle</CardTitle>
                </div>
                <CardDescription className="text-gray-300">
                  Whisper your vision, receive quality content
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
                      Creating Package...
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
                  Content ready for the world
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
                      Enter your vision and let the AI create your content
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

        {/* Style Selector - Original Images */}
        {generatedImages.length > 0 && !chosenStyle && (
          <Card className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 border-pink-500/30 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-pink-400" />
                <CardTitle className="text-white">🎨 Choose Your Preferred Style</CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                We generated 3 images in different styles. Click on your favorite to regenerate all images in that style.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="space-y-3"
                  >
                    <div className="relative overflow-hidden rounded-lg border-2 border-pink-500/30 hover:border-pink-400 transition-all duration-300">
                      <div className="w-full h-64 bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Image failed to load:', image.url)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Style info and button - always visible */}
                    <div className="space-y-2">
                      <div className="text-center">
                        <Badge variant="secondary" className="bg-pink-600/20 text-pink-200 text-sm">
                          {image.style.replace('_', ' ')} Style
                        </Badge>
                      </div>

                      <Button
                        onClick={() => handleStyleChoice(image.style)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                        size="lg"
                      >
                        ✨ Create Full Set
                      </Button>

                      <p className="text-gray-400 text-xs text-center">
                        Generates 3 diverse scenes in {image.style.replace('_', ' ')} style
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Images - After Style Choice */}
        {finalImages.length > 0 && chosenStyle && (
          <Card className="bg-gradient-to-br from-green-900/50 to-purple-900/50 border-green-500/30 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">✅ Complete Set ({chosenStyle.replace('_', ' ')} style)</CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                3 diverse scenes in your chosen style - ready to use!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {finalImages.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <div className="w-full h-64 bg-black/30 rounded-lg border-2 border-green-500/30 shadow-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={image.url}
                        alt={`Final image ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-300 text-center">{image.prompt}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regenerating Indicator */}
        {regenerating && (
          <Card className="bg-gradient-to-br from-yellow-900/50 to-purple-900/50 border-yellow-500/30 backdrop-blur-sm shadow-2xl">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
                <p className="text-white text-xl font-semibold">Regenerating images in {chosenStyle?.replace('_', ' ')} style...</p>
                <p className="text-gray-300">This may take a minute...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
