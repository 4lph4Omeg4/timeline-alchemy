import { NextRequest, NextResponse } from 'next/server'
import { TelegramOAuth } from '@/lib/social-auth'

export async function GET(request: NextRequest) {
  try {
    const telegramOAuth = new TelegramOAuth()
    
    // Test bot info
    const botInfo = await telegramOAuth.getBotInfo()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Telegram bot is working!',
      botInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Telegram bot test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Telegram bot test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
