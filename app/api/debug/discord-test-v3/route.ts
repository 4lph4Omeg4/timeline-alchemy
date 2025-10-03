import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Skip test during build process or in production
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped during build/production',
        timestamp: new Date().toISOString()
      })
    }

    // Test if we can insert a Discord connection (with ALL required columns)
    const testData = {
      org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91', // Your org ID from the logs
      platform: 'discord',
      access_token: 'test_token',
      refresh_token: 'test_refresh_token',
      account_id: 'test_discord_user_id',
      account_name: 'Test Discord Account',
    }

    console.log('Testing Discord insert with data:', testData)

    const { data, error } = await (supabaseAdmin as any)
      .from('social_connections')
      .insert(testData)

    if (error) {
      console.error('Discord insert error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        testData,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Discord connection test successful',
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
