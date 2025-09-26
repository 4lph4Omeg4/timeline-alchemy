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
  // Twitter API v2 implementation would go here
  console.log(`Publishing to Twitter: ${post.title}`)
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function publishToLinkedIn(accessToken: string, post: any) {
  // LinkedIn API implementation would go here
  console.log(`Publishing to LinkedIn: ${post.title}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function publishToInstagram(accessToken: string, post: any) {
  // Instagram API implementation would go here
  console.log(`Publishing to Instagram: ${post.title}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function publishToFacebook(accessToken: string, post: any) {
  // Facebook API implementation would go here
  console.log(`Publishing to Facebook: ${post.title}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function publishToYouTube(accessToken: string, post: any) {
  // YouTube API implementation would go here
  console.log(`Publishing to YouTube: ${post.title}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}
