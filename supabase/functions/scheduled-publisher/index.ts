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
    console.log('🕐 Starting scheduled post check...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Get all posts that are scheduled for now or earlier
    const now = new Date().toISOString()
    
    const { data: scheduledPosts, error: postsError } = await supabaseClient
      .from('blog_posts')
      .select(`
        *,
        organizations:org_id (
          id,
          name
        )
      `)
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now)
      .neq('post_status', 'posted')
      .neq('post_status', 'failed')

    if (postsError) {
      console.error('❌ Error fetching scheduled posts:', postsError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch scheduled posts' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('✅ No posts scheduled for posting right now')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts scheduled for posting',
          count: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📝 Found ${scheduledPosts.length} posts ready for posting`)

    const results = []
    const errors = []

    // Process each scheduled post
    for (const post of scheduledPosts) {
      try {
        console.log(`🚀 Processing post: ${post.title} (ID: ${post.id})`)
        
        // Determine which platforms to post to
        const platforms = []
        
        // Check if post has social_posts data
        if (post.social_posts) {
          const socialPosts = post.social_posts
          
          // Add platforms that have content
          if (socialPosts.twitter || socialPosts.Twitter) platforms.push('twitter')
          if (socialPosts.linkedin || socialPosts.LinkedIn) platforms.push('linkedin')
          if (socialPosts.facebook || socialPosts.Facebook) platforms.push('facebook')
          if (socialPosts.instagram || socialPosts.Instagram) platforms.push('instagram')
          if (socialPosts.youtube || socialPosts.YouTube) platforms.push('youtube')
          if (socialPosts.discord || socialPosts.Discord) platforms.push('discord')
          if (socialPosts.reddit || socialPosts.Reddit) platforms.push('reddit')
          if (socialPosts.telegram || socialPosts.Telegram) platforms.push('telegram')
        }

        if (platforms.length === 0) {
          console.log(`⚠️ No platforms found for post: ${post.title}`)
          errors.push({
            postId: post.id,
            error: 'No platforms found for posting'
          })
          continue
        }

        console.log(`📱 Posting to platforms: ${platforms.join(', ')}`)

        // Call the posting engine
        const postingResponse = await fetch(`${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/api/post-to-platforms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            platforms: platforms
          })
        })

        if (!postingResponse.ok) {
          const error = await postingResponse.json()
          throw new Error(`Posting failed: ${error.error || error.message}`)
        }

        const postingResult = await postingResponse.json()
        
        if (postingResult.success) {
          console.log(`✅ Successfully posted: ${post.title}`)
          results.push({
            postId: post.id,
            title: post.title,
            platforms: platforms,
            results: postingResult.results,
            errors: postingResult.errors
          })
        } else {
          throw new Error(postingResult.error || 'Unknown posting error')
        }

      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
        errors.push({
          postId: post.id,
          title: post.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        // Update post status to failed
        await supabaseClient
          .from('blog_posts')
          .update({
            post_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', post.id)
      }
    }

    console.log(`🎉 Scheduled posting complete!`)
    console.log(`✅ Successful: ${results.length}`)
    console.log(`❌ Failed: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${scheduledPosts.length} scheduled posts`,
        results,
        errors,
        summary: {
          total: scheduledPosts.length,
          successful: results.length,
          failed: errors.length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Cron job error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})