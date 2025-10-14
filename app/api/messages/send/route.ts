import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get user ID from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No auth header' 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { conversationId, content } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Conversation ID and content are required' 
      }, { status: 400 })
    }

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Conversation not found' 
      }, { status: 404 })
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - not part of this conversation' 
      }, { status: 403 })
    }

    // Create message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        read: false
      })
      .select()
      .single()

    if (messageError) {
      console.error('❌ Error creating message:', messageError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send message' 
      }, { status: 500 })
    }

    console.log('✅ Message sent:', message.id)

    return NextResponse.json({ 
      success: true, 
      message 
    })

  } catch (error) {
    console.error('❌ Error in send message API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

