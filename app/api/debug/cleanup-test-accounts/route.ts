import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Skip during build process
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped during build',
        timestamp: new Date().toISOString()
      })
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated',
        timestamp: new Date().toISOString()
      })
    }

    // Get user's organization ID
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMembers) {
      return NextResponse.json({ 
        success: false, 
        error: 'No organization found',
        timestamp: new Date().toISOString()
      })
    }

    const orgId = orgMembers.org_id

    // Delete Discord test account
    const { error: discordError } = await supabase
      .from('social_connections')
      .delete()
      .eq('org_id', orgId)
      .eq('platform', 'discord')
      .eq('account_id', 'test_discord_user_id')

    // Delete Reddit test account
    const { error: redditError } = await supabase
      .from('social_connections')
      .delete()
      .eq('org_id', orgId)
      .eq('platform', 'reddit')
      .eq('account_id', 'test_reddit_user_id')

    if (discordError) {
      console.error('Error deleting Discord test account:', discordError)
    }

    if (redditError) {
      console.error('Error deleting Reddit test account:', redditError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test accounts cleaned up successfully',
      deleted: {
        discord: !discordError,
        reddit: !redditError
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to cleanup test accounts',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
