import { NextRequest, NextResponse } from 'next/server'
import { TelegramOAuth } from '@/lib/social-auth'

export async function GET(request: NextRequest) {
  try {
    const telegramOAuth = new TelegramOAuth()
    
    // Test message to send
    const testMessage = `🚀 **Timeline Alchemy Test Bericht!**

Hallo! Dit is een test bericht van Timeline Alchemy.

✅ Bot werkt!
✅ Channel ID: 7912235930
✅ Bericht verzonden!

#TimelineAlchemy #Test`

    // Send message to your channel
    const result = await telegramOAuth.sendMessage(
      '7912235930', // Your channel ID
      testMessage
    )
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test message sent to Telegram channel!',
      result,
      channelId: '7912235930',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Telegram send test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test message',
      details: error instanceof Error ? error.message : 'Unknown error',
      channelId: '7912235930',
      timestamp: new Date().toISOString()
    })
  }
}
