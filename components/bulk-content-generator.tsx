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
  content: string  // Changed from generatedContent to match API response
  title: string
  excerpt: string
  hashtags: string[]
  suggestions: string[]
  metadata: {
    sourceTitle: string
    sourceUrl: string
    audience: string
    tone: string
    keywords: string[]
    tags: string[]
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
      excerpt: post.excerpt
    })
    
    if (!post.title || !post.content) {
      toast.error('Missing title or content - cannot save package')
      console.error('❌ Missing required fields:', {
        title: post.title,
        content: post.content
      })
      return
    }
    
    try {
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
          metadata: {
            ...post.metadata,
            bulkGenerated: true,
            sourceType: 'bulk-generator',
            contentType: contentType,
            language: language
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`✅ "${post.title}" saved as package!`)
      } else {
        toast.error(`❌ Failed to save package: ${result.error}`)
      }
    } catch (error) {
      console.error('Save package error:', error)
      toast.error('❌ Failed to save package')
    } finally {
      setSavingPost(null)
    }
  }

  const parseSampleData = () => {
    const sampleData = {
      "items": [
        {
          "trend": "Kundalini Vocal Activation",
          "source_title": "Vocal Techniques for Kundalini Awakening",
          "source_url": "https://example.com/kundalini-vocal",
          "summary": "Vocal techniques like chanting and toning are used to activate kundalini energy.",
          "keywords": ["kundalini awakening", "vocal activation", "chanting"],
          "recommended_formats": ["short_form", "thread"],
          "tags": ["Spiritualiteit", "kundalini"],
          "audience": "Vocal meditators",
          "tone": "playful",
          "cta_ideas": ["Try a chanting session", "Record your vocal practice"]
        },
        {
          "trend": "Non-Dual Leadership Training",
          "source_title": "Training Leaders in Non-Dual Awareness",
          "source_url": "https://example.com/nondual-leadership-training",
          "summary": "Non-dual leadership training teaches presence and unity in decision-making.",
          "keywords": ["non-dualiteit", "leadership training", "presence"],
          "recommended_formats": ["blog_draft", "caption"],
          "tags": ["Spiritualiteit", "bewustzijn"],
          "audience": "Emerging leaders",
          "tone": "insightful",
          "cta_ideas": ["Enroll in a training", "Apply non-dual principles"]
        }
      ]
    }
    
    setJsonInput(JSON.stringify(sampleData, null, 2))
    setParsedItemsCount(2)
    toast.success('Sample data loaded!')
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
            Upload your Grok trends data and generate multiple blog posts automatically with Timeline Alchemy magic
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
                Load Sample Data
              </Button>
              {parsedItemsCount > 0 && (
                <Badge variant="secondary">
                  <FileText className="h-3 w-3 mr-1" />
                  {parsedItemsCount} items ready
                </Badge>
              )}
            </div>
          </div>

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
                🚀 Generate {parsedItemsCount} Posts
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
                    <div className="space-y-3">
                      <div className="text-sm text-gray-200">
                        <div className="whitespace-pre-wrap">{post.excerpt}</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div><span className="font-medium text-purple-300">Keywords:</span> {post.metadata.keywords.join(', ')}</div>
                          <div><span className="font-medium text-blue-300">Tags:</span> {post.metadata.tags.join(', ')}</div>
                          <div><span className="font-medium text-green-300">Tone:</span> {post.metadata.tone}</div>
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