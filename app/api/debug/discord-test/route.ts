import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Skip during build process or in production
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped during build/production',
        timestamp: new Date().toISOString()
      })
    }

    // Test if we can insert a Discord connection
    const testData = {
      org_id: 'e6c0db74-03ee-4bb3-b08d-d94512efab91', // Your org ID from the logs
      platform: 'discord',
      access_token: 'test_token',
      platform_user_id: 'test_user_id',
      platform_username: 'test_username',
    }

    const { data, error } = await supabase
      .from('social_connections')
      .insert(testData)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        testData 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Discord connection test successful',
      data 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
