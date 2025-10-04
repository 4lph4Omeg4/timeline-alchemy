'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, FileText, TrendingUp, Users, Save, Package, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface TrendItem {
  trend: string
  source_title: string
  source_url: string
  summary: string
  keywords: string[]
  recommended_formats: string[]
  tags: string[]
  audience: string
  tone: string
  cta_ideas: string[]
}

interface GeneratedPost {
  trend: string
  content: string
  title: string
  excerpt: string
  hashtags: string[]
  suggestions: string[]
  socialPosts?: Record<string, string>
  generatedImage?: string
  metadata: {
    sourceTitle: string
    sourceUrl: string
    audience: string
    tone: string
    keywords: string[]
    tags: string[]
    summary?: string
    generatedAt: string
  }
}

export default function BulkContentGenerator() {
  const [jsonInput, setJsonInput] = useState('')
  const [contentType, setContentType] = useState<'blog' | 'social' | 'mixed'>('blog')
  const [language, setLanguage] = useState<'nl' | 'en'>('nl')
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsedItemsCount, setParsedItemsCount] = useState(0)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [currentResponse, setCurrentResponse] = useState<any>(null)
  const [savingPost, setSavingPost] = useState<string | null>(null)

  const validateJsonInput = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString)
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        setParsedItemsCount(parsed.items.length)
        return true
      }
    } catch (error) {
      setParsedItemsCount(0)
    }
    return false
  }

  const handleGenerate = async () => {
    if (!validateJsonInput(jsonInput)) {
      toast.error('Invalid JSON format or empty items array')
      return
    }

    setIsGenerating(true)
    setGeneratedPosts([])

    try {
      const parsedData = JSON.parse(jsonInput)
      
      const response = await fetch('/api/generate-bulk-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: parsedData.items,
          contentType,
          language
        })
      })

      const result = await response.json()
      setCurrentResponse(result)

      if (result.success && result.generatedPosts) {
        setGeneratedPosts(result.generatedPosts)
        
        // Generate social posts and images for each trend
        if (contentType === 'blog' || contentType === 'mixed') {
          toast.info('Generating social posts and images...')
          await generateSocialPostsAndImages(result.generatedPosts)
        }
        
        toast.success(`Successfully generated ${result.generatedPosts.length} posts!`)
      } else {
        toast.error(result.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Bulk generation error:', error)
      toast.error('Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSocialPostsAndImages = async (posts: GeneratedPost[]) => {
    try {
      for (const post of posts) {
        // Generate social posts
        const socialResponse = await fetch('/api/generate-social-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'discord', 'reddit']
          })
        })
        
        if (socialResponse.ok) {
          const socialData = await socialResponse.json()
          post.socialPosts = socialData.socialPosts || {}
        }
        
        // Generate cosmic image for the topic
        const imagePrompt = `Cosmic-themed image representing: ${post.title}. ${post.metadata.summary}. 
        Style: cosmic, galactic, mystical, spiritual, purple/blue/gold gradients, stars, nebula, sacred geometry. 
        Theme: ${post.metadata.tags?.join(', ') || post.metadata.keywords?.join(', ')}`
        
        const imageResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: imagePrompt })
        })
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          post.generatedImage = imageData.imageUrl
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      toast.success('Social posts and cosmic images generated!')
    } catch (error) {
      console.error('Error generating social posts and images:', error)
      toast.error('Some social posts or images failed to generate')
    }
  }

  const copyPostToClipboard = (post: GeneratedPost) => {
    const formattedPost = `Title: ${post.title}

${post.content}

Hashtags: ${post.hashtags.join(' ')}

Suggestions:
${post.suggestions.map(s => `- ${s}`).join('\n')}

Metadata:
- Audience: ${post.metadata.audience}
- Tone: ${post.metadata.tone}
- Source: ${post.metadata.sourceTitle}
- Generated: ${new Date(post.metadata.generatedAt).toLocaleDateString()}`
    
    navigator.clipboard.writeText(formattedPost)
    toast.success('Post copied to clipboard!')
  }

  const savePostAsPackage = async (post: GeneratedPost) => {
    setSavingPost(post.trend)
    
    // Debug: Check if required fields are present
    console.log('🔍 Saving post:', {
      title: post.title,
      hasContent: !!post.content,
      contentLength: post.content?.length || 0,
      excerpt: post.excerpt,
      fullPost: post
    })
    
    if (!post.title || !post.content || post.content.length === 0) {
      toast.error(`Missing title or content - cannot save package. Content length: ${post.content?.length || 0}`)
      console.error('❌ Missing required fields:', {
        title: post.title,
        content: post.content,
        contentLength: post.content?.length || 0
      })
      return
    }
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      const response = await fetch('/api/create-admin-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          hashtags: post.hashtags,
          suggestions: post.suggestions,
          userId: userId,
          metadata: {
            ...post.metadata,
            bulkGenerated: true,
            sourceType: 'bulk-generator',
            contentType: contentType,
            language: language
          }
        })
      })

      console.log('🔍 Save response status:', response.status)
      console.log('🔍 Save response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('🔍 Save response data:', result)
      
      if (result.success) {
        toast.success(`✅ "${post.title}" saved as package!`)
      } else {
        toast.error(`❌ Failed to save package: ${result.error}`)
        console.error('❌ Save package error:', result)
      }
    } catch (error) {
      console.error('❌ Save package error:', error)
      toast.error('❌ Failed to save package')
    } finally {
      setSavingPost(null)
    }
  }

  const parseSampleData = () => {
    const sampleData = {
      "items": [
        {
          "trend": "AI Consciousness Meditation",
          "source_title": "AI-Assisted Consciousness Practices Emerge",
          "source_url": "https://example.com/ai-consciousness-meditation",
          "summary": "New meditation apps using AI to guide consciousness expansion and track awareness states are gaining popularity among spiritual tech enthusiasts.",
          "keywords": ["AI consciousness", "meditation tech", "awareness tracking", "spiritual AI"],
          "recommended_formats": ["blog", "social"],
          "tags": ["consciousness", "AI", "meditation", "tech"],
          "audience": "Spiritual tech adopters",
          "tone": "insightful",
          "cta_ideas": ["Try AI meditation", "Track your consciousness"]
        },
        {
          "trend": "Crypto Nomad Communities",
          "source_title": "Digital Nomads Building Decentralized Communities",
          "source_url": "https://example.com/crypto-nomad-communities",
          "summary": "Crypto-enabled nomads are creating borderless communities using blockchain technology for governance and resource sharing.",
          "keywords": ["crypto nomad", "decentralized communities", "blockchain governance", "digital sovereignty"],
          "recommended_formats": ["blog", "social"],
          "tags": ["crypto", "nomads", "decentralization", "community"],
          "audience": "Crypto enthusiasts",
          "tone": "bold",
          "cta_ideas": ["Join the community", "Explore crypto options"]
        }
      ]
    }
    
    setJsonInput(JSON.stringify(sampleData, null, 2))
    setParsedItemsCount(sampleData.items.length)
    toast.success('Grok-style sample data loaded!')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <span>✨ Bulk Content Generator</span>
          </CardTitle>
          <CardDescription className="text-gray-200">
            📅 Daily Grok Workflow: Paste trend data → Generate blog + social posts + cosmic images automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentType} onValueChange={(value: 'blog' | 'social' | 'mixed') => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog Posts</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="mixed">Mixed Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(value: 'nl' | 'en') => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* JSON Input */}
          <div>
            <Label htmlFor="jsonInput">Trends JSON Data</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value)
                validateJsonInput(e.target.value)
              }}
              placeholder="Paste your Grok trends JSON data here..."
              rows={10}
              className="font-mono text-sm"
            />
            <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={parseSampleData}>
              Load Grok Sample Data
            </Button>
              {parsedItemsCount > 0 && (
                <Badge variant="secondary">
                  <FileText className="h-3 w-3 mr-1" />
                  {parsedItemsCount} items ready
                </Badge>
              )}
            </div>
            
            {/* Grok Workflow Instructions */}
            <Alert className="bg-purple-900/20 border-purple-500/30">
              <AlertDescription>
                <div className="font-semibold text-purple-200 mb-2">📅 Daily Grok Workflow Instructions:</div>
                <div className="text-sm text-gray-300 space-y-1">
                  <div><strong>1. Copy Grok Response:</strong> Take the JSON array from Grok and paste it directly above</div>
                  <div><strong>2. Select Content Type:</strong> Choose "Blog Posts" for complete package generation</div>
                  <div><strong>3. Generate Complete Package:</strong> Each trend will create blog + social posts + cosmic image</div>
                  <div><strong>4. Save Individual Posts:</strong> Use "Save" buttons to add to your content calendar</div>
                </div>
              </AlertDescription>
            </Alert>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || parsedItemsCount === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ✨ Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                🚀 Generate Complete Package ({parsedItemsCount} trends)
              </>
            )}
          </Button>

          {/* Processing Info */}
          {isGenerating && (
            <Alert className="bg-blue-900/30 border-blue-500/50">
              <AlertDescription>
                <div className="font-semibold">🔄 Processing {parsedItemsCount} trends...</div>
                <div className="text-sm mt-1">
                  This may take a few minutes for large datasets. 
                  <br />
                  <span className="text-yellow-300">⚠️ Rate limited to 3 seconds per post to prevent quota issues.</span>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {currentResponse && (
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-6 w-6 text-green-400" />
              ✨ Generation Results
            </CardTitle>
            <CardDescription className="text-gray-200">
              {currentResponse.summary && (
                `🎉 ${currentResponse.summary.successful}/${currentResponse.summary.totalProcessed} posts generated successfully`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentResponse.errors && currentResponse.errors.length > 0 && (
              <Alert className={`mb-4 ${currentResponse.errors.some((error: string) => error.includes('QUOTA LIMIT')) ? 'bg-red-900/30 border-red-500/50' : ''}`}>
                <AlertDescription>
                  <div className="font-semibold">
                    {currentResponse.errors.some((error: string) => error.includes('QUOTA LIMIT')) 
                      ? '🚨 Quota Limit Reached' 
                      : 'Errors encountered:'}
                  </div>
                  <ul className="list-disc list-inside mt-2">
                    {currentResponse.errors.map((error: string, index: number) => (
                      <li key={index} className={`text-sm ${error.includes('QUOTA LIMIT') ? 'text-red-300 font-semibold' : ''}`}>
                        {error}
                      </li>
                    ))}
                  </ul>
                  {currentResponse.errors.some((error: string) => error.includes('QUOTA LIMIT')) && (
                    <div className="mt-3 p-3 bg-red-800/20 border border-red-500/30 rounded">
                      <div className="text-red-200 text-sm">
                        <strong>💡 Solutions:</strong>
                        <ul className="list-disc list-inside mt-1 ml-4">
                          <li>Check your OpenAI billing and add credits</li>
                          <li>Wait for quota to reset (usually 24 hours)</li>
                          <li>Try generating fewer posts at once</li>
                          <li>Consider upgrading your OpenAI plan</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Generated Posts */}
            <div className="space-y-4">
              {generatedPosts.map((post, index) => (
                <Card key={index} className="bg-gradient-to-br from-purple-800/10 to-blue-800/10 border-purple-500/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-400" />
                          {post.title}
                        </CardTitle>
                        <CardDescription className="mt-1 text-gray-300">
                          📈 Trend: {post.trend} • 🎯 Audience: {post.metadata.audience}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => savePostAsPackage(post)}
                          disabled={savingPost === post.trend}
                          className="border-green-500 text-green-400 hover:bg-green-900/30"
                        >
                          {savingPost === post.trend ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyPostToClipboard(post)}
                          className="border-blue-500 text-blue-400 hover:bg-blue-900/30"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Blog Content */}
                      <div className="bg-purple-800/10 p-4 rounded-lg border border-purple-500/20">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          📝 Blog Post
                        </h4>
                        <div className="text-sm text-gray-200 whitespace-pre-wrap">
                          {post.content}
                        </div>
                      </div>
                      
                      {/* Generated Image */}
                      {post.generatedImage && (
                        <div className="bg-pink-800/10 p-4 rounded-lg border border-pink-500/20">
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-pink-400" />
                            Cosmic Image
                          </h4>
                          <div className="relative">
                            <img 
                              src={post.generatedImage} 
                              alt={`Generated cosmic image for ${post.title}`}
                              className="w-full max-w-md h-auto rounded-lg border border-pink-500/30 shadow-lg"
                              onError={(e) => {
                                console.error('Image failed to load:', post.generatedImage)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <Badge className="absolute top-2 right-2 bg-pink-500/20 text-pink-300">
                              AI Cosmic
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      {/* Social Posts */}
                      {post.socialPosts && Object.keys(post.socialPosts).length > 0 && (
                        <div className="bg-blue-800/10 p-4 rounded-lg border border-blue-500/20">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            Social Media Posts
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(post.socialPosts).map(([platform, content]) => (
                              <div key={platform} className="bg-blue-800/20 p-3 rounded border border-blue-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-blue-400 font-bold text-sm capitalize">{platform}</span>
                                  <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300">
                                    {platform === 'twitter' ? '280 chars' : 
                                     platform === 'instagram' ? 'Caption' :
                                     platform === 'linkedin' ? 'Professional' : 'Social'}
                                  </Badge>
                                </div>
                                <div className="text-gray-200 text-sm whitespace-pre-wrap">
                                  {content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Metadata */}
                      <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <div><span className="font-medium text-purple-300">Keywords:</span> {post.metadata.keywords.join(', ')}</div>
                          <div><span className="font-medium text-blue-300">Tags:</span> {post.metadata.tags.join(', ')}</div>
                          <div><span className="font-medium text-green-300">Tone:</span> {post.metadata.tone}</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}