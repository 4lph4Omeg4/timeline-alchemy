import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get all scheduled posts that are ready to be published
    const now = new Date().toISOString()
    
    const { data: scheduledPosts, error: postsError } = await supabaseClient
      .from('blog_posts')
      .select(`
        *,
        organizations (
          social_connections (*)
        )
      `)
      .eq('state', 'scheduled')
      .lte('scheduled_for', now)

    if (postsError) {
      throw postsError
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to publish' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []

    for (const post of scheduledPosts) {
      try {
        // Update post status to published
        const { error: updateError } = await supabaseClient
          .from('blog_posts')
          .update({
            state: 'published',
            published_at: now,
          })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
          continue
        }

        // Publish to social platforms
        const socialConnections = post.organizations?.social_connections || []
        
        for (const connection of socialConnections) {
          try {
            await publishToSocialPlatform(connection, post)
            results.push({
              postId: post.id,
              platform: connection.platform,
              status: 'success'
            })
          } catch (error) {
            console.error(`Error publishing to ${connection.platform}:`, error)
            results.push({
              postId: post.id,
              platform: connection.platform,
              status: 'error',
              error: error.message
            })
          }
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)
        results.push({
          postId: post.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Publishing completed',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in scheduled publisher:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function publishToSocialPlatform(connection: any, post: any) {
  const { platform, access_token } = connection
  
  // This is a simplified implementation
  // In a real app, you'd integrate with each platform's API
  
  switch (platform) {
    case 'twitter':
      await publishToTwitter(access_token, post)
      break
    case 'linkedin':
      await publishToLinkedIn(access_token, post)
      break
    case 'instagram':
      await publishToInstagram(access_token, post)
      break
    case 'facebook':
      await publishToFacebook(access_token, post)
      break
    case 'youtube':
      await publishToYouTube(access_token, post)
      break
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

async function publishToTwitter(accessToken: string, post: any) {
  try {
    // Twitter API v2 implementation
    console.log(`Publishing to Twitter: ${post.title}`)
    
    // Prepare tweet content (Twitter has a 280 character limit)
    const hashtags = '#tmline_alchemy #sh4m4ni4k'
    const hashtagLength = hashtags.length + 1 // +1 for space
    
    let tweetText = post.title
    
    // Add content if there's space (reserve space for hashtags)
    const maxContentLength = 280 - hashtagLength - tweetText.length - 2 // -2 for \n\n
    if (post.content && post.content.length <= maxContentLength) {
      tweetText += `\n\n${post.content}`
    } else if (post.content) {
      // Truncate content if too long
      tweetText += `\n\n${post.content.substring(0, maxContentLength - 3)}...`
    }
    
    // Add hashtags
    tweetText += `\n\n${hashtags}`
    
    // Create tweet
    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: tweetText
      }),
    })
    
    if (!tweetResponse.ok) {
      const errorData = await tweetResponse.text()
      console.error('Twitter API error:', errorData)
      throw new Error(`Twitter API error: ${tweetResponse.status}`)
    }
    
    const tweetData = await tweetResponse.json()
    console.log('Tweet published successfully:', tweetData.data.id)
    
    return {
      success: true,
      tweetId: tweetData.data.id,
      url: `https://twitter.com/user/status/${tweetData.data.id}`
    }
    
  } catch (error) {
    console.error('Error publishing to Twitter:', error)
    throw error
  }
}

async function publishToLinkedIn(accessToken: string, post: any) {
  try {
    // LinkedIn API implementation
  console.log(`Publishing to LinkedIn: ${post.title}`)
    
    // Prepare LinkedIn post content (LinkedIn has ~3000 character limit)
    const hashtags = '#TimelineAlchemy #sh4m4ni4k'
    const hashtagLength = hashtags.length + 1 // +1 for space
    
    let linkedInText = post.title
    
    // Add content if there's space (reserve space for hashtags)
    const maxContentLength = 3000 - hashtagLength - linkedInText.length - 2 // -2 for \n\n
    if (post.content && post.content.length <= maxContentLength) {
      linkedInText += `\n\n${post.content}`
    } else if (post.content) {
      // Truncate content if too long
      linkedInText += `\n\n${post.content.substring(0, maxContentLength - 3)}...`
    }
    
    // Add hashtags
    linkedInText += `\n\n${hashtags}`
    
    const linkedinText = {
      text: linkedInText
    }
    
    // Create LinkedIn post
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: 'urn:li:person:' + await getLinkedInUserId(accessToken),
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: linkedinText,
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }),
    })
    
    if (!postResponse.ok) {
      const errorData = await postResponse.text()
      console.error('LinkedIn API error:', errorData)
      throw new Error(`LinkedIn API error: ${postResponse.status}`)
    }
    
    const postData = await postResponse.json()
    console.log('LinkedIn post published successfully:', postData.id)
    
    return {
      success: true,
      postId: postData.id,
      url: `https://linkedin.com/feed/update/${postData.id}`
    }
    
  } catch (error) {
    console.error('Error publishing to LinkedIn:', error)
    throw error
  }
}

