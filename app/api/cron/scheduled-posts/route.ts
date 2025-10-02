import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Starting scheduled post check...')
    
    const supabase = createClient()
    
    // Get all posts that are scheduled for now or earlier
    const now = new Date().toISOString()
    
    const { data: scheduledPosts, error: postsError } = await supabase
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
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch scheduled posts' 
      })
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('✅ No posts scheduled for posting right now')
      return NextResponse.json({ 
        success: true, 
        message: 'No posts scheduled for posting',
        count: 0
      })
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
        const postingResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/post-to-platforms`, {
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
        await supabase
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

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledPosts.length} scheduled posts`,
      results,
      errors,
      summary: {
        total: scheduledPosts.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('💥 Cron job error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// This endpoint can be called manually for testing
export async function POST(request: NextRequest) {
  return GET(request)
}
