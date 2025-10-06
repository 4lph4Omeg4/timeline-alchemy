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
  title: string
  summary: string
  tags: string[]
  // Optional fields for backward compatibility
  trend?: string
  source_title?: string
  source_url?: string
  keywords?: string[]
  recommended_formats?: string[]
  audience?: string
  tone?: string
  cta_ideas?: string[]
}

const CONTENT_CATEGORIES = [
  'Consciousness & Awakening & Enlightenment',
  'Esoterica & Ancient Wisdom & Mysteries', 
  'AI & Conscious Technology & Future',
  'Crypto & Decentralized Sovereignty',
  'Divine Lifestyle & New Earth & Harmony',
  'Mythology & Archetypes & Ancient Secrets',
  'Global Shifts & Conscious Culture & Awakening'
] as const

interface GeneratedPost {
  trend: string
  content: string
  title: string
  excerpt: string
  hashtags: string[]
  suggestions: string[]
  category: string
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

// 🌟 Divine category classifier
const detectCategoryFromContent = (title: string, summary: string, tags: string[]): string => {
  const combinedText = `${title} ${summary} ${tags.join(' ')}`.toLowerCase()
  
  // Consciousness & Awakening keywords
  if (combinedText.includes('consciousness') || combinedText.includes('awakening') || 
      combinedText.includes('enlightenment') || combinedText.includes('meditation') ||
      combinedText.includes('spiritual evolution') || combinedText.includes('conscious')) {
    return 'Consciousness & Awakening & Enlightenment'
  }
  
  // AI & Tech keywords  
  if (combinedText.includes('ai') || combinedText.includes('artificial intelligence') ||
      combinedText.includes('technology') || combinedText.includes('future') ||
      combinedText.includes('quantum') || combinedText.includes('conscious tech')) {
    return 'AI & Conscious Technology & Future'
  }
  
  // Crypto & Decentralization keywords
  if (combinedText.includes('crypto') || combinedText.includes('blockchain') ||
      combinedText.includes('decentralized') || combinedText.includes('bitcoin') ||
      combinedText.includes('web3') || combinedText.includes('finance')) {
    return 'Crypto & Decentralized Sovereignty'
  }
  
  // Esoterica & Ancient Wisdom keywords
  if (combinedText.includes('ancient') || combinedText.includes('wisdom') ||
      combinedText.includes('mystery') || combinedText.includes('esoteric') ||
      combinedText.includes('sacred') || combinedText.includes('heritage')) {
    return 'Esoterica & Ancient Wisdom & Mysteries'
  }
  
  // Lifestyle & New Earth keywords
  if (combinedText.includes('lifestyle') || combinedText.includes('wellness') ||
      combinedText.includes('harmony') || combinedText.includes('balance') ||
      combinedText.includes('zen') || combinedText.includes('mindful')) {
    return 'Divine Lifestyle & New Earth & Harmony'
  }
  
  // Mythology & Archetypes keywords
  if (combinedText.includes('mythology') || combinedText.includes('archetype') ||
      combinedText.includes('legend') || combinedText.includes('symbol') ||
      combinedText.includes('ritual') || combinedText.includes('tradition')) {
    return 'Mythology & Archetypes & Ancient Secrets'
  }
  
  // Global shifts & culture keywords  
  if (combinedText.includes('global') || combinedText.includes('culture') ||
      combinedText.includes('shift') || combinedText.includes('society') ||
      combinedText.includes('movement') || combinedText.includes('transformation')) {
    return 'Global Shifts & Conscious Culture & Awakening'
  }
  
  // Default category
  return 'Consciousness & Awakening & Enlightenment'
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
      
      // Check if it's direct Grok format (array of trends)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.every(item => 
          item.title && 
          item.summary && 
          item.tags && 
          Array.isArray(item.tags)
        )
      }
      
      // Check if it's wrapped format with items
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return true
      }
      
      return false
    } catch {
      return false
    }
  }

  const isJsonValid = validateJsonInput(jsonInput)

  React.useEffect(() => {
    if (isJsonValid) {
      try {
        const parsed = JSON.parse(jsonInput)
        // Handle direct Grok format (array) or wrapped format ({items: array})
        const itemsLength = Array.isArray(parsed) ? parsed.length : (parsed.items?.length || 0)
        setParsedItemsCount(itemsLength)
      } catch {
        setParsedItemsCount(0)
      }
    } else {
      setParsedItemsCount(0)
    }
  }, [jsonInput, isJsonValid])

  const handleGenerate = async () => {
    if (!validateJsonInput(jsonInput)) {
      toast.error('Invalid JSON format or empty items array')
      return
    }

    setIsGenerating(true)
    setGeneratedPosts([])

    try {
      const parsedData = JSON.parse(jsonInput)
      
      // Handle direct Grok format (array) or wrapped format ({items: array})
      const items = Array.isArray(parsedData) ? parsedData : parsedData.items
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes
      
      const response = await fetch('/api/generate-bulk-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items,
          contentType,
          language
        }),
        signal: controller.signal // Use abort signal for timeout
      })
      
      // Clear timeout if request completes successfully
      clearTimeout(timeoutId)

      // Better error handling for non-JSON responses
      let result
      try {
        const responseText = await response.text()
        if (!responseText) {
          throw new Error('Empty response from server')
        }
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        toast.error(`Server error: ${response.status} ${response.statusText}`)
        return
      }
      setCurrentResponse(result)

      if (result.success && result.generatedPosts) {
        setGeneratedPosts(result.generatedPosts)
        
        // DIVINE COMPLETE PACKAGE GENERATION - Always generate complete packages
        console.log('🌟 Triggering DIVINE complete package generation...')
        toast.loading('🌟 Generating divine social posts and cosmic images...', { duration: 3000 })
        await generateSocialPostsAndImages(result.generatedPosts)
        
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
    console.log('🌟 Starting DIVINE social posts and images generation for', posts.length, 'posts')
    
    try {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        console.log(`✨ Generating divine content for ${i + 1}/${posts.length}: ${post.title}`)
        
        // DIVINE SOCIAL POSTS GENERATION
        try {
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
            console.log('🎉 Social posts generated successfully for', post.title)
          } else {
            console.error('❌ Social posts failed for', post.title, 'Status:', socialResponse.status)
            // Create platform-optimized fallback social posts if API fails
            const shortTitle = post.title.length > 50 ? post.title.substring(0, 47) + '...' : post.title
            
            post.socialPosts = {
              twitter: `🚀 ${shortTitle}\n\n${post.content.substring(0, 150)}...\n\n#AI #Content #Innovation`,
              instagram: `✨ ${shortTitle} ✨\n\n${post.content.substring(0, 200)}...\n\n#AI #Content #Innovation #Tech`,
              facebook: `${shortTitle}\n\n${post.content.substring(0, 400)}...\n\n#Content #AI #Innovation #Technology`,
              linkedin: `Professional insight: ${shortTitle}\n\n${post.content.substring(0, 600)}...\n\n#Professional #AI #Business #Innovation`,
              discord: `${shortTitle} 🎮\n\n${post.content.substring(0, 200)}...\n\n#AI #Community #Tech #Discussion`,
              reddit: `${shortTitle} 🤖\n\n${post.content.substring(0, 200)}...\n\n#AI #Discussion #Tech #Innovation`,
              telegram: `📢 ${shortTitle}\n\n${post.content.substring(0, 300)}...\n\n#AI #Tech #Innovation #Update`
            }
          }
        } catch (socialError) {
          console.error('❌ Social generation error:', socialError)
          // Ultimate fallback - ensure all platforms have posts
          const shortTitle = post.title.length > 50 ? post.title.substring(0, 47) + '...' : post.title
          
          post.socialPosts = {
            twitter: `🚀 ${shortTitle}\n\n${post.content.substring(0, 150)}...\n\n#AI #Content #Innovation`,
            instagram: `✨ ${shortTitle} ✨\n\n${post.content.substring(0, 200)}...\n\n#AI #Content #Innovation #Tech`,
            facebook: `${shortTitle}\n\n${post.content.substring(0, 400)}...\n\n#Content #AI #Innovation #Technology`,
            linkedin: `Professional insight: ${shortTitle}\n\n${post.content.substring(0, 600)}...\n\n#Professional #AI #Business #Innovation`,
            discord: `${shortTitle} 🎮\n\n${post.content.substring(0, 200)}...\n\n#AI #Community #Tech #Discussion`,
            reddit: `${shortTitle} 🤖\n\n${post.content.substring(0, 200)}...\n\n#AI #Discussion #Tech #Innovation`,
            telegram: `📢 ${shortTitle}\n\n${post.content.substring(0, 300)}...\n\n#AI #Tech #Innovation #Update`
          }
        }
        
        // Validate and fix Twitter posts (max 280 characters)
        if (post.socialPosts?.twitter) {
          const twitterPost = post.socialPosts.twitter
          if (twitterPost.length > 280) {
            // Truncate Twitter post to fit within 280 characters
            const truncatedContent = twitterPost.substring(0, 250) + '...'
            post.socialPosts.twitter = truncatedContent
            console.log('🔧 Twitter post truncated to fit 280 character limit')
          }
        }
        
        // Ensure Telegram post exists
        if (!post.socialPosts?.telegram) {
          const shortTitle = post.title.length > 50 ? post.title.substring(0, 47) + '...' : post.title
          if (!post.socialPosts) {
            post.socialPosts = {}
          }
          post.socialPosts.telegram = `📢 ${shortTitle}\n\n${post.content.substring(0, 300)}...\n\n#AI #Tech #Innovation #Update`
          console.log('🔧 Telegram post added as fallback')
        }
        
        // 🌟 DYNAMIC CATEGORY-SPECIFIC IMAGE GENERATION
        try {
          // Create relevant image prompt based on content and category
          const category = post.category || 'Consciousness & Awakening'
          const topicTags = post.metadata.tags?.join(', ') || 'consciousness spirituality'
          const titleWords = post.title.toLowerCase()
          
          let imagePrompt = `Professional illustration for article: "${post.title}". `
          
          // 🧠 CONSCIOUSNESS & AWAKENING - Mind expansion, enlightenment, meditation
          if (category.includes('Consciousness') || category.includes('Awakening')) {
            if (titleWords.includes('meditation') || titleWords.includes('mindfulness')) {
              imagePrompt += `Style: Serene meditation scene, peaceful lotus position, soft golden light, floating consciousness symbols, zen garden elements, warm amber and deep purple colors, ethereal atmosphere. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('brain') || titleWords.includes('neural')) {
              imagePrompt += `Style: Neural network visualization, glowing brain synapses, interconnected neurons, electric blue and purple pathways, scientific yet mystical, digital consciousness awakening. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: Consciousness expansion visualization, ascending energy spirals, enlightenment symbols, warm golden light radiating outward, peaceful awakening scene, deep purple and gold tones. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // 🤖 AI & CONSCIOUS TECHNOLOGY - Futuristic, digital, tech-forward
          else if (category.includes('AI') || category.includes('Technology')) {
            if (titleWords.includes('quantum') || titleWords.includes('computing')) {
              imagePrompt += `Style: Quantum computing visualization, crystalline structures, holographic data streams, electric blue and silver colors, futuristic laboratory setting, advanced technology. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('robot') || titleWords.includes('android')) {
              imagePrompt += `Style: Conscious AI being, humanoid robot with glowing eyes, digital consciousness emerging, sleek metallic design, blue and white lighting, futuristic workshop. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: AI consciousness visualization, digital brain networks, holographic interfaces, clean minimalist tech design, electric blue and silver color scheme, futuristic atmosphere. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // 💰 CRYPTO & DECENTRALIZED SOVEREIGNTY - Blockchain, freedom, digital gold
          else if (category.includes('Crypto') || category.includes('Decentralized')) {
            if (titleWords.includes('bitcoin') || titleWords.includes('crypto')) {
              imagePrompt += `Style: Digital currency visualization, golden Bitcoin symbols, blockchain network connections, decentralized nodes, warm gold and orange colors, financial freedom theme. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('defi') || titleWords.includes('web3')) {
              imagePrompt += `Style: DeFi ecosystem visualization, interconnected financial protocols, digital vaults, bright green and gold colors, decentralized finance network. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: Decentralized sovereignty visualization, blockchain network, digital freedom symbols, warm gold and deep blue colors, financial independence theme. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // 🏛️ ANCIENT WISDOM & MYSTERIES - Historical, mystical, sacred
          else if (category.includes('Ancient') || category.includes('Wisdom')) {
            if (titleWords.includes('pyramid') || titleWords.includes('egypt')) {
              imagePrompt += `Style: Ancient Egyptian wisdom, pyramid silhouettes, hieroglyphic symbols, golden desert sands, mystical artifacts, warm amber and deep brown tones. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('temple') || titleWords.includes('sacred')) {
              imagePrompt += `Style: Sacred temple architecture, ancient stone structures, mystical symbols, ethereal lighting, earthy brown and golden colors, timeless wisdom. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: Ancient wisdom visualization, historical artifacts, mystical symbols, sacred geometry, earthy tones with golden accents, timeless knowledge. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // 🌱 DIVINE LIFESTYLE & NEW EARTH - Sustainable, harmonious, natural
          else if (category.includes('Lifestyle') || category.includes('New Earth')) {
            if (titleWords.includes('sustainable') || titleWords.includes('eco')) {
              imagePrompt += `Style: Sustainable living scene, green earth elements, renewable energy symbols, natural harmony, fresh green and earth tones, environmental consciousness. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('wellness') || titleWords.includes('healing')) {
              imagePrompt += `Style: Wellness and healing visualization, natural elements, healing crystals, peaceful nature scene, soft green and blue colors, holistic health. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: Divine lifestyle visualization, harmonious living, natural elements, earth-connected imagery, fresh green and warm earth tones, sustainable future. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // ⚡ MYTHOLOGY & ARCHETYPES - Legendary, symbolic, mystical
          else if (category.includes('Mythology') || category.includes('Archetypes')) {
            if (titleWords.includes('dragon') || titleWords.includes('mythical')) {
              imagePrompt += `Style: Mythological dragon, ancient legends, mystical creatures, symbolic imagery, deep purple and gold colors, legendary storytelling. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('gods') || titleWords.includes('deities')) {
              imagePrompt += `Style: Ancient deities visualization, mythological symbols, divine archetypes, ethereal lighting, rich purple and golden tones, sacred mythology. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: Mythological archetypes, ancient symbols, legendary imagery, mystical atmosphere, deep purple and gold colors, timeless stories. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // 🌍 GLOBAL SHIFTS & CONSCIOUS CULTURE - Worldwide, cultural, transformative
          else if (category.includes('Global') || category.includes('Culture')) {
            if (titleWords.includes('unity') || titleWords.includes('together')) {
              imagePrompt += `Style: Global unity visualization, world connection symbols, cultural diversity, rainbow colors blending, worldwide harmony, interconnected humanity. NO TEXT, NO WORDS, NO LETTERS.`
            } else if (titleWords.includes('movement') || titleWords.includes('change')) {
              imagePrompt += `Style: Social movement visualization, transformative energy, cultural shift symbols, dynamic colors, global change, progressive movement. NO TEXT, NO WORDS, NO LETTERS.`
            } else {
              imagePrompt += `Style: Global consciousness visualization, world culture blend, transformative symbols, vibrant multicultural colors, worldwide awakening. NO TEXT, NO WORDS, NO LETTERS.`
            }
          } 
          // Default fallback
          else {
            imagePrompt += `Style: Professional illustration, relevant symbolic imagery, clean modern design, appropriate color scheme, high-quality visual storytelling. NO TEXT, NO WORDS, NO LETTERS.`
          }
          
          imagePrompt += ` Theme: ${topicTags}. High quality, professional article illustration, detailed and engaging.`
          
          const imageResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: imagePrompt })
          })
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            console.log('🌟 Cosmic image generated for', post.title)
            
            // Store temporary image URL - will be saved permanently after post creation
            post.generatedImage = imageData.imageUrl
            console.log('🌟 Image generated, will be saved permanently after post creation')
          } else {
            console.error('❌ Image generation failed for', post.title, 'Status:', imageResponse.status)
          }
        } catch (imageError) {
          console.error('❌ Image generation error:', imageError)
        }
        
        // Divine timing - respect the universe's rhythm
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Update UI immediately
        setGeneratedPosts([...generatedPosts]) // Trigger re-render
        
        // Update loading toast
        toast.loading(`🌟 Generating divine content ${i + 1}/${posts.length}...`, {
          id: 'divine-generation'
        })
      }
      
      // Final update
      setGeneratedPosts([...posts])
      
      // 🚀 AUTOMATICALLY SAVE ALL POSTS AS ADMIN PACKAGES
      await saveAllPostsAsPackages(posts)
      
      // Replace loading toast with success
      toast.success('🎉 All divine content generated and automatically saved as packages!', {
        id: 'divine-generation'
      })
    } catch (error) {
      console.error('❌ Divine generation error:', error)
      // Replace loading toast with error
      toast.error('❌ Some divine content failed to generate', {
        id: 'divine-generation'
      })
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

  const saveAllPostsAsPackages = async (posts: GeneratedPost[]) => {
    console.log('🚀 Auto-saving all posts as admin packages:', posts.length)
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      toast.loading('💾 Auto-saving all packages...', {
        id: 'auto-save'
      })

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        console.log(`💾 Auto-saving package ${i + 1}/${posts.length}: ${post.title}`)
        
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
              category: post.category,
              userId: userId,
              socialPosts: post.socialPosts || {},
              generatedImage: post.generatedImage || null,
              metadata: {
                ...post.metadata,
                bulkGenerated: true,
                sourceType: 'bulk-generator',
                contentType: contentType,
                language: language,
                autoSaved: true
              }
            })
          })

          const result = await response.json()
          
          if (result.success) {
            successCount++
            console.log(`✅ Auto-saved: ${post.title}`)
          } else {
            failCount++
            console.error(`❌ Auto-save failed: ${post.title}`, result.error)
          }

          // Respect the universe
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          failCount++
          console.error(`❌ Auto-save error for ${post.title}:`, error)
        }
      }

      // Update loading toast
      toast.success(`🎉 Auto-saved ${successCount} packages successfully! ${failCount > 0 ? `${failCount} failed.` : ''}`, {
        id: 'auto-save'
      })

    } catch (error) {
      console.error('❌ Auto-save error:', error)
      toast.error('❌ Auto-save failed', {
        id: 'auto-save'
      })
    }
  }

  const savePostAsPackage = async (post: GeneratedPost) => {
    setSavingPost(post.trend)
    
    if (!post.title || !post.content || post.content.length === 0) {
      toast.error(`Missing title or content - cannot save package`)
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
          category: post.category,
          userId: userId,
          socialPosts: post.socialPosts || {},
          generatedImage: post.generatedImage || null,
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
      console.error('❌ Save package error:', error)
      toast.error('❌ Failed to save package')
    } finally {
      setSavingPost(null)
    }
  }

  const parseSampleData = () => {
    const sampleData = [
      {
        "title": "AI Consciousness Meditation: Digital Enlightenment Platforms Emerge",
        "summary": "New meditation apps using AI to guide consciousness expansion and track awareness states are gaining popularity among spiritual tech enthusiasts across Substack, Medium, and consciousness blogs.",
        "tags": ["consciousness", "AI", "meditation", "tech", "spiritual"]
      },
      {
        "title": "Crypto Nomad Communities: Decentralized Living on Luxury Yachts",
        "summary": "Crypto-enabled nomads are creating borderless communities using blockchain technology for governance and resource sharing, merging digital sovereignty with luxury nomadic lifestyle.",
        "tags": ["crypto", "nomads", "decentralization", "luxury", "yachts"]
      },
      {
        "title": "Quantum Echoes: Ancient Sound Tech Powers Modern Consciousness Hacks",
        "summary": "Consciousness blogs and Medium threads converge on reviving psychoacoustic architecture from ancient traditions, using AI to amplify sound waves for transcending default states.",
        "tags": ["psychoacoustics", "consciousness", "AItherapy", "vibration", "ancientwisdom"]
      }
    ]
    
    setJsonInput(JSON.stringify(sampleData, null, 2))
    setParsedItemsCount(sampleData.length)
    toast.success('Real Grok format loaded!')
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
            <Label htmlFor="jsonInput">Trend Data (JSON)</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
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
                🚀 Generate Complete Package ({parsedItemsCount} items)
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
              <Alert>
                <AlertDescription>
                  <div className="font-semibold">Errors encountered:</div>
                  <ul className="list-disc list-inside mt-2">
                    {currentResponse.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
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
                          📈 Trend: {post.trend} • 🌟 Category: <span className="text-purple-300 font-semibold">{post.category}</span> • 🎯 Audience: {post.metadata.audience}
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
