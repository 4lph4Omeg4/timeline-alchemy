import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TwitterOAuth, LinkedInOAuth, InstagramOAuth, YouTubeOAuth, DiscordOAuth, RedditOAuth, TelegramOAuth } from '@/lib/social-auth'
import { TokenManager } from '@/lib/token-manager'
import { withRetry, RetryManager } from '@/lib/retry-manager'

// Enhanced WordPress posting function
async function postToWordPress(content: string, title: string, siteUrl: string, username: string, password: string) {
  try {
    console.log('🚀 Starting WordPress post:', { title, siteUrl })
    
    // Clean up the site URL (remove trailing slash)
    const cleanSiteUrl = siteUrl.replace(/\/$/, '')
    
    // Check if it's a WordPress.com site
    const isWordPressCom = cleanSiteUrl.includes('.wordpress.com')
    
    console.log('🔍 WordPress site type:', isWordPressCom ? 'WordPress.com' : 'Self-hosted')
    
    // Prepare the post data with better formatting
    const postData = {
      title: title,
      content: content,
      status: 'publish',
      format: 'standard',
      // Add metadata to track posts from Timeline Alchemy
      meta: {
        timeline_alchemy: true,
        created_at: new Date().toISOString()
      }
    }
    
    // For WordPress.com, we might need different handling
    let apiUrl: string
    let headers: Record<string, string>
    
    if (isWordPressCom) {
      // WordPress.com uses different endpoints and might have stricter limitations
      apiUrl = `${cleanSiteUrl}/wp-json/wp/v2/posts`
      
      // WordPress.com might require different authentication
      headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'User-Agent': 'Timeline-Alchemy/1.0',
        'Accept': 'application/json'
      }
    } else {
      // Self-hosted WordPress
      apiUrl = `${cleanSiteUrl}/wp-json/wp/v2/posts`
      
      headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'User-Agent': 'Timeline-Alchemy/1.0',
        'Accept': 'application/json'
      }
    }
    
    console.log('📡 Making request to:', apiUrl)
    console.log('🔐 Using auth header length:', headers.Authorization.length)
    
    // Make the posting request with timeout
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData),
      timeout: 30000 // 30 second timeout
    } as any)

    console.log('📊 WordPress response status:', response.status)
    console.log('📊 WordPress response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorMessage = ''
      let errorDetails = ''
      
      try {
        const errorData = await response.json()
        errorDetails = JSON.stringify(errorData, null, 2)
        
        if (isWordPressCom) {
          errorMessage = `WordPress.com API error (${response.status}): ${errorData.message || response.statusText}`
          
          // Provide specific guidance for WordPress.com issues
          if (response.status === 403) {
            errorMessage += '. WordPress.com has limited REST API access for posting.'
          } else if (response.status === 401) {
            errorMessage += '. Please check your WordPress.com credentials and ensure REST API access is enabled.'
          }
        } else {
          errorMessage = `WordPress API error (${response.status}): ${errorData.message || response.statusText}`
          
          // Provide specific guidance for self-hosted WordPress issues
          if (response.status === 404) {
            errorMessage += '. Please ensure WordPress REST API is enabled on your site.'
          } else if (response.status === 403) {
            errorMessage += '. Please check your permissions and ensure you have posting rights.'
          } else if (response.status === 401) {
            errorMessage += '. Please check your WordPress credentials.'
          }
        }
      } catch (parseError) {
        errorMessage = `WordPress API error (${response.status}): ${response.statusText}. Could not parse error details.`
        errorDetails = 'Failed to parse error response'
      }
      
      console.error('❌ WordPress posting failed:', {
        status: response.status,
        statusText: response.statusText,
        errorDetails
      })
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('✅ WordPress post successful:', {
      postId: result.id,
      link: result.link,
      title: result.title?.rendered
    })
    
    return {
      success: true,
      postId: result.id,
      url: result.link,
      message: `Posted to WordPress: ${result.link}`,
      postTitle: result.title?.rendered || title
    }
  } catch (error) {
    console.error('💥 WordPress posting error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WordPress error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, platforms } = await request.json()
    
    if (!postId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID and platforms array are required' 
      })
    }

    const supabase = supabaseAdmin
    
    // Get the post data
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        organizations:org_id (
          id,
          name
        )
      `)
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post not found' 
      })
    }

    // Get social connections for the organization AND admin organization
    // Clients have connections in Admin Organization, but posts in their own org
    const { data: adminOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    const orgIds = [(post as any).org_id]
    if (adminOrg) {
      orgIds.push(adminOrg.id)
    }

    const { data: connections, error: connectionsError } = await supabase
      .from('social_connections')
      .select('*')
      .in('org_id', orgIds)

    if (connectionsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch social connections' 
      })
    }

    console.log('🔗 Found social connections:', {
      postOrgId: (post as any).org_id,
      adminOrgId: adminOrg?.id,
      connectionsCount: connections?.length || 0,
      platforms: connections?.map(c => c.platform) || []
    })

    const results = []
    const errors = []

    // Process each platform
    for (const platform of platforms) {
      try {
        const connection = connections?.find((conn: any) => conn.platform === platform)
        
        if (!connection) {
          errors.push({
            platform,
            error: `No connection found for ${platform}`
          })
          continue
        }

        let result = null

        // Post to specific platform
        switch (platform) {
          case 'twitter':
            result = await postToTwitter(post, connection)
            break
          case 'linkedin':
            result = await postToLinkedIn(post, connection)
            break
          case 'instagram':
            result = await postToInstagram(post, connection)
            break
          case 'youtube':
            result = await postToYouTube(post, connection)
            break
          case 'discord':
            result = await postToDiscord(post, connection)
            break
          case 'reddit':
            result = await postToReddit(post, connection)
            break
          case 'telegram':
            result = await postToTelegram(post, connection)
            break
          case 'wordpress':
            // WordPress requires special handling - get credentials from connection
            const wpCredentials = {
              siteUrl: (connection as any).site_url,
              username: (connection as any).username,
              password: (connection as any).password
            }
            
            // Use retry logic for WordPress posting
            const wpResult = await withRetry(async () => {
              return await postToWordPress((post as any).content, (post as any).title, wpCredentials.siteUrl, wpCredentials.username, wpCredentials.password)
            }, 'wordpress')
            
            if (!wpResult.success) {
              throw new Error(`WordPress posting failed after ${wpResult.attempts} attempts: ${wpResult.error}`)
            }
            
            result = wpResult.data
            break
          default:
            errors.push({
              platform,
              error: `Unsupported platform: ${platform}`
            })
            continue
        }

        if (result) {
          results.push({
            platform,
            success: true,
            result
          })
        }

      } catch (error) {
        errors.push({
          platform,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update post status
    const { error: updateError } = await (supabase as any)
      .from('blog_posts')
      .update({
        published_at: new Date().toISOString(),
        state: errors.length === 0 ? 'published' : 'scheduled'
      })
      .eq('id', postId)

    return NextResponse.json({
      success: true,
      results,
      errors,
      message: `Posted to ${results.length} platforms successfully`
    })

  } catch (error) {
    console.error('Posting engine error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Platform-specific posting functions
async function postToTwitter(post: any, connection: any) {
  const twitter = new TwitterOAuth()
  
  // Get social posts for Twitter
  let socialPosts = post.social_posts?.twitter || post.social_posts?.Twitter
  if (!socialPosts) {
    throw new Error('No Twitter content found')
  }

  // Remove image URL from Twitter posts to make them text-only
  const cleanText = socialPosts.replace(/🖼️ Image: https:\/\/[^\s]+/, '').trim()

  // Use retry logic for Twitter posting
  const result = await withRetry(async () => {
    // Get fresh token with automatic refresh
    const freshToken = await TokenManager.getFreshToken(
      connection.org_id, 
      'twitter', 
      connection.account_id
    )

    if (!freshToken) {
      throw new Error('Unable to get fresh Twitter token')
    }

    const tweetData: any = {
      text: cleanText
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Twitter API error: ${error.detail || error.message}`)
    }

    return await response.json()
  }, 'twitter')

  if (!result.success) {
    throw new Error(`Twitter posting failed after ${result.attempts} attempts: ${result.error}`)
  }

  return result.data
}

