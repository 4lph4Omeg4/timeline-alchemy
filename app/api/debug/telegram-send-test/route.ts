import { NextRequest, NextResponse } from 'next/server'

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

    // Test message to send
    const testMessage = `🚀 **Timeline Alchemy Test Bericht!**

Hallo! Dit is een test bericht van Timeline Alchemy.

✅ Bot werkt!
✅ Channel ID: 7912235930
✅ Bericht verzonden!

#TimelineAlchemy #Test`

    // Send message to your channel using environment bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Telegram bot token not configured',
        timestamp: new Date().toISOString()
      })
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: '7912235930',
        text: testMessage,
        parse_mode: 'HTML'
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.description || 'Failed to send message')
    }
    
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

export async function POST(request: NextRequest) {
  try {
    const { channel_id, bot_token } = await request.json()
    
    if (!channel_id || !bot_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Channel ID and bot token are required',
        timestamp: new Date().toISOString()
      })
    }

    // Test message to send
    const testMessage = `🚀 **Timeline Alchemy Test Bericht!**

Hallo! Dit is een test bericht van Timeline Alchemy.

✅ Bot werkt!
✅ Channel ID: ${channel_id}
✅ Bericht verzonden!

#TimelineAlchemy #Test`

    const response = await fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channel_id,
        text: testMessage,
        parse_mode: 'HTML'
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.description || 'Failed to send message')
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test message sent to Telegram channel!',
      result,
      channelId: channel_id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Telegram send test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test message',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
