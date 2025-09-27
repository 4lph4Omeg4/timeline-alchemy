import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Check all environment variables related to OAuth
  const envCheck = {
    // Twitter
    NEXT_PUBLIC_TWITTER_CLIENT_ID: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID ? 
      `${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT SET',
    
    // LinkedIn
    NEXT_PUBLIC_LINKEDIN_CLIENT_ID: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ? 
      `${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET',
    
    // App URL
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    
    // Other important vars
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  }

  return NextResponse.json({
    message: 'Environment Variables Debug',
    environment: envCheck,
    timestamp: new Date().toISOString(),
    requestUrl: request.url,
    headers: {
      host: request.headers.get('host'),
      'user-agent': request.headers.get('user-agent'),
    }
  })
}