async function postToLinkedIn(post: any, connection: any) {
  const linkedin = new LinkedInOAuth()
  
  let socialPosts = post.social_posts?.linkedin || post.social_posts?.LinkedIn
  if (!socialPosts) {
    throw new Error('No LinkedIn content found')
  }

  // Extract image URL from the post content
  const imageUrlMatch = socialPosts.match(/🖼️ Image: (https:\/\/[^\s]+)/)
  let imageUrl = null
  let cleanText = socialPosts

  if (imageUrlMatch) {
    imageUrl = imageUrlMatch[1]
    cleanText = socialPosts.replace(/🖼️ Image: https:\/\/[^\s]+/, '').trim()
  }

  // Use retry logic for LinkedIn posting
  const result = await withRetry(async () => {
    // Get fresh token with automatic refresh
    const freshToken = await TokenManager.getFreshToken(
      connection.org_id, 
      'linkedin', 
      connection.account_id
    )

    if (!freshToken) {
      throw new Error('Unable to get fresh LinkedIn token')
    }

    let postData: any = {
      author: `urn:li:person:${connection.account_id.replace('linkedin_', '')}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: cleanText
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    // If there's an image, upload it first
    if (imageUrl) {
      try {
        // Download the image
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`)
        }
        
        const imageBuffer = await imageResponse.arrayBuffer()
        
        // Upload image to LinkedIn
        const uploadResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${freshToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: `urn:li:person:${connection.account_id.replace('linkedin_', '')}`,
              serviceRelationships: [{
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }]
            }
          })
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(`LinkedIn image upload failed: ${error.message || 'Unknown error'}`)
        }

        const uploadData = await uploadResponse.json()
        
        // Upload the actual image
        const imageUploadResponse = await fetch(uploadData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl, {
          method: 'POST',
          body: imageBuffer
        })

        if (!imageUploadResponse.ok) {
          throw new Error(`LinkedIn image upload failed: ${imageUploadResponse.statusText}`)
        }

        // Add image to post
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: 'Timeline Alchemy Content'
          },
          media: uploadData.value.asset,
          title: {
            text: 'Timeline Alchemy Post'
          }
        }]
      } catch (error) {
        console.error('LinkedIn image upload error:', error)
        // Continue without image if upload fails
      }
    }

    // LinkedIn's new API structure (2024+)
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LinkedIn API error: ${error.message}`)
    }

    return await response.json()
  }, 'linkedin')

  if (!result.success) {
    throw new Error(`LinkedIn posting failed after ${result.attempts} attempts: ${result.error}`)
  }

  return result.data
}

async function postToInstagram(post: any, connection: any) {
  const instagram = new InstagramOAuth()
  
  const socialPosts = post.social_posts?.instagram || post.social_posts?.Instagram
  if (!socialPosts) {
    throw new Error('No Instagram content found')
  }

  // Instagram requires media, so we'll post as a story or feed post
  const response = await fetch(`https://graph.facebook.com/v18.0/${connection.account_id}/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      caption: socialPosts,
      media_type: 'IMAGE' // Default to image, can be enhanced later
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Instagram API error: ${error.error?.message || error.message}`)
  }

  return await response.json()
}

async function postToYouTube(post: any, connection: any) {
  const youtube = new YouTubeOAuth()
  
  const socialPosts = post.social_posts?.youtube || post.social_posts?.YouTube
  if (!socialPosts) {
    throw new Error('No YouTube content found')
  }

  // YouTube requires video content, so we'll create a community post
  const response = await fetch('https://www.googleapis.com/youtube/v3/activities', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        description: socialPosts
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`YouTube API error: ${error.error?.message || error.message}`)
  }

  return await response.json()
}

async function postToDiscord(post: any, connection: any) {
  const discord = new DiscordOAuth()
  
  const socialPosts = post.social_posts?.discord || post.social_posts?.Discord
  if (!socialPosts) {
    throw new Error('No Discord content found')
  }

  // Get fresh token with automatic refresh
  const freshToken = await TokenManager.getFreshToken(
    connection.org_id, 
    'discord', 
    connection.account_id
  )

  if (!freshToken) {
    throw new Error('Unable to get fresh Discord token')
  }

  // Discord requires channel ID, we'll need to get this from the connection
  const channelId = connection.account_id // Assuming this is the channel ID
  
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${freshToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: socialPosts
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Discord API error: ${error.message}`)
  }

  return await response.json()
}

