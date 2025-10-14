import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get all conversations for this user
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at,
        updated_at
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (conversationsError) {
      console.error('❌ Error fetching conversations:', conversationsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch conversations' 
      }, { status: 500 })
    }

    // For each conversation, get the other user's info and latest message
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id

        // Get other user's profile
        const { data: otherUser } = await supabaseAdmin.auth.admin.getUserById(otherUserId)

        // Get latest message
        const { data: latestMessage } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', user.id)

        return {
          ...conv,
          otherUser: {
            id: otherUser?.user?.id,
            email: otherUser?.user?.email,
            name: otherUser?.user?.user_metadata?.name || otherUser?.user?.email?.split('@')[0],
            avatar_url: otherUser?.user?.user_metadata?.avatar_url
          },
          latestMessage: latestMessage || null,
          unreadCount: unreadCount || 0
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      conversations: enrichedConversations 
    })

  } catch (error) {
    console.error('❌ Error in conversations API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Create or get conversation with another user
export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Other user ID is required' 
      }, { status: 400 })
    }

    // Ensure user1_id < user2_id for consistency
    const [user1Id, user2Id] = [user.id, otherUserId].sort()

    // Check if conversation already exists
    const { data: existingConv, error: checkError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .single()

    if (existingConv) {
      return NextResponse.json({ 
        success: true, 
        conversation: existingConv 
      })
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating conversation:', createError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create conversation' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      conversation: newConv 
    })

  } catch (error) {
    console.error('❌ Error in create conversation API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

