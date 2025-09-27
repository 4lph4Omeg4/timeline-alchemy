import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const debugInfo = {
    hasClientId: !!process.env.TWITTER_CLIENT_ID,
    hasClientSecret: !!process.env.TWITTER_CLIENT_SECRET,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    clientIdPrefix: process.env.TWITTER_CLIENT_ID?.substring(0, 10) + '...',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(debugInfo, { 
    headers: {
      'Cache-Control': 'no-store',
    }
  })
}
