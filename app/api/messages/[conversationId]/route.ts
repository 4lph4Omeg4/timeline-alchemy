import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
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

    const conversationId = params.conversationId

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

    // Cast conversation to any for type safety
    const conv = conversation as any

    if (conv.user1_id !== user.id && conv.user2_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 403 })
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch messages' 
      }, { status: 500 })
    }

    // Mark all unread messages from the other user as read
    const { error: markReadError } = await (supabaseAdmin as any)
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('read', false)
      .neq('sender_id', user.id)

    if (markReadError) {
      console.error('⚠️ Error marking messages as read:', markReadError)
    }

    // Get other user's info
    const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
    const { data: otherUser } = await supabaseAdmin.auth.admin.getUserById(otherUserId)

    return NextResponse.json({ 
      success: true, 
      messages,
      otherUser: {
        id: otherUser?.user?.id,
        email: otherUser?.user?.email,
        name: otherUser?.user?.user_metadata?.name || otherUser?.user?.email?.split('@')[0],
        avatar_url: otherUser?.user?.user_metadata?.avatar_url
      }
    })

  } catch (error) {
    console.error('❌ Error in messages API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