async function getLinkedInUserId(accessToken: string): Promise<string> {
  const userResponse = await fetch('https://api.linkedin.com/v2/people/~', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  
  if (!userResponse.ok) {
    throw new Error('Failed to get LinkedIn user ID')
  }
  
  const userData = await userResponse.json()
  return userData.id
}

async function publishToInstagram(accessToken: string, post: any) {
  try {
    console.log(`Publishing to Instagram: ${post.title}`)
    
    // Instagram Graph API implementation for posting content
    const hashtags = '#TimelineAlchemy #sh4m4ni4k'
    const instagramContent = `${post.title}\n\n${post.content || ''}\n\n${hashtags}`
    
    // Get Instagram Business Account ID (this would be stored during OAuth)
    // For now, we'll use a placeholder - in real implementation, this would be stored in the database
    
    // Create Instagram media container
    const mediaResponse = await fetch(`https://graph.instagram.com/v18.0/me/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image_url: 'https://via.placeholder.com/1080x1080/000000/FFFFFF?text=Timeline+Alchemy', // Placeholder image
        caption: instagramContent,
        access_token: accessToken,
      }),
    })

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text()
      console.error('Instagram media creation failed:', errorData)
      throw new Error(`Instagram media creation failed: ${mediaResponse.status}`)
    }

    const mediaData = await mediaResponse.json()
    const mediaId = mediaData.id

    // Publish the media
    const publishResponse = await fetch(`https://graph.instagram.com/v18.0/${mediaId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        creation_id: mediaId,
        access_token: accessToken,
      }),
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text()
      console.error('Instagram publish failed:', errorData)
      throw new Error(`Instagram publish failed: ${publishResponse.status}`)
    }

    const publishData = await publishResponse.json()
    console.log('Instagram post published successfully:', publishData.id)
    
    return {
      success: true,
      postId: publishData.id,
      url: `https://www.instagram.com/p/${publishData.id}/`,
      content: instagramContent
    }
    
  } catch (error) {
    console.error('Instagram publishing error:', error)
    throw error
  }
}

async function publishToFacebook(accessToken: string, post: any) {
  try {
    console.log(`Publishing to Facebook: ${post.title}`)
    
    // Facebook Graph API implementation for posting content
    const hashtags = '#TimelineAlchemy #sh4m4ni4k'
    const facebookContent = `${post.title}\n\n${post.content || ''}\n\n${hashtags}`
    
    // Get user's pages (Facebook Pages API)
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
    
    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.text()
      console.error('Failed to get Facebook pages:', errorData)
      throw new Error(`Failed to get Facebook pages: ${pagesResponse.status}`)
    }
    
    const pagesData = await pagesResponse.json()
    const pages = pagesData.data
    
    if (!pages || pages.length === 0) {
      throw new Error('No Facebook pages found for this user')
    }
    
    // Use the first page (you can modify this to select a specific page)
    const page = pages[0]
    const pageAccessToken = page.access_token
    const pageId = page.id
    
    // Post to Facebook Page
    const postResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        message: facebookContent,
        access_token: pageAccessToken,
      }),
    })

    if (!postResponse.ok) {
      const errorData = await postResponse.text()
      console.error('Facebook post failed:', errorData)
      throw new Error(`Facebook post failed: ${postResponse.status}`)
    }

    const postData = await postResponse.json()
    console.log('Facebook post published successfully:', postData.id)
    
    return {
      success: true,
      postId: postData.id,
      url: `https://www.facebook.com/${pageId}/posts/${postData.id}`,
      content: facebookContent
    }
    
  } catch (error) {
    console.error('Facebook publishing error:', error)
    throw error
  }
}

async function publishToYouTube(accessToken: string, post: any) {
  // YouTube API implementation would go here
  console.log(`Publishing to YouTube: ${post.title}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}