async function postToReddit(post: any, connection: any) {
  const reddit = new RedditOAuth()
  
  const socialPosts = post.social_posts?.reddit || post.social_posts?.Reddit
  if (!socialPosts) {
    throw new Error('No Reddit content found')
  }

  // Get fresh token with automatic refresh
  const freshToken = await TokenManager.getFreshToken(
    connection.org_id, 
    'reddit', 
    connection.account_id
  )

  if (!freshToken) {
    throw new Error('Unable to get fresh Reddit token')
  }

  // Reddit requires subreddit, we'll need to get this from the connection
  const subreddit = connection.account_id // Assuming this is the subreddit
  
  const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${freshToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      kind: 'self',
      title: socialPosts.substring(0, 300), // Reddit title limit
      text: socialPosts,
      sr: subreddit
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Reddit API error: ${error.error || error.message}`)
  }

  return await response.json()
}

async function postToTelegram(post: any, connection: any) {
  const telegram = new TelegramOAuth()
  
  const socialPosts = post.social_posts?.telegram || post.social_posts?.Telegram
  if (!socialPosts) {
    throw new Error('No Telegram content found')
  }

  // Get Telegram channels for this organization
  const supabase = supabaseAdmin
  const { data: channels } = await supabase
    .from('telegram_channels')
    .select('*')
    .eq('org_id', post.org_id)

  if (!channels || channels.length === 0) {
    throw new Error('No Telegram channels found')
  }

  const results = []
  
  // Post to all Telegram channels
  for (const channel of channels) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${(channel as any).bot_token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: (channel as any).channel_id,
          text: socialPosts,
          parse_mode: 'HTML'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Telegram API error: ${error.description}`)
      }

      results.push(await response.json())
    } catch (error) {
      console.error(`Telegram posting error for channel ${(channel as any).channel_name}:`, error)
    }
  }

  return results
}
