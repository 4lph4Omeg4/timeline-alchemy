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
  generatedImages?: Array<{
    url: string
    prompt: string
    style: string
    promptNumber: number
  }>
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
  const [language, setLanguage] = useState<'nl' | 'en' | 'auto'>('auto')
  const [imageStyle, setImageStyle] = useState<'photorealistic' | 'digital_art' | 'cosmic'>('photorealistic')
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

    // Parse and check item count
    const parsedData = JSON.parse(jsonInput)
    const items = Array.isArray(parsedData) ? parsedData : parsedData.items

    // Warn if more than 3 items
    if (items.length > 3) {
      const confirmed = confirm(
        `⚠️ WARNING: You're trying to process ${items.length} items.\n\n` +
        `For best results, we recommend processing MAX 3 items at a time.\n` +
        `More items significantly increases the chance of errors and timeouts.\n\n` +
        `Do you want to continue anyway?`
      )
      if (!confirmed) {
        return
      }
    }

    setIsGenerating(true)
    setGeneratedPosts([])

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    try {

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes

      const response = await fetch('/api/generate-bulk-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items,
          contentType: 'blog', // Always generate complete blog packages
          language,
          userId // Pass userId for organization lookup
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
              platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'discord', 'reddit', 'telegram']
            })
          })

          if (socialResponse.ok) {
            const socialData = await socialResponse.json()
            post.socialPosts = socialData.socialPosts || {}
            console.log('🎉 Social posts generated successfully for', post.title)
          } else {
            console.error('❌ Social posts failed for', post.title, 'Status:', socialResponse.status)
            // Create platform-optimized fallback social posts if API fails
            const shortTitle = post.title.length > 80 ? post.title.substring(0, 77) + '...' : post.title

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

        // 🌟 MULTI-IMAGE GENERATION (3 images in different styles using existing API)
        try {
          console.log(`🎨 Generating 3 images in different styles for: ${post.title}`)

          // Use the selected image style for all 3 images (consistent style per package)
          const imageStyleSuffixes: Record<string, string> = {
            'photorealistic': 'Professional photography, photorealistic, high resolution, cinematic lighting, detailed and engaging, visually stunning, high quality, ultra-realistic, 8k. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!',
            'digital_art': 'Digital art, vibrant colors, artistic interpretation, creative composition, modern digital painting, trending on artstation, detailed illustration. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!',
            'cosmic': 'Cosmic ethereal visualization, nebula colors, purple and pink galaxies, celestial energy, mystical universe, starfield background, astral dimensions, divine cosmic atmosphere. CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO SPELLING in the image!'
          }

          const selectedStyleSuffix = imageStyleSuffixes[imageStyle]

          // Create 3 DIFFERENT prompts to get variety in scenes (all in the same selected style)
          const imagePrompts = [
            `${post.title} - Realistic scene with people or objects depicting the main concept`,
            `${post.title} - Abstract artistic visualization with shapes and colors representing key themes`,
            `${post.title} - Cosmic mystical energy visualization with celestial elements and divine atmosphere`
          ]

          const generatedImagesArray = []

          // Generate 3 images sequentially using the working API (all in selected style)
          for (let imgIndex = 0; imgIndex < 3; imgIndex++) {
            try {
              const fullPrompt = `${imagePrompts[imgIndex]}. ${selectedStyleSuffix}`

              console.log(`🎨 Generating image ${imgIndex + 1}/3 in ${imageStyle} style for: ${post.title}`)

              const imageResponse = await fetch('/api/generate-vercel-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: fullPrompt })
              })

              if (imageResponse.ok) {
                const imageData = await imageResponse.json()
                generatedImagesArray.push({
                  url: imageData.imageUrl,
                  prompt: imagePrompts[imgIndex],
                  style: imageStyle, // Use the selected style for all images
                  promptNumber: imgIndex + 1,
                  variantType: 'final',
                  isActive: true
                })
                console.log(`✅ Image ${imgIndex + 1}/3 generated in ${imageStyle} style for ${post.title}`)
              }

              // Small delay between images
              if (imgIndex < 2) {
                await new Promise(resolve => setTimeout(resolve, 1500))
              }
            } catch (imgError) {
              console.error(`❌ Error generating image ${imgIndex + 1}:`, imgError)
            }
          }

          if (generatedImagesArray.length > 0) {
            post.generatedImages = generatedImagesArray
            console.log(`✅ Generated ${generatedImagesArray.length} diverse images in ${imageStyle} style for ${post.title}`)
            console.log('🔍 Generated images array:', JSON.stringify(generatedImagesArray, null, 2))
          } else {
            // Fallback to single image if all 3 failed
            console.log('⚠️ No images generated, falling back to single image')
            await generateSingleImageFallback(post)
          }
        } catch (imageError) {
          console.error('❌ Image generation error:', imageError)
          // Fallback to old single image method
          await generateSingleImageFallback(post)
        }

        // Divine timing - respect the universe's rhythm
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Update UI immediately
        setGeneratedPosts([...generatedPosts]) // Trigger re-render

        // Update loading toast
        toast.loading(`🌟 Generating content ${i + 1}/${posts.length}...`, {
          id: 'divine-generation'
        })
      }

      // Final update
      setGeneratedPosts([...posts])

      // 🚀 AUTOMATICALLY SAVE ALL POSTS AS ADMIN PACKAGES
      await saveAllPostsAsPackages(posts)

      toast.success('🎉 All content packages generated and automatically saved!', {
        id: 'divine-generation'
      })

    } catch (error) {
      console.error('❌ Error generating social and image content:', error)
      toast.error('Failed to generate some content', {
        id: 'divine-generation'
      })
    }
  }

  // Fallback function for single image generation
  const generateSingleImageFallback = async (post: GeneratedPost) => {
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

      const imageResponse = await fetch('/api/generate-vercel-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt
        })
      })

      if (imageResponse.ok) {
        const imageData = await imageResponse.json()
        console.log('🌟 Cosmic image generated for', post.title)
        console.log('🔍 Image data received:', imageData)

        // Store as single image array for fallback
        post.generatedImages = [{
          url: imageData.imageUrl,
          prompt: imagePrompt,
          style: 'photorealistic',
          promptNumber: 1
        }]
        console.log('🌟 Image generated, will be saved permanently after post creation')
        console.log('🔍 Generated image URL:', imageData.imageUrl)
      } else {
        console.error('❌ Image generation failed for', post.title, 'Status:', imageResponse.status)
        const errorText = await imageResponse.text()
        console.error('❌ Image generation error:', errorText)
      }
    } catch (error) {
      console.error('❌ Fallback image generation error:', error)
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
          const response = await fetch('/api/save-post', {
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
              generatedImages: post.generatedImages || [],
              metadata: {
                ...post.metadata,
                bulkGenerated: true,
                sourceType: 'bulk-generator',
                contentType: 'blog',
                language: language,
                autoSaved: true
              }
            }, (key, value) => {
              // Debug: Log what we're sending
              if (key === 'generatedImages') {
                console.log(`📸 Sending ${value?.length || 0} images for ${post.title}`)
              }
              return value
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
          generatedImages: post.generatedImages || [],
          metadata: {
            ...post.metadata,
            bulkGenerated: true,
            sourceType: 'bulk-generator',
            contentType: 'blog',
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
            📦 Generate complete content packages: Each topic creates a blog post + social media posts + AI image automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Agent Instructions */}
          <Alert className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
            <AlertDescription>
              <div className="space-y-3">
                <div className="font-bold text-blue-200 text-lg flex items-center gap-2">
                  🤖 How to Use AI Agents (ChatGPT/Claude/Grok)
                </div>

                <div className="text-sm text-gray-200 space-y-2">
                  <div className="bg-black/30 p-3 rounded-lg border border-blue-500/20">
                    <strong className="text-blue-300">Step 1: Prompt Your AI Agent (Any Language!)</strong>
                    <p className="mt-1 text-gray-300">Ask ChatGPT, Claude, or Grok to find trending topics in <strong>any language</strong>. For best results, ask for <strong>cross-platform trends</strong> (topics trending on Twitter, Reddit, TikTok simultaneously = higher quality & better engagement).</p>
                    <div className="mt-2 p-2 bg-black/50 rounded font-mono text-xs text-green-300 whitespace-pre-wrap">
                      Example Prompt (English):<br /><br />
                      "Find 3 topics that are currently trending across multiple platforms (Twitter, Reddit, TikTok).
                      Focus on: AI, consciousness, or technology.
                      Return ONLY a JSON array with this exact format:

                      [&#123;
                      "title": "Topic name here",
                      "summary": "2-3 sentence description",
                      "tags": ["tag1", "tag2", "tag3"]
                      &#125;]

                      Important: Return ONLY the JSON array, no extra text."
                    </div>
                    <p className="mt-2 text-purple-300 text-xs">
                      💡 You can ask in <strong>any language</strong> (French, Dutch, Spanish, German, etc.) - our AI will auto-detect and respond in the same language!
                    </p>
                    <p className="mt-1 text-orange-300 text-xs font-semibold">✨ Cross-platform trends = consistent quality output!</p>
                  </div>

                  <div className="bg-black/30 p-3 rounded-lg border border-blue-500/20">
                    <strong className="text-blue-300">Step 2: Copy the JSON Array</strong>
                    <p className="mt-1 text-gray-300">The AI will respond with a JSON array. Look for the part that looks like this:</p>
                    <div className="mt-2 p-2 bg-black/50 rounded font-mono text-xs text-green-300 whitespace-pre-wrap">
                      [&#123;
                      "title": "AI Breakthrough in Quantum Computing",
                      "summary": "Scientists achieve quantum supremacy with new AI algorithms...",
                      "tags": ["AI", "Quantum", "Technology"]
                      &#125;,
                      &#123;
                      "title": "Consciousness Studies Gain Mainstream Recognition",
                      "summary": "Universities now offering degrees in consciousness research...",
                      "tags": ["Consciousness", "Science", "Education"]
                      &#125;]
                    </div>
                    <p className="mt-2 text-yellow-300 text-xs font-semibold">⚠️ CRITICAL: Copy starting from the opening [ to closing ] - this complete array format is required!</p>
                  </div>

                  <div className="bg-black/30 p-3 rounded-lg border border-blue-500/20">
                    <strong className="text-blue-300">Step 3: Copy & Paste</strong>
                    <p className="mt-1 text-gray-300">Copy the JSON array from the AI's response and paste it in the text field below.</p>
                  </div>

                  <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-500/30">
                    <strong className="text-orange-300 text-base">💡 Pro Tips for Best Results:</strong>
                    <ul className="mt-2 text-gray-200 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">⚠️</span>
                        <div>
                          <strong className="text-orange-200">Start with MAX 3 items</strong> - Processing more than 3 items at once significantly increases the chance of errors and timeouts. You can always run multiple batches!
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <div>
                          <strong className="text-orange-200">Use cross-platform trends</strong> - Topics trending on Twitter + Reddit + TikTok simultaneously have proven to generate higher quality content with better consistency
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">📦</span>
                        <div>
                          <strong className="text-orange-200">Complete content packages</strong> - Each topic automatically generates: full blog post + optimized social media posts for all platforms + AI-generated image
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">🌍</span>
                        <div>
                          <strong className="text-orange-200">Multi-language support</strong> - Use Auto-detect (recommended) to generate content in French, Dutch, German, Spanish, or any other language based on your input
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Configuration - Language & Image Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(value: 'nl' | 'en' | 'auto') => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🌍 Auto-detect (Recommended)</SelectItem>
                  <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Auto-detect will match the language of your input (supports French, German, Spanish, etc.)
              </p>
            </div>

            <div>
              <Label htmlFor="imageStyle">Image Style (for all packages)</Label>
              <Select value={imageStyle} onValueChange={(value: 'photorealistic' | 'digital_art' | 'cosmic') => setImageStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealistic">📸 Photorealistic</SelectItem>
                  <SelectItem value="digital_art">🎨 Digital Art</SelectItem>
                  <SelectItem value="cosmic">🌌 Cosmic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Each package will get 3 diverse scenes in this style
              </p>
            </div>
          </div>

          {/* JSON Input */}
          <div>
            <Label htmlFor="jsonInput">Trend Data (JSON)</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your JSON array here... Format: [{"title": "...", "summary": "...", "tags": ["..."]}]'
              rows={10}
              className="font-mono text-sm bg-black/30 border-purple-500/30 text-white"
            />
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={parseSampleData}>
                Load Sample Data
              </Button>
              {parsedItemsCount > 0 && (
                <Badge variant="secondary" className="bg-green-600">
                  <FileText className="h-3 w-3 mr-1" />
                  ✓ {parsedItemsCount} items ready
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
                🚀 Generate Complete Packages ({parsedItemsCount} {parsedItemsCount === 1 ? 'item' : 'items'})
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

                      {/* Generated Images (Multi-Style) */}
                      {post.generatedImages && post.generatedImages.length > 0 && (
                        <div className="bg-pink-800/10 p-4 rounded-lg border border-pink-500/20">
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-pink-400" />
                            🎨 Generated Images ({post.generatedImages.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {post.generatedImages.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <div className="w-full h-40 bg-black/30 rounded-lg border border-pink-500/30 shadow-lg overflow-hidden flex items-center justify-center">
                                  <img
                                    src={image.url}
                                    alt={image.prompt || `Image ${imgIndex + 1} for ${post.title}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('Image failed to load:', image.url)
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                </div>
                                <Badge className="absolute top-2 right-2 bg-pink-500/20 text-pink-300 text-xs">
                                  {image.style.replace('_', ' ')}
                                </Badge>
                              </div>
                            ))}
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
