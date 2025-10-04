import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Skip during build process
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped during build',
        timestamp: new Date().toISOString()
      })
    }

    // Delete Discord test account
    const { error: discordError } = await supabase
      .from('social_connections')
      .delete()
      .eq('platform', 'discord')
      .eq('account_id', 'test_discord_user_id')

    // Delete Reddit test account
    const { error: redditError } = await supabase
      .from('social_connections')
      .delete()
      .eq('platform', 'reddit')
      .eq('account_id', 'test_reddit_user_id')

    return NextResponse.json({ 
      success: true, 
      message: 'Test accounts cleaned up successfully',
      deleted: {
        discord: !discordError,
        reddit: !redditError
      },
      errors: {
        discord: discordError?.message,
        reddit: redditError?.message
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
